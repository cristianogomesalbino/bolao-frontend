# Design Técnico — Unificação de Campeonatos

## Visão Geral da Arquitetura

A refatoração transforma o sistema de campeonatos de **hardcoded/disperso** para **config-driven/centralizado**, mantendo a mesma estrutura relacional no banco e os mesmos endpoints para jogos/palpites.

```
┌─────────────────────────────────────────────────────────────┐
│                        BANCO (Prisma)                        │
│  Campeonato (slug, externoId, tipo, tema, status)           │
│  Fase (slugExterno, maxRodadas)                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    BACKEND (NestJS)                           │
│                                                              │
│  GET /campeonatos/config ──► CampeonatoConfigPresenter       │
│                                                              │
│  SincronizacaoService ──► lê slug/slugExterno do banco       │
│  ChaveamentoService ──► lê bracket config por parâmetro      │
│  FutebolApiService ──► lê externoId do banco                 │
│                                                              │
│  src/config/campeonatos/                                     │
│    brasileirao/ (fases, tema)                                │
│    copa-do-mundo/ (fases, tema, bracket, alocação)           │
└──────────────────────────┬──────────────────────────────────┘
                           │ GET /campeonatos/config
┌──────────────────────────▼──────────────────────────────────┐
│                   FRONTEND (Next.js)                          │
│                                                              │
│  useCampeonatosConfig() ──► React Query (staleTime 1h)       │
│                                                              │
│  src/config/temas/                                           │
│    default.ts, copa.ts, index.ts                             │
│                                                              │
│  TemaProvider (Context) ──► injeta tema nos componentes      │
│  ListaJogos (unificado) ──► adapta por tipo de fase          │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Modelo de Dados (Prisma)

### Campeonato — Campos Adicionados

```prisma
model Campeonato {
  id           String            @id @default(uuid())
  nome         String
  slug         String            @unique
  externoId    String?           // ID na API GE
  tipo         TipoCampeonato    @default(LIGA)
  tema         Json?             // { corPrimaria, corSecundaria, corFundo, ... }
  status       StatusCampeonato  @default(ATIVO)
  dataCriacao  DateTime          @default(now())
  atualizadoEm DateTime          @updatedAt
  temporadas   Temporada[]
}

enum TipoCampeonato {
  LIGA
  COPA
}

enum StatusCampeonato {
  ATIVO
  EM_BREVE
  ENCERRADO
}
```

### Fase — Campos Adicionados

```prisma
model Fase {
  id           String    @id @default(uuid())
  nome         String
  tipo         TipoFase
  ordem        Int
  idaVolta     Boolean   @default(false)
  slugExterno  String?   // slug na API GE (ex: "fase-de-grupos-copa-do-mundo-2026")
  maxRodadas   Int       @default(38)
  temporadaId  String
  dataCriacao  DateTime  @default(now())
  atualizadoEm DateTime  @updatedAt
  temporada    Temporada @relation(fields: [temporadaId], references: [id])
  jogos        Jogo[]

  @@index([temporadaId])
}
```

### Migration Strategy

1. `ALTER TABLE` para adicionar campos opcionais (zero downtime)
2. Script de seed popula dados existentes:
   - Brasileirão: `slug='brasileirao'`, `externoId='d1a37fa4-...'`, `tipo=LIGA`, `status=ATIVO`
   - Copa 2026: `slug='copa-do-mundo'`, `externoId='b5ff9c28-...'`, `tipo=COPA`, `status=ENCERRADO`
3. Popular `slugExterno` e `maxRodadas` nas Fases existentes via script

---

## 2. Estrutura de Arquivos de Configuração (Backend)

```
src/config/campeonatos/
├── index.ts
├── types.ts
├── brasileirao/
│   ├── config.ts
│   ├── fases.ts
│   └── tema.ts
└── copa-do-mundo/
    ├── config.ts
    ├── fases.ts
    ├── tema.ts
    ├── bracket.ts
    └── alocacao-terceiros.ts
```

### types.ts — Interfaces Centrais

```typescript
export interface TemaConfig {
  corPrimaria: string;
  corSecundaria: string;
  corFundo?: string;
  corBorda?: string;
  efeitos?: {
    glow?: boolean;
    glowConfig?: Array<{ posicao: string; cor: string; tamanho: string; blur: string }>;
  };
  icone?: string;
}

