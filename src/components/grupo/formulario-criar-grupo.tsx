'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Trophy, Calendar, Lock, Settings, Minus, Plus, Info, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const schemaCriarGrupo = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  temporadaId: z.string().min(1, 'Temporada é obrigatória'),
  privado: z.boolean(),
  maxParticipantes: z.number().min(2).max(50).optional(),
  permitirPalpiteAutomatico: z.boolean().optional(),
  permitirPalpiteDobrado: z.boolean().optional(),
});

type DadosCriarGrupoForm = z.infer<typeof schemaCriarGrupo>;

interface PropsFormularioCriarGrupo {
  temporadas: Array<{ id: string; ano: number; campeonato?: string }>;
  onSubmit: (dados: DadosCriarGrupoForm) => Promise<void>;
}

function Toggle({ ativo, onChange, testId }: { ativo: boolean; onChange: (v: boolean) => void; testId: string }) {
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

function SelectCustomizado({ valor, onChange, placeholder, opcoes, testId }: {
  valor: string;
  onChange: (v: string) => void;
  placeholder: string;
  opcoes: Array<{ valor: string; label: string }>;
  testId: string;
}) {
  const [aberto, setAberto] = useState(false);
  const selecionado = opcoes.find((o) => o.valor === valor);

  return (
    <div className="relative" data-testid={testId}>
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className={`flex h-12 w-full items-center justify-between rounded-xl border px-4 text-base transition-all duration-200 ${
          aberto
            ? 'border-primaria ring-4 ring-primaria/10 bg-white/[0.06]'
            : 'border-white/[0.1] bg-white/[0.04] hover:border-white/[0.15]'
        }`}
      >
        <span className={selecionado ? 'text-texto' : 'text-texto/40'}>
          {selecionado?.label || placeholder}
        </span>
        <ChevronDown size={16} className={`text-texto/40 transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-white/[0.1] bg-[#0d1a2d] backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden opacity-0 animate-[fadeIn_0.15s_ease-out_forwards]">
          {opcoes.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              onClick={() => {
                onChange(opcao.valor);
                setAberto(false);
              }}
              className={`w-full px-4 py-3.5 text-left text-sm transition-colors ${
                opcao.valor === valor
                  ? 'bg-primaria/[0.12] text-primaria font-medium'
                  : 'text-texto/80 hover:bg-white/[0.05]'
              }`}
            >
              {opcao.label}
            </button>
          ))}
        </div>
      )}

      {/* Fechar ao clicar fora */}
      {aberto && (
        <div className="fixed inset-0 z-20" onClick={() => setAberto(false)} aria-hidden="true" />
      )}
    </div>
  );
}

export function FormularioCriarGrupo({ temporadas, onSubmit }: Readonly<PropsFormularioCriarGrupo>) {
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [configAberta, setConfigAberta] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<DadosCriarGrupoForm>({
    resolver: zodResolver(schemaCriarGrupo),
    mode: 'onChange',
    defaultValues: {
      privado: true,
      maxParticipantes: 50,
      permitirPalpiteAutomatico: false,
      permitirPalpiteDobrado: false,
    },
  });

  const maxAtual = watch('maxParticipantes') || 50;

  async function aoEnviar(dados: DadosCriarGrupoForm) {
    setErroServidor(null);
    try {
      await onSubmit(dados);
    } catch (error: any) {
      setErroServidor(error?.mensagem || 'Erro ao criar grupo');
    }
  }

  return (
    <div className="relative rounded-3xl bg-[#0B1020]/95 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.4)] opacity-0 animate-[fadeIn_0.5s_ease-out_0.15s_forwards]">
      {/* Borda gradient — iluminação da figura */}
      <div
        className="absolute -inset-[1px] rounded-3xl pointer-events-none"
        style={{
          background: 'linear-gradient(225deg, rgba(34,197,94,1) 0%, rgba(34,197,94,0.5) 20%, rgba(34,197,94,0.15) 45%, rgba(255,255,255,0.1) 70%, rgba(255,255,255,0.08) 100%)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '1px',
          borderRadius: '1.5rem',
        }}
      />
      <form onSubmit={handleSubmit(aoEnviar)} noValidate data-testid="criar-grupo-form">
        {/* Header interno */}
        <div className="flex items-center gap-3 px-7 pt-7 pb-2">
          <div className="flex w-5 justify-center flex-shrink-0">
            <Users size={20} className="text-[#4ade80] drop-shadow-[0_0_6px_rgba(74,222,128,0.5)]" />
          </div>
          <h2 className="text-lg font-semibold text-texto">Criar novo grupo</h2>
        </div>

        <div className="px-7 pb-7 pt-4 space-y-4">
          {erroServidor && (
            <Alert variant="destructive" data-testid="criar-grupo-alert-erro">
              <AlertDescription>{erroServidor}</AlertDescription>
            </Alert>
          )}

          {/* Nome */}
          <div className="flex gap-3">
            <div className="flex w-5 items-start pt-1 justify-center flex-shrink-0">
              <Trophy size={18} className="text-[#22c55e]" />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="nome" className="text-texto/90 text-sm font-medium">Nome do grupo</Label>
              <Input
                id="nome"
                type="text"
                placeholder="Ex: Bolão da Firma"
                className={errors.nome ? 'border-erro' : ''}
                aria-invalid={!!errors.nome}
                data-testid="criar-grupo-input-nome"
                {...register('nome')}
              />
              {errors.nome && (
                <p className="text-xs text-erro/80" role="alert">{errors.nome.message}</p>
              )}
            </div>
          </div>

          {/* Temporada */}
          <div className="flex gap-3">
            <div className="flex w-5 items-start pt-1 justify-center flex-shrink-0">
              <Calendar size={18} className="text-[#22c55e]" />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="temporadaId" className="text-texto/90 text-sm font-medium">Temporada</Label>
              <Controller
                control={control}
                name="temporadaId"
                render={({ field }) => (
                  <SelectCustomizado
                    valor={field.value}
                    onChange={field.onChange}
                    placeholder="Selecione..."
                    opcoes={temporadas.map((t) => ({
                      valor: t.id,
                      label: t.campeonato ? `${t.campeonato} ${t.ano}` : `Temporada ${t.ano}`,
                    }))}
                    testId="criar-grupo-select-temporada"
                  />
                )}
              />
              {errors.temporadaId && (
                <p className="text-xs text-erro/80" role="alert">{errors.temporadaId.message}</p>
              )}
            </div>
          </div>

          {/* Stepper participantes */}
          <div className="flex gap-3">
            <div className="flex w-5 items-start pt-1 justify-center flex-shrink-0">
              <Users size={18} className="text-[#22c55e]" />
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-texto/90 text-sm font-medium">Máx. participantes</Label>
              <div className="flex items-center h-12 rounded-xl border border-white/[0.1] bg-white/[0.04] px-2" data-testid="criar-grupo-stepper-max">
                <button
                  type="button"
                  onClick={() => setValue('maxParticipantes', Math.max(2, maxAtual - 1), { shouldValidate: true })}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-texto/50 hover:text-texto hover:bg-white/[0.08] transition-all active:scale-90"
                  aria-label="Diminuir"
                >
                  <Minus size={16} />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-lg font-bold text-texto tabular-nums">{maxAtual}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setValue('maxParticipantes', Math.min(50, maxAtual + 1), { shouldValidate: true })}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-texto/50 hover:text-texto hover:bg-white/[0.08] transition-all active:scale-90"
                  aria-label="Aumentar"
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="text-[11px] text-texto/40">Defina o limite máximo de participantes</p>
              <input type="hidden" {...register('maxParticipantes', { valueAsNumber: true })} />
            </div>
          </div>

          {/* Grupo privado */}
          <div className="flex gap-3">
            <div className="flex w-5 items-start pt-1 justify-center flex-shrink-0">
              <Lock size={18} className="text-[#22c55e]" />
            </div>
            <div className="flex-1 flex items-center justify-between">
              <div>
                <p className="text-sm text-texto font-medium">Grupo privado (apenas por convite)</p>
                <p className="text-[11px] text-texto/50 mt-0.5">Somente convidados podem entrar no grupo</p>
              </div>
              <Controller
                control={control}
                name="privado"
                render={({ field }) => (
                  <Toggle
                    ativo={field.value}
                    onChange={field.onChange}
                    testId="criar-grupo-toggle-privado"
                  />
                )}
              />
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-white/[0.06]" />

          {/* Configurações avançadas */}
          <div data-testid="criar-grupo-config-avancada">
            <button
              type="button"
              onClick={() => setConfigAberta(!configAberta)}
              className="flex items-center w-full py-1 gap-3"
            >
              <div className="flex w-5 justify-center flex-shrink-0">
                <Settings size={18} className="text-[#22c55e]" />
              </div>
              <span className="text-sm text-[#22c55e] uppercase tracking-[0.08em] font-semibold flex-1 text-left">
                Configurações avançadas
              </span>
              {configAberta ? (
                <ChevronUp size={16} className="text-[#22c55e]" />
              ) : (
                <ChevronDown size={16} className="text-[#22c55e]" />
              )}
            </button>

            {configAberta && (
              <div className="mt-5 space-y-4 opacity-0 animate-[fadeIn_0.2s_ease-out_forwards]">
                {/* Palpite automático */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="relative flex items-center mt-0.5">
                      <input
                        type="checkbox"
                        id="permitirPalpiteAutomatico"
                        className="peer h-5 w-5 appearance-none rounded-lg border border-white/[0.15] bg-white/[0.04] checked:bg-primaria checked:border-primaria checked:shadow-[0_0_8px_rgba(22,163,74,0.3)] transition-all duration-200 cursor-pointer"
                        data-testid="criar-grupo-checkbox-palpite-auto"
                        {...register('permitirPalpiteAutomatico')}
                      />
                      <svg
                        className="absolute left-1 top-1 h-3 w-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                        viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      >
                        <path d="M2 6l3 3 5-5" />
                      </svg>
                    </div>
                    <div>
                      <label htmlFor="permitirPalpiteAutomatico" className="text-sm text-texto/90 cursor-pointer font-medium">
                        Palpite automático
                      </label>
                      <p className="text-[11px] text-texto/45 mt-0.5 leading-relaxed">Preenche palpite padrão se o membro não palpitar</p>
                    </div>
                  </div>
                  <Info size={15} className="text-texto/25 mt-1 flex-shrink-0" />
                </div>

                {/* Palpite dobrado */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="relative flex items-center mt-0.5">
                      <input
                        type="checkbox"
                        id="permitirPalpiteDobrado"
                        className="peer h-5 w-5 appearance-none rounded-lg border border-white/[0.15] bg-white/[0.04] checked:bg-primaria checked:border-primaria checked:shadow-[0_0_8px_rgba(22,163,74,0.3)] transition-all duration-200 cursor-pointer"
                        data-testid="criar-grupo-checkbox-palpite-dobrado"
                        {...register('permitirPalpiteDobrado')}
                      />
                      <svg
                        className="absolute left-1 top-1 h-3 w-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                        viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      >
                        <path d="M2 6l3 3 5-5" />
                      </svg>
                    </div>
                    <div>
                      <label htmlFor="permitirPalpiteDobrado" className="text-sm text-texto/90 cursor-pointer font-medium">
                        Palpite dobrado
                      </label>
                      <p className="text-[11px] text-texto/45 mt-0.5 leading-relaxed">Permite usar fichas para dobrar pontuação em jogos</p>
                    </div>
                  </div>
                  <Info size={15} className="text-texto/25 mt-1 flex-shrink-0" />
                </div>
              </div>
            )}
          </div>

          {/* ===== CTA DOMINANTE ===== */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#16a34a] to-[#22c55e] text-white font-bold text-base flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_0_20px_rgba(30,215,96,0.3),_0_4px_12px_rgba(30,215,96,0.2)] hover:from-[#1db954] hover:to-[#4ade80] hover:shadow-[0_0_30px_rgba(30,215,96,0.45),_0_4px_16px_rgba(30,215,96,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_0_15px_rgba(30,215,96,0.2)] active:scale-[0.97] disabled:opacity-30 disabled:shadow-none disabled:hover:shadow-none disabled:hover:from-[#16a34a] disabled:hover:to-[#22c55e] disabled:hover:translate-y-0 disabled:active:scale-100"
              data-testid="criar-grupo-btn-criar"
            >
              {isSubmitting ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-[2.5px] border-white border-t-transparent" />
                  <span>Criando grupo...</span>
                </>
              ) : (
                <>
                  <Users size={20} />
                  <span>Criar grupo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
