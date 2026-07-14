'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useHomeData } from '@/hooks/useHomeData';
import { CardProximosJogos } from '@/components/home/card-proximos-jogos';
import { CardMeusGrupos } from '@/components/home/card-meus-grupos';
import { CardAvisos } from '@/components/home/card-avisos';
import { CardRanking } from '@/components/home/card-ranking';
import { SinoNotificacoes } from '@/components/layout/sino-notificacoes';

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
  const logout = useAuthStore((state) => state.logout);

  const {
    usuario,
    grupos,
    carregandoGrupos,
    grupoFavoritoInicial,
    grupoSelecionadoId,
    setGrupoRankingId,
    proximosJogos,
    proximoJogoPronto,
    proximosJogosPorCampeonato,
    meuPalpite,
    rankingFormatado,
    gruposOpcoes,
    carregandoRanking,
    ehCopa,
    ehCopaRanking,
  } = useHomeData();

  const primeiroNome = usuario?.nome?.split(' ')[0] || '';

  async function aoSair() {
    await logout();
    router.replace('/login');
  }

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
              Olá, <span className="text-primaria-claro">{primeiroNome}</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <SinoNotificacoes />
          </div>
        </div>
      </header>

      {/* Feed */}
      <div className="mx-auto max-w-[480px] px-4 pt-4 pb-6 space-y-3">
        {/* Avisos do admin */}
        <CardAvisos />

        {/* Próximos jogos — 1 card por campeonato */}
        {proximosJogosPorCampeonato.length > 0 && (
          proximosJogosPorCampeonato.map((item) => (
            <CardProximosJogos
              key={item.campeonato}
              jogos={item.jogos}
              grupoId={item.grupoId}
              temaCopa={item.ehCopa}
              campeonatoLabel={item.campeonato}
            />
          ))
        )}
        {proximosJogosPorCampeonato.length === 0 && proximoJogoPronto && proximosJogos.length > 0 && (
          <CardProximosJogos
            jogos={proximosJogos}
            meuPalpite={meuPalpite}
            grupoId={grupoFavoritoInicial}
            temaCopa={ehCopa}
          />
        )}
        {proximosJogosPorCampeonato.length === 0 && !proximoJogoPronto && (
          <div className="h-44 rounded-2xl bg-white/[0.03] border border-white/[0.08] animate-pulse" />
        )}

        {/* Meus grupos */}
        <CardMeusGrupos
          carregando={carregandoGrupos}
          grupos={(grupos ?? []).map((g) => ({
            id: g.id,
            nome: g.nome,
            campeonato: g.temporada?.campeonato?.nome ?? '',
            ano: g.temporada?.ano,
            participantes: g.totalParticipantes ?? 0,
            ehFavorito: g.id === usuario?.grupoFavoritoId,
          }))}
        />

        {/* Ranking */}
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
