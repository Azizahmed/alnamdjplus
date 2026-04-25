import React, { createContext, useContext, ReactNode } from 'react';
import { ar, Translation } from './ar';

interface I18nContextType {
  t: Translation;
  locale: string;
}

const I18nContext = createContext<I18nContextType>({
  t: ar,
  locale: 'ar'
});

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <I18nContext.Provider value={{ t: ar, locale: 'ar' }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
