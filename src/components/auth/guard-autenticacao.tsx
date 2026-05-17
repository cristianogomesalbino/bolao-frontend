'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

interface PropsGuardAutenticacao {
  readonly children: React.ReactNode;
  readonly redirecionarPara?: string;
}

export function GuardAutenticacao({ children, redirecionarPara = '/login' }: PropsGuardAutenticacao) {
  const router = useRouter();
  const estaAutenticado = useAuthStore((state) => state.estaAutenticado);
  const estaCarregando = useAuthStore((state) => state.estaCarregando);

  useEffect(() => {
    if (!estaCarregando && !estaAutenticado) {
      router.replace(redirecionarPara);
    }
  }, [estaCarregando, estaAutenticado, router, redirecionarPara]);

  if (estaCarregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fundo">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primaria border-t-transparent" />
      </div>
    );
  }

  if (!estaAutenticado) {
    return null;
  }

  return <>{children}</>;
}
