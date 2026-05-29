# Code Review — Feature: Tela de Palpites (aba bottom nav)

**Data:** 29/05/2026  
**Projeto:** bolao-frontend  
**Branch:** feature/palpites  
**Revisor:** Kiro (assistido por MCP QA)

## Arquivos Analisados

| # | Arquivo | Linhas |
|---|---------|--------|
| 1 | `src/app/(protegido)/palpites/page.tsx` | 577 |
| 2 | `src/components/jogos/card-jogo-palpite.tsx` | ~270 |
| 3 | `src/components/layout/bottom-nav.tsx` | 50 |
| 4 | `src/components/icons/icon-palpite.tsx` | 42 |
| 5 | `src/services/palpite.service.ts` | 68 |
| 6 | `src/types/palpite.types.ts` | 37 |

---

## Análise SOLID

| Princípio | Status | Observação |
|-----------|--------|------------|
| **S** — Single Responsibility | ❌ Violado | `page.tsx` acumula: fetch de dados, lógica de filtro/ordenação, gerenciamento de estado de UI (dropdowns, abas), renderização de 3 seções distintas, cálculo de estatísticas. `CardJogoPalpite` mistura lógica de debounce/save com apresentação. |
| **O** — Open/Closed | ⚠️ Parcial | `calcularPontos` está hardcoded (3/1/0) — se a regra de pontuação mudar, precisa alterar a função. Deveria vir do backend ou ser configurável via constantes. |
| **L** — Liskov Substitution | ✅ OK | Não se aplica diretamente (sem herança), services são intercambiáveis com interface consistente. |
| **I** — Interface Segregation | ⚠️ Parcial | `CardJogoPalpite` recebe prop `classificacao` inteira mas não a utiliza no JSX — interface poluída com dados desnecessários. |
| **D** — Dependency Inversion | ❌ Violado | A page importa `apiClient` diretamente na queryFn (import dinâmico) em vez de depender da abstração (service layer). |

---

## Problemas Encontrados

### 🔴 Crítica (2)

---

#### CR-01: `useEffect` sem dependency array — executa em todo render

[bolao-frontend][REVIEW] - Arquivo: `src/components/jogos/card-jogo-palpite.tsx`
(Linha: ~44) useEffect sem dependency array causa re-execuções em todo render e potenciais loops infinitos (setPalpiteLocal → re-render → effect dispara novamente).

Implementado:
```tsx
useEffect(() => {
  const cached = queryClient.getQueryData<Palpite | null>(['meu-palpite', jogo.id]);
  if (cached && !palpiteLocal) {
    setPalpiteLocal(cached);
    palpiteRef.current = cached;
    setGolsCasa(cached.golsCasa);
    setGolsFora(cached.golsFora);
    golsRef.current = { golsCasa: cached.golsCasa, golsFora: cached.golsFora };
  }
}); // ← SEM DEPENDENCY ARRAY
```

Sugestão:
```tsx
useEffect(() => {
  const cached = queryClient.getQueryData<Palpite | null>(['meu-palpite', jogo.id]);
  if (cached && !palpiteLocal) {
    setPalpiteLocal(cached);
    palpiteRef.current = cached;
    setGolsCasa(cached.golsCasa);
    setGolsFora(cached.golsFora);
    golsRef.current = { golsCasa: cached.golsCasa, golsFora: cached.golsFora };
  }
}, [jogo.id, palpiteLocal, queryClient]);
```

**Severidade:** Crítica  
**Impacto:** Performance, estabilidade (possível loop infinito)

---

#### CR-02: Divergência de pontuação entre frontend e backend

[bolao-frontend][REVIEW] - Arquivo: `src/app/(protegido)/palpites/page.tsx`
(Linha: 14-27) + `src/components/jogos/card-jogo-palpite.tsx` (Linha: ~250)

A função `calcularPontos` retorna 3 (em cheio) e 1 (resultado), mas o backend usa 10/5/3. O card exibe "+10 pts" hardcoded para todos os jogos finalizados com palpite, independente do tipo de acerto. Falta também o cálculo de "acerto de 1 time" (3pts no backend).

Implementado:
```tsx
function calcularPontos(p: PalpiteComJogo): number {
  if (pc === rc && pf === rf) return 3;  // Backend: 10
  if (resultadoReal === resultadoPalpite) return 1;  // Backend: 5
  return 0;  // Backend: 3 (acerto de 1 time) ou 0
}

// No card: sempre "+10 pts" hardcoded
<span className="text-[10px] text-primaria font-semibold">+10 pts</span>
```

