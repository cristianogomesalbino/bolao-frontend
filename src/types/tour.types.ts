export type TourId = 'tour-home' | 'tour-grupo' | 'tour-palpites';

export const TOURS_VALIDOS: TourId[] = [
  'tour-home',
  'tour-grupo',
  'tour-palpites',
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
