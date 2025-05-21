import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  FlatList,
  Modal,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/context/ThemeProvider';
import { supabase } from '@/lib/supabase';
import Typography from '@/components/Typography';
import { useRouter } from 'expo-router';
import {
  Film,
  Plus,
  Search,
  Filter,
  ChevronDown,
  X,
} from 'lucide-react-native';

// Import custom components
import AnimeListItem from './components/admin/AnimeListItem';
import AddAnimeModal from './components/admin/AddAnimeModal';
import EditAnimeModal from './components/admin/EditAnimeModal';
import AnimeDetailsModal from './components/admin/AnimeDetailsModal';

// Define the Anime type based on the database schema
interface AnimeItem {
  id: string;
  title: string;
  image_url?: string;
  cover_image_url?: string;
  rating?: number;
  release_year?: number;
  genres?: string[];
  description?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Admin Anime Management Screen
 * Allows administrators to view, add, edit, and delete anime entries
 */
export default function AdminAnime() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [animeList, setAnimeList] = useState<AnimeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [addAnimeModalVisible, setAddAnimeModalVisible] = useState(false);
  const [editAnimeModalVisible, setEditAnimeModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [currentAnime, setCurrentAnime] = useState<AnimeItem | null>(null);
  const [newAnime, setNewAnime] = useState<{ 
    title: string;
    description?: string;
    image_url?: string;
    cover_image_url?: string;
    rating?: number;
    release_year?: number;
    genres?: string[];
    status?: string;
  }>({ 
    title: '',
    description: '',
    genres: [],
    release_year: new Date().getFullYear(),
    status: 'ongoing',
  });
  const pageSize = 20;

  // Fetch anime list from Supabase
  const fetchAnimeList = useCallback(async (page = 0, refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
      setCurrentPage(0);
      page = 0;
    } else if (!refresh && page === 0) {
      setIsLoading(true);
    }

    try {
      let query = supabase
        .from('anime')
        .select('*')
        .order('title')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      // Apply search filter if provided
      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      // Apply genre filter if selected
      if (selectedGenre) {
        query = query.contains('genres', [selectedGenre]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching anime:', error);
        return;
      }

      if (data) {
        if (refresh || page === 0) {
          setAnimeList(data);
        } else {
          setAnimeList(prevList => [...prevList, ...data]);
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
  }, [searchQuery, selectedGenre, pageSize]);

  // Fetch available genres from anime data
  const fetchGenres = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('anime')
        .select('genres');

      if (error) {
        console.error('Error fetching genres:', error);
        return;
      }

      if (data) {
        // Extract all genres from all anime
        const allGenres = data
          .flatMap(item => item.genres || [])
          .filter(Boolean);
        
        // Get unique genres
        const uniqueGenres = [...new Set(allGenres)].sort();
        setAvailableGenres(uniqueGenres);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchAnimeList();
    fetchGenres();
  }, [fetchAnimeList, fetchGenres]);

  // Load more anime when reaching the end of the list
  const loadMoreAnime = () => {
    if (hasMoreData && !isLoading) {
      fetchAnimeList(currentPage + 1);
    }
  };

  // Handle search
  const handleSearch = () => {
    fetchAnimeList(0, true);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchAnimeList(0, true);
  };

  // Handle genre filter selection
  const handleGenreSelect = (genre: string | null) => {
    setSelectedGenre(genre);
    setFilterModalVisible(false);
    fetchAnimeList(0, true);
  };

  // Handle edit anime
  const handleEditAnime = (anime: AnimeItem) => {
    setCurrentAnime(anime);
    setEditAnimeModalVisible(true);
  };

  // Handle view anime details
  const handleViewDetails = (anime: AnimeItem) => {
    setCurrentAnime(anime);
    setDetailsModalVisible(true);
  };

  // Handle navigate to episodes
  const handleNavigateToEpisodes = (animeId: string) => {
    router.push({
      pathname: 'adminEpisodes',
      params: { animeId }
    });
  };

  // Handle add anime
  const handleAddAnime = async () => {
    if (!newAnime.title) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('anime')
        .insert([
          {
            title: newAnime.title,
            description: newAnime.description,
            image_url: newAnime.image_url,
            cover_image_url: newAnime.cover_image_url,
            release_year: newAnime.release_year,
            genres: newAnime.genres,
            status: newAnime.status,
          }
        ])
        .select();

      if (error) throw error;

      // Reset form and close modal
      setNewAnime({
        title: '',
        description: '',
        genres: [],
        release_year: new Date().getFullYear(),
        status: 'ongoing',
      });
      setAddAnimeModalVisible(false);
      
      // Refresh anime list
      fetchAnimeList(0, true);
      Alert.alert('Success', 'Anime added successfully');
    } catch (error) {
      console.error('Error adding anime:', error);
      Alert.alert('Error', 'Failed to add anime. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle update anime
  const handleUpdateAnime = async () => {
    if (!currentAnime || !currentAnime.title) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('anime')
        .update({
          title: currentAnime.title,
          description: currentAnime.description,
          image_url: currentAnime.image_url,
          cover_image_url: currentAnime.cover_image_url,
          release_year: currentAnime.release_year,
          genres: currentAnime.genres,
          status: currentAnime.status,
        })
        .eq('id', currentAnime.id);

      if (error) throw error;

      // Reset form and close modal
      setCurrentAnime(null);
      setEditAnimeModalVisible(false);
      
      // Refresh anime list
      fetchAnimeList(0, true);
      Alert.alert('Success', 'Anime updated successfully');
    } catch (error) {
      console.error('Error updating anime:', error);
      Alert.alert('Error', 'Failed to update anime. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete anime
  const handleDeleteAnime = (id: string, title: string) => {
    Alert.alert(
      'Delete Anime',
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
                .from('anime')
                .delete()
                .eq('id', id);
                
              if (error) throw error;
              
              // Refresh anime list
              fetchAnimeList(0, true);
              Alert.alert('Success', 'Anime deleted successfully');
            } catch (error) {
              console.error('Error deleting anime:', error);
              Alert.alert('Error', 'Failed to delete anime. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle change in anime form fields
  const handleChangeAnime = (field: string, value: any) => {
    setNewAnime(prev => ({ ...prev, [field]: value }));
  };

  // Handle change in current anime form fields
  const handleChangeCurrentAnime = (field: string, value: any) => {
    if (currentAnime) {
      setCurrentAnime({ ...currentAnime, [field]: value });
    }
  };

  // Filter Modal
  const FilterModal = () => (
    <View style={[styles.filterModal, { backgroundColor: colors.card }]}>
      <View style={styles.filterHeader}>
        <Typography variant="h3">Filter by Genre</Typography>
        <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.genreList}>
        <TouchableOpacity
          style={[
            styles.genreItem,
            !selectedGenre && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary }
          ]}
          onPress={() => handleGenreSelect(null)}
        >
          <Typography
            variant="body"
            color={!selectedGenre ? colors.primary : colors.text}
          >
            All Genres
          </Typography>
        </TouchableOpacity>
        
        {availableGenres.map((genre) => (
          <TouchableOpacity
            key={genre}
            style={[
              styles.genreItem,
              selectedGenre === genre && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
              { borderColor: colors.border }
            ]}
            onPress={() => handleGenreSelect(genre)}
          >
            <Typography
              variant="body"
              color={selectedGenre === genre ? colors.primary : colors.text}
            >
              {genre}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Film size={24} color={colors.primary} />
          <Typography variant="h2" style={{ marginLeft: 8 }}>
            Anime Management
          </Typography>
        </View>
        
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary + '20' }]}
          onPress={() => setAddAnimeModalVisible(true)}
        >
          <Plus size={18} color={colors.primary} />
          <Typography variant="bodySmall" style={{ color: colors.primary, marginLeft: 4 }}>
            Add Anime
          </Typography>
        </TouchableOpacity>
      </View>
      
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search anime..."
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
          <Filter size={20} color={colors.textSecondary} />
          {selectedGenre && (
            <View style={styles.filterBadge}>
              <Typography variant="bodySmall" color={colors.primary} numberOfLines={1}>
                {selectedGenre}
              </Typography>
              <ChevronDown size={12} color={colors.primary} />
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Anime List */}
      {isLoading && animeList.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Typography variant="body" style={{ marginTop: 16 }}>
            Loading anime...
          </Typography>
        </View>
      ) : (
        <FlatList
          data={animeList}
          renderItem={({ item }) => (
            <AnimeListItem
              item={item}
              colors={colors}
              onEdit={handleEditAnime}
              onDelete={handleDeleteAnime}
              onNavigateToEpisodes={handleNavigateToEpisodes}
              onViewDetails={handleViewDetails}
            />
          )}
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
          onEndReached={loadMoreAnime}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMoreData && animeList.length > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Film size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
              <Typography variant="h3" style={{ marginTop: 16, textAlign: 'center' }}>
                No anime found
              </Typography>
              <Typography variant="body" color={colors.textSecondary} style={{ textAlign: 'center', marginTop: 8 }}>
                {searchQuery || selectedGenre
                  ? 'Try changing your search criteria or filters'
                  : 'Add your first anime to get started'}
              </Typography>
            </View>
          }
        />
      )}
      
      {/* Filter Modal */}
      {filterModalVisible && <FilterModal />}
      
      {/* Add Anime Modal */}
      <AddAnimeModal
        visible={addAnimeModalVisible}
        colors={colors}
        newAnime={newAnime}
        onClose={() => setAddAnimeModalVisible(false)}
        onChangeAnime={handleChangeAnime}
        onSubmit={handleAddAnime}
      />
      
      {/* Edit Anime Modal */}
      <EditAnimeModal
        visible={editAnimeModalVisible}
        colors={colors}
        currentAnime={currentAnime}
        onClose={() => setEditAnimeModalVisible(false)}
        onChangeAnime={handleChangeCurrentAnime}
        onSubmit={handleUpdateAnime}
      />
      
      {/* Anime Details Modal */}
      <AnimeDetailsModal
        visible={detailsModalVisible}
        colors={colors}
        anime={currentAnime}
        onClose={() => setDetailsModalVisible(false)}
      />
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
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginLeft: 8,
    minWidth: 44,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    maxWidth: 100,
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
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  filterModal: {
    position: 'absolute',
    top: 120,
    right: 16,
    width: '70%',
    borderRadius: 12,
    padding: 16,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  genreList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreItem: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
});
