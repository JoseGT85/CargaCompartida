import { router } from 'expo-router';
import { ChevronRight, MapPin, Package, Plus, Search, Truck } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../config/constants';
import { useAuthStore } from '../../features/auth/stores/useAuthStore';
import { useShipmentStore } from '../../features/shipments/stores/useShipmentStore';
import { useTripStore } from '../../features/trips/stores/useTripStore';
import { ShipmentCard } from '../../shared/components/ShipmentCard';
import { TripCard } from '../../shared/components/TripCard';

// ────────────────────────────────────────────────────────────────
// Pantalla de Inicio — Feed bidireccional por rol
// Choferes ven pedidos abiertos de clientes
// Clientes ven viajes disponibles de choferes
// ────────────────────────────────────────────────────────────────

function QuickActionCard({
    icon,
    title,
    subtitle,
    onPress,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            className="bg-card rounded-2xl p-4 flex-row items-center border border-border mb-3"
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center mr-4">
                {icon}
            </View>
            <View className="flex-1">
                <Text className="text-foreground text-base font-sans-bold">{title}</Text>
                <Text className="text-muted-foreground text-sm mt-0.5">{subtitle}</Text>
            </View>
            <ChevronRight size={20} color={COLORS.muted} />
        </TouchableOpacity>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <View className="flex-1 bg-card rounded-2xl p-4 border border-border items-center">
            <Text className="text-primary text-2xl font-sans-bold">{value}</Text>
            <Text className="text-muted-foreground text-xs mt-1">{label}</Text>
        </View>
    );
}

