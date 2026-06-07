'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Bell, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { CardProximoJogo } from '@/components/home/card-proximo-jogo';
import { CardMeusGrupos } from '@/components/home/card-meus-grupos';
import { CardRanking } from '@/components/home/card-ranking';
import { listarGrupos, obterRankingGeral } from '@/services/grupo.service';
import { buscarDadosTemporada, listarTemporadas } from '@/services/jogo.service';
import { buscarEstatisticasPalpite, buscarMeuPalpite } from '@/services/palpite.service';

function obterIniciais(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export default function InicioPage() {
  const router = useRouter();
  const usuario = useAuthStore((state) => state.usuario);
  const logout = useAuthStore((state) => state.logout);

  // Buscar grupos do usuário
  const { data: grupos, isLoading: carregandoGrupos } = useQuery({
    queryKey: ['grupos'],
    queryFn: listarGrupos,
  });

  // Estado do filtro de grupo no ranking
  const grupoFavoritoInicial = usuario?.grupoFavoritoId ?? grupos?.[0]?.id;
  const [grupoRankingId, setGrupoRankingId] = useState<string | undefined>(undefined);
  const grupoSelecionadoId = grupoRankingId ?? grupoFavoritoInicial;

  // Buscar ranking do grupo selecionado
  const { data: ranking, isLoading: carregandoRanking } = useQuery({
    queryKey: ['ranking-home', grupoSelecionadoId],
    queryFn: () => obterRankingGeral(grupoSelecionadoId ?? ''),
    enabled: !!grupoSelecionadoId,
    staleTime: 60_000,
  });

  // Buscar temporadas
  const { data: temporadas } = useQuery({
    queryKey: ['temporadas'],
    queryFn: listarTemporadas,
    staleTime: 300_000,
  });

  // Temporada do grupo favorito (para buscar próximo jogo)
  const temporadaId = grupos?.find((g) => g.id === grupoFavoritoInicial)?.temporadaId ?? temporadas?.[0]?.id;

  const { data: dadosTemporada } = useQuery({
    queryKey: ['dados-temporada-home', temporadaId],
    queryFn: () => buscarDadosTemporada(temporadaId ?? ''),
    enabled: !!temporadaId,
    staleTime: 60_000,
  });

  const proximoJogo = dadosTemporada?.proximoJogo;
  const jogoId = proximoJogo?.jogo.id;

  // Buscar estatísticas de palpites do próximo jogo (total real de palpites)
  const { data: estatisticas } = useQuery({
    queryKey: ['estatisticas-palpite-home', grupoFavoritoInicial, jogoId],
    queryFn: () => buscarEstatisticasPalpite(grupoFavoritoInicial ?? '', jogoId ?? ''),
    enabled: !!grupoFavoritoInicial && !!jogoId,
    staleTime: 30_000,
  });

  // Buscar se o usuário já palpitou no próximo jogo
  const { data: meuPalpite } = useQuery({
    queryKey: ['meu-palpite-home', jogoId],
    queryFn: () => buscarMeuPalpite(jogoId ?? ''),
    enabled: !!jogoId,
    staleTime: Infinity,
  });

  const primeiroNome = usuario?.nome?.split(' ')[0] || '';

  async function aoSair() {
    await logout();
    router.replace('/login');
  }

  // Ranking formatado — passa critérios de desempate para o card
  const rankingFormatado = (ranking ?? []).slice(0, 5).map((entry) => ({
    posicao: entry.posicao,
    nome: entry.nomeUsuario,
    pontos: entry.pontuacaoTotal ?? 0,
    acertosEmCheio: entry.acertosEmCheio ?? 0,
    acertosDeResultado: entry.acertosDeResultado ?? 0,
    totalPalpites: (entry.acertosEmCheio ?? 0) + (entry.acertosDeResultado ?? 0) + (entry.acertosDeGolsUmTime ?? 0) + (entry.errosTotais ?? 0),
    esquecidos: 0,
    destaque: entry.usuarioId === usuario?.id,
  }));

  // Opções de grupo para o filtro do ranking
  const gruposOpcoes = (grupos ?? []).map((g) => ({ id: g.id, nome: g.nome }));

  // Detectar se é Copa — baseado no grupo favorito (card próximo jogo) e grupo do ranking
  const nomeCampeonato = grupos?.find((g) => g.id === grupoFavoritoInicial)?.temporada?.campeonato?.nome;
  const ehCopa = nomeCampeonato?.toLowerCase().includes('copa') ?? false;

  const nomeCampeonatoRanking = grupos?.find((g) => g.id === grupoSelecionadoId)?.temporada?.campeonato?.nome;
  const ehCopaRanking = nomeCampeonatoRanking?.toLowerCase().includes('copa') ?? false;

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Header */}
      <header
        className="sticky top-0 z-20 px-5 pt-5 pb-4 bg-fundo/80 backdrop-blur-xl border-b border-white/[0.04]"
        data-testid="home-header"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-texto">
              Olá, <span className="text-primaria-claro">{primeiroNome}</span> 👋
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <button
              onClick={() => router.push('/minha-conta')}
              aria-label="Minha conta"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primaria/15 text-primaria text-sm font-bold border-2 border-primaria/30 shadow-[0_0_12px_rgba(22,163,74,0.2)] hover:shadow-[0_0_18px_rgba(22,163,74,0.3)] transition-all"
              data-testid="home-btn-conta"
            >
              {usuario ? obterIniciais(usuario.nome) : 'U'}
            </button>
            {/* Notificação */}
            <button
              aria-label="Notificações"
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] border border-white/[0.08] text-texto/50 hover:text-texto/70 transition-colors"
              data-testid="home-btn-notificacoes"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primaria shadow-[0_0_4px_rgba(22,163,74,0.6)]" />
            </button>
            {/* Logout */}
            <button
              onClick={aoSair}
              aria-label="Sair"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] border border-white/[0.08] text-texto/30 hover:text-erro/70 hover:border-erro/30 transition-colors"
              data-testid="home-btn-logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Feed */}
      <div className="mx-auto max-w-[480px] px-4 pt-4 pb-6 space-y-3">
        {/* Card principal — Próximo jogo (compacto) */}
        {proximoJogo ? (
          <CardProximoJogo
            jogoId={proximoJogo.jogo.id}
            timeCasa={{
              nome: proximoJogo.jogo.timeCasa?.nome || 'Casa',
              sigla: proximoJogo.jogo.timeCasa?.sigla || 'CAS',
              escudo: proximoJogo.jogo.timeCasa?.escudo,
            }}
            timeFora={{
              nome: proximoJogo.jogo.timeFora?.nome || 'Fora',
              sigla: proximoJogo.jogo.timeFora?.sigla || 'FOR',
              escudo: proximoJogo.jogo.timeFora?.escudo,
            }}
            dataHora={proximoJogo.jogo.dataHora}
            totalPalpites={estatisticas?.total}
            jaPalpitou={meuPalpite !== null && meuPalpite !== undefined}
            grupoId={grupoFavoritoInicial}
            temaCopa={ehCopa}
          />
        ) : (
          <div className="h-44 rounded-2xl bg-white/[0.03] border border-white/[0.08] animate-pulse" />
        )}

        {/* Meus grupos — mostra todos */}
        <CardMeusGrupos
          carregando={carregandoGrupos}
          grupos={(grupos ?? []).map((g) => ({
            id: g.id,
            nome: g.nome,
            icone: g.icone,
            participantes: g.totalParticipantes ?? 0,
            ehFavorito: g.id === usuario?.grupoFavoritoId,
          }))}
        />

        {/* Ranking com filtro de grupo */}
        <CardRanking
          ranking={rankingFormatado}
          grupos={gruposOpcoes}
          grupoSelecionadoId={grupoSelecionadoId}
          onTrocarGrupo={setGrupoRankingId}
          carregando={carregandoRanking}
          temaCopa={ehCopaRanking}
        />
      </div>
    </div>
  );
}
