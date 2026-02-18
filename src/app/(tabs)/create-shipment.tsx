import { router } from 'expo-router';
import { Package } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { z } from 'zod';
import { COLORS } from '../../config/constants';
import { useShipmentStore } from '../../features/shipments/stores/useShipmentStore';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';

// ────────────────────────────────────────────────────────────────
// Pantalla de Crear Pedido de Envío
// ────────────────────────────────────────────────────────────────

const shipmentSchema = z.object({
    description: z.string().min(5, 'Describí qué necesitás enviar (mín. 5 caracteres)'),
    weight_kg: z.number().min(1, 'El peso debe ser mayor a 0').max(3500, 'Máximo 3500 kg'),
    origin_name: z.string().min(2, 'Indicá el origen'),
    dest_name: z.string().min(2, 'Indicá el destino'),
    budget: z.number().min(0).optional(),
    notes: z.string().optional(),
});

export default function CreateShipmentScreen() {
    const { createShipment, isLoading } = useShipmentStore();
    const [form, setForm] = useState({
        description: '',
        weight_kg: '',
        origin_name: '',
        dest_name: '',
        budget: '',
        notes: '',
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (fieldErrors[field]) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const handleSubmit = async () => {
        const parsed = shipmentSchema.safeParse({
            ...form,
            weight_kg: Number(form.weight_kg) || 0,
            budget: form.budget ? Number(form.budget) : undefined,
        });

        if (!parsed.success) {
            const errors: Record<string, string> = {};
            parsed.error.issues.forEach((issue) => {
                const field = issue.path[0] as string;
                errors[field] = issue.message;
            });
            setFieldErrors(errors);
            return;
        }

        try {
            setFieldErrors({});
            await createShipment(parsed.data);
            Alert.alert(
                'Pedido creado',
                'Tu pedido fue publicado. Los choferes podrán verlo y ofrecerte su servicio.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch {
            Alert.alert('Error', 'No se pudo crear el pedido. Intentá de nuevo.');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-background"
        >
            <ScrollView
                contentContainerStyle={{ paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="px-6 pt-6">
                    {/* Header */}
                    <View className="items-center mb-6">
                        <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
                            <Package size={32} color={COLORS.primary} />
                        </View>
                        <Text className="text-2xl font-sans-bold text-foreground">
                            {"Crear Pedido de Envío"}
                        </Text>
                        <Text className="text-muted-foreground text-sm text-center mt-2">
                            {"Describí qué necesitás enviar y los choferes te contactarán"}
                        </Text>
                    </View>

                    {/* Formulario */}
                    <View className="bg-card rounded-2xl p-6 mb-4 border border-border">
                        <Text className="text-foreground text-lg font-sans-bold mb-4">
                            {"Datos del Envío"}
                        </Text>

                        <Input
                            label="¿Qué necesitás enviar?"
                            placeholder="Ej: 10 cajas de vino, 500kg"
                            value={form.description}
                            onChangeText={(text) => handleChange('description', text)}
                            error={fieldErrors.description}
                            multiline
                        />

                        <Input
                            label="Peso estimado (kg)"
                            placeholder="Ej: 500"
                            keyboardType="numeric"
                            value={form.weight_kg}
                            onChangeText={(text) => handleChange('weight_kg', text)}
                            error={fieldErrors.weight_kg}
                        />
                    </View>

                    <View className="bg-card rounded-2xl p-6 mb-4 border border-border">
                        <Text className="text-foreground text-lg font-sans-bold mb-4">
                            {"Ruta"}
                        </Text>

                        <Input
                            label="Origen"
                            placeholder="Ej: Mendoza Capital"
                            value={form.origin_name}
                            onChangeText={(text) => handleChange('origin_name', text)}
                            error={fieldErrors.origin_name}
                        />

                        <Input
                            label="Destino"
                            placeholder="Ej: Buenos Aires"
                            value={form.dest_name}
                            onChangeText={(text) => handleChange('dest_name', text)}
                            error={fieldErrors.dest_name}
                        />
                    </View>

                    <View className="bg-card rounded-2xl p-6 mb-4 border border-border">
                        <Text className="text-foreground text-lg font-sans-bold mb-4">
                            {"Opcional"}
                        </Text>

                        <Input
                            label="Presupuesto ($)"
                            placeholder="Ej: 50000"
                            keyboardType="numeric"
                            value={form.budget}
                            onChangeText={(text) => handleChange('budget', text)}
                            error={fieldErrors.budget}
                        />

                        <Input
                            label="Notas adicionales"
                            placeholder="Ej: Necesito que llegue antes del viernes"
                            value={form.notes}
                            onChangeText={(text) => handleChange('notes', text)}
                            multiline
                        />
                    </View>

                    {/* Botones */}
                    <View className="gap-3">
                        <Button
                            title="Publicar Pedido"
                            onPress={handleSubmit}
                            isLoading={isLoading}
                        />
                        <Button
                            title="Cancelar"
                            variant="ghost"
                            onPress={() => router.back()}
                        />
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
