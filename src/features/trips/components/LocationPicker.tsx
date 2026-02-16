/**
 * Componente de selección de ubicación en mapa.
 * Permite al chofer seleccionar Origen/Destino tocando el mapa.
 *
 * Soporta dos modos:
 * 1. Con Google Maps API → Geocoding + polilínea de ruta
 * 2. Sin API / Offline → Selección manual con coordenadas + ciudades frecuentes
 */

import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, MapPressEvent, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { geocodeAddress, reverseGeocode, MENDOZA_CITIES } from '../../lib/maps';
import type { GeoLocation } from '../types/geo.types';

// ────────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────────

interface LocationPickerProps {
    /** Título del picker (ej: "Seleccionar Origen") */
    title: string;
    /** Ubicación inicial del mapa */
    initialRegion?: Region;
    /** Callback al confirmar una ubicación */
    onLocationSelected: (location: GeoLocation) => void;
    /** Callback para cancelar */
    onCancel: () => void;
}

/** Centro de Mendoza */
const DEFAULT_REGION: Region = {
    latitude: -32.8908,
    longitude: -68.8272,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
};

// ────────────────────────────────────────────────────────────────
// Componente
// ────────────────────────────────────────────────────────────────

export function LocationPicker({
    title,
    initialRegion,
    onLocationSelected,
    onCancel,
}: LocationPickerProps) {
    const mapRef = useRef<MapView>(null);
    const [selectedLocation, setSelectedLocation] = useState<GeoLocation | null>(null);
    const [searchText, setSearchText] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [showCities, setShowCities] = useState(false);

    // Seleccionar punto en el mapa (touch)
    const handleMapPress = useCallback(async (event: MapPressEvent) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;

        // Intentar reverse geocoding
        const result = await reverseGeocode(latitude, longitude);

        setSelectedLocation({
            latitude,
            longitude,
            address: result?.formattedAddress ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            name: result?.name,
        });
    }, []);

    // Buscar por texto
    const handleSearch = useCallback(async () => {
        if (!searchText.trim()) return;

        setIsSearching(true);
        const results = await geocodeAddress(searchText);
        setIsSearching(false);

        if (results.length > 0) {
            const first = results[0];
            setSelectedLocation({
                latitude: first.latitude,
                longitude: first.longitude,
                address: first.formattedAddress,
                name: first.name,
            });

            // Animar mapa hacia el resultado
            mapRef.current?.animateToRegion({
                latitude: first.latitude,
                longitude: first.longitude,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
            }, 500);
        } else {
            Alert.alert(
                'Sin resultados',
                'No se encontró la dirección. Intentá seleccionar el punto en el mapa o elegí una ciudad de la lista.',
            );
            setShowCities(true);
        }
    }, [searchText]);

    // Seleccionar ciudad de la lista (fallback offline)
    const handleCitySelect = useCallback((city: typeof MENDOZA_CITIES[0]) => {
        setSelectedLocation({
            latitude: city.latitude,
            longitude: city.longitude,
            address: city.name,
            name: city.name,
        });

        mapRef.current?.animateToRegion({
            latitude: city.latitude,
            longitude: city.longitude,
            latitudeDelta: 0.15,
            longitudeDelta: 0.15,
        }, 500);

        setShowCities(false);
    }, []);

    // Confirmar selección
    const handleConfirm = useCallback(() => {
        if (selectedLocation) {
            onLocationSelected(selectedLocation);
        }
    }, [selectedLocation, onLocationSelected]);

    return (
        <View className="flex-1 bg-surface-dark">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-surface">
                <TouchableOpacity onPress={onCancel}>
                    <Text className="text-primary-400 text-base">Cancelar</Text>
                </TouchableOpacity>
                <Text className="text-white text-lg font-sans-bold">{title}</Text>
                <TouchableOpacity
                    onPress={handleConfirm}
                    disabled={!selectedLocation}
                >
                    <Text className={`text-base font-sans-bold ${selectedLocation ? 'text-primary-400' : 'text-gray-600'}`}>
                        Confirmar
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Barra de búsqueda */}
            <View className="flex-row px-4 py-2 bg-surface-dark">
                <TextInput
                    className="flex-1 bg-surface rounded-xl px-4 py-3 text-white text-base mr-2"
                    placeholder="Buscar dirección o ciudad..."
                    placeholderTextColor="#6b7280"
                    value={searchText}
                    onChangeText={setSearchText}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
                <TouchableOpacity
                    className="bg-primary-600 px-4 rounded-xl justify-center"
                    onPress={handleSearch}
                    disabled={isSearching}
                >
                    {isSearching ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text className="text-white text-lg">🔍</Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    className="bg-surface-light px-3 rounded-xl justify-center ml-2"
                    onPress={() => setShowCities(!showCities)}
                >
                    <Text className="text-white text-lg">📋</Text>
                </TouchableOpacity>
            </View>

            {/* Lista de ciudades (fallback offline) */}
            {showCities && (
                <View className="max-h-48 bg-surface mx-4 rounded-xl mb-2">
                    <FlatList
                        data={MENDOZA_CITIES}
                        keyExtractor={(item) => item.name}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                className="px-4 py-3 border-b border-surface-dark"
                                onPress={() => handleCitySelect(item)}
                            >
                                <Text className="text-white text-base">📍 {item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {/* Mapa */}
            <View className="flex-1">
                <MapView
                    ref={mapRef}
                    className="flex-1"
                    provider={PROVIDER_GOOGLE}
                    initialRegion={initialRegion ?? DEFAULT_REGION}
                    onPress={handleMapPress}
                    showsUserLocation
                    showsMyLocationButton
                    mapPadding={{ top: 0, right: 0, bottom: 100, left: 0 }}
                >
                    {selectedLocation && (
                        <Marker
                            coordinate={{
                                latitude: selectedLocation.latitude,
                                longitude: selectedLocation.longitude,
                            }}
                            title={selectedLocation.name ?? 'Punto seleccionado'}
                            description={selectedLocation.address}
                        />
                    )}
                </MapView>
            </View>

            {/* Info del punto seleccionado */}
            {selectedLocation && (
                <View className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl p-4 shadow-lg">
                    <Text className="text-primary-400 text-sm font-sans-medium">
                        📍 Punto seleccionado
                    </Text>
                    <Text className="text-white text-lg font-sans-bold mt-1">
                        {selectedLocation.name ?? 'Ubicación'}
                    </Text>
                    <Text className="text-gray-400 text-sm mt-1" numberOfLines={2}>
                        {selectedLocation.address}
                    </Text>
                    <TouchableOpacity
                        className="bg-primary-600 rounded-xl py-3 mt-3 items-center"
                        onPress={handleConfirm}
                    >
                        <Text className="text-white text-base font-sans-bold">
                            ✅ Confirmar {title.replace('Seleccionar ', '')}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
