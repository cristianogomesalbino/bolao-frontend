'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Users, ChevronRight, Star } from 'lucide-react';

interface GrupoHome {
  id: string;
  nome: string;
  icone?: string | null;
  participantes: number;
  ehFavorito?: boolean;
}

interface PropsCardMeusGrupos {
  grupos: GrupoHome[];
  carregando?: boolean;
}

const ICONES_GRUPO: Record<string, string> = {
  bola: '⚽',
  trofeu: '🏆',
  coroa: '👑',
  chuteira: '👟',
  medalha: '🥇',
  bandeira: '🏁',
  estrela: '⭐',
  campo: '🏟️',
  luva: '🧤',
  apito: '📣',
  escudo: '🛡️',
  fogo: '🔥',
};

function obterEmojiGrupo(icone: string | null | undefined): string {
  if (!icone) return '⚽';
  return ICONES_GRUPO[icone] ?? '⚽';
}

export function CardMeusGrupos({ grupos, carregando }: Readonly<PropsCardMeusGrupos>) {
  const router = useRouter();

  return (
    <Card data-testid="home-card-meus-grupos" className="border-primaria shadow-[0_0_20px_rgba(22,163,74,0.2)]">
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primaria/15">
              <Users size={14} className="text-primaria" />
            </div>
            <span className="text-xs text-texto font-bold uppercase tracking-wider">
              Meus grupos
            </span>
          </div>
          <button
            onClick={() => router.push('/grupos')}
            className="text-[11px] text-primaria-claro font-medium hover:text-primaria transition-colors"
            data-testid="home-ver-todos-grupos"
          >
            Ver todos <ChevronRight size={14} className="inline" />
          </button>
        </div>

        {/* Loading */}
        {carregando && (
          <div className="space-y-1 py-1">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        )}

        {/* Vazio */}
        {!carregando && grupos.length === 0 && (
          <p className="text-sm text-texto/40 text-center py-4">
            Você ainda não participa de nenhum grupo
          </p>
        )}

        {/* Lista */}
        {!carregando && grupos.length > 0 && (
          <div>
            {grupos.map((grupo, index) => (
              <button
                key={grupo.id}
                onClick={() => router.push(`/grupos/${grupo.id}`)}
                className={`w-full flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-white/[0.04] transition-colors text-left group ${
                  index < grupos.length - 1 ? 'border-b border-white/[0.04]' : ''
                }`}
                data-testid={`home-grupo-${grupo.id}`}
              >
                {/* Ícone do grupo */}
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.1] shrink-0">
                  <span className="text-lg">{obterEmojiGrupo(grupo.icone)}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-texto font-bold truncate group-hover:text-primaria-claro transition-colors">
                      {grupo.nome}
                    </span>
                    {grupo.ehFavorito && (
                      <Star size={12} className="text-yellow-400 fill-yellow-400 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-texto/40">
                    <Users size={11} />
                    <span className="text-[11px]">{grupo.participantes} membros</span>
                  </div>
                </div>

                {/* Chevron */}
                <ChevronRight size={18} className="text-texto/20 group-hover:text-texto/50 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
