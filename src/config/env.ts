/**
 * Variables de entorno de la aplicación CargaCompartida.
 *
 * IMPORTANTE: Reemplaza estos valores con las credenciales
 * de tu proyecto Supabase antes de ejecutar la app.
 *
 * En producción, estos valores se inyectan desde app.config.ts
 * usando expo-constants.
 */

export const ENV = {
    SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://gociyifphjifbctikkbr.supabase.co',
    SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'TU-ANON-KEY-AQUIeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvY2l5aWZwaGppZmJjdGlra2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzMwODEsImV4cCI6MjA4Njg0OTA4MX0.Ojc_DlaJkbcUMQhC4hOMVrZvhkp4ilwfAcCMN7jNt3c',
    GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? undefined,
} as const;

/**
 * Constantes de negocio (Hard Constraints)
 */
export const BUSINESS_RULES = {
    /** Capacidad máxima en kg — Restricción Anti-Sindicato (Ley 24.653) */
    MAX_CAPACITY_KG: 3500,
    /** Multiplicador de score para viajes de retorno (backhaul priority) */
    BACKHAUL_MULTIPLIER: 1.5,
    /** Radio de búsqueda por defecto en km */
    DEFAULT_SEARCH_RADIUS_KM: 50,
    /** Porcentaje mínimo de matches de retorno (KPI) */
    MIN_RETURN_MATCH_PERCENTAGE: 60,
} as const;