export interface FaseConfig {
  slug: string;
  tipo: 'PONTOS_CORRIDOS' | 'MATA_MATA';
  maxRodadas: number;
}

export interface BracketEntry {
  rodada: number;
  casa: string;
  fora: string;
  dataHora?: string;
}

export interface BracketConfig {
  fasesEliminatorias: Array<{
    nome: string;
    slug: string;
    totalJogos: number;
    origem: 'grupos' | 'fase-anterior';
  }>;
  chaveamento: Record<string, BracketEntry[]>; // slug da fase → entries
  alocacaoTerceiros?: Record<string, string[]>;
}

export interface CampeonatoLocalConfig {
  slug: string;
  externoId: string;
  tipo: 'LIGA' | 'COPA';
  nome: string;
  tema: TemaConfig;
  fases: FaseConfig[];
  bracket?: BracketConfig;
}
```

### index.ts — Registry

```typescript
import { brasileiraoConfig } from './brasileirao/config';
import { copaConfig } from './copa-do-mundo/config';
import type { CampeonatoLocalConfig } from './types';

const CAMPEONATO_REGISTRY: Record<string, CampeonatoLocalConfig> = {
  brasileirao: brasileiraoConfig,
  'copa-do-mundo': copaConfig,
};

export function obterConfigLocal(slug: string): CampeonatoLocalConfig | null {
  return CAMPEONATO_REGISTRY[slug] ?? null;
}

export function obterBracketConfig(slug: string): BracketConfig | null {
  return CAMPEONATO_REGISTRY[slug]?.bracket ?? null;
}
```

---

## 3. Endpoint GET /campeonatos/config

### Controller

```typescript
@Public()
@Get('config')
@ApiOperation({ summary: 'Retorna configuração de campeonatos ativos' })
async obterConfig(@Query('incluirEncerrados') incluirEncerrados?: string) {
  const campeonatos = await this.campeonatosService.buscarConfig(
    incluirEncerrados === 'true'
  );
  return campeonatos.map(CampeonatoConfigPresenter.toHttp);
}
```

### Service

```typescript
async buscarConfig(incluirEncerrados: boolean) {
  const filtro = incluirEncerrados
    ? {}
    : { status: { in: ['ATIVO', 'EM_BREVE'] } };

  return this.campeonatoRepo.buscarComFases(filtro);
}
```

### Repository — Novo método

```typescript
async buscarComFases(filtro: { status?: { in: string[] } }) {
  return this.prisma.campeonato.findMany({
    where: filtro,
    include: {
      temporadas: {
        include: {
          fases: {
            orderBy: { ordem: 'asc' },
            select: { id: true, nome: true, tipo: true, slugExterno: true, maxRodadas: true, ordem: true },
          },
        },
        orderBy: { ano: 'desc' },
        take: 1, // Apenas temporada mais recente
      },
    },
    orderBy: { nome: 'asc' },
  });
}
```

### Presenter — CampeonatoConfigPresenter

```typescript
export class CampeonatoConfigPresenter {
  static toHttp(campeonato: CampeonatoComFases) {
    const temporada = campeonato.temporadas[0];
    return {
      id: campeonato.id,
      slug: campeonato.slug,
      nome: campeonato.nome,
      tipo: campeonato.tipo,
      tema: campeonato.tema,
      status: campeonato.status,
      temporadaId: temporada?.id ?? null,
      fases: (temporada?.fases ?? []).map(f => ({
        id: f.id,
        nome: f.nome,
        tipo: f.tipo,
        slugExterno: f.slugExterno,
        maxRodadas: f.maxRodadas,
        ordem: f.ordem,
      })),
    };
  }
}
```

### Response Shape

```json
[
  {
    "id": "uuid",
    "slug": "brasileirao",
    "nome": "Brasileirão Série A",
    "tipo": "LIGA",
    "tema": { "corPrimaria": "#1B5E20", "corSecundaria": "#FFFFFF" },
    "status": "ATIVO",
    "temporadaId": "uuid",
    "fases": [
      { "id": "uuid", "nome": "Fase Única 2027", "tipo": "PONTOS_CORRIDOS", "slugExterno": "fase-unica-campeonato-brasileiro-2027", "maxRodadas": 38, "ordem": 1 }
    ]
  }
]
```

---

## 4. Refatoração do SincronizacaoAutomaticaService

### Antes (string matching)

```typescript
private resolverCampeonatoSlug(nome?: string): string | null {
  if (nome?.includes('brasileiro')) return 'brasileirao';
  if (nome?.includes('copa do mundo')) return 'copa-do-mundo-2026';
  return null;
}
```

### Depois (campo do banco)

```typescript
private async buscarFasesParaSincronizar(): Promise<FaseParaSync[]> {
  // Query já inclui campeonato.slug via relação
  const fases = await this.prisma.fase.findMany({
    where: { id: { in: fasesIds } },
    include: {
      temporada: {
        include: { campeonato: { select: { slug: true } } },
      },
    },
  });

  return fases
    .filter(f => f.slugExterno) // Só sincroniza fases com slug externo definido
    .map(f => ({
      faseId: f.id,
      faseSlug: f.slugExterno!,
      campeonatoSlug: f.temporada.campeonato.slug,
      totalPendentes: /* count */,
    }));
}
```

**Métodos eliminados:** `resolverCampeonatoSlug()`, `resolverFaseSlug()`, `resolverFaseSlugCopa()`

---

## 5. Refatoração do ChaveamentoService

### Antes (importa constantes diretamente)

```typescript
import { COPA_CHAVEAMENTO_16AVOS } from '../jogos.constants';
// ... usa COPA_CHAVEAMENTO_16AVOS diretamente
```

### Depois (recebe config por parâmetro)

```typescript
import { obterBracketConfig } from '../../config/campeonatos';
import type { BracketConfig } from '../../config/campeonatos/types';

