/**
 * Pantalla "Mis Viajes" — Tab del chofer.
 * Lista los viajes publicados con estados y acceso a crear nuevo.
 */

import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

import { useTripStore } from '../../features/trips/stores/useTripStore';
import { useAuthStore } from '../../features/auth/stores/useAuthStore';
import type { Trip, TripStatus } from '../../types/database.types';

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TripStatus, { label: string; color: string; emoji: string }> = {
    draft: { label: 'Borrador', color: 'text-gray-400', emoji: '📝' },
    published: { label: 'Publicado', color: 'text-primary-400', emoji: '🟢' },
    in_progress: { label: 'En Curso', color: 'text-warning', emoji: '🚛' },
    completed: { label: 'Completado', color: 'text-success', emoji: '✅' },
    cancelled: { label: 'Cancelado', color: 'text-danger', emoji: '❌' },
};

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// ────────────────────────────────────────────────────────────────
// Componente TripCard
// ────────────────────────────────────────────────────────────────

function TripCard({ trip }: { trip: Trip }) {
    const status = STATUS_CONFIG[trip.status];

    return (
        <TouchableOpacity className="bg-surface rounded-2xl p-4 mb-3 mx-4">
            {/* Encabezado: estado + dirección */}
            <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                    <Text className="text-lg mr-1">{status.emoji}</Text>
                    <Text className={`text-sm font-sans-medium ${status.color}`}>
                        {status.label}
                    </Text>
                </View>
                {trip.direction === 'return' && (
                    <View className="bg-primary-600/30 px-2 py-0.5 rounded-full">
                        <Text className="text-primary-300 text-xs">🔄 Retorno</Text>
                    </View>
                )}
            </View>

            {/* Ruta */}
            <View className="flex-row items-center mb-2">
                <Text className="text-success mr-1">🟢</Text>
                <Text className="text-white text-base font-sans-bold flex-1" numberOfLines={1}>
                    {trip.origin_name}
                </Text>
            </View>
            <View className="flex-row items-center mb-3">
                <Text className="text-accent mr-1">🔴</Text>
                <Text className="text-white text-base font-sans-bold flex-1" numberOfLines={1}>
                    {trip.dest_name}
                </Text>
            </View>

            {/* Detalles */}
            <View className="flex-row justify-between border-t border-surface-dark pt-2">
                <View className="items-center">
                    <Text className="text-gray-500 text-xs">Salida</Text>
                    <Text className="text-gray-300 text-sm">{formatDate(trip.departure_at)}</Text>
                </View>
                <View className="items-center">
                    <Text className="text-gray-500 text-xs">Disponible</Text>
                    <Text className="text-white text-sm font-sans-bold">{trip.available_kg} kg</Text>
                </View>
                <View className="items-center">
                    <Text className="text-gray-500 text-xs">Precio</Text>
                    <Text className="text-primary-400 text-sm font-sans-bold">
                        ${trip.price_per_kg}/kg
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

// ────────────────────────────────────────────────────────────────
// Pantalla
// ────────────────────────────────────────────────────────────────

export default function MyTripsScreen() {
    const { myTrips, isLoadingMyTrips, fetchMyTrips } = useTripStore();
    const user = useAuthStore((s) => s.user);

    useEffect(() => {
        if (user?.id) {
            fetchMyTrips(user.id);
        }
    }, [user?.id]);

    return (
        <View className="flex-1 bg-surface-dark">
            {isLoadingMyTrips ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text className="text-gray-400 mt-3">Cargando viajes...</Text>
                </View>
            ) : myTrips.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-6xl mb-4">🚛</Text>
                    <Text className="text-white text-xl font-sans-bold text-center">
                        No tenés viajes publicados
                    </Text>
                    <Text className="text-gray-400 text-center mt-2">
                        Publicá tu viaje de retorno y aprovechá el espacio vacío de tu vehículo.
                    </Text>
                    <TouchableOpacity
                        className="bg-primary-600 rounded-2xl px-8 py-4 mt-6"
                        onPress={() => router.push('/(tabs)/create-trip' as any)}
                    >
                        <Text className="text-white text-lg font-sans-bold">
                            ➕ Publicar Viaje
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={myTrips}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <TripCard trip={item} />}
                    contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* FAB — Nuevo Viaje */}
            {myTrips.length > 0 && (
                <TouchableOpacity
                    className="absolute bottom-6 right-6 bg-primary-600 w-16 h-16 rounded-full items-center justify-center shadow-lg"
                    onPress={() => router.push('/(tabs)/create-trip' as any)}
                    style={{
                        shadowColor: '#6366f1',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                    }}
                >
                    <Text className="text-white text-3xl">+</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
