'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
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

// Mock data — será substituído por dados reais via TanStack Query
function proximaData(horas: number): string {
  const data = new Date();
  data.setHours(data.getHours() + horas);
  return data.toISOString();
}

const mockGrupos = [
  { id: '1', nome: 'Peladeiros FC', participantes: 12, palpitesRestantes: 5 },
  { id: '2', nome: 'Família Copa 2026', participantes: 8, palpitesRestantes: 0 },
];

const mockRanking = [
  { posicao: 1, nome: 'Lucas', pontos: 42 },
  { posicao: 2, nome: 'Cristiano', pontos: 38, destaque: true },
  { posicao: 3, nome: 'Mestre', pontos: 35 },
];

export default function InicioPage() {
  const router = useRouter();
  const usuario = useAuthStore((state) => state.usuario);
  const logout = useAuthStore((state) => state.logout);

  async function aoSair() {
    await logout();
    router.replace('/login');
  }

  const primeiroNome = usuario?.nome?.split(' ')[0] || '';

  return (
    <div className="min-h-screen bg-fundo">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-4 bg-fundo/80 backdrop-blur-lg border-b border-white/[0.05]">
        <div>
          <p className="text-base font-semibold text-texto">
            Olá, {primeiroNome} 👋
          </p>
          <p className="text-[11px] text-texto/35 uppercase tracking-wider">Brasileirão 2026</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/minha-conta')}
            aria-label="Minha conta"
            className="text-texto/60 hover:text-texto"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primaria/15 text-primaria text-xs font-bold">
              {usuario ? obterIniciais(usuario.nome) : <User size={16} />}
            </div>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={aoSair}
            aria-label="Sair"
            className="text-texto/40 hover:text-texto/70"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </header>

      {/* Feed de cards */}
      <div className="mx-auto max-w-[480px] px-4 py-5 space-y-4">
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

        <CardMeusGrupos grupos={mockGrupos} />

        <CardRanking ranking={mockRanking} />

        {/* Botão temporário de admin */}
        <Button
          variant="outline"
          className="w-full border-destaque/30 text-destaque/70 hover:bg-destaque/10 hover:text-destaque text-xs"
          onClick={() => router.push('/admin/importar')}
        >
          ⚙️ Importar jogos (admin temp)
        </Button>
      </div>
    </div>
  );
}
