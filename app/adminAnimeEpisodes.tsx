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
} from 'react-native';
import { useTheme } from '@/context/ThemeProvider';
import { supabase } from '@/lib/supabase';
import Typography from '@/components/Typography';
import {
  Film,
  Plus,
  Edit,
  Trash,
  X,
  Play,
  ArrowLeft,
  Upload,
  Video,
  Image as ImageIcon,
} from 'lucide-react-native';

// Define the Episode type based on the database schema
interface Episode {
  id: string;
  anime_id: string;
  title: string;
  description: string | null;
  episode_number: number;
  thumbnail_url: string | null;
  video_url: string | null;
  duration: string | null;
  created_at: string;
  updated_at: string;
}

// Define the Anime type
interface Anime {
  id: string;
  title: string;
  image_url?: string;
  cover_image_url?: string;
}

/**
 * Admin Anime Episodes Management Screen
 * Allows administrators to view, add, edit, and delete episodes for a specific anime
 */
export default function AdminAnimeEpisodes({ route, navigation }: any) {
  const { colors, isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [anime, setAnime] = useState<Anime | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  
  // New episode state
  const [newEpisode, setNewEpisode] = useState({
    title: '',
    description: '',
    episode_number: 1,
    thumbnail_url: '',
    video_url: '',
    duration: '',
  });
  
  // Get anime ID from route params or use a default for testing
  const animeId = route?.params?.animeId || '123e4567-e89b-12d3-a456-426614174000';

  // Fetch episodes for the anime
  const fetchEpisodes = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Fetch anime details
      const { data: animeData, error: animeError } = await supabase
        .from('anime')
        .select('id, title, image_url, cover_image_url')
        .eq('id', animeId)
        .single();

      if (animeError) {
        console.error('Error fetching anime:', animeError);
        return;
      }

      if (animeData) {
        setAnime(animeData);
      }

      // Fetch episodes
      const { data: episodesData, error: episodesError } = await supabase
        .from('episodes')
        .select('*')
        .eq('anime_id', animeId)
        .order('episode_number');

      if (episodesError) {
        console.error('Error fetching episodes:', episodesError);
        return;
      }

      if (episodesData) {
        setEpisodes(episodesData);
      }
    } catch (error) {
      console.error('Error in fetchEpisodes:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [animeId]);

  // Handle refresh
  const handleRefresh = () => {
    fetchEpisodes(true);
  };

  // Delete episode
  const handleDeleteEpisode = (episodeId: string, episodeTitle: string) => {
    Alert.alert(
      'Delete Episode',
      `Are you sure you want to delete "${episodeTitle}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const { error } = await supabase
                .from('episodes')
                .delete()
                .eq('id', episodeId);

              if (error) {
                console.error('Error deleting episode:', error);
                Alert.alert('Error', 'Failed to delete episode. Please try again.');
                return;
              }

              // Refresh the list
              fetchEpisodes(true);
              Alert.alert('Success', `Episode "${episodeTitle}" has been deleted.`);
            } catch (error) {
              console.error('Error in handleDeleteEpisode:', error);
              Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Create episode
  const handleCreateEpisode = async () => {
    if (!newEpisode.title.trim()) {
      Alert.alert('Error', 'Please enter episode title.');
      return;
    }

    try {
      const episodeData = {
        anime_id: animeId,
        title: newEpisode.title.trim(),
        description: newEpisode.description.trim() || null,
        episode_number: newEpisode.episode_number,
        thumbnail_url: newEpisode.thumbnail_url.trim() || null,
        video_url: newEpisode.video_url.trim() || null,
        duration: newEpisode.duration.trim() || null,
      };

      const { error } = await supabase
        .from('episodes')
        .insert([episodeData]);

      if (error) {
        console.error('Error creating episode:', error);
        Alert.alert('Error', 'Failed to create episode. Please try again.');
        return;
      }

      // Reset form and close modal
      setNewEpisode({
        title: '',
        description: '',
        episode_number: episodes.length + 1,
        thumbnail_url: '',
        video_url: '',
        duration: '',
      });
      setCreateModalVisible(false);

      // Refresh the list
      fetchEpisodes(true);
      Alert.alert('Success', 'Episode has been created.');
    } catch (error) {
      console.error('Error in handleCreateEpisode:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  // Edit episode
  const handleEditEpisode = (episode: Episode) => {
    setCurrentEpisode(episode);
    setEditModalVisible(true);
  };

  // Save edited episode
  const handleSaveEpisode = async () => {
    if (!currentEpisode) return;

    try {
      const { error } = await supabase
        .from('episodes')
        .update({
          title: currentEpisode.title,
          description: currentEpisode.description,
          episode_number: currentEpisode.episode_number,
          thumbnail_url: currentEpisode.thumbnail_url,
          video_url: currentEpisode.video_url,
          duration: currentEpisode.duration,
        })
        .eq('id', currentEpisode.id);

      if (error) {
        console.error('Error updating episode:', error);
        Alert.alert('Error', 'Failed to update episode. Please try again.');
        return;
      }

      setEditModalVisible(false);
      // Refresh the list
      fetchEpisodes(true);
      Alert.alert('Success', `Episode "${currentEpisode.title}" has been updated.`);
    } catch (error) {
      console.error('Error in handleSaveEpisode:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchEpisodes();
    // Set default episode number for new episodes
    setNewEpisode(prev => ({
      ...prev,
      episode_number: episodes.length + 1
    }));
  }, []);

  // Render episode item
  const renderEpisodeItem = ({ item }: { item: Episode }) => (
    <View style={[styles.episodeItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.episodeInfo}>
        <View style={styles.episodeHeader}>
          <Typography variant="h3" numberOfLines={1}>
            {item.episode_number}. {item.title}
          </Typography>
        </View>
        
        {item.description && (
          <Typography variant="bodySmall" color={colors.textSecondary} numberOfLines={2} style={styles.description}>
            {item.description}
          </Typography>
        )}
        
        <View style={styles.episodeDetails}>
          {item.duration && (
            <Typography variant="caption" color={colors.textSecondary} style={styles.detailItem}>
              Duration: {item.duration}
            </Typography>
          )}
          
          <Typography variant="caption" color={colors.textSecondary} style={styles.detailItem}>
            Added: {new Date(item.created_at).toLocaleDateString()}
          </Typography>
        </View>
      </View>
      
      {item.thumbnail_url && (
        <Image 
          source={{ uri: item.thumbnail_url }} 
          style={styles.thumbnail}
          resizeMode="cover"
        />
      )}
      
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
            onPress={() => {/* Preview video */}}
          >
            <Play size={18} color={colors.success} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Create episode modal
  const CreateEpisodeModal = () => (
    <Modal
      visible={createModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setCreateModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Typography variant="h2">Add New Episode</Typography>
            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.formField}>
            <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
              Episode Number
            </Typography>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
              value={String(newEpisode.episode_number)}
              onChangeText={(text) => setNewEpisode({
                ...newEpisode, 
                episode_number: parseInt(text) || 1
              })}
              keyboardType="number-pad"
              placeholder="Episode number"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          
          <View style={styles.formField}>
            <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
              Episode Title
            </Typography>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
              value={newEpisode.title}
              onChangeText={(text) => setNewEpisode({...newEpisode, title: text})}
              placeholder="Enter episode title"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          
          <View style={styles.formField}>
            <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
              Description
            </Typography>
            <TextInput
              style={[
                styles.textInput, 
                styles.textArea, 
                { color: colors.text, borderColor: colors.border }
              ]}
              value={newEpisode.description}
              onChangeText={(text) => setNewEpisode({...newEpisode, description: text})}
              placeholder="Enter episode description"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
          
          <View style={styles.formField}>
            <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
              Thumbnail URL
            </Typography>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
              value={newEpisode.thumbnail_url}
              onChangeText={(text) => setNewEpisode({...newEpisode, thumbnail_url: text})}
              placeholder="Enter thumbnail URL"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          
          <View style={styles.formField}>
            <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
              Video URL
            </Typography>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
              value={newEpisode.video_url}
              onChangeText={(text) => setNewEpisode({...newEpisode, video_url: text})}
              placeholder="Enter video URL"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          
          <View style={styles.formField}>
            <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
              Duration
            </Typography>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
              value={newEpisode.duration}
              onChangeText={(text) => setNewEpisode({...newEpisode, duration: text})}
              placeholder="Enter duration (e.g., '24:30')"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          
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
              style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateEpisode}
            >
              <Typography variant="button" color="#FFFFFF">
                Add Episode
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Edit episode modal
  const EditEpisodeModal = () => (
    <Modal
      visible={editModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setEditModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Typography variant="h2">Edit Episode</Typography>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          {currentEpisode && (
            <>
              <View style={styles.formField}>
                <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
                  Episode Number
                </Typography>
                <TextInput
                  style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                  value={String(currentEpisode.episode_number)}
                  onChangeText={(text) => setCurrentEpisode({
                    ...currentEpisode, 
                    episode_number: parseInt(text) || currentEpisode.episode_number
                  })}
                  keyboardType="number-pad"
                  placeholder="Episode number"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <View style={styles.formField}>
                <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
                  Episode Title
                </Typography>
                <TextInput
                  style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                  value={currentEpisode.title}
                  onChangeText={(text) => setCurrentEpisode({...currentEpisode, title: text})}
                  placeholder="Enter episode title"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <View style={styles.formField}>
                <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
                  Description
                </Typography>
                <TextInput
                  style={[
                    styles.textInput, 
                    styles.textArea, 
                    { color: colors.text, borderColor: colors.border }
                  ]}
                  value={currentEpisode.description || ''}
                  onChangeText={(text) => setCurrentEpisode({...currentEpisode, description: text})}
                  placeholder="Enter episode description"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              </View>
              
              <View style={styles.formField}>
                <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
                  Thumbnail URL
                </Typography>
                <TextInput
                  style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                  value={currentEpisode.thumbnail_url || ''}
                  onChangeText={(text) => setCurrentEpisode({...currentEpisode, thumbnail_url: text})}
                  placeholder="Enter thumbnail URL"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <View style={styles.formField}>
                <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
                  Video URL
                </Typography>
                <TextInput
                  style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                  value={currentEpisode.video_url || ''}
                  onChangeText={(text) => setCurrentEpisode({...currentEpisode, video_url: text})}
                  placeholder="Enter video URL"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <View style={styles.formField}>
                <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
                  Duration
                </Typography>
                <TextInput
                  style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                  value={currentEpisode.duration || ''}
                  onChangeText={(text) => setCurrentEpisode({...currentEpisode, duration: text})}
                  placeholder="Enter duration (e.g., '24:30')"
                  placeholderTextColor={colors.textSecondary}
                />
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
                  onPress={handleSaveEpisode}
                >
                  <Typography variant="button" color="#FFFFFF">
                    Save Changes
                  </Typography>
                </TouchableOpacity>
              </View>
            </>
          )}
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
            onPress={() => navigation?.goBack()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Typography variant="h1" numberOfLines={1}>
              Episodes
            </Typography>
            {anime && (
              <Typography variant="bodySmall" color={colors.textSecondary}>
                {anime.title}
              </Typography>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setCreateModalVisible(true)}
        >
          <Plus size={20} color="#FFFFFF" />
          <Typography variant="button" color="#FFFFFF" style={styles.addButtonText}>
            Add Episode
          </Typography>
        </TouchableOpacity>
      </View>
      
      {/* Episode List */}
      {isLoading && episodes.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Typography variant="body" style={{ marginTop: 16 }}>
            Loading episodes...
          </Typography>
        </View>
      ) : (
        <FlatList
          data={episodes}
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Video size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
              <Typography variant="h3" style={{ marginTop: 16, textAlign: 'center' }}>
                No episodes found
              </Typography>
              <Typography variant="body" color={colors.textSecondary} style={{ textAlign: 'center', marginTop: 8 }}>
                Add your first episode to get started
              </Typography>
            </View>
          }
        />
      )}
      
      {/* Modals */}
      <CreateEpisodeModal />
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
    marginRight: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  episodeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  episodeInfo: {
    flex: 1,
    marginRight: 16,
  },
  episodeHeader: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 8,
  },
  episodeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    marginRight: 16,
  },
  thumbnail: {
    width: 80,
    height: 45,
    borderRadius: 4,
    marginRight: 12,
  },
  actionButtons: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    marginBottom: 8,
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
    width: '90%',
    maxHeight: '90%',
    borderRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
