/**
 * Esquema Zod para validación de viajes.
 * CargaCompartida — Feature Trips
 *
 * Validaciones clave:
 * - available_kg > 0 y ≤ capacidad del vehículo (3500 max)
 * - price_per_kg > 0
 * - departure_at debe ser futuro
 * - origin ≠ destination
 */

import { z } from 'zod';
import { BUSINESS_RULES } from '../../../config/env';

// ────────────────────────────────────────────────────────────────
// Sub-schemas
// ────────────────────────────────────────────────────────────────

/** Esquema de ubicación geográfica */
export const geoLocationSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().min(1, 'La dirección es obligatoria'),
    name: z.string().optional(),
});

// ────────────────────────────────────────────────────────────────
// Trip schema
// ────────────────────────────────────────────────────────────────

/** Esquema para crear un viaje nuevo */
export const createTripSchema = z.object({
    /** Vehículo seleccionado para el viaje */
    vehicle_id: z.string().uuid('Seleccioná un vehículo'),

    /** Punto de origen */
    origin: geoLocationSchema,

    /** Punto de destino */
    destination: geoLocationSchema,

    /** Dirección del viaje (ida o retorno — BACKHAUL PRIORITY) */
    direction: z.enum(['outbound', 'return'], {
        message: 'Seleccioná la dirección del viaje',
    }),

    /** Fecha y hora de salida */
    departure_at: z.date({
        message: 'Ingresá una fecha válida',
    }).refine((date) => date > new Date(), {
        message: 'La fecha de salida debe ser en el futuro',
    }),

    /** Fecha estimada de llegada (opcional) */
    estimated_arrival: z.string().optional(),

    /** Kilogramos disponibles */
    available_kg: z
        .number({ message: 'Ingresá los kg disponibles' })
        .int('Los kg deben ser un número entero')
        .positive('Los kg deben ser mayor a 0')
        .max(BUSINESS_RULES.MAX_CAPACITY_KG, `Máximo ${BUSINESS_RULES.MAX_CAPACITY_KG} kg (Ley 24.653)`),

    /** Volumen disponible en m³ (opcional) */
    available_m3: z.number().positive().optional(),

    /** Precio por kg (en ARS) */
    price_per_kg: z
        .number({ message: 'Ingresá el precio por kg' })
        .positive('El precio debe ser mayor a $0'),

    /** Notas adicionales del chofer */
    notes: z.string().max(500, 'Máximo 500 caracteres').optional(),

}).refine(
    (data) => {
        // Validar que origen ≠ destino
        const { origin, destination } = data;
        const distance = Math.sqrt(
            Math.pow(origin.latitude - destination.latitude, 2) +
            Math.pow(origin.longitude - destination.longitude, 2),
        );
        return distance > 0.001; // ~100m de diferencia mínima
    },
    {
        message: 'El origen y destino deben ser diferentes',
        path: ['destination'],
    },
);

/** Tipo inferido del schema */
export type CreateTripInput = z.infer<typeof createTripSchema>;

// ────────────────────────────────────────────────────────────────
// Schema de búsqueda (para clientes)
// ────────────────────────────────────────────────────────────────

export const searchTripsSchema = z.object({
    origin: geoLocationSchema.optional(),
    destination: geoLocationSchema.optional(),
    /** Fecha mínima de salida */
    departure_from: z.string().optional(),
    /** Peso de la carga en kg */
    weight_kg: z.number().positive().optional(),
    /** Radio de búsqueda en km */
    radius_km: z.number().positive().default(BUSINESS_RULES.DEFAULT_SEARCH_RADIUS_KM),
});

export type SearchTripsInput = z.infer<typeof searchTripsSchema>;
