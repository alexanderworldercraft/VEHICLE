import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const PrivacyContext = createContext(null);

const PRIVACY_ENABLED_KEY = 'vehicleShieldModeEnabled';
const PRIVACY_LEVEL_KEY = 'vehicleShieldModeLevel';
const PRIVACY_ALIAS_KEY = 'vehicleShieldModeAlias';
const CONFIDENTIAL_IMAGE = '/confidentialiter.png';

const createShortId = () => {
  if (window.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    return values[0].toString(36).slice(0, 6).toUpperCase().padStart(6, '0');
  }

  return Math.random().toString(36).slice(2, 8).toUpperCase().padStart(6, '0');
};

const getStoredAlias = () => {
  const existingAlias = localStorage.getItem(PRIVACY_ALIAS_KEY);
  if (existingAlias) return existingAlias;

  const alias = `Drive-${createShortId()}`;
  localStorage.setItem(PRIVACY_ALIAS_KEY, alias);
  return alias;
};

export const maskRegistration = (value) => {
  if (!value) return value;
  return String(value).replace(/[A-Za-z0-9]/g, '*');
};

export const maskAlphanumeric = (value) => {
  if (!value) return value;
  return String(value).replace(/[A-Za-z0-9]/g, '*');
};

export const maskSensitiveValue = (value) => {
  if (value === null || value === undefined || value === '') return value;
  return String(value).replace(/[A-Za-z0-9]/g, '*');
};

export function PrivacyProvider({ children }) {
  const [shieldModeLevel, setShieldModeLevel] = useState(() => {
    const storedLevel = Number(localStorage.getItem(PRIVACY_LEVEL_KEY));
    if (storedLevel === 1 || storedLevel === 2) return storedLevel;
    return localStorage.getItem(PRIVACY_ENABLED_KEY) === 'true' ? 1 : 0;
  });
  const [privacyAlias, setPrivacyAlias] = useState(() => (
    localStorage.getItem(PRIVACY_ALIAS_KEY) || ''
  ));
  const isPrivacyMode = shieldModeLevel > 0;
  const isShieldModeLevel2 = shieldModeLevel === 2;

  useEffect(() => {
    document.body.classList.toggle('privacy-mode', isPrivacyMode);
    document.body.classList.toggle('privacy-mode-2', isShieldModeLevel2);
    return () => {
      document.body.classList.remove('privacy-mode');
      document.body.classList.remove('privacy-mode-2');
    };
  }, [isPrivacyMode, isShieldModeLevel2]);

  const enablePrivacyMode = useCallback((level = 1) => {
    const alias = getStoredAlias();
    const nextLevel = level === 2 ? 2 : 1;
    setPrivacyAlias(alias);
    setShieldModeLevel(nextLevel);
    localStorage.setItem(PRIVACY_ENABLED_KEY, 'true');
    localStorage.setItem(PRIVACY_LEVEL_KEY, String(nextLevel));
  }, []);

  const enablePrivacyModeLevel2 = useCallback(() => {
    enablePrivacyMode(2);
  }, [enablePrivacyMode]);

  const disablePrivacyMode = useCallback(() => {
    setShieldModeLevel(0);
    setPrivacyAlias('');
    localStorage.removeItem(PRIVACY_ENABLED_KEY);
    localStorage.removeItem(PRIVACY_LEVEL_KEY);
    localStorage.removeItem(PRIVACY_ALIAS_KEY);
  }, []);

  const getPrivacyUser = useCallback((user) => {
    if (!isPrivacyMode || !user) return user;
    const alias = privacyAlias || getStoredAlias();

    return {
      ...user,
      Surnom: alias,
      CheminImage: CONFIDENTIAL_IMAGE,
    };
  }, [isPrivacyMode, privacyAlias]);

  const value = useMemo(() => ({
    isPrivacyMode,
    isShieldModeLevel2,
    shieldModeLevel,
    privacyAlias,
    confidentialImage: CONFIDENTIAL_IMAGE,
    enablePrivacyMode,
    enablePrivacyModeLevel2,
    disablePrivacyMode,
    getPrivacyUser,
  }), [disablePrivacyMode, enablePrivacyMode, enablePrivacyModeLevel2, getPrivacyUser, isPrivacyMode, isShieldModeLevel2, privacyAlias, shieldModeLevel]);

  return (
    <PrivacyContext.Provider value={value}>
      {children}
    </PrivacyContext.Provider>
  );
}

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within PrivacyProvider');
  }
  return context;
};
