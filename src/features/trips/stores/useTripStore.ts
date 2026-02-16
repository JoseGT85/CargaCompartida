/**
 * Store Zustand para gestión de viajes.
 * CargaCompartida — Feature Trips
 *
 * Maneja:
 * - Borrador del viaje (mientras el chofer completa el formulario)
 * - Lista de viajes del chofer
 * - Resultados de búsqueda (para clientes)
 * - CRUD de viajes con Supabase
 */

import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';
import type { Trip, TripStatus, TripDirection } from '../../../types/database.types';
import type { GeoLocation, LatLng } from '../../../shared/types/geo.types';
import { toWKTPoint, toWKTLineString } from '../../../shared/types/geo.types';
import type { CreateTripInput } from '../types/trip.schema';

// ────────────────────────────────────────────────────────────────
// Tipos del Store
// ────────────────────────────────────────────────────────────────

/** Borrador de viaje (estado intermedio mientras se crea) */
export interface TripDraft {
    vehicle_id: string | null;
    origin: GeoLocation | null;
    destination: GeoLocation | null;
    direction: TripDirection;
    departure_at: string | null;
    estimated_arrival: string | null;
    available_kg: number | null;
    available_m3: number | null;
    price_per_kg: number | null;
    notes: string;
    /** Polilínea de la ruta (si se obtuvo de Directions API) */
    routePolyline: LatLng[] | null;
    /** Distancia calculada en km */
    distanceKm: number | null;
    /** Duración estimada en minutos */
    durationMinutes: number | null;
    /** Resumen de la ruta (ej: "Ruta 7") */
    routeSummary: string | null;
}

interface TripState {
    // ─── Borrador ──────────────────────────────────
    draft: TripDraft;

    // ─── Mis viajes (chofer) ───────────────────────
    myTrips: Trip[];
    isLoadingMyTrips: boolean;

    // ─── Búsqueda (cliente) ────────────────────────
    searchResults: Trip[];
    isSearching: boolean;

    // ─── General ───────────────────────────────────
    selectedTrip: Trip | null;
    isSubmitting: boolean;
    error: string | null;
}

interface TripActions {
    // ─── Borrador ──────────────────────────────────
    /** Actualizar campos del borrador */
    updateDraft: (updates: Partial<TripDraft>) => void;
    /** Limpiar borrador */
    resetDraft: () => void;

    // ─── CRUD ──────────────────────────────────────
    /** Publicar un viaje nuevo a Supabase */
    publishTrip: (input: CreateTripInput) => Promise<Trip | null>;
    /** Obtener viajes del chofer actual */
    fetchMyTrips: (driverId: string) => Promise<void>;
    /** Cambiar estado de un viaje */
    updateTripStatus: (tripId: string, status: TripStatus) => Promise<boolean>;
    /** Cancelar un viaje */
    cancelTrip: (tripId: string) => Promise<boolean>;

    // ─── Búsqueda ──────────────────────────────────
    /** Buscar viajes disponibles (para clientes) */
    searchTrips: (params: {
        originLat?: number;
        originLng?: number;
        destLat?: number;
        destLng?: number;
        radiusKm?: number;
    }) => Promise<void>;

    /** Seleccionar un viaje para ver detalles */
    selectTrip: (trip: Trip | null) => void;

    /** Limpiar errores */
    clearError: () => void;
}

// ────────────────────────────────────────────────────────────────
// Estado inicial del borrador
// ────────────────────────────────────────────────────────────────

const INITIAL_DRAFT: TripDraft = {
    vehicle_id: null,
    origin: null,
    destination: null,
    direction: 'return', // Default: viaje de retorno (BACKHAUL PRIORITY)
    departure_at: null,
    estimated_arrival: null,
    available_kg: null,
    available_m3: null,
    price_per_kg: null,
    notes: '',
    routePolyline: null,
    distanceKm: null,
    durationMinutes: null,
    routeSummary: null,
};

// ────────────────────────────────────────────────────────────────
// Store
// ────────────────────────────────────────────────────────────────

