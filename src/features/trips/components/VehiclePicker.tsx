import React from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, ActivityIndicator } from 'react-native';
import { useVehicleStore } from '../../vehicles/stores/useVehicleStore';
import { Vehicle } from '../../../types/database.types';

interface VehiclePickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (vehicle: Vehicle) => void;
    selectedVehicleId?: string | null;
}

export const VehiclePicker: React.FC<VehiclePickerProps> = ({
    visible,
    onClose,
    onSelect,
    selectedVehicleId,
}) => {
    const { myVehicles, isLoading, fetchMyVehicles } = useVehicleStore();

    // Cargar vehículos al abrir
    React.useEffect(() => {
        if (visible) {
            fetchMyVehicles();
        }
    }, [visible]);

    const renderItem = ({ item }: { item: Vehicle }) => {
        const isSelected = item.id === selectedVehicleId;
        return (
            <TouchableOpacity
                className={`p-4 mb-3 rounded-xl border ${isSelected
                        ? 'bg-primary-600/20 border-primary-500'
                        : 'bg-surface-dark border-surface-light'
                    }`}
                onPress={() => onSelect(item)}
            >
                <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-white font-sans-bold text-lg">
                        {item.brand} {item.model}
                    </Text>
                    {isSelected && <Text className="text-primary-500 text-lg">✅</Text>}
                </View>
                <View className="flex-row items-center">
                    <View className="bg-surface-light px-2 py-0.5 rounded mr-3">
                        <Text className="text-gray-300 font-mono text-xs">
                            {item.plate}
                        </Text>
                    </View>
                    <Text className="text-gray-400 text-sm">
                        {item.capacity_kg} kg • {item.vehicle_type}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View className="flex-1 bg-black/80 justify-end">
                <View className="bg-surface rounded-t-3xl h-[70%] p-6">
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-white text-xl font-sans-bold">
                            Seleccionar Vehículo
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text className="text-gray-400 text-base">Cerrar</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    {isLoading ? (
                        <ActivityIndicator size="large" color="#6366f1" />
                    ) : myVehicles.length === 0 ? (
                        <View className="items-center justify-center flex-1">
                            <Text className="text-gray-400 text-center mb-4">
                                No tenés vehículos registrados.
                            </Text>
                            <TouchableOpacity
                                className="bg-primary-600 px-6 py-3 rounded-xl"
                                onPress={onClose} // Idealmente navegaría a AddVehicle
                            >
                                <Text className="text-white font-sans-bold">
                                    Registrar Vehículo
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList
                            data={myVehicles}
                            keyExtractor={(item) => item.id}
                            renderItem={renderItem}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 40 }}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};
