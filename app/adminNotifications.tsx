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
  ScrollView,
} from 'react-native';
import { useTheme } from '@/context/ThemeProvider';
import { supabase } from '@/lib/supabase';
import Typography from '@/components/Typography';
import {
  Bell,
  Plus,
  Search,
  Edit,
  Trash,
  X,
  Filter,
  Send,
  Users,
  Calendar,
  Clock,
  Check,
  AlertCircle,
  BellRing,
  Globe,
  User,
} from 'lucide-react-native';

// Define the Notification type based on the database schema
interface NotificationItem {
  id: string;
  user_id: string | null;
  type: string;
  content: string;
  read: boolean;
  created_at: string;
}

// Define the User type for targeting
interface UserItem {
  id: string;
  username: string;
}

/**
 * Admin Notifications Management Screen
 * Allows administrators to create, manage, and send notifications to users
 */
export default function AdminNotifications() {
  const { colors, isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notificationList, setNotificationList] = useState<NotificationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [userList, setUserList] = useState<UserItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const pageSize = 20;

  // New notification state
  const [newNotification, setNewNotification] = useState({
    type: 'announcement',
    content: '',
    isGlobal: true,
    selectedUserId: '',
  });

  // Notification types
  const notificationTypes = [
    { id: 'announcement', label: 'Announcement', icon: BellRing },
    { id: 'update', label: 'App Update', icon: Globe },
    { id: 'content', label: 'New Content', icon: Film },
    { id: 'alert', label: 'Alert', icon: AlertCircle },
  ];

  // Fetch notification list from Supabase
  const fetchNotificationList = useCallback(async (page = 0, refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
      setCurrentPage(0);
      page = 0;
    } else if (!refresh && page === 0) {
      setIsLoading(true);
    }

    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      // Apply search filter if provided
      if (searchQuery) {
        query = query.ilike('content', `%${searchQuery}%`);
      }

      // Apply type filter if selected
      if (selectedType) {
        query = query.eq('type', selectedType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      if (data) {
        if (refresh || page === 0) {
          setNotificationList(data);
        } else {
          setNotificationList(prevList => [...prevList, ...data]);
        }
        
        // Check if we've reached the end of the data
        setHasMoreData(data.length === pageSize);
      }
    } catch (error) {
      console.error('Error in fetchNotificationList:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, selectedType, pageSize]);

  // Fetch users for targeting
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username')
        .order('username');

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      if (data) {
        setUserList(data);
      }
    } catch (error) {
      console.error('Error in fetchUsers:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Load more notifications when reaching the end of the list
  const loadMoreNotifications = () => {
    if (hasMoreData && !isLoading && !isRefreshing) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchNotificationList(nextPage);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchNotificationList(0, true);
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(0);
    fetchNotificationList(0);
  };

  // Handle filter selection
  const handleFilterSelect = (type: string | null) => {
    setSelectedType(type);
    setFilterModalVisible(false);
    setCurrentPage(0);
    fetchNotificationList(0);
  };

  // Delete notification
  const handleDeleteNotification = (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

              if (error) {
                console.error('Error deleting notification:', error);
                Alert.alert('Error', 'Failed to delete notification. Please try again.');
                return;
              }

              // Refresh the list
              fetchNotificationList(0, true);
              Alert.alert('Success', 'Notification has been deleted.');
            } catch (error) {
              console.error('Error in handleDeleteNotification:', error);
              Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Create notification
  const handleCreateNotification = async () => {
    if (!newNotification.content.trim()) {
      Alert.alert('Error', 'Please enter notification content.');
      return;
    }

    try {
      const notificationData = {
        type: newNotification.type,
        content: newNotification.content.trim(),
        user_id: newNotification.isGlobal ? null : newNotification.selectedUserId || null,
        read: false,
      };

      const { error } = await supabase
        .from('notifications')
        .insert([notificationData]);

      if (error) {
        console.error('Error creating notification:', error);
        Alert.alert('Error', 'Failed to create notification. Please try again.');
        return;
      }

      // Reset form and close modal
      setNewNotification({
        type: 'announcement',
        content: '',
        isGlobal: true,
        selectedUserId: '',
      });
      setCreateModalVisible(false);

      // Refresh the list
      fetchNotificationList(0, true);
      Alert.alert('Success', 'Notification has been created and sent.');
    } catch (error) {
      console.error('Error in handleCreateNotification:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  // Open create modal
  const handleOpenCreateModal = () => {
    fetchUsers();
    setCreateModalVisible(true);
  };

  // Initial data fetch
  useEffect(() => {
    fetchNotificationList();
  }, []);

  // Get user name by ID
  const getUsernameById = (userId: string | null) => {
    if (!userId) return 'All Users (Global)';
    const user = userList.find(u => u.id === userId);
    return user ? user.username : 'Unknown User';
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Render notification item
  const renderNotificationItem = ({ item }: { item: NotificationItem }) => (
    <View style={[styles.notificationItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.notificationHeader}>
        <View style={styles.notificationTypeContainer}>
          {item.type === 'announcement' && <BellRing size={18} color={colors.primary} />}
          {item.type === 'update' && <Globe size={18} color={colors.info} />}
          {item.type === 'content' && <Film size={18} color={colors.success} />}
          {item.type === 'alert' && <AlertCircle size={18} color={colors.warning} />}
          <Typography variant="bodySmall" style={styles.notificationType}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Typography>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${colors.error}20` }]}
            onPress={() => handleDeleteNotification(item.id)}
          >
            <Trash size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      
      <Typography variant="body" style={styles.notificationContent}>
        {item.content}
      </Typography>
      
      <View style={styles.notificationFooter}>
        <View style={styles.targetContainer}>
          <User size={14} color={colors.textSecondary} />
          <Typography variant="caption" color={colors.textSecondary} style={styles.targetText}>
            {getUsernameById(item.user_id)}
          </Typography>
        </View>
        
        <Typography variant="caption" color={colors.textSecondary}>
          {formatDate(item.created_at)}
        </Typography>
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
            <Typography variant="h2">Filter by Type</Typography>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterList}>
            <TouchableOpacity
              style={[
                styles.filterItem,
                !selectedType && { backgroundColor: `${colors.primary}20` }
              ]}
              onPress={() => handleFilterSelect(null)}
            >
              <Typography
                variant="body"
                color={!selectedType ? colors.primary : colors.text}
              >
                All Notifications
              </Typography>
            </TouchableOpacity>
            
            {notificationTypes.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.filterItem,
                  selectedType === type.id && { backgroundColor: `${colors.primary}20` }
                ]}
                onPress={() => handleFilterSelect(type.id)}
              >
                <type.icon 
                  size={18} 
                  color={selectedType === type.id ? colors.primary : colors.text} 
                  style={{ marginRight: 8 }} 
                />
                <Typography
                  variant="body"
                  color={selectedType === type.id ? colors.primary : colors.text}
                >
                  {type.label}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  // Create notification modal
  const CreateNotificationModal = () => (
    <Modal
      visible={createModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setCreateModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.createModalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Typography variant="h2">Create Notification</Typography>
            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.createForm}>
            {/* Notification Type */}
            <View style={styles.formField}>
              <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
                Notification Type
              </Typography>
              <View style={styles.typeOptions}>
                {notificationTypes.map(type => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeOption,
                      newNotification.type === type.id && { 
                        backgroundColor: `${colors.primary}20`,
                        borderColor: colors.primary
                      },
                      { borderColor: colors.border }
                    ]}
                    onPress={() => setNewNotification({...newNotification, type: type.id})}
                  >
                    <type.icon 
                      size={18} 
                      color={newNotification.type === type.id ? colors.primary : colors.text} 
                    />
                    <Typography
                      variant="bodySmall"
                      style={styles.typeLabel}
                      color={newNotification.type === type.id ? colors.primary : colors.text}
                    >
                      {type.label}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Notification Content */}
            <View style={styles.formField}>
              <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
                Notification Content
              </Typography>
              <TextInput
                style={[
                  styles.textInput, 
                  styles.textArea, 
                  { color: colors.text, borderColor: colors.border }
                ]}
                value={newNotification.content}
                onChangeText={(text) => setNewNotification({...newNotification, content: text})}
                placeholder="Enter notification message..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>
            
            {/* Target Selection */}
            <View style={styles.formField}>
              <View style={styles.switchContainer}>
                <View style={styles.switchLabel}>
                  <Globe size={18} color={colors.primary} style={{ marginRight: 8 }} />
                  <Typography variant="body">Send to All Users</Typography>
                </View>
                <Switch
                  value={newNotification.isGlobal}
                  onValueChange={(value) => setNewNotification({...newNotification, isGlobal: value})}
                  trackColor={{ false: colors.inactive, true: `${colors.primary}80` }}
                  thumbColor={newNotification.isGlobal ? colors.primary : colors.textSecondary}
                />
              </View>
              
              {!newNotification.isGlobal && (
                <View style={styles.userSelectContainer}>
                  <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
                    Select Target User
                  </Typography>
                  {isLoadingUsers ? (
                    <ActivityIndicator size="small" color={colors.primary} style={styles.userSelectLoader} />
                  ) : (
                    <View style={[styles.userSelect, { borderColor: colors.border }]}>
                      <ScrollView style={styles.userSelectScroll}>
                        {userList.map(user => (
                          <TouchableOpacity
                            key={user.id}
                            style={[
                              styles.userOption,
                              newNotification.selectedUserId === user.id && { 
                                backgroundColor: `${colors.primary}20` 
                              }
                            ]}
                            onPress={() => setNewNotification({
                              ...newNotification, 
                              selectedUserId: user.id
                            })}
                          >
                            <User size={16} color={colors.textSecondary} style={styles.userIcon} />
                            <Typography variant="body">
                              {user.username}
                            </Typography>
                            {newNotification.selectedUserId === user.id && (
                              <Check size={16} color={colors.primary} style={styles.checkIcon} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
            </View>
            
            {/* Action Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setCreateModalVisible(false)}
              >
                <Typography variant="button" color={colors.text}>
                  Cancel
                </Typography>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.sendButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateNotification}
              >
                <Send size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Typography variant="button" color="#FFFFFF">
                  Send Notification
                </Typography>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Bell size={24} color={colors.primary} style={styles.titleIcon} />
          <Typography variant="h1">Notifications</Typography>
        </View>
        
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary + '20' }]}
          onPress={handleOpenCreateModal}
        >
          <Plus size={18} color={colors.primary} />
          <Typography variant="bodySmall" style={{ color: colors.primary, marginLeft: 4 }}>
            Create Notification
          </Typography>
        </TouchableOpacity>
      </View>
      
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search notifications..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Filter size={20} color={selectedType ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      {/* Notification List */}
      {isLoading && notificationList.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Typography variant="body" style={{ marginTop: 16 }}>
            Loading notifications...
          </Typography>
        </View>
      ) : (
        <FlatList
          data={notificationList}
          renderItem={renderNotificationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          onEndReached={loadMoreNotifications}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMoreData && notificationList.length > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Bell size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
              <Typography variant="h3" style={{ marginTop: 16, textAlign: 'center' }}>
                No notifications found
              </Typography>
              <Typography variant="body" color={colors.textSecondary} style={{ textAlign: 'center', marginTop: 8 }}>
                {searchQuery || selectedType
                  ? 'Try changing your search or filter criteria'
                  : 'Create your first notification to get started'}
              </Typography>
            </View>
          }
        />
      )}
      
      {/* Modals */}
      <FilterModal />
      <CreateNotificationModal />
    </View>
  );
}

// Film icon for content type notifications
const Film = ({ size, color, style }: { size: number, color: string, style?: any }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
    <line x1="7" y1="2" x2="7" y2="22" />
    <line x1="17" y1="2" x2="17" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="2" y1="7" x2="7" y2="7" />
    <line x1="2" y1="17" x2="7" y2="17" />
    <line x1="17" y1="17" x2="22" y2="17" />
    <line x1="17" y1="7" x2="22" y2="7" />
  </svg>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    paddingVertical: 4,
  },
  filterButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  notificationItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationType: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  notificationContent: {
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetText: {
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
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
  createModalContent: {
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterList: {
    maxHeight: 300,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  createForm: {
    width: '100%',
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    marginBottom: 8,
  },
  typeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
    minWidth: '45%',
  },
  typeLabel: {
    marginLeft: 8,
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
  userSelectContainer: {
    marginTop: 16,
  },
  userSelectLoader: {
    marginVertical: 20,
  },
  userSelect: {
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 150,
  },
  userSelectScroll: {
    padding: 8,
  },
  userOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  userIcon: {
    marginRight: 8,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    marginBottom: 8,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    marginRight: 8,
  },
  sendButton: {
    // Background color set in component
  },
});
