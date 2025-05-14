import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import AuthModal from '@/auth/components/AuthModal';

export default function LoginScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(true);

  useEffect(() => {
    if (user && !isLoading) {
      router.replace('/profile');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <AuthModal visible={modalVisible} onClose={() => {}} />
    </View>
  );
} 