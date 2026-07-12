'use client';

import { useEffect, useState } from 'react';
import { buscarStoriesGrupo } from '@/services/stories.service';
import { STORY_CONFIG } from '@/types/stories.types';
import type { StoryItem } from '@/types/stories.types';
import { StoryViewer } from './story-viewer';

interface StoryCarouselProps {
  readonly grupoId: string;
  readonly grupoNome?: string;
  readonly mostrarAvisoGrupoFavorito?: boolean;
}

interface MembroComStories {
  usuarioId: string;
  nome: string;
  avatar: string | null;
  storyMaisRecente: StoryItem;
  temNaoVisualizado: boolean;
}

export function StoryCarousel({
  grupoId,
  grupoNome,
  mostrarAvisoGrupoFavorito = false,
}: StoryCarouselProps) {
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [membros, setMembros] = useState<MembroComStories[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [viewerAberto, setViewerAberto] = useState(false);
  const [storyInicial, setStoryInicial] = useState(0);

  useEffect(() => {
    buscarStoriesGrupo(grupoId)
      .then((res) => {
        setStories(res.stories);
        setMembros(extrairMembros(res.stories));
      })
      .catch(() => setStories([]))
      .finally(() => setCarregando(false));
  }, [grupoId]);

  if (carregando || stories.length === 0) return null;

  function abrirViewer(usuarioId: string) {
    const indice = stories.findIndex(
      (s) => s.autor.usuarioId === usuarioId && !s.visualizado,
    );
    setStoryInicial(Math.max(indice, 0));
    setViewerAberto(true);
  }

  return (
    <>
      <div data-testid="story-carousel" className="px-4 py-2">
        {mostrarAvisoGrupoFavorito && grupoNome && (
          <p className="text-xs text-gray-400 mb-1">
            Grupo favorito: {grupoNome}. Para ver outros, acesse o grupo
            desejado.
          </p>
        )}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {membros.map((membro) => (
            <button
              key={membro.usuarioId}
              onClick={() => abrirViewer(membro.usuarioId)}
              className="flex flex-col items-center gap-1 shrink-0"
              data-testid={`story-avatar-${membro.usuarioId}`}
            >
              <div
                className={`relative w-14 h-14 rounded-full ${
                  membro.temNaoVisualizado
                    ? 'ring-2 ring-offset-2 ring-offset-gray-900'
                    : 'ring-2 ring-gray-600 opacity-60'
                }`}
                style={
                  membro.temNaoVisualizado
                    ? { '--tw-ring-color': STORY_CONFIG[membro.storyMaisRecente.tipo].cor } as React.CSSProperties
                    : undefined
                }
              >
                <div className="w-full h-full rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold text-white">
                  {membro.nome.charAt(0).toUpperCase()}
                </div>
                <span className="absolute -bottom-1 -right-1 text-sm">
                  {STORY_CONFIG[membro.storyMaisRecente.tipo].emoji}
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
        <StoryViewer
          stories={stories}
          grupoId={grupoId}
          indiceInicial={storyInicial}
          onClose={() => setViewerAberto(false)}
        />
      )}
    </>
  );
}

function extrairMembros(stories: StoryItem[]): MembroComStories[] {
  const membroMap = new Map<string, MembroComStories>();

  for (const story of stories) {
    const existente = membroMap.get(story.autor.usuarioId);
    if (!existente) {
      membroMap.set(story.autor.usuarioId, {
        usuarioId: story.autor.usuarioId,
        nome: story.autor.nome,
        avatar: story.autor.avatar,
        storyMaisRecente: story,
        temNaoVisualizado: !story.visualizado,
      });
    } else if (!story.visualizado) {
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
