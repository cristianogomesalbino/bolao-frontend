'use client';

import { useRouter } from 'next/navigation';
import { Users, Lock, Globe, ChevronRight, Calendar } from 'lucide-react';
import { Grupo } from '@/types/grupo.types';

interface PropsCardGrupo {
  grupo: Grupo;
  participantes?: number;
  rodada?: number;
  palpitesRestantes?: number;
  rodadaAberta?: boolean;
}

function IconeGrupo({ privado }: { privado: boolean }) {
  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
      privado
        ? 'border-destaque/30 bg-destaque/[0.08]'
        : 'border-primaria/30 bg-primaria/[0.08]'
    }`}>
      {privado ? (
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-destaque" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-primaria" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </div>
  );
}

export function CardGrupo({ grupo, participantes, rodada, palpitesRestantes, rodadaAberta }: Readonly<PropsCardGrupo>) {
  const router = useRouter();

  return (
    <div
      className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-4 cursor-pointer hover:border-primaria/30 hover:bg-white/[0.05] transition-all active:scale-[0.98]"
      data-testid={`grupo-item-${grupo.id}`}
      onClick={() => router.push(`/grupos/${grupo.id}`)}
    >
      {/* Linha principal */}
      <div className="flex items-center gap-3">
        <IconeGrupo privado={grupo.privado} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-texto truncate">{grupo.nome}</span>
            {grupo.privado ? (
              <Lock size={12} className="text-texto/30 flex-shrink-0" />
            ) : (
              <Globe size={12} className="text-texto/30 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-texto/40">
            <Users size={12} />
            <span className="text-[11px]">{participantes ?? grupo.maxParticipantes} participantes</span>
            {rodada && (
              <>
                <span className="text-texto/20">•</span>
                <Calendar size={11} />
                <span className="text-[11px]">Rodada {rodada}</span>
              </>
            )}
          </div>
        </div>

        <ChevronRight size={18} className="text-texto/25 flex-shrink-0" />
      </div>

      {/* Linha de status */}
      {(rodadaAberta !== undefined || (palpitesRestantes !== undefined && palpitesRestantes > 0)) && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
          {rodadaAberta && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primaria animate-pulse" />
              <span className="text-[11px] text-primaria/80 font-medium">Rodada aberta</span>
            </div>
          )}
          {palpitesRestantes !== undefined && palpitesRestantes > 0 && (
            <span className="text-[10px] text-primaria bg-primaria/[0.1] border border-primaria/20 px-2.5 py-1 rounded-md font-medium">
              {palpitesRestantes} palpites restantes
            </span>
          )}
        </div>
      )}
    </div>
  );
}
