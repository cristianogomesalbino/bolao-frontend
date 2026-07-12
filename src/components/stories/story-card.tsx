'use client';

import { useState } from 'react';
import { mandarF } from '@/services/stories.service';
import { STORY_CONFIG } from '@/types/stories.types';
import type {
  StoryItem,
  DadosAcertouEmCheio,
  DadosUnicoNaMosca,
  DadosSubiuRanking,
  DadosSequenciaMosca,
  DadosSequenciaResultado,
  DadosNaoPalpitou,
  DadosDobrouEAcertou,
} from '@/types/stories.types';

interface StoryCardProps {
  readonly story: StoryItem;
  readonly grupoId: string;
}

export function StoryCard({ story, grupoId }: StoryCardProps) {
  const config = STORY_CONFIG[story.tipo];

  return (
    <div
      className="w-full max-w-sm rounded-2xl p-6 text-white relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${config.cor}33, ${config.cor}11, #111827)`,
      }}
      data-testid={`story-card-${story.tipo}`}
    >
      {/* Emoji + Título */}
      <div className="text-center mb-4">
        <span className="text-4xl">{config.emoji}</span>
        <h2 className="text-xl font-bold mt-2">{story.titulo}</h2>
      </div>

      {/* Conteúdo por tipo */}
      <div className="space-y-3">
        {renderConteudo(story, grupoId)}
      </div>
    </div>
  );
}

function renderConteudo(story: StoryItem, grupoId: string) {
  switch (story.tipo) {
    case 'ACERTOU_EM_CHEIO':
      return <CardAcertouEmCheio dados={story.dados as unknown as DadosAcertouEmCheio} />;
    case 'UNICO_NA_MOSCA':
      return <CardUnicoNaMosca dados={story.dados as unknown as DadosUnicoNaMosca} />;
    case 'SUBIU_RANKING':
      return <CardSubiuRanking dados={story.dados as unknown as DadosSubiuRanking} />;
    case 'SEQUENCIA_MOSCA':
      return <CardSequenciaMosca dados={story.dados as unknown as DadosSequenciaMosca} />;
    case 'SEQUENCIA_RESULTADO':
      return <CardSequenciaResultado dados={story.dados as unknown as DadosSequenciaResultado} />;
    case 'NAO_PALPITOU':
      return <CardNaoPalpitou story={story} grupoId={grupoId} />;
    case 'DOBROU_E_ACERTOU':
      return <CardDobrouEAcertou dados={story.dados as unknown as DadosDobrouEAcertou} />;
    default:
      return null;
  }
}

// --- Cards por tipo ---

function CardAcertouEmCheio({ dados }: { readonly dados: DadosAcertouEmCheio }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-4">
        <span className="text-sm">{dados.timeCasa.sigla}</span>
        <span className="text-2xl font-bold">{dados.golsCasa} × {dados.golsFora}</span>
        <span className="text-sm">{dados.timeFora.sigla}</span>
      </div>
    </div>
  );
}

function CardUnicoNaMosca({ dados }: { readonly dados: DadosUnicoNaMosca }) {
  return (
    <div className="text-center">
      <p className="text-gray-300 text-sm mb-2">Único a cravar o placar</p>
      <div className="flex items-center justify-center gap-4">
        <span className="text-sm">{dados.timeCasa.sigla}</span>
        <span className="text-2xl font-bold">{dados.golsCasa} × {dados.golsFora}</span>
        <span className="text-sm">{dados.timeFora.sigla}</span>
      </div>
      {dados.rodada && <p className="text-xs text-gray-400 mt-1">Rodada {dados.rodada}</p>}
    </div>
  );
}

