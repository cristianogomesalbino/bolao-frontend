import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ErroApi } from '@/types/auth.types';

// Token getter/setter functions - will be set by the auth store
let obterAccessToken: () => string | null = () => null;
let obterRefreshToken: () => string | null = () => null;
let aoAtualizarTokens: (accessToken: string, refreshToken: string) => void = () => {};
let aoFalharRefresh: () => void = () => {};

export function configurarTokenHandlers(handlers: {
  obterAccessToken: () => string | null;
  obterRefreshToken: () => string | null;
  aoAtualizarTokens: (accessToken: string, refreshToken: string) => void;
  aoFalharRefresh: () => void;
}) {
  obterAccessToken = handlers.obterAccessToken;
  obterRefreshToken = handlers.obterRefreshToken;
  aoAtualizarTokens = handlers.aoAtualizarTokens;
  aoFalharRefresh = handlers.aoFalharRefresh;
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = obterAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 with refresh
let estaRenovando = false;
let filaRequisicoes: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processarFila(token: string) {
  filaRequisicoes.forEach(({ resolve }) => resolve(token));
  filaRequisicoes = [];
}

function rejeitarFila(error: unknown) {
  filaRequisicoes.forEach(({ reject }) => reject(error));
  filaRequisicoes = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const requisicaoOriginal = error.config;

    // If not 401 or no config, transform and reject
    if (error.response?.status !== 401 || !requisicaoOriginal) {
      throw transformarErro(error);
    }

    // Don't try refresh for auth endpoints (login, refresh itself)
    const url = requisicaoOriginal.url || '';
    if (url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/resetar-senha')) {
      throw transformarErro(error);
    }

    // If this is already a retry, don't retry again
    if ((requisicaoOriginal as unknown as { _tentouRefresh?: boolean })._tentouRefresh) {
      throw transformarErro(error);
    }

    if (estaRenovando) {
      // Queue this request
      return new Promise((resolve, reject) => {
        filaRequisicoes.push({
          resolve: (token: string) => {
            requisicaoOriginal.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(requisicaoOriginal));
          },
          reject: (err) => reject(err),
        });
      });
    }

    (requisicaoOriginal as unknown as { _tentouRefresh?: boolean })._tentouRefresh = true;
    estaRenovando = true;

    try {
      const refreshToken = obterRefreshToken();
      if (!refreshToken) {
        throw new Error('Sem refresh token');
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/refresh`,
        { refreshToken }
      );

      const { accessToken, refreshToken: novoRefreshToken } = response.data;
      aoAtualizarTokens(accessToken, novoRefreshToken || refreshToken);

      processarFila(accessToken);

      requisicaoOriginal.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(requisicaoOriginal);
    } catch (refreshError) {
      rejeitarFila(refreshError);
      aoFalharRefresh();
      throw transformarErro(error);
    } finally {
      estaRenovando = false;
    }
  }
);

function transformarErro(error: AxiosError): ErroApi {
  if (!error.response) {
    return {
      mensagem: 'Erro de conexão. Verifique sua internet e tente novamente.',
      statusCode: 0,
      erroOriginal: error,
    };
  }

  const data = error.response.data as Record<string, unknown> | undefined;
  return {
    mensagem:
      (data?.message as string) ||
      (data?.mensagem as string) ||
      'Ocorreu um erro inesperado. Tente novamente mais tarde.',
    campo: data?.campo as string | undefined,
    statusCode: error.response.status,
    erroOriginal: error,
  };
}

export { apiClient };
export default apiClient;
