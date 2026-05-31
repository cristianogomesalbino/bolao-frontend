import { create } from 'zustand';
import { Usuario } from '@/types/usuario.types';
import { DadosLogin } from '@/types/auth.types';
import apiClient, { configurarTokenHandlers } from '@/lib/api-client';
import { queryClient } from '@/lib/query-client';

// --- Gerenciador de Tokens ---
let accessToken: string | null = null;

export function obterAccessToken(): string | null {
  return accessToken;
}

export function obterRefreshToken(): string | null {
  if (globalThis.window === undefined) return null;
  return localStorage.getItem('refreshToken');
}

export function salvarTokens(novoAccessToken: string, novoRefreshToken: string): void {
  accessToken = novoAccessToken;
  if (globalThis.window !== undefined) {
    localStorage.setItem('refreshToken', novoRefreshToken);
  }
}

export function atualizarAccessToken(novoAccessToken: string): void {
  accessToken = novoAccessToken;
}

export function limparTokens(): void {
  accessToken = null;
  if (globalThis.window !== undefined) {
    localStorage.removeItem('refreshToken');
  }
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
    obterRefreshToken,
    aoAtualizarTokens: (newAccess: string, newRefresh: string) => {
      salvarTokens(newAccess, newRefresh);
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
      const { accessToken: newAccess, refreshToken: newRefresh } = response.data;
      salvarTokens(newAccess, newRefresh);

      // Fetch user profile
      const perfilResponse = await apiClient.get('/usuarios/me');
      const usuario = perfilResponse.data;

      queryClient.invalidateQueries();
      set({ usuario, estaAutenticado: true, estaCarregando: false });
    },

    logout: async () => {
      try {
        const refresh = obterRefreshToken();
        if (refresh) {
          await apiClient.post('/auth/logout', { refreshToken: refresh });
        }
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

      const refresh = obterRefreshToken();
      if (!refresh) {
        set({ estaCarregando: false, estaAutenticado: false });
        return;
      }

      try {
        // Try to get new access token
        const response = await apiClient.post('/auth/refresh', { refreshToken: refresh });
        const { accessToken: newAccess, refreshToken: newRefresh } = response.data;
        salvarTokens(newAccess, newRefresh || refresh);

        // Fetch user profile
        const perfilResponse = await apiClient.get('/usuarios/me');
        const usuario = perfilResponse.data;

        set({ usuario, estaAutenticado: true, estaCarregando: false });
      } catch {
        limparTokens();
        set({ usuario: null, estaAutenticado: false, estaCarregando: false });
      }
    },
  };
});
