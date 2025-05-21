import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Typography from '@/components/Typography';
import { Edit, Trash, Video, ChevronRight } from 'lucide-react-native';

interface AnimeItemProps {
  item: {
    id: string;
    title: string;
    image_url?: string;
    cover_image_url?: string;
    rating?: number;
    release_year?: number;
    genres?: string[];
    description?: string;
    status?: string;
  };
  colors: any;
  onEdit: (item: any) => void;
  onDelete: (id: string, title: string) => void;
  onNavigateToEpisodes: (id: string) => void;
  onViewDetails: (item: any) => void;
}

const AnimeListItem = ({ 
  item, 
  colors, 
  onEdit, 
  onDelete, 
  onNavigateToEpisodes,
  onViewDetails
}: AnimeItemProps) => {
  return (
    <View style={[styles.animeItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.animeInfo}>
        <Typography variant="h3" numberOfLines={1}>
          {item.title}
        </Typography>
        
        <View style={styles.animeDetails}>
          {item.rating && (
            <Typography variant="bodySmall" color={colors.textSecondary} style={styles.detailItem}>
              Rating: {item.rating.toFixed(1)}
            </Typography>
          )}
          
          {item.release_year && (
            <Typography variant="bodySmall" color={colors.textSecondary} style={styles.detailItem}>
              Year: {item.release_year}
            </Typography>
          )}
          
          {item.genres && item.genres.length > 0 && (
            <Typography variant="bodySmall" color={colors.textSecondary} style={styles.detailItem}>
              Genres: {item.genres.slice(0, 3).join(', ')}
              {item.genres.length > 3 ? '...' : ''}
            </Typography>
          )}
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: `${colors.primary}20` }]}
          onPress={() => onEdit(item)}
        >
          <Edit size={18} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: `${colors.error}20` }]}
          onPress={() => onDelete(item.id, item.title)}
        >
          <Trash size={18} color={colors.error} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: `${colors.success}20` }]}
          onPress={() => onNavigateToEpisodes(item.id)}
        >
          <Video size={18} color={colors.success} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: `${colors.info}20` }]}
          onPress={() => onViewDetails(item)}
        >
          <ChevronRight size={18} color={colors.info} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  animeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  animeInfo: {
    flex: 1,
    marginRight: 12,
  },
  animeDetails: {
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
});

export default AnimeListItem;
