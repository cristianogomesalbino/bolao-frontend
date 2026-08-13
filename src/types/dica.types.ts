export type EstadoDica = 'inedito' | 'exibido' | 'dispensado';

export interface ConfiguracaoDica {
  dicaId: string;
  target: string;
  titulo: string;
  conteudo: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  prioridade: number;
  pagina: string;
}
