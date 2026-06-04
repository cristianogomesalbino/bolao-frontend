'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Trophy, Lock, Users, Minus, Plus, Globe, Target, CheckCircle } from 'lucide-react';
import { buscarGrupo, atualizarGrupo } from '@/services/grupo.service';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const ICONES_GRUPO = [
  { id: 'bola', emoji: '⚽' },
  { id: 'trofeu', emoji: '🏆' },
  { id: 'coroa', emoji: '👑' },
  { id: 'chuteira', emoji: '👟' },
  { id: 'medalha', emoji: '🥇' },
  { id: 'bandeira', emoji: '🚩' },
  { id: 'estrela', emoji: '⭐' },
  { id: 'campo', emoji: '🏟️' },
  { id: 'luva', emoji: '🧤' },
  { id: 'apito', emoji: '📣' },
  { id: 'escudo', emoji: '🛡️' },
  { id: 'fogo', emoji: '🔥' },
];

const schemaEditarGrupo = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  icone: z.string().optional(),
  privado: z.boolean(),
  permitirPalpiteAutomatico: z.boolean(),
  permitirPalpiteDobrado: z.boolean(),
  maxParticipantes: z.number().min(2).max(50),
});

type DadosEditarGrupoForm = z.infer<typeof schemaEditarGrupo>;

function Toggle({ ativo, onChange, testId }: Readonly<{ ativo: boolean; onChange: (v: boolean) => void; testId: string }>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ativo}
      onClick={() => onChange(!ativo)}
      className={`relative h-7 w-12 rounded-full transition-all duration-300 flex-shrink-0 ${
        ativo
          ? 'bg-primaria shadow-[0_0_12px_rgba(22,163,74,0.4)]'
          : 'bg-white/[0.08] border border-white/[0.1]'
      }`}
      data-testid={testId}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
          ativo ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function TituloSecao({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <p className="text-[10px] text-primaria-claro/80 uppercase tracking-[0.15em] font-bold mb-3">
      {children}
    </p>
  );
}

