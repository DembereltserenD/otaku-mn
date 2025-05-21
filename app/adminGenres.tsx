import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, ActivityIndicator } from "react-native";
import { useTheme } from "@/context/ThemeProvider";
import Typography from "@/components/Typography";
import { supabase } from "@/lib/supabase";
import { PlusCircle, Edit, Trash, Tag, ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";

interface Genre {
  name: string;
  count: number;
}

/**
 * AdminGenres component for managing anime genres
 * Allows administrators to view, add, edit, and delete genres
 */
export default function AdminGenres() {
  const { colors } = useTheme();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newGenre, setNewGenre] = useState({ name: "", description: "" });
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [showForm, setShowForm] = useState(false);

  const router = useRouter();

  // Fetch genres on component mount
  useEffect(() => {
    fetchGenres();
  }, []);

  // Fetch unique genres from anime table
  const fetchGenres = async () => {
    try {
      setLoading(true);
      
      // Get all anime with their genres
      const { data, error } = await supabase
        .from("anime")
        .select("genres");

      if (error) throw error;
      
      // Process the genres array to get unique genres with counts
      const genreCounts: Record<string, number> = {};
      
      data?.forEach(anime => {
        if (anime.genres && Array.isArray(anime.genres)) {
          anime.genres.forEach((genre: string) => {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          });
        }
      });
      
      // Convert to array of Genre objects
      const genreArray: Genre[] = Object.entries(genreCounts).map(([name, count]) => ({
        name,
        count
      }));
      
      // Sort by name
      genreArray.sort((a, b) => a.name.localeCompare(b.name));
      
      setGenres(genreArray);
    } catch (error) {
      console.error("Error fetching genres:", error);
      Alert.alert("Error", "Failed to load genres. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchGenres();
  };

  // Add a new genre - this will create a new anime with this genre
  const addGenre = async () => {
    if (!newGenre.name.trim()) {
      Alert.alert("Error", "Genre name is required");
      return;
    }

    try {
      // Check if any anime already has this genre
      const { data: existingAnime, error: checkError } = await supabase
        .from("anime")
        .select("id, genres")
        .contains("genres", [newGenre.name.trim()])
        .limit(1);

      if (checkError) throw checkError;

      if (existingAnime && existingAnime.length > 0) {
        Alert.alert("Info", `Genre '${newGenre.name.trim()}' already exists in the database.`);
        setNewGenre({ name: "", description: "" });
        setShowForm(false);
        return;
      }

      // Create a placeholder anime with this genre
      const { error } = await supabase
        .from("anime")
        .insert([{ 
          title: `Placeholder for genre: ${newGenre.name.trim()}`, 
          genres: [newGenre.name.trim()],
          description: `This is a placeholder entry to establish the genre: ${newGenre.name.trim()}. ${newGenre.description.trim()}`
        }]);

      if (error) throw error;

      // Refresh the genres list
      await fetchGenres();
      setNewGenre({ name: "", description: "" });
      setShowForm(false);
      Alert.alert("Success", "Genre added successfully");
    } catch (error) {
      console.error("Error adding genre:", error);
      Alert.alert("Error", "Failed to add genre. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update an existing genre - this will update all anime with the old genre name
  const updateGenre = async () => {
    if (!editingGenre || !editingGenre.name.trim()) {
      Alert.alert("Error", "Genre name is required");
      return;
    }

    const oldGenreName = editingGenre.name;
    const newGenreName = newGenre.name.trim();

    if (oldGenreName === newGenreName) {
      setEditingGenre(null);
      setNewGenre({ name: "", description: "" });
      return;
    }

    try {
      // Get all anime with the old genre
      const { data: animeWithGenre, error: fetchError } = await supabase
        .from("anime")
        .select("id, genres")
        .contains("genres", [oldGenreName]);

      if (fetchError) throw fetchError;

      if (!animeWithGenre || animeWithGenre.length === 0) {
        Alert.alert("Error", `No anime found with genre '${oldGenreName}'`);
        return;
      }

      // Update each anime to replace the old genre with the new one
      for (const anime of animeWithGenre) {
        const updatedGenres = anime.genres.map((g: string) => 
          g === oldGenreName ? newGenreName : g
        );

        const { error: updateError } = await supabase
          .from("anime")
          .update({ genres: updatedGenres })
          .eq("id", anime.id);

        if (updateError) throw updateError;
      }

      // Refresh the genres list
      await fetchGenres();
      setEditingGenre(null);
      setNewGenre({ name: "", description: "" });
      Alert.alert("Success", `Genre '${oldGenreName}' updated to '${newGenreName}' successfully`);
    } catch (error) {
      console.error("Error updating genre:", error);
      Alert.alert("Error", "Failed to update genre. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Delete a genre - this will remove the genre from all anime
  const deleteGenre = async (genreName: string) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete the genre '${genreName}'? This will remove it from all anime.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Get all anime with this genre
              const { data: animeWithGenre, error: fetchError } = await supabase
                .from("anime")
                .select("id, genres")
                .contains("genres", [genreName]);

              if (fetchError) throw fetchError;

              if (!animeWithGenre || animeWithGenre.length === 0) {
                Alert.alert("Error", `No anime found with genre '${genreName}'`);
                return;
              }

              // Update each anime to remove the genre
              for (const anime of animeWithGenre) {
                const updatedGenres = anime.genres.filter((g: string) => g !== genreName);

                const { error: updateError } = await supabase
                  .from("anime")
                  .update({ genres: updatedGenres })
                  .eq("id", anime.id);

                if (updateError) throw updateError;
              }

              // Refresh the genres list
              await fetchGenres();
              Alert.alert("Success", `Genre '${genreName}' deleted successfully`);
            } catch (error) {
              console.error("Error deleting genre:", error);
              Alert.alert("Error", "Failed to delete genre. Please try again.");
            }
          },
        },
      ]
    );
  };

  // Go back to admin dashboard
  const handleBack = () => {
    router.back();
  };

  // Render a genre item
  const renderGenreItem = ({ item }: { item: Genre }) => (
    <View style={[styles.genreItem, { backgroundColor: colors.card }]}>
      <View style={styles.genreInfo}>
        <Typography variant="body" style={{ fontWeight: 'bold', fontSize: 16 }}>{item.name}</Typography>
        <Typography variant="body" style={{ color: colors.textSecondary }}>
          Used in {item.count} anime
        </Typography>
      </View>
      <View style={styles.genreActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
          onPress={() => {
            setEditingGenre(item);
            setNewGenre({ name: item.name, description: "" });
          }}
        >
          <Edit size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
          onPress={() => deleteGenre(item.name)}
        >
          <Trash size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.card }]}
          onPress={handleBack}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Typography variant="h2">
          Manage Genres
        </Typography>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary + '20' }]}
          onPress={() => setShowForm(true)}
        >
          <PlusCircle size={18} color={colors.primary} />
          <Typography variant="bodySmall" style={{ color: colors.primary, marginLeft: 4 }}>
            Add Genre
          </Typography>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={[styles.genreForm, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="Genre Name"
            placeholderTextColor={colors.inactive}
            value={newGenre.name}
            onChangeText={(text) => setNewGenre({...newGenre, name: text})}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="Description (optional)"
            placeholderTextColor={colors.inactive}
            value={newGenre.description}
            onChangeText={(text) => setNewGenre({...newGenre, description: text})}
          />
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={addGenre}
          >
            <Typography variant="bodySmall" style={{ color: colors.card }}>Add Genre</Typography>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={genres}
        renderItem={renderGenreItem}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Typography variant="body" style={{ color: colors.textSecondary }}>
              No genres found. Add your first genre!
            </Typography>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  list: {
    paddingBottom: 16,
  },
  genreItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  genreInfo: {
    flex: 1,
  },
  genreHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  genreActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  genreForm: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  submitButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
  },
});
