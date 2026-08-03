'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { buscarDadosTemporada } from '@/services/jogo.service';

interface PropsAlertaJogosAtrasados {
  temporadaId: string;
  grupoId: string;
}

export function AlertaJogosAtrasados({ temporadaId, grupoId }: Readonly<PropsAlertaJogosAtrasados>) {
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ['dados-temporada', temporadaId],
    queryFn: () => buscarDadosTemporada(temporadaId),
    staleTime: 1000 * 60 * 5,
  });

  const totalAdiados = data?.totalAdiados ?? 0;

  if (totalAdiados === 0) return null;

  return (
    <button
      type="button"
      onClick={() => router.push(`/grupos/${grupoId}/jogos-adiados`)}
      className="w-full flex items-center gap-2 mb-3 py-2 px-3 rounded-lg bg-destaque/[0.06] border border-destaque/20"
      data-tour="alerta-jogos-atrasados"
    >
      <span className="text-destaque text-sm">⏱</span>
      <span className="text-[12px] text-destaque font-semibold flex-1 text-left">
        {totalAdiados === 1 ? 'Há 1 jogo atrasado' : `Há ${totalAdiados} jogos atrasados`}
      </span>
      <span className="text-[11px] text-primaria-claro font-medium flex items-center gap-0.5">
        Ver <ChevronRight size={10} />
      </span>
    </button>
  );
}
