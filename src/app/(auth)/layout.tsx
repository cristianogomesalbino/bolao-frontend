'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { LogoBolao } from '@/components/layout/logo-bolao';

export default function AuthLayout({ children }: { readonly children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const estaAutenticado = useAuthStore((state) => state.estaAutenticado);
  const estaCarregando = useAuthStore((state) => state.estaCarregando);

  useEffect(() => {
    if (!estaCarregando && estaAutenticado) {
      const redirect = searchParams.get('redirect');
      const destino = redirect?.startsWith('/') ? redirect : '/inicio';
      router.replace(destino);
    }
  }, [estaCarregando, estaAutenticado, router, searchParams]);

  if (estaCarregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fundo">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primaria border-t-transparent" />
      </div>
    );
  }

  if (estaAutenticado) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8 relative overflow-hidden bg-fundo">
      <div className="w-full max-w-[380px] relative z-10 mt-14">
        <div className="mb-8 flex justify-center">
          <LogoBolao />
        </div>
        {children}
      </div>
    </div>
  );
}
