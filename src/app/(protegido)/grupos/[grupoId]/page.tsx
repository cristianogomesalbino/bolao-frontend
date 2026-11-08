'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings, Lock, Globe } from 'lucide-react';
import { buscarGrupo, sairDoGrupo } from '@/services/grupo.service';
import { buscarDadosTemporada } from '@/services/jogo.service';
import { Button } from '@/components/ui/button';
import { ModalConfirmacao } from '@/components/ui/modal-confirmacao';
import { AbasCopaGrupo, type AbaCopa } from '@/components/grupo/abas-copa-grupo';
import { BotaoConviteGrupo } from '@/components/grupo/botao-convite-grupo';
import { SecaoBrasileiraoGrupo } from '@/components/grupo/secao-brasileirao-grupo';
import { DestaqueCarousel } from '@/components/destaques/destaque-carousel';

export default function DetalhesGrupoPage() {
  const router = useRouter();
  const params = useParams();
  const grupoId = params.grupoId as string;
  const queryClient = useQueryClient();

  const [modalSair, setModalSair] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [abaCopa, setAbaCopa] = useState<AbaCopa>('dashboard');

  const { data: grupo, isLoading: carregandoGrupo } = useQuery({
    queryKey: ['grupo', grupoId],
    queryFn: () => buscarGrupo(grupoId),
    enabled: !!grupoId,
  });

  const ehCopa = grupo?.temporada?.campeonato?.nome?.toLowerCase().includes('copa');

  const { data: dadosTemporada, isLoading: carregandoTemporada } = useQuery({
    queryKey: ['grupo', grupoId, 'dados-temporada'],
    queryFn: () => buscarDadosTemporada(grupo!.temporadaId),
    enabled: !!grupo?.temporadaId && !ehCopa,
    staleTime: 1000 * 30,
  });

  const proximoJogo = dadosTemporada?.proximoJogo ?? undefined;

  async function aoSair() {
    setProcessando(true);
    try {
      await sairDoGrupo(grupoId);
      await queryClient.invalidateQueries({ queryKey: ['grupos'] });
      router.replace('/grupos');
    } finally {
      setProcessando(false);
      setModalSair(false);
    }
  }

  if (carregandoGrupo) {
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
    <div className={`min-h-screen relative ${ehCopa ? '' : 'bg-fundo'}`} style={ehCopa ? { background: 'linear-gradient(180deg, #006b35 0%, #005c2e 25%, #004d27 50%, #004020 75%, #003518 100%)' } : undefined}>

      {/* Efeitos visuais Brasil */}
      {ehCopa && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-40px] left-[10%] w-[500px] h-[300px] rounded-full bg-[#00b340]/25 blur-[120px]" />
          <div className="absolute top-[20px] right-[5%] w-[400px] h-[250px] rounded-full bg-[#ffdf00]/12 blur-[90px]" />
          <div className="absolute top-[40%] left-[-10%] w-[120%] h-[180px] bg-[#ffdf00]/[0.04] rotate-[-3deg] blur-[40px]" />
          <div className="absolute bottom-[0px] left-[15%] w-[500px] h-[300px] rounded-full bg-[#00b340]/20 blur-[120px]" />
          <div className="absolute bottom-[50px] right-[10%] w-[400px] h-[250px] rounded-full bg-[#ffdf00]/10 blur-[100px]" />
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-20 flex items-center gap-0 px-4 py-4 backdrop-blur-lg border-b ${ehCopa ? 'bg-[#003d1a]/80 border-[#009c3b]/30' : 'bg-fundo/80 border-white/[0.05]'}`}>
        <div className="flex items-center gap-2.5 flex-1">
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-semibold text-texto" data-testid="grupo-detalhe-nome" data-dica="grupo-nome">{grupo.nome}</h1>
            </div>
            <p className="text-[10px] text-texto/35 flex items-center gap-1">
              {grupo.privado ? <Lock size={9} /> : <Globe size={9} />}
              {grupo.privado ? 'Privado' : 'Público'} • {grupo.totalParticipantes ?? 0} membros
            </p>
          </div>
        </div>
        {grupo.codigoConvite && <BotaoConviteGrupo codigo={grupo.codigoConvite} />}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/grupos/${grupoId}/configuracoes`)}
          aria-label="Configurações do grupo"
          className="h-10 w-10 text-primaria-claro hover:text-primaria-claro drop-shadow-[0_0_14px_rgba(34,211,94,1)] [&_svg]:size-7"
          data-testid="grupo-btn-configuracoes"
          data-dica="grupo-configuracoes"
        >
          <Settings size={28} strokeWidth={1.8} />
        </Button>
      </header>

      <div className="mx-auto max-w-[480px] px-4 pt-2 space-y-2">
        {/* Botões de ação rápida */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push('/grupos/buscar')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primaria bg-white/[0.03] text-primaria-claro hover:bg-primaria/[0.08] transition-colors text-[12px] font-semibold"
            data-testid="grupo-btn-pesquisar"
            data-dica="grupo-pesquisar"
          >
            Pesquisar
          </button>
          <button
            type="button"
            onClick={() => router.push('/grupos/explorar')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primaria bg-white/[0.03] text-primaria-claro hover:bg-primaria/[0.08] transition-colors text-[12px] font-semibold"
            data-testid="grupo-btn-meus-grupos"
            data-dica="grupo-meus-grupos"
          >
            Meus grupos
          </button>
        </div>
        {/* Destaques do grupo */}
        <DestaqueCarousel
          key={grupoId}
          grupoId={grupoId}
          grupoNome={grupo.nome}
        />
        {/* ═══════════════════════════════════════════════════════ */}
        {/* MODO COPA DO MUNDO — 3 Abas                           */}
        {/* ═══════════════════════════════════════════════════════ */}
        {ehCopa && (
          <AbasCopaGrupo
            aba={abaCopa}
            onMudar={setAbaCopa}
            grupoId={grupoId}
            temporadaId={grupo.temporadaId}
          />
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* MODO NORMAL (Brasileirão, etc.)                        */}
        {/* ═══════════════════════════════════════════════════════ */}
        {!ehCopa && (
          <SecaoBrasileiraoGrupo
            grupoId={grupoId}
            temporadaId={grupo.temporadaId}
            proximoJogo={proximoJogo}
            proximosJogos={dadosTemporada?.proximosJogos}
            carregandoTemporada={carregandoTemporada}
          />
        )}
      </div>

      {/* Modal sair do grupo */}
      <ModalConfirmacao
        aberto={modalSair}
        titulo="Sair do grupo"
        mensagem="Tem certeza que deseja sair? Você perderá acesso aos palpites e ranking deste grupo."
        textoBotaoConfirmar="Sair"
        variante="destructive"
        carregando={processando}
        onConfirmar={aoSair}
        onCancelar={() => setModalSair(false)}
      />
    </div>
  );
}
