/**
 * Servicio de Mapas — Geocoding & Directions
 *
 * Provee geocodificación (texto → coordenadas) y cálculo de rutas.
 * Usa la API de Google Maps cuando hay conectividad.
 * Cuando falla (offline/sin API key), permite selección manual en el mapa.
 *
 * IMPORTANTE: Para producción, configurar EXPO_PUBLIC_GOOGLE_MAPS_API_KEY en .env
 */

import { ENV } from '../config/env';
import type { GeocodingResult, DirectionsResult, LatLng } from '../shared/types/geo.types';

// ────────────────────────────────────────────────────────────────
// Config
// ────────────────────────────────────────────────────────────────

const GOOGLE_MAPS_BASE = 'https://maps.googleapis.com/maps/api';

function getApiKey(): string | null {
    return ENV.GOOGLE_MAPS_API_KEY ?? null;
}

// ────────────────────────────────────────────────────────────────
// Geocoding: texto → coordenadas
// ────────────────────────────────────────────────────────────────

/**
 * Geocodifica una dirección de texto a coordenadas.
 * Prioriza resultados en la región AR (Argentina / Mendoza).
 *
 * @returns Array de resultados, o array vacío si offline/error.
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult[]> {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.warn('[Maps] No API key — geocoding no disponible');
        return [];
    }

    try {
        const url = `${GOOGLE_MAPS_BASE}/geocode/json?address=${encodeURIComponent(address)}&region=ar&language=es&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK') {
            console.warn('[Maps] Geocoding status:', data.status);
            return [];
        }

        return data.results.map((result: any) => ({
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
            formattedAddress: result.formatted_address,
            name: result.address_components?.[0]?.long_name ?? result.formatted_address,
            city: result.address_components?.find((c: any) =>
                c.types.includes('locality'))?.long_name,
            province: result.address_components?.find((c: any) =>
                c.types.includes('administrative_area_level_1'))?.long_name,
        }));
    } catch (error) {
        console.warn('[Maps] Geocoding failed (¿offline?):', error);
        return [];
    }
}

/**
 * Geocodificación inversa: coordenadas → dirección.
 * Útil cuando el usuario selecciona un punto en el mapa.
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    const apiKey = getApiKey();
    if (!apiKey) {
        // Fallback offline: retorna coordenadas como texto
        return {
            latitude,
            longitude,
            formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            name: `Punto (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
        };
    }

    try {
        const url = `${GOOGLE_MAPS_BASE}/geocode/json?latlng=${latitude},${longitude}&language=es&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK' || !data.results.length) {
            return {
                latitude,
                longitude,
                formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                name: `Punto seleccionado`,
            };
        }

        const result = data.results[0];
        return {
            latitude,
            longitude,
            formattedAddress: result.formatted_address,
            name: result.address_components?.[0]?.long_name ?? result.formatted_address,
            city: result.address_components?.find((c: any) =>
                c.types.includes('locality'))?.long_name,
            province: result.address_components?.find((c: any) =>
                c.types.includes('administrative_area_level_1'))?.long_name,
        };
    } catch (error) {
        console.warn('[Maps] Reverse geocoding failed:', error);
        return {
            latitude,
            longitude,
            formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            name: `Punto (offline)`,
        };
    }
}

// ────────────────────────────────────────────────────────────────
// Directions: ruta entre 2 puntos
// ────────────────────────────────────────────────────────────────

/**
 * Obtiene la ruta (polilínea, distancia, duración) entre origen y destino.
 *
 * @returns DirectionsResult o null si offline/error.
 */
export async function getDirections(
    origin: LatLng,
    destination: LatLng,
): Promise<DirectionsResult | null> {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.warn('[Maps] No API key — directions no disponible');
        return null;
    }

    try {
        const url = `${GOOGLE_MAPS_BASE}/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&language=es&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK' || !data.routes.length) {
            console.warn('[Maps] Directions status:', data.status);
            return null;
        }

        const route = data.routes[0];
        const leg = route.legs[0];

        return {
            polyline: decodePolyline(route.overview_polyline.points),
            distanceKm: Math.round(leg.distance.value / 1000),
            durationMinutes: Math.round(leg.duration.value / 60),
            summary: route.summary || '',
        };
    } catch (error) {
        console.warn('[Maps] Directions failed (¿offline?):', error);
        return null;
    }
}

// ────────────────────────────────────────────────────────────────
// Utilidades
// ────────────────────────────────────────────────────────────────

/**
 * Decodifica una polilínea encoded de Google Maps al formato LatLng[].
 * Algoritmo estándar de Google:
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodePolyline(encoded: string): LatLng[] {
    const points: LatLng[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
        let b: number;
        let shift = 0;
        let result = 0;

        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const dlat = result & 1 ? ~(result >> 1) : result >> 1;
        lat += dlat;

        shift = 0;
        result = 0;

        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const dlng = result & 1 ? ~(result >> 1) : result >> 1;
        lng += dlng;

        points.push({
            latitude: lat / 1e5,
            longitude: lng / 1e5,
        });
    }

    return points;
}

// ────────────────────────────────────────────────────────────────
// Ciudades frecuentes de Mendoza (fallback offline)
// ────────────────────────────────────────────────────────────────

export const MENDOZA_CITIES: { name: string; latitude: number; longitude: number }[] = [
    { name: 'Mendoza Capital', latitude: -32.8908, longitude: -68.8272 },
    { name: 'Godoy Cruz', latitude: -32.9274, longitude: -68.8416 },
    { name: 'Las Heras', latitude: -32.8534, longitude: -68.8101 },
    { name: 'Guaymallén', latitude: -32.8998, longitude: -68.7867 },
    { name: 'Maipú', latitude: -32.9436, longitude: -68.7583 },
    { name: 'Luján de Cuyo', latitude: -33.0348, longitude: -68.8779 },
    { name: 'San Rafael', latitude: -34.6177, longitude: -68.3301 },
    { name: 'San Martín', latitude: -33.3060, longitude: -68.4695 },
    { name: 'Rivadavia', latitude: -33.1914, longitude: -68.4651 },
    { name: 'Junín', latitude: -33.1393, longitude: -68.4954 },
    { name: 'Tunuyán', latitude: -33.5741, longitude: -69.0110 },
    { name: 'Tupungato', latitude: -33.3700, longitude: -69.1452 },
    { name: 'San Carlos', latitude: -33.7730, longitude: -69.0426 },
    { name: 'Malargüe', latitude: -35.4774, longitude: -69.5851 },
    { name: 'General Alvear', latitude: -34.9726, longitude: -67.7039 },
    // Destinos interprovinciales frecuentes
    { name: 'Buenos Aires (CABA)', latitude: -34.6037, longitude: -58.3816 },
    { name: 'Córdoba Capital', latitude: -31.4201, longitude: -64.1888 },
    { name: 'Rosario', latitude: -32.9468, longitude: -60.6393 },
    { name: 'San Juan Capital', latitude: -31.5375, longitude: -68.5364 },
    { name: 'San Luis Capital', latitude: -33.3020, longitude: -66.3376 },
    { name: 'Santiago de Chile', latitude: -33.4489, longitude: -70.6693 },
];
