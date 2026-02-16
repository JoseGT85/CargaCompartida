/**
 * Pantalla "Buscar Viajes" — Tab del cliente.
 * Permite buscar viajes disponibles por origen/destino.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';

import { useTripStore } from '../../features/trips/stores/useTripStore';
import { Input } from '../../shared/components/Input';
import type { Trip } from '../../types/database.types';

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

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
// TripResult Card
// ────────────────────────────────────────────────────────────────

function TripResultCard({ trip }: { trip: Trip }) {
    return (
        <TouchableOpacity className="bg-surface rounded-2xl p-4 mb-3 mx-4">
            {/* Badge de retorno */}
            {trip.direction === 'return' && (
                <View className="flex-row items-center mb-2">
                    <View className="bg-primary-600/30 px-2 py-0.5 rounded-full flex-row items-center">
                        <Text className="text-primary-300 text-xs">🔄 Viaje de Retorno — Mayor prioridad</Text>
                    </View>
                </View>
            )}

            {/* Ruta */}
            <View className="flex-row items-center mb-1">
                <Text className="text-success mr-2">🟢</Text>
                <Text className="text-white text-base font-sans-bold flex-1" numberOfLines={1}>
                    {trip.origin_name}
                </Text>
            </View>
            <View className="ml-3 border-l-2 border-gray-700 h-3 mb-1" />
            <View className="flex-row items-center mb-3">
                <Text className="text-accent mr-2">🔴</Text>
                <Text className="text-white text-base font-sans-bold flex-1" numberOfLines={1}>
                    {trip.dest_name}
                </Text>
            </View>

            {/* Stats */}
            <View className="flex-row justify-between border-t border-surface-dark pt-3">
                <View>
                    <Text className="text-gray-500 text-xs">Salida</Text>
                    <Text className="text-gray-300 text-sm">{formatDate(trip.departure_at)}</Text>
                </View>
                <View className="items-center">
                    <Text className="text-gray-500 text-xs">Espacio</Text>
                    <Text className="text-white text-sm font-sans-bold">{trip.available_kg} kg</Text>
                </View>
                <View className="items-end">
                    <Text className="text-gray-500 text-xs">Precio</Text>
                    <Text className="text-primary-400 text-sm font-sans-bold">
                        ${trip.price_per_kg}/kg
                    </Text>
                </View>
            </View>

            {/* CTA */}
            <TouchableOpacity className="bg-primary-600 rounded-xl py-2.5 mt-3 items-center">
                <Text className="text-white text-sm font-sans-bold">Ver Detalle y Reservar</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

// ────────────────────────────────────────────────────────────────
// Pantalla
// ────────────────────────────────────────────────────────────────

export default function SearchTripsScreen() {
    const { searchResults, isSearching, searchTrips } = useTripStore();
    const [originSearch, setOriginSearch] = useState('');
    const [destSearch, setDestSearch] = useState('');

    // Cargar viajes al montar
    useEffect(() => {
        searchTrips({});
    }, []);

    const handleSearch = useCallback(() => {
        // Por ahora búsqueda simple, en Fase 3+ se conectará con geocoding
        searchTrips({});
    }, []);

    return (
        <View className="flex-1 bg-surface-dark">
            {/* Barra de búsqueda */}
            <View className="px-4 pt-4 pb-2 bg-surface">
                <View className="flex-row gap-2">
                    <View className="flex-1">
                        <Input
                            label="Origen"
                            placeholder="¿Desde dónde?"
                            value={originSearch}
                            onChangeText={setOriginSearch}
                        />
                    </View>
                    <View className="flex-1">
                        <Input
                            label="Destino"
                            placeholder="¿Hacia dónde?"
                            value={destSearch}
                            onChangeText={setDestSearch}
                        />
                    </View>
                </View>
                <TouchableOpacity
                    className="bg-primary-600 rounded-xl py-3 mt-2 items-center"
                    onPress={handleSearch}
                >
                    <Text className="text-white text-base font-sans-bold">🔍 Buscar Viajes</Text>
                </TouchableOpacity>
            </View>

            {/* Resultados */}
            {isSearching ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text className="text-gray-400 mt-3">Buscando viajes disponibles...</Text>
                </View>
            ) : searchResults.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-6xl mb-4">🔍</Text>
                    <Text className="text-white text-xl font-sans-bold text-center">
                        No hay viajes disponibles
                    </Text>
                    <Text className="text-gray-400 text-center mt-2">
                        Buscá por origen y destino, o intentá más tarde.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <TripResultCard trip={item} />}
                    contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <Text className="text-gray-400 text-sm ml-4 mb-2">
                            {searchResults.length} viaje{searchResults.length !== 1 ? 's' : ''} disponible{searchResults.length !== 1 ? 's' : ''}
                        </Text>
                    }
                />
            )}
        </View>
    );
}
