'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Settings, Copy, Check,
  Lock, Globe, ChevronRight, Trophy, Calendar, Activity, ChevronDown, Minus, Target, User
} from 'lucide-react';
import { buscarGrupo, sairDoGrupo, obterRankingGeral } from '@/services/grupo.service';
import { buscarProximoJogo } from '@/services/jogo.service';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ModalConfirmacao } from '@/components/ui/modal-confirmacao';

export default function DetalhesGrupoPage() {
  const router = useRouter();
  const params = useParams();
  const grupoId = params.grupoId as string;
  const queryClient = useQueryClient();
  const usuario = useAuthStore((state) => state.usuario);

  const [modalSair, setModalSair] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [copiado, setCopiado] = useState(false);

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

  // Top 3 para o pódio
  const top3 = rankingGeral?.slice(0, 3) ?? [];
  // Restante do ranking (4+)
  const restoRanking = rankingGeral?.slice(3) ?? [];

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

      <div className="mx-auto max-w-[480px] px-4 py-3 space-y-3">
        {/* Próximo Jogo */}
        {proximoJogo && (
          <Card data-testid="grupo-card-proximo-jogo">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-primaria-claro" />
                  <span className="text-[11px] text-texto/50 uppercase tracking-wider font-semibold">
                    Próximo Jogo {proximoJogo.jogo.rodada ? `— Rodada ${proximoJogo.jogo.rodada}` : ''}
                  </span>
                </div>
                <button className="text-[10px] text-primaria-claro/70 hover:text-primaria-claro flex items-center gap-0.5">
                  Ver todos <ChevronRight size={10} />
                </button>
              </div>
              <div className="flex items-center justify-center py-3 gap-5">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="h-14 w-14 rounded-full bg-white/[0.05] flex items-center justify-center border border-white/[0.08] overflow-hidden">
                    {proximoJogo.jogo.timeCasa?.escudo ? (
                      <img src={proximoJogo.jogo.timeCasa.escudo} alt={proximoJogo.jogo.timeCasa.nome} className="h-10 w-10 object-contain" />
                    ) : (
                      <span className="text-sm font-bold text-texto/50">{proximoJogo.jogo.timeCasa?.sigla || '?'}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-texto/60 font-medium truncate max-w-[80px]">
                    {proximoJogo.jogo.timeCasa?.nome || 'Time Casa'}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[12px] text-primaria-claro font-bold">
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
                  <span className="text-2xl font-bold text-texto">
                    {new Date(proximoJogo.jogo.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                  </span>
                  <span className="text-[9px] text-texto/30">
                    {proximoJogo.jogo.rodada
                      ? `Rodada ${proximoJogo.jogo.rodada}`
                      : proximoJogo.fase.nome.toLowerCase().includes('rodada')
                        ? proximoJogo.fase.nome
                        : ''}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="h-14 w-14 rounded-full bg-white/[0.05] flex items-center justify-center border border-white/[0.08] overflow-hidden">
                    {proximoJogo.jogo.timeFora?.escudo ? (
                      <img src={proximoJogo.jogo.timeFora.escudo} alt={proximoJogo.jogo.timeFora.nome} className="h-10 w-10 object-contain" />
                    ) : (
                      <span className="text-sm font-bold text-texto/50">{proximoJogo.jogo.timeFora?.sigla || '?'}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-texto/60 font-medium truncate max-w-[80px]">
                    {proximoJogo.jogo.timeFora?.nome || 'Time Fora'}
                  </span>
                </div>
              </div>
              {/* Aviso de palpite */}
              <p className="text-[11px] text-destaque/80 text-center mt-3">⚠️ Você ainda não palpitou para este jogo!</p>
              {/* Botão fazer palpite */}
              <button
                type="button"
                className="w-full mt-3 h-11 rounded-xl bg-gradient-to-r from-[#16a34a] to-[#22c55e] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(30,215,96,0.25)] hover:shadow-[0_0_24px_rgba(30,215,96,0.4)] transition-all active:scale-[0.97]"
              >
                <Target size={16} />
                Fazer palpite
              </button>
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

        {/* Ranking Geral */}
        <Card data-testid="grupo-card-ranking">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-primaria-claro" />
                <span className="text-[11px] text-texto/50 uppercase tracking-wider font-semibold">
                  Ranking Geral
                </span>
              </div>
              <button className="flex items-center gap-1 text-[11px] text-texto/40 border border-white/[0.08] px-2 py-1 rounded-md">
                Geral <ChevronDown size={10} />
              </button>
            </div>

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
                {restoRanking.map((item) => (
                  <div key={item.usuarioId} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/[0.02]">
                    <span className="text-[11px] text-texto/30 font-medium w-4 text-center">{item.posicao}</span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primaria/10 text-primaria text-[10px] font-bold">
                      {item.nomeUsuario.charAt(0)}
                    </div>
                    <span className="flex-1 text-sm text-texto/70">{item.nomeUsuario}</span>
                    <span className="text-sm text-texto/50 font-medium">{item.pontuacaoTotal} pts</span>
                    <Minus size={10} className="text-texto/20" />
                  </div>
                ))}
              </div>
            )}

            {(!rankingGeral || rankingGeral.length === 0) && (
              <p className="text-[11px] text-texto/30 text-center py-4">Nenhuma pontuação registrada ainda</p>
            )}

            {/* Link ver completo */}
            {rankingGeral && rankingGeral.length > 0 && (
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
