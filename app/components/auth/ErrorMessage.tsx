import React from "react";
import { View, Text } from "react-native";
import { AlertCircle } from "lucide-react-native";
import { useTheme } from "@/context/ThemeProvider";

interface ErrorMessageProps {
  message?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  const { colors } = useTheme();
  if (!message) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
      <AlertCircle size={12} color={colors.error} />
      <Text style={{ color: colors.error, fontSize: 12, marginLeft: 4 }}>{message}</Text>
    </View>
  );
};

export default ErrorMessage; 