import type { ConfiguracaoDica } from '@/types/dica.types';

export const DICAS: ConfiguracaoDica[] = [
  // ═══════════════════════════════════════════
  // Página: /palpites
  // ═══════════════════════════════════════════
  {
    dicaId: 'dica-palpites-boas-vindas',
    target: '[data-dica="boas-vindas"]',
    titulo: 'Bem-vindo ao Bolão!',
    conteudo:
      'Esta é a tela de palpites. Aqui você registra seus palpites para os jogos de cada rodada.',
    placement: 'bottom',
    prioridade: 1,
    pagina: '/palpites',
  },
  {
    dicaId: 'dica-palpites-alerta-atrasados',
    target: '[data-dica="alerta-jogos-atrasados"]',
    titulo: 'Jogos atrasados',
    conteudo:
      'Quando houver jogos que você ainda não palpitou e já deveriam ter sido feitos, este alerta aparece. Toque para ver e palpitar.',
    placement: 'bottom',
    prioridade: 2,
    pagina: '/palpites',
  },
  {
    dicaId: 'dica-palpites-primeiro-card',
    target: '[data-dica="primeiro-card-jogo"]',
    titulo: 'Faça seu palpite',
    conteudo:
      'Toque no número para digitar o placar. O palpite é salvo automaticamente ao digitar o número.',
    placement: 'bottom',
    prioridade: 1,
    pagina: '/palpites',
  },
  {
    dicaId: 'dica-palpites-chevron',
    target: '[data-dica="chevron-palpites"]',
    titulo: 'Veja quem palpitou',
    conteudo:
      'Toque na seta para expandir. Antes do jogo, mostra quem já palpitou. Quando o jogo começa, revela o placar de cada um.',
    placement: 'top',
    prioridade: 3,
    pagina: '/palpites',
  },
  {
    dicaId: 'dica-palpites-info-rodadas',
    target: '[data-dica="info-rodadas"]',
    titulo: '20 jogos disponíveis',
    conteudo:
      'Você sempre terá até 20 jogos disponíveis para palpitar: a rodada atual e a próxima.',
    placement: 'top',
    prioridade: 4,
    pagina: '/palpites',
  },
  {
    dicaId: 'dica-palpites-aba-meus',
    target: '[data-dica="aba-meus-palpites"]',
    titulo: 'Meus palpites',
    conteudo:
      'Nesta aba você vê o histórico de todos os seus palpites com os resultados: acertos em cheio, parciais e erros.',
    placement: 'bottom',
    prioridade: 3,
    pagina: '/palpites',
  },
  {
    dicaId: 'dica-palpites-seletor-campeonato',
    target: '[data-dica="seletor-campeonato"] button:nth-child(2)',
    titulo: 'Outros campeonatos',
    conteudo:
      'Quando houver mais de um campeonato ativo, troque entre eles usando estas abas.',
    placement: 'bottom',
    prioridade: 5,
    pagina: '/palpites',
  },

  // ═══════════════════════════════════════════
  // Página: /grupos/[grupoId]
  // ═══════════════════════════════════════════
  {
    dicaId: 'dica-grupo-nome',
    target: '[data-testid="grupo-detalhe-nome"]',
    titulo: 'Seu grupo',
    conteudo:
      'Esta é a página do seu grupo. Aqui você acompanha jogos, ranking e gerencia os membros.',
    placement: 'bottom',
    prioridade: 1,
    pagina: '/grupos/',
  },
  {
    dicaId: 'dica-grupo-convite',
    target: '[aria-label="Copiar link de convite"]',
    titulo: 'Convide amigos',
    conteudo:
      'Toque aqui para copiar o link de convite e compartilhar com seus amigos.',
    placement: 'bottom',
    prioridade: 2,
    pagina: '/grupos/',
  },
  {
    dicaId: 'dica-grupo-configuracoes',
    target: '[data-testid="grupo-btn-configuracoes"]',
    titulo: 'Configurações',
    conteudo:
      'Acesse as configurações do grupo: editar nome, gerenciar membros e mais.',
    placement: 'bottom',
    prioridade: 3,
    pagina: '/grupos/',
  },
  {
    dicaId: 'dica-grupo-pesquisar',
    target: '[data-testid="grupo-btn-pesquisar"]',
    titulo: 'Pesquisar grupos',
    conteudo:
      'Encontre grupos públicos para participar. Busque pelo nome do grupo e entre com um toque.',
    placement: 'auto',
    prioridade: 4,
    pagina: '/grupos/',
  },
  {
    dicaId: 'dica-grupo-meus-grupos',
    target: '[data-testid="grupo-btn-meus-grupos"]',
    titulo: 'Meus grupos',
    conteudo:
      'Veja todos os grupos que você participa e alterne entre eles rapidamente.',
    placement: 'auto',
    prioridade: 4,
    pagina: '/grupos/',
  },
  {
    dicaId: 'dica-grupo-alerta-atrasados',
    target: '[data-dica="alerta-jogos-atrasados"]',
    titulo: 'Jogos atrasados',
    conteudo:
      'Quando houver jogos com palpites pendentes que já deveriam ter sido feitos, o alerta aparece aqui.',
    placement: 'bottom',
    prioridade: 3,
    pagina: '/grupos/',
  },
  {
    dicaId: 'dica-grupo-palpites',
    target: '[data-testid="grupo-btn-palpites"]',
    titulo: 'Palpites do grupo',
    conteudo:
      'Expanda esta seção para ver os jogos já finalizados e os palpites de cada membro.',
    placement: 'bottom',
    prioridade: 3,
    pagina: '/grupos/',
  },
  {
    dicaId: 'dica-grupo-chevron-jogo',
    target: '[data-dica="chevron-jogo-grupo"]',
    titulo: 'Detalhamento dos palpites',
    conteudo:
      'Toque na seta ao lado de cada jogo para ver quem acertou em cheio (3 pts), quem acertou o resultado (1 pt) e quem errou.',
    placement: 'left',
    prioridade: 4,
    pagina: '/grupos/',
  },

  // ═══════════════════════════════════════════
  // Página: /ranking
  // ═══════════════════════════════════════════
  {
    dicaId: 'dica-ranking-titulo',
    target: '[data-dica="ranking-titulo"]',
    titulo: 'Ranking do Bolão',
    conteudo:
      'Aqui você acompanha a classificação geral do seu grupo. Veja quem está na frente!',
    placement: 'bottom',
    prioridade: 1,
    pagina: '/ranking',
  },
  {
    dicaId: 'dica-ranking-filtro-grupo',
    target: '[data-testid="home-ranking-filtro-grupo"]',
    titulo: 'Trocar de grupo',
    conteudo:
      'Se você participa de mais de um grupo, troque entre eles para ver rankings diferentes.',
    placement: 'bottom',
    prioridade: 2,
    pagina: '/ranking',
  },
  {
    dicaId: 'dica-ranking-podio',
    target: '[data-dica="ranking-podio"]',
    titulo: 'Pódio',
    conteudo:
      'Os 3 primeiros colocados ficam em destaque no pódio. Pontuação: acerto em cheio (3 pts), resultado (1 pt).',
    placement: 'bottom',
    prioridade: 2,
    pagina: '/ranking',
  },

  // ═══════════════════════════════════════════
  // Página: /minha-conta
  // ═══════════════════════════════════════════
  {
    dicaId: 'dica-conta-perfil',
    target: '[data-dica="conta-perfil"]',
    titulo: 'Seu perfil',
    conteudo: 'Aqui ficam suas informações pessoais.',
    placement: 'bottom',
    prioridade: 1,
    pagina: '/minha-conta',
  },
  {
    dicaId: 'dica-conta-dados-pessoais',
    target: '[data-dica="conta-dados-pessoais"]',
    titulo: 'Dados pessoais',
    conteudo: 'Expanda para alterar seu nome ou email.',
    placement: 'bottom',
    prioridade: 2,
    pagina: '/minha-conta',
  },
  {
    dicaId: 'dica-conta-alterar-senha',
    target: '[data-dica="conta-alterar-senha"]',
    titulo: 'Alterar senha',
    conteudo: 'Expanda para definir uma nova senha de acesso.',
    placement: 'bottom',
    prioridade: 3,
    pagina: '/minha-conta',
  },
  {
    dicaId: 'dica-conta-notificacoes',
    target: '[data-dica="conta-notificacoes"]',
    titulo: 'Notificações push',
    conteudo:
      'Ative as notificações para receber lembretes de jogos e atualizações do ranking.',
    placement: 'bottom',
    prioridade: 3,
    pagina: '/minha-conta',
  },
  {
    dicaId: 'dica-conta-logout',
    target: '[data-testid="btn-logout"]',
    titulo: 'Sair',
    conteudo: 'Toque aqui para encerrar sua sessão.',
    placement: 'top',
    prioridade: 5,
    pagina: '/minha-conta',
  },
  {
    dicaId: 'dica-conta-zona-perigo',
    target: '[data-dica="conta-zona-perigo"]',
    titulo: 'Zona de perigo',
    conteudo:
      'Aqui dentro você pode excluir sua conta permanentemente. Ação irreversível.',
    placement: 'top',
    prioridade: 5,
    pagina: '/minha-conta',
  },

  // ═══════════════════════════════════════════
  // Página: /grupos/buscar
  // ═══════════════════════════════════════════
  {
    dicaId: 'dica-buscar-titulo',
    target: '[data-dica="grupos-publicos-titulo"]',
    titulo: 'Encontrar Grupos',
    conteudo:
      'Aqui você encontra grupos para participar. Busque grupos públicos ou entre com um código de convite!',
    placement: 'bottom',
    prioridade: 1,
    pagina: '/grupos/buscar',
  },
  {
    dicaId: 'dica-buscar-abas',
    target: '[data-dica="grupos-publicos-abas"]',
    titulo: 'Duas formas de entrar',
    conteudo:
      'Use "Grupos Públicos" para explorar grupos abertos e buscar por nome, ou "Código de Convite" para entrar em grupos privados.',
    placement: 'bottom',
    prioridade: 2,
    pagina: '/grupos/buscar',
  },
  {
    dicaId: 'dica-buscar-campo',
    target: '[data-dica="grupos-publicos-busca"]',
    titulo: 'Buscar grupos',
    conteudo:
      'Use o campo de busca para encontrar grupos pelo nome. A lista é filtrada em tempo real.',
    placement: 'bottom',
    prioridade: 3,
    pagina: '/grupos/buscar',
  },
  {
    dicaId: 'dica-buscar-lista',
    target: '[data-dica="grupos-publicos-lista"]',
    titulo: 'Lista de grupos',
    conteudo:
      'Cada card mostra o nome do grupo e quantos participantes possui. Toque em "Entrar" para participar.',
    placement: 'top',
    prioridade: 3,
    pagina: '/grupos/buscar',
  },

  // ═══════════════════════════════════════════
  // Página: /grupos/explorar
  // ═══════════════════════════════════════════
  {
    dicaId: 'dica-explorar-titulo',
    target: '[data-dica="meus-grupos-titulo"]',
    titulo: 'Meus Grupos',
    conteudo:
      'Aqui ficam todos os grupos que você participa. Toque em qualquer um para acessar palpites e ranking.',
    placement: 'bottom',
    prioridade: 1,
    pagina: '/grupos/explorar',
  },
  {
    dicaId: 'dica-explorar-criar',
    target: '[data-dica="meus-grupos-criar"]',
    titulo: 'Criar grupo',
    conteudo:
      'Toque aqui para criar um novo grupo e convidar seus amigos.',
    placement: 'bottom',
    prioridade: 2,
    pagina: '/grupos/explorar',
  },
  {
    dicaId: 'dica-explorar-favorito',
    target: '[data-dica="meus-grupos-favorito"]',
    titulo: 'Grupo favorito',
    conteudo:
      'O grupo com a estrela dourada é seu favorito. Ele aparece em destaque na home. Toque na estrela de outro grupo para trocar.',
    placement: 'top',
    prioridade: 3,
    pagina: '/grupos/explorar',
  },
];

