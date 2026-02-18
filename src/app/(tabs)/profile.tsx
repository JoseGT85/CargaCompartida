/**
 * Pantalla de Perfil del usuario.
 * Muestra datos del perfil, estado KYC, rating, y opciones.
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Truck, Package, Pencil, Car, ChevronRight, Star } from 'lucide-react-native';

import { useAuthStore } from '../../features/auth/stores/useAuthStore';
import { Button } from '../../shared/components/Button';
import { COLORS } from '../../config/constants';

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
        client: 'Cliente',
        driver: 'Chofer',
        admin: 'Admin',
    };

    const kycLabels: Record<string, { label: string; color: string }> = {
        pending: { label: 'Pendiente', color: 'text-warning' },
        submitted: { label: 'En revisión', color: 'text-primary-400' },
        approved: { label: 'Verificado', color: 'text-success' },
        rejected: { label: 'Rechazado', color: 'text-danger' },
    };

    return (
        <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Avatar y nombre */}
            <View className="items-center pt-8 pb-6">
                <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-4">
                    {profile?.role === 'driver' ? (
                        <Truck size={40} color={COLORS.primary} />
                    ) : (
                        <Package size={40} color={COLORS.primary} />
                    )}
                </View>
                <Text className="text-foreground text-2xl font-sans-bold">
                    {profile?.full_name || 'Usuario'}
                </Text>
                <Text className="text-primary text-base mt-1">
                    {roleLabels[profile?.role ?? 'client']}
                </Text>
            </View>

            {/* Info del perfil */}
            <View className="mx-6 bg-card rounded-2xl p-4 mb-4 border border-border">
                <Text className="text-muted-foreground text-xs mb-3 font-sans-medium tracking-wider">INFORMACIÓN</Text>

                <View className="flex-row justify-between py-2 border-b border-border">
                    <Text className="text-muted-foreground">Teléfono</Text>
                    <Text className="text-foreground">{profile?.phone || 'No configurado'}</Text>
                </View>

                <View className="flex-row justify-between py-2 border-b border-border">
                    <Text className="text-muted-foreground">CUIT/CUIL</Text>
                    <Text className="text-foreground">{profile?.cuit_cuil || 'No configurado'}</Text>
                </View>

                <View className="flex-row justify-between py-2 border-b border-border">
                    <Text className="text-muted-foreground">Estado KYC</Text>
                    <Text className={kycLabels[profile?.kyc_status ?? 'pending'].color}>
                        {kycLabels[profile?.kyc_status ?? 'pending'].label}
                    </Text>
                </View>

                <View className="flex-row justify-between items-center py-2">
                    <Text className="text-muted-foreground">Rating</Text>
                    <View className="flex-row items-center">
                        <Star size={14} color={COLORS.warning} />
                        <Text className="text-foreground ml-1">
                            {profile?.rating_avg?.toFixed(1) ?? '0.0'} ({profile?.rating_count ?? 0})
                        </Text>
                    </View>
                </View>
            </View>

            {/* Acciones */}
            <View className="mx-6 mb-4">
                <TouchableOpacity
                    className="bg-card rounded-2xl p-4 flex-row items-center justify-between mb-3 border border-border"
                    onPress={() => router.push('/(tabs)/edit-profile' as any)}
                >
                    <View className="flex-row items-center">
                        <Pencil size={18} color={COLORS.muted} />
                        <Text className="text-foreground text-base ml-3">Editar Perfil</Text>
                    </View>
                    <ChevronRight size={18} color={COLORS.muted} />
                </TouchableOpacity>

                {profile?.role === 'driver' && (
                    <TouchableOpacity
                        className="bg-card rounded-2xl p-4 flex-row items-center justify-between mb-3 border border-border"
                        onPress={() => router.push('/(tabs)/my-vehicles' as any)}
                    >
                        <View className="flex-row items-center">
                            <Car size={18} color={COLORS.muted} />
                            <Text className="text-foreground text-base ml-3">Mis Vehículos</Text>
                        </View>
                        <ChevronRight size={18} color={COLORS.muted} />
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
