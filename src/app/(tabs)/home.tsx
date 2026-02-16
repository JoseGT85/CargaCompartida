import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useAuthStore } from '../../features/auth/stores/useAuthStore';
import { Button } from '../../shared/components';

// ────────────────────────────────────────────────────────────────
// Pantalla de Inicio — CargaCompartida
// Placeholder para la Fase 1
// ────────────────────────────────────────────────────────────────

export default function HomeScreen() {
    const { profile, signOut, isLoading } = useAuthStore();

    return (
        <ScrollView className="flex-1 bg-surface-dark">
            <View className="px-6 py-8">
                {/* Bienvenida */}
                <View className="bg-surface rounded-2xl p-6 mb-6">
                    <Text className="text-2xl font-bold text-white mb-2">
                        ¡Hola{profile?.full_name ? `, ${profile.full_name}` : ''}! 👋
                    </Text>
                    <Text className="text-gray-400 text-base">
                        Bienvenido a CargaCompartida. Conectamos tu carga con vehículos que
                        vuelven vacíos por las rutas de Mendoza.
                    </Text>
                </View>

                {/* Info de perfil */}
                {profile && (
                    <View className="bg-surface rounded-2xl p-6 mb-6">
                        <Text className="text-white text-lg font-semibold mb-4">
                            📋 Tu Perfil
                        </Text>
                        <View className="space-y-2">
                            <View className="flex-row justify-between py-2 border-b border-gray-700">
                                <Text className="text-gray-400">Rol</Text>
                                <Text className="text-white font-medium capitalize">
                                    {profile.role === 'driver' ? 'Chofer' : profile.role === 'client' ? 'Cliente' : 'Admin'}
                                </Text>
                            </View>
                            <View className="flex-row justify-between py-2 border-b border-gray-700">
                                <Text className="text-gray-400">KYC</Text>
                                <Text className={`font-medium ${profile.kyc_status === 'approved' ? 'text-success' :
                                    profile.kyc_status === 'rejected' ? 'text-danger' :
                                        'text-warning'
                                    }`}>
                                    {profile.kyc_status === 'pending' ? 'Pendiente' :
                                        profile.kyc_status === 'submitted' ? 'En revisión' :
                                            profile.kyc_status === 'approved' ? 'Aprobado' : 'Rechazado'}
                                </Text>
                            </View>
                            <View className="flex-row justify-between py-2">
                                <Text className="text-gray-400">Teléfono</Text>
                                <Text className="text-white font-medium">{profile.phone}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Rutas prioritarias */}
                <View className="bg-surface rounded-2xl p-6 mb-6">
                    <Text className="text-white text-lg font-semibold mb-4">
                        🛣️ Rutas Principales
                    </Text>
                    {[
                        { route: 'Mendoza ↔ Buenos Aires', road: 'Ruta 7' },
                        { route: 'Mendoza ↔ San Rafael', road: 'Ruta 40/143' },
                        { route: 'Mendoza ↔ San Juan', road: 'Ruta 40 Norte' },
                        { route: 'Mendoza ↔ Chile', road: 'Paso Los Libertadores' },
                    ].map((item) => (
                        <View key={item.road} className="flex-row items-center py-2.5 border-b border-gray-700/50">
                            <Text className="text-primary-400 mr-3">📍</Text>
                            <View className="flex-1">
                                <Text className="text-white text-sm font-medium">{item.route}</Text>
                                <Text className="text-gray-500 text-xs">{item.road}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Botón de cerrar sesión */}
                <Button
                    title="Cerrar Sesión"
                    variant="outline"
                    onPress={signOut}
                    isLoading={isLoading}
                />
            </View>
        </ScrollView>
    );
}
