import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

// ────────────────────────────────────────────────────────────────
// Layout del grupo (tabs) — Navegación principal con Tab Bar
// ────────────────────────────────────────────────────────────────

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerStyle: { backgroundColor: '#16213e' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { fontWeight: '600' },
                tabBarStyle: {
                    backgroundColor: '#16213e',
                    borderTopColor: '#1a1a2e',
                    borderTopWidth: 1,
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: 60,
                },
                tabBarActiveTintColor: '#6366f1',
                tabBarInactiveTintColor: '#6b7280',
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Inicio',
                    headerTitle: '🚛 CargaCompartida',
                    tabBarIcon: ({ color }) => (
                        <Text style={{ fontSize: 20, color }}>🏠</Text>
                    ),
                }}
            />
        </Tabs>
    );
}
