import React, { createContext, useState, useContext } from 'react'
import { themes } from './themes'

export const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('dark') // default mode

  const toggleTheme = () => {
    if (mode === 'light') setMode('dark')
    else if (mode === 'dark') setMode('reading')
    else setMode('light')
  }

  return (
    <ThemeContext.Provider
      value={{
        theme: themes[mode],
        mode,
        toggleTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

// Custom hook for convenience
export const useTheme = () => useContext(ThemeContext)
