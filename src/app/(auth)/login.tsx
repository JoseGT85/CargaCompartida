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
import { loginSchema, type LoginFormData } from '../../features/auth/types/auth.schema';

// ────────────────────────────────────────────────────────────────
// Pantalla de Login — CargaCompartida
// ────────────────────────────────────────────────────────────────

export default function LoginScreen() {
    const { signIn, isLoading, error, clearError } = useAuthStore();

    const [form, setForm] = useState<LoginFormData>({
        email: '',
        password: '',
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleChange = (field: keyof LoginFormData, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        // Limpiar error del campo al editar
        if (fieldErrors[field]) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
        if (error) clearError();
    };

    const handleLogin = async () => {
        // Validar con Zod
        const result = loginSchema.safeParse(form);
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
            setFieldErrors({});
            await signIn(result.data.email, result.data.password);
            // La navegación se maneja automáticamente por el _layout.tsx
        } catch {
            Alert.alert(
                'Error al iniciar sesión',
                'Verifica tus credenciales e intenta de nuevo.'
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
                <View className="flex-1 justify-center px-6 py-12">
                    {/* Header */}
                    <View className="items-center mb-10">
                        <Text className="text-4xl font-bold text-white mb-2">
                            🚛 CargaCompartida
                        </Text>
                        <Text className="text-gray-400 text-base text-center">
                            Conectamos tu carga con vehículos que vuelven vacíos
                        </Text>
                    </View>

                    {/* Formulario */}
                    <View className="bg-surface rounded-2xl p-6 mb-6">
                        <Text className="text-white text-xl font-semibold mb-6">
                            Iniciar Sesión
                        </Text>

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
                            placeholder="Tu contraseña"
                            secureTextEntry
                            value={form.password}
                            onChangeText={(text) => handleChange('password', text)}
                            error={fieldErrors.password}
                        />

                        {error && (
                            <View className="bg-danger/10 rounded-lg p-3 mb-4">
                                <Text className="text-danger text-sm">{error}</Text>
                            </View>
                        )}

                        <Button
                            title="Ingresar"
                            onPress={handleLogin}
                            isLoading={isLoading}
                            size="lg"
                        />
                    </View>

                    {/* Link a registro */}
                    <View className="flex-row justify-center items-center">
                        <Text className="text-gray-400">¿No tenés cuenta? </Text>
                        <Link href="/(auth)/register" asChild>
                            <Text className="text-primary-400 font-semibold">
                                Registrate
                            </Text>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
