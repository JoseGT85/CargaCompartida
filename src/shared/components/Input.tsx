import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    type TextInputProps,
} from 'react-native';

// ────────────────────────────────────────────────────────────────
// Input reutilizable — CargaCompartida UI Kit
// ────────────────────────────────────────────────────────────────

interface InputProps extends TextInputProps {
    /** Etiqueta del campo */
    label: string;
    /** Mensaje de error (si existe, el campo se muestra en rojo) */
    error?: string;
    /** Texto de ayuda debajo del campo */
    helperText?: string;
}

export function Input({
    label,
    error,
    helperText,
    ...props
}: InputProps) {
    const [isFocused, setIsFocused] = useState(false);

    const borderColor = error
        ? 'border-danger'
        : isFocused
            ? 'border-primary-500'
            : 'border-gray-600';

    return (
        <View className="mb-4">
            <Text className="text-gray-300 text-sm font-medium mb-1.5">
                {label}
            </Text>
            <TextInput
                className={`bg-surface-dark text-white text-base px-4 py-3 rounded-xl border ${borderColor}`}
                placeholderTextColor="#6b7280"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                {...props}
            />
            {error ? (
                <Text className="text-danger text-xs mt-1">{error}</Text>
            ) : helperText ? (
                <Text className="text-gray-500 text-xs mt-1">{helperText}</Text>
            ) : null}
        </View>
    );
}
