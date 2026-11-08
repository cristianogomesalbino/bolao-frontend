'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buscarDestaquesGrupo } from '@/services/destaques.service';
import { DestaqueViewer } from './destaque-viewer';

interface DestaqueCarouselProps {
  readonly grupoId: string;
  readonly grupoNome?: string;
  readonly mostrarAvisoGrupoFavorito?: boolean;
}

export function DestaqueCarousel({
  grupoId,
  grupoNome,
  mostrarAvisoGrupoFavorito = false,
}: DestaqueCarouselProps) {
  // Remonta com key={grupoId} no pai → estado limpo por grupo.
  const [rodadaSelecionada, setRodadaSelecionada] = useState<number | null>(
    null,
  );

  const { data, isLoading: carregando } = useQuery({
    queryKey: ['destaques', grupoId, rodadaSelecionada ?? 'atual'],
    queryFn: () =>
      buscarDestaquesGrupo(grupoId, rodadaSelecionada ?? undefined),
    enabled: !!grupoId,
    staleTime: 1000 * 60,
  });

  const rodadasFiltro = (data?.rodadasDisponiveis ?? []).slice(0, 2);
  const rodadaAtiva = rodadaSelecionada ?? rodadasFiltro[0] ?? null;
  const destaques = data?.destaques ?? [];

  if (!carregando && destaques.length === 0 && rodadasFiltro.length === 0) {
    return null;
  }

  return (
    <div data-testid="destaque-carousel" className="px-4 py-2">
      {mostrarAvisoGrupoFavorito && grupoNome && (
        <p className="mb-1 text-xs text-gray-400">
          Grupo favorito: {grupoNome}. Para ver outros, acesse o grupo desejado.
        </p>
      )}
      {rodadasFiltro.length > 0 && (
        <div
          className="mb-1.5 flex items-center gap-1.5 text-[10px] text-texto/35"
          data-testid="destaque-filtro-rodada"
        >
          <span className="font-medium">Rodada</span>
          <div className="flex items-center gap-0.5 rounded-md bg-white/[0.04] p-0.5">
            {rodadasFiltro.map((rodada) => {
              const ativa = rodadaAtiva === rodada;
              return (
                <button
                  key={rodada}
                  type="button"
                  onClick={() => setRodadaSelecionada(rodada)}
                  className={`rounded px-1.5 py-0.5 transition-colors ${
                    ativa
                      ? 'bg-white/10 text-texto/70'
                      : 'text-texto/30 hover:text-texto/50'
                  }`}
                  data-testid={`destaque-filtro-rodada-${rodada}`}
                  aria-pressed={ativa}
                >
                  {rodada}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {carregando ? (
        <div className="mx-auto h-[46vh] max-h-[440px] min-h-[300px] w-[90%] animate-pulse rounded-2xl bg-white/5" />
      ) : (
        destaques.length > 0 && (
          <DestaqueViewer
            key={rodadaAtiva ?? 'atual'}
            destaques={destaques}
            grupoId={grupoId}
          />
        )
      )}
    </div>
  );
}
