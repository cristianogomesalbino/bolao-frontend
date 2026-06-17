export interface DadosLogin {
  email: string;
  senha: string;
}

export interface DadosCriarUsuario {
  nome: string;
  email: string;
  senha: string;
}

export interface DadosResetarSenha {
  token: string;
  novaSenha: string;
  confirmarSenha: string;
}

export interface RespostaTokens {
  accessToken: string;
}

export interface ErroApi {
  mensagem: string;
  campo?: string;
  statusCode: number;
  erroOriginal?: unknown;
}

export type EstadoAutenticacao = 'autenticado' | 'carregando' | 'nao-autenticado';
