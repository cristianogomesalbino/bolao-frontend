import { create } from 'zustand';
import { Usuario } from '@/types/usuario.types';
import { DadosLogin } from '@/types/auth.types';
import apiClient, { configurarTokenHandlers } from '@/lib/api-client';
import { queryClient } from '@/lib/query-client';
import { sincronizarPushPendente } from '@/lib/push-notifications';

// --- Gerenciador de Tokens ---
let accessToken: string | null = null;

export function obterAccessToken(): string | null {
  return accessToken;
}

export function atualizarAccessToken(novoAccessToken: string): void {
  accessToken = novoAccessToken;
}

export function limparTokens(): void {
  accessToken = null;
}

// --- Auth Store ---
interface EstadoAuthStore {
  usuario: Usuario | null;
  estaAutenticado: boolean;
  estaCarregando: boolean;
  login: (dados: DadosLogin) => Promise<void>;
  logout: () => Promise<void>;
  atualizarUsuario: (dadosParciais: Partial<Usuario>) => void;
  inicializar: () => Promise<void>;
}

export const useAuthStore = create<EstadoAuthStore>((set, get) => {
  // Wire up API client token handlers
  configurarTokenHandlers({
    obterAccessToken,
    aoAtualizarAccessToken: (newAccess: string) => {
      atualizarAccessToken(newAccess);
    },
    aoFalharRefresh: () => {
      limparTokens();
      queryClient.clear();
      set({ usuario: null, estaAutenticado: false, estaCarregando: false });
      if (globalThis.window !== undefined) {
        globalThis.location.href = '/login';
      }
    },
  });

  return {
    usuario: null,
    estaAutenticado: false,
    estaCarregando: true,

    login: async (dados: DadosLogin) => {
      queryClient.removeQueries();
      const response = await apiClient.post('/auth/login', dados);
      const { accessToken: newAccess } = response.data;
      atualizarAccessToken(newAccess);

      // Fetch user profile
      const perfilResponse = await apiClient.get('/usuarios/me');
      const usuario = perfilResponse.data;

      queryClient.invalidateQueries();
      set({ usuario, estaAutenticado: true, estaCarregando: false });

      // Sincronizar push subscription pendente (fire-and-forget)
      sincronizarPushPendente().catch(() => {});
    },

    logout: async () => {
      try {
        await apiClient.post('/auth/logout');
      } catch {
        // Ignore logout errors
      } finally {
        limparTokens();
        queryClient.clear();
        set({ usuario: null, estaAutenticado: false, estaCarregando: false });
      }
    },

    atualizarUsuario: (dadosParciais: Partial<Usuario>) => {
      const { usuario } = get();
      if (usuario) {
        set({ usuario: { ...usuario, ...dadosParciais } });
      }
    },

    inicializar: async () => {
      // Se já está autenticado (ex: acabou de fazer login), não refazer
      if (get().estaAutenticado) {
        set({ estaCarregando: false });
        return;
      }

      try {
        // Try to get new access token via cookie (browser envia automaticamente)
        const response = await apiClient.post('/auth/refresh');
        const { accessToken: newAccess } = response.data;
        atualizarAccessToken(newAccess);

        // Fetch user profile
        const perfilResponse = await apiClient.get('/usuarios/me');
        const usuario = perfilResponse.data;

        set({ usuario, estaAutenticado: true, estaCarregando: false });

        // Sincronizar push subscription pendente (fire-and-forget)
        sincronizarPushPendente().catch(() => {});
      } catch {
        limparTokens();
        set({ usuario: null, estaAutenticado: false, estaCarregando: false });
      }
    },
  };
});
