import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

interface DateTimePickerInputProps {
    label: string;
    value: Date;
    onChange: (date: Date) => void;
    mode?: 'date' | 'time' | 'datetime';
    minimumDate?: Date;
    error?: string;
}

export const DateTimePickerInput: React.FC<DateTimePickerInputProps> = ({
    label,
    value,
    onChange,
    mode = 'datetime',
    minimumDate,
    error,
}) => {
    const [show, setShow] = useState(false);

    const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShow(false);
        }

        if (selectedDate) {
            onChange(selectedDate);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <View className="mb-4">
            <Text className="text-gray-400 font-sans-medium mb-1.5 ml-1">
                {label}
            </Text>

            {Platform.OS === 'android' ? (
                <>
                    <TouchableOpacity
                        onPress={() => setShow(true)}
                        className={`bg-surface rounded-xl px-4 py-3 border ${error ? 'border-red-500' : 'border-transparent'
                            } focus:border-primary-500`}
                    >
                        <Text className="text-white text-base">
                            {formatDate(value)}
                        </Text>
                    </TouchableOpacity>
                    {show && (
                        <DateTimePicker
                            value={value}
                            mode={mode}
                            is24Hour={true}
                            display="default"
                            onChange={handleChange}
                            minimumDate={minimumDate}
                        />
                    )}
                </>
            ) : (
                <View className="flex-row items-center justify-between bg-surface rounded-xl px-4 py-2">
                    <Text className="text-white text-base mr-2 flex-1">
                        {/* En iOS el picker se muestra compacto, pero agregamos texto label si se desea */}
                        Seleccionar:
                    </Text>
                    <DateTimePicker
                        value={value}
                        mode={mode}
                        display="compact"
                        onChange={handleChange}
                        minimumDate={minimumDate}
                        themeVariant="dark"
                        style={{ alignSelf: 'flex-end' }}
                    />
                </View>
            )}

            {!!error && (
                <Text className="text-red-500 text-sm mt-1 ml-1 font-sans">
                    {error}
                </Text>
            )}
        </View>
    );
};
