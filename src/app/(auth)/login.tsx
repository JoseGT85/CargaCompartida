import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Image,
    TouchableOpacity,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Input, Button, Card } from '../../shared/components';
import { useAuthStore } from '../../features/auth/stores/useAuthStore';
import { loginSchema, type LoginFormData } from '../../features/auth/types/auth.schema';
import { Truck, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

// ────────────────────────────────────────────────────────────────
// Pantalla de Login — Migración visual desde Lovable
// ────────────────────────────────────────────────────────────────

export default function LoginScreen() {
    const { signIn, isLoading, error, clearError } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleLogin = async () => {
        const formData = { email, password };
        const result = loginSchema.safeParse(formData);

        if (!result.success) {
            const errors: Record<string, string> = {};
            result.error.issues.forEach((issue) => {
                errors[issue.path[0] as string] = issue.message;
            });
            setFieldErrors(errors);
            return;
        }

        try {
            setFieldErrors({});
            await signIn(email, password);
        } catch {
            // El error se maneja en el store
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-background"
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, }}
                keyboardShouldPersistTaps="handled"
                className="px-6"
            >
                <View className="flex-1 flex-col items-center justify-center w-full max-w-sm mx-auto">

                    {/* Logo Square */}
                    <View className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6">
                        <Truck className="text-primary-foreground" size={32} />
                    </View>

                    <Text className="text-2xl font-sans-bold text-foreground tracking-tight">
                        CargaCompartida
                    </Text>
                    <Text className="text-muted-foreground mt-1 mb-8 text-center text-base">
                        Tu carga, tu precio.
                    </Text>

                    {/* Form Container */}
                    <View className="w-full space-y-4 gap-4">

                        {/* Email Input */}
                        <View className="relative">
                            <View className="absolute left-4 top-4 z-10 w-5 h-5">
                                <Mail size={20} color="#94a3b8" />
                            </View>
                            <Input
                                placeholder="Email"
                                value={email}
                                onChangeText={(t) => {
                                    setEmail(t);
                                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                                    if (error) clearError();
                                }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                className="pl-12" // Padding left para el icono
                                error={fieldErrors.email}
                            />
                        </View>

                        {/* Password Input */}
                        <View className="relative">
                            <View className="absolute left-4 top-4 z-10 w-5 h-5">
                                <Lock size={20} color="#94a3b8" />
                            </View>
                            <Input
                                placeholder="Contraseña"
                                value={password}
                                onChangeText={(t) => {
                                    setPassword(t);
                                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                                }}
                                secureTextEntry={!showPassword}
                                className="pl-12 pr-12" // Padding left icono, right ojo
                                error={fieldErrors.password}
                            />
                            <TouchableOpacity
                                className="absolute right-4 top-4 z-10"
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff size={20} color="#94a3b8" />
                                ) : (
                                    <Eye size={20} color="#94a3b8" />
                                )}
                            </TouchableOpacity>
                        </View>

                        {error && (
                            <Text className="text-destructive text-sm text-center">{error}</Text>
                        )}

                        <Button
                            title="Ingresar"
                            onPress={handleLogin}
                            isLoading={isLoading}
                            variant="primary"
                            textClassName="font-bold text-base"
                        />
                    </View>

                    {/* Register Button */}
                    <Button
                        title="Registrarme como Chofer"
                        onPress={() => router.push('/(auth)/register')}
                        variant="ghost"
                        className="w-full mt-3 border-2 border-border bg-card h-14 rounded-2xl"
                        textClassName="font-semibold text-foreground"
                    />

                    <Text className="text-xs text-muted-foreground mt-6 text-center">
                        Mendoza, Argentina 🇦🇷
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
