'use client';

import { DESTAQUE_CONFIG } from '@/types/destaques.types';
import type {
  DestaqueItem,
  DadosAcertouEmCheio,
  JogoPlacar,
  DadosUnicoNaMosca,
  DadosSubiuRanking,
  DadosSequenciaResultado,
  DadosDobrouEAcertou,
} from '@/types/destaques.types';
import { CardNaoPalpitou } from './destaque-card-nao-palpitou';

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

function ehPanelinha(destaque: DestaqueItem): boolean {
  if (destaque.tipo !== 'ACERTOU_EM_CHEIO') return false;
  const dados = destaque.dados as unknown as DadosAcertouEmCheio;
  return (dados.participantes?.length ?? 0) >= 3;
}

function precisaLayoutCompacto(destaque: DestaqueItem): boolean {
  return ehPanelinha(destaque) || destaque.tipo === 'SUBIU_RANKING';
}

function legendaDoCard(destaque: DestaqueItem): string {
  if (ehPanelinha(destaque)) return 'Panelinha na mosca';
  return LEGENDA[destaque.tipo] ?? destaque.tipo;
}

interface DestaqueCardProps {
  readonly destaque: DestaqueItem;
  readonly grupoId: string;
  readonly preencher?: boolean;
}

export function DestaqueCard({ destaque, grupoId, preencher = false }: DestaqueCardProps) {
  const config = DESTAQUE_CONFIG[destaque.tipo];
  const fundo = escolherFundo(destaque.tipo, destaque.id);
  const inicial = destaque.autor.nome.charAt(0).toUpperCase();
  const panelinha = ehPanelinha(destaque);

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
      <div
        className={`flex h-full min-h-0 flex-col ${preencher ? 'px-5 pb-4 pt-6' : 'px-6 pb-5 pt-8'}`}
      >
        {!panelinha && (
          <div className="flex shrink-0 items-center gap-2.5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold ring-2 ring-white/80"
              style={{ backgroundColor: config.cor }}
            >
              {inicial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">{destaque.autor.nome}</p>
              <p className="truncate text-[11px] text-white/70">{legendaDoCard(destaque)}</p>
            </div>
          </div>
        )}

        {destaque.tipo === 'NAO_PALPITOU' ? (
          <CardNaoPalpitou
            destaque={destaque}
            grupoId={grupoId}
            emoji={config.emoji}
            compacto={preencher}
          />
        ) : (
          <div
            className={`flex min-h-0 flex-1 flex-col items-center overflow-hidden text-center ${
              destaque.tipo === 'SUBIU_RANKING'
                ? 'justify-start pt-1'
                : 'justify-center'
            }`}
          >
            <p
              className={`shrink-0 ${
                preencher || precisaLayoutCompacto(destaque)
                  ? 'text-2xl leading-none'
                  : 'mb-1 text-3xl'
              }`}
              aria-hidden
            >
              {config.emoji}
            </p>
            <h2
              className={`max-w-[16rem] shrink-0 font-black uppercase tracking-tight ${
                preencher || precisaLayoutCompacto(destaque)
                  ? 'text-[1.25rem] leading-[1.05]'
                  : 'text-3xl leading-none'
              }`}
            >
              {destaque.titulo}
            </h2>
            <div
              className={`flex min-h-0 w-full flex-col ${
                precisaLayoutCompacto(destaque)
                  ? 'mt-1.5'
                  : preencher
                    ? 'mt-2'
                    : 'mt-3'
              }`}
            >
              {renderConteudo(destaque, preencher)}
            </div>
          </div>
        )}

        <RodapeDestaque destaque={destaque} compacto={preencher} />
      </div>
    </div>
  );
}

function renderConteudo(destaque: DestaqueItem, compacto: boolean) {
  switch (destaque.tipo) {
    case 'ACERTOU_EM_CHEIO':
      return <PlacaresAcerto dados={destaque.dados as unknown as DadosAcertouEmCheio} />;
    case 'UNICO_NA_MOSCA':
      return <Placar dados={destaque.dados as unknown as DadosUnicoNaMosca} />;
    case 'SUBIU_RANKING':
      return (
        <CardSubiuRanking
          dados={destaque.dados as unknown as DadosSubiuRanking}
          compacto={compacto}
        />
      );
    case 'SEQUENCIA_RESULTADO':
      return (
        <CardSequenciaResultado
          dados={destaque.dados as unknown as DadosSequenciaResultado}
          compacto={compacto}
        />
      );
    case 'NAO_PALPITOU':
      return null;
    case 'DOBROU_E_ACERTOU':
      return <CardDobrou dados={destaque.dados as unknown as DadosDobrouEAcertou} />;
    default:
      return null;
  }
}

