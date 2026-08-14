/** Estado possível de uma dica no ciclo de vida */
export type EstadoDica = 'inedito' | 'exibido' | 'dispensado';

/** Posicionamento do tooltip relativo ao elemento-alvo */
export type PosicaoDica = 'top' | 'bottom' | 'left' | 'right' | 'auto';

/** Configuração declarativa de uma dica no registry */
export interface ConfiguracaoDica {
  /** Identificador único no formato dica-{pagina}-{identificador} */
  dicaId: string;
  /** Seletor CSS do elemento-alvo: [data-dica="identificador"] */
  target: string;
  /** Título exibido no tooltip */
  titulo: string;
  /** Texto descritivo exibido no tooltip */
  conteudo: string;
  /** Posição preferida do tooltip relativa ao elemento */
  posicao: PosicaoDica;
  /** Prioridade de exibição (1 = mais alta, 5 = mais baixa) */
  prioridade: number;
  /** Rota/página onde a dica é aplicável */
  pagina: string;
}
