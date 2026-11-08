'use client';

import { useEffect, useState } from 'react';
import { buscarDestaquesGrupo } from '@/services/destaques.service';
import type {
  DestaqueItem,
  DadosAcertouEmCheio,
  DadosNaoPalpitou,
  JogoEsquecido,
  JogoPlacar,
} from '@/types/destaques.types';
import { DestaqueViewer } from './destaque-viewer';

interface DestaqueCarouselProps {
  readonly grupoId: string;
  readonly grupoNome?: string;
  readonly mostrarAvisoGrupoFavorito?: boolean;
}

export function DestaqueCarousel({
  grupoId,
  grupoNome,
  mostrarAvisoGrupoFavorito = false,
}: DestaqueCarouselProps) {
  const [destaques, setDestaques] = useState<DestaqueItem[]>([]);
  const [rodadas, setRodadas] = useState<number[]>([]);
  const [rodadaSelecionada, setRodadaSelecionada] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);

  const rodadasFiltro = rodadas.slice(0, 2);
  const rodadaAtiva = rodadaSelecionada ?? rodadasFiltro[0] ?? null;

  useEffect(() => {
    setCarregando(true);
    buscarDestaquesGrupo(grupoId, rodadaAtiva ?? undefined)
      .then((res) => {
        setDestaques(
          agruparSequencias(agruparEsquecidos(agruparAcertosEmCheio(res.destaques))),
        );
        const disponiveis = res.rodadasDisponiveis ?? [];
        setRodadas(disponiveis);
        setRodadaSelecionada((atual) => {
          const opcoes = disponiveis.slice(0, 2);
          if (opcoes.length === 0) return null;
          if (atual != null && opcoes.includes(atual)) return atual;
          return opcoes[0];
        });
      })
      .catch(() => setDestaques([]))
      .finally(() => setCarregando(false));
  }, [grupoId, rodadaAtiva]);

  if (!carregando && destaques.length === 0 && rodadasFiltro.length === 0) return null;

  return (
    <div data-testid="destaque-carousel" className="px-4 py-2">
      {mostrarAvisoGrupoFavorito && grupoNome && (
        <p className="mb-1 text-xs text-gray-400">
          Grupo favorito: {grupoNome}. Para ver outros, acesse o grupo desejado.
        </p>
      )}
      {rodadasFiltro.length > 0 && (
        <div
          className="mb-1.5 flex items-center gap-1.5 text-[10px] text-texto/35"
          data-testid="destaque-filtro-rodada"
        >
          <span className="font-medium">Rodada</span>
          <div className="flex items-center gap-0.5 rounded-md bg-white/[0.04] p-0.5">
            {rodadasFiltro.map((rodada) => {
              const ativa = rodadaAtiva === rodada;
              return (
                <button
                  key={rodada}
                  type="button"
                  onClick={() => setRodadaSelecionada(rodada)}
                  className={`rounded px-1.5 py-0.5 transition-colors ${
                    ativa
                      ? 'bg-white/10 text-texto/70'
                      : 'text-texto/30 hover:text-texto/50'
                  }`}
                  data-testid={`destaque-filtro-rodada-${rodada}`}
                  aria-pressed={ativa}
                >
                  {rodada}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {carregando ? (
        <div className="mx-auto h-[46vh] max-h-[440px] min-h-[300px] w-[90%] animate-pulse rounded-2xl bg-white/5" />
      ) : (
        destaques.length > 0 && (
          <DestaqueViewer
            key={rodadaAtiva ?? 'atual'}
            destaques={destaques}
            grupoId={grupoId}
          />
        )
      )}
    </div>
  );
}

function chavePessoaRodada(item: DestaqueItem): string {
  return `${item.autor.usuarioId}:${item.rodada ?? 'sem-rodada'}`;
}

function agruparSequencias(destaques: DestaqueItem[]): DestaqueItem[] {
  const jaAgrupados = new Set<string>();
  const resultado: DestaqueItem[] = [];

  for (const item of destaques) {
    if (item.tipo !== 'SEQUENCIA_RESULTADO') {
      resultado.push(item);
      continue;
    }
    const chave = chavePessoaRodada(item);
    if (jaAgrupados.has(chave)) continue;
    jaAgrupados.add(chave);
    resultado.push(item);
  }

  return resultado;
}

function agruparAcertosEmCheio(destaques: DestaqueItem[]): DestaqueItem[] {
  const jaAgrupados = new Set<string>();
  const resultado: DestaqueItem[] = [];

  for (const item of destaques) {
    if (item.tipo !== 'ACERTOU_EM_CHEIO') {
      resultado.push(item);
      continue;
    }
    const dados = item.dados as unknown as DadosAcertouEmCheio;
    if ((dados.participantes?.length ?? 0) >= 3) {
      resultado.push(item);
      continue;
    }
    const chave = chavePessoaRodada(item);
    if (jaAgrupados.has(chave)) continue;
    jaAgrupados.add(chave);

    const acertos = destaques.filter((outro) => {
      if (outro.tipo !== 'ACERTOU_EM_CHEIO') return false;
      const dadosOutro = outro.dados as unknown as DadosAcertouEmCheio;
      if ((dadosOutro.participantes?.length ?? 0) >= 3) return false;
      return chavePessoaRodada(outro) === chave;
    });
    const jogos: JogoPlacar[] = acertos.map((acerto) => {
      const dados = acerto.dados as unknown as JogoPlacar;
      return {
        jogoId: acerto.jogoId,
        golsCasa: dados.golsCasa,
        golsFora: dados.golsFora,
        timeCasa: dados.timeCasa,
        timeFora: dados.timeFora,
      };
    });

    resultado.push({
      ...item,
      idsAgrupados: acertos.map((outro) => outro.id),
      dados: {
        ...(item.dados as unknown as JogoPlacar),
        ...(jogos.length > 1 ? { jogos } : {}),
      },
    });
  }

  return resultado;
}

function agruparEsquecidos(destaques: DestaqueItem[]): DestaqueItem[] {
  const jaAgrupados = new Set<string>();
  const resultado: DestaqueItem[] = [];

  for (const item of destaques) {
    if (item.tipo !== 'NAO_PALPITOU') {
      resultado.push(item);
      continue;
    }
    const chave = chavePessoaRodada(item);
    if (jaAgrupados.has(chave)) continue;
    jaAgrupados.add(chave);

    const esquecidos = destaques.filter(
      (outro) => outro.tipo === 'NAO_PALPITOU' && chavePessoaRodada(outro) === chave,
    );
    const vistos = new Set<string>();
    const jogosEsquecidos: JogoEsquecido[] = [];
    for (const outro of esquecidos) {
      const dados = outro.dados as unknown as DadosNaoPalpitou;
      for (const jogo of dados.jogosEsquecidos ?? []) {
        if (vistos.has(jogo.jogoId)) continue;
        vistos.add(jogo.jogoId);
        jogosEsquecidos.push(jogo);
      }
    }

    const base = item.dados as unknown as DadosNaoPalpitou;
    resultado.push({
      ...item,
      idsAgrupados: esquecidos.map((outro) => outro.id),
      jaEnviouF: esquecidos.some((outro) => outro.jaEnviouF),
      contadorFs: Math.max(...esquecidos.map((outro) => outro.contadorFs)),
      dados: {
        ...base,
        jogosEsquecidos,
        totalJogosRodada: Math.max(base.totalJogosRodada ?? 0, jogosEsquecidos.length),
      },
    });
  }

  return resultado;
}
