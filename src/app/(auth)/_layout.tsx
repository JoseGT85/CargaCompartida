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
                contentStyle: { backgroundColor: '#1a1a2e' },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
        </Stack>
    );
}