export default function EditarGrupoPage() {
  const router = useRouter();
  const params = useParams();
  const grupoId = params.grupoId as string;
  const queryClient = useQueryClient();

  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const { data: grupo, isLoading } = useQuery({
    queryKey: ['grupo', grupoId],
    queryFn: () => buscarGrupo(grupoId),
    enabled: !!grupoId,
  });

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<DadosEditarGrupoForm>({
    resolver: zodResolver(schemaEditarGrupo),
    mode: 'onChange',
    values: grupo ? {
      nome: grupo.nome,
      icone: grupo.icone || 'trofeu',
      privado: grupo.privado,
      permitirPalpiteAutomatico: grupo.permitirPalpiteAutomatico,
      permitirPalpiteDobrado: grupo.permitirPalpiteDobrado,
      maxParticipantes: grupo.maxParticipantes,
    } : undefined,
  });

  const maxAtual = watch('maxParticipantes') || 50;

  async function aoEnviar(dados: DadosEditarGrupoForm) {
    setErroServidor(null);
    setSucesso(false);
    try {
      await atualizarGrupo(grupoId, dados);
      await queryClient.invalidateQueries({ queryKey: ['grupo', grupoId] });
      await queryClient.invalidateQueries({ queryKey: ['grupos'] });
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } catch (error: unknown) {
      const err = error as { mensagem?: string };
      setErroServidor(err?.mensagem || 'Erro ao atualizar grupo');
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

  return (
    <div className="min-h-screen bg-fundo pb-28">
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
        <h1 className="text-lg font-semibold text-texto">Editar grupo</h1>
      </header>

      <div className="mx-auto max-w-[480px] px-4 py-4">
        <form onSubmit={handleSubmit(aoEnviar)} noValidate data-testid="editar-grupo-form" className="space-y-3">
          {erroServidor && (
            <Alert variant="destructive" data-testid="editar-grupo-alert-erro">
              <AlertDescription>{erroServidor}</AlertDescription>
            </Alert>
          )}
          {sucesso && (
            <Alert className="border-sucesso/50 bg-sucesso/10 text-sucesso" data-testid="editar-grupo-alert-sucesso">
              <AlertDescription>✓ Grupo atualizado com sucesso!</AlertDescription>
            </Alert>
          )}

          {/* ===== SEÇÃO 1: APARÊNCIA ===== */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
            <TituloSecao>Aparência</TituloSecao>

            {/* Avatar do grupo */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primaria/[0.08] border border-primaria-claro/30 text-4xl shadow-[0_0_20px_rgba(34,211,94,0.12)]">
                {ICONES_GRUPO.find((i) => i.id === watch('icone'))?.emoji || '🏆'}
              </div>
              <span className="text-[10px] text-texto/40 uppercase tracking-wider font-medium">Ícone do grupo</span>
              <div className="grid grid-cols-6 gap-2 w-full" data-testid="editar-grupo-icones">
                {ICONES_GRUPO.map((icone) => (
                  <button
                    key={icone.id}
                    type="button"
                    onClick={() => setValue('icone', icone.id, { shouldDirty: true })}
                    className={`flex h-11 w-full items-center justify-center rounded-xl text-xl transition-all ${
                      watch('icone') === icone.id
                        ? 'bg-primaria/15 border-2 border-primaria-claro/60 scale-110 shadow-[0_0_10px_rgba(34,211,94,0.2)]'
                        : 'bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15]'
                    }`}
                    aria-label={icone.id}
                    data-testid={`editar-grupo-icone-${icone.id}`}
                  >
                    {icone.emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ===== SEÇÃO 2: PARTICIPANTES ===== */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-4">
            <TituloSecao>Participantes</TituloSecao>

            {/* Nome */}
            <div className="flex gap-3">
              <div className="flex w-5 items-start pt-1 justify-center flex-shrink-0">
                <Trophy size={18} className="text-primaria-claro" />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="nome" className="text-texto/90 text-sm font-medium">Nome do grupo</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Ex: Bolão da Firma"
                  className={errors.nome ? 'border-erro' : ''}
                  aria-invalid={!!errors.nome}
                  data-testid="editar-grupo-input-nome"
                  {...register('nome')}
                />
                {errors.nome && (
                  <p className="text-xs text-erro/80" role="alert">{errors.nome.message}</p>
                )}
              </div>
            </div>

            {/* Máx participantes */}
            <div className="flex gap-3">
              <div className="flex w-5 items-start pt-1 justify-center flex-shrink-0">
                <Users size={18} className="text-primaria-claro" />
              </div>
              <div className="flex-1 space-y-2">
                <Label className="text-texto/90 text-sm font-medium">Máx. participantes</Label>
                <div className="flex items-center h-12 rounded-xl border border-white/[0.1] bg-white/[0.04] px-2" data-testid="editar-grupo-stepper-max">
                  <button
                    type="button"
                    onClick={() => setValue('maxParticipantes', Math.max(2, maxAtual - 1), { shouldValidate: true, shouldDirty: true })}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.1] text-texto/50 hover:text-texto hover:bg-white/[0.08] transition-all active:scale-90"
                    aria-label="Diminuir"
                  >
                    <Minus size={16} />
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-xl font-bold text-texto tabular-nums">{maxAtual}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setValue('maxParticipantes', Math.min(50, maxAtual + 1), { shouldValidate: true, shouldDirty: true })}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.1] text-texto/50 hover:text-texto hover:bg-white/[0.08] transition-all active:scale-90"
                    aria-label="Aumentar"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-texto/30">
                  <Users size={11} />
                  <span className="text-[10px]">{grupo.totalParticipantes ?? 1} de {maxAtual} participantes</span>
                </div>
                <input type="hidden" {...register('maxParticipantes', { valueAsNumber: true })} />
              </div>
            </div>
          </div>

          {/* ===== SEÇÃO 3: PRIVACIDADE ===== */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
            <TituloSecao>Privacidade</TituloSecao>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock size={18} className="text-primaria-claro" />
                <div>
                  <p className="text-sm text-texto font-medium">Grupo privado</p>
                  <p className="text-[11px] text-texto/45 mt-0.5">Somente convidados podem entrar</p>
                </div>
              </div>
              <Controller
                control={control}
                name="privado"
                render={({ field }) => (
                  <Toggle
                    ativo={field.value}
                    onChange={(v) => field.onChange(v)}
                    testId="editar-grupo-toggle-privado"
                  />
                )}
              />
            </div>
          </div>

          {/* ===== SEÇÃO 4: REGRAS DO BOLÃO ===== */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
            <TituloSecao>Regras do bolão</TituloSecao>

            {/* Palpite automático */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target size={18} className="text-primaria-claro" />
                <div>
                  <p className="text-sm text-texto/90 font-medium">Palpite automático</p>
                  <p className="text-[11px] text-texto/45 mt-0.5">Preenche palpite padrão se o membro não palpitar</p>
                </div>
              </div>
              <Controller
                control={control}
                name="permitirPalpiteAutomatico"
                render={({ field }) => (
                  <Toggle
                    ativo={field.value}
                    onChange={(v) => field.onChange(v)}
                    testId="editar-grupo-toggle-palpite-auto"
                  />
                )}
              />
            </div>

            {/* Separador */}
            <div className="border-t border-white/[0.05]" />

            {/* Palpite dobrado */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex w-[18px] justify-center text-[13px] font-black text-primaria-claro">2x</span>
                <div>
                  <p className="text-sm text-texto/90 font-medium">Palpite dobrado</p>
                  <p className="text-[11px] text-texto/45 mt-0.5">Permite usar fichas para dobrar pontuação em jogos</p>
                </div>
              </div>
              <Controller
                control={control}
                name="permitirPalpiteDobrado"
                render={({ field }) => (
                  <Toggle
                    ativo={field.value}
                    onChange={(v) => field.onChange(v)}
                    testId="editar-grupo-toggle-palpite-dobrado"
                  />
                )}
              />
            </div>

            {/* Info privacidade */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] mt-2">
              {watch('privado') ? (
                <>
                  <Lock size={13} className="text-texto/30 shrink-0" />
                  <span className="text-[10px] text-texto/40">Apenas membros convidados podem ver e participar</span>
                </>
              ) : (
                <>
                  <Globe size={13} className="text-texto/30 shrink-0" />
                  <span className="text-[10px] text-texto/40">Qualquer pessoa pode encontrar e entrar no grupo</span>
                </>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Botão salvar fixo */}
      <div className="fixed bottom-16 left-0 right-0 z-30 px-4 pb-4 pt-3 bg-gradient-to-t from-fundo via-fundo to-transparent">
        <div className="mx-auto max-w-[480px]">
          <button
            type="button"
            onClick={handleSubmit(aoEnviar)}
            disabled={isSubmitting || !isValid || !isDirty}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#16a34a] to-[#22c55e] text-white font-bold text-base flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_20px_rgba(30,215,96,0.3),_0_4px_12px_rgba(30,215,96,0.2)] hover:from-[#1db954] hover:to-[#4ade80] hover:shadow-[0_0_30px_rgba(30,215,96,0.45)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] disabled:opacity-30 disabled:shadow-none disabled:hover:shadow-none disabled:hover:translate-y-0 disabled:active:scale-100"
            data-testid="editar-grupo-btn-salvar"
          >
            {isSubmitting ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-[2.5px] border-white border-t-transparent" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                <span>Salvar alterações</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
