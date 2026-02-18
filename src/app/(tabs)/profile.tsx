/**
 * Pantalla de Perfil del usuario.
 * Muestra datos del perfil, estado KYC con badge, rating, y opciones.
 */

import { router } from 'expo-router';
import { AlertCircle, Car, ChevronRight, Package, Pencil, Shield, ShieldCheck, Star, Truck } from 'lucide-react-native';
import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { COLORS } from '../../config/constants';
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
        client: 'Cliente',
        driver: 'Chofer',
        admin: 'Admin',
    };

    const kycConfig: Record<string, { label: string; color: string; icon: any; bgColor: string }> = {
        pending: { label: 'Pendiente', color: COLORS.warning, icon: AlertCircle, bgColor: 'bg-warning/10' },
        submitted: { label: 'En revisión', color: COLORS.primary, icon: Shield, bgColor: 'bg-primary/10' },
        approved: { label: 'Verificado', color: COLORS.success, icon: ShieldCheck, bgColor: 'bg-success/10' },
        rejected: { label: 'Rechazado', color: COLORS.danger, icon: AlertCircle, bgColor: 'bg-danger/10' },
    };

    const kycStatus = profile?.kyc_status ?? 'pending';
    const kyc = kycConfig[kycStatus] || kycConfig.pending;
    const KycIcon = kyc.icon;
    const isDriver = profile?.role === 'driver';

    return (
        <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Avatar y nombre */}
            <View className="items-center pt-8 pb-6">
                <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-4">
                    {isDriver ? (
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

                {/* Badge de verificación (choferes) */}
                {isDriver && (
                    <View className={`flex-row items-center mt-2 rounded-full px-3 py-1.5 ${kyc.bgColor}`}>
                        <KycIcon size={14} color={kyc.color} />
                        <Text className="text-xs font-sans-medium ml-1.5" style={{ color: kyc.color }}>
                            {kyc.label}
                        </Text>
                    </View>
                )}
            </View>

            {/* Info del perfil */}
            <View className="mx-6 bg-card rounded-2xl p-4 mb-4 border border-border">
                <Text className="text-muted-foreground text-xs mb-3 font-sans-medium tracking-wider">{"INFORMACIÓN"}</Text>

                <View className="flex-row justify-between py-2 border-b border-border">
                    <Text className="text-muted-foreground">{"Teléfono"}</Text>
                    <Text className="text-foreground">{profile?.phone || 'No configurado'}</Text>
                </View>

                <View className="flex-row justify-between py-2 border-b border-border">
                    <Text className="text-muted-foreground">{"CUIT/CUIL"}</Text>
                    <Text className="text-foreground">{profile?.cuit_cuil || 'No configurado'}</Text>
                </View>

                {isDriver && (
                    <View className="flex-row justify-between py-2 border-b border-border">
                        <Text className="text-muted-foreground">{"Estado KYC"}</Text>
                        <View className="flex-row items-center">
                            <KycIcon size={14} color={kyc.color} />
                            <Text className="ml-1" style={{ color: kyc.color }}>
                                {kyc.label}
                            </Text>
                        </View>
                    </View>
                )}

                <View className="flex-row justify-between items-center py-2">
                    <Text className="text-muted-foreground">{"Rating"}</Text>
                    <View className="flex-row items-center">
                        <Star size={14} color={COLORS.warning} />
                        <Text className="text-foreground ml-1">
                            {profile?.rating_avg?.toFixed(1) ?? '0.0'}{" "}({profile?.rating_count ?? 0})
                        </Text>
                    </View>
                </View>
            </View>

            {/* Documentación pendiente (choferes) */}
            {isDriver && kycStatus === 'pending' && (
                <TouchableOpacity
                    className="mx-6 bg-warning/10 rounded-2xl p-4 mb-4 border border-warning/30 flex-row items-center"
                    onPress={() => router.push('/(tabs)/edit-profile' as any)}
                    activeOpacity={0.7}
                >
                    <AlertCircle size={20} color={COLORS.warning} />
                    <View className="flex-1 ml-3">
                        <Text className="text-warning font-sans-bold text-sm">
                            {"Verificá tu perfil"}
                        </Text>
                        <Text className="text-muted-foreground text-xs mt-0.5">
                            {"Subí tu documentación para que los clientes confíen en vos."}
                        </Text>
                    </View>
                    <ChevronRight size={18} color={COLORS.warning} />
                </TouchableOpacity>
            )}

            {/* Acciones */}
            <View className="mx-6 mb-4">
                <TouchableOpacity
                    className="bg-card rounded-2xl p-4 flex-row items-center justify-between mb-3 border border-border"
                    onPress={() => router.push('/(tabs)/edit-profile' as any)}
                >
                    <View className="flex-row items-center">
                        <Pencil size={18} color={COLORS.muted} />
                        <Text className="text-foreground text-base ml-3">{"Editar Perfil"}</Text>
                    </View>
                    <ChevronRight size={18} color={COLORS.muted} />
                </TouchableOpacity>

                {isDriver && (
                    <TouchableOpacity
                        className="bg-card rounded-2xl p-4 flex-row items-center justify-between mb-3 border border-border"
                        onPress={() => router.push('/(tabs)/my-vehicles' as any)}
                    >
                        <View className="flex-row items-center">
                            <Car size={18} color={COLORS.muted} />
                            <Text className="text-foreground text-base ml-3">{"Mis Vehículos"}</Text>
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
