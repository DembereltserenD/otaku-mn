import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Settings } from "lucide-react-native";
import { useTheme } from "@/context/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import AuthModal from "@/components/AuthModal";
import useFavorites from "../hooks/useFavorites";
import useUserAnimeLists from "@/hooks/useUserAnimeLists";
import useAchievements from "../hooks/useAchievements";
import { Achievement } from "../app/types/achievements";
import { UserProfile } from "./types/user";
import ProfileHeader from "./components/ProfileHeader";
import ProfileAchievements from "./components/ProfileAchievements";
import ProfileLists from "./components/ProfileLists";
import AchievementModal from "./components/AchievementModal";

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'stats' | 'achievements'>('stats');
  const { favorites } = useFavorites();
  const { lists } = useUserAnimeLists();
  const { 
    achievements, 
    loading: achievementsLoading, 
    getUnlockedAchievements, 
    getNextAchievements 
  } = useAchievements();
  
  // Count of anime in each list
  const watchingCount = lists?.watching?.length || 0;
  const completedCount = lists?.completed?.length || 0;
  const planToWatchCount = lists?.plan_to_watch?.length || 0;
  const favoritesCount = favorites?.length || 0;
  const totalWatchedCount = watchingCount + completedCount;
  
  // Memoize achievement calculations
  const unlockedAchievements = React.useMemo(() => getUnlockedAchievements(), [achievements]);
  const nextAchievements = React.useMemo(() => getNextAchievements(), [achievements]);
  
  // Calculate user level based on achievements and watched anime
  const userLevel = profile?.level || Math.max(1, Math.floor((unlockedAchievements.length / 2) + (totalWatchedCount / 5)));
  const userXp = profile?.xp || Math.min(100, ((unlockedAchievements.length * 10) + (totalWatchedCount * 5)) % 100);

  useEffect(() => {
    if (!user && !authLoading) {
      setShowAuthModal(true);
      setLoading(false);
      return;
    }
    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, showAuthModal]);

  const fetchProfile = async () => {
    setLoading(true);
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    
    try {
      // Fetch user profile from Supabase
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }
      
      if (!data) {
        throw new Error("No profile data found");
      }
      
      console.log("Fetched profile data:", data);
      setProfile(data);
      
      // If avatar_url is null but we have a username, check if we need to update it
      if (!data.avatar_url && data.username) {
        // Generate a DiceBear avatar URL based on username
        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${data.username}`;
        
        // Update the user's avatar_url in Supabase
        const { error: updateError } = await supabase
          .from("users")
          .update({ avatar_url: avatarUrl })
          .eq("id", user.id);
          
        if (updateError) {
          console.error("Error updating avatar URL:", updateError);
        } else {
          // Update local state with the new avatar URL
          setProfile({ ...data, avatar_url: avatarUrl });
          console.log("Updated avatar URL to:", avatarUrl);
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setProfile(null);
      Alert.alert(
        "Profile not found",
        "No profile found for this user. Please contact support or create a profile."
      );
    } finally {
      setLoading(false);
    }
  };

  if (showAuthModal) {
    return <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />;
  }

  if (authLoading || loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Handle back button press
  const handleBackPress = () => {
    router.back();
  };

  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/");
          }
        }
      ]
    );
  };

  // Handle edit profile
  const handleEditProfile = () => {
    router.push("/edit-profile");
  };

  // Handle settings
  const handleSettings = () => {
    router.push("/settings");
  };
  
  // Handle achievement press
  const handleAchievementPress = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowAchievementModal(true);
  };
  
  // Handle tab change
  const handleProfileTabChange = (tab: 'stats' | 'achievements') => {
    setActiveProfileTab(tab);
  };
  
  // Handle list navigation
  const handleListNavigation = (listType: string) => {
    switch (listType) {
      case "Currently Watching":
        router.push("/library?tab=watching");
        break;
      case "Completed":
        router.push("/library?tab=completed");
        break;
      case "Plan to Watch":
        router.push("/library?tab=plan_to_watch");
        break;
      case "Favorites":
        router.push("/library?tab=favorites");
        break;
      default:
        Alert.alert(listType, `${listType} functionality coming soon`);
    }
  };

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
            Profile
          </Text>
          <TouchableOpacity onPress={handleSettings}>
            <Settings size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Profile Header - Enhanced with level and XP */}
          <View
            style={{
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              backgroundColor: colors.background,
              borderRadius: 0,
            }}
          >
            <ProfileHeader 
              profile={profile}
              userLevel={userLevel}
              userXp={userXp}
              handleEditProfile={handleEditProfile}
            />
            
            {/* Tab Navigation */}
            <View style={{ 
              flexDirection: 'row',
              marginTop: 24,
              marginBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border
            }}>
              <TouchableOpacity 
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: 'center',
                  borderBottomWidth: 2,
                  borderBottomColor: activeProfileTab === 'stats' ? colors.primary : 'transparent',
                }}
                onPress={() => handleProfileTabChange('stats')}
              >
                <Text style={{ 
                  fontSize: 16,
                  fontWeight: '500',
                  color: activeProfileTab === 'stats' ? colors.primary : colors.textSecondary 
                }}>Stats</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: 'center',
                  borderBottomWidth: 2,
                  borderBottomColor: activeProfileTab === 'achievements' ? colors.primary : 'transparent',
                }}
                onPress={() => handleProfileTabChange('achievements')}
              >
                <Text style={{ 
                  fontSize: 16,
                  fontWeight: '500',
                  color: activeProfileTab === 'achievements' ? colors.primary : colors.textSecondary 
                }}>Achievements</Text>
              </TouchableOpacity>
            </View>
            
            {/* Tab Content */}
            <View style={{ marginTop: 16 }}>
              {activeProfileTab === 'stats' ? (
                /* Stats Tab */
                <View style={{ paddingHorizontal: 16 }}>
                  {/* Stats */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      padding: 8
                    }}
                  >
                    <View style={{ alignItems: "center" }}>
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 18,
                          fontWeight: "bold",
                        }}
                      >
                        {totalWatchedCount}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                        Watched
                      </Text>
                    </View>
                    <View style={{ alignItems: "center" }}>
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 18,
                          fontWeight: "bold",
                        }}
                      >
                        {favoritesCount}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                        Favorites
                      </Text>
                    </View>
                    <View style={{ alignItems: "center" }}>
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 18,
                          fontWeight: "bold",
                        }}
                      >
                        {planToWatchCount}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                        Plan to Watch
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                /* Achievements Tab */
                <View style={{ paddingHorizontal: 16 }}>
                  <ProfileAchievements
                    achievements={achievements}
                    unlockedAchievements={unlockedAchievements}
                    nextAchievements={nextAchievements}
                    handleAchievementPress={handleAchievementPress}
                  />
                </View>
              )}
            </View>
          </View>

          {/* Lists Section */}
          <ProfileLists
            watchingCount={watchingCount}
            completedCount={completedCount}
            planToWatchCount={planToWatchCount}
            favoritesCount={favoritesCount}
            handleListNavigation={handleListNavigation}
            handleLogout={handleLogout}
          />

          {/* Bottom padding to ensure content is visible above the navigation bar */}
          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
      
      {/* Achievement Modal */}
      <AchievementModal 
        visible={showAchievementModal} 
        achievement={selectedAchievement} 
        onClose={() => setShowAchievementModal(false)} 
      />
    </SafeAreaView>
  );
}
