import React, { createContext, useState } from "react";

export const ThemeContext = createContext();

const themes = {
  light: {
    background: "#ffffff",
    text: "#000000",
    header: "#f2f2f2",
    footer: "#f2f2f2",
  },
  dark: {
    background: "#000000",
    text: "#ffffff",
    header: "#111111",
    footer: "#111111",
  },
  romantic: {
    background: "#ffe4ec",
    text: "#6a1b9a",
    header: "#f8bbd0",
    footer: "#f8bbd0",
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
        themeStyle: themes[mode],
        toggleTheme,
        currentTheme: mode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};