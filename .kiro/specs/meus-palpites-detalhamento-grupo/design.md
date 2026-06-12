# Design Document — Meus Palpites: Detalhamento por Grupo

## Overview

Adicionar contexto de grupo na aba "Meus Palpites" e no chevron expandido dos cards de jogo. Inclui resolução de conflito quando o usuário participa de múltiplos grupos do mesmo campeonato, revelação progressiva de palpites dos membros conforme estado do jogo, e padronização do formato de pontuação em todo o app.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  PalpitesPage (page.tsx)                            │
│  ├── usePalpitesData (hook existente)               │
│  ├── useGrupoAtivoPalpites (hook novo)              │
│  │   ├── Detecta conflito de múltiplos grupos       │
│  │   ├── Seleciona grupo favorito ou único          │
│  │   └── Provê grupoAtivoId + podeTrocar           │
│  ├── SeletorGrupoPalpites (novo, se podeTrocar)     │
│  └── CardJogoPalpite (expandido melhorado)          │
│      └── ConteudoExpandidoGrupo (novo)              │
│          ├── PRE_JOGO → lista Palpitou/Pendente     │
│          ├── AO_VIVO → palpites revelados (X × Y)  │
│          └── FINALIZADO → palpites + PontuacaoPadrao│
└─────────────────────────────────────────────────────┘
```

### Fluxo de Dados por Estado

- **Pré-jogo**: `buscarEstatisticasPalpite` → membrosStatus (nome + boolean)
- **Ao vivo**: `buscarPalpitesDoGrupo` (endpoint novo) → nome + golsCasa + golsFora
- **Finalizado**: `obterDetalhamentoJogo` (existente) → nome + gols + pontosFinais + categoria

## Components and Interfaces

### PontuacaoPadrao (`src/components/ui/pontuacao-padrao.tsx`)

```typescript
interface PropsPontuacaoPadrao {
  pontos: number;
  temaCopa?: boolean;
}
// Renderiza: "3 pontos 🎯" | "1 ponto ⚡" | "0 pontos"
```

### useGrupoAtivoPalpites (`src/hooks/useGrupoAtivoPalpites.ts`)

```typescript
interface RetornoGrupoAtivo {
  grupoAtivoId: string | null;
  grupoAtivoNome: string | null;
  podeTrocar: boolean;
  gruposDisponiveis: { id: string; nome: string }[];
  semGrupoFavorito: boolean;
  semGrupos: boolean;
  trocarGrupo: (grupoId: string) => void;
}
export function useGrupoAtivoPalpites(campeonato: CampeonatoSlug): RetornoGrupoAtivo
```

### SeletorGrupoPalpites (`src/components/palpites/seletor-grupo-palpites.tsx`)

```typescript
interface PropsSeletorGrupo {
  grupoAtivo: { id: string; nome: string };
  gruposDisponiveis: { id: string; nome: string }[];
  onTrocar: (grupoId: string) => void;
  temaCopa?: boolean;
}
```

### ConteudoExpandidoGrupo (`src/components/palpites/conteudo-expandido-grupo.tsx`)

```typescript
interface PropsConteudoExpandidoGrupo {
  jogoId: string;
  grupoId: string;
  statusJogo: StatusJogo;
  golsCasaReal: number | null;
  golsForaReal: number | null;
  temaCopa?: boolean;
}
```

### Endpoint Novo: `GET /grupos/:grupoId/jogos/:jogoId/palpites-membros`

```typescript
// Guard: GroupRoleGuard (ADMIN, MEMBER)
// Condição: gols null se jogo AGENDADO/ADIADO
interface PalpiteMembroResponse {
  nome: string;
  golsCasa: number | null;
  golsFora: number | null;
  palpitou: boolean;
}
```

## Data Models

### Cores por Campeonato

```typescript
const CORES_CAMPEONATO = {
  brasileirao: {
    labelGrupo: 'text-primaria-claro bg-primaria/10 border-primaria/30',
    botaoTrocar: 'text-primaria-claro hover:text-primaria',
    palpitou: 'bg-primaria/20 text-primaria-claro',
    bolinha: 'bg-primaria shadow-[0_0_6px_rgba(34,197,94,0.6)]',
  },
  'copa-do-mundo-2026': {
    labelGrupo: 'text-[#ffdf00] bg-[#009c3b]/10 border-[#009c3b]/30',
    botaoTrocar: 'text-[#ffdf00] hover:text-[#ffdf00]/80',
    palpitou: 'bg-[#009c3b]/20 text-[#ffdf00]',
    bolinha: 'bg-[#009c3b] shadow-[0_0_6px_rgba(0,156,59,0.6)]',
  },
};
```

### Estado do Chevron

```typescript
type EstadoChevron = 'pre_jogo' | 'ao_vivo' | 'finalizado';

function determinarEstadoChevron(statusJogo: StatusJogo): EstadoChevron {
  if (statusJogo === 'EM_ANDAMENTO') return 'ao_vivo';
  if (statusJogo === 'FINALIZADO') return 'finalizado';
  return 'pre_jogo';
}
```

### React Query Keys

```typescript
['estatisticas-palpite', grupoId, jogoId]       // pré-jogo (existente)
['palpites-membros-grupo', grupoId, jogoId]     // ao vivo (novo)
['detalhamento-jogo', grupoId, jogoId]          // finalizado (existente)
```

## Error Handling

- Sem grupo favorito + 2+ grupos: exibir alerta e redirecionar para `/grupos`
- Sem nenhum grupo: exibir estado vazio com CTA para entrar em grupo
- Endpoint de palpites-membros retorna 403 se usuário não é membro: exibir mensagem "Entre no grupo para ver os palpites"
- Falha de rede no chevron expandido: exibir skeleton + retry automático via React Query

## Testing Strategy

- Hook `useGrupoAtivoPalpites`: testar cenários de 0, 1, 2+ grupos e favorito definido/ausente
- Componente `PontuacaoPadrao`: testar render para 0, 1, 3 pontos com/sem temaCopa
- `ConteudoExpandidoGrupo`: testar os 3 estados (pré, ao vivo, finalizado) com mocks
- Endpoint backend: testar guard, condição de ocultação de gols, e resposta correta
