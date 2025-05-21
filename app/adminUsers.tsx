import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Switch,
} from 'react-native';
import { useTheme } from '@/context/ThemeProvider';
import { supabase } from '@/lib/supabase';
import Typography from '@/components/Typography';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash,
  ChevronRight,
  X,
  Filter,
  UserPlus,
  Shield,
  User,
} from 'lucide-react-native';

// Define the User type based on the database schema
interface UserItem {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
  role: 'user' | 'admin';
  level?: number;
  xp?: number;
}

/**
 * Admin User Management Screen
 * Allows administrators to view, add, edit, and manage user roles
 */
export default function AdminUsers() {
  const { colors, isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userList, setUserList] = useState<UserItem[]>([]);
  const [addUserModalVisible, setAddUserModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserItem | null>(null);
  const pageSize = 20;

  // Fetch user list from Supabase
  const fetchUserList = useCallback(async (page = 0, refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
      setCurrentPage(0);
      page = 0;
    } else if (!refresh && page === 0) {
      setIsLoading(true);
    }

    try {
      let query = supabase
        .from('users')
        .select('*')
        .order('username')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      // Apply search filter if provided
      if (searchQuery) {
        query = query.ilike('username', `%${searchQuery}%`);
      }

      // Apply role filter if selected
      if (selectedRole) {
        query = query.eq('role', selectedRole);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      if (data) {
        if (refresh || page === 0) {
          setUserList(data);
        } else {
          setUserList(prevList => [...prevList, ...data]);
        }
        
        // Check if we've reached the end of the data
        setHasMoreData(data.length === pageSize);
      }
    } catch (error) {
      console.error('Error in fetchUserList:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, selectedRole, pageSize]);

  // Load more users when reaching the end of the list
  const loadMoreUsers = () => {
    if (hasMoreData && !isLoading && !isRefreshing) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchUserList(nextPage);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchUserList(0, true);
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(0);
    fetchUserList(0);
  };

  // Handle filter selection
  const handleFilterSelect = (role: string | null) => {
    setSelectedRole(role);
    setFilterModalVisible(false);
    setCurrentPage(0);
    fetchUserList(0);
  };

  // Delete user
  const handleDeleteUser = (userId: string, username: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete user "${username}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              // Note: This will cascade delete due to the foreign key constraint
              const { error } = await supabase.auth.admin.deleteUser(userId);

              if (error) {
                console.error('Error deleting user:', error);
                Alert.alert('Error', 'Failed to delete user. Please try again.');
                return;
              }

              // Refresh the list
              fetchUserList(0, true);
              Alert.alert('Success', `User "${username}" has been deleted.`);
            } catch (error) {
              console.error('Error in handleDeleteUser:', error);
              Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Open edit modal
  const handleEditUser = (user: UserItem) => {
    setCurrentUser(user);
    setEditModalVisible(true);
  };

  // Update user role
  const handleRoleToggle = async (isAdmin: boolean) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: isAdmin ? 'admin' : 'user' })
        .eq('id', currentUser.id);

      if (error) {
        console.error('Error updating user role:', error);
        Alert.alert('Error', 'Failed to update user role. Please try again.');
        return;
      }

      // Update local state
      setCurrentUser({
        ...currentUser,
        role: isAdmin ? 'admin' : 'user'
      });

      // Refresh the list
      fetchUserList(0, true);
    } catch (error) {
      console.error('Error in handleRoleToggle:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  // Save user changes
  const handleSaveUser = async () => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: currentUser.username,
          bio: currentUser.bio,
          role: currentUser.role
        })
        .eq('id', currentUser.id);

      if (error) {
        console.error('Error updating user:', error);
        Alert.alert('Error', 'Failed to update user. Please try again.');
        return;
      }

      setEditModalVisible(false);
      // Refresh the list
      fetchUserList(0, true);
      Alert.alert('Success', `User "${currentUser.username}" has been updated.`);
    } catch (error) {
      console.error('Error in handleSaveUser:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUserList();
  }, []);

  // Render user item
  const renderUserItem = ({ item }: { item: UserItem }) => (
    <View style={[styles.userItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.userInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Typography variant="h3" numberOfLines={1}>
            {item.username}
          </Typography>
          {item.role === 'admin' && (
            <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: `${colors.primary}20` 
              }}>
              <Shield size={12} color={colors.primary} />
              <Typography variant="caption" color={colors.primary} style={{ marginLeft: 4 }}>
                Admin
              </Typography>
            </View>
          )}
        </View>
        
        <View style={styles.userDetails}>
          <Typography variant="bodySmall" color={colors.textSecondary} style={styles.detailItem}>
            ID: {item.id.substring(0, 8)}...
          </Typography>
          
          {item.level !== undefined && (
            <Typography variant="bodySmall" color={colors.textSecondary} style={styles.detailItem}>
              Level: {item.level}
            </Typography>
          )}
          
          {item.created_at && (
            <Typography variant="bodySmall" color={colors.textSecondary} style={styles.detailItem}>
              Joined: {new Date(item.created_at).toLocaleDateString()}
            </Typography>
          )}
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: `${colors.primary}20` }]}
          onPress={() => handleEditUser(item)}
        >
          <Edit size={18} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: `${colors.error}20` }]}
          onPress={() => handleDeleteUser(item.id, item.username)}
        >
          <Trash size={18} color={colors.error} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: `${colors.info}20` }]}
          onPress={() => {/* Navigate to user details */}}
        >
          <ChevronRight size={18} color={colors.info} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Filter modal component
  const FilterModal = () => (
    <Modal
      visible={filterModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Typography variant="h2">Filter by Role</Typography>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.roleList}>
            <TouchableOpacity
              style={[
                styles.roleItem,
                !selectedRole && { backgroundColor: `${colors.primary}20` }
              ]}
              onPress={() => handleFilterSelect(null)}
            >
              <Typography
                variant="body"
                color={!selectedRole ? colors.primary : colors.text}
              >
                All Users
              </Typography>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.roleItem,
                selectedRole === 'user' && { backgroundColor: `${colors.primary}20` }
              ]}
              onPress={() => handleFilterSelect('user')}
            >
              <User size={18} color={selectedRole === 'user' ? colors.primary : colors.text} style={{ marginRight: 8 }} />
              <Typography
                variant="body"
                color={selectedRole === 'user' ? colors.primary : colors.text}
              >
                Regular Users
              </Typography>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.roleItem,
                selectedRole === 'admin' && { backgroundColor: `${colors.primary}20` }
              ]}
              onPress={() => handleFilterSelect('admin')}
            >
              <Shield size={18} color={selectedRole === 'admin' ? colors.primary : colors.text} style={{ marginRight: 8 }} />
              <Typography
                variant="body"
                color={selectedRole === 'admin' ? colors.primary : colors.text}
              >
                Administrators
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Edit user modal component
  const EditUserModal = () => (
    <Modal
      visible={editModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setEditModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.editModalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Typography variant="h2">Edit User</Typography>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          {currentUser && (
            <View style={styles.editForm}>
              <View style={styles.formField}>
                <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
                  Username
                </Typography>
                <TextInput
                  style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                  value={currentUser.username}
                  onChangeText={(text) => setCurrentUser({ ...currentUser, username: text })}
                  placeholder="Username"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <View style={styles.formField}>
                <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
                  Bio
                </Typography>
                <TextInput
                  style={[styles.textInput, styles.textArea, { color: colors.text, borderColor: colors.border }]}
                  value={currentUser.bio || ''}
                  onChangeText={(text) => setCurrentUser({ ...currentUser, bio: text })}
                  placeholder="User bio"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              </View>
              
              <View style={styles.formField}>
                <View style={styles.switchContainer}>
                  <View style={styles.switchLabel}>
                    <Shield size={18} color={colors.primary} style={{ marginRight: 8 }} />
                    <Typography variant="body">Admin Privileges</Typography>
                  </View>
                  <Switch
                    value={currentUser.role === 'admin'}
                    onValueChange={handleRoleToggle}
                    trackColor={{ false: colors.inactive, true: `${colors.primary}80` }}
                    thumbColor={currentUser.role === 'admin' ? colors.primary : colors.textSecondary}
                  />
                </View>
                <Typography variant="caption" color={colors.textSecondary} style={styles.switchDescription}>
                  Admins have full access to the admin panel and can manage all content.
                </Typography>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Typography variant="button" color={colors.text}>
                    Cancel
                  </Typography>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                  onPress={handleSaveUser}
                >
                  <Typography variant="button" color="#FFFFFF">
                    Save Changes
                  </Typography>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, padding: 16 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Users size={24} color={colors.info} style={{ marginRight: 12 }} />
          <Typography variant="h2">User Management</Typography>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setAddUserModalVisible(true)}
        >
          <UserPlus size={18} color={colors.card} />
          <Typography variant="bodySmall" style={{ color: colors.card, marginLeft: 6 }}>Add User</Typography>
        </TouchableOpacity>
      </View>
      
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search users..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.card }]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Filter size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      {/* User List */}
      {isLoading && userList.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Typography variant="body" style={{ marginTop: 16 }}>
            Loading users...
          </Typography>
        </View>
      ) : (
        <FlatList
          data={userList}
          renderItem={renderUserItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          onEndReached={loadMoreUsers}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMoreData && userList.length > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
              <Typography variant="h3" style={{ marginTop: 16, textAlign: 'center' }}>
                No users found
              </Typography>
              <Typography variant="body" color={colors.textSecondary} style={{ textAlign: 'center', marginTop: 8 }}>
                {searchQuery || selectedRole
                  ? 'Try changing your search or filter criteria'
                  : 'Add your first user to get started'}
              </Typography>
            </View>
          }
        />
      )}
      
      {/* Modals */}
      <FilterModal />
      <EditUserModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  filterButton: {
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  userInfo: {
    flex: 1,
  },
  userDetails: {
    marginTop: 8,
  },
  detailItem: {
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 16,
  },
  editModalContent: {
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleList: {
    maxHeight: 300,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  editForm: {
    width: '100%',
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchDescription: {
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    marginRight: 8,
  },
  saveButton: {
    // Background color set in component
  },
});