Sugestão:
```tsx
// src/lib/pontuacao.ts
const PONTOS = { ACERTO_EM_CHEIO: 10, ACERTO_RESULTADO: 5, ACERTO_UM_TIME: 3 } as const;

export function calcularPontos(p: PalpiteComJogo): number {
  if (!p.jogo || p.jogo.golsCasa === null || p.jogo.golsFora === null) return 0;
  const { golsCasa: rc, golsFora: rf } = p.jogo;
  const { golsCasa: pc, golsFora: pf } = p;

  if (pc === rc && pf === rf) return PONTOS.ACERTO_EM_CHEIO;
  const resultadoReal = rc > rf ? 'casa' : rc < rf ? 'fora' : 'empate';
  const resultadoPalpite = pc > pf ? 'casa' : pc < pf ? 'fora' : 'empate';
  if (resultadoReal === resultadoPalpite) return PONTOS.ACERTO_RESULTADO;
  if (pc === rc || pf === rf) return PONTOS.ACERTO_UM_TIME;
  return 0;
}

// No card: calcular dinamicamente
<span className="text-[10px] text-primaria font-semibold">
  +{calcularPontos(palpiteAtual, jogo)} pts
</span>
```

**Severidade:** Crítica  
**Impacto:** Dados incorretos exibidos ao usuário, inconsistência com backend

---

### 🟠 Alta (3)

---

#### CR-03: Página com 577 linhas — viola convenção de max ~200 (SRP)

[bolao-frontend][REVIEW] - Arquivo: `src/app/(protegido)/palpites/page.tsx`
(Linha: 1-577) Página acumula múltiplas responsabilidades: header, abas, filtros (2 dropdowns), lista de jogos (2 rodadas), aba "meus palpites" com cards de histórico, e barra de resumo fixa.

Implementado:
```tsx
export default function PalpitesPage() {
  // 10+ estados
  // 6+ queries
  // lógica de filtro
  // ~400 linhas de JSX com 3 seções distintas
}
```

Sugestão — decompor em:
```
page.tsx (~100 linhas)
├── orquestra queries e estado global
├── renderiza <HeaderPalpites />
├── renderiza <AbaTodosJogos jogos={...} />
└── renderiza <AbaMeusPalpites palpites={...} />

hooks/usePalpitesPage.ts
├── queries (grupos, fases, jogos, palpites batch)
├── lógica de rodada atual/próxima
└── retorna dados prontos para a page

components/palpites/
├── aba-todos-jogos.tsx
├── aba-meus-palpites.tsx (filtros + cards histórico)
├── filtro-rodada.tsx
├── filtro-tipo.tsx
├── resumo-palpites.tsx (barra fixa)
└── card-palpite-historico.tsx

lib/pontuacao.ts
└── calcularPontos() (lógica pura, testável isoladamente)
```

**Severidade:** Alta  
**Impacto:** Manutenibilidade, testabilidade, legibilidade

---

#### CR-04: Chamada à API diretamente no componente (viola convenção)

[bolao-frontend][REVIEW] - Arquivo: `src/app/(protegido)/palpites/page.tsx`
(Linha: 57-62) Import dinâmico de apiClient dentro da queryFn viola a convenção "NUNCA fazer chamadas à API diretamente nos componentes" e o princípio de Dependency Inversion.

Implementado:
```tsx
const { data: gruposData } = useQuery({
  queryKey: ['grupos-palpites'],
  queryFn: async () => {
    const { default: apiClient } = await import('@/lib/api-client');
    const response = await apiClient.get('/grupos', { params: { membro: true } });
    return response.data as Array<{ id: string; temporadaId: string }>;
  },
});
```

Sugestão:
```tsx
import { listarGrupos } from '@/services/grupo.service';

const { data: gruposData } = useQuery({
  queryKey: ['grupos-palpites'],
  queryFn: () => listarGrupos(),
  select: (grupos) => grupos.map(g => ({ id: g.id, temporadaId: g.temporadaId })),
});
```

**Severidade:** Alta  
**Impacto:** Arquitetura, manutenibilidade, testabilidade

---

#### CR-05: `useCallback` com dependency array vazio referenciando mutations

[bolao-frontend][REVIEW] - Arquivo: `src/components/jogos/card-jogo-palpite.tsx`
(Linha: 95-120) O `salvarComDebounce` captura `mutationCriar.mutate` e `mutationAtualizar.mutate` no closure, mas o `[]` no dependency array significa que usa a versão do primeiro render. Funciona por acaso porque `useMutation` retorna referências estáveis, mas é frágil e viola as regras de hooks.