async preencherProximaFaseEliminatoria(
  temporadaId: string,
  campeonatoSlug: string,
): Promise<void> {
  const bracket = obterBracketConfig(campeonatoSlug);
  if (!bracket) return; // Campeonato sem bracket (liga)

  // Lógica genérica usando bracket.chaveamento, bracket.alocacaoTerceiros
}
```

O service deixa de saber que "Copa do Mundo" existe — ele opera sobre `BracketConfig` genérico.

---

## 6. Frontend — Sistema de Temas

### Estrutura

```
src/config/temas/
├── index.ts          # obterTema(slug), TemaProvider
├── types.ts          # TemaConfig interface
├── default.ts        # Tema padrão (Brasileirão/genérico)
└── copa.ts           # Tema Copa (fixo)
```

### types.ts

```typescript
export interface TemaConfig {
  slug: string;
  corPrimaria: string;
  corSecundaria: string;
  corFundo: string;
  corFundoHeader: string;
  corBorda: string;
  corBotaoAtivo: string;
  corTextoAtivo: string;
  efeitos: {
    glow: boolean;
    glowLayers?: Array<{
      posicao: string;
      cor: string;
      tamanho: string;
      blur: string;
    }>;
  };
  icone: string; // emoji
}
```

### default.ts

```typescript
import type { TemaConfig } from './types';

export const TEMA_DEFAULT: TemaConfig = {
  slug: 'default',
  corPrimaria: 'var(--primaria)',
  corSecundaria: '#FFFFFF',
  corFundo: 'bg-fundo',
  corFundoHeader: 'bg-fundo/95',
  corBorda: 'border-white/[0.05]',
  corBotaoAtivo: 'bg-primaria/20 text-primaria-claro border-primaria/30',
  corTextoAtivo: 'text-primaria-claro',
  efeitos: { glow: false },
  icone: '⚽',
};
```

### copa.ts

```typescript
import type { TemaConfig } from './types';

