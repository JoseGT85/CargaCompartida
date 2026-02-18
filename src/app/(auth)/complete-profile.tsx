import { router } from 'expo-router';
import { Package, Truck } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { z } from 'zod';
import { COLORS } from '../../config/constants';
import { useAuthStore } from '../../features/auth/stores/useAuthStore';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';

// ────────────────────────────────────────────────────────────────
// Pantalla de Completar Perfil (post-registro Google OAuth)
// ────────────────────────────────────────────────────────────────

const profileSchema = z.object({
    full_name: z.string().min(3, 'Mínimo 3 caracteres'),
    phone: z.string().min(8, 'Teléfono inválido'),
    role: z.enum(['client', 'driver']),
    cuit_cuil: z.string().optional(),
});

export default function CompleteProfileScreen() {
    const { completeProfile, isLoading, user } = useAuthStore();
    const [role, setRole] = useState<'client' | 'driver' | null>(null);
    const [form, setForm] = useState({
        full_name: user?.user_metadata?.full_name ?? '',
        phone: '',
        cuit_cuil: '',
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
        if (!role) {
            Alert.alert('Seleccioná un rol', 'Elegí si sos Chofer o Cliente para continuar.');
            return;
        }

        const result = profileSchema.safeParse({ ...form, role });
        if (!result.success) {
            const errors: Record<string, string> = {};
            result.error.issues.forEach((issue) => {
                const field = issue.path[0] as string;
                errors[field] = issue.message;
            });
            setFieldErrors(errors);
            return;
        }

        try {
            await completeProfile({
                full_name: result.data.full_name,
                phone: result.data.phone,
                role: result.data.role,
                cuit_cuil: result.data.cuit_cuil || undefined,
            });
            router.replace('/(tabs)/home');
        } catch {
            Alert.alert('Error', 'No se pudo completar el perfil. Intentá de nuevo.');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-background"
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="px-6 py-8">
                    {/* Header */}
                    <View className="items-center mb-8">
                        <Text className="text-2xl font-sans-bold text-foreground">
                            {"Completá tu Perfil"}
                        </Text>
                        <Text className="text-muted-foreground text-sm text-center mt-2">
                            {"Necesitamos algunos datos más para continuar"}
                        </Text>
                    </View>

                    {/* Selector de Rol */}
                    <View className="mb-6">
                        <Text className="text-muted-foreground text-xs font-sans-medium mb-3 tracking-wider">
                            {"¿QUÉ TIPO DE CUENTA NECESITÁS?"}
                        </Text>
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                className={`flex-1 rounded-2xl p-5 border-2 items-center ${role === 'driver'
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border bg-card'
                                    }`}
                                onPress={() => setRole('driver')}
                                activeOpacity={0.7}
                            >
                                <Truck
                                    size={32}
                                    color={role === 'driver' ? COLORS.primary : COLORS.muted}
                                />
                                <Text
                                    className={`mt-2 font-sans-bold text-base ${role === 'driver' ? 'text-primary' : 'text-foreground'
                                        }`}
                                >
                                    {"Chofer"}
                                </Text>
                                <Text className="text-muted-foreground text-xs text-center mt-1">
                                    {"Ofrecé espacio en tu vehículo"}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className={`flex-1 rounded-2xl p-5 border-2 items-center ${role === 'client'
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border bg-card'
                                    }`}
                                onPress={() => setRole('client')}
                                activeOpacity={0.7}
                            >
                                <Package
                                    size={32}
                                    color={role === 'client' ? COLORS.primary : COLORS.muted}
                                />
                                <Text
                                    className={`mt-2 font-sans-bold text-base ${role === 'client' ? 'text-primary' : 'text-foreground'
                                        }`}
                                >
                                    {"Cliente"}
                                </Text>
                                <Text className="text-muted-foreground text-xs text-center mt-1">
                                    {"Enviá tu carga con otros"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Formulario */}
                    <View className="bg-card rounded-2xl p-6 mb-4 border border-border">
                        <Text className="text-foreground text-lg font-sans-bold mb-4">
                            {"Datos Personales"}
                        </Text>

                        <Input
                            label="Nombre completo"
                            placeholder="Ej: María García"
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
                            label="CUIT/CUIL (opcional)"
                            placeholder="Ej: 20-12345678-9"
                            keyboardType="numeric"
                            value={form.cuit_cuil}
                            onChangeText={(text) => handleChange('cuit_cuil', text)}
                            error={fieldErrors.cuit_cuil}
                        />
                    </View>

                    {/* Botón */}
                    <Button
                        title="Continuar"
                        onPress={handleSubmit}
                        isLoading={isLoading}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
