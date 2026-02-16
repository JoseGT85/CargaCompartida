/**
 * Tipos geo-espaciales para CargaCompartida.
 * Usados por el servicio de mapas, stores de viajes y UI.
 */

/** Coordenada geográfica básica */
export interface LatLng {
    latitude: number;
    longitude: number;
}

/** Punto geográfico con dirección textual */
export interface GeoLocation {
    latitude: number;
    longitude: number;
    address: string;
    /** Nombre corto del lugar (ej: "Mendoza Capital") */
    name?: string;
}

/** Resultado de geocoding (búsqueda de dirección) */
export interface GeocodingResult {
    latitude: number;
    longitude: number;
    formattedAddress: string;
    name: string;
    /** City/Locality */
    city?: string;
    /** Province/State */
    province?: string;
}

/** Resultado de Directions API */
export interface DirectionsResult {
    /** Polilínea decodificada como array de coordenadas */
    polyline: LatLng[];
    /** Distancia total en km */
    distanceKm: number;
    /** Duración estimada en minutos */
    durationMinutes: number;
    /** Resumen de la ruta (ej: "Ruta 7") */
    summary: string;
}

/**
 * Convierte un GeoLocation a formato WKT (Well-Known Text) para PostGIS.
 * PostGIS espera POINT(longitude latitude) — ¡ojo con el orden!
 *
 * @example
 * toWKTPoint({ latitude: -32.889, longitude: -68.845, address: "Mendoza" })
 * // → "SRID=4326;POINT(-68.845 -32.889)"
 */
export function toWKTPoint(location: GeoLocation | LatLng): string {
    return `SRID=4326;POINT(${location.longitude} ${location.latitude})`;
}

/**
 * Convierte un array de LatLng a formato WKT LINESTRING para PostGIS.
 *
 * @example
 * toWKTLineString([{ latitude: -32.889, longitude: -68.845 }, ...])
 * // → "SRID=4326;LINESTRING(-68.845 -32.889, -68.5 -33.1, ...)"
 */
export function toWKTLineString(points: LatLng[]): string {
    if (points.length < 2) {
        throw new Error('LINESTRING requiere al menos 2 puntos');
    }
    const coords = points
        .map((p) => `${p.longitude} ${p.latitude}`)
        .join(', ');
    return `SRID=4326;LINESTRING(${coords})`;
}

/**
 * Convierte un GeoLocation a GeoJSON Point para PostGIS.
 * Alternativa a WKT — Supabase acepta ambos formatos.
 */
export function toGeoJSONPoint(location: GeoLocation | LatLng) {
    return {
        type: 'Point' as const,
        coordinates: [location.longitude, location.latitude],
    };
}

/**
 * Convierte la respuesta de PostGIS (GeoJSON string) a LatLng.
 * Útil para leer datos del backend.
 */
export function fromGeoJSON(geoJson: string | { type: string; coordinates: number[] }): LatLng {
    const parsed = typeof geoJson === 'string' ? JSON.parse(geoJson) : geoJson;
    return {
        longitude: parsed.coordinates[0],
        latitude: parsed.coordinates[1],
    };
}
