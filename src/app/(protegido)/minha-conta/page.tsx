'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  ChevronDown,
  ChevronRight,
  User,
  Lock,
  Bell,
  Shield,
  Download,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { atualizarUsuario, excluirUsuario } from '@/services/usuario.service';
import { FormularioPerfil } from '@/components/usuario/formulario-perfil';
import { FormularioAlterarSenha } from '@/components/usuario/formulario-alterar-senha';
import { SecaoExcluirConta } from '@/components/usuario/secao-excluir-conta';
import { TogglePush } from '@/components/notificacoes/toggle-push';
import { SinoNotificacoes } from '@/components/layout/sino-notificacoes';
import { TourPageWrapper, TourRefazerBotao } from '@/components/tour/tour-page-wrapper';

function obterIniciais(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export default function MinhaContaPage() {
  const router = useRouter();
  const usuario = useAuthStore((state) => state.usuario);
  const atualizarUsuarioStore = useAuthStore((state) => state.atualizarUsuario);
  const logout = useAuthStore((state) => state.logout);
  const [secaoAberta, setSecaoAberta] = useState<string | null>(null);

  if (!usuario) return null;

  function alternarSecao(secao: string) {
    setSecaoAberta(secaoAberta === secao ? null : secao);
  }

  async function aoAtualizarPerfil(dados: { nome?: string; email?: string }) {
    const atualizado = await atualizarUsuario(usuario!.id, dados);
    atualizarUsuarioStore(atualizado);
  }

  async function aoAlterarSenha(novaSenha: string) {
    await atualizarUsuario(usuario!.id, { senha: novaSenha });
  }

  async function aoExcluirConta() {
    await excluirUsuario(usuario!.id);
    await logout();
    router.replace('/login');
  }

  async function aoSair() {
    await logout();
    router.replace('/login');
  }

  return (
    <div className="min-h-screen bg-fundo pb-24">
      <TourPageWrapper />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-fundo/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="mx-auto max-w-[480px] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primaria/30 bg-primaria/[0.08]">
              <User
                size={20}
                className="text-primaria-claro drop-shadow-[0_0_10px_rgba(34,211,94,0.8)]"
              />
            </div>
            <h1 className="text-xl font-bold text-texto">Minha Conta</h1>
          </div>
          <div className="flex items-center gap-2">
            <TourRefazerBotao />
            <SinoNotificacoes />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[480px] px-4 pt-6 space-y-5">
        {/* Card do perfil */}
        <div
          data-tour="conta-perfil"
          className="rounded-2xl border border-primaria/20 bg-gradient-to-br from-primaria/[0.04] to-transparent p-5"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primaria/15 border border-primaria/30 text-primaria font-bold text-xl shadow-[0_0_20px_rgba(22,163,74,0.2)]">
              {obterIniciais(usuario.nome)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-texto text-lg truncate">{usuario.nome}</p>
              <p className="text-sm text-texto/40 truncate">{usuario.email}</p>
              {usuario.perfil === 'SUPER_ADMIN' && (
                <span className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded border text-primaria-claro/80 bg-primaria/10 border-primaria/25">
                  Super Admin
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Menu de seções (estilo iOS settings) */}
        <div className="space-y-2">
          {/* Dados pessoais */}
          <div data-tour="conta-dados-pessoais">
            <SecaoAcordeon
              titulo="Dados pessoais"
              icone={<User size={18} className="text-primaria-claro" />}
              aberta={secaoAberta === 'perfil'}
              onToggle={() => alternarSecao('perfil')}
            >
              <FormularioPerfil usuario={usuario} onSubmit={aoAtualizarPerfil} />
            </SecaoAcordeon>
          </div>

          {/* Alterar senha */}
          <div data-tour="conta-alterar-senha">
            <SecaoAcordeon
              titulo="Alterar senha"
              icone={<Lock size={18} className="text-destaque" />}
              aberta={secaoAberta === 'senha'}
              onToggle={() => alternarSecao('senha')}
            >
              <FormularioAlterarSenha onSubmit={aoAlterarSenha} />
            </SecaoAcordeon>
          </div>

          {/* Notificações */}
          <div data-tour="conta-notificacoes">
            <SecaoAcordeon
              titulo="Notificações push"
              icone={<Bell size={18} className="text-blue-400" />}
              aberta={secaoAberta === 'notificacoes'}
              onToggle={() => alternarSecao('notificacoes')}
            >
              <TogglePush />
            </SecaoAcordeon>
          </div>

          {/* Admin — visível apenas para SUPER_ADMIN */}
          {usuario.perfil === 'SUPER_ADMIN' && (
            <SecaoAcordeon
              titulo="Administração"
              icone={<Shield size={18} className="text-purple-400" />}
              aberta={secaoAberta === 'admin'}
              onToggle={() => alternarSecao('admin')}
            >
              <button
                type="button"
                onClick={() => router.push('/admin/importar')}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] transition-colors"
              >
                <div className="h-9 w-9 rounded-lg bg-primaria/15 flex items-center justify-center">
                  <Download size={18} className="text-primaria" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-texto">Importar jogos</p>
                  <p className="text-[10px] text-texto/40">
                    Importar rodadas da API externa
                  </p>
                </div>
                <ChevronRight size={16} className="text-texto/25" />
              </button>
            </SecaoAcordeon>
          )}
        </div>

        {/* Botão de sair */}
        <button
          type="button"
          onClick={aoSair}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-erro/20 bg-erro/[0.03] text-erro/70 hover:text-erro hover:bg-erro/[0.06] hover:border-erro/30 transition-all"
          data-testid="btn-logout"
        >
          <LogOut size={18} />
          <span className="text-sm font-semibold">Sair da conta</span>
        </button>

        {/* Zona de perigo — colapsável */}
        <div data-tour="conta-zona-perigo" className="rounded-2xl border border-erro/20 bg-erro/[0.02] overflow-hidden">
          <button
            type="button"
            onClick={() => alternarSecao('perigo')}
            className="w-full flex items-center gap-3 px-4 py-3 text-left"
          >
            <span className="text-[10px] text-erro/60 uppercase tracking-[0.12em] font-bold flex-1">
              Zona de perigo
            </span>
            <ChevronDown
              size={14}
              className={`text-erro/30 transition-transform duration-200 ${secaoAberta === 'perigo' ? 'rotate-180' : ''}`}
            />
          </button>
          {secaoAberta === 'perigo' && (
            <div className="px-4 pb-4 border-t border-erro/10 animate-[fadeIn_0.2s_ease-out]">
              <SecaoExcluirConta onConfirmar={aoExcluirConta} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Componente acordeon para seções */
function SecaoAcordeon({
  titulo,
  icone,
  aberta,
  onToggle,
  children,
}: Readonly<{
  titulo: string;
  icone: React.ReactNode;
  aberta: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}>) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08]">
          {icone}
        </div>
        <span className="flex-1 text-sm font-semibold text-texto">{titulo}</span>
        <ChevronDown
          size={16}
          className={`text-texto/30 transition-transform duration-200 ${aberta ? 'rotate-180' : ''}`}
        />
      </button>

      {aberta && (
        <div className="px-4 pb-4 pt-1 border-t border-white/[0.05] animate-[fadeIn_0.2s_ease-out]">
          {children}
        </div>
      )}
    </div>
  );
}
