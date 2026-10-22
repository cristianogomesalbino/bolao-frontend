'use client';

import { useState } from 'react';
import { mandarF } from '@/services/destaques.service';
import { DESTAQUE_CONFIG } from '@/types/destaques.types';
import type {
  DestaqueItem,
  DadosAcertouEmCheio,
  JogoPlacar,
  DadosUnicoNaMosca,
  DadosSubiuRanking,
  DadosSequenciaResultado,
  DadosNaoPalpitou,
  DadosDobrouEAcertou,
} from '@/types/destaques.types';

const PASTA_FUNDOS = '/destaques/fundos';

const FUNDOS_POR_TIPO: Record<string, readonly string[]> = {
  ACERTOU_EM_CHEIO: ['fundo-01.webp', 'fundo-08.webp', 'fundo-12.webp', 'fundo-15.webp'],
  UNICO_NA_MOSCA: ['fundo-02.webp', 'fundo-10.webp'],
  SUBIU_RANKING: ['fundo-03.webp', 'fundo-11.webp', 'fundo-19.webp'],
  SEQUENCIA_RESULTADO: ['fundo-07.webp', 'fundo-14.webp', 'fundo-16.webp', 'fundo-20.webp', 'fundo-21.webp'],
  NAO_PALPITOU: ['fundo-05.webp', 'fundo-17.webp'],
  DOBROU_E_ACERTOU: ['fundo-06.webp', 'fundo-09.webp'],
};

function escolherFundo(tipo: string, id: string): string | undefined {
  const lista = FUNDOS_POR_TIPO[tipo];
  if (!lista?.length) return undefined;
  let soma = 0;
  for (let i = 0; i < id.length; i++) soma += id.charCodeAt(i);
  return `${PASTA_FUNDOS}/${lista[soma % lista.length]}`;
}

const LEGENDA: Record<string, string> = {
  ACERTOU_EM_CHEIO: 'Acertou em cheio',
  UNICO_NA_MOSCA: 'Único na mosca',
  SUBIU_RANKING: 'Subiu no ranking',
  SEQUENCIA_RESULTADO: 'Sequência de pontuação',
  NAO_PALPITOU: 'Não palpitou',
  DOBROU_E_ACERTOU: 'Dobrou e acertou',
};

interface DestaqueCardProps {
  readonly destaque: DestaqueItem;
  readonly grupoId: string;
  readonly preencher?: boolean;
}

