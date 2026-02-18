/**
 * Pantalla de edición de perfil.
 * Permite editar nombre, teléfono y CUIT/CUIL.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { z } from 'zod';
import { useAuthStore } from '../../features/auth/stores/useAuthStore';
import { supabase } from '../../lib/supabase';
import { Input } from '../../shared/components/Input';
import { Button } from '../../shared/components/Button';

// ────────────────────────────────────────────────────────────────
// Validación
// ────────────────────────────────────────────────────────────────

const editProfileSchema = z.object({
    full_name: z.string().min(3, 'Mínimo 3 caracteres'),
    phone: z.string().min(8, 'Teléfono inválido'),
    cuit_cuil: z.string().optional(),
});

// ────────────────────────────────────────────────────────────────
// Pantalla
// ────────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
    const { profile, user, fetchProfile } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [fullName, setFullName] = useState(profile?.full_name ?? '');
    const [phone, setPhone] = useState(profile?.phone ?? '');
    const [cuitCuil, setCuitCuil] = useState(profile?.cuit_cuil ?? '');

    const handleSave = async () => {
        setFieldErrors({});

        const result = editProfileSchema.safeParse({
            full_name: fullName,
            phone,
            cuit_cuil: cuitCuil || undefined,
        });

        if (!result.success) {
            const errors: Record<string, string> = {};
            result.error.issues.forEach((issue) => {
                errors[issue.path[0] as string] = issue.message;
            });
            setFieldErrors(errors);
            return;
        }

        setIsSubmitting(true);

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: result.data.full_name,
                phone: result.data.phone,
                cuit_cuil: result.data.cuit_cuil ?? null,
            })
            .eq('id', user?.id ?? '');

        if (error) {
            Alert.alert('Error', 'No se pudo actualizar el perfil. Intentá de nuevo.');
            setIsSubmitting(false);
            return;
        }

        // Refresh local state
        if (user?.id) {
            await fetchProfile(user.id);
        }

        setIsSubmitting(false);
        Alert.alert('Perfil actualizado', 'Tus datos fueron guardados correctamente.', [
            { text: 'OK', onPress: () => router.back() },
        ]);
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
                    <Text className="text-foreground text-2xl font-sans-bold mb-2">
                        Editar Perfil
                    </Text>
                    <Text className="text-muted-foreground text-base mb-6">
                        Actualizá tu información personal.
                    </Text>

                    <View className="bg-card rounded-2xl p-6 border border-border">
                        <Input
                            label="Nombre completo"
                            placeholder="Tu nombre"
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                            error={fieldErrors.full_name}
                        />

                        <Input
                            label="Teléfono"
                            placeholder="+54 261 555 1234"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            error={fieldErrors.phone}
                        />

                        <Input
                            label="CUIT/CUIL (opcional)"
                            placeholder="Ej: 20-12345678-9"
                            value={cuitCuil}
                            onChangeText={setCuitCuil}
                            keyboardType="numeric"
                            error={fieldErrors.cuit_cuil}
                        />
                    </View>

                    <View className="mt-6 gap-3">
                        <Button
                            title="Guardar Cambios"
                            onPress={handleSave}
                            isLoading={isSubmitting}
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
