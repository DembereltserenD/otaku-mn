import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Save, Camera } from "lucide-react-native";
import { useTheme } from "@/context/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const AVATAR_SEEDS = [
  "alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", "hotel", "india", "juliet",
  "kilo", "lima", "mike", "november", "oscar", "papa", "quebec", "romeo", "sierra", "tango"
];
const AVATAR_OPTIONS = AVATAR_SEEDS.map(seed => `https://api.dicebear.com/7.x/avataaars/png?seed=${seed}`);

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("username, bio, avatar_url")
        .eq("id", user.id)
        .single();
      if (error) {
        Alert.alert("Error", "Failed to load profile");
      } else if (data) {
        setUsername(data.username || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username ?? ''}`);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  // Handle back button press
  const handleBackPress = () => {
    router.back();
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("users")
      .update({ username, bio, avatar_url: avatarUrl })
      .eq("id", user.id);
    setLoading(false);
    if (error) {
      Alert.alert("Error", "Failed to update profile");
    } else {
      Alert.alert(
        "Profile Updated",
        "Your profile has been updated successfully",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      );
    }
  };

  // Handle avatar change (open avatar picker modal)
  const handleAvatarChange = () => {
    setShowAvatarPicker(true);
  };

  // Handle avatar selection from picker
  const handleAvatarSelect = async (url: string) => {
    if (!user) return;
    setShowAvatarPicker(false);
    setLoading(true);
    setAvatarUrl(url);
    try {
      const { error } = await supabase.from('users').update({ avatar_url: url }).eq('id', user.id);
      if (error) throw error;
      // Refetch profile
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      if (!fetchError && data) {
        setAvatarUrl(data.avatar_url);
      }
      Alert.alert("Avatar Changed", "Your avatar has been updated");
    } catch (err) {
      console.error('Avatar update error:', err);
      Alert.alert("Error", err instanceof Error ? err.message : 'Failed to update avatar');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            width: "100%",
            height: 60,
            backgroundColor: colors.background,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity onPress={handleBackPress}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text
            style={{ color: colors.text, fontWeight: "bold", fontSize: 18 }}
          >
            Edit Profile
          </Text>
          <TouchableOpacity onPress={handleSaveProfile}>
            <Save size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View style={{ 
            backgroundColor: colors.background,
            padding: 24,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}>
            <View style={{ alignItems: "center", marginBottom: 24 }}>
              <View style={{ position: "relative" }}>
                <Image
                  source={{ uri: avatarUrl }}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    borderWidth: 3,
                    borderColor: colors.background,
                    backgroundColor: colors.card // For transparent avatars
                  }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    backgroundColor: colors.primary,
                    borderRadius: 24,
                    padding: 10,
                    borderWidth: 2,
                    borderColor: colors.background
                  }}
                  onPress={handleAvatarChange}
                >
                  <Camera size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Avatar Picker Modal */}
          <Modal
            visible={showAvatarPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowAvatarPicker(false)}
          >
            <View style={{ 
              flex: 1, 
              backgroundColor: 'rgba(0,0,0,0.7)', 
              justifyContent: 'center', 
              alignItems: 'center' 
            }}>
              <View style={{ 
                backgroundColor: colors.card, 
                borderRadius: 20, 
                padding: 24, 
                maxHeight: 480,
                width: '85%',
                elevation: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 6
              }}>
                <Text style={{ 
                  color: colors.text, 
                  fontWeight: 'bold', 
                  fontSize: 20, 
                  marginBottom: 16, 
                  textAlign: 'center' 
                }}>
                  Choose an Avatar
                </Text>
                <FlatList
                  data={AVATAR_OPTIONS}
                  numColumns={4}
                  keyExtractor={item => item}
                  renderItem={({ item }) => (
                    <Pressable 
                      onPress={() => handleAvatarSelect(item)} 
                      style={({ pressed }) => ({
                        margin: 8,
                        opacity: pressed ? 0.8 : 1,
                        transform: [{ scale: pressed ? 0.95 : 1 }],
                        borderRadius: 30,
                        padding: 2,
                        borderWidth: avatarUrl === item ? 2 : 0,
                        borderColor: colors.primary
                      })}
                    >
                      <Image 
                        source={{ uri: item }} 
                        style={{ 
                          width: 60, 
                          height: 60, 
                          borderRadius: 30, 
                          backgroundColor: colors.background
                        }} 
                      />
                    </Pressable>
                  )}
                  contentContainerStyle={{ 
                    alignItems: 'center',
                    paddingVertical: 8 
                  }}
                />
                <TouchableOpacity
                  style={{ 
                    marginTop: 20, 
                    alignSelf: 'center',
                    backgroundColor: colors.card,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border
                  }}
                  onPress={() => setShowAvatarPicker(false)}
                >
                  <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Form Fields */}
          <View style={{ padding: 16 }}>
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  color: colors.textSecondary,
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: '500'
                }}
              >
                Username
              </Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  padding: 16,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                  fontSize: 16
                }}
                placeholderTextColor={colors.textSecondary}
                placeholder="Enter your username"
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  color: colors.textSecondary,
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: '500'
                }}
              >
                Bio
              </Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  padding: 16,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                  textAlignVertical: "top",
                  minHeight: 120,
                  fontSize: 16
                }}
                placeholderTextColor={colors.textSecondary}
                placeholder="Tell us about yourself"
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                marginTop: 8,
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3
              }}
              onPress={handleSaveProfile}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 16 }}>
                Save Changes
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
