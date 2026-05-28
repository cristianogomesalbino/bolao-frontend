'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export default function RootPage() {
  const router = useRouter();
  const estaAutenticado = useAuthStore((state) => state.estaAutenticado);
  const estaCarregando = useAuthStore((state) => state.estaCarregando);

  useEffect(() => {
    if (!estaCarregando) {
      if (estaAutenticado) {
        router.replace('/inicio');
      } else {
        router.replace('/login');
      }
    }
  }, [estaCarregando, estaAutenticado, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-fundo gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primaria border-t-transparent" />
      <p className="text-sm text-texto/40 animate-pulse">Carregando...</p>
    </div>
  );
}
