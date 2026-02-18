/**
 * Pantalla "Buscar Viajes" — Tab del cliente.
 * Permite buscar viajes disponibles por origen/destino.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Search } from 'lucide-react-native';

import { useTripStore } from '../../features/trips/stores/useTripStore';
import { Input } from '../../shared/components/Input';
import { TripCard } from '../../shared/components/TripCard';
import { COLORS } from '../../config/constants';

// ────────────────────────────────────────────────────────────────
// Pantalla
// ────────────────────────────────────────────────────────────────

export default function SearchTripsScreen() {
    const { searchResults, isSearching, searchTrips } = useTripStore();
    const [originSearch, setOriginSearch] = useState('');
    const [destSearch, setDestSearch] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Cargar viajes al montar
    useEffect(() => {
        searchTrips({});
    }, []);

    const handleSearch = useCallback(() => {
        searchTrips({});
    }, [searchTrips]);

    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await searchTrips({});
        setIsRefreshing(false);
    }, [searchTrips]);

    // Filtrar resultados client-side por texto de origen/destino
    const filteredResults = useMemo(() => {
        if (!originSearch.trim() && !destSearch.trim()) return searchResults;

        return searchResults.filter((trip) => {
            const matchesOrigin = !originSearch.trim() ||
                trip.origin_name?.toLowerCase().includes(originSearch.toLowerCase().trim());
            const matchesDest = !destSearch.trim() ||
                trip.dest_name?.toLowerCase().includes(destSearch.toLowerCase().trim());
            return matchesOrigin && matchesDest;
        });
    }, [searchResults, originSearch, destSearch]);

    return (
        <View className="flex-1 bg-background">
            {/* Barra de búsqueda */}
            <View className="px-4 pt-4 pb-2 bg-card border-b border-border">
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
                    className="bg-primary rounded-xl py-3 mt-2 items-center flex-row justify-center"
                    onPress={handleSearch}
                >
                    <Search size={18} color={COLORS.primaryForeground} />
                    <Text className="text-primary-foreground text-base font-sans-bold ml-2">Buscar Viajes</Text>
                </TouchableOpacity>
            </View>

            {/* Resultados */}
            {isSearching ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text className="text-muted-foreground mt-3">Buscando viajes disponibles...</Text>
                </View>
            ) : filteredResults.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Search size={48} color={COLORS.muted} />
                    <Text className="text-foreground text-xl font-sans-bold text-center mt-4">
                        No hay viajes disponibles
                    </Text>
                    <Text className="text-muted-foreground text-center mt-2">
                        {originSearch || destSearch
                            ? 'No se encontraron viajes con esos criterios. Probá con otros términos.'
                            : 'Buscá por origen y destino, o intentá más tarde.'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredResults}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TripCard trip={item} showBookButton />
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
                    ListHeaderComponent={
                        <Text className="text-muted-foreground text-sm ml-4 mb-2">
                            {filteredResults.length} viaje{filteredResults.length !== 1 ? 's' : ''} disponible{filteredResults.length !== 1 ? 's' : ''}
                        </Text>
                    }
                />
            )}
        </View>
    );
}
