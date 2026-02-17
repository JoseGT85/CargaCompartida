/**
 * Constantes de diseño para uso en style={} props.
 * NativeWind resuelve colores via className, pero los props como
 * ActivityIndicator.color, shadowColor, tintColor requieren strings.
 *
 * Estos valores DEBEN coincidir con tailwind.config.js.
 */

export const COLORS = {
    primary: '#a3e635',
    primaryForeground: '#0d1321',
    background: '#080c17',
    card: '#0d1321',
    surface: '#0d1321',
    surfaceDark: '#080c17',
    surfaceLight: '#1e293b',
    foreground: '#f1f5f9',
    muted: '#94a3b8',
    border: '#1e293b',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
} as const;
