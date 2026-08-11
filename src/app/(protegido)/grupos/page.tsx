'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { listarGrupos } from '@/services/grupo.service';

/**
 * Página /grupos — redireciona automaticamente para o grupo favorito.
 * Se não tiver favorito, vai para o primeiro grupo.
 * Se não tiver nenhum grupo, mostra estado vazio com opção de criar/entrar.
 */
export default function GruposPage() {
  const router = useRouter();
  const usuario = useAuthStore((state) => state.usuario);

  const { data: grupos, isLoading } = useQuery({
    queryKey: ['grupos'],
    queryFn: listarGrupos,
  });

  useEffect(() => {
    if (isLoading || !grupos) return;

    if (grupos.length === 0) return; // fica na página vazia

    const grupoFavorito = grupos.find((g) => g.id === usuario?.grupoFavoritoId);
    const grupoAlvo = grupoFavorito ?? grupos[0];

    router.replace(`/grupos/${grupoAlvo.id}`);
  }, [isLoading, grupos, usuario?.grupoFavoritoId, router]);

  // Loading enquanto resolve o redirect
  if (isLoading || (grupos && grupos.length > 0)) {
    return (
      <div className="min-h-screen bg-fundo flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primaria border-t-transparent" />
          <p className="text-sm text-texto/40">Carregando grupo...</p>
        </div>
      </div>
    );
  }

  // Estado vazio — sem grupos
  return (
    <div className="min-h-screen bg-fundo pb-24">
      <header className="sticky top-0 z-20 bg-fundo/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="mx-auto max-w-[480px] px-5 py-5">
          <h1 className="text-xl font-bold text-texto">Grupos</h1>
        </div>
      </header>

      <div className="mx-auto max-w-[480px] px-4">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primaria/[0.08] text-4xl mb-5">
            🏆
          </div>
          <p className="text-texto/60 font-medium mb-1">Nenhum grupo ainda</p>
          <p className="text-texto/30 text-sm mb-8 max-w-[260px]">
            Crie seu bolão ou entre em um grupo com código de convite
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/grupos/criar')}
              className="px-5 py-2.5 rounded-xl bg-primaria text-white text-sm font-semibold hover:bg-primaria-claro transition-colors"
            >
              Criar grupo
            </button>
            <button
              type="button"
              onClick={() => router.push('/grupos/explorar')}
              className="px-5 py-2.5 rounded-xl border border-white/[0.12] text-texto/60 text-sm font-semibold hover:bg-white/[0.04] transition-colors"
            >
              Explorar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
