'use client';

import { useEffect, useState } from 'react';
import { buscarDestaquesGrupo } from '@/services/destaques.service';
import { DESTAQUE_CONFIG } from '@/types/destaques.types';
import type { DestaqueItem } from '@/types/destaques.types';
import { DestaqueViewer } from './destaque-viewer';

interface DestaqueCarouselProps {
  readonly grupoId: string;
  readonly grupoNome?: string;
  readonly mostrarAvisoGrupoFavorito?: boolean;
}

interface MembroComDestaques {
  usuarioId: string;
  nome: string;
  avatar: string | null;
  destaqueMaisRecente: DestaqueItem;
  temNaoVisualizado: boolean;
}

export function DestaqueCarousel({
  grupoId,
  grupoNome,
  mostrarAvisoGrupoFavorito = false,
}: DestaqueCarouselProps) {
  const [destaques, setDestaques] = useState<DestaqueItem[]>([]);
  const [membros, setMembros] = useState<MembroComDestaques[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [viewerAberto, setViewerAberto] = useState(false);
  const [destaqueInicial, setDestaqueInicial] = useState(0);

  useEffect(() => {
    buscarDestaquesGrupo(grupoId)
      .then((res) => {
        setDestaques(res.destaques);
        setMembros(extrairMembros(res.destaques));
      })
      .catch(() => setDestaques([]))
      .finally(() => setCarregando(false));
  }, [grupoId]);

  if (carregando || destaques.length === 0) return null;

  function abrirViewer(usuarioId: string) {
    const indice = destaques.findIndex(
      (s) => s.autor.usuarioId === usuarioId && !s.visualizado,
    );
    setDestaqueInicial(Math.max(indice, 0));
    setViewerAberto(true);
  }

  return (
    <>
      <div data-testid="destaque-carousel" className="px-4 py-2">
        {mostrarAvisoGrupoFavorito && grupoNome && (
          <p className="text-xs text-gray-400 mb-1">
            Grupo favorito: {grupoNome}. Para ver outros, acesse o grupo
            desejado.
          </p>
        )}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {membros.map((membro) => (
            <button
              type="button"
              key={membro.usuarioId}
              onClick={() => abrirViewer(membro.usuarioId)}
              className="flex flex-col items-center gap-1 shrink-0"
              data-testid={`destaque-avatar-${membro.usuarioId}`}
            >
              <div
                className={`relative w-14 h-14 rounded-full ${
                  membro.temNaoVisualizado
                    ? 'ring-2 ring-offset-2 ring-offset-gray-900'
                    : 'ring-2 ring-gray-600 opacity-60'
                }`}
                style={
                  membro.temNaoVisualizado
                    ? { '--tw-ring-color': DESTAQUE_CONFIG[membro.destaqueMaisRecente.tipo].cor } as React.CSSProperties
                    : undefined
                }
              >
                <div className="w-full h-full rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold text-white">
                  {membro.nome.charAt(0).toUpperCase()}
                </div>
                <span className="absolute -bottom-1 -right-1 text-sm">
                  {DESTAQUE_CONFIG[membro.destaqueMaisRecente.tipo].emoji}
                </span>
              </div>
              <span className="text-[10px] text-gray-300 max-w-[56px] truncate">
                {membro.nome.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {viewerAberto && (
        <DestaqueViewer
          destaques={destaques}
          grupoId={grupoId}
          indiceInicial={destaqueInicial}
          onClose={() => setViewerAberto(false)}
        />
      )}
    </>
  );
}

function extrairMembros(destaques: DestaqueItem[]): MembroComDestaques[] {
  const membroMap = new Map<string, MembroComDestaques>();

  for (const destaque of destaques) {
    const existente = membroMap.get(destaque.autor.usuarioId);
    if (!existente) {
      membroMap.set(destaque.autor.usuarioId, {
        usuarioId: destaque.autor.usuarioId,
        nome: destaque.autor.nome,
        avatar: destaque.autor.avatar,
        destaqueMaisRecente: destaque,
        temNaoVisualizado: !destaque.visualizado,
      });
    } else if (!destaque.visualizado) {
      existente.temNaoVisualizado = true;
    }
  }

  // Ordenar: não-vistos primeiro, depois por data
  return Array.from(membroMap.values()).sort((a, b) => {
    if (a.temNaoVisualizado !== b.temNaoVisualizado) {
      return a.temNaoVisualizado ? -1 : 1;
    }
    return 0;
  });
}
