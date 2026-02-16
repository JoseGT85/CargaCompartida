import { Redirect } from 'expo-router';

/**
 * Entry Point de la aplicación (ruta `/`).
 * Redirige automáticamente a la home (/(tabs)/home).
 * 
 * El `AuthGuard` en `_layout.tsx` interceptará esta navegación:
 * - Si NO hay sesión → Redirige a login
 * - Si HAY sesión → Permite ir a home
 */
export default function Index() {
    return <Redirect href="/(tabs)/home" />;
}