function Placar({
  dados,
  compacto = false,
}: {
  readonly dados: JogoPlacar;
  readonly compacto?: boolean;
}) {
  return (
    <div className={`flex items-center justify-center ${compacto ? 'gap-2' : 'gap-3'}`}>
      <span className={`shrink-0 font-semibold ${compacto ? 'text-xs' : 'text-sm'}`}>
        {dados.timeCasa.sigla}
      </span>
      <span
        className={`font-black tabular-nums ${compacto ? 'text-3xl leading-none' : 'text-4xl'}`}
      >
        {dados.golsCasa} × {dados.golsFora}
      </span>
      <span className={`shrink-0 font-semibold ${compacto ? 'text-xs' : 'text-sm'}`}>
        {dados.timeFora.sigla}
      </span>
    </div>
  );
}

function PlacaresAcerto({ dados }: { readonly dados: DadosAcertouEmCheio }) {
  const panelinha = dados.participantes?.length ? dados.participantes : null;
  if (panelinha) {
    const meio = Math.ceil(panelinha.length / 2);
    const esquerda = panelinha.slice(0, meio);
    const direita = panelinha.slice(meio);
    return (
      <div className="mx-auto w-full max-w-[280px] space-y-2">
        <Placar dados={dados} compacto />
        <div className="grid grid-cols-2 justify-items-center gap-x-3 gap-y-0.5 text-[11px] leading-snug text-white/85">
          <ul className="w-full min-w-0 space-y-0.5 text-center">
            {esquerda.map((pessoa) => (
              <li key={pessoa.usuarioId} className="truncate">
                {pessoa.nome}
              </li>
            ))}
          </ul>
          <ul className="w-full min-w-0 space-y-0.5 text-center">
            {direita.map((pessoa) => (
              <li key={pessoa.usuarioId} className="truncate">
                {pessoa.nome}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

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

function CardSubiuRanking({
  dados,
  compacto = false,
}: {
  readonly dados: DadosSubiuRanking;
  readonly compacto?: boolean;
}) {
  const top5 = dados.top5.slice(0, 5);
  const meio = Math.ceil(top5.length / 2);
  const esquerda = top5.slice(0, meio);
  const direita = top5.slice(meio);

  return (
    <div className="mx-auto w-full max-w-[300px] space-y-1.5">
      <div>
        <p
          className={`font-black leading-none ${compacto ? 'text-3xl' : 'text-4xl'}`}
        >
          #{dados.posicaoNova}
        </p>
        <p className="mt-0.5 text-[11px] text-white/70">
          era #{dados.posicaoAnterior}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs leading-snug text-white/85">
        <ul className="min-w-0 space-y-1">
          {esquerda.map((m) => (
            <li key={m.posicao} className="flex min-w-0 items-baseline gap-1">
              <span className="min-w-0 flex-1 truncate text-left">
                #{m.posicao} {m.nome}
              </span>
              <span className="shrink-0 tabular-nums text-white/70">{m.pontuacao}</span>
            </li>
          ))}
        </ul>
        <ul className="min-w-0 space-y-1">
          {direita.map((m) => (
            <li key={m.posicao} className="flex min-w-0 items-baseline gap-1">
              <span className="min-w-0 flex-1 truncate text-left">
                #{m.posicao} {m.nome}
              </span>
              <span className="shrink-0 tabular-nums text-white/70">{m.pontuacao}</span>
            </li>
          ))}
        </ul>
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

function RodapeDestaque({
  destaque,
  compacto,
}: {
  readonly destaque: DestaqueItem;
  readonly compacto: boolean;
}) {
  const rodada = rotuloRodada(destaque);
  const sequencia =
    destaque.tipo === 'SEQUENCIA_RESULTADO'
      ? (destaque.dados as unknown as DadosSequenciaResultado)
      : null;
  const pontos =
    compacto && sequencia && typeof sequencia.pontos === 'number' ? sequencia.pontos : null;
  const recorde = Boolean(compacto && sequencia?.recorde?.ehNovoRecorde);
  if (!rodada && pontos == null && !recorde) return null;

  return (
    <div className="shrink-0 space-y-0.5 pt-1 text-center [text-shadow:0_1px_6px_rgba(0,0,0,0.85)]">
      {pontos != null && (
        <p className="text-base font-bold leading-tight text-white">+{pontos} pontos</p>
      )}
      {recorde && <p className="text-xs font-semibold leading-tight text-yellow-300">Novo recorde</p>}
      {rodada && <p className="text-[11px] leading-tight text-white/80">{rodada}</p>}
    </div>
  );
}

function CardSequenciaResultado({
  dados,
  compacto = false,
}: {
  readonly dados: DadosSequenciaResultado;
  readonly compacto?: boolean;
}) {
  return (
    <div>
      <p className={`font-black leading-none text-orange-300 ${compacto ? 'text-4xl' : 'text-5xl'}`}>
        {dados.quantidadeAcertos}
      </p>
      <p className={`text-white/80 ${compacto ? 'mt-0.5 text-xs' : 'mt-1 text-sm'}`}>
        jogos seguidos pontuando
      </p>
      {!compacto && typeof dados.pontos === 'number' && (
        <p className="mt-1 text-lg font-bold text-white">+{dados.pontos} pontos</p>
      )}
      {!compacto && dados.recorde?.ehNovoRecorde && (
        <p className="mt-2 text-xs font-semibold text-yellow-300">Novo recorde</p>
      )}
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
