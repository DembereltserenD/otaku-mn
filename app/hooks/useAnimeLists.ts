import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

interface ListItem {
  id: string;
  title: string;
  imageUrl: string;
  rating: number;
  addedDate: string;
}

type ListType = 'watching' | 'completed' | 'watchlist' | 'favorites';

interface ListsData {
  watching: ListItem[];
  completed: ListItem[];
  watchlist: ListItem[];
  favorites: ListItem[];
}

const useAnimeLists = (userId: string | null) => {
  const [lists, setLists] = useState<ListsData>({
    watching: [],
    completed: [],
    watchlist: [],
    favorites: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Add anime to a list
  const addToList = useCallback(async (animeId: string, listType: ListType) => {
    if (!userId) {
      Alert.alert('Authentication Required', 'Please log in to add anime to your lists.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real app, this would be an API call to add the anime to the user's list
      console.log(`Adding anime ${animeId} to list ${listType} for user ${userId}`);
      
      // Mock successful operation
      // In a real app, we would update the lists state with the returned data
      Alert.alert('Success', `Anime added to your ${listType} list.`);
    } catch (err) {
      setError('Failed to add anime to list.');
      console.error("Error adding anime to list:", err);
      Alert.alert('Error', 'Failed to add anime to list. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Remove anime from list
  const removeFromList = useCallback(async (animeId: string, listType: ListType) => {
    if (!userId) {
      Alert.alert('Authentication Required', 'Please log in to manage your lists.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real app, this would be an API call to remove the anime from the user's list
      console.log(`Removing anime ${animeId} from list ${listType} for user ${userId}`);
      
      // Mock successful operation
      // In a real app, we would update the lists state with the returned data
      setLists(prevLists => ({
        ...prevLists,
        [listType]: prevLists[listType].filter(item => item.id !== animeId)
      }));
      
      Alert.alert('Success', `Anime removed from your ${listType} list.`);
    } catch (err) {
      setError('Failed to remove anime from list.');
      console.error("Error removing anime from list:", err);
      Alert.alert('Error', 'Failed to remove anime from list. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch user lists
  const fetchLists = useCallback(async () => {
    if (!userId) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in a real app, this would be fetched from an API
      const mockLists: ListsData = {
        watching: [
          {
            id: '1',
            title: 'Attack on Titan',
            imageUrl: 'https://images.unsplash.com/photo-1541562232579-512a21325720?w=400&q=80',
            rating: 4.8,
            addedDate: new Date().toISOString()
          }
        ],
        completed: [
          {
            id: '2',
            title: 'My Hero Academia',
            imageUrl: 'https://images.unsplash.com/photo-1560972550-aba3456b5564?w=400&q=80',
            rating: 4.6,
            addedDate: new Date().toISOString()
          }
        ],
        watchlist: [
          {
            id: '3',
            title: 'Demon Slayer',
            imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
            rating: 4.9,
            addedDate: new Date().toISOString()
          }
        ],
        favorites: [
          {
            id: '4',
            title: 'One Piece',
            imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80',
            rating: 4.7,
            addedDate: new Date().toISOString()
          }
        ]
      };
      
      setLists(mockLists);
    } catch (err) {
      setError('Failed to fetch lists.');
      console.error("Error fetching lists:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Effect to fetch lists when userId changes
  // useEffect(() => {
  //   if (userId) {
  //     fetchLists();
  //   }
  // }, [userId, fetchLists]);

  return {
    lists,
    loading,
    error,
    addToList,
    removeFromList,
    fetchLists
  };
};

export default useAnimeLists; 