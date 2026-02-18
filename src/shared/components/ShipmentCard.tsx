import { Calendar, DollarSign, MapPin, Package } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../config/constants';
import type { ShipmentRequest } from '../../types/database.types';

// ────────────────────────────────────────────────────────────────
// Card de Pedido de Envío — CargaCompartida UI Kit
// ────────────────────────────────────────────────────────────────

interface ShipmentCardProps {
    shipment: ShipmentRequest;
    /** Mostrar botón de acción (para choferes: "Ofrecer Viaje") */
    showOfferButton?: boolean;
    onOffer?: () => void;
    /** Mostrar botón de cancelar (para clientes dueños) */
    showCancelButton?: boolean;
    onCancel?: () => void;
}

const statusLabels: Record<string, { label: string; color: string }> = {
    open: { label: 'Abierto', color: 'text-success' },
    assigned: { label: 'Asignado', color: 'text-primary' },
    in_transit: { label: 'En tránsito', color: 'text-warning' },
    completed: { label: 'Completado', color: 'text-muted-foreground' },
    cancelled: { label: 'Cancelado', color: 'text-danger' },
};

export function ShipmentCard({
    shipment,
    showOfferButton,
    onOffer,
    showCancelButton,
    onCancel,
}: ShipmentCardProps) {
    const status = statusLabels[shipment.status] ?? statusLabels.open;

    return (
        <View className="mx-4 mb-3 bg-card rounded-2xl border border-border p-4">
            {/* Header: descripción + estado */}
            <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1 flex-row items-center">
                    <Package size={18} color={COLORS.primary} />
                    <Text className="text-foreground text-base font-sans-bold ml-2 flex-1" numberOfLines={2}>
                        {shipment.description}
                    </Text>
                </View>
                <Text className={`text-xs font-sans-medium ml-2 ${status.color}`}>
                    {status.label}
                </Text>
            </View>

            {/* Ruta */}
            <View className="flex-row items-center mb-2">
                <MapPin size={14} color={COLORS.muted} />
                <Text className="text-muted-foreground text-sm ml-2 flex-1" numberOfLines={1}>
                    {shipment.origin_name}
                </Text>
                <Text className="text-muted-foreground text-sm mx-2">{"→"}</Text>
                <Text className="text-muted-foreground text-sm flex-1" numberOfLines={1}>
                    {shipment.dest_name}
                </Text>
            </View>

            {/* Info row: peso + presupuesto + fecha */}
            <View className="flex-row items-center gap-4 mb-3">
                <View className="flex-row items-center">
                    <Package size={12} color={COLORS.muted} />
                    <Text className="text-muted-foreground text-xs ml-1">
                        {shipment.weight_kg} kg
                    </Text>
                </View>

                {!!shipment.budget && (
                    <View className="flex-row items-center">
                        <DollarSign size={12} color={COLORS.muted} />
                        <Text className="text-muted-foreground text-xs ml-1">
                            ${shipment.budget.toLocaleString()}
                        </Text>
                    </View>
                )}

                {!!shipment.needed_by && (
                    <View className="flex-row items-center">
                        <Calendar size={12} color={COLORS.muted} />
                        <Text className="text-muted-foreground text-xs ml-1">
                            {new Date(shipment.needed_by).toLocaleDateString('es-AR', {
                                day: '2-digit',
                                month: 'short',
                            })}
                        </Text>
                    </View>
                )}
            </View>

            {/* Notas */}
            {!!shipment.notes && (
                <Text className="text-muted-foreground text-xs mb-3 italic" numberOfLines={2}>
                    {shipment.notes}
                </Text>
            )}

            {/* Acciones */}
            <View className="flex-row gap-2">
                {!!showOfferButton && (
                    <TouchableOpacity
                        className="flex-1 bg-primary rounded-xl py-2.5 items-center"
                        onPress={onOffer}
                        activeOpacity={0.8}
                    >
                        <Text className="text-primary-foreground font-sans-bold text-sm">
                            {"Ofrecer Viaje"}
                        </Text>
                    </TouchableOpacity>
                )}

                {!!showCancelButton && (
                    <TouchableOpacity
                        className="flex-1 border border-danger rounded-xl py-2.5 items-center"
                        onPress={onCancel}
                        activeOpacity={0.8}
                    >
                        <Text className="text-danger font-sans-bold text-sm">
                            {"Cancelar"}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}
