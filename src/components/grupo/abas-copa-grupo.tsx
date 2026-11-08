'use client';

import { AbaDashboardCopa } from '@/components/copa-do-mundo/aba-dashboard-copa';
import { AbaClassificacaoCopa } from '@/components/copa-do-mundo/aba-classificacao-copa';
import { AbaMeusPalpitesCopa } from '@/components/copa-do-mundo/aba-meus-palpites-copa';

export type AbaCopa = 'dashboard' | 'classificacao' | 'palpites';

interface AbaDefinicao {
  readonly id: AbaCopa;
  readonly rotulo: string;
  readonly testId: string;
}

const ABAS: readonly AbaDefinicao[] = [
  { id: 'dashboard', rotulo: 'Dashboard', testId: 'grupo-aba-dashboard' },
  { id: 'classificacao', rotulo: 'Classificação', testId: 'grupo-aba-classificacao' },
  { id: 'palpites', rotulo: 'Meus Palpites', testId: 'grupo-aba-palpites' },
];

interface PropsAbasCopaGrupo {
  readonly aba: AbaCopa;
  readonly onMudar: (aba: AbaCopa) => void;
  readonly grupoId: string;
  readonly temporadaId: string;
}

function classeAba(ativa: boolean): string {
  const base = 'flex-1 py-2.5 px-2 rounded-lg text-[11px] font-semibold transition-all text-center';
  if (ativa) {
    return `${base} bg-[#009c3b]/30 text-[#ffdf00] border border-[#009c3b]/40 shadow-[0_0_10px_rgba(0,156,59,0.2)]`;
  }
  return `${base} text-white/60 hover:text-white/80`;
}

export function AbasCopaGrupo({
  aba,
  onMudar,
  grupoId,
  temporadaId,
}: Readonly<PropsAbasCopaGrupo>) {
  return (
    <>
      <div className="flex gap-1 p-1 rounded-xl bg-[#009c3b]/10 border border-[#009c3b]/20">
        {ABAS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onMudar(item.id)}
            className={classeAba(aba === item.id)}
            data-testid={item.testId}
          >
            {item.rotulo}
          </button>
        ))}
      </div>

      {aba === 'dashboard' && (
        <AbaDashboardCopa grupoId={grupoId} temporadaId={temporadaId} />
      )}
      {aba === 'classificacao' && <AbaClassificacaoCopa temporadaId={temporadaId} />}
      {aba === 'palpites' && (
        <AbaMeusPalpitesCopa grupoId={grupoId} temporadaId={temporadaId} />
      )}
    </>
  );
}
