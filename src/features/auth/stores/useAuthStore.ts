import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import type { Profile } from '../../../types/database.types';

// ────────────────────────────────────────────────────────────────
// Store de Autenticación — Zustand
// CargaCompartida
// ────────────────────────────────────────────────────────────────

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
}

interface AuthActions {
    /** Inicializa el listener de sesión y carga el perfil. Retorna función de cleanup. */
    initialize: () => (() => void);
    /** Inicia sesión con email y contraseña */
    signIn: (email: string, password: string) => Promise<void>;
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
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
    // Estado inicial
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    isInitialized: false,
    error: null,

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
                } else {
                    set({ profile: null });
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
            // Resetear isLoading: si Supabase requiere confirmación de email,
            // onAuthStateChange no se dispara y la UI quedaría en spinner
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
            set({ session: null, user: null, profile: null, isLoading: false });
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

    clearError: () => set({ error: null }),
}));
