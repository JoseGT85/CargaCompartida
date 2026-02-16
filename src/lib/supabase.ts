import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';
import { ENV } from '../config/env';
import type { Database } from '../types/database.types';

/**
 * Adapter de almacenamiento seguro para Supabase Auth.
 * Usa expo-secure-store en dispositivos nativos para guardar
 * la sesión de forma encriptada. En web usa localStorage.
 */
const ExpoSecureStoreAdapter = {
    getItem: async (key: string): Promise<string | null> => {
        if (Platform.OS === 'web') {
            return localStorage.getItem(key);
        }
        return SecureStore.getItemAsync(key);
    },

    setItem: async (key: string, value: string): Promise<void> => {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
            return;
        }
        await SecureStore.setItemAsync(key, value);
    },

    removeItem: async (key: string): Promise<void> => {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
            return;
        }
        await SecureStore.deleteItemAsync(key);
    },
};

/**
 * Cliente Supabase configurado para CargaCompartida.
 *
 * - Usa expo-secure-store para persistir la sesión de forma segura.
 * - Auto-refresh de tokens habilitado.
 * - Reconexión automática cuando la app vuelve del segundo plano.
 */
export const supabase = createClient<Database>(
    ENV.SUPABASE_URL,
    ENV.SUPABASE_ANON_KEY,
    {
        auth: {
            storage: ExpoSecureStoreAdapter,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false, // Prevenir conflictos con deep linking de Expo Router
        },
    }
);

/**
 * Listener de AppState para manejar la reconexión automática.
 *
 * Cuando la app vuelve del segundo plano (background → active),
 * re-activa el auto-refresh de tokens. Cuando pasa a segundo plano,
 * lo desactiva para ahorrar recursos.
 *
 * Esto es especialmente importante para zonas con señal intermitente
 * (Ruta 7, Ruta 40, zonas cordilleranas de Mendoza).
 */
AppState.addEventListener('change', (state) => {
    if (state === 'active') {
        supabase.auth.startAutoRefresh();
    } else {
        supabase.auth.stopAutoRefresh();
    }
});