export const TEMA_COPA: TemaConfig = {
  slug: 'copa-do-mundo',
  corPrimaria: '#009c3b',
  corSecundaria: '#ffdf00',
  corFundo: 'bg-[#003d1a]',
  corFundoHeader: 'bg-[#003d1a]/90',
  corBorda: 'border-[#009c3b]/30',
  corBotaoAtivo: 'bg-[#009c3b]/20 text-[#ffdf00] border-[#009c3b]/40',
  corTextoAtivo: 'text-[#ffdf00]',
  efeitos: {
    glow: true,
    glowLayers: [
      { posicao: 'top-[-40px] left-[10%]', cor: 'bg-[#00b340]/25', tamanho: 'w-[500px] h-[300px]', blur: 'blur-[120px]' },
      { posicao: 'top-[20px] right-[5%]', cor: 'bg-[#ffdf00]/12', tamanho: 'w-[400px] h-[250px]', blur: 'blur-[90px]' },
      { posicao: 'bottom-[0px] left-[15%]', cor: 'bg-[#00b340]/20', tamanho: 'w-[500px] h-[300px]', blur: 'blur-[120px]' },
    ],
  },
  icone: '🏆',
};
```

### index.ts

```typescript
import { TEMA_DEFAULT } from './default';
import { TEMA_COPA } from './copa';
import type { TemaConfig } from './types';

const TEMAS: Record<string, TemaConfig> = {
  'copa-do-mundo': TEMA_COPA,
};

export function obterTema(slug?: string): TemaConfig {
  if (!slug) return TEMA_DEFAULT;
  return TEMAS[slug] ?? TEMA_DEFAULT;
}

export type { TemaConfig };
```

### TemaProvider (React Context)

```typescript
'use client';
import { createContext, useContext } from 'react';
import { obterTema, type TemaConfig } from '@/config/temas';

const TemaContext = createContext<TemaConfig>(obterTema());

export function TemaProvider({ slug, children }: { slug?: string; children: React.ReactNode }) {
  const tema = obterTema(slug);
  return <TemaContext.Provider value={tema}>{children}</TemaContext.Provider>;
}

export function useTema(): TemaConfig {
  return useContext(TemaContext);
}
```

---

## 7. Frontend — Hook useCampeonatosConfig

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface CampeonatoConfigResponse {
  id: string;
  slug: string;
  nome: string;
  tipo: 'LIGA' | 'COPA';
  tema: Record<string, any> | null;
  status: 'ATIVO' | 'EM_BREVE' | 'ENCERRADO';
  temporadaId: string | null;
  fases: Array<{
    id: string;
    nome: string;
    tipo: 'PONTOS_CORRIDOS' | 'MATA_MATA';
    slugExterno: string | null;
    maxRodadas: number;
    ordem: number;
  }>;
}

export function useCampeonatosConfig() {
  return useQuery<CampeonatoConfigResponse[]>({
    queryKey: ['campeonatos-config'],
    queryFn: () => api.get('/campeonatos/config').then(r => r.data),
    staleTime: 1000 * 60 * 60, // 1h
    gcTime: 1000 * 60 * 60 * 24, // 24h no cache
  });
}
```

---

## 8. Frontend — Componente Unificado ListaJogos

### Lógica de decisão

```typescript
interface PropsListaJogos {
  fases: Fase[];
  grupoId: string;
  temporadaId: string;
  cardAtivo: string | null;
  onFoco: (jogoId: string) => void;
}

export function ListaJogos({ fases, ...props }: PropsListaJogos) {
  const tema = useTema();

  // Decidir layout baseado na estrutura de fases
  const fasesPC = fases.filter(f => f.tipo === 'PONTOS_CORRIDOS');
  const fasesMM = fases.filter(f => f.tipo === 'MATA_MATA');

  // 1 fase PC → navegação por rodada (Brasileirão)
  if (fasesPC.length === 1 && fasesMM.length === 0) {
    return <ListaRodadas fase={fasesPC[0]} tema={tema} {...props} />;
  }

  // N fases PC (grupos) + fases MM (eliminatórias) → tabs Copa-style
  if (fasesPC.length > 1 || fasesMM.length > 0) {
    return <ListaFasesComTabs fases={fases} tema={tema} {...props} />;
  }

  // Fallback
  return <ListaRodadas fase={fases[0]} tema={tema} {...props} />;
}
```

### Sub-componentes

