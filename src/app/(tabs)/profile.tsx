/**
 * Pantalla de Perfil del usuario.
 * Muestra datos del perfil, estado KYC, rating, y opciones.
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';

import { useAuthStore } from '../../features/auth/stores/useAuthStore';
import { Button } from '../../shared/components/Button';

export default function ProfileScreen() {
    const { profile, signOut } = useAuthStore();

    const handleSignOut = () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro que querés cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Cerrar Sesión', style: 'destructive', onPress: signOut },
            ],
        );
    };

    const roleLabels: Record<string, string> = {
        client: '📦 Cliente',
        driver: '🚛 Chofer',
        admin: '⚙️ Admin',
    };

    const kycLabels: Record<string, { label: string; color: string }> = {
        pending: { label: 'Pendiente', color: 'text-warning' },
        submitted: { label: 'En revisión', color: 'text-primary-400' },
        approved: { label: 'Verificado ✅', color: 'text-success' },
        rejected: { label: 'Rechazado', color: 'text-danger' },
    };

    return (
        <ScrollView className="flex-1 bg-surface-dark" contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Avatar y nombre */}
            <View className="items-center pt-8 pb-6">
                <View className="w-24 h-24 rounded-full bg-primary-600/30 items-center justify-center mb-4">
                    <Text className="text-4xl">
                        {profile?.role === 'driver' ? '🚛' : '📦'}
                    </Text>
                </View>
                <Text className="text-white text-2xl font-sans-bold">
                    {profile?.full_name || 'Usuario'}
                </Text>
                <Text className="text-primary-400 text-base mt-1">
                    {roleLabels[profile?.role ?? 'client']}
                </Text>
            </View>

            {/* Info del perfil */}
            <View className="mx-6 bg-surface rounded-2xl p-4 mb-4">
                <Text className="text-gray-400 text-xs mb-3 font-sans-medium">INFORMACIÓN</Text>

                <View className="flex-row justify-between py-2 border-b border-surface-dark">
                    <Text className="text-gray-400">Teléfono</Text>
                    <Text className="text-white">{profile?.phone || 'No configurado'}</Text>
                </View>

                <View className="flex-row justify-between py-2 border-b border-surface-dark">
                    <Text className="text-gray-400">CUIT/CUIL</Text>
                    <Text className="text-white">{profile?.cuit_cuil || 'No configurado'}</Text>
                </View>

                <View className="flex-row justify-between py-2 border-b border-surface-dark">
                    <Text className="text-gray-400">Estado KYC</Text>
                    <Text className={kycLabels[profile?.kyc_status ?? 'pending'].color}>
                        {kycLabels[profile?.kyc_status ?? 'pending'].label}
                    </Text>
                </View>

                <View className="flex-row justify-between py-2">
                    <Text className="text-gray-400">Rating</Text>
                    <Text className="text-white">
                        ⭐ {profile?.rating_avg?.toFixed(1) ?? '0.0'} ({profile?.rating_count ?? 0} reseñas)
                    </Text>
                </View>
            </View>

            {/* Acciones */}
            <View className="mx-6 mb-4">
                <TouchableOpacity
                    className="bg-surface rounded-2xl p-4 flex-row items-center justify-between mb-3"
                    onPress={() => router.push('/(tabs)/edit-profile' as any)}
                >
                    <Text className="text-white text-base">✏️ Editar Perfil</Text>
                    <Text className="text-gray-500">→</Text>
                </TouchableOpacity>

                {profile?.role === 'driver' && (
                    <TouchableOpacity className="bg-surface rounded-2xl p-4 flex-row items-center justify-between mb-3">
                        <Text className="text-white text-base">🚗 Mis Vehículos</Text>
                        <Text className="text-gray-500">→</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Cerrar sesión */}
            <View className="mx-6 mt-4">
                <Button
                    title="Cerrar Sesión"
                    onPress={handleSignOut}
                    variant="outline"
                />
            </View>
        </ScrollView>
    );
}
