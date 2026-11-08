'use client';

import { DESTAQUE_CONFIG } from '@/types/destaques.types';
import type { DestaqueItem, DadosAcertouEmCheio } from '@/types/destaques.types';
import { CardNaoPalpitou } from './destaque-card-nao-palpitou';
import { renderConteudo, RodapeDestaque } from './destaque-card-conteudo';

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
  const dados = destaque.dados as DadosAcertouEmCheio;
  return (dados.participantes?.length ?? 0) >= 3;
}

function precisaLayoutCompacto(destaque: DestaqueItem): boolean {
  return ehPanelinha(destaque) || destaque.tipo === 'SUBIU_RANKING';
}

function margemDoConteudo(compacto: boolean, preencher: boolean): string {
  if (compacto) return 'mt-1.5';
  if (preencher) return 'mt-2';
  return 'mt-3';
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
              className={`flex min-h-0 w-full flex-col ${margemDoConteudo(precisaLayoutCompacto(destaque), preencher)}`}
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
