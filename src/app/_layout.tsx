/**
 * Root Layout — CargaCompartida
 * AuthGuard con detección de perfil incompleto
 */

import { router, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { COLORS } from '../config/constants';
import { useAuthStore } from '../features/auth/stores/useAuthStore';

import '../../global.css';

// ────────────────────────────────────────────────────────────────
// AuthGuard — Redirección inteligente
// Sin sesión → login
// Con sesión + perfil incompleto → complete-profile
// Con sesión + perfil completo → home
// ────────────────────────────────────────────────────────────────

function AuthGuard({ children }: { children: React.ReactNode }) {
    const segments = useSegments() as string[];
    const { session, isInitialized, needsProfileCompletion } = useAuthStore();

    useEffect(() => {
        if (!isInitialized) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!session && !inAuthGroup) {
            // Sin sesión y fuera del grupo auth → ir a login
            router.replace('/(auth)/login');
        } else if (session && needsProfileCompletion) {
            // Con sesión pero perfil incompleto → completar perfil
            if (segments[1] !== 'complete-profile') {
                router.replace('/(auth)/complete-profile' as any);
            }
        } else if (session && !needsProfileCompletion && inAuthGroup) {
            // Con sesión, perfil completo, y en grupo auth → ir a home
            router.replace('/(tabs)/home');
        }
    }, [session, isInitialized, needsProfileCompletion, segments]);

    return <>{children}</>;
}

export default function RootLayout() {
    const { initialize, isInitialized } = useAuthStore();

    useEffect(() => {
        const cleanup = initialize();
        return cleanup;
    }, []);

    // Splash mientras se inicializa
    if (!isInitialized) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <AuthGuard>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
            </Stack>
        </AuthGuard>
    );
}
