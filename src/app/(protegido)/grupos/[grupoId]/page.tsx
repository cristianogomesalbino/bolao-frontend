'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Users, Copy, Check, UserPlus, LogOut, Crown, Share2 } from 'lucide-react';
import { buscarGrupo, listarMembros, sairDoGrupo, removerMembro, adicionarMembro } from '@/services/grupo.service';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ModalConfirmacao } from '@/components/ui/modal-confirmacao';

export default function DetalhesGrupoPage() {
  const router = useRouter();
  const params = useParams();
  const grupoId = params.grupoId as string;
  const queryClient = useQueryClient();
  const usuario = useAuthStore((state) => state.usuario);

  const [copiado, setCopiado] = useState(false);
  const [emailAdicionar, setEmailAdicionar] = useState('');
  const [erroAdicionar, setErroAdicionar] = useState<string | null>(null);
  const [adicionando, setAdicionando] = useState(false);
  const [modalSair, setModalSair] = useState(false);
  const [modalRemover, setModalRemover] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);

  const { data: grupo, isLoading: carregandoGrupo } = useQuery({
    queryKey: ['grupo', grupoId],
    queryFn: () => buscarGrupo(grupoId),
    enabled: !!grupoId,
  });

  const { data: membros, isLoading: carregandoMembros } = useQuery({
    queryKey: ['grupo', grupoId, 'membros'],
    queryFn: () => listarMembros(grupoId),
    enabled: !!grupoId,
  });

  const meuMembro = membros?.find((m) => m.usuarioId === usuario?.id);
  const souAdmin = meuMembro?.role === 'ADMIN';

  async function aoSair() {
    setProcessando(true);
    try {
      await sairDoGrupo(grupoId);
      router.replace('/grupos');
    } finally {
      setProcessando(false);
      setModalSair(false);
    }
  }

  async function aoRemoverMembro(usuarioId: string) {
    setProcessando(true);
    try {
      await removerMembro(grupoId, usuarioId);
      await queryClient.invalidateQueries({ queryKey: ['grupo', grupoId, 'membros'] });
    } finally {
      setProcessando(false);
      setModalRemover(null);
    }
  }

  async function aoAdicionarMembro() {
    if (!emailAdicionar.trim()) return;
    setErroAdicionar(null);
    setAdicionando(true);
    try {
      await adicionarMembro(grupoId, emailAdicionar.trim());
      setEmailAdicionar('');
      await queryClient.invalidateQueries({ queryKey: ['grupo', grupoId, 'membros'] });
    } catch (error: any) {
      setErroAdicionar(error?.mensagem || 'Erro ao adicionar membro');
    } finally {
      setAdicionando(false);
    }
  }

  function copiarCodigo() {
    if (grupo?.codigoConvite) {
      navigator.clipboard.writeText(grupo.codigoConvite);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
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
    <div className="min-h-screen bg-fundo">
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
          <p className="text-[11px] text-texto/35">
            {grupo.privado ? 'Privado' : 'Público'} • máx {grupo.maxParticipantes}
          </p>
        </div>
        {!souAdmin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setModalSair(true)}
            aria-label="Sair do grupo"
            className="text-erro/60 hover:text-erro"
            data-testid="grupo-btn-sair"
          >
            <LogOut size={18} />
          </Button>
        )}
      </header>

      <div className="mx-auto max-w-[480px] px-4 py-5 space-y-4">
        {/* Código de convite */}
        {grupo.codigoConvite && (
          <Card data-testid="grupo-card-convite">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-texto/40 uppercase tracking-wider mb-1">Código de convite</p>
                  <p className="text-lg font-mono font-bold text-texto tracking-widest" data-testid="grupo-codigo-convite">
                    {grupo.codigoConvite}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copiarCodigo}
                    aria-label="Copiar código"
                    data-testid="grupo-btn-copiar-codigo"
                  >
                    {copiado ? <Check size={18} className="text-sucesso" /> : <Copy size={18} />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `Bolão - ${grupo.nome}`,
                          text: `Entre no meu bolão! Código: ${grupo.codigoConvite}`,
                        });
                      } else {
                        copiarCodigo();
                      }
                    }}
                    aria-label="Compartilhar"
                    data-testid="grupo-btn-compartilhar"
                  >
                    <Share2 size={18} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Adicionar membro (admin) */}
        {souAdmin && (
          <Card data-testid="grupo-card-adicionar">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserPlus size={14} />
                Adicionar membro
              </CardTitle>
            </CardHeader>
            <CardContent>
              {erroAdicionar && (
                <Alert variant="destructive" className="mb-3" data-testid="grupo-adicionar-alert-erro">
                  <AlertDescription>{erroAdicionar}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2">
                <Input
                  type="email"
                  inputMode="email"
                  placeholder="email@exemplo.com"
                  value={emailAdicionar}
                  onChange={(e) => setEmailAdicionar(e.target.value)}
                  data-testid="grupo-input-email-adicionar"
                />
                <Button
                  onClick={aoAdicionarMembro}
                  disabled={adicionando || !emailAdicionar.trim()}
                  data-testid="grupo-btn-adicionar-membro"
                >
                  {adicionando ? '...' : 'Adicionar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de membros */}
        <Card data-testid="grupo-card-membros">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users size={14} />
              Membros ({membros?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {carregandoMembros ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 rounded-lg bg-white/[0.03] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-1" data-testid="grupo-lista-membros">
                {membros?.map((membro, index) => (
                  <div
                    key={membro.id || `membro-${index}`}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/[0.02] transition-colors"
                    data-testid={`grupo-membro-${membro.usuarioId}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primaria/10 text-primaria text-xs font-bold">
                        {membro.usuario?.nome?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm text-texto/80">{membro.usuario?.nome || 'Usuário'}</p>
                        {membro.role === 'ADMIN' && (
                          <div className="flex items-center gap-1">
                            <Crown size={10} className="text-destaque/70" />
                            <span className="text-[10px] text-destaque/60">Admin</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {souAdmin && membro.usuarioId !== usuario?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setModalRemover(membro.usuarioId)}
                        className="text-erro/50 hover:text-erro text-xs h-7"
                        data-testid={`grupo-btn-remover-${membro.usuarioId}`}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
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

      {/* Modal remover membro */}
      <ModalConfirmacao
        aberto={!!modalRemover}
        titulo="Remover membro"
        mensagem="Tem certeza que deseja remover este membro do grupo?"
        textoBotaoConfirmar="Remover"
        variante="destructive"
        carregando={processando}
        onConfirmar={() => modalRemover && aoRemoverMembro(modalRemover)}
        onCancelar={() => setModalRemover(null)}
      />
    </div>
  );
}
