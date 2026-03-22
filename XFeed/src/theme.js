import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');

export const ThemeColors = {
    background: '#0F172A',
    surface: 'rgba(255, 255, 255, 0.1)',
    surfaceDark: 'rgba(0, 0, 0, 0.3)',
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    text: '#FFFFFF',
    textDim: '#EBEBF5',
    danger: '#FF453A',
    success: '#32D74B',
    border: 'rgba(255, 255, 255, 0.2)',
};

export const GlobalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ThemeColors.background,
    },

    // Use SafeAreaView in component instead of paddingTop hack
    safeArea: {
        flex: 1,
    },

    title: {
        fontSize: width * 0.07,
        fontWeight: Platform.OS === 'android' ? 'bold' : '700',
        color: ThemeColors.text,
        letterSpacing: 0.5,
        marginBottom: 20,
    },

    heading: {
        fontSize: 20,
        fontWeight: Platform.OS === 'android' ? 'bold' : '600',
        color: ThemeColors.text,
        marginBottom: 10,
    },

    subText: {
        fontSize: 14,
        color: ThemeColors.textDim,
    },

    glassCard: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: ThemeColors.border,
        backgroundColor: ThemeColors.surface,

        // Cross-platform shadow
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
            },
            android: {
                elevation: 8,
            },
        }),
    },

    button: {
        backgroundColor: ThemeColors.primary,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },

    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: Platform.OS === 'android' ? 'bold' : '600',
    },

    dangerButton: {
        backgroundColor: 'rgba(255, 69, 58, 0.2)',
        borderWidth: 1,
        borderColor: ThemeColors.danger,
    },

    dangerButtonText: {
        color: ThemeColors.danger,
    },

    tabContainer: {
        flexDirection: 'row',
        backgroundColor: ThemeColors.surfaceDark,
        borderRadius: 20,
        padding: 4,
        marginVertical: 15,
        borderWidth: 1,
        borderColor: ThemeColors.border,
    },

    tabItem: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 16,
    },

    tabItemActive: {
        backgroundColor: ThemeColors.surface,

        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
            },
            android: {
                elevation: 5,
            },
        }),
    },

    tabText: {
        color: ThemeColors.textDim,
        fontSize: 14,
        fontWeight: '500',
    },

    tabTextActive: {
        color: ThemeColors.text,
        fontWeight: Platform.OS === 'android' ? 'bold' : '600',
    },
});