function CardSubiuRanking({ dados }: { readonly dados: DadosSubiuRanking }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="text-gray-400">#{dados.posicaoAnterior}</span>
        <span className="text-lg">→</span>
        <span className="text-green-400 font-bold text-xl">#{dados.posicaoNova}</span>
      </div>
      <div className="space-y-1">
        {dados.top5.map((m) => (
          <div key={m.posicao} className="flex justify-between text-xs text-gray-300">
            <span>#{m.posicao} {m.nome}</span>
            <span>{m.pontuacao}pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardSequenciaMosca({ dados }: { readonly dados: DadosSequenciaMosca }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-orange-400">{dados.quantidadeAcertos}</p>
      <p className="text-sm text-gray-300 mb-2">acertos na mosca seguidos</p>
      <div className="flex justify-center gap-1 mb-2">
        {dados.ultimosJogos.map((j, i) => (
          <span key={`mosca-${i}-${j.timeCasa}`}>{j.acertouEmCheio ? '🎯' : '❌'}</span>
        ))}
      </div>
      {dados.recorde.ehNovoRecorde && (
        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
          🏆 Novo recorde!
        </span>
      )}
      {!dados.recorde.ehNovoRecorde && (
        <p className="text-xs text-gray-500">
          Recorde: {dados.recorde.valor} — {dados.recorde.detentores.map((d) => d.nome).join(', ')}
        </p>
      )}
    </div>
  );
}

function CardSequenciaResultado({ dados }: { readonly dados: DadosSequenciaResultado }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-orange-400">{dados.quantidadeAcertos}</p>
      <p className="text-sm text-gray-300 mb-2">acertos consecutivos</p>
      <div className="flex justify-center gap-1 mb-2">
        {dados.ultimosJogos.map((j, i) => (
          <span key={`seq-${i}-${j.timeCasa}`}>{j.acertou ? '✅' : '❌'}</span>
        ))}
      </div>
      {dados.recorde.ehNovoRecorde && (
        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
          🏆 Novo recorde!
        </span>
      )}
      {!dados.recorde.ehNovoRecorde && (
        <p className="text-xs text-gray-500">
          Recorde: {dados.recorde.valor} — {dados.recorde.detentores.map((d) => d.nome).join(', ')}
        </p>
      )}
    </div>
  );
}

function CardNaoPalpitou({
  story,
  grupoId,
}: {
  readonly story: StoryItem;
  readonly grupoId: string;
}) {
  const dados = story.dados as unknown as DadosNaoPalpitou;
  const [jaEnviou, setJaEnviou] = useState(story.jaEnviouF);
  const [contador, setContador] = useState(story.contadorFs);
  const [enviando, setEnviando] = useState(false);

  async function handleMandarF() {
    if (jaEnviou || enviando) return;
    setEnviando(true);
    try {
      const res = await mandarF(grupoId, story.id);
      setContador(res.contadorFs);
      setJaEnviou(true);
    } catch {
      // Manter estado original
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="text-center">
      <div className="space-y-1 mb-3">
        {dados.jogosEsquecidos.slice(0, 3).map((j) => (
          <p key={j.jogoId} className="text-xs text-gray-400">
            {j.timeCasa.sigla} {j.golsCasa ?? '?'} × {j.golsFora ?? '?'} {j.timeFora.sigla}
          </p>
        ))}
        {dados.jogosEsquecidos.length > 3 && (
          <p className="text-xs text-gray-500">+{dados.jogosEsquecidos.length - 3} jogos</p>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleMandarF();
        }}
        disabled={jaEnviou || enviando}
        className={`px-4 py-2 rounded-full text-sm font-medium ${
          jaEnviou
            ? 'bg-gray-700 text-gray-400'
            : 'bg-gray-600 hover:bg-gray-500 text-white'
        }`}
        data-interactive
      >
        {jaEnviou ? '✓ Você já mandou um F' : `🪦 Mandar um F (${contador})`}
      </button>
    </div>
  );
}

function CardDobrouEAcertou({ dados }: { readonly dados: DadosDobrouEAcertou }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-4 mb-2">
        <span className="text-sm">{dados.timeCasa.sigla}</span>
        <span className="text-2xl font-bold">{dados.golsCasa} × {dados.golsFora}</span>
        <span className="text-sm">{dados.timeFora.sigla}</span>
      </div>
      <p className="text-yellow-400 font-bold text-lg">+{dados.pontosObtidos} pontos</p>
    </div>
  );
}
