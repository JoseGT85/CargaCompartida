import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Plus, Truck, Search, MapPin, Star, ChevronRight, Route } from 'lucide-react-native';
import { useAuthStore } from '../../features/auth/stores/useAuthStore';
import { COLORS } from '../../config/constants';

// ────────────────────────────────────────────────────────────────
// Pantalla de Inicio — Dashboard funcional por rol
// ────────────────────────────────────────────────────────────────

function QuickActionCard({
    icon,
    title,
    subtitle,
    onPress,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            className="bg-card rounded-2xl p-4 flex-row items-center border border-border mb-3"
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center mr-4">
                {icon}
            </View>
            <View className="flex-1">
                <Text className="text-foreground text-base font-sans-bold">{title}</Text>
                <Text className="text-muted-foreground text-sm mt-0.5">{subtitle}</Text>
            </View>
            <ChevronRight size={20} color={COLORS.muted} />
        </TouchableOpacity>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <View className="flex-1 bg-card rounded-2xl p-4 border border-border items-center">
            <Text className="text-primary text-2xl font-sans-bold">{value}</Text>
            <Text className="text-muted-foreground text-xs mt-1">{label}</Text>
        </View>
    );
}

export default function HomeScreen() {
    const { profile } = useAuthStore();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const isDriver = profile?.role === 'driver';

    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        // Re-fetch profile data
        await useAuthStore.getState().fetchProfile(profile?.id ?? '');
        setIsRefreshing(false);
    }, [profile?.id]);

    return (
        <ScrollView
            className="flex-1 bg-background"
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={onRefresh}
                    tintColor={COLORS.primary}
                />
            }
        >
            {/* Welcome */}
            <View className="px-6 pt-6 pb-4">
                <Text className="text-foreground text-2xl font-sans-bold">
                    Hola, {profile?.full_name?.split(' ')[0] || 'Usuario'}
                </Text>
                <Text className="text-muted-foreground text-base mt-1">
                    {isDriver
                        ? 'Publicá tu viaje y monetizá tu espacio'
                        : 'Encontrá el mejor flete para tu carga'}
                </Text>
            </View>

            {/* Quick Actions */}
            <View className="px-6 mb-6">
                <Text className="text-muted-foreground text-xs font-sans-medium mb-3 tracking-wider">
                    ACCIONES RÁPIDAS
                </Text>
                {isDriver ? (
                    <>
                        <QuickActionCard
                            icon={<Plus size={24} color={COLORS.primary} />}
                            title="Publicar Viaje"
                            subtitle="Ofrecé tu espacio disponible"
                            onPress={() => router.push('/(tabs)/create-trip' as any)}
                        />
                        <QuickActionCard
                            icon={<Truck size={24} color={COLORS.primary} />}
                            title="Mis Vehículos"
                            subtitle="Administrá tu flota"
                            onPress={() => router.push('/(tabs)/my-vehicles' as any)}
                        />
                    </>
                ) : (
                    <QuickActionCard
                        icon={<Search size={24} color={COLORS.primary} />}
                        title="Buscar Viajes"
                        subtitle="Encontrá un viaje para tu carga"
                        onPress={() => router.push('/(tabs)/search-trips' as any)}
                    />
                )}
            </View>

            {/* Stats (drivers) */}
            {isDriver && profile && (
                <View className="px-6 mb-6">
                    <Text className="text-muted-foreground text-xs font-sans-medium mb-3 tracking-wider">
                        TU ACTIVIDAD
                    </Text>
                    <View className="flex-row gap-3">
                        <StatCard
                            label="Rating"
                            value={profile.rating_avg?.toFixed(1) ?? '0.0'}
                        />
                        <StatCard
                            label="Reseñas"
                            value={`${profile.rating_count ?? 0}`}
                        />
                        <StatCard
                            label="KYC"
                            value={
                                profile.kyc_status === 'approved' ? 'OK' :
                                profile.kyc_status === 'submitted' ? '...' :
                                profile.kyc_status === 'rejected' ? 'No' : '—'
                            }
                        />
                    </View>
                </View>
            )}

            {/* Priority Routes */}
            <View className="px-6 mb-6">
                <Text className="text-muted-foreground text-xs font-sans-medium mb-3 tracking-wider">
                    RUTAS PRINCIPALES
                </Text>
                <View className="bg-card rounded-2xl border border-border overflow-hidden">
                    {[
                        { route: 'Mendoza ↔ Buenos Aires', road: 'Ruta 7' },
                        { route: 'Mendoza ↔ San Rafael', road: 'Ruta 40/143' },
                        { route: 'Mendoza ↔ San Juan', road: 'Ruta 40 Norte' },
                        { route: 'Mendoza ↔ Chile', road: 'Paso Los Libertadores' },
                    ].map((item, index) => (
                        <View
                            key={item.road}
                            className={`flex-row items-center px-4 py-3 ${
                                index < 3 ? 'border-b border-border' : ''
                            }`}
                        >
                            <MapPin size={16} color={COLORS.primary} />
                            <View className="flex-1 ml-3">
                                <Text className="text-foreground text-sm font-sans-medium">{item.route}</Text>
                                <Text className="text-muted-foreground text-xs">{item.road}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}
