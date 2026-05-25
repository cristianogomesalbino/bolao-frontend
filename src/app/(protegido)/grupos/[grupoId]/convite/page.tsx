'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, UserPlus, Copy, Share2, Info, RefreshCw, Check } from 'lucide-react';
import { buscarGrupo, gerarNovoConvite } from '@/services/grupo.service';
import { Button } from '@/components/ui/button';
import { ModalConfirmacao } from '@/components/ui/modal-confirmacao';

export default function ConviteGrupoPage() {
  const router = useRouter();
  const params = useParams();
  const grupoId = params.grupoId as string;
  const queryClient = useQueryClient();

  const [copiado, setCopiado] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [modalGerar, setModalGerar] = useState(false);

  const { data: grupo, isLoading } = useQuery({
    queryKey: ['grupo', grupoId],
    queryFn: () => buscarGrupo(grupoId),
    enabled: !!grupoId,
  });

  function copiarCodigo() {
    if (grupo?.codigoConvite) {
      navigator.clipboard.writeText(grupo.codigoConvite);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  }

  function compartilhar() {
    if (grupo?.codigoConvite) {
      if (navigator.share) {
        navigator.share({
          title: `Bolão - ${grupo.nome}`,
          text: `Entre no meu bolão! Código: ${grupo.codigoConvite}`,
        });
      } else {
        copiarCodigo();
      }
    }
  }

  async function aoGerarNovo() {
    setGerando(true);
    try {
      await gerarNovoConvite(grupoId);
      await queryClient.invalidateQueries({ queryKey: ['grupo', grupoId] });
    } finally {
      setGerando(false);
      setModalGerar(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-fundo flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primaria border-t-transparent" />
      </div>
    );
  }

  if (!grupo) {
    return (
      <div className="min-h-screen bg-fundo flex items-center justify-center">
        <p className="text-texto/50">Grupo não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fundo">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-4 bg-fundo/80 backdrop-blur-lg border-b border-white/[0.05]">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label="Voltar"
          className="text-texto/70 hover:text-texto"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-texto">Código de convite</h1>
          <p className="text-[11px] text-texto/35">Convide amigos para o seu grupo</p>
        </div>
      </header>

      <div className="mx-auto max-w-[480px] px-4 py-5 space-y-4">
        {/* Card código atual */}
        <div className="relative rounded-2xl p-6 text-center overflow-hidden bg-primaria/[0.03]">
          {/* Borda gradiente */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ padding: '1.5px', background: 'linear-gradient(135deg, rgba(34,211,94,1) 0%, rgba(34,211,94,0.6) 50%, rgba(34,211,94,0.15) 100%)', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
          {/* Glow verde canto superior esquerdo */}
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-primaria/[0.15] blur-3xl pointer-events-none" />
          {/* Ícone */}
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primaria/[0.1] border border-primaria-claro/30">
              <UserPlus size={22} className="text-primaria-claro" />
            </div>
          </div>

          {/* Label */}
          <p className="text-[10px] text-primaria-claro font-bold uppercase tracking-[0.15em] mb-3">
            Código atual
          </p>

          {/* Código */}
          <p className="text-3xl font-mono font-bold text-texto tracking-[0.3em] mb-3" data-testid="convite-codigo">
            {grupo.codigoConvite || '—'}
          </p>

          {/* Descrição */}
          <p className="text-[11px] text-texto/35 mb-5">
            Compartilhe este código para convidar novos membros.
          </p>

          {/* Botões */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={copiarCodigo}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] text-sm text-texto/70 font-medium hover:bg-white/[0.07] transition-all active:scale-95"
              data-testid="convite-btn-copiar"
            >
              {copiado ? <Check size={14} className="text-sucesso" /> : <Copy size={14} />}
              {copiado ? 'Copiado!' : 'Copiar código'}
            </button>
            <button
              type="button"
              onClick={compartilhar}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] text-sm text-texto/70 font-medium hover:bg-white/[0.07] transition-all active:scale-95"
              data-testid="convite-btn-compartilhar"
            >
              <Share2 size={14} />
              Compartilhar
            </button>
          </div>

          {/* Info */}
          <div className="flex items-center justify-center gap-1.5 mt-5 pt-4 border-t border-white/[0.05]">
            <Info size={12} className="text-texto/25" />
            <span className="text-[10px] text-texto/30">Este código é válido e pode ser usado por qualquer pessoa.</span>
          </div>
        </div>

        {/* Card como funciona */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primaria/[0.08] shrink-0">
            <Info size={16} className="text-primaria-claro" />
          </div>
          <div>
            <p className="text-sm text-texto/80 font-medium">Como funciona</p>
            <p className="text-[11px] text-texto/40 mt-0.5 leading-relaxed">
              Ao gerar um novo código, o código anterior será desativado e não poderá mais ser usado.
            </p>
          </div>
        </div>

        {/* Seção gerar novo */}
        <div className="text-center pt-4">
          <div className="flex justify-center mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primaria/[0.08] border border-primaria-claro/20">
              <RefreshCw size={22} className="text-primaria-claro" />
            </div>
          </div>
          <p className="text-sm text-texto font-semibold mb-1">Gerar um novo código</p>
          <p className="text-[11px] text-texto/35 mb-5 max-w-[280px] mx-auto">
            Gere um novo código para impedir que pessoas não autorizadas entrem no grupo.
          </p>

          <button
            type="button"
            onClick={() => setModalGerar(true)}
            disabled={gerando}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#16a34a] to-[#22c55e] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_20px_rgba(30,215,96,0.25)] hover:shadow-[0_0_30px_rgba(30,215,96,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] disabled:opacity-50"
            data-testid="convite-btn-gerar-novo"
          >
            <RefreshCw size={16} className={gerando ? 'animate-spin' : ''} />
            Gerar novo código
          </button>
        </div>
      </div>

      {/* Modal confirmação */}
      <ModalConfirmacao
        aberto={modalGerar}
        titulo="Gerar novo código"
        mensagem="O código atual será invalidado e não poderá mais ser usado. Deseja continuar?"
        textoBotaoConfirmar="Gerar novo"
        variante="destructive"
        carregando={gerando}
        onConfirmar={aoGerarNovo}
        onCancelar={() => setModalGerar(false)}
      />
    </div>
  );
}
