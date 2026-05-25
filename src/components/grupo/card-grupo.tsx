'use client';

import { useRouter } from 'next/navigation';
import { Users, Lock, Globe, ChevronRight, Calendar } from 'lucide-react';
import { Grupo } from '@/types/grupo.types';

interface PropsCardGrupo {
  grupo: Grupo;
  indice?: number;
}

function IconeGrupo({ privado, indice }: Readonly<{ privado: boolean; indice: number }>) {
  if (!privado && indice === 0) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primaria/30 bg-primaria/[0.1] shrink-0">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primaria">
          <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 2.5C12 2.5 14.5 6 14.5 8.5C14.5 11 12 12 12 12C12 12 9.5 11 9.5 8.5C9.5 6 12 2.5 12 2.5Z" stroke="currentColor" strokeWidth="1" />
          <path d="M3.5 9C3.5 9 7.5 9.5 9.5 11C11.5 12.5 12 14.5 12 14.5" stroke="currentColor" strokeWidth="1" />
          <path d="M20.5 9C20.5 9 16.5 9.5 14.5 11C12.5 12.5 12 14.5 12 14.5" stroke="currentColor" strokeWidth="1" />
          <path d="M5 19C5 19 8 16.5 10 16C12 15.5 12 15.5 12 15.5" stroke="currentColor" strokeWidth="1" />
          <path d="M19 19C19 19 16 16.5 14 16C12 15.5 12 15.5 12 15.5" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  if (privado) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-secundaria/30 bg-secundaria/[0.1] shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-secundaria">
          <path d="M12 3L4 7V12C4 16.4 7.4 20.5 12 21.5C16.6 20.5 20 16.4 20 12V7L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M12 8L13.5 11H16.5L14 13L15 16L12 14L9 16L10 13L7.5 11H10.5L12 8Z" fill="currentColor" opacity="0.6" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-destaque/30 bg-destaque/[0.1] shrink-0">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-destaque">
        <path d="M8 2H16V5C16 8.3 14.2 11 12 11C9.8 11 8 8.3 8 5V2Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4H5C5 4 4 4 4 5.5C4 7 5 8 6.5 8H8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 4H19C19 4 20 4 20 5.5C20 7 19 8 17.5 8H16" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 11V13H14V11" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 13H15V14C15 14 15 15 12 15C9 15 9 14 9 14V13Z" stroke="currentColor" strokeWidth="1.5" />
        <rect x="8" y="15" width="8" height="2" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function StatusRodada({ grupo, temPalpitesPendentes, palpitesRestantes }: Readonly<{
  grupo: Grupo;
  temPalpitesPendentes: boolean;
  palpitesRestantes: number;
}>) {
  if (!grupo.ativo) {
    return (
      <>
        <span className="h-2 w-2 rounded-full bg-erro/60" />
        <span className="text-[11px] text-erro/70 font-medium">Inativo</span>
      </>
    );
  }

  if (grupo.rodadaAberta) {
    return (
      <>
        <span className="h-2 w-2 rounded-full bg-primaria animate-pulse" />
        <span className="text-[11px] text-primaria/80 font-medium">Rodada aberta</span>
      </>
    );
  }

  return <span className="text-[11px] text-texto/25">Rodada fechada</span>;
}

export function CardGrupo({ grupo, indice = 0 }: Readonly<PropsCardGrupo>) {
  const router = useRouter();

  const participantes = grupo.totalParticipantes ?? 0;
  const palpitesRestantes = grupo.palpitesRestantes ?? 0;
  const rodadaAtual = grupo.rodadaAtual;
  const rodadaAberta = grupo.rodadaAberta ?? false;
  const temPalpitesPendentes = palpitesRestantes > 0;

  function aoClicar() {
    router.push(`/grupos/${grupo.id}`);
  }

  return (
    <button
      type="button"
      className={`w-full text-left rounded-2xl border p-4 cursor-pointer transition-all active:scale-[0.98] animate-[fadeIn_0.3s_ease_forwards] opacity-0 ${
        temPalpitesPendentes
          ? 'border-primaria-claro/80 bg-primaria/[0.05] hover:border-primaria-claro shadow-[0_0_16px_rgba(34,211,94,0.15)]'
          : 'border-primaria-claro/40 bg-white/[0.02] hover:border-primaria-claro/60'
      }`}
      style={{ animationDelay: `${indice * 60}ms` }}
      data-testid={`grupo-item-${grupo.id}`}
      onClick={aoClicar}
    >
      {/* Linha principal */}
      <div className="flex items-center gap-3">
        <IconeGrupo privado={grupo.privado} indice={indice} />

        <div className="flex-1 min-w-0">
          {/* Nome + ícone público/privado */}
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-texto truncate">{grupo.nome}</span>
            {grupo.privado ? (
              <Lock size={12} className="text-texto/30 shrink-0" />
            ) : (
              <Globe size={12} className="text-texto/30 shrink-0" />
            )}
          </div>

          {/* Participantes + Rodada */}
          <div className="flex items-center gap-1.5 mt-1 text-texto/40">
            <Users size={12} />
            <span className="text-[11px]">{participantes} participantes</span>
            {rodadaAtual !== undefined && (
              <>
                <span className="text-texto/20 mx-0.5">•</span>
                <Calendar size={11} />
                <span className="text-[11px]">Rodada {rodadaAtual}</span>
              </>
            )}
          </div>
        </div>

        {/* Chevron */}
        <ChevronRight size={18} className="text-texto/25 shrink-0" />
      </div>

      {/* Footer: status da rodada + palpites restantes */}
      {(rodadaAberta || temPalpitesPendentes || !grupo.ativo) && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
          <div className="flex items-center gap-1.5">
            <StatusRodada grupo={grupo} temPalpitesPendentes={temPalpitesPendentes} palpitesRestantes={palpitesRestantes} />
          </div>

          {temPalpitesPendentes && grupo.ativo && (
            <span className="text-[11px] font-medium text-primaria bg-primaria/[0.08] border border-primaria/20 px-2.5 py-0.5 rounded-md">
              {palpitesRestantes} palpites restantes
            </span>
          )}
        </div>
      )}
    </button>
  );
}
