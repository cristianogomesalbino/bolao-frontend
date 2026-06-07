'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Users, Crown, Trash2, Lock, Globe, MoreVertical, Search } from 'lucide-react';
import { buscarGrupo, listarMembros, removerMembro, promoverAdmin, rebaixarMembro } from '@/services/grupo.service';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { ModalConfirmacao } from '@/components/ui/modal-confirmacao';

export default function MembrosGrupoPage() {
  const router = useRouter();
  const params = useParams();
  const grupoId = params.grupoId as string;
  const queryClient = useQueryClient();
  const usuario = useAuthStore((state) => state.usuario);

  const [busca, setBusca] = useState('');
  const [modalRemover, setModalRemover] = useState<string | null>(null);
  const [modalAdmin, setModalAdmin] = useState<string | null>(null);
  const [modalRebaixar, setModalRebaixar] = useState<string | null>(null);
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);

  const { data: grupo } = useQuery({
    queryKey: ['grupo', grupoId],
    queryFn: () => buscarGrupo(grupoId),
    enabled: !!grupoId,
  });

  const { data: membros, isLoading } = useQuery({
    queryKey: ['grupo', grupoId, 'membros'],
    queryFn: () => listarMembros(grupoId),
    enabled: !!grupoId,
  });

  const totalMembros = membros?.length ?? 0;
  const maxParticipantes = grupo?.maxParticipantes ?? 50;
  const vagasDisponiveis = maxParticipantes - totalMembros;

  const membrosFiltrados = membros?.filter((m) => {
    if (!busca.trim()) return true;
    const termo = busca.toLowerCase();
    return m.usuario?.nome?.toLowerCase().includes(termo) || m.usuario?.email?.toLowerCase().includes(termo);
  });

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
      console.log('Promovendo admin:', { grupoId, usuarioId });
      await promoverAdmin(grupoId, usuarioId);
      await queryClient.invalidateQueries({ queryKey: ['grupo', grupoId, 'membros'] });
    } catch (error) {
      console.error('Erro ao promover admin:', error);
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
    } catch (error) {
      console.error('Erro ao rebaixar membro:', error);
    } finally {
      setProcessando(false);
      setModalRebaixar(null);
    }
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
          <h1 className="text-lg font-semibold text-texto">Gerenciar membros</h1>
          <p className="text-[11px] text-texto/35 flex items-center gap-1">
            {grupo?.nome}
            {grupo?.privado ? <Lock size={9} /> : <Globe size={9} />}
            {grupo?.privado ? 'Privado' : 'Público'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08]">
          <Users size={14} className="text-primaria-claro" />
          <span className="text-[12px] font-semibold text-texto/70">{totalMembros}</span>
        </div>
      </header>

      <div className="mx-auto max-w-[480px] px-4 py-5 space-y-4">
        {/* Card membros / vagas */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primaria/[0.1] border border-primaria/30">
                <Users size={20} className="text-primaria-claro" />
              </div>
              <div>
                <p className="text-[11px] text-texto/40 font-medium">Membros</p>
                <p className="text-xl font-bold text-texto">
                  {totalMembros} <span className="text-texto/30 font-normal">/ {maxParticipantes}</span>
                </p>
              </div>
            </div>
          </div>
          {/* Barra de progresso */}
          <div className="mt-3">
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-primaria transition-all"
                style={{ width: `${(totalMembros / maxParticipantes) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-texto/30 mt-1.5">{vagasDisponiveis} vagas disponíveis</p>
          </div>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-texto/25" />
          <input
            type="text"
            placeholder="Buscar membros..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-texto placeholder:text-texto/25 focus:outline-none focus:border-primaria/40 transition-colors"
            data-testid="membros-busca"
          />
        </div>

        {/* Lista de membros */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] text-texto/40 font-medium">Membros do grupo</span>
            <span className="text-[11px] text-texto/30">{membrosFiltrados?.length ?? 0} membro{(membrosFiltrados?.length ?? 0) !== 1 ? 's' : ''}</span>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2" data-testid="membros-lista">
              {membrosFiltrados?.map((membro) => (
                <div
                  key={membro.id || membro.usuarioId || membro.usuario?.id}
                  className="relative flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.03] transition-colors"
                  data-testid={`membro-${membro.usuarioId || membro.usuario?.id}`}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${
                      membro.role === 'ADMIN'
                        ? 'bg-primaria/20 text-primaria border-2 border-primaria/40'
                        : 'bg-white/[0.06] text-texto/60 border border-white/[0.1]'
                    }`}>
                      {membro.usuario?.nome?.charAt(0).toUpperCase() || '?'}
                    </div>
                    {membro.role === 'ADMIN' && (
                      <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primaria border border-fundo">
                        <Crown size={8} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-texto/90 font-semibold truncate">
                        {membro.usuario?.nome || 'Usuário'}
                      </span>
                      {membro.role === 'ADMIN' && (
                        <div className="flex items-center gap-1">
                          <Crown size={10} className="text-destaque" />
                          <span className="text-[10px] text-destaque font-medium">Admin</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primaria" />
                      <span className="text-[10px] text-texto/35">Último acesso: hoje</span>
                    </div>
                  </div>

                  {/* Menu 3 pontinhos */}
                  {(membro.usuarioId || membro.usuario?.id) !== usuario?.id && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => { const id = membro.usuarioId || membro.usuario?.id || ''; setMenuAberto(menuAberto === id ? null : id); }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-texto/30 hover:text-texto/60 hover:bg-white/[0.05] transition-all"
                        aria-label="Opções"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {menuAberto === (membro.usuarioId || membro.usuario?.id) && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuAberto(null)} aria-hidden="true" />
                          <div className="absolute right-0 top-9 z-50 w-44 rounded-xl border border-white/[0.1] bg-[#0d1a2d] shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden animate-[fadeIn_0.15s_ease-out]">
                            {membro.role !== 'ADMIN' ? (
                              <button
                                type="button"
                                onClick={() => { setMenuAberto(null); setModalAdmin(membro.usuarioId || membro.usuario?.id || ''); }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-texto/70 hover:bg-white/[0.05] transition-colors"
                              >
                                <Crown size={14} className="text-destaque/70" />
                                Tornar admin
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => { setMenuAberto(null); setModalRebaixar(membro.usuarioId || membro.usuario?.id || ''); }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-texto/70 hover:bg-white/[0.05] transition-colors"
                              >
                                <Crown size={14} className="text-texto/30" />
                                Remover admin
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => { setMenuAberto(null); setModalRemover(membro.usuarioId || membro.usuario?.id || ''); }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-erro/70 hover:bg-erro/[0.05] transition-colors"
                            >
                              <Trash2 size={14} />
                              Remover
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Busca vazia */}
          {!isLoading && membrosFiltrados?.length === 0 && busca.trim() && (
            <div className="flex flex-col items-center py-8 text-center">
              <Search size={24} className="text-texto/15 mb-2" />
              <p className="text-sm text-texto/35">Nenhum membro encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal remover */}
      <ModalConfirmacao
        aberto={!!modalRemover}
        titulo="Remover membro"
        mensagem="Tem certeza que deseja remover este membro do grupo? Ele perderá acesso aos palpites e ranking."
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
        mensagem="Este membro terá permissão para gerenciar o grupo, adicionar/remover membros e alterar configurações."
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
        mensagem="Este membro perderá as permissões de administrador e voltará a ser um membro comum."
        textoBotaoConfirmar="Remover admin"
        variante="destructive"
        carregando={processando}
        onConfirmar={() => modalRebaixar && aoRebaixar(modalRebaixar)}
        onCancelar={() => setModalRebaixar(null)}
      />
    </div>
  );
}
