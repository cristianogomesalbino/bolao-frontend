'use client';

import { useEffect, useState } from 'react';
import { buscarDestaquesGrupo } from '@/services/destaques.service';
import type { DestaqueItem, DadosNaoPalpitou, JogoEsquecido, JogoPlacar } from '@/types/destaques.types';
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

  useEffect(() => {
    setCarregando(true);
    buscarDestaquesGrupo(grupoId, rodadaSelecionada ?? undefined)
      .then((res) => {
        setDestaques(agruparEsquecidos(agruparAcertosEmCheio(res.destaques)));
        setRodadas(res.rodadasDisponiveis ?? []);
      })
      .catch(() => setDestaques([]))
      .finally(() => setCarregando(false));
  }, [grupoId, rodadaSelecionada]);

  if (!carregando && destaques.length === 0 && rodadas.length === 0) return null;

  return (
    <div data-testid="destaque-carousel" className="px-4 py-2">
      {mostrarAvisoGrupoFavorito && grupoNome && (
        <p className="mb-1 text-xs text-gray-400">
          Grupo favorito: {grupoNome}. Para ver outros, acesse o grupo desejado.
        </p>
      )}
      {rodadas.length > 0 && (
        <label className="mb-2 flex items-center gap-2 text-xs text-texto/60">
          Rodada temporária
          <select
            className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-texto"
            value={rodadaSelecionada ?? ''}
            onChange={(e) => {
              const valor = e.target.value;
              setRodadaSelecionada(valor ? Number(valor) : null);
            }}
          >
            <option value="">Atual</option>
            {rodadas.map((rodada) => (
              <option key={rodada} value={rodada}>
                Rodada {rodada}
              </option>
            ))}
          </select>
        </label>
      )}
      {carregando ? (
        <div className="mx-auto h-[46vh] max-h-[440px] min-h-[300px] w-[90%] animate-pulse rounded-2xl bg-white/5" />
      ) : (
        destaques.length > 0 && (
          <DestaqueViewer
            key={rodadaSelecionada ?? 'atual'}
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

function agruparAcertosEmCheio(destaques: DestaqueItem[]): DestaqueItem[] {
  const jaAgrupados = new Set<string>();
  const resultado: DestaqueItem[] = [];

  for (const item of destaques) {
    const chave = chavePessoaRodada(item);
    if (item.tipo !== 'ACERTOU_EM_CHEIO') {
      resultado.push(item);
      continue;
    }
    if (jaAgrupados.has(chave)) continue;
    jaAgrupados.add(chave);

    const acertos = destaques.filter(
      (outro) => outro.tipo === 'ACERTOU_EM_CHEIO' && chavePessoaRodada(outro) === chave,
    );
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
