export type TourId = 'tour-grupo' | 'tour-palpites' | 'tour-ranking' | 'tour-conta' | 'tour-grupos-publicos' | 'tour-meus-grupos';

export const TOURS_VALIDOS: TourId[] = [
  'tour-grupo',
  'tour-palpites',
  'tour-ranking',
  'tour-conta',
  'tour-grupos-publicos',
  'tour-meus-grupos',
];

export interface StepTour {
  target: string;
  titulo: string;
  conteudo: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

export interface ConfiguracaoTour {
  id: TourId;
  nome: string;
  pagina: string;
  steps: StepTour[];
}
