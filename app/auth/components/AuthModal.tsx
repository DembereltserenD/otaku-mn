import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
} from "react-native";
import { Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import AuthHeader from "@/components/auth/AuthHeader";
import AuthForm from "@/components/auth/AuthForm";
import SocialLoginButtons from "@/components/auth/SocialLoginButtons";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeProvider";
import { upsertUserProfile } from '../../lib/userProfile';

interface AuthModalProps {
  visible?: boolean;
  onClose?: () => void;
}

const AuthModal = ({
  visible = false,
  onClose = () => {},
}: AuthModalProps) => {
  const router = useRouter();
  const { colors } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; username?: string }>({});
  const { user } = useAuth();

  // Automatically close modal on successful login/register
  useEffect(() => {
    if (user && visible) {
      onClose();
    }
  }, [user, visible, onClose]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      if (isLogin) {
        if (!email.trim()) {
          Alert.alert("Error", "Please enter your email");
          return;
        }
        if (!password) {
          Alert.alert("Error", "Please enter your password");
          return;
        }
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // After login, upsert user profile if not exists
        if (data.user && data.user.email) {
          await upsertUserProfile({
            id: data.user.id,
            username: data.user.user_metadata?.username || data.user.email.split('@')[0],
            avatar_url: null,
            bio: null,
          });
        }
      } else {
        if (!username.trim()) {
          Alert.alert("Error", "Please enter a username");
          return;
        }
        if (!email.trim()) {
          Alert.alert("Error", "Please enter your email");
          return;
        }
        if (password.length < 6) {
          Alert.alert("Error", "Password must be at least 6 characters");
          return;
        }
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
            },
          },
        });
        if (error) throw error;
        // Insert into public.users after signup
        if (data.user && data.user.email) {
          await upsertUserProfile({
            id: data.user.id,
            username,
            avatar_url: null,
            bio: null,
          });
        }
        Alert.alert(
          "Success",
          "Registration successful! Please check your email to verify your account."
        );
      }
      
      onClose();
      router.replace('/');
    } catch (error: unknown) {
      console.error("Auth error:", error);
      if (error instanceof Error) {
        Alert.alert("Error", error.message);
      } else if (typeof error === "string") {
        Alert.alert("Error", error);
      } else {
        Alert.alert("Error", "An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setEmail("");
    setPassword("");
    setUsername("");
  };

  if (!visible) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, justifyContent: 'center', alignItems: 'center' }} pointerEvents="box-none" accessible accessibilityViewIsModal>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, width: "100%", justifyContent: 'center', alignItems: 'center' }}
      >
        <View style={{ width: 350, backgroundColor: colors.card, borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
          <AuthHeader title={isLogin ? "Login" : "Create Account"} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 0 }}>
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
            <View style={{ marginBottom: 0 }}>
              <SocialLoginButtons onSocialLogin={() => {}} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AuthModal;
