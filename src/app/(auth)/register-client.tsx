import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { Package } from 'lucide-react-native';
import { Input, Button } from '../../shared/components';
import { useAuthStore } from '../../features/auth/stores/useAuthStore';
import { registerClientSchema } from '../../features/auth/types/auth.schema';
import { COLORS } from '../../config/constants';

// ────────────────────────────────────────────────────────────────
// Pantalla de Registro de Cliente (PyME)
// ────────────────────────────────────────────────────────────────

export default function RegisterClientScreen() {
    const { signUp, isLoading, error, clearError } = useAuthStore();

    const [form, setForm] = useState({
        full_name: '',
        phone: '',
        email: '',
        password: '',
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
        if (error) clearError();
    };

    const handleRegister = async () => {
        const result = registerClientSchema.safeParse(form);
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
            await signUp(result.data.email, result.data.password, {
                full_name: result.data.full_name,
                phone: result.data.phone,
                role: 'client',
            });

            Alert.alert(
                'Registro exitoso',
                'Tu cuenta fue creada correctamente. Ya podés iniciar sesión.',
                [{ text: 'Ir a Login' }]
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
            className="flex-1 bg-background"
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="px-6 py-8">
                    {/* Header */}
                    <View className="items-center mb-8">
                        <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
                            <Package size={32} color={COLORS.primary} />
                        </View>
                        <Text className="text-2xl font-sans-bold text-foreground">
                            Registro de Cliente
                        </Text>
                        <Text className="text-muted-foreground text-sm text-center mt-2">
                            Registrate para enviar carga por las rutas de Mendoza
                        </Text>
                    </View>

                    {/* Formulario */}
                    <View className="bg-card rounded-2xl p-6 mb-4 border border-border">
                        <Text className="text-foreground text-lg font-sans-bold mb-4">
                            Datos Personales
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

                    {/* Error general */}
                    {error && (
                        <View className="bg-destructive/10 rounded-lg p-3 mb-4">
                            <Text className="text-danger text-sm">{error}</Text>
                        </View>
                    )}

                    {/* Botón de registro */}
                    <Button
                        title="Crear Cuenta de Cliente"
                        onPress={handleRegister}
                        isLoading={isLoading}
                    />

                    {/* Link a login */}
                    <View className="flex-row justify-center items-center mt-6 mb-8">
                        <Text className="text-muted-foreground">¿Ya tenés cuenta? </Text>
                        <Link href="/(auth)/login" asChild>
                            <Text className="text-primary font-semibold">
                                Iniciá Sesión
                            </Text>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
