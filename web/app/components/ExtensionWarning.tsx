"use client";

import { useEffect } from "react";

/**
 * Development-only component that warns about Chrome extension DOM injection.
 * This helps identify hydration mismatch warnings caused by browser extensions.
 */
export default function ExtensionWarning() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // Check for extension-injected elements after DOM loads
    const checkExtensionInjection = () => {
      if (document.getElementById('open-incognito-widget')) {
        console.warn(
          '⚠️ [DEV] Chrome extension DOM injection detected: #open-incognito-widget\n' +
          'This may cause React hydration warnings but does not affect app functionality.\n' +
          'See DEV_NOTES.md for more information.'
        );
      }
    };

    // Check after component mounts (client-side only)
    const timeoutId = setTimeout(checkExtensionInjection, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  return null; // This component renders nothing
}

