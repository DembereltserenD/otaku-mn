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
  Image,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/context/ThemeProvider';
import { supabase } from '@/lib/supabase';
import Typography from '@/components/Typography';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Film,
  Plus,
  Edit,
  Trash,
  X,
  Search,
  ArrowLeft,
  Play,
  Video,
  Link,
} from 'lucide-react-native';

// Define the Episode type based on the database schema
interface Episode {
  id: string;
  anime_id: string;
  title: string;
  episode_number: number;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  created_at?: string;
  updated_at?: string;
}

interface AnimeDetails {
  id: string;
  title: string;
  image_url?: string;
}

/**
 * Admin Episodes Management Screen
 * Allows administrators to view, add, edit, and delete episodes for a specific anime
 */
export default function AdminEpisodes() {
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const { animeId } = useLocalSearchParams<{ animeId: string }>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [episodeList, setEpisodeList] = useState<Episode[]>([]);
  const [animeDetails, setAnimeDetails] = useState<AnimeDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [addEpisodeModalVisible, setAddEpisodeModalVisible] = useState(false);
  const [editEpisodeModalVisible, setEditEpisodeModalVisible] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [newEpisode, setNewEpisode] = useState<Partial<Episode>>({
    anime_id: animeId,
    title: '',
    episode_number: 1,
  });
  const pageSize = 20;

  // Fetch anime details
  const fetchAnimeDetails = async () => {
    if (!animeId) return;
    
    try {
      const { data, error } = await supabase
        .from('anime')
        .select('id, title, image_url')
        .eq('id', animeId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setAnimeDetails(data);
      }
    } catch (error) {
      console.error('Error fetching anime details:', error);
    }
  };

  // Fetch episodes list from Supabase
  const fetchEpisodesList = useCallback(async (page = 0, refresh = false) => {
    if (!animeId) return;
    
    if (refresh) {
      setIsRefreshing(true);
      setCurrentPage(0);
      page = 0;
    } else if (!refresh && page === 0) {
      setIsLoading(true);
    }

    try {
      let query = supabase
        .from('episodes')
        .select('*')
        .eq('anime_id', animeId)
        .order('episode_number')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      // Apply search filter if provided
      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching episodes:', error);
        return;
      }

      if (data) {
        if (refresh || page === 0) {
          setEpisodeList(data);
        } else {
          setEpisodeList(prevList => [...prevList, ...data]);
        }
        
        setHasMoreData(data.length === pageSize);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [animeId, searchQuery, pageSize]);

  // Load more episodes when reaching the end of the list
  const loadMoreEpisodes = () => {
    if (hasMoreData && !isLoading) {
      fetchEpisodesList(currentPage + 1);
    }
  };

  // Handle search
  const handleSearch = () => {
    fetchEpisodesList(0, true);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchEpisodesList(0, true);
  };

  // Handle edit episode
  const handleEditEpisode = (episode: Episode) => {
    setCurrentEpisode(episode);
    setNewEpisode({
      anime_id: episode.anime_id,
      title: episode.title,
      episode_number: episode.episode_number,
      video_url: episode.video_url || '',
      thumbnail_url: episode.thumbnail_url || '',
      duration: episode.duration || 0,
    });
    setEditEpisodeModalVisible(true);
  };

  // Handle add episode
  const handleAddEpisode = async () => {
    if (!newEpisode.title || !newEpisode.episode_number) {
      Alert.alert('Error', 'Title and episode number are required');
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('episodes')
        .insert([
          {
            anime_id: animeId,
            title: newEpisode.title,
            episode_number: newEpisode.episode_number,
            video_url: newEpisode.video_url,
            thumbnail_url: newEpisode.thumbnail_url,
            duration: newEpisode.duration,
          }
        ])
        .select();

      if (error) throw error;

      // Reset form and close modal
      setNewEpisode({
        anime_id: animeId,
        title: '',
        episode_number: (newEpisode.episode_number || 0) + 1,
      });
      setAddEpisodeModalVisible(false);
      
      // Refresh episode list
      fetchEpisodesList(0, true);
      Alert.alert('Success', 'Episode added successfully');
    } catch (error) {
      console.error('Error adding episode:', error);
      Alert.alert('Error', 'Failed to add episode. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle update episode
  const handleUpdateEpisode = async () => {
    if (!currentEpisode || !newEpisode.title || !newEpisode.episode_number) {
      Alert.alert('Error', 'Title and episode number are required');
      return;
    }

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('episodes')
        .update({
          title: newEpisode.title,
          episode_number: newEpisode.episode_number,
          video_url: newEpisode.video_url,
          thumbnail_url: newEpisode.thumbnail_url,
          duration: newEpisode.duration,
        })
        .eq('id', currentEpisode.id);

      if (error) throw error;

      // Reset form and close modal
      setCurrentEpisode(null);
      setNewEpisode({
        anime_id: animeId,
        title: '',
        episode_number: 1,
      });
      setEditEpisodeModalVisible(false);
      
      // Refresh episode list
      fetchEpisodesList(0, true);
      Alert.alert('Success', 'Episode updated successfully');
    } catch (error) {
      console.error('Error updating episode:', error);
      Alert.alert('Error', 'Failed to update episode. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete episode
  const handleDeleteEpisode = (id: string, title: string) => {
    Alert.alert(
      'Delete Episode',
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              const { error } = await supabase
                .from('episodes')
                .delete()
                .eq('id', id);
                
              if (error) throw error;
              
              // Refresh episode list
              fetchEpisodesList(0, true);
              Alert.alert('Success', 'Episode deleted successfully');
            } catch (error) {
              console.error('Error deleting episode:', error);
              Alert.alert('Error', 'Failed to delete episode. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Initial data fetch
  useEffect(() => {
    if (animeId) {
      fetchAnimeDetails();
      fetchEpisodesList();
    }
  }, [animeId, fetchEpisodesList]);

  // Render episode item
  const renderEpisodeItem = ({ item }: { item: Episode }) => (
    <View style={[styles.episodeItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.episodeInfo}>
        <Typography variant="h3" numberOfLines={1}>
          {item.episode_number}. {item.title}
        </Typography>
        
        <View style={styles.episodeDetails}>
          {item.duration && (
            <Typography variant="bodySmall" color={colors.textSecondary} style={styles.detailItem}>
              Duration: {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
            </Typography>
          )}
          
          {item.video_url && (
            <Typography variant="bodySmall" color={colors.textSecondary} style={styles.detailItem}>
              Video: {item.video_url.substring(0, 30)}...
            </Typography>
          )}
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: `${colors.primary}20` }]}
          onPress={() => handleEditEpisode(item)}
        >
          <Edit size={18} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: `${colors.error}20` }]}
          onPress={() => handleDeleteEpisode(item.id, item.title)}
        >
          <Trash size={18} color={colors.error} />
        </TouchableOpacity>
        
        {item.video_url && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${colors.success}20` }]}
            onPress={() => {
              // Preview video functionality could be added here
              Alert.alert('Video URL', item.video_url || 'No video URL available');
            }}
          >
            <Play size={18} color={colors.success} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Add Episode Modal
  const AddEpisodeModal = () => (
    <Modal
      visible={addEpisodeModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setAddEpisodeModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.episodeModalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Typography variant="h2">Add New Episode</Typography>
            <TouchableOpacity onPress={() => setAddEpisodeModalVisible(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.episodeForm}>
            {/* Title */}
            <View style={styles.formField}>
              <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
                Title *
              </Typography>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="Enter episode title"
                placeholderTextColor={colors.textSecondary}
                value={newEpisode.title}
                onChangeText={(text) => setNewEpisode({...newEpisode, title: text})}
              />
            </View>
            
            {/* Episode Number */}
            <View style={styles.formField}>
              <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
                Episode Number *
              </Typography>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="Enter episode number"
                placeholderTextColor={colors.textSecondary}
                value={newEpisode.episode_number?.toString()}
                onChangeText={(text) => setNewEpisode({...newEpisode, episode_number: parseInt(text) || 0})}
                keyboardType="numeric"
              />
            </View>
            
            {/* Video URL */}
            <View style={styles.formField}>
              <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
                Video URL
              </Typography>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="Enter video URL"
                placeholderTextColor={colors.textSecondary}
                value={newEpisode.video_url}
                onChangeText={(text) => setNewEpisode({...newEpisode, video_url: text})}
              />
            </View>
            
            {/* Thumbnail URL */}
            <View style={styles.formField}>
              <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
                Thumbnail URL
              </Typography>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="Enter thumbnail URL"
                placeholderTextColor={colors.textSecondary}
                value={newEpisode.thumbnail_url}
                onChangeText={(text) => setNewEpisode({...newEpisode, thumbnail_url: text})}
              />
            </View>
            
            {/* Duration */}
            <View style={styles.formField}>
              <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
                Duration (in seconds)
              </Typography>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="Enter duration in seconds"
                placeholderTextColor={colors.textSecondary}
                value={newEpisode.duration?.toString()}
                onChangeText={(text) => setNewEpisode({...newEpisode, duration: parseInt(text) || 0})}
                keyboardType="numeric"
              />
            </View>
            
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleAddEpisode}
            >
              <Typography variant="button" color="#FFFFFF">
                Add Episode
              </Typography>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
  
  // Edit Episode Modal
  const EditEpisodeModal = () => (
    <Modal
      visible={editEpisodeModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setEditEpisodeModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.episodeModalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Typography variant="h2">Edit Episode</Typography>
            <TouchableOpacity onPress={() => setEditEpisodeModalVisible(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.episodeForm}>
            {/* Title */}
            <View style={styles.formField}>
              <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
                Title *
              </Typography>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="Enter episode title"
                placeholderTextColor={colors.textSecondary}
                value={newEpisode.title}
                onChangeText={(text) => setNewEpisode({...newEpisode, title: text})}
              />
            </View>
            
            {/* Episode Number */}
            <View style={styles.formField}>
              <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
                Episode Number *
              </Typography>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="Enter episode number"
                placeholderTextColor={colors.textSecondary}
                value={newEpisode.episode_number?.toString()}
                onChangeText={(text) => setNewEpisode({...newEpisode, episode_number: parseInt(text) || 0})}
                keyboardType="numeric"
              />
            </View>
            
            {/* Video URL */}
            <View style={styles.formField}>
              <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
                Video URL
              </Typography>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="Enter video URL"
                placeholderTextColor={colors.textSecondary}
                value={newEpisode.video_url}
                onChangeText={(text) => setNewEpisode({...newEpisode, video_url: text})}
              />
            </View>
            
            {/* Thumbnail URL */}
            <View style={styles.formField}>
              <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
                Thumbnail URL
              </Typography>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="Enter thumbnail URL"
                placeholderTextColor={colors.textSecondary}
                value={newEpisode.thumbnail_url}
                onChangeText={(text) => setNewEpisode({...newEpisode, thumbnail_url: text})}
              />
            </View>
            
            {/* Duration */}
            <View style={styles.formField}>
              <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
                Duration (in seconds)
              </Typography>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="Enter duration in seconds"
                placeholderTextColor={colors.textSecondary}
                value={newEpisode.duration?.toString()}
                onChangeText={(text) => setNewEpisode({...newEpisode, duration: parseInt(text) || 0})}
                keyboardType="numeric"
              />
            </View>
            
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleUpdateEpisode}
            >
              <Typography variant="button" color="#FFFFFF">
                Update Episode
              </Typography>
            </TouchableOpacity>
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
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.primary} />
          </TouchableOpacity>
          <View>
            <Typography variant="h2">Episodes</Typography>
            {animeDetails && (
              <Typography variant="bodySmall" color={colors.textSecondary}>
                {animeDetails.title}
              </Typography>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary + '20' }]}
          onPress={() => setAddEpisodeModalVisible(true)}
        >
          <Plus size={18} color={colors.primary} />
          <Typography variant="bodySmall" style={{ color: colors.primary, marginLeft: 4 }}>
            Add Episode
          </Typography>
        </TouchableOpacity>
      </View>
      
      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search episodes..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>
      
      {/* Episode List */}
      {isLoading && episodeList.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Typography variant="body" style={{ marginTop: 16 }}>
            Loading episodes...
          </Typography>
        </View>
      ) : (
        <FlatList
          data={episodeList}
          renderItem={renderEpisodeItem}
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
          onEndReached={loadMoreEpisodes}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMoreData && episodeList.length > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Video size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
              <Typography variant="h3" style={{ marginTop: 16, textAlign: 'center' }}>
                No episodes found
              </Typography>
              <Typography variant="body" color={colors.textSecondary} style={{ textAlign: 'center', marginTop: 8 }}>
                {searchQuery
                  ? 'Try changing your search criteria'
                  : 'Add your first episode to get started'}
              </Typography>
            </View>
          }
        />
      )}
      
      {/* Modals */}
      <AddEpisodeModal />
      <EditEpisodeModal />
    </View>
  );
}

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
  backButton: {
    marginRight: 12,
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
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    paddingVertical: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  episodeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  episodeInfo: {
    flex: 1,
    marginRight: 12,
  },
  episodeDetails: {
    marginTop: 4,
  },
  detailItem: {
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
    maxHeight: '70%',
    borderRadius: 12,
    padding: 16,
  },
  episodeModalContent: {
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  episodeForm: {
    flex: 1,
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  submitButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
});
