import { Session, User } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';
import type { Profile } from '../../../types/database.types';

// ────────────────────────────────────────────────────────────────
// Store de Autenticación — Zustand
// CargaCompartida
// ────────────────────────────────────────────────────────────────

// Cerrar el browser si quedó abierto (OAuth)
WebBrowser.maybeCompleteAuthSession();

interface AuthState {
    /** Sesión activa de Supabase Auth */
    session: Session | null;
    /** Usuario autenticado */
    user: User | null;
    /** Perfil extendido del usuario (tabla profiles) */
    profile: Profile | null;
    /** Indica si la inicialización está en progreso */
    isLoading: boolean;
    /** Indica si la sesión ha sido verificada al menos una vez */
    isInitialized: boolean;
    /** Mensaje de error de la última operación */
    error: string | null;
    /** Indica si el perfil necesita ser completado (post-OAuth) */
    needsProfileCompletion: boolean;
}

interface AuthActions {
    /** Inicializa el listener de sesión y carga el perfil. Retorna función de cleanup. */
    initialize: () => (() => void);
    /** Inicia sesión con email y contraseña */
    signIn: (email: string, password: string) => Promise<void>;
    /** Inicia sesión con Google OAuth */
    signInWithGoogle: () => Promise<void>;
    /** Registra un nuevo usuario con metadata adicional */
    signUp: (
        email: string,
        password: string,
        metadata: { full_name: string; phone: string; role: 'client' | 'driver' }
    ) => Promise<void>;
    /** Cierra la sesión activa */
    signOut: () => Promise<void>;
    /** Carga el perfil del usuario desde la tabla profiles */
    fetchProfile: (userId: string) => Promise<void>;
    /** Limpia el error actual */
    clearError: () => void;
    /** Completa el perfil después del registro con OAuth */
    completeProfile: (data: {
        full_name: string;
        phone: string;
        role: 'client' | 'driver';
        cuit_cuil?: string;
    }) => Promise<void>;
}

/**
 * Determina si el perfil del usuario está incompleto.
 * Un perfil creado por el trigger handle_new_user con datos de OAuth
 * tendrá full_name y phone vacíos ('').
 */
function isProfileIncomplete(profile: Profile | null): boolean {
    if (!profile) return true;
    return !profile.full_name || profile.full_name.trim() === '' || !profile.phone || profile.phone.trim() === '';
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
    // Estado inicial
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    isInitialized: false,
    error: null,
    needsProfileCompletion: false,

    // ──────────────────────────────────────────
    // Acciones
    // ──────────────────────────────────────────

    initialize: () => {
        // Suscribirse a cambios de sesión de Supabase Auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                set({ session, user: session?.user ?? null });

                if (session?.user) {
                    // Cargar perfil del usuario cuando hay sesión activa
                    await get().fetchProfile(session.user.id);
                    // Verificar si necesita completar perfil
                    const profile = get().profile;
                    set({ needsProfileCompletion: isProfileIncomplete(profile) });
                } else {
                    set({ profile: null, needsProfileCompletion: false });
                }

                set({ isLoading: false, isInitialized: true });
            }
        );

        // Retornar función de cleanup (para useEffect)
        return () => {
            subscription.unsubscribe();
        };
    },

    signIn: async (email: string, password: string) => {
        try {
            set({ isLoading: true, error: null });

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                throw error;
            }
            // El onAuthStateChange se encargará de actualizar el estado
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : 'Error al iniciar sesión';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    signInWithGoogle: async () => {
        try {
            set({ isLoading: true, error: null });

            const redirectUrl = makeRedirectUri({
                scheme: 'cargacompartida',
                path: 'auth/callback',
            });

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: true,
                },
            });

            if (error) throw error;
            if (!data.url) throw new Error('No se recibió URL de autenticación');

            // Abrir browser para OAuth
            if (Platform.OS === 'web') {
                // En web, simplemente redirigir
                window.location.href = data.url;
            } else {
                // En nativo, usar WebBrowser
                const result = await WebBrowser.openAuthSessionAsync(
                    data.url,
                    redirectUrl
                );

                if (result.type === 'success' && result.url) {
                    // Extraer tokens de la URL de callback
                    const url = new URL(result.url);
                    const params = new URLSearchParams(url.hash.substring(1));
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');

                    if (accessToken && refreshToken) {
                        await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });
                    }
                }
            }

            set({ isLoading: false });
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : 'Error al iniciar sesión con Google';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    signUp: async (
        email: string,
        password: string,
        metadata: { full_name: string; phone: string; role: 'client' | 'driver' }
    ) => {
        try {
            set({ isLoading: true, error: null });

            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: metadata.full_name,
                        phone: metadata.phone,
                        role: metadata.role,
                    },
                },
            });

            if (error) {
                throw error;
            }
            // El trigger handle_new_user() de la DB creará el profile automáticamente
            set({ isLoading: false });
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : 'Error al registrarse';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    signOut: async () => {
        try {
            set({ isLoading: true, error: null });
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            set({ session: null, user: null, profile: null, isLoading: false, needsProfileCompletion: false });
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : 'Error al cerrar sesión';
            set({ error: message, isLoading: false });
        }
    },

    fetchProfile: async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            set({ profile: data as Profile });
        } catch (error: unknown) {
            console.error('Error al cargar perfil:', error);
        }
    },

    completeProfile: async (data) => {
        try {
            set({ isLoading: true, error: null });

            const userId = get().user?.id;
            if (!userId) throw new Error('No hay usuario autenticado');

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from('profiles') as any)
                .update({
                    full_name: data.full_name,
                    phone: data.phone,
                    role: data.role,
                    cuit_cuil: data.cuit_cuil ?? null,
                })
                .eq('id', userId);

            if (error) throw error;

            // Recargar perfil
            await get().fetchProfile(userId);
            set({ needsProfileCompletion: false, isLoading: false });
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : 'Error al completar perfil';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    clearError: () => set({ error: null }),
}));
