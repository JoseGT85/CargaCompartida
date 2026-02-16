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
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
    /** Indica si está en estado de carga */
    isLoading?: boolean;
    /** Tamaño del botón */
    size?: 'sm' | 'md' | 'lg';
    /** Clases adicionales para el texto del botón */
    textClassName?: string;
}

const baseStyles = 'h-14 rounded-2xl flex-row items-center justify-center active:scale-95 transition-transform';
const variants = {
    primary: 'bg-primary text-primary-foreground', // Lime
    secondary: 'bg-secondary border border-border text-secondary-foreground',
    outline: 'bg-transparent border-2 border-primary text-primary',
    ghost: 'bg-transparent text-primary',
    danger: 'bg-destructive text-destructive-foreground',
};

export function Button({
    title,
    variant = 'primary',
    isLoading = false,
    size = 'md', // Size is no longer directly used for styling, but kept for interface compatibility if needed elsewhere
    disabled,
    textClassName = '',
    ...props
}: ButtonProps) {
    const isDisabled = disabled || isLoading;

    const buttonVariantStyle = variants[variant] || variants.primary; // Fallback to primary

    return (
        <TouchableOpacity
            className={`${baseStyles} ${buttonVariantStyle} ${isDisabled ? 'opacity-50' : ''}`}
            disabled={isDisabled}
            activeOpacity={0.8}
            {...props}
        >
            {isLoading ? (
                <ActivityIndicator
                    color={variant === 'outline' || variant === 'ghost' ? '#6366f1' : '#ffffff'}
                    size="small"
                />
            ) : (
                <Text className={`font-sans-bold text-base ${variant === 'outline' || variant === 'ghost' ? 'text-primary' :
                    variant === 'primary' ? 'text-primary-foreground' : 'text-white'
                    } ${textClassName}`}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
}

