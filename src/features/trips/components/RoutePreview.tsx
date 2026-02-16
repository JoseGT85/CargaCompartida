/**
 * Componente para previsualizar la ruta en el mapa.
 * Muestra origen, destino y la polilínea de la ruta.
 *
 * El chofer verifica visualmente la ruta antes de publicar:
 * "Ah sí, voy por la Ruta 7, no por la 143"
 */

import React, { useRef, useEffect } from 'react';
import { View, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import type { GeoLocation, LatLng } from '../../../shared/types/geo.types';

interface RoutePreviewProps {
    /** Punto de origen */
    origin: GeoLocation;
    /** Punto de destino */
    destination: GeoLocation;
    /** Polilínea de la ruta (si está disponible vía Directions API) */
    polyline?: LatLng[];
    /** Distancia total en km */
    distanceKm?: number;
    /** Duración estimada en minutos */
    durationMinutes?: number;
    /** Nombre de la ruta (ej: "Ruta 7") */
    routeSummary?: string;
    /** Altura del mapa */
    height?: number;
}

export function RoutePreview({
    origin,
    destination,
    polyline,
    distanceKm,
    durationMinutes,
    routeSummary,
    height = 300,
}: RoutePreviewProps) {
    const mapRef = useRef<MapView>(null);

    // Ajustar el mapa para mostrar toda la ruta
    useEffect(() => {
        if (mapRef.current) {
            const coordinates = [
                { latitude: origin.latitude, longitude: origin.longitude },
                { latitude: destination.latitude, longitude: destination.longitude },
            ];

            mapRef.current.fitToCoordinates(coordinates, {
                edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
                animated: true,
            });
        }
    }, [origin, destination]);

    // Línea directa si no hay polilínea
    const routeCoordinates = polyline ?? [
        { latitude: origin.latitude, longitude: origin.longitude },
        { latitude: destination.latitude, longitude: destination.longitude },
    ];

    const formatDuration = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins} min`;
        return `${hours}h ${mins}min`;
    };

    return (
        <View className="rounded-2xl overflow-hidden bg-surface">
            <MapView
                ref={mapRef}
                className="w-full"
                style={{ height }}
                provider={PROVIDER_GOOGLE}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
            >
                {/* Marcador de Origen */}
                <Marker
                    coordinate={{
                        latitude: origin.latitude,
                        longitude: origin.longitude,
                    }}
                    title="Origen"
                    description={origin.name ?? origin.address}
                    pinColor="#10b981"
                />

                {/* Marcador de Destino */}
                <Marker
                    coordinate={{
                        latitude: destination.latitude,
                        longitude: destination.longitude,
                    }}
                    title="Destino"
                    description={destination.name ?? destination.address}
                    pinColor="#e94560"
                />

                {/* Polilínea de la ruta */}
                <Polyline
                    coordinates={routeCoordinates}
                    strokeColor="#6366f1"
                    strokeWidth={4}
                    lineDashPattern={polyline ? undefined : [10, 5]}
                />
            </MapView>

            {/* Info de la ruta */}
            <View className="flex-row justify-between px-4 py-3">
                <View className="flex-row items-center">
                    <Text className="text-success text-lg mr-1">🟢</Text>
                    <Text className="text-gray-300 text-sm" numberOfLines={1}>
                        {origin.name ?? origin.address}
                    </Text>
                </View>
                <Text className="text-gray-500 mx-2">→</Text>
                <View className="flex-row items-center">
                    <Text className="text-accent text-lg mr-1">🔴</Text>
                    <Text className="text-gray-300 text-sm" numberOfLines={1}>
                        {destination.name ?? destination.address}
                    </Text>
                </View>
            </View>

            {/* Stats de la ruta */}
            {(distanceKm || durationMinutes || routeSummary) && (
                <View className="flex-row justify-around px-4 py-2 border-t border-surface-dark">
                    {distanceKm && (
                        <View className="items-center">
                            <Text className="text-gray-500 text-xs">Distancia</Text>
                            <Text className="text-white text-base font-sans-bold">
                                {distanceKm} km
                            </Text>
                        </View>
                    )}
                    {durationMinutes && (
                        <View className="items-center">
                            <Text className="text-gray-500 text-xs">Duración est.</Text>
                            <Text className="text-white text-base font-sans-bold">
                                {formatDuration(durationMinutes)}
                            </Text>
                        </View>
                    )}
                    {routeSummary && (
                        <View className="items-center">
                            <Text className="text-gray-500 text-xs">Ruta</Text>
                            <Text className="text-primary-400 text-base font-sans-bold">
                                {routeSummary}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Advertencia si es línea directa */}
            {!polyline && (
                <View className="px-4 py-2 bg-warning/10">
                    <Text className="text-warning text-xs text-center">
                        ⚠️ Ruta estimada (sin Google Maps API). La línea es aproximada.
                    </Text>
                </View>
            )}
        </View>
    );
}
