import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useErrorStore } from '@/lib/store';
import { useTheme } from '@/context/ThemeProvider';
import { X } from 'lucide-react-native';

/**
 * Global error handler component that displays errors from the error store
 * Automatically removes errors after a timeout
 */
const ErrorHandler: React.FC = () => {
    const { errors, removeError } = useErrorStore();
    const { colors } = useTheme();

    // Auto-remove errors after 5 seconds
    useEffect(() => {
        if (errors.length === 0) return;

        const timeouts = errors.map(error => {
            return setTimeout(() => {
                removeError(error.id);
            }, 5000); // 5 seconds
        });

        return () => {
            timeouts.forEach(timeout => clearTimeout(timeout));
        };
    }, [errors, removeError]);

    if (errors.length === 0) return null;

    return (
        <View style={styles.container}>
            {errors.map(error => {
                // Determine background color based on error type
                const bgColor =
                    error.type === 'error' ? colors.error :
                        error.type === 'warning' ? colors.warning :
                            colors.info;

                return (
                    <View
                        key={error.id}
                        style={[
                            styles.errorItem,
                            { backgroundColor: bgColor }
                        ]}
                    >
                        <Text style={styles.errorText}>{error.message}</Text>
                        <TouchableOpacity
                            onPress={() => removeError(error.id)}
                            style={styles.closeButton}
                        >
                            <X size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        zIndex: 9999,
        alignItems: 'center',
    },
    errorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '90%',
        marginVertical: 5,
        padding: 12,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    errorText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    closeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default ErrorHandler; 