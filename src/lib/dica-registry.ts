import type { ConfiguracaoDica } from '@/types/dica.types';

export const DICAS: ConfiguracaoDica[] = [
  // ═══════ Palpites ═══════
  {
    dicaId: 'dica-palpites-boas-vindas',
    target: '[data-dica="boas-vindas"]',
    titulo: 'Bem-vindo ao Bolão!',
    conteudo:
      'Esta é a tela de palpites. Aqui você registra seus palpites para os jogos de cada rodada.',
    posicao: 'bottom',
    prioridade: 1,
    pagina: '/palpites',
  },
  {
    dicaId: 'dica-palpites-alerta-atrasados',
    target: '[data-dica="alerta-jogos-atrasados"]',
    titulo: 'Jogos atrasados',
    conteudo:
      'Quando houver jogos que você ainda não palpitou e já deveriam ter sido feitos, este alerta aparece. Toque para ver e palpitar.',
    posicao: 'bottom',
    prioridade: 2,
    pagina: '/palpites',
  },
  {
    dicaId: 'dica-palpites-primeiro-card',
    target: '[data-dica="primeiro-card-jogo"]',
    titulo: 'Faça seu palpite',
    conteudo:
      'Toque no número para digitar o placar. O palpite é salvo automaticamente ao digitar o número.',
    posicao: 'bottom',
    prioridade: 1,
    pagina: '/palpites',
  },
  {
    dicaId: 'dica-palpites-chevron',
    target: '[data-dica="chevron-palpites"]',
    titulo: 'Veja quem palpitou',
    conteudo:
      'Toque na seta para expandir. Antes do jogo, mostra quem já palpitou. Quando o jogo começa, revela o placar de cada um.',
    posicao: 'top',
    prioridade: 3,
    pagina: '/palpites',
  },
  {
    dicaId: 'dica-palpites-info-rodadas',
    target: '[data-dica="info-rodadas"]',
    titulo: '20 jogos disponíveis',
    conteudo:
      'Você sempre terá até 20 jogos disponíveis para palpitar: a rodada atual e a próxima.',
    posicao: 'top',
    prioridade: 4,
    pagina: '/palpites',
  },
  {
    dicaId: 'dica-palpites-aba-meus',
    target: '[data-dica="aba-meus-palpites"]',
    titulo: 'Meus palpites',
    conteudo:
      'Nesta aba você vê o histórico de todos os seus palpites com os resultados: acertos em cheio, parciais e erros.',
    posicao: 'bottom',
    prioridade: 2,
    pagina: '/palpites',
  },
  {
    dicaId: 'dica-palpites-seletor-campeonato',
    target: '[data-dica="seletor-campeonato"]',
    titulo: 'Outros campeonatos',
    conteudo:
      'Quando houver mais de um campeonato ativo, troque entre eles usando estas abas.',
    posicao: 'bottom',
    prioridade: 3,
    pagina: '/palpites',
  },

  // ═══════ Grupo ═══════
  {
    dicaId: 'dica-grupo-nome',
    target: '[data-dica="grupo-nome"]',
    titulo: 'Seu grupo',
    conteudo:
      'Esta é a página do seu grupo. Aqui você acompanha jogos, ranking e gerencia os membros.',
    posicao: 'bottom',
    prioridade: 1,
    pagina: '/grupos/',
  },
  {
    dicaId: 'dica-grupo-convite',
    target: '[data-dica="grupo-convite"]',
    titulo: 'Convide amigos',
    conteudo:
      'Toque aqui para copiar o link de convite e compartilhar com seus amigos.',
    posicao: 'bottom',
    prioridade: 2,
    pagina: '/grupos/',
  },
  {
    dicaId: 'dica-grupo-configuracoes',
    target: '[data-dica="grupo-configuracoes"]',
    titulo: 'Configurações',
    conteudo:
      'Acesse as configurações do grupo: editar nome, gerenciar membros e mais.',
    posicao: 'bottom',
    prioridade: 3,
    pagina: '/grupos/',
  },
  {
    dicaId: 'dica-grupo-pesquisar',
    target: '[data-dica="grupo-pesquisar"]',
    titulo: 'Pesquisar grupos',
    conteudo:
      'Encontre grupos públicos para participar. Busque pelo nome do grupo e entre com um toque.',
    posicao: 'auto',
    prioridade: 4,
    pagina: '/grupos/',
  },
  {
    dicaId: 'dica-grupo-meus-grupos',
    target: '[data-dica="grupo-meus-grupos"]',
    titulo: 'Meus grupos',
    conteudo:
      'Veja todos os grupos que você participa e alterne entre eles rapidamente.',
    posicao: 'auto',
    prioridade: 4,
    pagina: '/grupos/',
  },
  {
    dicaId: 'dica-grupo-alerta-atrasados',
    target: '[data-dica="alerta-jogos-atrasados"]',
    titulo: 'Jogos atrasados',
    conteudo:
      'Quando houver jogos com palpites pendentes que já deveriam ter sido feitos, o alerta aparece aqui.',
    posicao: 'bottom',
    prioridade: 2,
    pagina: '/grupos/',
  },
  {
    dicaId: 'dica-grupo-palpites',
    target: '[data-dica="grupo-palpites"]',
    titulo: 'Palpites do grupo',
    conteudo:
      'Expanda esta seção para ver os jogos já finalizados e os palpites de cada membro.',
    posicao: 'bottom',
    prioridade: 3,
    pagina: '/grupos/',
  },
  {
    dicaId: 'dica-grupo-chevron-jogo',
    target: '[data-dica="chevron-jogo-grupo"]',
    titulo: 'Detalhamento dos palpites',
    conteudo:
      'Toque na seta ao lado de cada jogo para ver quem acertou em cheio (3 pts), quem acertou o resultado (1 pt) e quem errou.',
    posicao: 'left',
    prioridade: 4,
    pagina: '/grupos/',
  },

  // ═══════ Ranking ═══════
  {
    dicaId: 'dica-ranking-titulo',
    target: '[data-dica="ranking-titulo"]',
    titulo: 'Ranking do Bolão',
    conteudo:
      'Aqui você acompanha a classificação geral do seu grupo. Veja quem está na frente!',
    posicao: 'bottom',
    prioridade: 1,
    pagina: '/ranking',
  },
  {
    dicaId: 'dica-ranking-filtro-grupo',
    target: '[data-dica="ranking-filtro-grupo"]',
    titulo: 'Trocar de grupo',
    conteudo:
      'Se você participa de mais de um grupo, troque entre eles para ver rankings diferentes.',
    posicao: 'bottom',
    prioridade: 2,
    pagina: '/ranking',
  },
  {
    dicaId: 'dica-ranking-podio',
    target: '[data-dica="ranking-podio"]',
    titulo: 'Pódio',
    conteudo:
      'Os 3 primeiros colocados ficam em destaque no pódio. Pontuação: acerto em cheio (3 pts), resultado (1 pt).',
    posicao: 'bottom',
    prioridade: 1,
    pagina: '/ranking',
  },

  // ═══════ Minha Conta ═══════
  {
    dicaId: 'dica-conta-perfil',
    target: '[data-dica="conta-perfil"]',
    titulo: 'Seu perfil',
    conteudo: 'Aqui ficam suas informações pessoais.',
    posicao: 'bottom',
    prioridade: 1,
    pagina: '/minha-conta',
  },
  {
    dicaId: 'dica-conta-dados-pessoais',
    target: '[data-dica="conta-dados-pessoais"]',
    titulo: 'Dados pessoais',
    conteudo: 'Expanda para alterar seu nome ou email.',
    posicao: 'bottom',
    prioridade: 2,
    pagina: '/minha-conta',
  },
  {
    dicaId: 'dica-conta-alterar-senha',
    target: '[data-dica="conta-alterar-senha"]',
    titulo: 'Alterar senha',
    conteudo: 'Expanda para definir uma nova senha de acesso.',
    posicao: 'bottom',
    prioridade: 3,
    pagina: '/minha-conta',
  },
  {
    dicaId: 'dica-conta-notificacoes',
    target: '[data-dica="conta-notificacoes"]',
    titulo: 'Notificações push',
    conteudo:
      'Ative as notificações para receber lembretes de jogos e atualizações do ranking.',
    posicao: 'bottom',
    prioridade: 2,
    pagina: '/minha-conta',
  },
  {
    dicaId: 'dica-conta-logout',
    target: '[data-dica="conta-logout"]',
    titulo: 'Sair',
    conteudo: 'Toque aqui para encerrar sua sessão.',
    posicao: 'top',
    prioridade: 5,
    pagina: '/minha-conta',
  },
  {
    dicaId: 'dica-conta-zona-perigo',
    target: '[data-dica="conta-zona-perigo"]',
    titulo: 'Zona de perigo',
    conteudo:
      'Aqui dentro você pode excluir sua conta permanentemente. Ação irreversível.',
    posicao: 'top',
    prioridade: 5,
    pagina: '/minha-conta',
  },

  // ═══════ Buscar Grupos ═══════
  {
    dicaId: 'dica-buscar-titulo',
    target: '[data-dica="grupos-publicos-titulo"]',
    titulo: 'Encontrar Grupos',
    conteudo:
      'Aqui você encontra grupos para participar. Busque grupos públicos ou entre com um código de convite!',
    posicao: 'bottom',
    prioridade: 1,
    pagina: '/grupos/buscar',
  },
  {
    dicaId: 'dica-buscar-abas',
    target: '[data-dica="grupos-publicos-abas"]',
    titulo: 'Duas formas de entrar',
    conteudo:
      'Use "Grupos Públicos" para explorar grupos abertos e buscar por nome, ou "Código de Convite" para entrar em grupos privados.',
    posicao: 'bottom',
    prioridade: 1,
    pagina: '/grupos/buscar',
  },
  {
    dicaId: 'dica-buscar-campo',
    target: '[data-dica="grupos-publicos-busca"]',
    titulo: 'Buscar grupos',
    conteudo:
      'Use o campo de busca para encontrar grupos pelo nome. A lista é filtrada em tempo real.',
    posicao: 'bottom',
    prioridade: 2,
    pagina: '/grupos/buscar',
  },
  {
    dicaId: 'dica-buscar-lista',
    target: '[data-dica="grupos-publicos-lista"]',
    titulo: 'Lista de grupos',
    conteudo:
      'Cada card mostra o nome do grupo e quantos participantes possui. Toque em "Entrar" para participar.',
    posicao: 'top',
    prioridade: 3,
    pagina: '/grupos/buscar',
  },

  // ═══════ Meus Grupos ═══════
  {
    dicaId: 'dica-explorar-titulo',
    target: '[data-dica="meus-grupos-titulo"]',
    titulo: 'Meus Grupos',
    conteudo:
      'Aqui ficam todos os grupos que você participa. Toque em qualquer um para acessar palpites e ranking.',
    posicao: 'bottom',
    prioridade: 1,
    pagina: '/grupos/explorar',
  },
  {
    dicaId: 'dica-explorar-criar',
    target: '[data-dica="meus-grupos-criar"]',
    titulo: 'Criar grupo',
    conteudo: 'Toque aqui para criar um novo grupo e convidar seus amigos.',
    posicao: 'bottom',
    prioridade: 2,
    pagina: '/grupos/explorar',
  },
  {
    dicaId: 'dica-explorar-favorito',
    target: '[data-dica="meus-grupos-favorito"]',
    titulo: 'Grupo favorito',
    conteudo:
      'O grupo com a estrela dourada é seu favorito. Ele aparece em destaque na home. Toque na estrela de outro grupo para trocar.',
    posicao: 'top',
    prioridade: 2,
    pagina: '/grupos/explorar',
  },
];

/**
 * Filtra dicas por pathname da página atual.
 * Rotas dinâmicas (/grupos/[id]) correspondem a pagina '/grupos/'.
 */
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
        pathname !== '/grupos/explorar' &&
        pathname !== '/grupos/criar'
      );
    return false;
  });
}

/**
 * Mapeamento tourId → dicaIds correspondentes.
 * Usado na migração de dados (tours antigos → dicas dispensadas).
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
