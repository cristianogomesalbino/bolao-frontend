'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useHomeData } from '@/hooks/useHomeData';
import { CardProximoJogo } from '@/components/home/card-proximo-jogo';
import { CardMeusGrupos } from '@/components/home/card-meus-grupos';
import { CardRanking } from '@/components/home/card-ranking';

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
    proximoJogo,
    estatisticas,
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
              Olá, <span className="text-primaria-claro">{primeiroNome}</span> 👋
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/minha-conta')}
              aria-label="Minha conta"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primaria/15 text-primaria text-sm font-bold border-2 border-primaria/30 shadow-[0_0_12px_rgba(22,163,74,0.2)] hover:shadow-[0_0_18px_rgba(22,163,74,0.3)] transition-all"
              data-testid="home-btn-conta"
            >
              {usuario ? obterIniciais(usuario.nome) : 'U'}
            </button>
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
        {/* Próximo jogo */}
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

        {/* Meus grupos */}
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
