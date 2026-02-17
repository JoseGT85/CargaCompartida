/**
 * TripCard — Componente compartido para mostrar un viaje.
 * Usado en My Trips (chofer) y Search Trips (cliente).
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin, RotateCcw, Clock, FileEdit, CheckCircle, XCircle, Truck, Circle } from 'lucide-react-native';
import { COLORS } from '../../config/constants';
import { formatDate } from '../utils/formatters';
import type { Trip, TripStatus } from '../../types/database.types';

// ────────────────────────────────────────────────────────────────
// Status config para vista de chofer
// ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TripStatus, { label: string; color: string; icon: React.ReactNode }> = {
    draft: { label: 'Borrador', color: 'text-gray-400', icon: <FileEdit size={16} color="#9ca3af" /> },
    published: { label: 'Publicado', color: 'text-primary-400', icon: <Circle size={16} color={COLORS.primary} /> },
    in_progress: { label: 'En Curso', color: 'text-warning', icon: <Truck size={16} color={COLORS.warning} /> },
    completed: { label: 'Completado', color: 'text-success', icon: <CheckCircle size={16} color={COLORS.success} /> },
    cancelled: { label: 'Cancelado', color: 'text-danger', icon: <XCircle size={16} color={COLORS.danger} /> },
};

// ────────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────────

interface TripCardProps {
    trip: Trip;
    /** Mostrar badge de estado (para vista "Mis Viajes" del chofer) */
    showStatus?: boolean;
    /** Mostrar botón CTA "Ver Detalle y Reservar" (para vista de búsqueda del cliente) */
    showBookButton?: boolean;
    /** Callback al presionar la card */
    onPress?: () => void;
    /** Callback al presionar el botón de reservar */
    onBook?: () => void;
}

// ────────────────────────────────────────────────────────────────
// Componente
// ────────────────────────────────────────────────────────────────

export function TripCard({
    trip,
    showStatus = false,
    showBookButton = false,
    onPress,
    onBook,
}: TripCardProps) {
    const status = STATUS_CONFIG[trip.status];

    return (
        <TouchableOpacity
            className="bg-card rounded-2xl p-4 mb-3 mx-4 border border-border"
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
            disabled={!onPress}
        >
            {/* Header: status + return badge */}
            <View className="flex-row items-center justify-between mb-2">
                {showStatus && (
                    <View className="flex-row items-center">
                        {status.icon}
                        <Text className={`text-sm font-sans-medium ml-1.5 ${status.color}`}>
                            {status.label}
                        </Text>
                    </View>
                )}
                {trip.direction === 'return' && (
                    <View className="bg-primary-600/30 px-2.5 py-1 rounded-full flex-row items-center">
                        <RotateCcw size={12} color={COLORS.primary} />
                        <Text className="text-primary-300 text-xs ml-1">
                            {showStatus ? 'Retorno' : 'Viaje de Retorno — Mayor prioridad'}
                        </Text>
                    </View>
                )}
            </View>

            {/* Route: origin -> destination */}
            <View className="flex-row items-center mb-1">
                <MapPin size={16} color={COLORS.success} />
                <Text className="text-foreground text-base font-sans-bold flex-1 ml-2" numberOfLines={1}>
                    {trip.origin_name}
                </Text>
            </View>
            <View className="ml-2 border-l-2 border-border h-3 mb-1" />
            <View className="flex-row items-center mb-3">
                <MapPin size={16} color={COLORS.danger} />
                <Text className="text-foreground text-base font-sans-bold flex-1 ml-2" numberOfLines={1}>
                    {trip.dest_name}
                </Text>
            </View>

            {/* Stats row */}
            <View className="flex-row justify-between border-t border-border pt-3">
                <View className="flex-row items-center">
                    <Clock size={14} color={COLORS.muted} />
                    <View className="ml-1.5">
                        <Text className="text-muted-foreground text-xs">Salida</Text>
                        <Text className="text-foreground text-sm">{formatDate(trip.departure_at)}</Text>
                    </View>
                </View>
                <View className="items-center">
                    <Text className="text-muted-foreground text-xs">Disponible</Text>
                    <Text className="text-foreground text-sm font-sans-bold">{trip.available_kg} kg</Text>
                </View>
                <View className="items-end">
                    <Text className="text-muted-foreground text-xs">Precio</Text>
                    <Text className="text-primary-400 text-sm font-sans-bold">
                        ${trip.price_per_kg}/kg
                    </Text>
                </View>
            </View>

            {/* CTA button (client view) */}
            {showBookButton && (
                <TouchableOpacity
                    className="bg-primary rounded-xl py-2.5 mt-3 items-center"
                    onPress={onBook}
                >
                    <Text className="text-primary-foreground text-sm font-sans-bold">
                        Ver Detalle y Reservar
                    </Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
}
