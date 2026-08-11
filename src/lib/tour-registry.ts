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
        target: '[data-tour="alerta-jogos-atrasados"]',
        titulo: 'Jogos atrasados',
        conteudo:
          'Quando houver jogos que você ainda não palpitou e já deveriam ter sido feitos, este alerta aparece. Toque para ver e palpitar.',
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
        target: '[data-tour="aba-meus-palpites"]',
        titulo: 'Meus palpites',
        conteudo:
          'Nesta aba você vê o histórico de todos os seus palpites com os resultados: acertos em cheio, parciais e erros.',
        placement: 'bottom',
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
        target: '[data-testid="grupo-detalhe-nome"]',
        titulo: 'Seu grupo',
        conteudo:
          'Esta é a página do seu grupo. Aqui você acompanha jogos, ranking e gerencia os membros.',
        placement: 'bottom',
      },
      {
        target: '[aria-label="Copiar link de convite"]',
        titulo: 'Convide amigos',
        conteudo:
          'Toque aqui para copiar o link de convite e compartilhar com seus amigos.',
        placement: 'bottom',
      },
      {
        target: '[data-testid="grupo-btn-configuracoes"]',
        titulo: 'Configurações',
        conteudo:
          'Acesse as configurações do grupo: editar nome, gerenciar membros e mais.',
        placement: 'bottom',
      },
      {
        target: '[data-testid="grupo-btn-pesquisar"]',
        titulo: 'Pesquisar grupos',
        conteudo:
          'Encontre grupos públicos para participar. Busque pelo nome do grupo e entre com um toque.',
        placement: 'auto',
      },
      {
        target: '[data-testid="grupo-btn-meus-grupos"]',
        titulo: 'Meus grupos',
        conteudo:
          'Veja todos os grupos que você participa e alterne entre eles rapidamente.',
        placement: 'auto',
      },
      {
        target: '[data-tour="alerta-jogos-atrasados"]',
        titulo: 'Jogos atrasados',
        conteudo:
          'Quando houver jogos com palpites pendentes que já deveriam ter sido feitos, o alerta aparece aqui.',
        placement: 'bottom',
      },
      {
        target: '[data-testid="grupo-btn-palpites"]',
        titulo: 'Palpites do grupo',
        conteudo:
          'Expanda esta seção para ver os jogos já finalizados e os palpites de cada membro.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="chevron-jogo-grupo"]',
        titulo: 'Detalhamento dos palpites',
        conteudo:
          'Toque na seta ao lado de cada jogo para ver quem acertou em cheio (3 pts), quem acertou o resultado (1 pt) e quem errou.',
        placement: 'left',
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
    id: 'tour-ranking',
    nome: 'Tour do Ranking',
    pagina: '/ranking',
    steps: [
      {
        target: '[data-tour="ranking-titulo"]',
        titulo: 'Ranking do Bolão',
        conteudo:
          'Aqui você acompanha a classificação geral do seu grupo. Veja quem está na frente!',
        placement: 'bottom',
      },
      {
        target: '[data-testid="home-ranking-filtro-grupo"]',
        titulo: 'Trocar de grupo',
        conteudo:
          'Se você participa de mais de um grupo, troque entre eles para ver rankings diferentes.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="ranking-podio"]',
        titulo: 'Pódio',
        conteudo:
          'Os 3 primeiros colocados ficam em destaque no pódio. Pontuação: acerto em cheio (3 pts), resultado (1 pt).',
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
    id: 'tour-conta',
    nome: 'Tour da Conta',
    pagina: '/minha-conta',
    steps: [
      {
        target: '[data-tour="conta-perfil"]',
        titulo: 'Seu perfil',
        conteudo:
          'Aqui ficam suas informações pessoais.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="conta-dados-pessoais"]',
        titulo: 'Dados pessoais',
        conteudo:
          'Expanda para alterar seu nome ou email.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="conta-alterar-senha"]',
        titulo: 'Alterar senha',
        conteudo:
          'Expanda para definir uma nova senha de acesso.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="conta-notificacoes"]',
        titulo: 'Notificações push',
        conteudo:
          'Ative as notificações para receber lembretes de jogos e atualizações do ranking.',
        placement: 'bottom',
      },
      {
        target: '[data-testid="btn-logout"]',
        titulo: 'Sair',
        conteudo:
          'Toque aqui para encerrar sua sessão.',
        placement: 'top',
      },
      {
        target: '[data-tour="conta-zona-perigo"]',
        titulo: 'Zona de perigo',
        conteudo:
          'Aqui dentro você pode excluir sua conta permanentemente. Ação irreversível.',
        placement: 'top',
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
    id: 'tour-grupos-publicos',
    nome: 'Tour de Encontrar Grupos',
    pagina: '/grupos/buscar',
    steps: [
      {
        target: '[data-tour="grupos-publicos-titulo"]',
        titulo: 'Encontrar Grupos',
        conteudo:
          'Aqui você encontra grupos para participar. Busque grupos públicos ou entre com um código de convite!',
        placement: 'bottom',
      },
      {
        target: '[data-tour="grupos-publicos-abas"]',
        titulo: 'Duas formas de entrar',
        conteudo:
          'Use "Grupos Públicos" para explorar grupos abertos e buscar por nome, ou "Código de Convite" para entrar em grupos privados.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="grupos-publicos-busca"]',
        titulo: 'Buscar grupos',
        conteudo:
          'Use o campo de busca para encontrar grupos pelo nome. A lista é filtrada em tempo real.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="grupos-publicos-lista"]',
        titulo: 'Lista de grupos',
        conteudo:
          'Cada card mostra o nome do grupo e quantos participantes possui. Toque em "Entrar" para participar.',
        placement: 'top',
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
    id: 'tour-meus-grupos',
    nome: 'Tour de Meus Grupos',
    pagina: '/grupos/explorar',
    steps: [
      {
        target: '[data-tour="meus-grupos-titulo"]',
        titulo: 'Meus Grupos',
        conteudo:
          'Aqui ficam todos os grupos que você participa. Toque em qualquer um para acessar palpites e ranking.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="meus-grupos-criar"]',
        titulo: 'Criar grupo',
        conteudo:
          'Toque aqui para criar um novo grupo e convidar seus amigos.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="meus-grupos-favorito"]',
        titulo: 'Grupo favorito',
        conteudo:
          'O grupo com a estrela dourada é seu favorito. Ele aparece em destaque na home. Toque na estrela de outro grupo para trocar.',
        placement: 'top',
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
    if (tour.pagina === '/ranking') return pathname === '/ranking';
    if (tour.pagina === '/minha-conta') return pathname === '/minha-conta';
    if (tour.pagina === '/grupos/buscar') return pathname === '/grupos/buscar';
    if (tour.pagina === '/grupos/explorar') return pathname === '/grupos/explorar';
    if (tour.pagina === '/grupos/')
      return pathname.startsWith('/grupos/') && pathname !== '/grupos' && pathname !== '/grupos/buscar' && pathname !== '/grupos/explorar';
    return false;
  });
}
