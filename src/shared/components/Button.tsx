import React from 'react';
import {
    TouchableOpacity,
    Text,
    ActivityIndicator,
    type TouchableOpacityProps,
} from 'react-native';

// ────────────────────────────────────────────────────────────────
// Botón reutilizable — CargaCompartida UI Kit
// ────────────────────────────────────────────────────────────────

interface ButtonProps extends TouchableOpacityProps {
    /** Texto del botón */
    title: string;
    /** Variante visual */
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    /** Indica si está en estado de carga */
    isLoading?: boolean;
    /** Tamaño del botón */
    size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
    primary: 'bg-primary-600 active:bg-primary-700',
    secondary: 'bg-surface-light active:bg-surface-dark',
    outline: 'bg-transparent border-2 border-primary-500 active:bg-primary-500/10',
    danger: 'bg-danger active:bg-red-700',
};

const variantTextStyles = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-primary-500',
    danger: 'text-white',
};

const sizeStyles = {
    sm: 'py-2 px-4',
    md: 'py-3 px-6',
    lg: 'py-4 px-8',
};

const sizeTextStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
};

export function Button({
    title,
    variant = 'primary',
    isLoading = false,
    size = 'md',
    disabled,
    ...props
}: ButtonProps) {
    const isDisabled = disabled || isLoading;

    return (
        <TouchableOpacity
            className={`rounded-xl items-center justify-center ${variantStyles[variant]} ${sizeStyles[size]} ${isDisabled ? 'opacity-50' : ''
                }`}
            disabled={isDisabled}
            activeOpacity={0.8}
            {...props}
        >
            {isLoading ? (
                <ActivityIndicator
                    color={variant === 'outline' ? '#6366f1' : '#ffffff'}
                    size="small"
                />
            ) : (
                <Text
                    className={`font-semibold ${variantTextStyles[variant]} ${sizeTextStyles[size]}`}
                >
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
}
