'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { LogoBolao } from '@/components/layout/logo-bolao';

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
      {/* Fundo Copa — verde escuro com gradientes Brasil */}
      <div className="absolute inset-0 bg-[#002b12]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,180,64,0.35)_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(255,223,0,0.12)_0%,_transparent_45%)]" />
      <div className="absolute top-[-60px] left-[5%] w-[600px] h-[350px] rounded-full bg-[#00b340]/30 blur-[120px]" />
      <div className="absolute bottom-[-40px] right-[10%] w-[400px] h-[250px] rounded-full bg-[#ffdf00]/15 blur-[100px]" />
      <div className="absolute top-[30%] right-[-5%] w-[300px] h-[200px] rounded-full bg-[#1a4db5]/20 blur-[80px]" />
      
      <div className="w-full max-w-[380px] relative z-10 mt-14">
        <div className="mb-8 flex justify-center">
          <LogoBolao />
        </div>
        {children}
      </div>
    </div>
  );
}
