'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Settings, Link2, Check,
  Lock, Globe
} from 'lucide-react';
import { buscarGrupo, sairDoGrupo } from '@/services/grupo.service';
import { buscarDadosTemporada } from '@/services/jogo.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ModalConfirmacao } from '@/components/ui/modal-confirmacao';
import { AbaDashboardCopa } from '@/components/copa-do-mundo/aba-dashboard-copa';
import { CardProximosJogos } from '@/components/home/card-proximos-jogos';
import { AbaClassificacaoCopa } from '@/components/copa-do-mundo/aba-classificacao-copa';
import { AbaMeusPalpitesCopa } from '@/components/copa-do-mundo/aba-meus-palpites-copa';
import { SecaoPalpitesGrupo } from '@/components/grupo/secao-palpites-grupo';
import { AlertaJogosAtrasados } from '@/components/palpites/alerta-jogos-atrasados';
import { TourPageWrapper, TourRefazerBotao } from '@/components/tour/tour-page-wrapper';

type AbaCopa = 'dashboard' | 'classificacao' | 'palpites';

export default function DetalhesGrupoPage() {
  const router = useRouter();
  const params = useParams();
  const grupoId = params.grupoId as string;
  const queryClient = useQueryClient();

  const [modalSair, setModalSair] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [copiado, setCopiado] = useState(false);
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
    refetchOnWindowFocus: true,
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
      <TourPageWrapper pathname={`/grupos/${grupoId}`} />

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
              <h1 className="text-base font-semibold text-texto" data-testid="grupo-detalhe-nome">{grupo.nome}</h1>
            </div>
            <p className="text-[10px] text-texto/35 flex items-center gap-1">
              {grupo.privado ? <Lock size={9} /> : <Globe size={9} />}
              {grupo.privado ? 'Privado' : 'Público'} • {grupo.totalParticipantes ?? 0} membros
            </p>
          </div>
        </div>
        {grupo.codigoConvite && (
          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}/convite/${grupo.codigoConvite}`;
              navigator.clipboard.writeText(url);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 2000);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95 ${
              copiado
                ? 'bg-sucesso/15 border border-sucesso/30'
                : 'bg-primaria/10 border border-primaria/30 hover:bg-primaria/20'
            }`}
            aria-label="Copiar link de convite"
          >
            {copiado ? <Check size={14} className="text-sucesso" /> : <Link2 size={14} className="text-primaria-claro" />}
            <span className={`text-[11px] font-semibold ${copiado ? 'text-sucesso' : 'text-primaria-claro'}`}>
              {copiado ? 'Copiado!' : 'Convidar'}
            </span>
          </button>
        )}
        <TourRefazerBotao pathname={`/grupos/${grupoId}`} />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/grupos/${grupoId}/configuracoes`)}
          aria-label="Configurações do grupo"
          className="h-10 w-10 text-primaria-claro hover:text-primaria-claro drop-shadow-[0_0_14px_rgba(34,211,94,1)] [&_svg]:size-7"
          data-testid="grupo-btn-configuracoes"
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
          >
            Pesquisar
          </button>
          <button
            type="button"
            onClick={() => router.push('/grupos/explorar')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primaria bg-white/[0.03] text-primaria-claro hover:bg-primaria/[0.08] transition-colors text-[12px] font-semibold"
            data-testid="grupo-btn-meus-grupos"
          >
            Meus grupos
          </button>
        </div>
        {/* ═══════════════════════════════════════════════════════ */}
        {/* MODO COPA DO MUNDO — 3 Abas                           */}
        {/* ═══════════════════════════════════════════════════════ */}
        {ehCopa && (
          <>
            {/* Tabs Copa */}
            <div className="flex gap-1 p-1 rounded-xl bg-[#009c3b]/10 border border-[#009c3b]/20">
              <button
                type="button"
                onClick={() => setAbaCopa('dashboard')}
                className={`flex-1 py-2.5 px-2 rounded-lg text-[11px] font-semibold transition-all text-center ${
                  abaCopa === 'dashboard'
                    ? 'bg-[#009c3b]/30 text-[#ffdf00] border border-[#009c3b]/40 shadow-[0_0_10px_rgba(0,156,59,0.2)]'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => setAbaCopa('classificacao')}
                className={`flex-1 py-2.5 px-2 rounded-lg text-[11px] font-semibold transition-all text-center ${
                  abaCopa === 'classificacao'
                    ? 'bg-[#009c3b]/30 text-[#ffdf00] border border-[#009c3b]/40 shadow-[0_0_10px_rgba(0,156,59,0.2)]'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Classificação
              </button>
              <button
                type="button"
                onClick={() => setAbaCopa('palpites')}
                className={`flex-1 py-2.5 px-2 rounded-lg text-[11px] font-semibold transition-all text-center ${
                  abaCopa === 'palpites'
                    ? 'bg-[#009c3b]/30 text-[#ffdf00] border border-[#009c3b]/40 shadow-[0_0_10px_rgba(0,156,59,0.2)]'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Meus Palpites
              </button>
            </div>

            {/* Conteúdo da aba ativa */}
            {abaCopa === 'dashboard' && (
              <AbaDashboardCopa grupoId={grupoId} temporadaId={grupo.temporadaId} />
            )}
            {abaCopa === 'classificacao' && (
              <AbaClassificacaoCopa temporadaId={grupo.temporadaId} />
            )}
            {abaCopa === 'palpites' && (
              <AbaMeusPalpitesCopa grupoId={grupoId} temporadaId={grupo.temporadaId} />
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* MODO NORMAL (Brasileirão, etc.)                        */}
        {/* ═══════════════════════════════════════════════════════ */}
        {!ehCopa && (
          <>
            {/* Alerta de jogos atrasados */}
            <AlertaJogosAtrasados temporadaId={grupo.temporadaId} grupoId={grupoId} />

            {/* Próximo Jogo */}
            {proximoJogo && (
              <CardProximosJogos
                jogos={dadosTemporada?.proximosJogos && dadosTemporada.proximosJogos.length > 0
                  ? dadosTemporada.proximosJogos
                  : [proximoJogo]}
                grupoId={grupoId}
                temaCopa={false}
              />
            )}

            {!proximoJogo && !carregandoGrupo && !carregandoTemporada && (
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-[11px] text-texto/30">Nenhum jogo agendado no momento</p>
                </CardContent>
              </Card>
            )}

            {/* Palpites do grupo — expandível */}
            <SecaoPalpitesGrupo grupoId={grupoId} temporadaId={grupo.temporadaId} />

          </>
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
