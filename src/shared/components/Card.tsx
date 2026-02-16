import React from 'react';
import { View } from 'react-native';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
    return (
        <View className={`bg-card rounded-2xl border border-border p-6 ${className}`}>
            {children}
        </View>
    );
};
