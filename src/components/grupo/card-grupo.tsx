'use client';

import { useRouter } from 'next/navigation';
import { Users, Lock, Globe, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Grupo } from '@/types/grupo.types';

interface PropsCardGrupo {
  grupo: Grupo;
  participantes?: number;
  palpitesRestantes?: number;
}

export function CardGrupo({ grupo, participantes, palpitesRestantes }: Readonly<PropsCardGrupo>) {
  const router = useRouter();

  return (
    <Card
      className="cursor-pointer hover:border-white/[0.15] hover:shadow-[0_0_15px_rgba(22,163,74,0.05)] transition-all active:scale-[0.98]"
      data-testid={`grupo-item-${grupo.id}`}
      onClick={() => router.push(`/grupos/${grupo.id}`)}
    >
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-texto group-hover:text-texto">{grupo.nome}</span>
            {grupo.privado ? (
              <Lock size={11} className="text-texto/25" />
            ) : (
              <Globe size={11} className="text-texto/25" />
            )}
            {!grupo.ativo && (
              <span className="text-[9px] text-erro/70 bg-erro/10 px-1.5 py-0.5 rounded-full uppercase">
                Inativo
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex items-center gap-1 text-texto/30">
              <Users size={11} />
              <span className="text-[11px]">{participantes ?? grupo.maxParticipantes} participantes</span>
            </div>
            {palpitesRestantes !== undefined && palpitesRestantes > 0 && (
              <>
                <span className="text-texto/15">•</span>
                <span className="text-[11px] text-destaque/60">{palpitesRestantes} palpites restantes</span>
              </>
            )}
          </div>
        </div>
        <ChevronRight size={16} className="text-texto/15 group-hover:text-texto/40 transition-colors ml-2" />
      </CardContent>
    </Card>
  );
}
