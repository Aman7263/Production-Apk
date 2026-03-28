import React, { createContext, useState, useContext } from "react";

export const ThemeContext = createContext();

const themes = {
  light: {
    background: "#ffffff",
    text: "#000000",
    header: "#f2f2f2",
    footer: "#f2f2f2",
    card: "#eeeeee",
    primary: "#007AFF",
    glow: "#007AFF",
    gradientStart: "#e0eafc",
    gradientEnd: "#cfdef3",
  },
  dark: {
    background: "#000000",
    text: "#ffffff",
    header: "#111111",
    footer: "#111111",
    card: "#1a1a1a",
    primary: "#0A84FF",
    glow: "#0A84FF",
    gradientStart: "#000000",
    gradientEnd: "#1a1a1a",
  },
  romantic: {
    background: "#ffe4ec",
    text: "#6a1b9a",
    header: "#f8bbd0",
    footer: "#f8bbd0",
    card: "#fce4ec",
    primary: "#ec407a",
    glow: "#ec407a",
    gradientStart: "#fce4ec",
    gradientEnd: "#f8bbd0",
  },
};

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState("light");

  const toggleTheme = () => {
    if (mode === "light") setMode("dark");
    else if (mode === "dark") setMode("romantic");
    else setMode("light");
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: themes[mode],
        toggleTheme,
        currentTheme: mode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);