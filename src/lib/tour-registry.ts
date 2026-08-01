import type { ConfiguracaoTour } from '@/types/tour.types';

export const TOURS: ConfiguracaoTour[] = [
  {
    id: 'tour-palpites',
    nome: 'Tour dos Palpites',
    pagina: '/palpites',
    steps: [
      {
        target: '[data-tour="boas-vindas"]',
        titulo: 'Bem-vindo ao Bolão!',
        conteudo:
          'Esta é a tela de palpites. Aqui você registra seus palpites para os jogos de cada rodada.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="primeiro-card-jogo"]',
        titulo: 'Faça seu palpite',
        conteudo:
          'Toque no número para digitar o placar. O palpite é salvo automaticamente ao digitar o número.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="chevron-palpites"]',
        titulo: 'Veja quem palpitou',
        conteudo:
          'Toque na seta para expandir. Antes do jogo, mostra quem já palpitou. Quando o jogo começa, revela o placar de cada um.',
        placement: 'top',
      },
      {
        target: '[data-tour="info-rodadas"]',
        titulo: '20 jogos disponíveis',
        conteudo:
          'Você sempre terá até 20 jogos disponíveis para palpitar: a rodada atual e a próxima.',
        placement: 'top',
      },
      {
        target: '[data-tour="seletor-campeonato"] button:nth-child(2)',
        titulo: 'Outros campeonatos',
        conteudo:
          'Quando houver mais de um campeonato ativo, troque entre eles usando estas abas.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="botao-refazer-tour"]',
        titulo: 'Precisa de ajuda?',
        conteudo:
          'Clique neste botão a qualquer momento para refazer o tour.',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'tour-grupo',
    nome: 'Tour do Grupo',
    pagina: '/grupos/',
    steps: [
      {
        target: '[data-tour="boas-vindas"]',
        titulo: 'Página do Grupo',
        conteudo:
          'Aqui você acompanha tudo do seu grupo: jogos, ranking e convites.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="botao-refazer-tour"]',
        titulo: 'Precisa de ajuda?',
        conteudo:
          'Clique neste botão a qualquer momento para refazer o tour.',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'tour-home',
    nome: 'Tour da Home',
    pagina: '/inicio',
    steps: [
      {
        target: '[data-tour="boas-vindas"]',
        titulo: 'Visão geral',
        conteudo:
          'Aqui você acompanha tudo sobre seus bolões de forma resumida.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="botao-refazer-tour"]',
        titulo: 'Precisa de ajuda?',
        conteudo:
          'Clique neste botão a qualquer momento para refazer o tour.',
        placement: 'bottom',
      },
    ],
  },
];

export function getToursPorPagina(pathname: string): ConfiguracaoTour[] {
  return TOURS.filter((tour) => {
    if (tour.pagina === '/palpites') return pathname === '/palpites';
    if (tour.pagina === '/inicio') return pathname === '/inicio';
    if (tour.pagina === '/grupos/')
      return pathname.startsWith('/grupos/') && pathname !== '/grupos';
    return false;
  });
}
