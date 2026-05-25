'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Settings, Copy, Check,
  Lock, Globe, ChevronRight, Trophy, Calendar, Activity, Minus, User
} from 'lucide-react';
import { buscarGrupo, sairDoGrupo, obterRankingGeral, obterRankingFase } from '@/services/grupo.service';
import { buscarProximoJogo, contarJogosAdiados } from '@/services/jogo.service';
import { buscarClassificacao, obterPosicaoTime, obterUltimosJogos } from '@/services/classificacao.service';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ModalConfirmacao } from '@/components/ui/modal-confirmacao';
import { PalpiteInlineForm } from '@/components/palpite/palpite-inline-form';

export default function DetalhesGrupoPage() {
  const router = useRouter();
  const params = useParams();
  const grupoId = params.grupoId as string;
  const queryClient = useQueryClient();
  const usuario = useAuthStore((state) => state.usuario);

  const [modalSair, setModalSair] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [rankingFiltro, setRankingFiltro] = useState<'geral' | 'rodada'>('geral');
  const [rodadaSelecionada, setRodadaSelecionada] = useState<number | null>(null);
  const [rodadaListaAberta, setRodadaListaAberta] = useState(false);

  const { data: grupo, isLoading: carregandoGrupo } = useQuery({
    queryKey: ['grupo', grupoId],
    queryFn: () => buscarGrupo(grupoId),
    enabled: !!grupoId,
  });

  const { data: rankingGeral } = useQuery({
    queryKey: ['grupo', grupoId, 'ranking', 'geral'],
    queryFn: () => obterRankingGeral(grupoId),
    enabled: !!grupoId,
  });

  const { data: proximoJogo } = useQuery({
    queryKey: ['grupo', grupoId, 'proximo-jogo'],
    queryFn: () => buscarProximoJogo(grupo!.temporadaId),
    enabled: !!grupo?.temporadaId,
  });

  const { data: totalAdiados } = useQuery({
    queryKey: ['grupo', grupoId, 'jogos-adiados'],
    queryFn: () => contarJogosAdiados(grupo!.temporadaId),
    enabled: !!grupo?.temporadaId,
  });

  const { data: classificacao } = useQuery({
    queryKey: ['classificacao'],
    queryFn: () => buscarClassificacao(),
    staleTime: 1000 * 60 * 60,
  });

  const { data: rankingRodada } = useQuery({
    queryKey: ['grupo', grupoId, 'ranking', 'rodada', proximoJogo?.fase.id, rodadaSelecionada],
    queryFn: () => obterRankingFase(grupoId, proximoJogo!.fase.id, rodadaSelecionada!),
    enabled: !!grupoId && !!proximoJogo?.fase.id && rankingFiltro === 'rodada' && !!rodadaSelecionada,
  });

  // Ranking acumulado até a rodada anterior (para calcular variação)
  const rodadaAtual = proximoJogo?.jogo.rodada ?? null;
  const rodadaAnterior = rodadaAtual && rodadaAtual > 1 ? rodadaAtual - 1 : null;
  const { data: rankingAnterior } = useQuery({
    queryKey: ['grupo', grupoId, 'ranking', 'ateRodada', proximoJogo?.fase.id, rodadaAnterior],
    queryFn: () => obterRankingFase(grupoId, proximoJogo!.fase.id, undefined, rodadaAnterior!),
    enabled: !!grupoId && !!proximoJogo?.fase.id && !!rodadaAnterior,
  });

  // Ranking ativo conforme filtro
  const rankingAtivo = rankingFiltro === 'rodada' && rodadaSelecionada ? rankingRodada : rankingGeral;

  // Variação de posição (ranking geral atual vs acumulado até rodada anterior)
  function obterVariacao(usuarioId: string): number {
    if (!rankingAnterior || rankingAnterior.length === 0 || !rankingGeral) return 0;
    const posAnterior = rankingAnterior.find((r) => r.usuarioId === usuarioId)?.posicao;
    const posAtual = rankingGeral.find((r) => r.usuarioId === usuarioId)?.posicao;
    if (!posAnterior || !posAtual) return 0;
    return posAnterior - posAtual;
  }

  // Countdown até o jogo
  useEffect(() => {
    if (!proximoJogo) return;
    const target = new Date(proximoJogo.jogo.dataHora).getTime() - 60000; // 1 min antes

    function atualizar() {
      const diff = target - Date.now();
      if (diff <= 0) {
        setCountdown('encerrado');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }

    atualizar();
    const interval = setInterval(atualizar, 1000);
    return () => clearInterval(interval);
  }, [proximoJogo]);

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

  // Minha posição no ranking
  const minhaPosicao = rankingGeral?.find((r) => r.usuarioId === usuario?.id);
  const lider = rankingGeral?.[0];
  const ptsAtrasDoLider = lider && minhaPosicao ? lider.pontuacaoTotal - minhaPosicao.pontuacaoTotal : 0;

  // Verificar se há jogos adiados na temporada (independente do próximo jogo)
  const temJogosAdiados = (totalAdiados ?? 0) > 0;

  // Top 3 para o pódio
  const top3 = rankingAtivo?.slice(0, 3) ?? [];
  // Restante do ranking (4+)
  const restoRanking = rankingAtivo?.slice(3) ?? [];

  // Mock atividade (será substituído por dados reais)
  const mockAtividade = [
    { nome: 'Cristiano', acao: 'fez 5 palpites', tempo: 'Há 2h', inicial: 'C' },
    { nome: 'Lucas', acao: 'fez 3 palpites', tempo: 'Há 2h', inicial: 'L' },
    { nome: 'Mestre', acao: 'fez 4 palpites', tempo: 'Há 5h', inicial: 'M' },
    { nome: 'Lucas', acao: 'assumiu a liderança', tempo: 'Há 2h', inicial: 'L' },
  ];

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
    <div className="min-h-screen bg-fundo pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-0 px-1 py-4 bg-fundo/80 backdrop-blur-lg border-b border-white/[0.05]">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label="Voltar"
          className="text-texto/70 hover:text-texto shrink-0"
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primaria/15 text-primaria text-sm font-bold">
            {grupo.nome.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-semibold text-texto" data-testid="grupo-detalhe-nome">{grupo.nome}</h1>
              <span className="text-destaque text-xs">👑</span>
            </div>
            <p className="text-[10px] text-texto/35 flex items-center gap-1">
              {grupo.privado ? <Lock size={9} /> : <Globe size={9} />}
              {grupo.privado ? 'Privado' : 'Público'} • {grupo.totalParticipantes ?? 0} membros
            </p>
          </div>
        </div>
        {/* Código de convite */}
        {grupo.codigoConvite && (
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(grupo.codigoConvite!);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 2000);
            }}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-md hover:bg-white/[0.04] transition-all"
            aria-label="Copiar código de convite"
          >
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-mono text-primaria-claro font-bold tracking-wider">{grupo.codigoConvite}</span>
              {copiado ? <Check size={12} className="text-sucesso" /> : <Copy size={12} className="text-primaria-claro/50" />}
            </div>
            <span className="text-[8px] text-texto/30">{copiado ? 'Copiado!' : 'Copiar código'}</span>
          </button>
        )}
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
        {/* Próximo Jogo */}
        {proximoJogo && (
          <Card data-testid="grupo-card-proximo-jogo">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-primaria-claro" />
                  <span className="text-[11px] text-texto/50 uppercase tracking-wider font-semibold">
                    Próximo Jogo {proximoJogo.jogo.rodada ? `— Rodada ${proximoJogo.jogo.rodada}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {proximoJogo.jogo.foiAdiado && (
                    <span className="text-[9px] font-bold text-destaque bg-destaque/15 border border-destaque/30 px-2 py-0.5 rounded flex items-center gap-1">
                      ⚠ ATRASADO
                    </span>
                  )}
                  <button onClick={() => router.push(`/grupos/${grupoId}/palpites`)} className="text-[10px] text-primaria-claro/70 hover:text-primaria-claro flex items-center gap-0.5">
                    Ver todos <ChevronRight size={10} />
                  </button>
                </div>
              </div>

              {/* Alerta de jogos atrasados */}
              {temJogosAdiados && (
                <button
                  type="button"
                  onClick={() => router.push(`/grupos/${grupoId}/jogos-adiados`)}
                  className="flex items-center gap-2 mb-2"
                >
                  <span className="text-destaque text-sm">⏱</span>
                  <span className="text-[12px] text-destaque font-semibold">Há jogos atrasados</span>
                  <span className="text-texto/30">•</span>
                  <span className="text-[11px] text-primaria-claro font-medium flex items-center gap-0.5">
                    Ver todos <ChevronRight size={10} />
                  </span>
                </button>
              )}

              <div className="flex items-start justify-center py-2 gap-3">
                {/* Time Casa */}
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="h-[72px] w-[72px] flex items-center justify-center">
                    {proximoJogo.jogo.timeCasa?.escudo ? (
                      <img src={proximoJogo.jogo.timeCasa.escudo} alt={proximoJogo.jogo.timeCasa.nome} className="h-[64px] w-[64px] object-contain drop-shadow-[0_0_24px_rgba(255,255,255,0.4)] brightness-110 saturate-[1.2]" />
                    ) : (
                      <span className="text-xl font-bold text-texto/50">{proximoJogo.jogo.timeCasa?.sigla || '?'}</span>
                    )}
                  </div>
                  <span className="text-[13px] text-texto font-bold truncate max-w-[110px]">
                    {proximoJogo.jogo.timeCasa?.nome || 'Time Casa'}
                  </span>
                  {classificacao && proximoJogo.jogo.timeCasa?.nome && obterPosicaoTime(classificacao, proximoJogo.jogo.timeCasa.nome) && (
                    <span className="text-[10px] text-primaria-claro font-medium">
                      {obterPosicaoTime(classificacao, proximoJogo.jogo.timeCasa.nome)}º colocado
                    </span>
                  )}
                </div>

                {/* Centro: Data + Horário + VS */}
                <div className="flex flex-col items-center">
                  <span className="text-[11px] text-primaria-claro font-bold bg-primaria/15 px-3 py-0.5 rounded">
                    {(() => {
                      const jogoDate = new Date(proximoJogo.jogo.dataHora);
                      const hoje = new Date();
                      const amanha = new Date();
                      amanha.setDate(amanha.getDate() + 1);

                      if (jogoDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) === hoje.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })) {
                        return 'Hoje';
                      }
                      if (jogoDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) === amanha.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })) {
                        return 'Amanhã';
                      }
                      return jogoDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' });
                    })()}
                  </span>
                  <span className="text-3xl font-bold text-texto mt-5">
                    {new Date(proximoJogo.jogo.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="h-px w-6 bg-texto/15" />
                    <span className="text-[10px] text-texto/30 font-medium">VS</span>
                    <span className="h-px w-6 bg-texto/15" />
                  </div>
                </div>

                {/* Time Fora */}
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="h-[72px] w-[72px] flex items-center justify-center">
                    {proximoJogo.jogo.timeFora?.escudo ? (
                      <img src={proximoJogo.jogo.timeFora.escudo} alt={proximoJogo.jogo.timeFora.nome} className="h-[64px] w-[64px] object-contain drop-shadow-[0_0_24px_rgba(255,255,255,0.4)] brightness-110 saturate-[1.2]" />
                    ) : (
                      <span className="text-xl font-bold text-texto/50">{proximoJogo.jogo.timeFora?.sigla || '?'}</span>
                    )}
                  </div>
                  <span className="text-[13px] text-texto font-bold truncate max-w-[110px]">
                    {proximoJogo.jogo.timeFora?.nome || 'Time Fora'}
                  </span>
                  {classificacao && proximoJogo.jogo.timeFora?.nome && obterPosicaoTime(classificacao, proximoJogo.jogo.timeFora.nome) && (
                    <span className="text-[10px] text-primaria-claro font-medium">
                      {obterPosicaoTime(classificacao, proximoJogo.jogo.timeFora.nome)}º colocado
                    </span>
                  )}
                </div>
              </div>

              {/* Histórico + Countdown — alinhado com escudos */}
              <div className="flex items-start justify-center gap-3 mb-3">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-[9px] text-texto/30">Últimos 5 jogos</span>
                  <div className="flex gap-1">
                    {(classificacao && proximoJogo.jogo.timeCasa?.nome
                      ? obterUltimosJogos(classificacao, proximoJogo.jogo.timeCasa.nome)
                      : []
                    ).map((r, i) => (
                      <span key={`casa-${i}`} className={`text-[8px] font-bold h-4 w-4 flex items-center justify-center rounded ${
                        r === 'V' ? 'bg-primaria text-white' :
                        r === 'E' ? 'bg-destaque text-white' :
                        'bg-erro text-white'
                      }`}>{r}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border border-white/[0.1] bg-white/[0.03] -mt-4">
                  <span className="text-[9px] text-texto/40 flex items-center gap-1">⏱ Fecha em</span>
                  <span className={`text-sm font-mono font-bold ${
                    countdown === 'encerrado' ? 'text-erro' : 'text-primaria-claro'
                  }`}>
                    {countdown === 'encerrado' ? 'Encerrado' : countdown || '—'}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-[9px] text-texto/30">Últimos 5 jogos</span>
                  <div className="flex gap-1">
                    {(classificacao && proximoJogo.jogo.timeFora?.nome
                      ? obterUltimosJogos(classificacao, proximoJogo.jogo.timeFora.nome)
                      : []
                    ).map((r, i) => (
                      <span key={`fora-${i}`} className={`text-[8px] font-bold h-4 w-4 flex items-center justify-center rounded ${
                        r === 'V' ? 'bg-primaria text-white' :
                        r === 'E' ? 'bg-destaque text-white' :
                        'bg-erro text-white'
                      }`}>{r}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Palpite inline */}
              <PalpiteInlineForm
                jogoId={proximoJogo.jogo.id}
                timeCasaNome={proximoJogo.jogo.timeCasa?.nome || 'Casa'}
                timeForaNome={proximoJogo.jogo.timeFora?.nome || 'Fora'}
                disabled={countdown === 'encerrado'}
              />
            </CardContent>
          </Card>
        )}

        {!proximoJogo && !carregandoGrupo && (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-[11px] text-texto/30">Nenhum jogo agendado no momento</p>
            </CardContent>
          </Card>
        )}



        {/* Sua Posição */}
        {minhaPosicao && (
          <Card data-testid="grupo-card-minha-posicao">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <User size={16} className="text-primaria-claro" />
                <span className="text-[11px] text-texto/50 uppercase tracking-wider font-semibold">
                  Sua Posição
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-bold text-texto">{minhaPosicao.posicao}º</span>
                  <div>
                    <p className="text-lg font-bold text-texto">{minhaPosicao.pontuacaoTotal} pts</p>
                    {ptsAtrasDoLider > 0 && (
                      <p className="text-[11px] text-texto/40">{ptsAtrasDoLider} pts atrás do líder</p>
                    )}
                    {ptsAtrasDoLider === 0 && minhaPosicao.posicao === 1 && (
                      <p className="text-[11px] text-primaria/70">Você é o líder! 🏆</p>
                    )}
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primaria/[0.08] border border-primaria/20">
                  <Trophy size={22} className="text-primaria-claro" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ranking */}
        <Card data-testid="grupo-card-ranking">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={16} className="text-primaria-claro" />
              <span className="text-[11px] text-texto/50 uppercase tracking-wider font-semibold">
                Ranking
              </span>
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => { setRankingFiltro('geral'); setRodadaSelecionada(null); }}
                  className={`text-[10px] px-2 py-1 rounded-md transition-colors ${
                    rankingFiltro === 'geral'
                      ? 'bg-primaria/15 text-primaria-claro font-semibold border border-primaria/30'
                      : 'text-texto/40 border border-white/[0.08] hover:text-texto/60'
                  }`}
                >
                  Geral
                </button>
                <button
                  onClick={() => { setRankingFiltro('rodada'); if (!rodadaSelecionada && proximoJogo?.jogo.rodada) setRodadaSelecionada(proximoJogo.jogo.rodada); }}
                  className={`text-[10px] px-2 py-1 rounded-md transition-colors ${
                    rankingFiltro === 'rodada'
                      ? 'bg-primaria/15 text-primaria-claro font-semibold border border-primaria/30'
                      : 'text-texto/40 border border-white/[0.08] hover:text-texto/60'
                  }`}
                >
                  Rodada
                </button>
              </div>
            </div>

            {/* Seletor de rodada */}
            {rankingFiltro === 'rodada' && (
              <div className="relative mb-3">
                <div className="flex items-center justify-center gap-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => { setRodadaSelecionada((prev) => prev && prev > 1 ? prev - 1 : prev); setRodadaListaAberta(false); }}
                    disabled={!rodadaSelecionada || rodadaSelecionada <= 1}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-primaria-claro hover:text-primaria disabled:opacity-20 transition-colors"
                  >
                    <ChevronRight size={20} className="rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRodadaListaAberta(!rodadaListaAberta)}
                    className="text-[12px] text-texto/70 font-medium min-w-[100px] text-center hover:text-primaria-claro transition-colors"
                  >
                    {rodadaSelecionada ? `Rodada ${rodadaSelecionada}` : 'Selecione a rodada'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRodadaSelecionada((prev) => prev ? Math.min(prev + 1, proximoJogo?.jogo.rodada ?? 38) : 1); setRodadaListaAberta(false); }}
                    disabled={rodadaSelecionada === (proximoJogo?.jogo.rodada ?? 38)}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-primaria-claro hover:text-primaria disabled:opacity-20 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                {/* Dropdown lista de rodadas */}
                {rodadaListaAberta && (
                  <div className="absolute z-10 top-full mt-1 left-0 right-0 max-h-[200px] overflow-y-auto rounded-xl border border-white/[0.1] bg-[#1a1a2e] shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                    <div className="grid grid-cols-4 gap-1 p-2">
                      {Array.from({ length: proximoJogo?.jogo.rodada ?? 1 }, (_, i) => i + 1).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => { setRodadaSelecionada(r); setRodadaListaAberta(false); }}
                          className={`py-2 rounded-lg text-[11px] font-medium transition-all ${
                            r === rodadaSelecionada
                              ? 'bg-primaria/20 text-primaria-claro border border-primaria/40'
                              : 'text-texto/50 hover:bg-white/[0.06] hover:text-texto/80'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pódio Top 3 */}
            {top3.length >= 3 && (
              <div className="flex items-end justify-center gap-3 mb-4 pb-4 border-b border-white/[0.05]">
                {/* 2º lugar */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-texto/40 font-bold mb-1">2</span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] text-texto/60 text-sm font-bold border-2 border-white/[0.12]">
                    {top3[1].nomeUsuario.charAt(0)}
                  </div>
                  <span className="text-[10px] text-texto/60 font-medium mt-1">{top3[1].nomeUsuario.split(' ')[0]}</span>
                  <span className="text-[10px] text-primaria font-bold">{top3[1].pontuacaoTotal} pts</span>
                </div>
                {/* 1º lugar */}
                <div className="flex flex-col items-center -mt-3">
                  <span className="text-destaque text-sm mb-1">👑</span>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primaria/20 text-primaria text-base font-bold border-2 border-primaria/50 shadow-[0_0_12px_rgba(34,211,94,0.2)]">
                    {top3[0].nomeUsuario.charAt(0)}
                  </div>
                  <span className="text-[11px] text-texto/80 font-semibold mt-1">{top3[0].nomeUsuario.split(' ')[0]}</span>
                  <span className="text-[11px] text-primaria font-bold">{top3[0].pontuacaoTotal} pts</span>
                </div>
                {/* 3º lugar */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-texto/40 font-bold mb-1">3</span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] text-texto/60 text-sm font-bold border-2 border-white/[0.12]">
                    {top3[2].nomeUsuario.charAt(0)}
                  </div>
                  <span className="text-[10px] text-texto/60 font-medium mt-1">{top3[2].nomeUsuario.split(' ')[0]}</span>
                  <span className="text-[10px] text-texto/50 font-bold">{top3[2].pontuacaoTotal} pts</span>
                </div>
              </div>
            )}

            {/* Resto do ranking (4+) */}
            {restoRanking.length > 0 && (
              <div className="space-y-1">
                {restoRanking.map((item) => {
                  const variacao = rankingFiltro === 'geral' ? obterVariacao(item.usuarioId) : 0;
                  return (
                    <div key={item.usuarioId} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/[0.02]">
                      <span className="text-[11px] text-texto/30 font-medium w-4 text-center">{item.posicao}</span>
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primaria/10 text-primaria text-[10px] font-bold">
                        {item.nomeUsuario.charAt(0)}
                      </div>
                      <span className="flex-1 text-sm text-texto/70">{item.nomeUsuario}</span>
                      <span className="text-sm text-texto/50 font-medium">{item.pontuacaoTotal} pts</span>
                      <span className="w-6 text-center">
                        {variacao > 0 && <span className="text-[10px] text-primaria font-bold">↑{variacao}</span>}
                        {variacao < 0 && <span className="text-[10px] text-erro font-bold">↓{Math.abs(variacao)}</span>}
                        {variacao === 0 && <Minus size={10} className="text-texto/20 inline" />}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {(!rankingAtivo || rankingAtivo.length === 0) && (
              <p className="text-[11px] text-texto/30 text-center py-4">Nenhuma pontuação registrada ainda</p>
            )}

            {/* Link ver completo */}
            {rankingAtivo && rankingAtivo.length > 0 && (
              <button className="w-full flex items-center justify-center gap-1 mt-3 pt-3 border-t border-white/[0.05] text-[11px] text-primaria-claro/70 hover:text-primaria-claro">
                Ver ranking completo <ChevronRight size={10} />
              </button>
            )}
          </CardContent>
        </Card>

        {/* Atividade Recente */}
        <Card data-testid="grupo-card-atividade">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-primaria-claro" />
                <span className="text-[11px] text-texto/50 uppercase tracking-wider font-semibold">
                  Atividade Recente
                </span>
              </div>
              <button className="text-[10px] text-primaria-claro/70 hover:text-primaria-claro flex items-center gap-0.5">
                Ver todas <ChevronRight size={10} />
              </button>
            </div>
            <div className="space-y-1">
              {mockAtividade.map((item, i) => (
                <div key={`${item.nome}-${i}`} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/[0.02]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primaria/10 text-primaria text-xs font-bold shrink-0">
                    {item.inicial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-texto/70">
                      <span className="font-medium text-texto/90">{item.nome}</span> {item.acao}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-texto/30">{item.tempo}</span>
                    <ChevronRight size={12} className="text-texto/15" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
