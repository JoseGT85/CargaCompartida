/**
 * Store Zustand para gestión de vehículos.
 * CargaCompartida — Feature Vehicles
 */

import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';
import type { Vehicle } from '../../../types/database.types';
import type { VehicleInput } from '../types/vehicle.schema';
import { useAuthStore } from '../../auth/stores/useAuthStore';

interface VehicleState {
    myVehicles: Vehicle[];
    isLoading: boolean;
    error: string | null;
    isSubmitting: boolean;
}

interface VehicleActions {
    fetchMyVehicles: () => Promise<void>;
    addVehicle: (data: VehicleInput) => Promise<boolean>;
    deleteVehicle: (id: string) => Promise<boolean>;
    clearError: () => void;
}

export const useVehicleStore = create<VehicleState & VehicleActions>((set, get) => ({
    myVehicles: [],
    isLoading: false,
    error: null,
    isSubmitting: false,

    fetchMyVehicles: async () => {
        const userId = useAuthStore.getState().session?.user.id;
        if (!userId) return;

        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('driver_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            set({ myVehicles: (data ?? []) as Vehicle[], isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    addVehicle: async (input) => {
        const userId = useAuthStore.getState().session?.user.id;
        if (!userId) {
            set({ error: 'No hay sesión activa' });
            return false;
        }

        set({ isSubmitting: true, error: null });
        try {
            const { data, error } = await (supabase
                .from('vehicles') as any)
                .insert({
                    driver_id: userId,
                    ...input,
                    is_active: true,
                    is_verified: false, // Por defecto no verificado hasta revisión
                })
                .select()
                .single();

            if (error) throw error;

            set((state) => ({
                myVehicles: [data as Vehicle, ...state.myVehicles],
                isSubmitting: false,
            }));
            return true;
        } catch (err: any) {
            set({ error: err.message, isSubmitting: false });
            return false;
        }
    },

    deleteVehicle: async (id) => {
        set({ isSubmitting: true, error: null });
        try {
            const { error } = await supabase
                .from('vehicles')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set((state) => ({
                myVehicles: state.myVehicles.filter((v) => v.id !== id),
                isSubmitting: false,
            }));
            return true;
        } catch (err: any) {
            set({ error: err.message, isSubmitting: false });
            return false;
        }
    },

    clearError: () => set({ error: null }),
}));
