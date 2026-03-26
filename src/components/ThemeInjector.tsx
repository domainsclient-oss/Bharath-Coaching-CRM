
'use client';

import { useEffect } from 'react';
import centerConfig from '../config/centerConfig';

const ThemeInjector = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Set Document Title
      document.title = centerConfig.centerName;

      // Inject CSS Variables
      const root = document.documentElement;
      const theme = centerConfig.theme;

      Object.entries(theme).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && 'h' in value && 's' in value && 'l' in value) {
          root.style.setProperty(`--${key}`, `${(value as any).h} ${(value as any).s}% ${(value as any).l}%`);
        } else if (typeof value === 'string') {
            // For string values like fontFamily
            if (key === 'fontFamily') {
                 root.style.setProperty(`--font-sans`, value);
            }
        }
      });
    }
  }, []);

  return null; // This component does not render anything
};

export default ThemeInjector;
