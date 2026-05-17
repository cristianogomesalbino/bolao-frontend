'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { LogoBolao } from '@/components/layout/logo-bolao';
import { AgendaSemanal } from '@/components/auth/agenda-semanal';

export default function AuthLayout({ children }: { readonly children: React.ReactNode }) {
  const router = useRouter();
  const estaAutenticado = useAuthStore((state) => state.estaAutenticado);
  const estaCarregando = useAuthStore((state) => state.estaCarregando);

  useEffect(() => {
    if (!estaCarregando && estaAutenticado) {
      router.replace('/inicio');
    }
  }, [estaCarregando, estaAutenticado, router]);

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
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Subtle field pattern */}
      <div className="absolute inset-0 bg-campo opacity-50" />
      {/* Radial gradient - profundidade premium */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(22,163,74,0.06)_0%,_transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(30,64,175,0.05)_0%,_transparent_40%)]" />
      
      <div className="w-full max-w-[380px] relative z-10 mt-14">
        <div className="mb-8 flex justify-center">
          <LogoBolao />
        </div>
        {children}
        {/* Agenda carrega em background, não bloqueia o login */}
        <div className="mt-3">
          <AgendaSemanal />
        </div>
      </div>
    </div>
  );
}
