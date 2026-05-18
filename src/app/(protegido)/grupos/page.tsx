'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, UserPlus, Trophy } from 'lucide-react';
import { listarGrupos, entrarNoGrupo } from '@/services/grupo.service';
import { CardGrupo } from '@/components/grupo/card-grupo';
import { FormularioEntrarGrupo } from '@/components/grupo/formulario-entrar-grupo';
import { Button } from '@/components/ui/button';

export default function GruposPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mostrarEntrar, setMostrarEntrar] = useState(false);

  const { data: grupos, isLoading } = useQuery({
    queryKey: ['grupos'],
    queryFn: listarGrupos,
  });

  async function aoEntrarNoGrupo(codigoConvite: string) {
    await entrarNoGrupo(codigoConvite);
    await queryClient.invalidateQueries({ queryKey: ['grupos'] });
    setMostrarEntrar(false);
  }

  return (
    <div className="min-h-screen bg-fundo">
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-4 bg-fundo/80 backdrop-blur-lg border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-primaria/70" />
          <h1 className="text-lg font-semibold text-texto">Meus Grupos</h1>
          {grupos && grupos.length > 0 && (
            <span className="text-[10px] text-texto/30 bg-white/[0.05] px-2 py-0.5 rounded-full">
              {grupos.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
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
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primaria text-white shadow-[0_0_12px_rgba(22,163,74,0.3)] hover:shadow-[0_0_18px_rgba(22,163,74,0.4)] hover:scale-105 active:scale-95 transition-all"
            data-testid="grupos-btn-criar"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[480px] px-4 py-5 space-y-4">
        {/* Formulário de entrar por convite */}
        {mostrarEntrar && (
          <FormularioEntrarGrupo onSubmit={aoEntrarNoGrupo} />
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3" data-testid="grupos-loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[72px] rounded-2xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        )}

        {/* Lista de grupos */}
        {!isLoading && grupos && grupos.length > 0 && (
          <div className="space-y-3" data-testid="grupos-lista">
            {grupos.map((grupo) => (
              <CardGrupo
                key={grupo.id}
                grupo={grupo}
                participantes={12}
                palpitesRestantes={5}
              />
            ))}
          </div>
        )}

        {/* Estado vazio */}
        {!isLoading && grupos && grupos.length === 0 && (
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
