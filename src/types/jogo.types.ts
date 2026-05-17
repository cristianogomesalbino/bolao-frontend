export interface JogoProximo {
  id: string;
  timeCasa: string;
  timeFora: string;
  dataHora: string;
  status: 'AGENDADO' | 'EM_ANDAMENTO' | 'FINALIZADO' | 'CANCELADO';
}
