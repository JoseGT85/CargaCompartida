import { router } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, Truck } from 'lucide-react-native';
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
import { useAuthStore } from '../../features/auth/stores/useAuthStore';
import { loginSchema } from '../../features/auth/types/auth.schema';
import { Button, Input } from '../../shared/components';

// ────────────────────────────────────────────────────────────────
// Pantalla de Login — Con Google OAuth
// ────────────────────────────────────────────────────────────────

export default function LoginScreen() {
    const { signIn, signInWithGoogle, isLoading, error, clearError } = useAuthStore();
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

    const handleGoogleLogin = async () => {
        try {
            await signInWithGoogle();
        } catch {
            Alert.alert('Error', 'No se pudo iniciar sesión con Google. Intentá de nuevo.');
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
                        {"CargaCompartida"}
                    </Text>
                    <Text className="text-muted-foreground mt-1 mb-8 text-center text-base">
                        {"Tu carga, tu precio."}
                    </Text>

                    {/* Google OAuth Button */}
                    <TouchableOpacity
                        className="w-full h-14 rounded-2xl bg-white flex-row items-center justify-center mb-4"
                        onPress={handleGoogleLogin}
                        activeOpacity={0.8}
                        disabled={isLoading}
                    >
                        <Text className="text-lg mr-3">{"🔵"}</Text>
                        <Text className="text-gray-800 font-sans-bold text-base">
                            {"Continuar con Google"}
                        </Text>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View className="w-full flex-row items-center my-4">
                        <View className="flex-1 h-px bg-border" />
                        <Text className="text-muted-foreground text-xs mx-4">{"o con email"}</Text>
                        <View className="flex-1 h-px bg-border" />
                    </View>

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
                                className="pl-12"
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
                                className="pl-12 pr-12"
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

                        {!!error && (
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

                    {/* Registration Options */}
                    <View className="w-full mt-3 gap-3">
                        <Button
                            title="Registrarme como Chofer"
                            onPress={() => router.push('/(auth)/register')}
                            variant="ghost"
                            className="w-full border-2 border-border bg-card h-14 rounded-2xl"
                            textClassName="font-semibold text-foreground"
                        />
                        <Button
                            title="Registrarme como Cliente"
                            onPress={() => router.push('/(auth)/register-client' as any)}
                            variant="ghost"
                            className="w-full border-2 border-border bg-card h-14 rounded-2xl"
                            textClassName="font-semibold text-foreground"
                        />
                    </View>

                    <Text className="text-xs text-muted-foreground mt-6 text-center">
                        {"Mendoza, Argentina"}
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
