'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, UserPlus, Trophy, RefreshCw, WifiOff } from 'lucide-react';
import { listarGrupos, entrarNoGrupo } from '@/services/grupo.service';
import { CardGrupo } from '@/components/grupo/card-grupo';
import { FormularioEntrarGrupo } from '@/components/grupo/formulario-entrar-grupo';
import { Button } from '@/components/ui/button';

export default function GruposPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mostrarEntrar, setMostrarEntrar] = useState(false);

  const { data: grupos, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['grupos'],
    queryFn: listarGrupos,
    retry: 2,
  });

  async function aoEntrarNoGrupo(codigoConvite: string) {
    await entrarNoGrupo(codigoConvite);
    await queryClient.invalidateQueries({ queryKey: ['grupos'] });
    setMostrarEntrar(false);
  }

  return (
    <div className="min-h-screen bg-fundo">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-fundo/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="px-5 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <Trophy size={26} className="text-primaria-claro drop-shadow-[0_0_10px_rgba(34,211,94,0.8)]" />
              <h1 className="text-2xl font-bold text-texto">Meus Grupos</h1>
              {grupos && grupos.length > 0 && (
                <span className="text-[12px] text-primaria bg-primaria/[0.1] border border-primaria/20 px-2.5 py-0.5 rounded-full font-semibold">
                  {grupos.length}
                </span>
              )}
            </div>
            <p className="text-[10px] text-texto/30 mt-1">
              Acompanhe seus bolões e dispute com seus amigos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMostrarEntrar(!mostrarEntrar)}
              aria-label="Entrar em grupo"
              className="text-texto/50 hover:text-texto h-9 w-9"
              data-testid="grupos-btn-entrar"
            >
              <UserPlus size={18} />
            </Button>
            <button
              onClick={() => router.push('/grupos/criar')}
              aria-label="Criar grupo"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primaria-claro text-white shadow-[0_0_20px_rgba(34,211,94,0.6)] hover:shadow-[0_0_30px_rgba(34,211,94,0.8)] hover:scale-105 active:scale-95 transition-all"
              data-testid="grupos-btn-criar"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[480px] px-4 py-5 space-y-3">
        {/* Formulário de entrar por convite */}
        {mostrarEntrar && (
          <FormularioEntrarGrupo onSubmit={aoEntrarNoGrupo} />
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3" data-testid="grupos-loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[100px] rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
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
              {(error as any)?.mensagem || 'Verifique sua conexão e tente novamente'}
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
            {grupos.map((grupo, indice) => (
              <CardGrupo
                key={grupo.id}
                grupo={grupo}
                indice={indice}
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
            <div className="flex flex-col gap-3 w-full max-w-[260px]">
              <Button
                className="w-full"
                onClick={() => router.push('/grupos/criar')}
                data-testid="grupos-vazio-btn-criar"
              >
                <Plus size={16} />
                Criar meu grupo
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setMostrarEntrar(true)}
                data-testid="grupos-vazio-btn-entrar"
              >
                <UserPlus size={16} />
                Tenho um código de convite
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
