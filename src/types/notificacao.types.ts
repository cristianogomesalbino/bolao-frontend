export type TipoNotificacao =
  | 'JOGO_PROXIMO'
  | 'RODADA_ENCERRADA'
  | 'ACERTO_EM_CHEIO'
  | 'SUBIU_POSICAO'
  | 'DESCEU_POSICAO'
  | 'PALPITES_PENDENTES';

export type StatusNotificacao = 'NAO_LIDA' | 'LIDA';

export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  status: StatusNotificacao;
  jogoId: string | null;
  grupoId: string | null;
  faseId: string | null;
  rodada: number | null;
  dataCriacao: string;
  dataLeitura: string | null;
}

export interface ListarNotificacoesResponse {
  notificacoes: Notificacao[];
  total: number;
  naoLidas: number;
}

export interface PreferenciaNotificacao {
  jogoProximo: boolean;
  rodadaEncerrada: boolean;
  acertoEmCheio: boolean;
  subiuPosicao: boolean;
  desceuPosicao: boolean;
  palpitesPendentes: boolean;
}