- `ListaRodadas` — navegação prev/next por rodada (absorve lógica de `AbaTodosJogos`)
- `ListaFasesComTabs` — pills de fase + jogos agrupados (absorve lógica de `AbaJogosCopa`)
- Ambos recebem `tema: TemaConfig` e aplicam cores via tema

---

## 9. Diagrama de Dependências (Antes vs Depois)

### Antes

```
jogos.constants.ts (2000+ linhas)
├── JogoService
├── SincronizacaoService (resolverCampeonatoSlug, resolverFaseSlug, resolverFaseSlugCopa)
├── ChaveamentoService (COPA_CHAVEAMENTO_16AVOS, COPA_BRACKET_*, TABELA_ALOCACAO)
├── FutebolApiService (BRASILEIRAO_CAMPEONATO_ID)
├── ImportarJogosDto (CAMPEONATO_SLUGS)
├── CampeonatoPresenter (CAMPEONATO_CONFIGS)
└── 20+ arquivos de teste
```

### Depois

```
src/config/campeonatos/
├── brasileirao/ (config, fases, tema)
├── copa-do-mundo/ (config, fases, tema, bracket, alocação)
└── index.ts (registry)

Banco (Campeonato.slug, Fase.slugExterno)
├── SincronizacaoService (lê do banco via JOIN)
├── CampeonatosService.buscarConfig() (query simples)
└── CampeonatoConfigPresenter (dados do banco)

ChaveamentoService
└── obterBracketConfig(slug) ← lê de config/campeonatos/copa-do-mundo/bracket.ts

Frontend
└── useCampeonatosConfig() → GET /campeonatos/config (1 request cacheada)
```

---

## 10. Plano de Migração (Ordem de Execução)

### Fase 1 — Backend: Schema + Endpoint (sem quebrar nada)

1. Migration: adicionar campos ao Campeonato e Fase
2. Seed: popular dados existentes
3. Criar `src/config/campeonatos/` com arquivos de configuração
4. Criar endpoint `GET /campeonatos/config`
5. Testes unitários dos novos métodos

### Fase 2 — Backend: Refatorar Services

6. `SincronizacaoAutomaticaService` → usar slug do banco
7. `ChaveamentoService` → receber bracket por parâmetro
8. `FutebolApiService` → ler `externoId` do banco
9. Remover constantes mortas de `jogos.constants.ts`
10. Testes de integração

### Fase 3 — Frontend: Config + Temas

11. Criar `src/config/temas/` (default, copa, index, types)
12. Criar hook `useCampeonatosConfig()`
13. Criar `TemaProvider`
14. Remover `CAMPEONATOS` hardcoded de `jogo.types.ts`
15. Substituir `ehCampeonatoCopa()` por slug/tipo

### Fase 4 — Frontend: Componentes

16. Criar `ListaJogos` unificado (ListaRodadas + ListaFasesComTabs)
17. Refatorar `palpites/page.tsx` para usar TemaProvider + ListaJogos
18. Refatorar `grupos/[grupoId]/page.tsx` para usar slug
19. Refatorar `admin/importar/page.tsx` para consumir hook
20. Remover componentes obsoletos (`AbaJogosCopa`, `AbaTodosJogos`)
21. Remover `useHomeData` detecção por nome

---

## 11. Decisões Técnicas

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| Onde mora o bracket? | Arquivo TS local (`config/campeonatos/copa/bracket.ts`) | São dados estáticos que mudam a cada 4 anos — não justifica query ao banco |
| Onde mora o tema? | Arquivo TS local + campo `tema` no banco | Arquivo local pro rendering, banco pro endpoint config |
| Onde mora o status? | Banco (`Campeonato.status`) | Permite ativar/desativar sem deploy |
| Onde mora o slugExterno da fase? | Banco (`Fase.slugExterno`) | Sync precisa resolver em runtime via query |
| Como frontend sabe o tema? | `TemaProvider` + `useTema()` | Evita prop drilling em 10 níveis |
| ChaveamentoService genérico? | Sim, via `BracketConfig` | Mesmo service serve Copa 2030 sem alteração |
| Manter `CAMPEONATO_CONFIGS`? | Não — deletar após migração completa | Substituído por banco + config local |
