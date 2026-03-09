import React from 'react'
import AppNavigator from './src/navigation/AppNavigator'
import { ThemeProvider } from './src/Theme/ThemeContext'

export default function App(){
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  )
}
