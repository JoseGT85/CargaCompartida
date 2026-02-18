/**
 * Pantalla de edición de perfil expandida.
 * - Datos personales (nombre, teléfono, CUIT/CUIL)
 * - Documentación para choferes (DNI, Licencia, Seguro)
 * - Subida de avatar
 * - Enviar para verificación KYC
 */

import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { AlertCircle, Camera, Check, Clock, ShieldCheck, Upload } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';
import { COLORS } from '../../config/constants';
import { useAuthStore } from '../../features/auth/stores/useAuthStore';
import { supabase } from '../../lib/supabase';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';

// Helper para actualizar profiles sin conflictos de tipado estricto
async function updateProfileRow(id: string, payload: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (supabase.from('profiles') as any).update(payload).eq('id', id);
}

// ────────────────────────────────────────────────────────────────
// Validación
// ────────────────────────────────────────────────────────────────

const editProfileSchema = z.object({
    full_name: z.string().min(3, 'Mínimo 3 caracteres'),
    phone: z.string().min(8, 'Teléfono inválido'),
    cuit_cuil: z.string().optional(),
});

// ────────────────────────────────────────────────────────────────
// Componente de subida de documento
// ────────────────────────────────────────────────────────────────

function DocumentUpload({
    label,
    description,
    currentUrl,
    onUpload,
    isUploading,
}: {
    label: string;
    description: string;
    currentUrl: string | null;
    onUpload: () => void;
    isUploading: boolean;
}) {
    const hasDocument = !!currentUrl;

    return (
        <TouchableOpacity
            className={`rounded-2xl p-4 border-2 border-dashed mb-3 ${hasDocument ? 'border-success bg-success/5' : 'border-border bg-card'
                }`}
            onPress={onUpload}
            activeOpacity={0.7}
            disabled={isUploading}
        >
            <View className="flex-row items-center">
                <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${hasDocument ? 'bg-success/10' : 'bg-primary/10'
                    }`}>
                    {hasDocument ? (
                        <Check size={20} color={COLORS.success} />
                    ) : (
                        <Upload size={20} color={COLORS.primary} />
                    )}
                </View>
                <View className="flex-1">
                    <Text className={`font-sans-bold text-sm ${hasDocument ? 'text-success' : 'text-foreground'
                        }`}>
                        {hasDocument ? `${label} ✓` : label}
                    </Text>
                    <Text className="text-muted-foreground text-xs mt-0.5">
                        {hasDocument ? 'Tocá para reemplazar' : description}
                    </Text>
                </View>
                <Camera size={18} color={COLORS.muted} />
            </View>
        </TouchableOpacity>
    );
}

// ────────────────────────────────────────────────────────────────
// KYC Status Badge
// ────────────────────────────────────────────────────────────────

function KycBadge({ status }: { status: string }) {
    const configs: Record<string, { icon: any; label: string; color: string; bg: string }> = {
        pending: { icon: AlertCircle, label: 'Verificación pendiente', color: COLORS.warning, bg: 'bg-warning/10' },
        submitted: { icon: Clock, label: 'En revisión', color: COLORS.primary, bg: 'bg-primary/10' },
        approved: { icon: ShieldCheck, label: 'Verificado', color: COLORS.success, bg: 'bg-success/10' },
        rejected: { icon: AlertCircle, label: 'Rechazado', color: COLORS.danger, bg: 'bg-danger/10' },
    };

    const config = configs[status] || configs.pending;
    const IconComponent = config.icon;

    return (
        <View className={`flex-row items-center rounded-xl px-3 py-2 ${config.bg} mb-4`}>
            <IconComponent size={16} color={config.color} />
            <Text className="text-sm font-sans-medium ml-2" style={{ color: config.color }}>
                {config.label}
            </Text>
        </View>
    );
}

// ────────────────────────────────────────────────────────────────
// Pantalla
// ────────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
    const { profile, user, fetchProfile } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [fullName, setFullName] = useState(profile?.full_name ?? '');
    const [phone, setPhone] = useState(profile?.phone ?? '');
    const [cuitCuil, setCuitCuil] = useState(profile?.cuit_cuil ?? '');

    const isDriver = profile?.role === 'driver';

    // ─── Helper: Subir imagen a Supabase Storage ───
    const uploadDocument = async (fieldName: string) => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para subir documentos.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
                base64: false,
            });

            if (result.canceled || !result.assets?.length) return;

            setIsUploading(true);

            const asset = result.assets![0];
            const fileExt = asset.uri.split('.').pop() || 'jpg';
            const fileName = `${user?.id}/${fieldName}_${Date.now()}.${fileExt}`;

            // Subir archivo a storage
            const formData = new FormData();
            formData.append('file', {
                uri: asset.uri,
                name: fileName,
                type: `image/${fileExt}`,
            } as any);

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(fileName, formData, { upsert: true });

            if (uploadError) throw uploadError;

            // Obtener URL pública
            const { data: urlData } = supabase.storage
                .from('documents')
                .getPublicUrl(fileName);

            // Actualizar perfil con la URL del documento
            const { error: updateError } = await updateProfileRow(
                user?.id ?? '',
                { [fieldName]: urlData.publicUrl },
            );

            if (updateError) throw updateError;

            // Refrescar perfil
            if (user?.id) {
                await fetchProfile(user.id);
            }

            Alert.alert('Documento subido', 'El archivo se guardó correctamente.');
        } catch (error) {
            console.error('Error al subir documento:', error);
            Alert.alert('Error', 'No se pudo subir el documento. Intentá de nuevo.');
        } finally {
            setIsUploading(false);
        }
    };

    // ─── Enviar para verificación ───
    const submitForVerification = async () => {
        if (!profile?.dni_front_url || !profile?.license_url) {
            Alert.alert('Documentos faltantes', 'Necesitás subir al menos el DNI (frente) y la Licencia de Conducir.');
            return;
        }

        try {
            setIsSubmitting(true);

            const { error } = await updateProfileRow(user?.id ?? '', {
                kyc_status: 'submitted',
                kyc_submitted_at: new Date().toISOString(),
            });

            if (error) throw error;

            if (user?.id) {
                await fetchProfile(user.id);
            }

            Alert.alert('Enviado', 'Tu documentación fue enviada para revisión. Te notificaremos cuando sea aprobada.');
        } catch {
            Alert.alert('Error', 'No se pudo enviar para verificación.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── Guardar datos personales ───
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

        const { error } = await updateProfileRow(user?.id ?? '', {
            full_name: result.data.full_name,
            phone: result.data.phone,
            cuit_cuil: result.data.cuit_cuil ?? null,
        });

        if (error) {
            Alert.alert('Error', 'No se pudo actualizar el perfil. Intentá de nuevo.');
            setIsSubmitting(false);
            return;
        }

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
                        {"Editar Perfil"}
                    </Text>
                    <Text className="text-muted-foreground text-base mb-6">
                        {"Actualizá tu información personal."}
                    </Text>

                    {/* KYC Status (solo choferes) */}
                    {isDriver && (
                        <KycBadge status={profile?.kyc_status ?? 'pending'} />
                    )}

                    {/* Datos Personales */}
                    <View className="bg-card rounded-2xl p-6 border border-border mb-4">
                        <Text className="text-muted-foreground text-xs font-sans-medium mb-3 tracking-wider">
                            {"DATOS PERSONALES"}
                        </Text>

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

                    {/* Documentación (solo choferes) */}
                    {isDriver && (
                        <View className="bg-card rounded-2xl p-6 border border-border mb-4">
                            <Text className="text-muted-foreground text-xs font-sans-medium mb-3 tracking-wider">
                                {"DOCUMENTACIÓN"}
                            </Text>
                            <Text className="text-muted-foreground text-sm mb-4">
                                {"Subí tu documentación para verificar tu perfil y ganar confianza."}
                            </Text>

                            <DocumentUpload
                                label="DNI - Frente"
                                description="Foto del frente de tu DNI"
                                currentUrl={profile?.dni_front_url ?? null}
                                onUpload={() => uploadDocument('dni_front_url')}
                                isUploading={isUploading}
                            />

                            <DocumentUpload
                                label="DNI - Dorso"
                                description="Foto del dorso de tu DNI"
                                currentUrl={profile?.dni_back_url ?? null}
                                onUpload={() => uploadDocument('dni_back_url')}
                                isUploading={isUploading}
                            />

                            <DocumentUpload
                                label="Licencia de Conducir"
                                description="Foto de tu carnet de conducir vigente"
                                currentUrl={profile?.license_url ?? null}
                                onUpload={() => uploadDocument('license_url')}
                                isUploading={isUploading}
                            />

                            <DocumentUpload
                                label="Seguro del Vehículo"
                                description="Póliza de seguro vigente"
                                currentUrl={profile?.vehicle_insurance_url ?? null}
                                onUpload={() => uploadDocument('vehicle_insurance_url')}
                                isUploading={isUploading}
                            />

                            {/* Botón de verificación */}
                            {profile?.kyc_status === 'pending' && (
                                <View className="mt-2">
                                    <Button
                                        title="Enviar para Verificación"
                                        onPress={submitForVerification}
                                        isLoading={isSubmitting}
                                        variant="outline"
                                    />
                                </View>
                            )}

                            {profile?.kyc_status === 'rejected' && (
                                <View className="mt-2">
                                    <Text className="text-danger text-sm text-center mb-2">
                                        {"Tu documentación fue rechazada. Podés volver a enviarla."}
                                    </Text>
                                    <Button
                                        title="Re-enviar para Verificación"
                                        onPress={submitForVerification}
                                        isLoading={isSubmitting}
                                        variant="outline"
                                    />
                                </View>
                            )}
                        </View>
                    )}

                    {/* Botones */}
                    <View className="gap-3">
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
