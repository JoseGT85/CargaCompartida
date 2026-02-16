/**
 * Esquema Zod para validación de vehículos.
 * CargaCompartida — Feature Vehicles
 *
 * REGLA CRÍTICA:
 * - capacity_kg <= 3500 (Ley 24.653 / Restricción Anti-Sindicato)
 */

import { z } from 'zod';
import { BUSINESS_RULES } from '../../../config/env';

export const vehicleSchema = z.object({
    plate: z.string()
        .min(6, 'Ingresá una patente válida')
        .max(10, 'Patente muy larga')
        .transform((val) => val.toUpperCase().replace(/\s/g, '')), // Normalizar: mayúsculas sin espacios

    brand: z.string().min(2, 'Ingresá la marca'),
    model: z.string().min(2, 'Ingresá el modelo'),

    year: z.number({ message: 'Ingresá el año' })
        .int()
        .min(1990, 'El vehículo es muy antiguo')
        .max(new Date().getFullYear() + 1, 'Año inválido'),

    vehicle_type: z.enum(['sedan', 'pickup', 'van', 'suv', 'utilitario'], {
        message: 'Seleccioná el tipo de vehículo',
    }),

    /** HARD CONSTRAINT: Máximo 3500 kg */
    capacity_kg: z.number({ message: 'Ingresá la capacidad' })
        .positive('La capacidad debe ser mayor a 0')
        .max(BUSINESS_RULES.MAX_CAPACITY_KG, `Máximo ${BUSINESS_RULES.MAX_CAPACITY_KG} kg permitidos`),

    volume_m3: z.number().positive().optional(),

    photo_url: z.string().url().optional().or(z.literal('')),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
