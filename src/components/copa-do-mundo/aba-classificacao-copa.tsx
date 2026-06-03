'use client';

import { useQuery } from '@tanstack/react-query';
import { listarFases, listarJogosFase } from '@/services/jogo.service';
import { TabelaGrupoCopa } from './tabela-grupo-copa';

interface PropsAbaClassificacaoCopa {
  temporadaId: string;
}

export function AbaClassificacaoCopa({ temporadaId }: Readonly<PropsAbaClassificacaoCopa>) {
  const { data: fases, isLoading: carregandoFases } = useQuery({
    queryKey: ['fases-copa', temporadaId],
    queryFn: () => listarFases(temporadaId),
    enabled: !!temporadaId,
  });

  const fasesGrupos = fases?.filter((f) => f.tipo === 'PONTOS_CORRIDOS') ?? [];

  const { data: jogosPorGrupo, isLoading: carregandoJogos } = useQuery({
    queryKey: ['jogos-copa-classificacao', fasesGrupos.map((f) => f.id).join(',')],
    queryFn: async () => {
      const resultados = await Promise.all(
        fasesGrupos.map(async (fase) => {
          try {
            const res = await listarJogosFase(fase.id);
            return { fase, jogos: res.jogos };
          } catch {
            return { fase, jogos: [] };
          }
        }),
      );
      return resultados;
    },
    enabled: fasesGrupos.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  if (carregandoFases || carregandoJogos) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-40 rounded-xl bg-[#009c3b]/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!jogosPorGrupo || jogosPorGrupo.length === 0) {
    return (
      <div className="rounded-xl border border-[#009c3b]/20 bg-[#009c3b]/[0.04] p-6 text-center">
        <p className="text-[11px] text-[#a8e6b0]/70">Classificação ainda não disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-base">⚽</span>
        <span className="text-[11px] text-[#ffdf00] uppercase tracking-wider font-bold">
          Fase de Grupos
        </span>
        <span className="text-[10px] text-[#a8e6b0]/50 ml-auto">
          {fasesGrupos.length} grupos
        </span>
      </div>

      {/* Tabelas dos 12 grupos */}
      {jogosPorGrupo.map(({ fase, jogos }) => (
        <TabelaGrupoCopa
          key={fase.id}
          nomeGrupo={fase.nome.replace('Fase de Grupos - ', '')}
          jogos={jogos}
        />
      ))}
    </div>
  );
}
