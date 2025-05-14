import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react-native";
import ErrorMessage from "./ErrorMessage";
import { useTheme } from "@/context/ThemeProvider";

interface AuthFormProps {
  isLogin: boolean;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  errors: { email?: string; password?: string; username?: string };
  setErrors: (e: { email?: string; password?: string; username?: string }) => void;
  onSubmit: () => void;
  loading: boolean;
  toggleAuthMode: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({
  isLogin,
  email,
  setEmail,
  password,
  setPassword,
  username,
  setUsername,
  showPassword,
  setShowPassword,
  errors,
  setErrors,
  onSubmit,
  loading,
  toggleAuthMode,
}) => {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 16 }}>
      {!isLogin && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 8 }}>Username</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: errors.username ? colors.error : colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.card }}>
            <User size={18} color={colors.textSecondary} />
            <TextInput
              style={{ flex: 1, marginLeft: 8, color: colors.text }}
              placeholder="Your username"
              placeholderTextColor={colors.inactive}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (errors.username) setErrors({ ...errors, username: undefined });
              }}
              autoCapitalize="none"
            />
          </View>
          <ErrorMessage message={errors.username} />
        </View>
      )}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 8 }}>Email</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: errors.email ? colors.error : colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.card }}>
          <Mail size={18} color={colors.textSecondary} />
          <TextInput
            style={{ flex: 1, marginLeft: 8, color: colors.text }}
            placeholder="your.email@example.com"
            placeholderTextColor={colors.inactive}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>
        <ErrorMessage message={errors.email} />
      </View>
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 8 }}>Password</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: errors.password ? colors.error : colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.card }}>
          <Lock size={18} color={colors.textSecondary} />
          <TextInput
            style={{ flex: 1, marginLeft: 8, color: colors.text }}
            placeholder="Your password"
            placeholderTextColor={colors.inactive}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            secureTextEntry={!showPassword}
            autoComplete="password"
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPassword ? (
              <EyeOff size={18} color={colors.textSecondary} />
            ) : (
              <Eye size={18} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>
        <ErrorMessage message={errors.password} />
      </View>
      {/* Submit Button */}
      <TouchableOpacity
        style={{ backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16, opacity: loading ? 0.7 : 1 }}
        onPress={onSubmit}
        activeOpacity={0.8}
        disabled={loading}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
          {loading ? (isLogin ? "Signing in..." : "Creating Account...") : isLogin ? "Login" : "Create Account"}
        </Text>
      </TouchableOpacity>
      {/* Toggle Login/Register */}
      <TouchableOpacity
        onPress={toggleAuthMode}
        style={{ alignItems: 'center', marginBottom: 24 }}
        activeOpacity={0.7}
      >
        <Text style={{ color: colors.primary, fontSize: 14 }}>
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default AuthForm; 