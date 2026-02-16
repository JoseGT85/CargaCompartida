/**
 * Pantalla de creación/publicación de viaje — Driver Flow.
 *
 * UX diseñada para choferes:
 * - Inputs grandes y claros
 * - Selección de Origen/Destino con mapa
 * - Previsualización de ruta antes de publicar
 * - Indicador visual de viaje de retorno (backhaul ×1.5)
 */

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Modal,
} from 'react-native';
import { router } from 'expo-router';

import { useTripStore } from '../stores/useTripStore';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { createTripSchema } from '../types/trip.schema';
import { getDirections } from '../../../lib/maps';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { DateTimePickerInput } from '../../../shared/components/DateTimePickerInput';
import { LocationPicker } from '../components/LocationPicker';
import { VehiclePicker } from '../components/VehiclePicker';
import { useVehicleStore } from '../../vehicles/stores/useVehicleStore';
import { RoutePreview } from '../components/RoutePreview';
import type { GeoLocation } from '../../../shared/types/geo.types';
import type { TripDirection } from '../../../types/database.types';

// ────────────────────────────────────────────────────────────────
// Componente
// ────────────────────────────────────────────────────────────────

export default function CreateTripScreen() {
    const { draft, updateDraft, publishTrip, resetDraft, isSubmitting } = useTripStore();
    const profile = useAuthStore((s) => s.profile);

    // UI State
    const [showOriginPicker, setShowOriginPicker] = useState(false);
    const [showDestPicker, setShowDestPicker] = useState(false);
    const [showVehiclePicker, setShowVehiclePicker] = useState(false);
    const [selectedVehicleInfo, setSelectedVehicleInfo] = useState<{ name: string, plate: string } | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);

    // ─── Selección de ubicaciones ──────────────────
    const handleOriginSelected = useCallback(async (location: GeoLocation) => {
        updateDraft({ origin: location });
        setShowOriginPicker(false);

        // Si ya tenemos destino, calcular ruta
        if (draft.destination) {
            await fetchRoute(location, draft.destination);
        }
    }, [draft.destination, updateDraft]);

    const handleDestSelected = useCallback(async (location: GeoLocation) => {
        updateDraft({ destination: location });
        setShowDestPicker(false);

        // Si ya tenemos origen, calcular ruta
        if (draft.origin) {
            await fetchRoute(draft.origin, location);
        }
    }, [draft.origin, updateDraft]);

    // ─── Calcular ruta ─────────────────────────────
    const fetchRoute = async (origin: GeoLocation, dest: GeoLocation) => {
        setIsLoadingRoute(true);
        const result = await getDirections(origin, dest);

        if (result) {
            updateDraft({
                routePolyline: result.polyline,
                distanceKm: result.distanceKm,
                durationMinutes: result.durationMinutes,
                routeSummary: result.summary,
            });
        } else {
            // Offline: estimar distancia en línea recta
            const R = 6371; // Radio de la Tierra en km
            const dLat = ((dest.latitude - origin.latitude) * Math.PI) / 180;
            const dLon = ((dest.longitude - origin.longitude) * Math.PI) / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos((origin.latitude * Math.PI) / 180) *
                Math.cos((dest.latitude * Math.PI) / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const straightLine = Math.round(R * c);

            updateDraft({
                routePolyline: null,
                distanceKm: Math.round(straightLine * 1.3), // Factor de corrección por ruta real
                durationMinutes: null,
                routeSummary: null,
            });
        }
        setIsLoadingRoute(false);
    };

    // ─── Publicar viaje ────────────────────────────
    const handlePublish = async () => {
        setErrors({});

        // Construir datos para validación
        const formData = {
            vehicle_id: draft.vehicle_id ?? '',
            origin: draft.origin ?? { latitude: 0, longitude: 0, address: '' },
            destination: draft.destination ?? { latitude: 0, longitude: 0, address: '' },
            direction: draft.direction,
            departure_at: draft.departure_at,
            estimated_arrival: draft.estimated_arrival ?? undefined,
            available_kg: draft.available_kg ?? 0,
            available_m3: draft.available_m3 ?? undefined,
            price_per_kg: draft.price_per_kg ?? 0,
            notes: draft.notes || undefined,
        };

        // Validar con Zod
        const result = createTripSchema.safeParse(formData);

        if (!result.success) {
            const newErrors: Record<string, string> = {};
            result.error.issues.forEach((issue: any) => {
                const path = issue.path.join('.');
                newErrors[path] = issue.message;
            });
            setErrors(newErrors);
            return;
        }

        // Publicar
        const trip = await publishTrip(result.data);

        if (trip) {
            Alert.alert(
                '🚛 ¡Viaje Publicado!',
                `Tu viaje ${draft.origin?.name ?? ''} → ${draft.destination?.name ?? ''} ya está visible para los clientes.`,
                [
                    {
                        text: 'Ver Mis Viajes',
                        onPress: () => router.replace('/(tabs)/my-trips' as any),
                    },
                ],
            );
        }
    };

    // ─── Cambiar dirección ─────────────────────────
    const toggleDirection = () => {
        const newDirection: TripDirection = draft.direction === 'return' ? 'outbound' : 'return';
        updateDraft({ direction: newDirection });
    };

    return (
        <>
            <KeyboardAvoidingView
                className="flex-1 bg-surface-dark"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View className="px-6 pt-4 pb-2">
                        <Text className="text-white text-2xl font-sans-bold">
                            Publicar Viaje
                        </Text>
                        <Text className="text-gray-400 text-base mt-1">
                            Los clientes verán tu viaje y podrán reservar espacio.
                        </Text>
                    </View>

                    {/* ─── DIRECCIÓN (IDA/RETORNO) ─────────────── */}
                    <View className="mx-6 mt-4">
                        <TouchableOpacity
                            className={`rounded-2xl p-4 flex-row items-center justify-between ${draft.direction === 'return'
                                ? 'bg-primary-600/20 border-2 border-primary-500'
                                : 'bg-surface border-2 border-surface-light'
                                }`}
                            onPress={toggleDirection}
                        >
                            <View className="flex-1">
                                <Text className="text-white text-lg font-sans-bold">
                                    {draft.direction === 'return'
                                        ? '🔄 Viaje de Retorno'
                                        : '➡️ Viaje de Ida'
                                    }
                                </Text>
                                <Text className="text-gray-400 text-sm mt-1">
                                    {draft.direction === 'return'
                                        ? 'Prioridad ×1.5 en matching — más clientes verán tu viaje'
                                        : 'Viaje de ida estándar'
                                    }
                                </Text>
                            </View>
                            {draft.direction === 'return' && (
                                <View className="bg-primary-600 px-3 py-1 rounded-full">
                                    <Text className="text-white text-xs font-sans-bold">
                                        BACKHAUL
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* ─── VEHÍCULO ─────────────── */}
                    <View className="mx-6 mt-6">
                        <Text className="text-gray-400 text-sm mb-2 font-sans-medium">
                            VEHÍCULO
                        </Text>
                        <TouchableOpacity
                            className={`bg-surface rounded-2xl p-4 flex-row items-center border ${errors.vehicle_id ? 'border-red-500' : 'border-surface-light'
                                }`}
                            onPress={() => setShowVehiclePicker(true)}
                        >
                            <Text className="text-2xl mr-3">🚛</Text>
                            <View className="flex-1">
                                {selectedVehicleInfo ? (
                                    <>
                                        <Text className="text-white text-lg font-sans-bold">
                                            {selectedVehicleInfo.name}
                                        </Text>
                                        <Text className="text-gray-400 text-sm">
                                            Patente: {selectedVehicleInfo.plate}
                                        </Text>
                                    </>
                                ) : (
                                    <Text className="text-gray-500 text-lg">
                                        Seleccioná tu vehículo...
                                    </Text>
                                )}
                            </View>
                            <Text className="text-primary-400 text-sm font-bold">CAMBIAR</Text>
                        </TouchableOpacity>
                        {errors.vehicle_id && (
                            <Text className="text-danger text-sm mt-1 ml-2">{errors.vehicle_id}</Text>
                        )}
                    </View>

                    {/* ─── ORIGEN ──────────────────────────────── */}
                    <View className="mx-6 mt-6">
                        <Text className="text-gray-400 text-sm mb-2 font-sans-medium">
                            ORIGEN
                        </Text>
                        <TouchableOpacity
                            className={`bg-surface rounded-2xl p-4 flex-row items-center ${errors.origin ? 'border-2 border-danger' : ''
                                }`}
                            onPress={() => setShowOriginPicker(true)}
                        >
                            <Text className="text-success text-2xl mr-3">🟢</Text>
                            <View className="flex-1">
                                {draft.origin ? (
                                    <>
                                        <Text className="text-white text-lg font-sans-bold">
                                            {draft.origin.name ?? 'Origen'}
                                        </Text>
                                        <Text className="text-gray-400 text-sm" numberOfLines={1}>
                                            {draft.origin.address}
                                        </Text>
                                    </>
                                ) : (
                                    <Text className="text-gray-500 text-lg">
                                        Tocar para seleccionar origen...
                                    </Text>
                                )}
                            </View>
                            <Text className="text-gray-500 text-xl">📍</Text>
                        </TouchableOpacity>
                        {errors.origin && (
                            <Text className="text-danger text-sm mt-1 ml-2">{errors.origin}</Text>
                        )}
                    </View>

                    {/* ─── DESTINO ─────────────────────────────── */}
                    <View className="mx-6 mt-4">
                        <Text className="text-gray-400 text-sm mb-2 font-sans-medium">
                            DESTINO
                        </Text>
                        <TouchableOpacity
                            className={`bg-surface rounded-2xl p-4 flex-row items-center ${errors.destination ? 'border-2 border-danger' : ''
                                }`}
                            onPress={() => setShowDestPicker(true)}
                        >
                            <Text className="text-accent text-2xl mr-3">🔴</Text>
                            <View className="flex-1">
                                {draft.destination ? (
                                    <>
                                        <Text className="text-white text-lg font-sans-bold">
                                            {draft.destination.name ?? 'Destino'}
                                        </Text>
                                        <Text className="text-gray-400 text-sm" numberOfLines={1}>
                                            {draft.destination.address}
                                        </Text>
                                    </>
                                ) : (
                                    <Text className="text-gray-500 text-lg">
                                        Tocar para seleccionar destino...
                                    </Text>
                                )}
                            </View>
                            <Text className="text-gray-500 text-xl">📍</Text>
                        </TouchableOpacity>
                        {errors.destination && (
                            <Text className="text-danger text-sm mt-1 ml-2">{errors.destination}</Text>
                        )}
                    </View>

                    {/* ─── PREVIEW DE RUTA ─────────────────────── */}
                    {draft.origin && draft.destination && (
                        <View className="mx-6 mt-4">
                            <Text className="text-gray-400 text-sm mb-2 font-sans-medium">
                                RUTA {isLoadingRoute ? '(calculando...)' : ''}
                            </Text>
                            <RoutePreview
                                origin={draft.origin}
                                destination={draft.destination}
                                polyline={draft.routePolyline ?? undefined}
                                distanceKm={draft.distanceKm ?? undefined}
                                durationMinutes={draft.durationMinutes ?? undefined}
                                routeSummary={draft.routeSummary ?? undefined}
                            />
                        </View>
                    )}

                    {/* ─── FECHA DE SALIDA ─────────────────────── */}
                    <View className="mx-6 mt-6">
                        <DateTimePickerInput
                            label="Fecha y hora de salida"
                            value={draft.departure_at ?? new Date()}
                            onChange={(date) => updateDraft({ departure_at: date })}
                            minimumDate={new Date()}
                            error={errors.departure_at}
                        />
                    </View>

                    {/* ─── CAPACIDAD Y PRECIO ──────────────────── */}
                    <View className="mx-6 mt-4 flex-row gap-4">
                        <View className="flex-1">
                            <Input
                                label="Kg disponibles"
                                placeholder="ej: 500"
                                keyboardType="numeric"
                                value={draft.available_kg?.toString() ?? ''}
                                onChangeText={(text) =>
                                    updateDraft({ available_kg: text ? parseInt(text, 10) : null })
                                }
                                error={errors.available_kg}
                                helperText={errors.available_kg ?? 'Máx 3500 kg'}
                            />
                        </View>
                        <View className="flex-1">
                            <Input
                                label="Precio por kg ($)"
                                placeholder="ej: 15.50"
                                keyboardType="decimal-pad"
                                value={draft.price_per_kg?.toString() ?? ''}
                                onChangeText={(text) =>
                                    updateDraft({ price_per_kg: text ? parseFloat(text) : null })
                                }
                                error={errors.price_per_kg}
                                helperText={errors.price_per_kg ?? 'ARS por kg'}
                            />
                        </View>
                    </View>

                    {/* ─── NOTAS ───────────────────────────────── */}
                    <View className="mx-6 mt-4">
                        <Input
                            label="Notas (opcional)"
                            placeholder="ej: Tengo espacio para muebles. Paso por San Luis."
                            value={draft.notes}
                            onChangeText={(text) => updateDraft({ notes: text })}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    {/* ─── BOTÓN PUBLICAR ──────────────────────── */}
                    <View className="mx-6 mt-8">
                        <Button
                            title="🚛 Publicar Viaje"
                            onPress={handlePublish}
                            isLoading={isSubmitting}
                            variant="primary"
                            size="lg"
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ─── MODALES DE SELECCIÓN DE UBICACIÓN ──── */}
            <Modal visible={showOriginPicker} animationType="slide">
                <LocationPicker
                    title="Seleccionar Origen"
                    onLocationSelected={handleOriginSelected}
                    onCancel={() => setShowOriginPicker(false)}
                />
            </Modal>

            <Modal visible={showDestPicker} animationType="slide">
                <LocationPicker
                    title="Seleccionar Destino"
                    onLocationSelected={handleDestSelected}
                    onCancel={() => setShowDestPicker(false)}
                />
            </Modal>

            <VehiclePicker
                visible={showVehiclePicker}
                onClose={() => setShowVehiclePicker(false)}
                onSelect={(v) => {
                    updateDraft({ vehicle_id: v.id });
                    setSelectedVehicleInfo({ name: `${v.brand} ${v.model}`, plate: v.plate });
                    setShowVehiclePicker(false);
                }}
                selectedVehicleId={draft.vehicle_id}
            />
        </>
    );
}
