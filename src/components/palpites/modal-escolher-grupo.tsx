'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check, Loader2, Star } from 'lucide-react';
import { definirGrupoFavorito } from '@/services/usuario.service';
import { useAuthStore } from '@/stores/auth.store';

interface GrupoOpcao {
  id: string;
  nome: string;
}

interface PropsModalEscolherGrupo {
  gruposDisponiveis: GrupoOpcao[];
  temaCopa?: boolean;
  onEscolher: (grupoId: string) => void;
}

/**
 * Modal obrigatório exibido quando o usuário tem 2+ grupos no mesmo campeonato
 * e nenhum grupo favorito definido para ele. Só fecha ao escolher.
 */
export function ModalEscolherGrupo({
  gruposDisponiveis,
  temaCopa,
  onEscolher,
}: Readonly<PropsModalEscolherGrupo>) {
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const atualizarUsuario = useAuthStore((state) => state.atualizarUsuario);

  const { mutate: salvarFavorito, isPending } = useMutation({
    mutationFn: (grupoId: string) => definirGrupoFavorito(grupoId),
    onSuccess: (_, grupoId) => {
      atualizarUsuario({ grupoFavoritoId: grupoId });
      onEscolher(grupoId);
    },
  });

  const corBorda = temaCopa ? 'border-[#009c3b]/50' : 'border-primaria/30';
  const corBotao = temaCopa
    ? 'bg-[#009c3b] hover:bg-[#009c3b]/90 text-[#ffdf00]'
    : 'bg-primaria hover:bg-primaria/90 text-white';
  const corSelecionado = temaCopa
    ? 'border-[#ffdf00] bg-[#009c3b]/20'
    : 'border-primaria bg-primaria/10';
  const corNaoSelecionado = 'border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06]';

  function handleConfirmar() {
    if (!selecionado) return;
    salvarFavorito(selecionado);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Overlay sem ação (modal obrigatório) */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className={`relative w-full max-w-[360px] rounded-2xl border ${corBorda} bg-superficie/95 backdrop-blur-xl shadow-[0_16px_64px_rgba(0,0,0,0.6)] p-5 animate-[fadeIn_0.2s_ease-out]`}>
        {/* Ícone + Título */}
        <div className="flex flex-col items-center gap-2 mb-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${temaCopa ? 'bg-[#009c3b]/20' : 'bg-primaria/20'}`}>
            <Star size={24} className={temaCopa ? 'text-[#ffdf00]' : 'text-primaria-claro'} />
          </div>
          <h2 className="text-base font-bold text-texto text-center">
            Escolha seu grupo principal
          </h2>
          <p className="text-[11px] text-texto/50 text-center leading-relaxed">
            Você participa de {gruposDisponiveis.length} grupos neste campeonato.
            Escolha o padrão para ver palpites dos membros.
          </p>
        </div>

        {/* Lista de grupos */}
        <div className="space-y-2 mb-4">
          {gruposDisponiveis.map((grupo) => {
            const ativo = selecionado === grupo.id;
            return (
              <button
                key={grupo.id}
                type="button"
                onClick={() => setSelecionado(grupo.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${ativo ? corSelecionado : corNaoSelecionado}`}
              >
                <span className={`text-[13px] font-medium flex-1 text-left ${ativo ? 'text-texto' : 'text-texto/70'}`}>
                  {grupo.nome}
                </span>
                {ativo && (
                  <Check size={16} className={temaCopa ? 'text-[#ffdf00]' : 'text-primaria-claro'} />
                )}
              </button>
            );
          })}
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={!selecionado || isPending}
            className={`w-full py-2.5 rounded-xl text-[12px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${corBotao}`}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Salvando...
              </span>
            ) : (
              'Definir como favorito'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
