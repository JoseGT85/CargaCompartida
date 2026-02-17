import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Input, Button } from '../../shared/components';
import { useAuthStore } from '../../features/auth/stores/useAuthStore';
import { supabase } from '../../lib/supabase';
import {
    registerDriverSchema,
    type RegisterDriverFormData,
} from '../../features/auth/types/auth.schema';
import { BUSINESS_RULES } from '../../config/env';
import type { VehicleType } from '../../types/database.types';

// ────────────────────────────────────────────────────────────────
// Pantalla de Registro de Chofer — CargaCompartida
// ────────────────────────────────────────────────────────────────

const VEHICLE_TYPES: { label: string; value: VehicleType }[] = [
    { label: 'Sedán', value: 'sedan' },
    { label: 'Pickup', value: 'pickup' },
    { label: 'Van', value: 'van' },
    { label: 'SUV', value: 'suv' },
    { label: 'Utilitario', value: 'utilitario' },
];

export default function RegisterScreen() {
    const { signUp, isLoading, error, clearError } = useAuthStore();

    const [form, setForm] = useState({
        full_name: '',
        phone: '',
        email: '',
        password: '',
        plate: '',
        brand: '',
        model: '',
        year: '',
        vehicle_type: 'pickup' as VehicleType,
        capacity_kg: '',
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [selectedType, setSelectedType] = useState<VehicleType>('pickup');

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (fieldErrors[field]) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
        if (error) clearError();
    };

    const selectVehicleType = (type: VehicleType) => {
        setSelectedType(type);
        setForm((prev) => ({ ...prev, vehicle_type: type }));
    };

    const handleRegister = async () => {
        // Preparar datos para validación Zod
        const dataToValidate = {
            ...form,
            year: form.year ? parseInt(form.year, 10) : undefined,
            capacity_kg: form.capacity_kg ? parseInt(form.capacity_kg, 10) : undefined,
        };

        // Validar con Zod — incluye restricción de 3500 kg
        const result = registerDriverSchema.safeParse(dataToValidate);
        if (!result.success) {
            const errors: Record<string, string> = {};
            result.error.issues.forEach((issue) => {
                const field = issue.path[0] as string;
                errors[field] = issue.message;
            });
            setFieldErrors(errors);

            // Si el error es de capacity_kg, mostrar alerta especial
            if (errors.capacity_kg) {
                Alert.alert(
                    '⚠️ Capacidad no permitida',
                    `La capacidad máxima permitida es ${BUSINESS_RULES.MAX_CAPACITY_KG} kg.\n\nEsto es un requisito legal (Ley 24.653) para vehículos livianos.`,
                    [{ text: 'Entendido' }]
                );
            }
            return;
        }

        try {
            setFieldErrors({});
            await signUp(result.data.email, result.data.password, {
                full_name: result.data.full_name,
                phone: result.data.phone,
                role: 'driver',
            });

            // Intentar guardar el vehículo si el usuario ya tiene sesión activa
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await supabase.from('vehicles').insert({
                    driver_id: session.user.id,
                    plate: result.data.plate,
                    brand: result.data.brand,
                    model: result.data.model,
                    year: result.data.year,
                    vehicle_type: result.data.vehicle_type,
                    capacity_kg: result.data.capacity_kg,
                    is_active: true,
                });
            }

            Alert.alert(
                'Registro exitoso',
                'Tu cuenta fue creada correctamente. Ya podés iniciar sesión.',
                [{ text: 'Ir a Login', onPress: () => router.replace('/(auth)/login') }]
            );
        } catch {
            Alert.alert(
                'Error al registrarse',
                'Hubo un problema al crear tu cuenta. Intentá de nuevo.'
            );
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-surface-dark"
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="px-6 py-8">
                    {/* Header */}
                    <View className="items-center mb-8">
                        <Text className="text-3xl font-bold text-white mb-2">
                            🚛 Registro de Chofer
                        </Text>
                        <Text className="text-gray-400 text-sm text-center">
                            Completá tus datos y los de tu vehículo para empezar a transportar
                        </Text>
                    </View>

                    {/* Sección: Datos Personales */}
                    <View className="bg-surface rounded-2xl p-6 mb-4">
                        <Text className="text-white text-lg font-semibold mb-4">
                            📋 Datos Personales
                        </Text>

                        <Input
                            label="Nombre completo"
                            placeholder="Ej: Juan Carlos Pérez"
                            autoCapitalize="words"
                            value={form.full_name}
                            onChangeText={(text) => handleChange('full_name', text)}
                            error={fieldErrors.full_name}
                        />

                        <Input
                            label="Teléfono"
                            placeholder="Ej: +54 261 555 1234"
                            keyboardType="phone-pad"
                            value={form.phone}
                            onChangeText={(text) => handleChange('phone', text)}
                            error={fieldErrors.phone}
                        />

                        <Input
                            label="Email"
                            placeholder="tu@email.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            value={form.email}
                            onChangeText={(text) => handleChange('email', text)}
                            error={fieldErrors.email}
                        />

                        <Input
                            label="Contraseña"
                            placeholder="Mínimo 6 caracteres"
                            secureTextEntry
                            value={form.password}
                            onChangeText={(text) => handleChange('password', text)}
                            error={fieldErrors.password}
                        />
                    </View>

                    {/* Sección: Datos del Vehículo */}
                    <View className="bg-surface rounded-2xl p-6 mb-4">
                        <Text className="text-white text-lg font-semibold mb-4">
                            🚗 Datos del Vehículo
                        </Text>

                        <Input
                            label="Patente"
                            placeholder="Ej: AB 123 CD"
                            autoCapitalize="characters"
                            value={form.plate}
                            onChangeText={(text) => handleChange('plate', text)}
                            error={fieldErrors.plate}
                        />

                        <Input
                            label="Marca"
                            placeholder="Ej: Toyota"
                            value={form.brand}
                            onChangeText={(text) => handleChange('brand', text)}
                            error={fieldErrors.brand}
                        />

                        <Input
                            label="Modelo"
                            placeholder="Ej: Hilux"
                            value={form.model}
                            onChangeText={(text) => handleChange('model', text)}
                            error={fieldErrors.model}
                        />

                        <Input
                            label="Año"
                            placeholder="Ej: 2022"
                            keyboardType="numeric"
                            value={form.year}
                            onChangeText={(text) => handleChange('year', text)}
                            error={fieldErrors.year}
                        />

                        {/* Selector de tipo de vehículo */}
                        <View className="mb-4">
                            <Text className="text-gray-300 text-sm font-medium mb-1.5">
                                Tipo de vehículo
                            </Text>
                            <View className="flex-row flex-wrap gap-2">
                                {VEHICLE_TYPES.map((type) => (
                                    <View key={type.value} className="mb-1">
                                        <Text
                                            onPress={() => selectVehicleType(type.value)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedType === type.value
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-surface-dark text-gray-400 border border-gray-600'
                                                }`}
                                        >
                                            {type.label}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                            {fieldErrors.vehicle_type && (
                                <Text className="text-danger text-xs mt-1">
                                    {fieldErrors.vehicle_type}
                                </Text>
                            )}
                        </View>

                        {/* Campo de capacidad con advertencia visual */}
                        <View>
                            <Input
                                label={`Capacidad de carga (kg) — Máx. ${BUSINESS_RULES.MAX_CAPACITY_KG} kg`}
                                placeholder="Ej: 1500"
                                keyboardType="numeric"
                                value={form.capacity_kg}
                                onChangeText={(text) => handleChange('capacity_kg', text)}
                                error={fieldErrors.capacity_kg}
                                helperText={`Solo vehículos livianos (≤ ${BUSINESS_RULES.MAX_CAPACITY_KG} kg). Requisito legal Ley 24.653.`}
                            />
                            {/* Indicador visual de límite */}
                            {form.capacity_kg && parseInt(form.capacity_kg, 10) > BUSINESS_RULES.MAX_CAPACITY_KG && (
                                <View className="bg-danger/20 border border-danger rounded-lg p-3 mt-1">
                                    <Text className="text-danger text-sm font-semibold">
                                        ⛔ Excede el límite legal de {BUSINESS_RULES.MAX_CAPACITY_KG} kg
                                    </Text>
                                    <Text className="text-danger/80 text-xs mt-1">
                                        Los vehículos con capacidad superior a 3500 kg no pueden registrarse en la plataforma (Ley 24.653).
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Error general */}
                    {error && (
                        <View className="bg-danger/10 rounded-lg p-3 mb-4">
                            <Text className="text-danger text-sm">{error}</Text>
                        </View>
                    )}

                    {/* Botón de registro */}
                    <Button
                        title="Crear Cuenta de Chofer"
                        onPress={handleRegister}
                        isLoading={isLoading}
                        size="lg"
                    />

                    {/* Link a login */}
                    <View className="flex-row justify-center items-center mt-6 mb-8">
                        <Text className="text-gray-400">¿Ya tenés cuenta? </Text>
                        <Link href="/(auth)/login" asChild>
                            <Text className="text-primary-400 font-semibold">
                                Iniciá Sesión
                            </Text>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