Implementado:
```tsx
const salvarComDebounce = useCallback(() => {
  // referencia mutationAtualizar.mutate e mutationCriar.mutate
  debounceRef.current = setTimeout(() => {
    const gols = golsRef.current;
    const palpite = palpiteRef.current;
    if (palpite) {
      mutationAtualizar.mutate({ palpiteId: palpite.id, gols });
    } else {
      mutationCriar.mutate(gols);
    }
  }, 3000);
}, []); // ← deps vazias
```

Sugestão:
```tsx
const mutationCriarRef = useRef(mutationCriar);
const mutationAtualizarRef = useRef(mutationAtualizar);
useEffect(() => { mutationCriarRef.current = mutationCriar; }, [mutationCriar]);
useEffect(() => { mutationAtualizarRef.current = mutationAtualizar; }, [mutationAtualizar]);

const salvarComDebounce = useCallback(() => {
  if (debounceRef.current) clearTimeout(debounceRef.current);
  if (contagemRef.current) clearInterval(contagemRef.current);

  setContagem(3);
  let segundos = 3;
  contagemRef.current = setInterval(() => {
    segundos--;
    if (segundos > 0) setContagem(segundos);
    else { clearInterval(contagemRef.current!); setContagem(null); }
  }, 1000);

  debounceRef.current = setTimeout(() => {
    const gols = golsRef.current;
    const palpite = palpiteRef.current;
    if (palpite) {
      if (gols.golsCasa !== palpite.golsCasa || gols.golsFora !== palpite.golsFora) {
        mutationAtualizarRef.current.mutate({ palpiteId: palpite.id, gols });
      } else {
        setContagem(null);
      }
    } else {
      mutationCriarRef.current.mutate(gols);
    }
  }, 3000);
}, []);
```

**Severidade:** Alta  
**Impacto:** Estabilidade, manutenibilidade

---

### 🟡 Média (4)

---

#### CR-06: Bottom nav usa `router.push` em vez de `<Link>`

[bolao-frontend][REVIEW] - Arquivo: `src/components/layout/bottom-nav.tsx`
(Linha: 30) `router.push` não faz prefetch. O `<Link>` do Next.js faz prefetch automático quando o link entra no viewport, melhorando a percepção de velocidade na navegação.

Implementado:
```tsx
<button onClick={() => router.push(item.href)} aria-label={item.label}>
```

Sugestão:
```tsx
import Link from 'next/link';

<Link
  href={item.href}
  className={`relative flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-all active:scale-90 ${
    ativo ? 'text-primaria' : 'text-texto/30 hover:text-texto/50'
  }`}
  aria-label={item.label}
  aria-current={ativo ? 'page' : undefined}
  data-testid={`nav-btn-${item.label.toLowerCase()}`}
>
```

**Severidade:** Média  
**Impacto:** Performance (prefetch), SEO, acessibilidade

---

#### CR-07: Lógica de renderização duplicada (escudos + nomes de times)

[bolao-frontend][REVIEW] - Arquivo: `src/app/(protegido)/palpites/page.tsx` (Linhas: 400-470) + `src/components/jogos/card-jogo-palpite.tsx`
O bloco de renderização de escudo + glow + nome do time aparece 3 vezes na page (aba "meus palpites") e 2 vezes no card. Viola DRY.

Sugestão — extrair componente:
```tsx
interface PropsEscudoTime {
  time: { nome: string; sigla: string; escudo: string | null } | null;
  tamanho?: 'sm' | 'md';
}

export function EscudoTime({ time, tamanho = 'md' }: Readonly<PropsEscudoTime>) {
  const dim = tamanho === 'md' ? 'h-14 w-14' : 'h-10 w-10';
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <div className={`relative ${dim} flex items-center justify-center`}>
        <div className="absolute inset-0 rounded-full bg-white/30 blur-lg" />
        {time?.escudo ? (
          <img src={time.escudo} alt={time.nome} className={`relative ${dim} object-contain`} />
        ) : (
          <div className={`relative ${dim} rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-bold text-texto/50`}>
            {time?.sigla || '?'}
          </div>
        )}
      </div>
      <span className="text-xs text-texto font-medium truncate max-w-[70px]">
        {time?.nome || '?'}
      </span>
    </div>
  );
}
```

**Severidade:** Média  
**Impacto:** Manutenibilidade, DRY

