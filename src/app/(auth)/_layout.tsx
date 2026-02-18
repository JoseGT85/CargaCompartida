import React from 'react';
import { Stack } from 'expo-router';

// ────────────────────────────────────────────────────────────────
// Layout del grupo (auth) — Pantallas de autenticación
// Stack navigation sin headers para un look limpio
// ────────────────────────────────────────────────────────────────

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#080c17' },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="register-client" />
        </Stack>
    );
}