export default function HomeScreen() {
    const { profile } = useAuthStore();
    const { searchResults, searchTrips } = useTripStore();
    const { openShipments, fetchOpenShipments, offerForShipment } = useShipmentStore();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const isDriver = profile?.role === 'driver';

    // Cargar datos al montar
    useEffect(() => {
        if (isDriver) {
            fetchOpenShipments();
        } else {
            searchTrips({});
        }
    }, [isDriver]);

    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await useAuthStore.getState().fetchProfile(profile?.id ?? '');
        if (isDriver) {
            await fetchOpenShipments();
        } else {
            await searchTrips({});
        }
        setIsRefreshing(false);
    }, [profile?.id, isDriver]);

    const handleOfferForShipment = (shipmentId: string) => {
        if (!profile?.id) return;
        Alert.alert(
            'Ofrecer Viaje',
            '¿Querés ofrecer tu servicio para este pedido?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sí, Ofrecer',
                    onPress: async () => {
                        try {
                            await offerForShipment(shipmentId, profile.id);
                            Alert.alert('Oferta enviada', 'El cliente será notificado.');
                        } catch {
                            Alert.alert('Error', 'No se pudo enviar la oferta.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <ScrollView
            className="flex-1 bg-background"
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={onRefresh}
                    tintColor={COLORS.primary}
                />
            }
        >
            {/* Welcome */}
            <View className="px-6 pt-6 pb-4">
                <Text className="text-foreground text-2xl font-sans-bold">
                    {"Hola, "}{profile?.full_name?.split(' ')[0] || 'Usuario'}
                </Text>
                <Text className="text-muted-foreground text-base mt-1">
                    {isDriver
                        ? 'Revisá los pedidos disponibles y ofrecé tu servicio'
                        : 'Encontrá el mejor flete para tu carga'}
                </Text>
            </View>

            {/* Quick Actions */}
            <View className="px-6 mb-6">
                <Text className="text-muted-foreground text-xs font-sans-medium mb-3 tracking-wider">
                    {"ACCIONES RÁPIDAS"}
                </Text>
                {isDriver ? (
                    <>
                        <QuickActionCard
                            icon={<Plus size={24} color={COLORS.primary} />}
                            title="Publicar Viaje"
                            subtitle="Ofrecé tu espacio disponible"
                            onPress={() => router.push('/(tabs)/create-trip' as any)}
                        />
                        <QuickActionCard
                            icon={<Truck size={24} color={COLORS.primary} />}
                            title="Mis Vehículos"
                            subtitle="Administrá tu flota"
                            onPress={() => router.push('/(tabs)/my-vehicles' as any)}
                        />
                    </>
                ) : (
                    <>
                        <QuickActionCard
                            icon={<Search size={24} color={COLORS.primary} />}
                            title="Buscar Viajes"
                            subtitle="Encontrá un viaje para tu carga"
                            onPress={() => router.push('/(tabs)/search-trips' as any)}
                        />
                        <QuickActionCard
                            icon={<Plus size={24} color={COLORS.primary} />}
                            title="Crear Pedido"
                            subtitle="Publicá tu necesidad de envío"
                            onPress={() => router.push('/(tabs)/create-shipment' as any)}
                        />
                    </>
                )}
            </View>

            {/* Stats (drivers) */}
            {isDriver && profile && (
                <View className="px-6 mb-6">
                    <Text className="text-muted-foreground text-xs font-sans-medium mb-3 tracking-wider">
                        {"TU ACTIVIDAD"}
                    </Text>
                    <View className="flex-row gap-3">
                        <StatCard
                            label="Rating"
                            value={profile.rating_avg?.toFixed(1) ?? '0.0'}
                        />
                        <StatCard
                            label="Reseñas"
                            value={`${profile.rating_count ?? 0}`}
                        />
                        <StatCard
                            label="KYC"
                            value={
                                profile.kyc_status === 'approved' ? 'OK' :
                                    profile.kyc_status === 'submitted' ? '...' :
                                        profile.kyc_status === 'rejected' ? 'No' : '—'
                            }
                        />
                    </View>
                </View>
            )}

            {/* Feed: Pedidos para Choferes / Viajes para Clientes */}
            <View className="mb-6">
                <Text className="px-6 text-muted-foreground text-xs font-sans-medium mb-3 tracking-wider">
                    {isDriver ? 'PEDIDOS DISPONIBLES' : 'VIAJES DISPONIBLES'}
                </Text>

                {isDriver ? (
                    // Feed de pedidos para choferes
                    openShipments.length === 0 ? (
                        <View className="mx-6 bg-card rounded-2xl border border-border p-6 items-center">
                            <Package size={32} color={COLORS.muted} />
                            <Text className="text-foreground text-base font-sans-bold mt-3">
                                {"No hay pedidos disponibles"}
                            </Text>
                            <Text className="text-muted-foreground text-sm text-center mt-1">
                                {"Los pedidos de clientes aparecerán acá cuando estén disponibles."}
                            </Text>
                        </View>
                    ) : (
                        openShipments.map((shipment) => (
                            <ShipmentCard
                                key={shipment.id}
                                shipment={shipment}
                                showOfferButton
                                onOffer={() => handleOfferForShipment(shipment.id)}
                            />
                        ))
                    )
                ) : (
                    // Feed de viajes para clientes
                    searchResults.length === 0 ? (
                        <View className="mx-6 bg-card rounded-2xl border border-border p-6 items-center">
                            <Truck size={32} color={COLORS.muted} />
                            <Text className="text-foreground text-base font-sans-bold mt-3">
                                {"No hay viajes disponibles"}
                            </Text>
                            <Text className="text-muted-foreground text-sm text-center mt-1">
                                {"Los viajes de choferes aparecerán acá. También podés crear un pedido."}
                            </Text>
                        </View>
                    ) : (
                        searchResults.slice(0, 5).map((trip) => (
                            <TripCard key={trip.id} trip={trip} showBookButton />
                        ))
                    )
                )}
            </View>

            {/* Priority Routes */}
            <View className="px-6 mb-6">
                <Text className="text-muted-foreground text-xs font-sans-medium mb-3 tracking-wider">
                    {"RUTAS PRINCIPALES"}
                </Text>
                <View className="bg-card rounded-2xl border border-border overflow-hidden">
                    {[
                        { route: 'Mendoza ↔ Buenos Aires', road: 'Ruta 7' },
                        { route: 'Mendoza ↔ San Rafael', road: 'Ruta 40/143' },
                        { route: 'Mendoza ↔ San Juan', road: 'Ruta 40 Norte' },
                        { route: 'Mendoza ↔ Chile', road: 'Paso Los Libertadores' },
                    ].map((item, index) => (
                        <View
                            key={item.road}
                            className={`flex-row items-center px-4 py-3 ${index < 3 ? 'border-b border-border' : ''
                                }`}
                        >
                            <MapPin size={16} color={COLORS.primary} />
                            <View className="flex-1 ml-3">
                                <Text className="text-foreground text-sm font-sans-medium">{item.route}</Text>
                                <Text className="text-muted-foreground text-xs">{item.road}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}
