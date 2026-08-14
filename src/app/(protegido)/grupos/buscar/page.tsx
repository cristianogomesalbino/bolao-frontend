'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Globe,
  Search,
  Users,
  Loader2,
  Ticket,
} from 'lucide-react';
import {
  listarGruposPublicos,
  entrarNoGrupo,
  listarGrupos,
  buscarInfoGrupoConvite,
} from '@/services/grupo.service';
import type { InfoGrupoConvite } from '@/services/grupo.service';
import type { Grupo } from '@/types/grupo.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

type AbaAtiva = 'publicos' | 'convite';

export default function BuscarGruposPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [aba, setAba] = useState<AbaAtiva>('publicos');
  const [busca, setBusca] = useState('');
  const [entrando, setEntrando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const { data: grupos, isLoading } = useQuery({
    queryKey: ['grupos-publicos', busca],
    queryFn: () => listarGruposPublicos(busca || undefined),
    staleTime: 1000 * 30,
    enabled: aba === 'publicos',
  });

  const { data: meusGrupos } = useQuery({
    queryKey: ['grupos'],
    queryFn: listarGrupos,
    staleTime: 1000 * 60,
  });

  const meusGruposIds = new Set(meusGrupos?.map((g) => g.id) ?? []);

  async function aoEntrarGrupo(grupo: Grupo) {
    setErro(null);
    setSucesso(null);

    if (!grupo.codigoConvite) {
      setErro(
        'Este grupo não possui código de convite. Peça ao administrador para gerar um.',
      );
      return;
    }

    setEntrando(grupo.id);
    try {
      await entrarNoGrupo(grupo.codigoConvite);
      await queryClient.invalidateQueries({ queryKey: ['grupos'] });
      await queryClient.invalidateQueries({ queryKey: ['grupos-publicos'] });
      setSucesso(`Você entrou no grupo "${grupo.nome}"!`);
      setTimeout(() => router.push(`/grupos/${grupo.id}`), 1500);
    } catch (error: unknown) {
      const err = error as {
        statusCode?: number;
        mensagem?: string;
        message?: string;
      };
      if (err?.statusCode === 409) {
        setErro('Você já está neste grupo');
      } else {
        setErro(
          err?.mensagem || err?.message || 'Não foi possível entrar no grupo',
        );
      }
    } finally {
      setEntrando(null);
    }
  }

  async function aoEntrarPorCodigo(codigo: string) {
    setErro(null);
    setSucesso(null);
    setEntrando('convite');

    try {
      await entrarNoGrupo(codigo);
      await queryClient.invalidateQueries({ queryKey: ['grupos'] });
      setSucesso('Você entrou no grupo! Redirecionando...');
      setTimeout(() => router.push('/grupos'), 1500);
    } catch (error: unknown) {
      const err = error as {
        statusCode?: number;
        mensagem?: string;
        message?: string;
      };
      if (err?.statusCode === 409) {
        setErro('Você já está neste grupo');
      } else if (err?.statusCode === 404) {
        setErro('Código de convite inválido. Verifique e tente novamente.');
      } else {
        setErro(
          err?.mensagem || err?.message || 'Não foi possível entrar no grupo',
        );
      }
    } finally {
      setEntrando(null);
    }
  }

  return (
    <div className="min-h-screen bg-fundo pb-24">
      <header className="sticky top-0 z-20 bg-fundo/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="mx-auto max-w-[480px] px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.12] text-texto/50 hover:text-texto transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1" data-dica="grupos-publicos-titulo">
              <h1 className="text-lg font-bold text-texto">Encontrar Grupos</h1>
              <p className="text-[10px] text-texto/30">
                Busque grupos públicos ou entre com código de convite
              </p>
            </div>
          </div>
          <div
            className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]"
            data-dica="grupos-publicos-abas"
          >
            <button
              type="button"
              onClick={() => { setAba('publicos'); setErro(null); setSucesso(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[11px] font-semibold transition-all ${aba === 'publicos' ? 'bg-primaria/20 text-primaria-claro border border-primaria/30' : 'text-texto/50 hover:text-texto/70'}`}
            >
              <Globe size={13} />
              Grupos Públicos
            </button>
            <button
              type="button"
              onClick={() => { setAba('convite'); setErro(null); setSucesso(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[11px] font-semibold transition-all ${aba === 'convite' ? 'bg-primaria/20 text-primaria-claro border border-primaria/30' : 'text-texto/50 hover:text-texto/70'}`}
              data-dica="grupos-publicos-aba-convite"
            >
              <Ticket size={13} />
              Código de Convite
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[480px] px-4 pt-4 space-y-3">
        {erro && (
          <Alert variant="destructive">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}
        {sucesso && (
          <Alert className="border-sucesso/50 bg-sucesso/10 text-sucesso">
            <AlertDescription>✓ {sucesso}</AlertDescription>
          </Alert>
        )}

        {aba === 'publicos' && (
          <SecaoGruposPublicos
            busca={busca}
            onBuscaChange={setBusca}
            grupos={grupos}
            isLoading={isLoading}
            meusGruposIds={meusGruposIds}
            entrando={entrando}
            onEntrar={aoEntrarGrupo}
          />
        )}

        {aba === 'convite' && (
          <SecaoCodigoConvite
            onEntrar={aoEntrarPorCodigo}
            entrando={entrando === 'convite'}
          />
        )}
      </div>
    </div>
  );
}

/** Seção de busca e listagem de grupos públicos */
function SecaoGruposPublicos({
  busca,
  onBuscaChange,
  grupos,
  isLoading,
  meusGruposIds,
  entrando,
  onEntrar,
}: Readonly<{
  busca: string;
  onBuscaChange: (valor: string) => void;
  grupos: Grupo[] | undefined;
  isLoading: boolean;
  meusGruposIds: Set<string>;
  entrando: string | null;
  onEntrar: (grupo: Grupo) => void;
}>) {
  return (
    <>
      <div className="relative" data-dica="grupos-publicos-busca">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-texto/30"
        />
        <Input
          type="text"
          placeholder="Buscar por nome do grupo..."
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          className="pl-9 h-10 text-sm"
          data-testid="grupos-publicos-input-busca"
        />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[80px] rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse"
            />
          ))}
        </div>
      )}

      {!isLoading && grupos && grupos.length > 0 && (
        <div
          className="space-y-3"
          data-testid="grupos-publicos-lista"
          data-dica="grupos-publicos-lista"
        >
          {grupos.map((grupo: Grupo) => (
            <div
              key={grupo.id}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition-all hover:bg-white/[0.05]"
              data-testid={`grupo-publico-${grupo.id}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primaria/30 bg-primaria/[0.1] shrink-0">
                  <Globe size={20} className="text-primaria" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[15px] font-semibold text-texto truncate block">
                    {grupo.nome}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 text-texto/40">
                    <Users size={12} />
                    <span className="text-[11px]">
                      {grupo.totalParticipantes ?? 0} participantes
                    </span>
                    {grupo.maxParticipantes != null &&
                      grupo.maxParticipantes > 0 && (
                        <>
                          <span className="text-texto/20 mx-0.5">•</span>
                          <span className="text-[11px]">
                            máx. {grupo.maxParticipantes}
                          </span>
                        </>
                      )}
                  </div>
                </div>
                <BotaoEntrarGrupo
                  grupo={grupo}
                  jaParticipa={meusGruposIds.has(grupo.id)}
                  entrando={entrando === grupo.id}
                  onEntrar={() => onEntrar(grupo)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && grupos?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04] mb-4">
            <Globe size={24} className="text-texto/20" />
          </div>
          <p className="text-texto/50 font-medium mb-1">
            {busca ? 'Nenhum grupo encontrado' : 'Nenhum grupo público disponível'}
          </p>
          <p className="text-texto/30 text-sm max-w-[260px]">
            {busca
              ? `Não encontramos grupos com "${busca}". Tente outro termo.`
              : 'Ainda não há grupos públicos para entrar.'}
          </p>
          <Link
            href="/grupos/criar"
            className="mt-4 text-[12px] text-primaria-claro font-medium hover:underline"
          >
            Não encontrou? Crie um novo grupo
          </Link>
        </div>
      )}
    </>
  );
}

/** Seção de entrada por código de convite */
function SecaoCodigoConvite({
  onEntrar,
  entrando,
}: Readonly<{
  onEntrar: (codigo: string) => void;
  entrando: boolean;
}>) {
  const [codigo, setCodigo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [grupoEncontrado, setGrupoEncontrado] =
    useState<InfoGrupoConvite | null>(null);
  const [erroBusca, setErroBusca] = useState<string | null>(null);

  async function buscarGrupo() {
    const codigoLimpo = codigo.trim().toUpperCase();
    if (!codigoLimpo) return;

    setErroBusca(null);
    setGrupoEncontrado(null);
    setBuscando(true);

    try {
      const info = await buscarInfoGrupoConvite(codigoLimpo);
      setGrupoEncontrado(info);
    } catch {
      setErroBusca('Código de convite inválido. Verifique e tente novamente.');
    } finally {
      setBuscando(false);
    }
  }

  function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (grupoEncontrado) {
      onEntrar(codigo.trim().toUpperCase());
    } else {
      buscarGrupo();
    }
  }

  return (
    <div className="space-y-4" data-dica="grupos-publicos-convite">
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primaria/[0.1] border border-primaria/20 shrink-0">
            <Ticket size={18} className="text-primaria-claro" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-texto/80">
              Tem um código de convite?
            </p>
            <p className="text-[11px] text-texto/40 mt-0.5">
              Cole o código que você recebeu para encontrar e entrar no grupo.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Ticket
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-texto/30"
          />
          <Input
            type="text"
            placeholder="Ex: ABC12345"
            value={codigo}
            onChange={(e) => {
              setCodigo(e.target.value.toUpperCase());
              setGrupoEncontrado(null);
              setErroBusca(null);
            }}
            className="pl-9 h-11 text-sm font-mono tracking-wider uppercase"
            maxLength={12}
            data-testid="grupos-publicos-input-convite"
          />
        </div>

        {erroBusca && (
          <p className="text-[11px] text-erro">{erroBusca}</p>
        )}

        {grupoEncontrado && (
          <div className="rounded-2xl border border-primaria/20 bg-primaria/[0.04] p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primaria/30 bg-primaria/[0.1] shrink-0">
                <Globe size={20} className="text-primaria" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[15px] font-semibold text-texto truncate block">
                  {grupoEncontrado.nome}
                </span>
                <span className="text-[11px] text-texto/40">
                  {grupoEncontrado.privado ? 'Privado' : 'Público'}
                  {grupoEncontrado.maxParticipantes > 0 &&
                    ` • máx. ${grupoEncontrado.maxParticipantes}`}
                </span>
              </div>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11"
          disabled={!codigo.trim() || buscando || entrando}
        >
          {buscando && <Loader2 size={14} className="animate-spin mr-2" />}
          {entrando && <Loader2 size={14} className="animate-spin mr-2" />}
          {grupoEncontrado ? 'Entrar no grupo' : 'Buscar grupo'}
        </Button>
      </form>
    </div>
  );
}

/** Botão contextual: Participando / Entrar / Indisponível */
function BotaoEntrarGrupo({
  grupo,
  jaParticipa,
  entrando,
  onEntrar,
}: Readonly<{
  grupo: Grupo;
  jaParticipa: boolean;
  entrando: boolean;
  onEntrar: () => void;
}>) {
  if (jaParticipa) {
    return (
      <span className="text-[11px] text-texto/40 font-medium px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
        Participando
      </span>
    );
  }

  if (!grupo.codigoConvite) {
    return <span className="text-[10px] text-texto/30 px-2">Indisponível</span>;
  }

  return (
    <Button
      size="sm"
      onClick={onEntrar}
      disabled={entrando}
      className="text-[11px] h-8 px-3"
      data-testid={`grupo-publico-btn-entrar-${grupo.id}`}
    >
      {entrando ? <Loader2 size={14} className="animate-spin" /> : 'Entrar'}
    </Button>
  );
}
