'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Users, LogIn, UserPlus, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { buscarInfoGrupoConvite, entrarNoGrupo } from '@/services/grupo.service';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';

export default function ConviteLinkPage() {
  const params = useParams();
  const router = useRouter();
  const codigo = params.codigo as string;

  const estaAutenticado = useAuthStore((state) => state.estaAutenticado);
  const estaCarregando = useAuthStore((state) => state.estaCarregando);

  const [entrando, setEntrando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const { data: grupo, isLoading, isError } = useQuery({
    queryKey: ['grupo-convite', codigo],
    queryFn: () => buscarInfoGrupoConvite(codigo),
    enabled: !!codigo,
    retry: false,
  });

  // Se autenticado e vindo de redirect (após login/cadastro), entrar automaticamente
  useEffect(() => {
    if (!estaCarregando && estaAutenticado && grupo && !sucesso && !entrando && !erro) {
      const autoEntrar = sessionStorage.getItem('convite_auto_entrar');
      if (autoEntrar === codigo) {
        sessionStorage.removeItem('convite_auto_entrar');
        handleEntrar();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estaCarregando, estaAutenticado, grupo]);

  async function handleEntrar() {
    setEntrando(true);
    setErro(null);
    try {
      await entrarNoGrupo(codigo);
      setSucesso(true);
      setTimeout(() => router.push('/grupos'), 2000);
    } catch (error: unknown) {
      const err = error as { statusCode?: number; mensagem?: string; message?: string };
      if (err?.statusCode === 409) {
        // Já é membro — redirecionar direto pro grupo
        setSucesso(true);
        setTimeout(() => router.push('/grupos'), 1500);
      } else {
        setErro(err?.mensagem || err?.message || 'Não foi possível entrar no grupo.');
      }
    } finally {
      setEntrando(false);
    }
  }

  function irParaLogin() {
    sessionStorage.setItem('convite_auto_entrar', codigo);
    router.push(`/login?redirect=/convite/${codigo}`);
  }

  function irParaCadastro() {
    sessionStorage.setItem('convite_auto_entrar', codigo);
    router.push(`/cadastro?redirect=/convite/${codigo}`);
  }

  if (estaCarregando || isLoading) {
    return (
      <div className="min-h-screen bg-fundo flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primaria" />
      </div>
    );
  }

  if (isError || !grupo) {
    return (
      <div className="min-h-screen bg-fundo flex flex-col items-center justify-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-erro/10 mb-4">
          <XCircle size={32} className="text-erro" />
        </div>
        <h1 className="text-lg font-semibold text-texto mb-2">Convite inválido</h1>
        <p className="text-sm text-texto/50 text-center max-w-[280px]">
          Este código de convite não existe ou o grupo foi desativado.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => router.push('/login')}
        >
          Ir para o app
        </Button>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-fundo flex flex-col items-center justify-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sucesso/10 mb-4">
          <CheckCircle2 size={32} className="text-sucesso" />
        </div>
        <h1 className="text-lg font-semibold text-texto mb-2">Você entrou no grupo!</h1>
        <p className="text-sm text-texto/50">Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fundo flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[380px] space-y-6">
        {/* Card do grupo */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl p-6 text-center shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primaria/[0.1] border border-primaria-claro/30">
              <Users size={28} className="text-primaria-claro" />
            </div>
          </div>

          <p className="text-[10px] text-primaria-claro font-bold uppercase tracking-[0.15em] mb-2">
            Você foi convidado para o bolão
          </p>

          <h1 className="text-2xl font-bold text-texto mb-2">{grupo.nome}</h1>

          <p className="text-sm text-texto/40 mb-6">
            Entre para fazer seus palpites com a galera!
          </p>

          {erro && (
            <div className="mb-4 rounded-xl border border-erro/30 bg-erro/10 px-4 py-3">
              <p className="text-sm text-erro">{erro}</p>
            </div>
          )}

          {estaAutenticado ? (
            <Button
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#16a34a] to-[#22c55e] text-white font-bold text-sm shadow-[0_0_20px_rgba(30,215,96,0.25)] hover:shadow-[0_0_30px_rgba(30,215,96,0.4)]"
              onClick={handleEntrar}
              disabled={entrando}
            >
              {entrando ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Entrando...
                </span>
              ) : (
                'Entrar no grupo'
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <Button
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#16a34a] to-[#22c55e] text-white font-bold text-sm shadow-[0_0_20px_rgba(30,215,96,0.25)] hover:shadow-[0_0_30px_rgba(30,215,96,0.4)]"
                onClick={irParaLogin}
              >
                <LogIn size={16} className="mr-2" />
                Entrar com minha conta
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 rounded-2xl border-white/[0.15] text-texto/80 hover:bg-white/[0.05]"
                onClick={irParaCadastro}
              >
                <UserPlus size={16} className="mr-2" />
                Criar conta e entrar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
