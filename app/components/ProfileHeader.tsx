import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Edit } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeProvider';
import { UserProfile } from '../../app/types/user';

type ProfileHeaderProps = {
  profile: UserProfile | null;
  userLevel: number;
  userXp: number;
  handleEditProfile: () => void;
};

const ProfileHeader = ({ profile, userLevel, userXp, handleEditProfile }: ProfileHeaderProps) => {
  const { colors } = useTheme();

  return (
    <View style={{ alignItems: "center", marginBottom: 16, backgroundColor: colors.background }}>
      {/* Avatar with Level Badge */}
      <View style={{ position: 'relative', marginBottom: 12 }}>
        <Image
          source={{ 
            uri: profile?.avatar_url 
              ? profile.avatar_url 
              : `https://api.dicebear.com/7.x/avataaars/png?seed=${profile?.username ?? 'user'}`
          }}
          style={{ 
            width: 100, 
            height: 100, 
            borderRadius: 50,
            backgroundColor: colors.card, // Add background color for transparent avatars
            borderWidth: 3,
            borderColor: colors.background
          }}
          resizeMode="cover"
        />
        {/* Level Badge */}
        <View style={[styles.levelBadge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.levelText, { color: '#FFFFFF' }]}>{userLevel}</Text>
        </View>
      </View>
      
      <Text
        style={{
          color: colors.text,
          fontSize: 24,
          fontWeight: "bold",
          marginBottom: 4
        }}
      >
        {profile?.username ?? ''}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 8 }}>
        Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown"}
      </Text>
        
      {/* XP Progress Bar */}
      <Text style={[styles.xpLabel, { color: colors.textSecondary }]}>XP Progress</Text>
      <View style={[styles.xpContainer, { backgroundColor: colors.border }]}>
        <View 
          style={[styles.xpProgress, { 
            width: `${userXp}%`,
            backgroundColor: colors.primary 
          }]} 
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
        <Text style={[styles.xpText, { color: colors.textSecondary }]}>{userXp} / 100 XP</Text>
        <Text style={[styles.xpText, { color: colors.textSecondary }]}>Next Level: {userLevel + 1}</Text>
      </View>
      <TouchableOpacity
        style={{
          backgroundColor: colors.primary,
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 4,
          marginTop: 8,
          alignSelf: "center",
          flexDirection: "row",
          alignItems: "center",
        }}
        onPress={handleEditProfile}
      >
        <Edit size={14} color="#FFFFFF" />
        <Text
          style={{ color: "#FFFFFF", fontSize: 12, marginLeft: 4 }}
        >
          Edit Profile
        </Text>
      </TouchableOpacity>
      
      <Text style={{ color: colors.textSecondary, marginTop: 16, textAlign: 'center' }}>
        {profile?.bio || "No bio set."}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  levelBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: -5,
    bottom: -5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  levelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  xpContainer: {
    height: 8,
    width: '100%',
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 4,
    overflow: 'hidden',
  },
  xpProgress: {
    height: '100%',
    borderRadius: 4,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  xpLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
    alignSelf: 'flex-start',
  },
});

export default ProfileHeader;