export function DestaqueCard({ destaque, grupoId, preencher = false }: DestaqueCardProps) {
  const config = DESTAQUE_CONFIG[destaque.tipo];
  const fundo = escolherFundo(destaque.tipo, destaque.id);
  const inicial = destaque.autor.nome.charAt(0).toUpperCase();

  return (
    <div
      className={`relative overflow-hidden text-white ${
        preencher ? 'h-full w-full' : 'aspect-[9/16] w-full max-w-sm rounded-2xl'
      }`}
      style={{
        backgroundColor: '#111827',
        backgroundImage: fundo
          ? `linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.62) 45%, rgba(0,0,0,0.82) 100%), url(${fundo})`
          : `linear-gradient(160deg, ${config.cor} 0%, #111827 70%)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      data-testid={`destaque-card-${destaque.tipo}`}
    >
      <div className={`flex h-full flex-col ${preencher ? 'px-5 pb-3 pt-3' : 'px-6 pb-5 pt-8'}`}>
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold ring-2 ring-white/80"
            style={{ backgroundColor: config.cor }}
          >
            {inicial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">{destaque.autor.nome}</p>
            <p className="truncate text-[11px] text-white/70">{LEGENDA[destaque.tipo]}</p>
          </div>
        </div>

        {destaque.tipo === 'NAO_PALPITOU' ? (
          <CardNaoPalpitou destaque={destaque} grupoId={grupoId} emoji={config.emoji} />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden py-1 text-center">
            <p className="mb-1 text-3xl" aria-hidden>
              {config.emoji}
            </p>
            <h2 className="max-w-[16rem] text-3xl font-black uppercase leading-none tracking-tight">
              {destaque.titulo}
            </h2>
            <div className="mt-3 w-full">{renderConteudo(destaque, grupoId)}</div>
          </div>
        )}

        {rotuloRodada(destaque) && (
          <p className="text-center text-[11px] text-white/70">{rotuloRodada(destaque)}</p>
        )}
      </div>
    </div>
  );
}

function renderConteudo(destaque: DestaqueItem, grupoId: string) {
  switch (destaque.tipo) {
    case 'ACERTOU_EM_CHEIO':
      return <PlacaresAcerto dados={destaque.dados as unknown as DadosAcertouEmCheio} />;
    case 'UNICO_NA_MOSCA':
      return <Placar dados={destaque.dados as unknown as DadosUnicoNaMosca} />;
    case 'SUBIU_RANKING':
      return <CardSubiuRanking dados={destaque.dados as unknown as DadosSubiuRanking} />;
    case 'SEQUENCIA_RESULTADO':
      return <CardSequenciaResultado dados={destaque.dados as unknown as DadosSequenciaResultado} />;
    case 'NAO_PALPITOU':
      return null;
    case 'DOBROU_E_ACERTOU':
      return <CardDobrou dados={destaque.dados as unknown as DadosDobrouEAcertou} />;
    default:
      return null;
  }
}

function Placar({ dados }: { readonly dados: JogoPlacar }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="shrink-0 text-sm font-semibold">{dados.timeCasa.sigla}</span>
      <span className="text-4xl font-black tabular-nums">
        {dados.golsCasa} × {dados.golsFora}
      </span>
      <span className="shrink-0 text-sm font-semibold">{dados.timeFora.sigla}</span>
    </div>
  );
}

function PlacaresAcerto({ dados }: { readonly dados: DadosAcertouEmCheio }) {
  const jogos = dados.jogos?.length ? dados.jogos : [dados];
  if (jogos.length === 1) return <Placar dados={jogos[0]} />;

  return (
    <div className="mx-auto max-w-[240px] space-y-1">
      {jogos.map((jogo, indice) => (
        <div
          key={jogo.jogoId ?? `${jogo.timeCasa.sigla}-${jogo.timeFora.sigla}-${indice}`}
          className="flex items-center justify-between gap-2 text-sm"
        >
          <span className="min-w-[3.5rem] shrink-0 text-right font-semibold">{jogo.timeCasa.sigla}</span>
          <span className="text-xl font-black tabular-nums">
            {jogo.golsCasa} × {jogo.golsFora}
          </span>
          <span className="min-w-[3.5rem] shrink-0 text-left font-semibold">{jogo.timeFora.sigla}</span>
        </div>
      ))}
    </div>
  );
}

function CardSubiuRanking({ dados }: { readonly dados: DadosSubiuRanking }) {
  return (
    <div>
      <p className="text-5xl font-black leading-none">#{dados.posicaoNova}</p>
      <p className="mt-1 text-xs text-white/70">
        era #{dados.posicaoAnterior}
      </p>
      <div className="mx-auto mt-3 max-w-[220px] space-y-0.5 text-left">
        {dados.top5.slice(0, 5).map((m) => (
          <div key={m.posicao} className="flex justify-between text-[11px] text-white/80">
            <span className="truncate">
              #{m.posicao} {m.nome}
            </span>
            <span className="ml-2 shrink-0">{m.pontuacao} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function rotuloRodada(destaque: DestaqueItem): string | null {
  if (destaque.tipo === 'SEQUENCIA_RESULTADO') {
    const dados = destaque.dados as unknown as DadosSequenciaResultado;
    const inicio = dados.rodadaInicio;
    const fim = dados.rodadaFim ?? destaque.rodada;
    if (inicio != null && fim != null && inicio !== fim) {
      const de = Math.min(inicio, fim);
      const ate = Math.max(inicio, fim);
      return `Rodadas ${de} a ${ate}`;
    }
  }
  return destaque.rodada != null ? `Rodada ${destaque.rodada}` : null;
}

function CardSequenciaResultado({ dados }: { readonly dados: DadosSequenciaResultado }) {
  return (
    <div>
      <p className="text-5xl font-black leading-none text-orange-300">{dados.quantidadeAcertos}</p>
      <p className="mt-1 text-sm text-white/80">jogos seguidos pontuando</p>
      {typeof dados.pontos === 'number' && (
        <p className="mt-1 text-lg font-bold text-white">+{dados.pontos} pontos</p>
      )}
      {dados.recorde.ehNovoRecorde && (
        <p className="mt-2 text-xs font-semibold text-yellow-300">Novo recorde</p>
      )}
    </div>
  );
}

function CardNaoPalpitou({
  destaque,
  grupoId,
  emoji,
}: {
  readonly destaque: DestaqueItem;
  readonly grupoId: string;
  readonly emoji: string;
}) {
  const dados = destaque.dados as unknown as DadosNaoPalpitou;
  const jogos = dados.jogosEsquecidos ?? [];
  const meio = Math.ceil(jogos.length / 2);
  const esquerda = jogos.slice(0, meio);
  const direita = jogos.slice(meio);
  const [jaEnviou, setJaEnviou] = useState(destaque.jaEnviouF);
  const [contador, setContador] = useState(destaque.contadorFs);
  const [enviando, setEnviando] = useState(false);

  async function handleMandarF() {
    if (jaEnviou || enviando) return;
    setEnviando(true);
    try {
      const res = await mandarF(grupoId, destaque.id);
      setContador(res.contadorFs);
      setJaEnviou(true);
    } catch {
      // Mantém o estado original se a reação falhar.
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-2 text-center">
      <p className="mb-1 text-3xl" aria-hidden>
        {emoji}
      </p>
      <h2 className="max-w-[16rem] text-3xl font-black uppercase leading-none tracking-tight">
        {destaque.titulo}
      </h2>
      <div className="mt-3 grid w-full grid-cols-2 gap-x-3">
        <ListaLateral jogos={esquerda} alinhamento="left" />
        <ListaLateral jogos={direita} alinhamento="right" />
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void handleMandarF();
        }}
        disabled={jaEnviou || enviando}
        className="mt-3 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:bg-white/20"
        data-interactive
      >
        {jaEnviou ? 'Você já mandou um F' : `Mandar um F (${contador})`}
      </button>
    </div>
  );
}

function ListaLateral({
  jogos,
  alinhamento,
}: {
  readonly jogos: DadosNaoPalpitou['jogosEsquecidos'];
  readonly alinhamento: 'left' | 'right';
}) {
  return (
    <div
      className={`flex flex-col gap-0.5 text-xs leading-tight text-white/75 ${
        alinhamento === 'right' ? 'items-end text-right' : 'items-start text-left'
      }`}
    >
      {jogos.map((jogo) => (
        <p key={jogo.jogoId} className="max-w-full truncate">
          {jogo.timeCasa.sigla} {jogo.golsCasa ?? '?'} × {jogo.golsFora ?? '?'} {jogo.timeFora.sigla}
        </p>
      ))}
    </div>
  );
}

function CardDobrou({ dados }: { readonly dados: DadosDobrouEAcertou }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-3">
        <span className="text-sm font-semibold">{dados.timeCasa.sigla}</span>
        <span className="text-4xl font-black tabular-nums">
          {dados.golsCasa} × {dados.golsFora}
        </span>
        <span className="text-sm font-semibold">{dados.timeFora.sigla}</span>
      </div>
      <p className="mt-2 text-lg font-bold text-amber-300">+{dados.pontosObtidos} pontos</p>
    </div>
  );
}
