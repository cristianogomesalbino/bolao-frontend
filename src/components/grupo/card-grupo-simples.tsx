'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, Lock, Globe, Users, Star } from 'lucide-react';
import { Grupo } from '@/types/grupo.types';

interface PropsCardGrupoSimples {
  grupo: Grupo;
  ehFavorito?: boolean;
  mostrarEstrela?: boolean;
  onDefinirFavorito?: (grupoId: string) => void;
}

export function CardGrupoSimples({ grupo, ehFavorito, mostrarEstrela, onDefinirFavorito }: Readonly<PropsCardGrupoSimples>) {
  const router = useRouter();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => router.push(`/grupos/${grupo.id}`)}
        className="w-full text-left rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 cursor-pointer transition-all hover:bg-white/[0.05] active:scale-[0.98]"
        data-testid={`grupo-item-${grupo.id}`}
      >
        <div className="flex items-center gap-3">
          {/* Ícone */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primaria/30 bg-primaria/[0.1] shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-primaria">
              <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 2.5C12 2.5 14.5 6 14.5 8.5C14.5 11 12 12 12 12C12 12 9.5 11 9.5 8.5C9.5 6 12 2.5 12 2.5Z" stroke="currentColor" strokeWidth="1" />
              <path d="M3.5 9C3.5 9 7.5 9.5 9.5 11C11.5 12.5 12 14.5 12 14.5" stroke="currentColor" strokeWidth="1" />
              <path d="M20.5 9C20.5 9 16.5 9.5 14.5 11C12.5 12.5 12 14.5 12 14.5" stroke="currentColor" strokeWidth="1" />
              <path d="M5 19C5 19 8 16.5 10 16C12 15.5 12 15.5 12 15.5" stroke="currentColor" strokeWidth="1" />
              <path d="M19 19C19 19 16 16.5 14 16C12 15.5 12 15.5 12 15.5" stroke="currentColor" strokeWidth="1" />
            </svg>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-texto truncate">{grupo.nome}</span>
              {grupo.privado ? (
                <Lock size={12} className="text-texto/30 shrink-0" />
              ) : (
                <Globe size={12} className="text-texto/30 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-texto/40">
              <Users size={12} />
              <span className="text-[11px]">{grupo.totalParticipantes ?? 0} participantes</span>
            </div>
            {grupo.meuRole && (
              <span className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded border ${
                grupo.meuRole === 'ADMIN'
                  ? 'text-destaque/70 bg-destaque/10 border-destaque/20'
                  : 'text-texto/50 bg-white/[0.04] border-white/[0.08]'
              }`}>
                {grupo.meuRole === 'ADMIN' ? 'Administrador' : 'Membro'}
              </span>
            )}
          </div>

          {/* Chevron */}
          <ChevronRight size={18} className="text-texto/25 shrink-0" />
        </div>
      </button>

      {/* Estrela de favorito */}
      {mostrarEstrela && onDefinirFavorito && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!ehFavorito) onDefinirFavorito(grupo.id);
          }}
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/[0.06] transition-colors z-10"
          aria-label={ehFavorito ? 'Grupo favorito' : 'Definir como favorito'}
        >
          <Star
            size={22}
            className={`transition-colors ${
              ehFavorito
                ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]'
                : 'text-texto/25 hover:text-yellow-400/60'
            }`}
          />
        </button>
      )}
    </div>
  );
}
