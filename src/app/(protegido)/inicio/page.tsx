'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function InicioPage() {
  const router = useRouter();
  const usuario = useAuthStore((state) => state.usuario);
  const logout = useAuthStore((state) => state.logout);

  async function aoSair() {
    await logout();
    router.replace('/login');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-fundo gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-texto">Bolão</h1>
        <p className="mt-2 text-texto/70">
          Bem-vindo{usuario?.nome ? `, ${usuario.nome}` : ''}!
        </p>
      </div>
      <Button variant="outline" onClick={aoSair} className="gap-2">
        <LogOut size={18} />
        Sair
      </Button>
    </div>
  );
}
