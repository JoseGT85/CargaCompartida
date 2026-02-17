import { z } from 'zod';
import { BUSINESS_RULES } from '../../../config/env';

// ────────────────────────────────────────────────────────────────
// Esquemas de validación para Autenticación
// CargaCompartida — Validación con Zod v4
// ────────────────────────────────────────────────────────────────

/**
 * Esquema de Login.
 * Valida email y contraseña mínima de 6 caracteres.
 */
export const loginSchema = z.object({
    email: z
        .string({ error: 'El email es obligatorio' })
        .email('Ingresá un email válido')
        .trim(),
    password: z
        .string({ error: 'La contraseña es obligatoria' })
        .min(6, 'La contraseña debe tener al menos 6 caracteres')
        .trim(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Esquema de Registro de Chofer.
 *
 * ⚠️ REGLA DE ORO: capacity_kg DEBE fallar si > 3500.
 * Esto es innegociable (Restricción Anti-Sindicato, Ley 24.653).
 */
export const registerDriverSchema = z.object({
    // Datos personales
    full_name: z
        .string({ error: 'El nombre completo es obligatorio' })
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres'),
    phone: z
        .string({ error: 'El teléfono es obligatorio' })
        .min(8, 'Ingresá un número de teléfono válido')
        .max(20, 'Número de teléfono demasiado largo'),
    email: z
        .string({ error: 'El email es obligatorio' })
        .email('Ingresá un email válido')
        .trim(),
    password: z
        .string({ error: 'La contraseña es obligatoria' })
        .min(6, 'La contraseña debe tener al menos 6 caracteres')
        .max(72, 'La contraseña no puede exceder 72 caracteres')
        .trim(),

    // Datos del vehículo
    plate: z
        .string({ error: 'La patente es obligatoria' })
        .min(6, 'Ingresá una patente válida')
        .max(10, 'Patente demasiado larga')
        .transform((val) => val.toUpperCase()),
    brand: z
        .string({ error: 'La marca es obligatoria' })
        .min(2, 'Ingresá la marca del vehículo'),
    model: z
        .string({ error: 'El modelo es obligatorio' })
        .min(1, 'Ingresá el modelo del vehículo'),
    year: z
        .number({ error: 'El año es obligatorio' })
        .int('El año debe ser un número entero')
        .min(1990, 'El vehículo debe ser de 1990 o posterior')
        .max(new Date().getFullYear() + 1, 'Año inválido'),
    vehicle_type: z.enum(['sedan', 'pickup', 'van', 'suv', 'utilitario'], {
        error: 'Seleccioná el tipo de vehículo',
    }),

    /**
     * ⛔ RESTRICCIÓN ANTI-SINDICATO (OBLIGATORIA)
     *
     * Los vehículos registrados NO pueden tener capacidad > 3500 kg.
     * Motivo legal: Evitar conflicto con gremios de transporte
     * de carga pesada (Ley 24.653).
     *
     * Esta validación se replica en:
     * - Base de datos: CHECK (capacity_kg <= 3500)
     * - Edge Function: Validación server-side con HTTP 422
     */
    capacity_kg: z
        .number({ error: 'La capacidad en kg es obligatoria' })
        .int('La capacidad debe ser un número entero')
        .min(1, 'La capacidad debe ser mayor a 0 kg')
        .max(
            BUSINESS_RULES.MAX_CAPACITY_KG,
            `La capacidad máxima permitida es ${BUSINESS_RULES.MAX_CAPACITY_KG} kg (restricción legal)`
        ),
});

export type RegisterDriverFormData = z.infer<typeof registerDriverSchema>;

/**
 * Esquema de Registro de Cliente (PyME).
 * Más simple que el de chofer, no requiere datos de vehículo.
 */
export const registerClientSchema = z.object({
    full_name: z
        .string({ error: 'El nombre completo es obligatorio' })
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres'),
    phone: z
        .string({ error: 'El teléfono es obligatorio' })
        .min(8, 'Ingresá un número de teléfono válido'),
    email: z
        .string({ error: 'El email es obligatorio' })
        .email('Ingresá un email válido'),
    password: z
        .string({ error: 'La contraseña es obligatoria' })
        .min(6, 'La contraseña debe tener al menos 6 caracteres')
        .max(72, 'La contraseña no puede exceder 72 caracteres'),
});

export type RegisterClientFormData = z.infer<typeof registerClientSchema>;
