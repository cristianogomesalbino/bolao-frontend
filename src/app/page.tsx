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
    <div className="flex min-h-screen items-center justify-center bg-fundo">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primaria border-t-transparent" />
    </div>
  );
}
