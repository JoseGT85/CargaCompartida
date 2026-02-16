import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAuthStore } from '../../features/auth/stores/useAuthStore';

// ────────────────────────────────────────────────────────────────
// Layout del grupo (tabs) — Navegación principal con Tab Bar
// Tabs diferenciados por rol:
//   Chofer:  Inicio 🏠 | Mis Viajes 🚛 | Perfil 👤
//   Cliente: Inicio 🏠 | Buscar 🔍    | Perfil 👤
// ────────────────────────────────────────────────────────────────

export default function TabsLayout() {
    const profile = useAuthStore((s) => s.profile);
    const isDriver = profile?.role === 'driver';

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
            {/* ─── INICIO (ambos roles) ─────────────── */}
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

            {/* ─── MIS VIAJES (solo chofer) ─────────── */}
            <Tabs.Screen
                name="my-trips"
                options={{
                    title: 'Mis Viajes',
                    headerTitle: '🚛 Mis Viajes',
                    tabBarIcon: ({ color }) => (
                        <Text style={{ fontSize: 20, color }}>🚛</Text>
                    ),
                    // Ocultar para clientes
                    href: isDriver ? '/(tabs)/my-trips' : null,
                }}
            />

            {/* ─── BUSCAR (solo cliente) ────────────── */}
            <Tabs.Screen
                name="search-trips"
                options={{
                    title: 'Buscar',
                    headerTitle: '🔍 Buscar Viajes',
                    tabBarIcon: ({ color }) => (
                        <Text style={{ fontSize: 20, color }}>🔍</Text>
                    ),
                    // Ocultar para choferes
                    href: !isDriver ? '/(tabs)/search-trips' : null,
                }}
            />

            {/* ─── CREAR VIAJE (oculto del tab bar, accesible por push) */}
            <Tabs.Screen
                name="create-trip"
                options={{
                    title: 'Publicar Viaje',
                    headerTitle: '📝 Publicar Viaje',
                    href: null, // Siempre oculto del tab bar
                }}
            />

            {/* ─── PERFIL (ambos roles) ─────────────── */}
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Perfil',
                    headerTitle: '👤 Mi Perfil',
                    tabBarIcon: ({ color }) => (
                        <Text style={{ fontSize: 20, color }}>👤</Text>
                    ),
                }}
            />

            {/* ─── EDIT PROFILE (oculto) ────────────── */}
            <Tabs.Screen
                name="edit-profile"
                options={{
                    title: 'Editar Perfil',
                    href: null,
                }}
            />
            <Tabs.Screen
                name="my-vehicles"
                options={{
                    href: null, // Oculto del tab bar, accesible via navegación
                }}
            />
        </Tabs>
    );
}
```
