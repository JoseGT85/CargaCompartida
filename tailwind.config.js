/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/app/**/*.{js,jsx,ts,tsx}",
        "./src/features/**/*.{js,jsx,ts,tsx}",
        "./src/shared/**/*.{js,jsx,ts,tsx}",
    ],
    presets: [require("nativewind/preset")],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Paleta migrada de Lovable (Dark Theme)
                background: '#080c17', // hsl(222 47% 6%)
                foreground: '#f1f5f9', // hsl(210 20% 97%)

                card: {
                    DEFAULT: '#0d1321', // hsl(222 47% 9%)
                    foreground: '#f1f5f9',
                },

                popover: {
                    DEFAULT: '#0d1321',
                    foreground: '#f1f5f9',
                },

                // En Lovable 'accent' es el color principal (Verde Lima)
                primary: {
                    DEFAULT: '#a3e635', // hsl(82 85% 55%)
                    foreground: '#0d1321', // Texto oscuro sobre lime
                    // Variaciones para hovers/press
                    50: '#f7fee7',
                    100: '#ecfccb',
                    200: '#d9f99d',
                    300: '#bef264',
                    400: '#a3e635', // Base
                    500: '#84cc16',
                    600: '#65a30d',
                    700: '#4d7c0f',
                    800: '#3f6212',
                    900: '#365314',
                },

                secondary: {
                    DEFAULT: '#1e293b', // hsl(217 33% 17%)
                    foreground: '#f1f5f9',
                },

                muted: {
                    DEFAULT: '#1e293b',
                    foreground: '#94a3b8', // hsl(215 20% 65%)
                },

                accent: {
                    DEFAULT: '#1e293b', // En lovable accent a veces es secondary en dark mode
                    foreground: '#f1f5f9',
                },

                destructive: {
                    DEFAULT: '#7f1d1d', // hsl(0 63% 31%)
                    foreground: '#f1f5f9',
                },

                border: '#1e293b', // hsl(217 33% 17%)
                input: '#1e293b',
                ring: '#a3e635', // hsl(82 85% 55%)

                // Compatibilidad con código legacy (mapeando a los nuevos)
                surface: {
                    dark: '#080c17', // background
                    DEFAULT: '#0d1321', // card
                    light: '#1e293b', // secondary
                },
                // success/warning/danger mantenidos
                success: '#10b981',
                warning: '#f59e0b',
                danger: '#ef4444',
            },
            fontFamily: {
                sans: ['Inter_400Regular'],
                'sans-medium': ['Inter_500Medium'],
                'sans-bold': ['Inter_700Bold'],
            },
            borderRadius: {
                lg: '16px', // var(--radius) ~ 1rem
                md: '14px',
                sm: '12px',
                xl: '20px',
                '2xl': '24px', // Usado mucho en el login
            }
        },
    },
    plugins: [],
};
