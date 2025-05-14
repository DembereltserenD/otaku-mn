import React, { useState } from "react";
import {
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Github,
  Twitter,
  User,
  AlertCircle,
} from "lucide-react-native";
import { cn } from "@/lib/utils";
import { supabase } from '@/lib/supabase';
import AuthHeader from "./auth/AuthHeader";
import AuthForm from "./auth/AuthForm";
import SocialLoginButtons from "./auth/SocialLoginButtons";

interface AuthModalProps {
  visible?: boolean;
  onClose?: () => void;
  onLogin?: (email: string, password: string) => void;
  onRegister?: (email: string, password: string, username: string) => void;
  onSocialLogin?: (provider: string) => void;
}

/**
 * Authentication modal component for login and registration
 *
 * @param props - Component props
 * @returns AuthModal component
 */
const AuthModal = React.memo(function AuthModal({
  visible = false,
  onClose = () => {},
  onLogin = () => {},
  onRegister = () => {},
  onSocialLogin = () => {},
}: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    username?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Reset errors
    setErrors({});
    let newErrors: { email?: string; password?: string; username?: string } =
      {};
    let hasErrors = false;

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
      hasErrors = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
      hasErrors = true;
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
      hasErrors = true;
    } else if (!isLogin && password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      hasErrors = true;
    }

    // Username validation for registration
    if (!isLogin && !username.trim()) {
      newErrors.username = "Username is required";
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    // Proceed with authentication
    if (isLogin) {
      onLogin(email, password);
    } else {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      });
      if (signUpError) throw signUpError;
      // Insert into public.users
      if (data?.user) {
        const { error: dbError } = await supabase.from('users').insert({
          id: data.user.id,
          username,
        });
        if (dbError) throw dbError;
      }
      Alert.alert(
        "Success",
        "Registration successful! Please check your email to verify your account."
      );
    }

    // Add haptic feedback on submit
    try {
      const Haptics = require("expo-haptics");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Haptics not available, continue silently
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setEmail("");
    setPassword("");
    setUsername("");
    setErrors({});

    // Add haptic feedback on mode toggle
    try {
      const Haptics = require("expo-haptics");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available, continue silently
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center items-center"
        style={{ width: "100%" }}
      >
        <View className="flex-1 w-full justify-center items-center bg-black/50">
          <View className="w-[350px] bg-neutral-950 dark:bg-neutral-900 rounded-xl p-6 shadow-lg">
            <AuthHeader title={isLogin ? "Login" : "Create Account"} onClose={onClose} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <AuthForm
                isLogin={isLogin}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                username={username}
                setUsername={setUsername}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                errors={errors}
                setErrors={setErrors}
                onSubmit={handleSubmit}
                loading={loading}
                toggleAuthMode={toggleAuthMode}
              />
              <SocialLoginButtons onSocialLogin={onSocialLogin} />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

export default AuthModal;
