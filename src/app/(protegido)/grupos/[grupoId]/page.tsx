'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Users, Copy, Check, Share2, Settings,
  Lock, Globe, ChevronRight, Trophy, Calendar, Activity
} from 'lucide-react';
import { buscarGrupo, listarMembros, sairDoGrupo } from '@/services/grupo.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ModalConfirmacao } from '@/components/ui/modal-confirmacao';

export default function DetalhesGrupoPage() {
  const router = useRouter();
  const params = useParams();
  const grupoId = params.grupoId as string;
  const queryClient = useQueryClient();

  const [copiado, setCopiado] = useState(false);
  const [modalSair, setModalSair] = useState(false);
  const [processando, setProcessando] = useState(false);

  const { data: grupo, isLoading: carregandoGrupo } = useQuery({
    queryKey: ['grupo', grupoId],
    queryFn: () => buscarGrupo(grupoId),
    enabled: !!grupoId,
  });

  const { data: membros } = useQuery({
    queryKey: ['grupo', grupoId, 'membros'],
    queryFn: () => listarMembros(grupoId),
    enabled: !!grupoId,
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

  // Mock data para ranking e atividade (será substituído por dados reais)
  const mockRanking = [
    { posicao: 1, nome: 'Cristiano', pontos: 32, admin: true },
    { posicao: 2, nome: 'Lucas', pontos: 28, admin: false },
    { posicao: 3, nome: 'Mestre', pontos: 26, admin: false },
  ];

  const mockAtividade = [
    { nome: 'Cristiano', acao: 'fez 5 palpites', tempo: 'Há 2h', inicial: 'C' },
    { nome: 'Lucas', acao: 'fez 3 palpites', tempo: 'Há 2h', inicial: 'L' },
    { nome: 'Mestre', acao: 'fez 4 palpites', tempo: 'Há 5h', inicial: 'M' },
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
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-texto" data-testid="grupo-detalhe-nome">{grupo.nome}</h1>
          <p className="text-[11px] text-texto/35 flex items-center gap-1">
            {grupo.privado ? <Lock size={10} /> : <Globe size={10} />}
            {grupo.privado ? 'Privado' : 'Público'} • {membros?.length ?? 0} membros
          </p>
        </div>
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

      <div className="mx-auto max-w-[480px] px-4 py-5 space-y-4">
        {/* Card Código de Convite */}
        {grupo.codigoConvite && (
          <Card className="border-primaria-claro/30 bg-primaria/[0.03]" data-testid="grupo-card-convite">
            <CardContent className="p-4">
              <p className="text-[10px] text-primaria-claro font-semibold uppercase tracking-wider mb-1">Código de convite</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-mono font-bold text-texto tracking-[0.2em]" data-testid="grupo-codigo-convite">
                  {grupo.codigoConvite}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copiarCodigo}
                    aria-label="Copiar código"
                    className="h-9 w-9 text-primaria-claro drop-shadow-[0_0_8px_rgba(34,211,94,0.6)] [&_svg]:size-5"
                    data-testid="grupo-btn-copiar-codigo"
                  >
                    {copiado ? <Check size={20} /> : <Copy size={20} />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={compartilhar}
                    aria-label="Compartilhar"
                    className="h-9 w-9 text-primaria-claro drop-shadow-[0_0_8px_rgba(34,211,94,0.6)] [&_svg]:size-5"
                    data-testid="grupo-btn-compartilhar"
                  >
                    <Share2 size={20} />
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-texto/30 mt-1">Compartilhe este código para convidar novos membros.</p>
            </CardContent>
          </Card>
        )}

        {/* Ranking da Rodada */}
        <Card data-testid="grupo-card-ranking">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy size={14} className="text-primaria-claro" />
                <span className="text-[11px] text-texto/50 uppercase tracking-wider font-semibold">
                  Ranking da Rodada 18
                </span>
              </div>
              <button className="text-[10px] text-primaria-claro/70 hover:text-primaria-claro flex items-center gap-0.5">
                Ver completo <ChevronRight size={10} />
              </button>
            </div>
            <div className="space-y-1">
              {mockRanking.map((item) => {
                let corPosicao = 'bg-texto/5 text-texto/30';
                if (item.posicao === 1) corPosicao = 'bg-destaque/20 text-destaque';
                else if (item.posicao === 2) corPosicao = 'bg-texto/10 text-texto/50';

                return (
                <div key={item.posicao} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/[0.02]">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${corPosicao}`}>
                    {item.posicao}
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primaria/10 text-primaria text-xs font-bold">
                    {item.nome.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-texto/80 font-medium">{item.nome}</span>
                      {item.admin && (
                        <span className="text-[9px] text-destaque/70 bg-destaque/10 px-1.5 py-0.5 rounded">Admin</span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-texto/60">{item.pontos} pts</span>
                </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Próximos Jogos */}
        <Card data-testid="grupo-card-proximos-jogos">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-primaria-claro" />
                <span className="text-[11px] text-texto/50 uppercase tracking-wider font-semibold">
                  Próximos Jogos
                </span>
              </div>
              <button className="text-[10px] text-primaria-claro/70 hover:text-primaria-claro flex items-center gap-0.5">
                Ver todos <ChevronRight size={10} />
              </button>
            </div>
            <div className="flex items-center justify-center py-4 gap-6">
              <div className="flex flex-col items-center gap-1">
                <div className="h-12 w-12 rounded-full bg-white/[0.05] flex items-center justify-center text-xl">🇧🇷</div>
                <span className="text-[10px] text-texto/40">Brasil</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-texto">18:00</span>
                <span className="text-[10px] text-texto/30">Hoje</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="h-12 w-12 rounded-full bg-white/[0.05] flex items-center justify-center text-xl">🇦🇷</div>
                <span className="text-[10px] text-texto/40">Argentina</span>
              </div>
            </div>
            <p className="text-[11px] text-destaque/70 text-center">✨ Você ainda não palpitou!</p>
          </CardContent>
        </Card>

        {/* Atividade Recente */}
        <Card data-testid="grupo-card-atividade">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={14} className="text-primaria-claro" />
              <span className="text-[11px] text-texto/50 uppercase tracking-wider font-semibold">
                Atividade Recente
              </span>
            </div>
            <div className="space-y-1">
              {mockAtividade.map((item) => (
                <div key={item.nome} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/[0.02]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primaria/10 text-primaria text-xs font-bold shrink-0">
                    {item.inicial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-texto/70">
                      <span className="font-medium text-texto/90">{item.nome}</span> {item.acao}
                    </p>
                    <p className="text-[10px] text-texto/30">{item.tempo}</p>
                  </div>
                  <ChevronRight size={14} className="text-texto/15 shrink-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Membros */}
        <Card data-testid="grupo-card-membros">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-primaria-claro" />
                <span className="text-[11px] text-texto/50 uppercase tracking-wider font-semibold">
                  Membros ({membros?.length ?? 0})
                </span>
              </div>
              <button className="text-[10px] text-primaria-claro/70 hover:text-primaria-claro flex items-center gap-0.5">
                Ver todos <ChevronRight size={10} />
              </button>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {membros?.slice(0, 4).map((membro, index) => (
                <div key={membro.id || `membro-${index}`} className="flex flex-col items-center gap-1 min-w-[56px]">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${
                    membro.role === 'ADMIN'
                      ? 'bg-primaria/15 text-primaria border-2 border-primaria/40'
                      : 'bg-white/[0.06] text-texto/60 border border-white/[0.1]'
                  }`}>
                    {membro.usuario?.nome?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <span className="text-[10px] text-texto/50 truncate max-w-[56px]">
                    {membro.usuario?.nome?.split(' ')[0] || 'Usuário'}
                  </span>
                  {membro.role === 'ADMIN' && (
                    <span className="text-[8px] text-primaria font-semibold">Admin</span>
                  )}
                </div>
              ))}
              {membros && membros.length > 4 && (
                <div className="flex flex-col items-center gap-1 min-w-[56px]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04] text-texto/30 text-xs font-medium border border-white/[0.08]">
                    +{membros.length - 4}
                  </div>
                </div>
              )}
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
