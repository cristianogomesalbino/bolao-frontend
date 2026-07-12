import type {
  StoryListagemResponse,
  MandarFResponse,
  VisualizarResponse,
} from '@/types/stories.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

async function fetchAutenticado<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(
      (erro as { message?: string }).message ?? `Erro ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

export async function buscarStoriesGrupo(
  grupoId: string,
): Promise<StoryListagemResponse> {
  return fetchAutenticado<StoryListagemResponse>(
    `/grupos/${grupoId}/stories`,
  );
}

export async function mandarF(
  grupoId: string,
  storyId: string,
): Promise<MandarFResponse> {
  return fetchAutenticado<MandarFResponse>(
    `/grupos/${grupoId}/stories/${storyId}/mandar-f`,
    { method: 'POST' },
  );
}

export async function marcarVisualizados(
  grupoId: string,
  storyIds: string[],
): Promise<VisualizarResponse> {
  return fetchAutenticado<VisualizarResponse>(
    `/grupos/${grupoId}/stories/visualizar`,
    {
      method: 'POST',
      body: JSON.stringify({ storyIds }),
    },
  );
}
