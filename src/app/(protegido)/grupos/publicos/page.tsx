'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Globe, Search, Users, Loader2 } from 'lucide-react';
import { listarGruposPublicos, entrarNoGrupo } from '@/services/grupo.service';
import { Grupo } from '@/types/grupo.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function GruposPublicosPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');
  const [entrando, setEntrando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const { data: grupos, isLoading } = useQuery({
    queryKey: ['grupos-publicos', busca],
    queryFn: () => listarGruposPublicos(busca || undefined),
    staleTime: 1000 * 30,
  });

  async function aoEntrar(grupo: Grupo) {
    setErro(null);
    setSucesso(null);
    setEntrando(grupo.id);
    try {
      if (!grupo.codigoConvite) return;
      await entrarNoGrupo(grupo.codigoConvite);
      await queryClient.invalidateQueries({ queryKey: ['grupos'] });
      await queryClient.invalidateQueries({ queryKey: ['grupos-publicos'] });
      setSucesso(`Você entrou no grupo "${grupo.nome}"!`);
      setTimeout(() => router.push(`/grupos/${grupo.id}`), 1500);
    } catch (error: unknown) {
      const err = error as { statusCode?: number; mensagem?: string; message?: string };
      if (err?.statusCode === 409) {
        setErro('Você já está neste grupo');
      } else {
        setErro(err?.mensagem || err?.message || 'Não foi possível entrar no grupo');
      }
    } finally {
      setEntrando(null);
    }
  }

  return (
    <div className="min-h-screen bg-fundo pb-24">
      {/* Header */}
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
            <div>
              <h1 className="text-lg font-bold text-texto">Grupos Públicos</h1>
              <p className="text-[10px] text-texto/30">Descubra novos grupos e entre para competir</p>
            </div>
          </div>

          {/* Campo de busca */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-texto/30" />
            <Input
              type="text"
              placeholder="Buscar por nome do grupo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 h-10 text-sm"
              data-testid="grupos-publicos-input-busca"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[480px] px-4 pt-4 space-y-3">
        {/* Alertas */}
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

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[80px] rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        )}

        {/* Lista de grupos públicos */}
        {!isLoading && grupos && grupos.length > 0 && (
          <div className="space-y-3" data-testid="grupos-publicos-lista">
            {grupos.map((grupo: Grupo) => (
              <div
                key={grupo.id}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition-all hover:bg-white/[0.05]"
                data-testid={`grupo-publico-${grupo.id}`}
              >
                <div className="flex items-center gap-3">
                  {/* Ícone */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primaria/30 bg-primaria/[0.1] shrink-0">
                    <Globe size={20} className="text-primaria" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[15px] font-semibold text-texto truncate block">{grupo.nome}</span>
                    <div className="flex items-center gap-1.5 mt-1 text-texto/40">
                      <Users size={12} />
                      <span className="text-[11px]">
                        {grupo.totalParticipantes ?? 0} participantes
                      </span>
                      {grupo.maxParticipantes && (
                        <>
                          <span className="text-texto/20 mx-0.5">•</span>
                          <span className="text-[11px]">
                            máx. {grupo.maxParticipantes}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Botão entrar */}
                  <Button
                    size="sm"
                    onClick={() => aoEntrar(grupo)}
                    disabled={entrando === grupo.id || !grupo.codigoConvite}
                    className="text-[11px] h-8 px-3"
                    data-testid={`grupo-publico-btn-entrar-${grupo.id}`}
                  >
                    {entrando === grupo.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estado vazio */}
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
          </div>
        )}
      </div>
    </div>
  );
}
