/**
 * Pantalla "Mis Viajes" — Tab del chofer.
 * Lista los viajes publicados con estados y acceso a crear nuevo.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Truck, Plus } from 'lucide-react-native';

import { useTripStore } from '../../features/trips/stores/useTripStore';
import { useAuthStore } from '../../features/auth/stores/useAuthStore';
import { TripCard } from '../../shared/components/TripCard';
import { COLORS } from '../../config/constants';

// ────────────────────────────────────────────────────────────────
// Pantalla
// ────────────────────────────────────────────────────────────────

export default function MyTripsScreen() {
    const { myTrips, isLoadingMyTrips, fetchMyTrips } = useTripStore();
    const user = useAuthStore((s) => s.user);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        if (user?.id) {
            fetchMyTrips(user.id);
        }
    }, [user?.id]);

    const onRefresh = async () => {
        setIsRefreshing(true);
        if (user?.id) await fetchMyTrips(user.id);
        setIsRefreshing(false);
    };

    return (
        <View className="flex-1 bg-background">
            {isLoadingMyTrips ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text className="text-muted-foreground mt-3">Cargando viajes...</Text>
                </View>
            ) : myTrips.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Truck size={48} color={COLORS.muted} />
                    <Text className="text-foreground text-xl font-sans-bold text-center mt-4">
                        No tenés viajes publicados
                    </Text>
                    <Text className="text-muted-foreground text-center mt-2">
                        Publicá tu viaje de retorno y aprovechá el espacio vacío de tu vehículo.
                    </Text>
                    <TouchableOpacity
                        className="bg-primary rounded-2xl px-8 py-4 mt-6 flex-row items-center"
                        onPress={() => router.push('/(tabs)/create-trip' as any)}
                    >
                        <Plus size={20} color={COLORS.primaryForeground} />
                        <Text className="text-primary-foreground text-lg font-sans-bold ml-2">
                            Publicar Viaje
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={myTrips}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TripCard trip={item} showStatus />
                    )}
                    contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.primary}
                        />
                    }
                />
            )}

            {/* FAB — Nuevo Viaje */}
            {myTrips.length > 0 && (
                <TouchableOpacity
                    className="absolute bottom-6 right-6 bg-primary w-16 h-16 rounded-full items-center justify-center shadow-lg"
                    onPress={() => router.push('/(tabs)/create-trip' as any)}
                    style={{
                        shadowColor: COLORS.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                    }}
                >
                    <Plus size={28} color={COLORS.primaryForeground} />
                </TouchableOpacity>
            )}
        </View>
    );
}
