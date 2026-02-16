/**
 * RoutePreview — Web Fallback.
 * react-native-maps no funciona en web, mostramos info textual de la ruta.
 */

import React from 'react';
import { View, Text } from 'react-native';
import type { GeoLocation } from '../../../shared/types/geo.types';

interface RoutePreviewProps {
    origin: GeoLocation;
    destination: GeoLocation;
    polyline?: number[][];
    distanceKm?: number;
    durationMinutes?: number;
    routeSummary?: string;
}

export function RoutePreview({
    origin,
    destination,
    distanceKm,
    durationMinutes,
    routeSummary,
}: RoutePreviewProps) {
    return (
        <View style={{ backgroundColor: '#2d2d44', borderRadius: 16, padding: 16 }}>
            {/* Info de ruta */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ color: '#22c55e', fontSize: 12, fontWeight: '600' }}>ORIGEN</Text>
                    <Text style={{ color: '#fff', fontSize: 14, marginTop: 2 }}>
                        {origin.name ?? origin.address}
                    </Text>
                </View>
                <Text style={{ color: '#6b7280', fontSize: 20, marginHorizontal: 8 }}>→</Text>
                <View style={{ flex: 1 }}>
                    <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}>DESTINO</Text>
                    <Text style={{ color: '#fff', fontSize: 14, marginTop: 2 }}>
                        {destination.name ?? destination.address}
                    </Text>
                </View>
            </View>

            {/* Stats */}
            <View style={{ flexDirection: 'row', gap: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1a1a2e' }}>
                {distanceKm != null && (
                    <View>
                        <Text style={{ color: '#6b7280', fontSize: 12 }}>Distancia</Text>
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{distanceKm} km</Text>
                    </View>
                )}
                {durationMinutes != null && (
                    <View>
                        <Text style={{ color: '#6b7280', fontSize: 12 }}>Duración</Text>
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                            {Math.floor(durationMinutes / 60)}h {Math.round(durationMinutes % 60)}m
                        </Text>
                    </View>
                )}
                {routeSummary && (
                    <View>
                        <Text style={{ color: '#6b7280', fontSize: 12 }}>Ruta</Text>
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{routeSummary}</Text>
                    </View>
                )}
            </View>

            {/* Nota web */}
            <Text style={{ color: '#fbbf24', fontSize: 12, marginTop: 12, textAlign: 'center' }}>
                ⚠️ Mapa no disponible en web — usá la app móvil para ver la ruta
            </Text>
        </View>
    );
}
