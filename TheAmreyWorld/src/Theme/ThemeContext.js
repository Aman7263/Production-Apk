import React, { createContext, useState, useContext } from "react";

export const ThemeContext = createContext();

const themes = {
  light: {
    background: "#F8FAFC",
    text: "#1E293B",
    header: "#FFFFFF",
    footer: "#FFFFFF",
    card: "#FFFFFF",
    primary: "#3B82F6",
    glow: "#60A5FA",
    gradientStart: "#EFF6FF",
    gradientEnd: "#DBEAFE",
    secondaryText: "#64748B",
    buttonText: "#FFFFFF",
  },
  dark: {
    background: "#0F172A",
    text: "#F8FAFC",
    header: "#1E293B",
    footer: "#1E293B",
    card: "#1E293B",
    primary: "#3B82F6",
    glow: "#60A5FA",
    gradientStart: "#0F172A",
    gradientEnd: "#1E293B",
    secondaryText: "#94A3B8",
    buttonText: "#FFFFFF",
  },
  romantic: {
    background: "#FFF1F2",
    text: "#881337",
    header: "#FFE4E6",
    footer: "#FFE4E6",
    card: "#FFFFFF",
    primary: "#E11D48",
    glow: "#FB7185",
    gradientStart: "#FFF1F2",
    gradientEnd: "#FFE4E6",
    secondaryText: "#9F1239",
    buttonText: "#FFFFFF",
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