---

#### CR-08: Erros silenciados nos services (catch vazio)

[bolao-frontend][REVIEW] - Arquivo: `src/services/palpite.service.ts`
(Linhas: 27, 42) `buscarMeusPalpitesPorJogos` e `buscarEstatisticasPalpite` engolem erros silenciosamente. Se o backend retornar 500, o usuário não vê nada e não há log para debugging.

Implementado:
```tsx
} catch {
  return [];
}
```

Sugestão:
```tsx
} catch (error) {
  console.error('[palpite.service] Erro ao buscar palpites por jogos:', error);
  return [];
}
```

**Severidade:** Média  
**Impacto:** Debugabilidade, observabilidade

---

#### CR-09: Separadores de rodada com `sticky` podem colidir

[bolao-frontend][REVIEW] - Arquivo: `src/app/(protegido)/palpites/page.tsx`
(Linhas: 175, 210) Ambos os separadores de rodada usam `sticky top-[72px] z-10`. Se o usuário scrollar entre as duas rodadas, os dois sticky elements podem sobrepor visualmente.

**Severidade:** Média  
**Impacto:** UX, layout visual

---

### 🟢 Baixa (3)

---

#### CR-10: `data-testid` ausente nos elementos interativos

[bolao-frontend][REVIEW] - Arquivo: `src/app/(protegido)/palpites/page.tsx`
As abas, filtros, dropdowns e cards não possuem `data-testid`, dificultando testes E2E com Playwright (conforme steering de testabilidade).

**Severidade:** Baixa  
**Impacto:** Testabilidade

---

#### CR-11: Prop `classificacao` passada mas não utilizada

[bolao-frontend][REVIEW] - Arquivo: `src/components/jogos/card-jogo-palpite.tsx`
A prop `classificacao` é recebida na interface mas não é usada em nenhum lugar do JSX. Se era para mostrar posição dos times, está faltando; se não é mais necessária, remover (Interface Segregation).

**Severidade:** Baixa  
**Impacto:** Legibilidade, YAGNI

---

#### CR-12: `IconPalpite` exporta default e named (redundante)

[bolao-frontend][REVIEW] - Arquivo: `src/components/icons/icon-palpite.tsx`
(Linha: 42) Convenção do projeto é named exports. O `export default` é redundante.

Implementado:
```tsx
export function IconPalpite(...) { ... }
export default IconPalpite;
```

Sugestão:
```tsx
export function IconPalpite(...) { ... }
// remover export default
```

**Severidade:** Baixa  
**Impacto:** Consistência

---

## Análise SonarCloud

| Projeto | Status |
|---------|--------|
| `bolao-frontend` | ⚠️ Projeto criado, aguardando primeira análise (push pendente) |
| `bolao-backend` | Quality Gate: ❌ FAILED (1 Security Hotspot não revisado em `.github/workflows/main.yml`) |

**Backend — Issues do módulo de palpites:** Nenhuma issue específica encontrada.  
**Backend — Issues gerais (17 OPEN):** Todas MINOR/MAJOR pré-existentes (imports não usados, classes vazias, membros não-readonly). Nenhuma HIGH/BLOCKER.

---

## Resumo Executivo

| Severidade | Quantidade |
|-----------|-----------|
| 🔴 Crítica | 2 |
| 🟠 Alta | 3 |
| 🟡 Média | 4 |
| 🟢 Baixa | 3 |
| **Total** | **12** |

### Top 3 Problemas Mais Críticos

1. **CR-01** — `useEffect` sem dependency array (loop infinito potencial)
2. **CR-02** — Pontuação divergente do backend (dados incorretos ao usuário)
3. **CR-03** — Page com 577 linhas violando SRP e convenção do projeto

### Avaliação Geral: 5.5/10

O código funciona e a UX é bem pensada (debounce com countdown, batch de palpites, lazy loading de estatísticas). Porém, há problemas estruturais sérios: a page é um monolito, há bugs de hooks (useEffect sem deps), inconsistência de dados com o backend, e violação de convenções documentadas do projeto.

### Recomendação: ⚠️ Aprovado com Ressalvas

**Obrigatório antes de merge:**
- Corrigir CR-01 (useEffect sem deps)
- Corrigir CR-02 (pontuação)
- Corrigir CR-04 (chamada direta à API)

**Recomendado (pode ser follow-up):**
- CR-03 (decomposição da page)
- CR-05 (useCallback)
- CR-06 (Link em vez de router.push)
