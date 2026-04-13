"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { dictionaries } from "../utils/dictionary";

const LanguageContext = createContext();

export const LanguageProvider = ({ children, initialLang = "es" }) => {
  const [lang, setLang] = useState(initialLang);

  useEffect(() => {
    const match = document.cookie.match(/(^| )locale=([^;]+)/);
    if (match) setLang(match[2]);
  }, []);

  const changeLanguage = (newLang) => {
    setLang(newLang);
    document.cookie = `locale=${newLang}; path=/; max-age=31536000`;
  };

  const t = (path) => {
    const keys = path.split(".");
    let value = dictionaries[lang];
    for (let key of keys) {
      if (value) value = value[key];
    }
    return value || path;
  };

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
