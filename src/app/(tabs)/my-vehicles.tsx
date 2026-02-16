import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useVehicleStore } from '../../features/vehicles/stores/useVehicleStore';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { vehicleSchema } from '../../features/vehicles/types/vehicle.schema';
import type { VehicleType } from '../../types/database.types';

export default function MyVehiclesScreen() {
    const router = useRouter();
    const { myVehicles, isLoading, fetchMyVehicles, deleteVehicle, addVehicle, isSubmitting } = useVehicleStore();
    const [isRefreshing, setIsRefreshing] = useState(false);

    // UI State para Modal de Alta
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        plate: '',
        year: '',
        capacity_kg: '',
        vehicle_type: 'utilitario' as VehicleType,
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchMyVehicles();
    }, []);

    const onRefresh = async () => {
        setIsRefreshing(true);
        await fetchMyVehicles();
        setIsRefreshing(false);
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Eliminar vehículo',
            '¿Estás seguro? Esta acción no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await deleteVehicle(id);
                        if (success) Alert.alert('Eliminado', 'El vehículo ha sido eliminado.');
                    },
                },
            ]
        );
    };

    const handleAddVehicle = async () => {
        setFormErrors({});

        // Parse numbers
        const inputData = {
            ...formData,
            year: parseInt(formData.year) || 0,
            capacity_kg: parseInt(formData.capacity_kg) || 0,
        };

        const result = vehicleSchema.safeParse(inputData);

        if (!result.success) {
            const errors: Record<string, string> = {};
            result.error.issues.forEach((i: any) => {
                errors[i.path[0]] = i.message;
            });
            setFormErrors(errors);
            return;
        }

        const success = await addVehicle(result.data);
        if (success) {
            setShowAddModal(false);
            setFormData({ brand: '', model: '', plate: '', year: '', capacity_kg: '', vehicle_type: 'utilitario' });
            Alert.alert('Éxito', 'Vehículo agregado correctamente');
        }
    };

    return (
        <View className="flex-1 bg-surface-dark">
            {/* Header */}
            <View className="px-6 pt-4 pb-4 bg-surface border-b border-surface-light/10">
                <Text className="text-white text-2xl font-sans-bold">Mis Vehículos</Text>
                <Text className="text-gray-400">Administrá tu flota de transporte</Text>
            </View>

            {/* Lista */}
            <FlatList
                data={myVehicles}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#6366f1" />
                }
                ListEmptyComponent={
                    !isLoading ? (
                        <View className="items-center justify-center py-10">
                            <Text className="text-5xl mb-4">🚛</Text>
                            <Text className="text-white text-xl font-sans-bold mb-2">No tenés vehículos</Text>
                            <Text className="text-gray-400 text-center px-8">
                                Registrá tu primer vehículo para comenzar a publicar viajes.
                            </Text>
                        </View>
                    ) : null
                }
                renderItem={({ item }) => (
                    <View className="bg-surface p-4 rounded-2xl mb-4 border border-surface-light/10">
                        <View className="flex-row justify-between items-start">
                            <View>
                                <Text className="text-white text-lg font-sans-bold">
                                    {item.brand} {item.model}
                                </Text>
                                <Text className="text-gray-400 text-sm mt-1">
                                    {item.year} • {item.vehicle_type.toUpperCase()}
                                </Text>
                            </View>
                            <View className="bg-primary-600/20 px-3 py-1 rounded-full">
                                <Text className="text-primary-400 font-mono font-bold text-xs">
                                    {item.plate}
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row items-center mt-4 pt-4 border-t border-surface-light/10">
                            <View className="flex-1">
                                <Text className="text-gray-500 text-xs uppercase font-sans-bold">Capacidad</Text>
                                <Text className="text-white text-base font-sans-bold">{item.capacity_kg} kg</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => handleDelete(item.id)}
                                className="bg-red-500/10 px-4 py-2 rounded-lg"
                            >
                                <Text className="text-red-500 font-sans-bold text-sm">Eliminar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            {/* FAB Agregar */}
            <TouchableOpacity
                className="absolute bottom-6 right-6 bg-primary-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
                onPress={() => setShowAddModal(true)}
            >
                <Text className="text-white text-3xl font-light">+</Text>
            </TouchableOpacity>

            {/* Modal Alta */}
            <Modal visible={showAddModal} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
                    <View className="flex-1 bg-black/80 justify-end">
                        <View className="bg-surface rounded-t-3xl h-[85%]">
                            <View className="flex-row justify-between items-center p-6 border-b border-surface-light/10">
                                <Text className="text-white text-xl font-sans-bold">Nuevo Vehículo</Text>
                                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                    <Text className="text-gray-400">Cancelar</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView className="p-6" contentContainerStyle={{ paddingBottom: 40 }}>
                                <Input
                                    label="Patente"
                                    placeholder="AA123BB"
                                    value={formData.plate}
                                    onChangeText={(t) => setFormData({ ...formData, plate: t })}
                                    error={formErrors.plate}
                                    autoCapitalize="characters"
                                />
                                <View className="flex-row gap-4 mt-4">
                                    <View className="flex-1">
                                        <Input
                                            label="Marca"
                                            placeholder="Renault"
                                            value={formData.brand}
                                            onChangeText={(t) => setFormData({ ...formData, brand: t })}
                                            error={formErrors.brand}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Input
                                            label="Modelo"
                                            placeholder="Kangoo"
                                            value={formData.model}
                                            onChangeText={(t) => setFormData({ ...formData, model: t })}
                                            error={formErrors.model}
                                        />
                                    </View>
                                </View>
                                <View className="flex-row gap-4 mt-4">
                                    <View className="flex-1">
                                        <Input
                                            label="Año"
                                            placeholder="2020"
                                            keyboardType="numeric"
                                            value={formData.year}
                                            onChangeText={(t) => setFormData({ ...formData, year: t })}
                                            error={formErrors.year}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Input
                                            label="Capacidad (kg)"
                                            placeholder="Máx 3500"
                                            keyboardType="numeric"
                                            value={formData.capacity_kg}
                                            onChangeText={(t) => setFormData({ ...formData, capacity_kg: t })}
                                            error={formErrors.capacity_kg}
                                        />
                                    </View>
                                </View>

                                {/* Tipo Vehículo (Selector simple por ahora) */}
                                <View className="mt-4">
                                    <Text className="text-gray-400 mb-2 font-sans-medium">Tipo</Text>
                                    <View className="flex-row flex-wrap gap-2">
                                        {['utilitario', 'pickup', 'van', 'sedan'].map((type) => (
                                            <TouchableOpacity
                                                key={type}
                                                onPress={() => setFormData({ ...formData, vehicle_type: type as any })}
                                                className={`px-4 py-2 rounded-full border ${formData.vehicle_type === type
                                                    ? 'bg-primary-600 border-primary-500'
                                                    : 'bg-surface-light border-transparent'
                                                    }`}
                                            >
                                                <Text className={`capitalize ${formData.vehicle_type === type ? 'text-white' : 'text-gray-400'
                                                    }`}>
                                                    {type}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View className="mt-8">
                                    <Button
                                        title="Guardar Vehículo"
                                        onPress={handleAddVehicle}
                                        isLoading={isSubmitting}
                                    />
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
