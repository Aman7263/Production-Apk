import React, { createContext, useState, useContext } from 'react'
import { themes } from './themes'

export const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('forest') // default mode

  const toggleTheme = () => {
    if (mode === 'forest') setMode('ocean')
    else if (mode === 'ocean') setMode('sunset')
    else setMode('forest')
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
