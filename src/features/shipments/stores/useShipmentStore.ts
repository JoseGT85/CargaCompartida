import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';
import type { ShipmentRequest } from '../../../types/database.types';

// ────────────────────────────────────────────────────────────────
// Store de Pedidos de Envío — Zustand
// CargaCompartida
// ────────────────────────────────────────────────────────────────

interface ShipmentState {
    /** Lista de pedidos abiertos (feed del chofer) */
    openShipments: ShipmentRequest[];
    /** Pedidos del usuario actual (mis pedidos) */
    myShipments: ShipmentRequest[];
    /** Estado de carga */
    isLoading: boolean;
    /** Error de la última operación */
    error: string | null;
}

interface ShipmentActions {
    /** Cargar pedidos abiertos (para choferes) */
    fetchOpenShipments: () => Promise<void>;
    /** Cargar mis pedidos (para clientes) */
    fetchMyShipments: (clientId: string) => Promise<void>;
    /** Crear un nuevo pedido de envío */
    createShipment: (shipment: {
        description: string;
        weight_kg: number;
        origin_name: string;
        dest_name: string;
        budget?: number;
        notes?: string;
        needed_by?: string;
    }) => Promise<void>;
    /** Un chofer se ofrece para un pedido */
    offerForShipment: (shipmentId: string, driverId: string) => Promise<void>;
    /** Cancelar un pedido */
    cancelShipment: (shipmentId: string) => Promise<void>;
    /** Limpiar errores */
    clearError: () => void;
}

export const useShipmentStore = create<ShipmentState & ShipmentActions>((set, get) => ({
    openShipments: [],
    myShipments: [],
    isLoading: false,
    error: null,

    fetchOpenShipments: async () => {
        try {
            set({ isLoading: true, error: null });

            const { data, error } = await supabase
                .from('shipment_requests')
                .select('*')
                .eq('status', 'open')
                .order('created_at', { ascending: false });

            if (error) throw error;

            set({ openShipments: (data ?? []) as ShipmentRequest[], isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al cargar pedidos';
            set({ error: message, isLoading: false });
        }
    },

    fetchMyShipments: async (clientId: string) => {
        try {
            set({ isLoading: true, error: null });

            const { data, error } = await supabase
                .from('shipment_requests')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            set({ myShipments: (data ?? []) as ShipmentRequest[], isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al cargar mis pedidos';
            set({ error: message, isLoading: false });
        }
    },

    createShipment: async (shipment) => {
        try {
            set({ isLoading: true, error: null });

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No hay usuario autenticado');

            const { error } = await supabase
                .from('shipment_requests')
                .insert({
                    client_id: user.id,
                    description: shipment.description,
                    weight_kg: shipment.weight_kg,
                    origin_name: shipment.origin_name,
                    dest_name: shipment.dest_name,
                    budget: shipment.budget ?? null,
                    notes: shipment.notes ?? null,
                    needed_by: shipment.needed_by ?? null,
                    status: 'open',
                });

            if (error) throw error;

            // Recargar mis pedidos
            await get().fetchMyShipments(user.id);
            set({ isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al crear pedido';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    offerForShipment: async (shipmentId: string, driverId: string) => {
        try {
            set({ isLoading: true, error: null });

            const { error } = await supabase
                .from('shipment_requests')
                .update({
                    assigned_driver_id: driverId,
                    status: 'assigned',
                })
                .eq('id', shipmentId)
                .eq('status', 'open'); // Solo si aún está abierto

            if (error) throw error;

            // Recargar pedidos abiertos
            await get().fetchOpenShipments();
            set({ isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al ofrecer viaje';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    cancelShipment: async (shipmentId: string) => {
        try {
            set({ isLoading: true, error: null });

            const { error } = await supabase
                .from('shipment_requests')
                .update({ status: 'cancelled' })
                .eq('id', shipmentId);

            if (error) throw error;

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await get().fetchMyShipments(user.id);
            }
            set({ isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al cancelar pedido';
            set({ error: message, isLoading: false });
        }
    },

    clearError: () => set({ error: null }),
}));
