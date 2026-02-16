/**
 * Hook para obtener la ubicación actual del dispositivo.
 * Usa expo-location con permisos y fallback a Mendoza Capital.
 */

import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import type { LatLng } from '../types/geo.types';

/** Centro de Mendoza Capital — fallback por defecto */
const MENDOZA_CENTER: LatLng = {
    latitude: -32.8908,
    longitude: -68.8272,
};

interface UseLocationResult {
    /** Ubicación actual del dispositivo */
    location: LatLng;
    /** True si se están obteniendo permisos o coordenadas */
    isLoading: boolean;
    /** Mensaje de error si no se pudo obtener la ubicación */
    error: string | null;
    /** True si los permisos de ubicación fueron denegados */
    permissionDenied: boolean;
    /** Refrescar la ubicación manualmente */
    refresh: () => Promise<void>;
}

export function useLocation(): UseLocationResult {
    const [location, setLocation] = useState<LatLng>(MENDOZA_CENTER);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [permissionDenied, setPermissionDenied] = useState(false);

    const getLocation = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                setPermissionDenied(true);
                setError('Permiso de ubicación denegado. Usando Mendoza como predeterminado.');
                setIsLoading(false);
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            setLocation({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
            });
            setPermissionDenied(false);
        } catch (err) {
            console.warn('[useLocation] Error obteniendo ubicación:', err);
            setError('No se pudo obtener la ubicación. Usando Mendoza como predeterminado.');
            // Mantiene MENDOZA_CENTER como fallback
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getLocation();
    }, []);

    return {
        location,
        isLoading,
        error,
        permissionDenied,
        refresh: getLocation,
    };
}
