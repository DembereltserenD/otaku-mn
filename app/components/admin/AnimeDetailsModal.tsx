import React from 'react';
import { View, Modal, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import Typography from '@/components/Typography';
import { X, Star, Calendar, Tag, Activity } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface AnimeDetailsModalProps {
  visible: boolean;
  colors: any;
  anime: {
    id: string;
    title: string;
    description?: string;
    image_url?: string;
    cover_image_url?: string;
    rating?: number;
    release_year?: number;
    genres?: string[];
    status?: string;
  } | null;
  onClose: () => void;
}

const AnimeDetailsModal = ({ visible, colors, anime, onClose }: AnimeDetailsModalProps) => {
  if (!anime) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Typography variant="h2">Anime Details</Typography>
            <TouchableOpacity 
              style={[styles.closeIconButton, { backgroundColor: colors.cardHover }]}
              onPress={onClose}
            >
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.detailsContainer}
            contentContainerStyle={styles.detailsContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <View style={[styles.detailCard, { backgroundColor: colors.background }]}>
              <Typography variant="h3" style={styles.titleText}>
                {anime.title}
              </Typography>
            </View>
            
            {/* Key Info Row */}
            <View style={styles.keyInfoRow}>
              {/* Rating */}
              {anime.rating !== undefined && (
                <View style={[styles.keyInfoItem, { backgroundColor: colors.background }]}>
                  <Star size={18} color={colors.warning} />
                  <Typography variant="body" style={styles.keyInfoText}>
                    {anime.rating.toFixed(1)}
                  </Typography>
                </View>
              )}
              
              {/* Year */}
              {anime.release_year && (
                <View style={[styles.keyInfoItem, { backgroundColor: colors.background }]}>
                  <Calendar size={18} color={colors.info} />
                  <Typography variant="body" style={styles.keyInfoText}>
                    {anime.release_year}
                  </Typography>
                </View>
              )}
              
              {/* Status */}
              {anime.status && (
                <View style={[styles.keyInfoItem, { backgroundColor: colors.background }]}>
                  <Activity size={18} color={
                    anime.status === 'ongoing' ? colors.success :
                    anime.status === 'completed' ? colors.info : colors.warning
                  } />
                  <Typography variant="body" style={styles.keyInfoText}>
                    {anime.status.charAt(0).toUpperCase() + anime.status.slice(1)}
                  </Typography>
                </View>
              )}
            </View>
            
            {/* Images */}
            <View style={styles.imagesContainer}>
              {anime.image_url && (
                <View style={styles.imageWrapper}>
                  <Typography variant="bodySmall" color={colors.textSecondary} style={styles.imageLabel}>
                    Poster Image
                  </Typography>
                  <Image 
                    source={{ uri: anime.image_url }} 
                    style={styles.animeImage}
                    resizeMode="cover"
                  />
                </View>
              )}
              
              {anime.cover_image_url && (
                <View style={styles.imageWrapper}>
                  <Typography variant="bodySmall" color={colors.textSecondary} style={styles.imageLabel}>
                    Cover Image
                  </Typography>
                  <Image 
                    source={{ uri: anime.cover_image_url }} 
                    style={styles.animeImage}
                    resizeMode="cover"
                  />
                </View>
              )}
            </View>
            
            {/* Genres */}
            {anime.genres && anime.genres.length > 0 && (
              <View style={[styles.detailCard, { backgroundColor: colors.background }]}>
                <View style={styles.cardHeader}>
                  <Tag size={16} color={colors.primary} />
                  <Typography variant="body" style={styles.cardHeaderText}>
                    Genres
                  </Typography>
                </View>
                <View style={styles.genresContainer}>
                  {anime.genres.map((genre, index) => (
                    <View 
                      key={index} 
                      style={[styles.genreTag, { backgroundColor: `${colors.primary}20`, borderColor: colors.primary }]}
                    >
                      <Typography variant="bodySmall" color={colors.primary}>
                        {genre}
                      </Typography>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {/* Description */}
            {anime.description && (
              <View style={[styles.detailCard, { backgroundColor: colors.background }]}>
                <View style={styles.cardHeader}>
                  <Typography variant="body" style={styles.cardHeaderText}>
                    Description
                  </Typography>
                </View>
                <Typography variant="body" style={styles.descriptionText}>
                  {anime.description}
                </Typography>
              </View>
            )}
          </ScrollView>
          
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Typography variant="button" color="#FFFFFF">
              Close
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.85,
    borderRadius: 16,
    padding: 16,
    zIndex: 1001,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  closeIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
    marginBottom: 16,
  },
  detailsContentContainer: {
    paddingBottom: 8,
  },
  detailCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderText: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  titleText: {
    fontWeight: 'bold',
  },
  descriptionText: {
    lineHeight: 20,
  },
  keyInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  keyInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  keyInfoText: {
    marginLeft: 6,
    fontWeight: 'bold',
  },
  imagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  imageWrapper: {
    width: '48%',
  },
  imageLabel: {
    marginBottom: 4,
  },
  animeImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreTag: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  closeButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
});

export default AnimeDetailsModal;
