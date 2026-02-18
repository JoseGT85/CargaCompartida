import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../features/auth/stores/useAuthStore';
import { COLORS } from '../config/constants';
import '../../global.css';

// ────────────────────────────────────────────────────────────────
// Root Layout — CargaCompartida
//
// Protección de rutas:
// - Sin sesión → redirige a /(auth)/login
// - Con sesión → redirige a /(tabs)/home
// ────────────────────────────────────────────────────────────────

function AuthGuard({ children }: { children: React.ReactNode }) {
    const { session, isLoading, isInitialized } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (!isInitialized) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!session && !inAuthGroup) {
            // Sin sesión y fuera del grupo auth → ir a login
            router.replace('/(auth)/login');
        } else if (session && inAuthGroup) {
            // Con sesión y en grupo auth → ir a home
            router.replace('/(tabs)/home');
        }
    }, [session, isInitialized, segments]);

    // Pantalla de carga SOLO durante la inicialización de sesión.
    // No bloquear durante signIn/signUp — esas pantallas manejan su propio isLoading.
    if (!isInitialized) {
        return (
            <View className="flex-1 items-center justify-center bg-surface-dark">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return <>{children}</>;
}

export default function RootLayout() {
    const initialize = useAuthStore((state) => state.initialize);

    useEffect(() => {
        const cleanup = initialize();
        return () => {
            if (typeof cleanup === 'function') {
                cleanup();
            }
        };
    }, []);

    return (
        <>
            <StatusBar style="light" />
            <AuthGuard>
                <Slot />
            </AuthGuard>
        </>
    );
}
