'use client';

import { useEffect } from 'react';

/**
 * Beta: unregister any installed service worker so stale SW versions
 * cannot reload-loop or cache broken bundles. Re-enable when SW is stable.
 */
export default function PWARegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        void registration.unregister();
      });
    });

    if ('caches' in window) {
      void caches.keys().then((keys) => {
        keys.forEach((key) => {
          void caches.delete(key);
        });
      });
    }
  }, []);

  return null;
}
