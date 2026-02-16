/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/app/**/*.{js,jsx,ts,tsx}",
        "./src/features/**/*.{js,jsx,ts,tsx}",
        "./src/shared/**/*.{js,jsx,ts,tsx}",
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                // Paleta principal CargaCompartida
                primary: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1', // Principal
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                },
                surface: {
                    dark: '#1a1a2e',
                    DEFAULT: '#16213e',
                    light: '#0f3460',
                },
                accent: '#e94560',
                success: '#10b981',
                warning: '#f59e0b',
                danger: '#ef4444',
            },
            fontFamily: {
                sans: ['Inter_400Regular'],
                'sans-medium': ['Inter_500Medium'],
                'sans-bold': ['Inter_700Bold'],
            },
        },
    },
    plugins: [],
};
