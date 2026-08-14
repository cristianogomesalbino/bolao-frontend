import type {
  DestaqueListagemResponse,
  MandarFResponse,
  VisualizarResponse,
} from '@/types/destaques.types';

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

export async function buscarDestaquesGrupo(
  grupoId: string,
): Promise<DestaqueListagemResponse> {
  return fetchAutenticado<DestaqueListagemResponse>(
    `/grupos/${grupoId}/destaques`,
  );
}

export async function mandarF(
  grupoId: string,
  destaqueId: string,
): Promise<MandarFResponse> {
  return fetchAutenticado<MandarFResponse>(
    `/grupos/${grupoId}/destaques/${destaqueId}/mandar-f`,
    { method: 'POST' },
  );
}

export async function marcarVisualizados(
  grupoId: string,
  destaqueIds: string[],
): Promise<VisualizarResponse> {
  return fetchAutenticado<VisualizarResponse>(
    `/grupos/${grupoId}/destaques/visualizar`,
    {
      method: 'POST',
      body: JSON.stringify({ destaqueIds }),
    },
  );
}
