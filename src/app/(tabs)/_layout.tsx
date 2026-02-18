import { Tabs } from 'expo-router';
import { Home, Search, Truck, User } from 'lucide-react-native';
import React from 'react';
import { COLORS } from '../../config/constants';
import { useAuthStore } from '../../features/auth/stores/useAuthStore';

// ────────────────────────────────────────────────────────────────
// Layout del grupo (tabs) — Navegación principal con Tab Bar
// Tabs diferenciados por rol:
//   Chofer:  Inicio | Mis Viajes | Perfil
//   Cliente: Inicio | Buscar     | Perfil
// ────────────────────────────────────────────────────────────────

export default function TabsLayout() {
    const profile = useAuthStore((s) => s.profile);
    const isDriver = profile?.role === 'driver';

    return (
        <Tabs
            screenOptions={{
                headerStyle: { backgroundColor: COLORS.card },
                headerTintColor: COLORS.foreground,
                headerTitleStyle: { fontWeight: '600' },
                tabBarStyle: {
                    backgroundColor: COLORS.card,
                    borderTopColor: COLORS.surfaceDark,
                    borderTopWidth: 1,
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: 60,
                },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: '#6b7280',
            }}
        >
            {/* ─── INICIO (ambos roles) ─────────────── */}
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Inicio',
                    headerTitle: 'CargaCompartida',
                    tabBarIcon: ({ color }) => (
                        <Home size={22} color={color} />
                    ),
                }}
            />

            {/* ─── MIS VIAJES (solo chofer) ─────────── */}
            <Tabs.Screen
                name="my-trips"
                options={{
                    title: 'Mis Viajes',
                    headerTitle: 'Mis Viajes',
                    tabBarIcon: ({ color }) => (
                        <Truck size={22} color={color} />
                    ),
                    href: isDriver ? '/(tabs)/my-trips' : null,
                }}
            />

            {/* ─── BUSCAR (solo cliente) ────────────── */}
            <Tabs.Screen
                name="search-trips"
                options={{
                    title: 'Buscar',
                    headerTitle: 'Buscar Viajes',
                    tabBarIcon: ({ color }) => (
                        <Search size={22} color={color} />
                    ),
                    href: !isDriver ? '/(tabs)/search-trips' : null,
                }}
            />

            {/* ─── CREAR VIAJE (oculto del tab bar, accesible por push) */}
            <Tabs.Screen
                name="create-trip"
                options={{
                    title: 'Publicar Viaje',
                    headerTitle: 'Publicar Viaje',
                    href: null,
                }}
            />

            {/* ─── CREAR PEDIDO (oculto del tab bar, accesible por push) */}
            <Tabs.Screen
                name="create-shipment"
                options={{
                    title: 'Crear Pedido',
                    headerTitle: 'Crear Pedido de Envío',
                    href: null,
                }}
            />

            {/* ─── PERFIL (ambos roles) ─────────────── */}
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Perfil',
                    headerTitle: 'Mi Perfil',
                    tabBarIcon: ({ color }) => (
                        <User size={22} color={color} />
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
                    href: null,
                }}
            />
        </Tabs>
    );
}
