'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Plus, Search, Users, Globe, ChevronRight, RefreshCw, WifiOff } from 'lucide-react';
import { listarGrupos, entrarNoGrupo } from '@/services/grupo.service';
import { definirGrupoFavorito } from '@/services/usuario.service';
import { Grupo } from '@/types/grupo.types';
import { FormularioEntrarGrupo } from '@/components/grupo/formulario-entrar-grupo';
import { CardGrupoSimples } from '@/components/grupo/card-grupo-simples';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';

export default function GruposPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mostrarEntrar, setMostrarEntrar] = useState(false);
  const [mostrarBusca, setMostrarBusca] = useState(false);
  const usuario = useAuthStore((state) => state.usuario);
  const atualizarUsuario = useAuthStore((state) => state.atualizarUsuario);

  const { data: grupos, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['grupos'],
    queryFn: listarGrupos,
    retry: 2,
  });

  const mutationFavorito = useMutation({
    mutationFn: (grupoId: string) => definirGrupoFavorito(grupoId),
    onSuccess: (data) => {
      atualizarUsuario({ grupoFavoritoId: data.grupoFavoritoId });
      queryClient.invalidateQueries({ queryKey: ['estatisticas-palpite'] });
    },
  });

  async function aoEntrarNoGrupo(codigoConvite: string) {
    await entrarNoGrupo(codigoConvite);
    await queryClient.invalidateQueries({ queryKey: ['grupos'] });
    setMostrarEntrar(false);
  }

  return (
    <div className="min-h-screen bg-fundo pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-fundo/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="mx-auto max-w-[480px] px-5 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primaria/30 bg-primaria/[0.08]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primaria-claro drop-shadow-[0_0_10px_rgba(34,211,94,0.8)]">
                  <path d="M8 2H16V5C16 8.3 14.2 11 12 11C9.8 11 8 8.3 8 5V2Z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 4H5C5 4 4 4 4 5.5C4 7 5 8 6.5 8H8" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M16 4H19C19 4 20 4 20 5.5C20 7 19 8 17.5 8H16" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10 11V13H14V11" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M9 13H15V14C15 14 15 15 12 15C9 15 9 14 9 14V13Z" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="8" y="15" width="8" height="2" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-texto">Meus Grupos</h1>
                  {grupos && grupos.length > 0 && (
                    <span className="text-[11px] text-primaria bg-primaria/[0.12] border border-primaria/25 px-2 py-0.5 rounded-full font-semibold">
                      {grupos.length}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-texto/30 mt-0.5">
                  Acompanhe seus bolões e dispute com seus amigos.
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setMostrarBusca(!mostrarBusca)}
            aria-label="Buscar grupos"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.12] text-texto/50 hover:text-texto transition-colors"
            data-testid="grupos-btn-busca"
          >
            <Search size={18} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[480px] px-4 pt-4 space-y-4">
        {/* Cards de ação */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMostrarEntrar(!mostrarEntrar)}
            className="flex items-center gap-3 p-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05] transition-colors text-left"
            data-testid="grupos-btn-convite"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primaria/30 bg-primaria/[0.1] shrink-0">
              <Users size={18} className="text-primaria" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-texto leading-tight">Procurar grupo por convite</p>
              <p className="text-[10px] text-texto/40 mt-0.5">Entre com um código</p>
            </div>
            <ChevronRight size={14} className="text-texto/25 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => router.push('/grupos/publicos')}
            className="flex items-center gap-3 p-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05] transition-colors text-left"
            data-testid="grupos-btn-publicos"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primaria/30 bg-primaria/[0.1] shrink-0">
              <Globe size={18} className="text-primaria" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-texto leading-tight">Procurar grupos públicos</p>
              <p className="text-[10px] text-texto/40 mt-0.5">Descubra novos grupos</p>
            </div>
            <ChevronRight size={14} className="text-texto/25 shrink-0" />
          </button>
        </div>

        {/* Formulário de entrar por convite */}
        {mostrarEntrar && (
          <FormularioEntrarGrupo onSubmit={aoEntrarNoGrupo} />
        )}

        {/* Separador */}
        <div className="pt-2">
          <span className="text-[10px] text-texto/40 uppercase tracking-[0.15em] font-bold">
            Meus Grupos
          </span>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3" data-testid="grupos-loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[80px] rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        )}

        {/* Erro */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="grupos-erro">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-erro/[0.08] mb-4">
              <WifiOff size={24} className="text-erro/60" />
            </div>
            <p className="text-texto/60 font-medium mb-1">Não foi possível carregar</p>
            <p className="text-texto/30 text-sm mb-6 max-w-[260px]">
              {error?.message || 'Verifique sua conexão e tente novamente'}
            </p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isRefetching}
              data-testid="grupos-btn-tentar-novamente"
            >
              <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
              {isRefetching ? 'Carregando...' : 'Tentar novamente'}
            </Button>
          </div>
        )}

        {/* Lista de grupos */}
        {!isLoading && !isError && grupos && grupos.length > 0 && (
          <div className="space-y-3" data-testid="grupos-lista">
            {grupos.map((grupo: Grupo) => (
              <CardGrupoSimples
                key={grupo.id}
                grupo={grupo}
                ehFavorito={grupo.id === usuario?.grupoFavoritoId}
                mostrarEstrela={(grupos?.length ?? 0) > 1}
                onDefinirFavorito={(grupoId) => mutationFavorito.mutate(grupoId)}
              />
            ))}
          </div>
        )}

        {/* Estado vazio */}
        {!isLoading && !isError && grupos?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="grupos-vazio">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primaria/[0.08] text-4xl mb-5">
              🏆
            </div>
            <p className="text-texto/60 font-medium mb-1">Nenhum grupo ainda</p>
            <p className="text-texto/30 text-sm mb-8 max-w-[260px]">
              Crie seu próprio bolão ou entre em um grupo usando um código de convite
            </p>
          </div>
        )}
      </div>

      {/* FAB Criar Grupo */}
      <button
        onClick={() => router.push('/grupos/criar')}
        aria-label="Criar grupo"
        className="fixed bottom-24 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primaria text-white shadow-[0_4px_20px_rgba(34,197,94,0.5)] hover:shadow-[0_4px_30px_rgba(34,197,94,0.7)] hover:scale-105 active:scale-95 transition-all"
        data-testid="grupos-fab-criar"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>
    </div>
  );
}


