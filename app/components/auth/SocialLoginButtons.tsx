import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { useTheme } from "@/context/ThemeProvider";
import { FontAwesome } from '@expo/vector-icons';

interface SocialLoginButtonsProps {
  onSocialLogin: (provider: string) => void;
}

const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({ onSocialLogin }) => {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 16, alignItems: 'center' }}>
      <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: 16 }}>
        Or continue with
      </Text>
      <TouchableOpacity
        style={{ backgroundColor: '#fff', padding: 12, borderRadius: 12, width: 220, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2, marginBottom: 8 }}
        onPress={() => onSocialLogin('google')}
        activeOpacity={0.8}
      >
        <FontAwesome name="google" size={22} color="#EA4335" style={{ marginRight: 12 }} />
        <Text style={{ color: '#222', fontWeight: '600', fontSize: 15 }}>Continue with Google</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SocialLoginButtons; 