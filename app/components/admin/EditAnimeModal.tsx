import React from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import Typography from '@/components/Typography';
import { X } from 'lucide-react-native';
import SimpleModal from './SimpleModal';

interface EditAnimeModalProps {
  visible: boolean;
  colors: any;
  currentAnime: {
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
  onChangeAnime: (field: string, value: any) => void;
  onSubmit: () => void;
}

const EditAnimeModal = ({ 
  visible, 
  colors, 
  currentAnime, 
  onClose, 
  onChangeAnime, 
  onSubmit 
}: EditAnimeModalProps) => {
  if (!visible || !currentAnime) return null;
  
  return (
    <SimpleModal
      visible={visible}
      onClose={onClose}
      backgroundColor={colors.card}
    >
      <View style={styles.modalHeader}>
        <Typography variant="h2">Edit Anime</Typography>
        <TouchableOpacity onPress={onClose}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      {/* Title */}
      <View style={styles.formField}>
        <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
          Title *
        </Typography>
        <TextInput
          style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
          placeholder="Enter anime title"
          placeholderTextColor={colors.textSecondary}
          value={currentAnime.title}
          onChangeText={(text) => onChangeAnime('title', text)}
        />
      </View>
      
      {/* Description */}
      <View style={styles.formField}>
        <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
          Description
        </Typography>
        <TextInput
          style={[styles.textInput, styles.textArea, { color: colors.text, borderColor: colors.border }]}
          placeholder="Enter description"
          placeholderTextColor={colors.textSecondary}
          value={currentAnime.description}
          onChangeText={(text) => onChangeAnime('description', text)}
          multiline
          numberOfLines={4}
        />
      </View>
      
      {/* Image URL */}
      <View style={styles.formField}>
        <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
          Image URL
        </Typography>
        <TextInput
          style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
          placeholder="Enter image URL"
          placeholderTextColor={colors.textSecondary}
          value={currentAnime.image_url}
          onChangeText={(text) => onChangeAnime('image_url', text)}
        />
      </View>
      
      {/* Cover Image URL */}
      <View style={styles.formField}>
        <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
          Cover Image URL
        </Typography>
        <TextInput
          style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
          placeholder="Enter cover image URL"
          placeholderTextColor={colors.textSecondary}
          value={currentAnime.cover_image_url}
          onChangeText={(text) => onChangeAnime('cover_image_url', text)}
        />
      </View>
      
      {/* Release Year */}
      <View style={styles.formField}>
        <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
          Release Year
        </Typography>
        <TextInput
          style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
          placeholder="Enter release year"
          placeholderTextColor={colors.textSecondary}
          value={currentAnime.release_year?.toString()}
          onChangeText={(text) => onChangeAnime('release_year', parseInt(text) || new Date().getFullYear())}
          keyboardType="numeric"
        />
      </View>
      
      {/* Genres */}
      <View style={styles.formField}>
        <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
          Genres (comma separated)
        </Typography>
        <TextInput
          style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
          placeholder="Action, Adventure, Comedy"
          placeholderTextColor={colors.textSecondary}
          value={currentAnime.genres?.join(', ')}
          onChangeText={(text) => {
            const genres = text.split(',').map(genre => genre.trim()).filter(genre => genre);
            onChangeAnime('genres', genres);
          }}
        />
      </View>
      
      {/* Status */}
      <View style={styles.formField}>
        <Typography variant="bodySmall" color={colors.textSecondary} style={styles.fieldLabel}>
          Status
        </Typography>
        <View style={styles.statusOptions}>
          {['ongoing', 'completed', 'upcoming'].map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusOption,
                currentAnime.status === status && { 
                  backgroundColor: `${colors.primary}20`,
                  borderColor: colors.primary
                },
                { borderColor: colors.border }
              ]}
              onPress={() => onChangeAnime('status', status)}
            >
              <Typography
                variant="bodySmall"
                style={styles.statusLabel}
                color={currentAnime.status === status ? colors.primary : colors.text}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: colors.primary }]}
        onPress={onSubmit}
      >
        <Typography variant="button" color="#FFFFFF">
          Update Anime
        </Typography>
      </TouchableOpacity>
    </SimpleModal>
  );
};

const styles = StyleSheet.create({
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
    marginBottom: 4,
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
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  statusOption: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  statusLabel: {
    textAlign: 'center',
  },
  submitButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
});

export default EditAnimeModal;
