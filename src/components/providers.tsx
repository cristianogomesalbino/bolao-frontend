'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const inicializar = useAuthStore((state) => state.inicializar);

  useEffect(() => {
    inicializar();
  }, [inicializar]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
