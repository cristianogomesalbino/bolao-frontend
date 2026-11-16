'use client';

import { useEffect, useState } from 'react';
import { mandarF } from '@/services/destaques.service';
import { useAuthStore } from '@/stores/auth.store';
import type { ErroApi } from '@/types/auth.types';
import type { DadosNaoPalpitou, DestaqueItem } from '@/types/destaques.types';

interface CardNaoPalpitouProps {
  readonly destaque: DestaqueItem;
  readonly grupoId: string;
  readonly emoji: string;
  readonly compacto?: boolean;
}

function ehErroApi(error: unknown): error is ErroApi {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    'mensagem' in error
  );
}

export function CardNaoPalpitou({
  destaque,
  grupoId,
  emoji,
  compacto = false,
}: CardNaoPalpitouProps) {
  const usuarioId = useAuthStore((s) => s.usuario?.id);
  const ehProprio = Boolean(
    usuarioId && destaque.autor.usuarioId === usuarioId,
  );
  // Só mostra o CTA se sabemos quem está logado e não é o autor do esquecimento.
  const mostrarBotaoAcordar = Boolean(usuarioId) && !ehProprio;
  const dados = destaque.dados as unknown as DadosNaoPalpitou;
  const jogos = dados.jogosEsquecidos ?? [];
  const meio = Math.ceil(jogos.length / 2);
  const esquerda = jogos.slice(0, meio);
  const direita = jogos.slice(meio);
  const [jaEnviou, setJaEnviou] = useState(destaque.jaEnviouF);
  const [contador, setContador] = useState(destaque.contadorFs);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setJaEnviou(destaque.jaEnviouF);
    setContador(destaque.contadorFs);
    setErro(null);
  }, [destaque.id, destaque.jaEnviouF, destaque.contadorFs]);

  async function handleMandarF() {
    if (ehProprio || jaEnviou || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      const res = await mandarF(grupoId, destaque.id);
      setContador(res.contadorFs);
      setJaEnviou(true);
    } catch (error: unknown) {
      if (ehErroApi(error) && error.statusCode === 409) {
        setJaEnviou(true);
        return;
      }
      setErro(
        ehErroApi(error)
          ? error.mensagem
          : 'Não foi possível acordar o jogador',
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-2 text-center">
      <p className={compacto ? 'text-2xl leading-none' : 'mb-1 text-3xl'} aria-hidden>
        {emoji}
      </p>
      <h2
        className={`max-w-[15rem] font-black uppercase tracking-tight ${
          compacto ? 'text-[1.65rem] leading-[0.92]' : 'text-3xl leading-none'
        }`}
      >
        {destaque.titulo}
      </h2>
      <div className="mt-3 grid w-full grid-cols-2 gap-x-3">
        <ListaLateral jogos={esquerda} alinhamento="left" />
        <ListaLateral jogos={direita} alinhamento="right" />
      </div>
      {mostrarBotaoAcordar && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void handleMandarF();
            }}
            disabled={jaEnviou || enviando}
            className="mt-3 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:bg-white/20"
            data-interactive
            data-testid="destaque-btn-mandar-f"
          >
            {jaEnviou ? 'Você já acordou' : `Acordar jogador (${contador})`}
          </button>
          {erro && (
            <p
              className="mt-2 text-xs text-white"
              data-testid="destaque-erro-mandar-f"
            >
              {erro}
            </p>
          )}
        </>
      )}
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
          {jogo.timeCasa.sigla} {jogo.golsCasa ?? '?'} × {jogo.golsFora ?? '?'}{' '}
          {jogo.timeFora.sigla}
        </p>
      ))}
    </div>
  );
}
