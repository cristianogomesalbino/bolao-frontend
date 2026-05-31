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
      <div className="min-h-screen bg-fundo px-5 pt-8 pb-20 animate-pulse">
        {/* Skeleton header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-4 w-24 rounded bg-white/[0.06] mb-2" />
            <div className="h-6 w-40 rounded bg-white/[0.06]" />
          </div>
          <div className="h-10 w-10 rounded-full bg-white/[0.06]" />
        </div>
        {/* Skeleton cards */}
        <div className="space-y-4">
          <div className="h-[140px] rounded-2xl bg-white/[0.04] border border-white/[0.08]" />
          <div className="h-[100px] rounded-2xl bg-white/[0.04] border border-white/[0.08]" />
          <div className="h-[180px] rounded-2xl bg-white/[0.04] border border-white/[0.08]" />
        </div>
      </div>
    );
  }

  if (!estaAutenticado) {
    return null;
  }

  return <>{children}</>;
}
