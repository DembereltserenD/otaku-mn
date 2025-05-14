import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { X } from "lucide-react-native";
import { useTheme } from "@/context/ThemeProvider";

interface AuthHeaderProps {
  title: string;
  onClose?: () => void;
}

const AuthHeader: React.FC<AuthHeaderProps> = ({ title }) => {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>{title}</Text>
    </View>
  );
};

export default AuthHeader; 