export const useTripStore = create<TripState & TripActions>((set, get) => ({
    // ─── Estado inicial ────────────────────────────
    draft: { ...INITIAL_DRAFT },
    myTrips: [],
    isLoadingMyTrips: false,
    searchResults: [],
    isSearching: false,
    selectedTrip: null,
    isSubmitting: false,
    error: null,

    // ─── Borrador ──────────────────────────────────
    updateDraft: (updates) => {
        set((state) => ({
            draft: { ...state.draft, ...updates },
        }));
    },

    resetDraft: () => {
        set({ draft: { ...INITIAL_DRAFT } });
    },

    // ─── Publicar viaje ────────────────────────────
    publishTrip: async (input) => {
        const { draft } = get();
        set({ isSubmitting: true, error: null });

        try {
            if (!draft.origin || !draft.destination) {
                throw new Error('Origen y destino son obligatorios');
            }

            // Construir el payload para Supabase
            // Convertir coordenadas a WKT para PostGIS
            const tripData: Record<string, unknown> = {
                vehicle_id: input.vehicle_id,
                origin_name: draft.origin.name ?? draft.origin.address,
                origin_point: toWKTPoint(draft.origin),
                dest_name: draft.destination.name ?? draft.destination.address,
                dest_point: toWKTPoint(draft.destination),
                direction: input.direction,
                departure_at: input.departure_at,
                estimated_arrival: input.estimated_arrival ?? null,
                available_kg: input.available_kg,
                available_m3: input.available_m3 ?? null,
                price_per_kg: input.price_per_kg,
                notes: input.notes ?? null,
                status: 'published' as TripStatus,
                distance_km: draft.distanceKm ?? null,
                waypoints: [],
            };

            // Si tenemos polilínea, guardarla como LINESTRING
            if (draft.routePolyline && draft.routePolyline.length >= 2) {
                tripData.route_line = toWKTLineString(draft.routePolyline);
            }

            const { data, error } = await (supabase
                .from('trips') as any)
                .insert(tripData)
                .select()
                .single();

            if (error) {
                throw new Error(error.message);
            }

            // Agregar a la lista de mis viajes
            set((state) => ({
                myTrips: [data as Trip, ...state.myTrips],
                isSubmitting: false,
                draft: { ...INITIAL_DRAFT },
            }));

            return data as Trip;
        } catch (err: any) {
            set({
                error: err.message ?? 'Error al publicar el viaje',
                isSubmitting: false,
            });
            return null;
        }
    },

    // ─── Fetch mis viajes ──────────────────────────
    fetchMyTrips: async (driverId) => {
        set({ isLoadingMyTrips: true, error: null });

        try {
            const { data, error } = await supabase
                .from('trips')
                .select('*')
                .eq('driver_id', driverId)
                .order('created_at', { ascending: false });

            if (error) throw new Error(error.message);

            set({
                myTrips: (data ?? []) as Trip[],
                isLoadingMyTrips: false,
            });
        } catch (err: any) {
            set({
                error: err.message ?? 'Error al cargar viajes',
                isLoadingMyTrips: false,
            });
        }
    },

    // ─── Cambiar estado ────────────────────────────
    updateTripStatus: async (tripId, status) => {
        try {
            const { error } = await (supabase
                .from('trips') as any)
                .update({ status })
                .eq('id', tripId);

            if (error) throw new Error(error.message);

            set((state) => ({
                myTrips: state.myTrips.map((t) =>
                    t.id === tripId ? { ...t, status } : t,
                ),
            }));

            return true;
        } catch (err: any) {
            set({ error: err.message });
            return false;
        }
    },

    // ─── Cancelar viaje ────────────────────────────
    cancelTrip: async (tripId) => {
        return get().updateTripStatus(tripId, 'cancelled');
    },

    // ─── Búsqueda de viajes ────────────────────────
    searchTrips: async (params) => {
        set({ isSearching: true, error: null });

        try {
            // Si tenemos coordenadas, usar la función PostGIS
            if (params.originLat && params.originLng && params.destLat && params.destLng) {
                const { data, error } = await (supabase.rpc as any)('search_trips_nearby', {
                    p_origin: `SRID=4326;POINT(${params.originLng} ${params.originLat})`,
                    p_dest: `SRID=4326;POINT(${params.destLng} ${params.destLat})`,
                    p_radius_km: params.radiusKm ?? 50,
                    p_limit: 20,
                });

                if (error) throw new Error(error.message);

                set({
                    searchResults: (data ?? []) as Trip[],
                    isSearching: false,
                });
            } else {
                // Búsqueda simple: viajes publicados con salida futura
                const { data, error } = await supabase
                    .from('trips')
                    .select('*')
                    .eq('status', 'published')
                    .gte('departure_at', new Date().toISOString())
                    .order('departure_at', { ascending: true })
                    .limit(20);

                if (error) throw new Error(error.message);

                set({
                    searchResults: (data ?? []) as Trip[],
                    isSearching: false,
                });
            }
        } catch (err: any) {
            set({
                error: err.message ?? 'Error en la búsqueda',
                isSearching: false,
            });
        }
    },

    // ─── Selección y limpieza ──────────────────────
    selectTrip: (trip) => set({ selectedTrip: trip }),
    clearError: () => set({ error: null }),
}));
