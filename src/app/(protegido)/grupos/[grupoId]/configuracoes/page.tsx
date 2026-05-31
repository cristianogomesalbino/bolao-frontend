'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Pencil, Users, Copy,
  Trash2, ChevronRight, Crown, MoreVertical, ChevronDown, LogOut
} from 'lucide-react';
import { buscarGrupo, excluirGrupo, sairDoGrupo, listarMembros, removerMembro, promoverAdmin, rebaixarMembro } from '@/services/grupo.service';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { ModalConfirmacao } from '@/components/ui/modal-confirmacao';

interface ItemConfiguracao {
  icone: React.ReactNode;
  titulo: string;
  descricao: string;
  onClick: () => void;
}

export default function ConfiguracoesGrupoPage() {
  const router = useRouter();
  const params = useParams();
  const grupoId = params.grupoId as string;
  const queryClient = useQueryClient();

  const [modalExcluir, setModalExcluir] = useState(false);
  const [modalSair, setModalSair] = useState(false);
  const [zonaPerigo, setZonaPerigo] = useState(false);
  const [modalRemover, setModalRemover] = useState<string | null>(null);
  const [modalAdmin, setModalAdmin] = useState<string | null>(null);
  const [modalRebaixar, setModalRebaixar] = useState<string | null>(null);
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);

  const usuario = useAuthStore((state) => state.usuario);

  const { data: grupo, isLoading } = useQuery({
    queryKey: ['grupo', grupoId],
    queryFn: () => buscarGrupo(grupoId),
    enabled: !!grupoId,
  });

  const { data: membros } = useQuery({
    queryKey: ['grupo', grupoId, 'membros'],
    queryFn: () => listarMembros(grupoId),
    enabled: !!grupoId,
  });

  async function aoExcluir() {
    setProcessando(true);
    try {
      await excluirGrupo(grupoId);
      await queryClient.invalidateQueries({ queryKey: ['grupos'] });
      router.replace('/grupos');
    } finally {
      setProcessando(false);
      setModalExcluir(false);
    }
  }

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

  async function aoPromoverAdmin(usuarioId: string) {
    setProcessando(true);
    try {
      await promoverAdmin(grupoId, usuarioId);
      await queryClient.invalidateQueries({ queryKey: ['grupo', grupoId, 'membros'] });
    } finally {
      setProcessando(false);
      setModalAdmin(null);
    }
  }

  async function aoRebaixar(usuarioId: string) {
    setProcessando(true);
    try {
      await rebaixarMembro(grupoId, usuarioId);
      await queryClient.invalidateQueries({ queryKey: ['grupo', grupoId, 'membros'] });
    } finally {
      setProcessando(false);
      setModalRebaixar(null);
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

  // Determinar role do usuário logado no grupo
  const meuMembro = membros?.find((m) => m.usuarioId === usuario?.id || m.usuario?.id === usuario?.id);
  const souAdmin = meuMembro?.role === 'ADMIN';

  const itens: ItemConfiguracao[] = [
    ...(souAdmin ? [
      {
        icone: <Pencil size={18} />,
        titulo: 'Editar grupo',
        descricao: 'Nome, foto, descrição',
        onClick: () => router.push(`/grupos/${grupoId}/editar`),
      },
      {
        icone: <Copy size={18} />,
        titulo: 'Gerar novo convite',
        descricao: grupo.codigoConvite ?? '—',
        onClick: () => router.push(`/grupos/${grupoId}/convite`),
      },
    ] : []),
  ];

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
        <h1 className="text-lg font-semibold text-texto">Configurações do grupo</h1>
      </header>

      <div className="mx-auto max-w-[480px] px-4 py-5 flex flex-col min-h-[calc(100vh-60px)] gap-3 pb-20">
        {/* Itens principais */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.05]">
          {itens.map((item) => (
            <button
              key={item.titulo}
              type="button"
              onClick={item.onClick}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-primaria-claro drop-shadow-[0_0_6px_rgba(34,211,94,0.4)]">
                {item.icone}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-texto/80">{item.titulo}</p>
                {item.descricao && (
                  <p className="text-[10px] text-texto/35 truncate">{item.descricao}</p>
                )}
              </div>
              <ChevronRight size={16} className="text-texto/20 shrink-0" />
            </button>
          ))}
        </div>

        {/* Membros */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-primaria-claro" />
              <span className="text-sm font-medium text-texto/80">Membros</span>
            </div>
            <span className="text-[11px] text-texto/30">{membros?.length ?? 0} / {grupo.maxParticipantes}</span>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {membros?.map((membro) => {
              const membroId = membro.usuarioId || membro.usuario?.id || '';

              return (
                <div
                  key={membroId}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                      membro.role === 'ADMIN'
                        ? 'bg-primaria/15 text-primaria border border-primaria/30'
                        : 'bg-white/[0.06] text-texto/60 border border-white/[0.1]'
                    }`}>
                      {membro.usuario?.nome?.charAt(0).toUpperCase() || '?'}
                    </div>
                    {membro.role === 'ADMIN' && (
                      <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primaria border border-fundo">
                        <Crown size={7} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-texto/80 font-medium truncate">
                        {membro.usuario?.nome || 'Usuário'}
                      </span>
                      {membro.role === 'ADMIN' && (
                        <span className="text-[9px] text-destaque/70 bg-destaque/10 px-1.5 py-0.5 rounded font-medium">Admin</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primaria" />
                      <span className="text-[10px] text-texto/30">Online</span>
                    </div>
                  </div>

                  {/* Menu 3 pontinhos — só para admins */}
                  {souAdmin && (
                  <div className="relative">
                      <button
                        type="button"
                        onClick={() => setMenuAberto(menuAberto === membroId ? null : membroId)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-texto/25 hover:text-texto/50 hover:bg-white/[0.05] transition-all"
                        aria-label="Opções"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {menuAberto === membroId && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuAberto(null)} aria-hidden="true" />
                          <div className="absolute right-0 bottom-full mb-1 z-50 w-40 rounded-xl border border-white/[0.1] bg-[#0d1a2d] shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden animate-[fadeIn_0.15s_ease-out]">
                            {membro.role === 'ADMIN' ? (
                              <button
                                type="button"
                                onClick={() => { setMenuAberto(null); setModalRebaixar(membroId); }}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-texto/70 hover:bg-white/[0.05] transition-colors"
                              >
                                <Crown size={13} className="text-texto/30" />
                                Remover admin
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => { setMenuAberto(null); setModalAdmin(membroId); }}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-texto/70 hover:bg-white/[0.05] transition-colors"
                              >
                                <Crown size={13} className="text-destaque/70" />
                                Tornar admin
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => { setMenuAberto(null); setModalRemover(membroId); }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-erro/70 hover:bg-erro/[0.05] transition-colors"
                            >
                              <Trash2 size={13} />
                              Remover
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Zona de perigo — colapsável */}
        <div className="rounded-2xl border border-erro/20 bg-erro/[0.02] overflow-hidden mt-auto mb-4">
          <button
            type="button"
            onClick={() => setZonaPerigo(!zonaPerigo)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left"
          >
            <span className="text-erro/50">⚠️</span>
            <span className="text-[11px] text-erro/60 uppercase tracking-wider font-semibold flex-1">Zona de perigo</span>
            <ChevronDown size={14} className={`text-erro/30 transition-transform duration-200 ${zonaPerigo ? 'rotate-180' : ''}`} />
          </button>

          {zonaPerigo && (
            <div className="px-4 pb-4 pt-1 border-t border-erro/10 animate-[fadeIn_0.2s_ease-out]">
              {souAdmin ? (
                <button
                  type="button"
                  onClick={() => setModalExcluir(true)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-erro/[0.05] transition-colors"
                >
                  <Trash2 size={16} className="text-erro/70" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-erro/80">Excluir grupo</p>
                    <p className="text-[10px] text-erro/40">Esta ação não pode ser desfeita</p>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setModalSair(true)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-erro/[0.05] transition-colors"
                >
                  <LogOut size={16} className="text-erro/70" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-erro/80">Sair do grupo</p>
                    <p className="text-[10px] text-erro/40">Você poderá entrar novamente com um convite</p>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal excluir */}
      <ModalConfirmacao
        aberto={modalExcluir}
        titulo="Excluir grupo"
        mensagem="Esta ação não pode ser desfeita. Todos os dados do grupo serão perdidos permanentemente."
        textoBotaoConfirmar="Excluir"
        variante="destructive"
        carregando={processando}
        onConfirmar={aoExcluir}
        onCancelar={() => setModalExcluir(false)}
      />

      {/* Modal sair */}
      <ModalConfirmacao
        aberto={modalSair}
        titulo="Sair do grupo"
        mensagem="Você será removido do grupo. Para entrar novamente, precisará de um novo convite."
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

      {/* Modal tornar admin */}
      <ModalConfirmacao
        aberto={!!modalAdmin}
        titulo="Tornar administrador"
        mensagem="Este membro terá permissão para gerenciar o grupo."
        textoBotaoConfirmar="Tornar admin"
        variante="default"
        carregando={processando}
        onConfirmar={() => modalAdmin && aoPromoverAdmin(modalAdmin)}
        onCancelar={() => setModalAdmin(null)}
      />

      {/* Modal remover admin */}
      <ModalConfirmacao
        aberto={!!modalRebaixar}
        titulo="Remover administrador"
        mensagem="Este membro perderá as permissões de administrador."
        textoBotaoConfirmar="Remover admin"
        variante="destructive"
        carregando={processando}
        onConfirmar={() => modalRebaixar && aoRebaixar(modalRebaixar)}
        onCancelar={() => setModalRebaixar(null)}
      />
    </div>
  );
}
