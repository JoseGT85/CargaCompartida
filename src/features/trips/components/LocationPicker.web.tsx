/**
 * LocationPicker — Web Fallback.
 * react-native-maps no funciona en web, así que mostramos
 * la lista de ciudades de Mendoza como selector.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { MENDOZA_CITIES } from '../../../lib/maps';
import type { GeoLocation } from '../../../shared/types/geo.types';

interface LocationPickerProps {
    title: string;
    onLocationSelected: (location: GeoLocation) => void;
    onCancel: () => void;
}

export function LocationPicker({ title, onLocationSelected, onCancel }: LocationPickerProps) {
    const [filter, setFilter] = useState('');

    const filtered = MENDOZA_CITIES.filter((c) =>
        c.name.toLowerCase().includes(filter.toLowerCase()),
    );

    const handleSelect = useCallback((city: typeof MENDOZA_CITIES[0]) => {
        onLocationSelected({
            latitude: city.latitude,
            longitude: city.longitude,
            address: city.name,
            name: city.name,
        });
    }, [onLocationSelected]);

    return (
        <View style={{ flex: 1, backgroundColor: '#1a1a2e', padding: 16 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <TouchableOpacity onPress={onCancel}>
                    <Text style={{ color: '#818cf8', fontSize: 16 }}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{title}</Text>
                <View style={{ width: 70 }} />
            </View>

            {/* Info */}
            <View style={{ backgroundColor: '#2d2d44', borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <Text style={{ color: '#fbbf24', fontSize: 14 }}>
                    ⚠️ Mapas no disponibles en web. Seleccioná una ciudad de la lista.
                </Text>
            </View>

            {/* Filtro */}
            <TextInput
                style={{
                    backgroundColor: '#2d2d44',
                    color: '#fff',
                    borderRadius: 12,
                    padding: 12,
                    fontSize: 16,
                    marginBottom: 12,
                }}
                placeholder="Filtrar ciudades..."
                placeholderTextColor="#6b7280"
                value={filter}
                onChangeText={setFilter}
            />

            {/* Lista */}
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.name}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={{
                            padding: 14,
                            borderBottomWidth: 1,
                            borderBottomColor: '#1a1a2e',
                            backgroundColor: '#2d2d44',
                        }}
                        onPress={() => handleSelect(item)}
                    >
                        <Text style={{ color: '#fff', fontSize: 16 }}>📍 {item.name}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}
