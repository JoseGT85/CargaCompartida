/**
 * Pantalla de edición de perfil (placeholder).
 * Se implementará completamente en la siguiente iteración.
 */

import React from 'react';
import { View, Text } from 'react-native';

export default function EditProfileScreen() {
    return (
        <View className="flex-1 bg-surface-dark items-center justify-center px-8">
            <Text className="text-4xl mb-4">✏️</Text>
            <Text className="text-white text-xl font-sans-bold text-center">
                Editar Perfil
            </Text>
            <Text className="text-gray-400 text-center mt-2">
                Próximamente: edición de nombre, teléfono y CUIT/CUIL.
            </Text>
        </View>
    );
}
