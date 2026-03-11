import React, { createContext, useState, useContext } from 'react'
import { themes } from './themes'

export const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('space') // default mode

  const toggleTheme = () => {
    if (mode === 'space') setMode('cyberpunk')
    else if (mode === 'cyberpunk') setMode('neon')
    else setMode('space')
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
