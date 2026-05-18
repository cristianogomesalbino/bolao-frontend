'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { atualizarUsuario, excluirUsuario } from '@/services/usuario.service';
import { FormularioPerfil } from '@/components/usuario/formulario-perfil';
import { FormularioAlterarSenha } from '@/components/usuario/formulario-alterar-senha';
import { SecaoExcluirConta } from '@/components/usuario/secao-excluir-conta';
import { Button } from '@/components/ui/button';

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

  if (!usuario) return null;

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

  return (
    <div className="min-h-screen bg-fundo">
      {/* Header sticky com blur */}
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
        <h1 className="text-lg font-semibold text-texto">Minha conta</h1>
      </header>

      <div className="mx-auto max-w-[480px] px-4 py-6">
        {/* Avatar com iniciais */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primaria/15 text-primaria font-bold text-xl shadow-[0_0_20px_rgba(22,163,74,0.15)]">
            {obterIniciais(usuario.nome)}
          </div>
          <div>
            <p className="font-semibold text-texto text-lg">{usuario.nome}</p>
            <p className="text-sm text-texto/40">{usuario.email}</p>
          </div>
        </div>

        {/* Formulários */}
        <div className="space-y-5">
          <FormularioPerfil usuario={usuario} onSubmit={aoAtualizarPerfil} />
          <FormularioAlterarSenha onSubmit={aoAlterarSenha} />
          <SecaoExcluirConta onConfirmar={aoExcluirConta} />
        </div>
      </div>
    </div>
  );
}