/**
 * Mapeamento de tourId antigo → dicaIds correspondentes.
 * Usado na migração de dados no backend.
 */
export const MAPEAMENTO_TOUR_DICAS: Record<string, string[]> = {
  'tour-palpites': [
    'dica-palpites-boas-vindas',
    'dica-palpites-alerta-atrasados',
    'dica-palpites-primeiro-card',
    'dica-palpites-chevron',
    'dica-palpites-info-rodadas',
    'dica-palpites-aba-meus',
    'dica-palpites-seletor-campeonato',
  ],
  'tour-grupo': [
    'dica-grupo-nome',
    'dica-grupo-convite',
    'dica-grupo-configuracoes',
    'dica-grupo-pesquisar',
    'dica-grupo-meus-grupos',
    'dica-grupo-alerta-atrasados',
    'dica-grupo-palpites',
    'dica-grupo-chevron-jogo',
  ],
  'tour-ranking': [
    'dica-ranking-titulo',
    'dica-ranking-filtro-grupo',
    'dica-ranking-podio',
  ],
  'tour-conta': [
    'dica-conta-perfil',
    'dica-conta-dados-pessoais',
    'dica-conta-alterar-senha',
    'dica-conta-notificacoes',
    'dica-conta-logout',
    'dica-conta-zona-perigo',
  ],
  'tour-grupos-publicos': [
    'dica-buscar-titulo',
    'dica-buscar-abas',
    'dica-buscar-campo',
    'dica-buscar-lista',
  ],
  'tour-meus-grupos': [
    'dica-explorar-titulo',
    'dica-explorar-criar',
    'dica-explorar-favorito',
  ],
};

export function getDicasPorPagina(pathname: string): ConfiguracaoDica[] {
  return DICAS.filter((dica) => {
    if (dica.pagina === '/palpites') return pathname === '/palpites';
    if (dica.pagina === '/ranking') return pathname === '/ranking';
    if (dica.pagina === '/minha-conta') return pathname === '/minha-conta';
    if (dica.pagina === '/grupos/buscar') return pathname === '/grupos/buscar';
    if (dica.pagina === '/grupos/explorar')
      return pathname === '/grupos/explorar';
    if (dica.pagina === '/grupos/')
      return (
        pathname.startsWith('/grupos/') &&
        pathname !== '/grupos' &&
        pathname !== '/grupos/buscar' &&
        pathname !== '/grupos/explorar'
      );
    return false;
  }).sort((a, b) => a.prioridade - b.prioridade);
}
