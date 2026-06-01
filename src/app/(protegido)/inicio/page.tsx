'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { CardProximoJogo } from '@/components/home/card-proximo-jogo';
import { CardMeusGrupos } from '@/components/home/card-meus-grupos';
import { CardRanking } from '@/components/home/card-ranking';
import { CardProximosJogos } from '@/components/home/card-proximos-jogos';
import { listarGrupos } from '@/services/grupo.service';
import { definirGrupoFavorito } from '@/services/usuario.service';

function obterIniciais(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function proximaData(horas: number): string {
  const data = new Date();
  data.setHours(data.getHours() + horas);
  return data.toISOString();
}

const mockRanking = [
  { posicao: 1, nome: 'Menta', pontos: 42 },
  { posicao: 2, nome: 'Cristiano', pontos: 38, destaque: true },
  { posicao: 3, nome: 'Davi', pontos: 35 },
];

const mockProximosJogos = [
  { id: '1', timeCasa: 'Flamengo', timeFora: 'Corinthians', dataHora: proximaData(3), countdown: '21h' },
  { id: '2', timeCasa: 'Brasil', timeFora: 'Argentina', dataHora: proximaData(48) },
];

export default function InicioPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const usuario = useAuthStore((state) => state.usuario);
  const logout = useAuthStore((state) => state.logout);

  const { data: grupos, isLoading: carregandoGrupos } = useQuery({
    queryKey: ['grupos'],
    queryFn: listarGrupos,
  });

  const atualizarUsuarioStore = useAuthStore((state) => state.atualizarUsuario);

  const mutationFavorito = useMutation({
    mutationFn: (grupoId: string) => definirGrupoFavorito(grupoId),
    onSuccess: (data) => {
      atualizarUsuarioStore({ grupoFavoritoId: data.grupoFavoritoId });
      queryClient.invalidateQueries({ queryKey: ['estatisticas-palpite'] });
    },
  });

  async function aoSair() {
    await logout();
    router.replace('/login');
  }

  const primeiroNome = usuario?.nome?.split(' ')[0] || '';

  return (
    <div className="min-h-screen bg-fundo" data-testid="home-page">
      {/* Header */}
      <header className="sticky top-0 z-20 px-5 pt-5 pb-4 bg-fundo/80 backdrop-blur-xl border-b border-white/[0.04]" data-testid="home-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-texto">
              Olá, {primeiroNome} 👋
            </h1>
            <p className="text-[10px] text-texto/30 uppercase tracking-[0.15em] mt-0.5">Brasileirão 2026</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/minha-conta')}
              aria-label="Minha conta"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primaria/15 text-primaria text-sm font-bold shadow-[0_0_12px_rgba(22,163,74,0.15)] hover:shadow-[0_0_18px_rgba(22,163,74,0.25)] transition-all"
              data-testid="home-btn-conta"
            >
              {usuario ? obterIniciais(usuario.nome) : 'U'}
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={aoSair}
              aria-label="Sair"
              className="text-texto/30 hover:text-texto/60 h-9 w-9"
              data-testid="home-btn-logout"
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </header>

      {/* Feed */}
      <div className="mx-auto max-w-[480px] px-4 pt-4 pb-6 space-y-4">
        {/* Card principal — Próximo jogo */}
        <CardProximoJogo
          timeCasa={{
            nome: 'Flamengo',
            sigla: 'FLA',
            escudo: 'https://s.sde.globo.com/media/organizations/2018/04/10/Flamengo-2018.svg',
          }}
          timeFora={{
            nome: 'Corinthians',
            sigla: 'COR',
            escudo: 'https://s.sde.globo.com/media/organizations/2024/10/09/Corinthians_2024_Q4ahot4.svg',
          }}
          dataHora={proximaData(3)}
          totalPalpites={14}
          jaPalpitou={false}
        />

        {/* Meus grupos */}
        <CardMeusGrupos
          carregando={carregandoGrupos}
          grupos={(grupos ?? []).map((g) => ({
            id: g.id,
            nome: g.nome,
            participantes: g.totalParticipantes ?? 0,
            palpitesRestantes: g.palpitesRestantes,
          }))}
          grupoFavoritoId={usuario?.grupoFavoritoId}
          onDefinirFavorito={(grupoId) => mutationFavorito.mutate(grupoId)}
        />

        {/* Ranking */}
        <CardRanking ranking={mockRanking} />

        {/* Próximos jogos (lista compacta) */}
        <CardProximosJogos jogos={mockProximosJogos} />
      </div>
    </div>
  );
}
