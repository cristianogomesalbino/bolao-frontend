'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { criarGrupo } from '@/services/grupo.service';
import { FormularioCriarGrupo } from '@/components/grupo/formulario-criar-grupo';
import apiClient from '@/lib/api-client';

export default function CriarGrupoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: temporadas, isLoading } = useQuery({
    queryKey: ['temporadas'],
    queryFn: async () => {
      const response = await apiClient.get('/temporadas');
      return response.data;
    },
  });

  async function aoCriarGrupo(dados: { nome: string; temporadaId: string; privado: boolean; maxParticipantes?: number; permitirPalpiteAutomatico?: boolean; permitirPalpiteDobrado?: boolean }) {
    await criarGrupo(dados);
    await queryClient.invalidateQueries({ queryKey: ['grupos'] });
    router.replace('/grupos');
  }

  return (
    <div className="min-h-screen bg-fundo relative" data-testid="criar-grupo-page">
      {/* ===== HERO ===== */}
      <div className="relative h-[240px] overflow-hidden pt-8 px-6" style={{ background: 'linear-gradient(180deg, #020617 0%, #04112a 100%)' }}>
        {/* Glow */}
        <div
          className="absolute z-0"
          style={{
            top: '-80px',
            right: '-60px',
            width: '280px',
            height: '280px',
            borderRadius: '9999px',
            background: 'radial-gradient(circle, rgba(34,197,94,0.22) 0%, rgba(34,197,94,0.12) 35%, transparent 70%)',
            filter: 'blur(40px)',
            opacity: 1,
          }}
        />

        {/* Ilustração marca d'água */}
        <img
          src="/hero-criar-grupo.png"
          alt=""
          aria-hidden="true"
          className="absolute pointer-events-none select-none"
          style={{
            top: '50px',
            right: '-20px',
            width: '200px',
            opacity: 1,
            filter: 'brightness(1.2) saturate(1.5) hue-rotate(55deg)',
            mixBlendMode: 'lighten',
          }}
        />

        {/* Conteúdo */}
        <div className="relative z-[2]">
          <button
            onClick={() => router.back()}
            aria-label="Voltar"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.07] text-texto/60 hover:text-texto hover:bg-white/[0.1] transition-all active:scale-90"
            data-testid="criar-grupo-btn-voltar"
          >
            <ArrowLeft size={18} />
          </button>

          <h1 className="mt-12 text-[43px] font-bold text-white leading-none tracking-tight">
            Criar grupo
          </h1>
          <p className="mt-1 text-base text-texto/70">
            Monte seu bolão do seu jeito
          </p>
        </div>
      </div>

      {/* ===== CARD PRINCIPAL ===== */}
      <div className="mx-auto max-w-[480px] px-4 -mt-7 relative z-[5] pb-8">
        {isLoading ? (
          <div className="rounded-3xl border border-white/[0.1] bg-white/[0.03] backdrop-blur-xl p-7 space-y-6">
            <div className="h-14 rounded-xl bg-white/[0.05] animate-pulse" />
            <div className="h-14 rounded-xl bg-white/[0.05] animate-pulse" />
            <div className="h-14 rounded-xl bg-white/[0.05] animate-pulse" />
            <div className="h-[60px] rounded-2xl bg-white/[0.05] animate-pulse" />
          </div>
        ) : (
          <FormularioCriarGrupo
            temporadas={(temporadas || []).map((t: any) => ({
              id: t.id,
              ano: t.ano,
              campeonato: t.campeonato?.nome,
            }))}
            onSubmit={aoCriarGrupo}
          />
        )}

        {/* Texto auxiliar */}
        <p className="text-[11px] text-texto/30 text-center leading-relaxed px-6 mt-6">
          Grupos privados geram um código de convite automaticamente.
          <br />
          Compartilhe com seus amigos! 💚
        </p>
      </div>
    </div>
  );
}
