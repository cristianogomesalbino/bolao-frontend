'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Users, ChevronRight, Star, Lock } from 'lucide-react';
import { entrarNoGrupo, listarGrupos } from '@/services/grupo.service';
import { definirGrupoFavorito } from '@/services/usuario.service';
import { FormularioEntrarGrupo } from '@/components/grupo/formulario-entrar-grupo';
import { useAuthStore } from '@/stores/auth.store';
import { Grupo } from '@/types/grupo.types';

function obterClasseCardGrupo(ehFavorito: boolean, ehCopa: boolean): string {
  if (!ehFavorito) return 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05]';
  if (ehCopa) return 'border-[#ffdf00]/40 bg-[#003d1a]/40';
  return 'border-primaria/30 bg-primaria/[0.04]';
}

export default function ExplorarGruposPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mostrarEntrar, setMostrarEntrar] = useState(false);
  const usuario = useAuthStore((state) => state.usuario);
  const atualizarUsuario = useAuthStore((state) => state.atualizarUsuario);

  const { data: grupos, isLoading: carregandoGrupos } = useQuery({
    queryKey: ['grupos'],
    queryFn: listarGrupos,
  });

  const mutationFavorito = useMutation({
    mutationFn: (grupoId: string) => definirGrupoFavorito(grupoId),
    onSuccess: (data) => {
      atualizarUsuario({ grupoFavoritoId: data.grupoFavoritoId });
      queryClient.invalidateQueries({ queryKey: ['grupos'] });
    },
  });

  async function aoEntrarNoGrupo(codigoConvite: string) {
    await entrarNoGrupo(codigoConvite);
    await queryClient.invalidateQueries({ queryKey: ['grupos'] });
    router.push('/grupos');
  }

  return (
    <div className="min-h-screen bg-fundo pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-fundo/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="mx-auto max-w-[480px] px-5 py-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.12] text-texto/50 hover:text-texto transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold text-texto">Meus grupos</h1>
        </div>
      </header>

      <div className="mx-auto max-w-[480px] px-4 pt-4 space-y-4">
        {/* Card entrar por convite */}
        <button
          type="button"
          onClick={() => setMostrarEntrar(!mostrarEntrar)}
          className="w-full flex items-center gap-3 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05] transition-colors text-left"
          data-testid="explorar-btn-convite"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primaria/30 bg-primaria/[0.1] shrink-0">
            <Users size={20} className="text-primaria" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-texto">Entrar com código de convite</p>
            <p className="text-[11px] text-texto/40 mt-0.5">Cole o código que recebeu de um amigo</p>
          </div>
          <ChevronRight size={16} className="text-texto/25 shrink-0" />
        </button>

        {/* Formulário de entrar por convite */}
        {mostrarEntrar && (
          <FormularioEntrarGrupo onSubmit={aoEntrarNoGrupo} />
        )}

        {/* Meus Grupos */}
        {!carregandoGrupos && grupos && grupos.length > 0 && (
          <div className="pt-2">
            <span className="text-[10px] text-primaria-claro/80 uppercase tracking-[0.15em] font-bold mb-3 block">
              Meus grupos
            </span>
            <div className="space-y-2">
              {grupos.map((grupo: Grupo) => {
                const ehFavorito = grupo.id === usuario?.grupoFavoritoId;
                const ehCopa = grupo.temporada?.campeonato?.nome?.toLowerCase().includes('copa');

                return (
                  <div key={grupo.id} className="relative">
                    <button
                      type="button"
                      onClick={() => router.push(`/grupos/${grupo.id}`)}
                      className={`w-full text-left rounded-xl border p-3.5 transition-all active:scale-[0.98] ${
                        obterClasseCardGrupo(ehFavorito, ehCopa)
                      }`}
                      data-testid={`explorar-grupo-${grupo.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border shrink-0 ${
                          ehCopa ? 'border-[#009c3b]/30 bg-[#009c3b]/15' : 'border-primaria/20 bg-primaria/[0.06]'
                        }`}>
                          <span className="text-lg">{ehCopa ? '🏆' : '⚽'}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {ehFavorito && <Star size={12} className="text-yellow-400 fill-yellow-400 shrink-0" />}
                            <span className={`text-sm font-semibold truncate ${ehCopa ? 'text-[#ffdf00]/90' : 'text-texto'}`}>
                              {grupo.nome}
                            </span>
                            {grupo.privado && <Lock size={10} className="text-texto/25 shrink-0" />}
                          </div>
                          <span className="text-[11px] text-texto/35">
                            {grupo.totalParticipantes ?? 0} participantes
                            {grupo.temporada?.campeonato?.nome ? ` • ${grupo.temporada.campeonato.nome}` : ''}
                          </span>
                        </div>

                        <ChevronRight size={16} className="text-texto/20 shrink-0" />
                      </div>
                    </button>

                    {/* Estrela para definir favorito */}
                    {!ehFavorito && grupos.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          mutationFavorito.mutate(grupo.id);
                        }}
                        className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/[0.06] transition-colors z-10"
                        aria-label="Definir como grupo principal"
                      >
                        <Star size={16} className="text-texto/20 hover:text-yellow-400/60 transition-colors" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading grupos */}
        {carregandoGrupos && (
          <div className="pt-4 space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-[60px] rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
