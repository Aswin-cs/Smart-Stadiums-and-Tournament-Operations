/* istanbul ignore file */
'use client';

import { SessionProvider } from 'next-auth/react';
import { CrowdProvider } from './contexts/CrowdContext';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <CrowdProvider>
        {children}
      </CrowdProvider>
    </SessionProvider>
  );
}
