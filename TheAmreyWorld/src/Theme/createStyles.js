import { StyleSheet } from 'react-native'

export const createStyles = (theme) =>
  StyleSheet.create({
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
      backgroundColor: theme.background
    },
    container: {
      flex: 1,
      backgroundColor: theme.background
    },
    card: {
      backgroundColor: theme.card,
      padding: 25,
      borderRadius: 20,
      elevation: 8,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5
    },
    title: {
      textAlign: 'center',
      fontSize: 26,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 30
    },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      padding: 14,
      marginBottom: 15,
      color: theme.text,
      backgroundColor: theme.background
    },
    primaryBtn: {
      backgroundColor: theme.primary,
      padding: 15,
      borderRadius: 12,
      alignItems: 'center'
    },
    secondaryBtn: {
      backgroundColor: theme.secondary,
      padding: 15,
      borderRadius: 12,
      alignItems: 'center'
    },
    btnText: {
      color: '#fff',
      fontWeight: 'bold'
    },
    linkText: {
      textAlign: 'center',
      color: theme.primary,
      marginTop: 15
    },
    header: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.primary,
      marginBottom: 25,
      textAlign: 'center'
    },
    sectionHeader: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.primary,
      marginBottom: 15,
      marginTop: 10
    },
    scrollContainer: {
      padding: 20,
      paddingBottom: 40
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 10
    },
    boxText: {
      marginTop: 10,
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 14
    }
  })
