# Requisitos — Unificação de Campeonatos

## Contexto

A configuração de campeonatos está duplicada entre backend (constantes em `jogos.constants.ts`) e frontend (array hardcoded em `jogo.types.ts`). A lógica de diferenciação entre campeonatos usa if/else por slug e string matching por nome, espalhada em ~30 arquivos. Quando a Copa do Mundo 2026 foi adicionada, exigiu alterações em dezenas de arquivos, criação de componentes inteiramente separados (`AbaJogosCopa`, `AbaDashboardCopa`, etc.) e espalhamento de cores hardcoded em ~10 componentes.

**Premissa:** Esta refatoração será executada **após a Copa do Mundo 2026**. O objetivo é que o próximo torneio (Copa 2030, Copa América, etc.) seja adicionado por **configuração**, não por código espalhado em 30 arquivos.

## Problemas que esta refatoração resolve

1. Duplicação de config `CAMPEONATOS` entre frontend e backend
2. Detecção de campeonato por nome (`includes('copa')`, `includes('brasileiro')`) — frágil e quebrável
3. Cores da Copa espalhadas em ~10 componentes via `temaCopa: boolean`
4. `resolverFaseSlugCopa()` com string matching hardcoded no sync
5. Componentes de listagem de jogos duplicados (`AbaTodosJogos` vs `AbaJogosCopa`)
6. `ChaveamentoService` acoplado à Copa 2026 específica (não reutilizável para Copa 2030)
7. `buscarClassificacao()` no `FutebolApiService` — 100% hardcoded para Brasileirão

## Requisitos

### REQ-1: Modelo de dados enriquecido para Campeonato

**User Story:** Como admin, quero que os metadados de campeonato (slug, API externa, tema visual, tipo) estejam no banco de dados, para que novos campeonatos sejam adicionados sem alterar código.

**Acceptance Criteria:**
1. O model `Campeonato` no Prisma inclui: `slug` (String, unique), `externoId` (String?, ID na API GE), `tema` (Json?, configuração visual), `tipo` (String — 'LIGA' | 'COPA')
2. O model `Fase` inclui: `slugExterno` (String?, slug da fase na API externa) e `maxRodadas` (Int, número máximo de rodadas da fase)
3. Migration popula os campos para os campeonatos existentes via seed (Brasileirão + Copa do Mundo 2026 como dados históricos)
4. Campos adicionais são opcionais — dados existentes continuam funcionando sem alteração

### REQ-2: Endpoint de configuração de campeonatos

**User Story:** Como frontend, quero buscar a configuração de campeonatos disponíveis de um endpoint, para não hardcodar essa informação.

**Acceptance Criteria:**
1. Endpoint público `GET /campeonatos/config` retorna campeonatos com status ATIVO ou EM_BREVE
2. Resposta inclui: id, slug, nome, tipo, tema, status, e array de fases (id, nome, slugExterno, tipo, maxRodadas, ordem)
3. Campeonatos com status ENCERRADO não aparecem por default (param opcional `?incluirEncerrados=true`)
4. Response é leve (<2KB) e cacheable (Cache-Control ou ETag)

### REQ-3: Sincronização usa dados do banco

**User Story:** Como sistema, quero que a sincronização automática resolva campeonato e fase via dados do banco, para que novos campeonatos sejam sincronizados sem alterar código.

**Acceptance Criteria:**
1. `resolverCampeonatoSlug()` usa campo `slug` do Campeonato (via relação fase → temporada → campeonato) — elimina string matching por nome
2. `resolverFaseSlug()` usa campo `slugExterno` da Fase — elimina if/else e `resolverFaseSlugCopa()`
3. `CAMPEONATO_CONFIGS` permanece como constante para lógica de bracket/chaveamento que não pertence ao banco
4. IDs da API externa (`BRASILEIRAO_CAMPEONATO_ID`, `COPA_DO_MUNDO_CAMPEONATO_ID`) migram para campo `externoId` no banco

### REQ-4: Frontend consome configuração do backend

**User Story:** Como dev frontend, quero que a lista de campeonatos venha do backend, para não manter array `CAMPEONATOS` duplicado.

**Acceptance Criteria:**
1. Array hardcoded `CAMPEONATOS` em `jogo.types.ts` é removido
2. Hook `useCampeonatosConfig()` busca via `GET /campeonatos/config` (staleTime: 1h, prefetch no layout protegido)
3. Tipo `CampeonatoSlug` passa a ser `string` derivado da resposta
4. Página admin/importar, `usePalpitesData` e `useHomeData` consomem o hook
5. Abas de campeonato na tela de palpites são geradas dinamicamente a partir da config

### REQ-5: Sistema de temas por campeonato

**User Story:** Como dev frontend, quero que cores e estilos visuais de cada campeonato estejam centralizados em arquivos de configuração, para não ter `#003d1a` espalhado em 10 componentes.

**Acceptance Criteria:**
1. Arquivo `src/config/temas/copa.ts` centraliza TODAS as cores, classes e efeitos visuais (fundo, header, bordas, glow, botões)
2. Arquivo `src/config/temas/default.ts` define tema padrão (cores atuais genéricas)
3. `src/config/temas/index.ts` exporta interface `TemaConfig` e função `obterTema(slug: string)` que retorna tema correto
4. Temas fixos (Copa) são tratados diferente de temas padrão — lógica: se campeonato tem tema fixo (tipo COPA), usa o arquivo correspondente; caso contrário, usa default
5. Interface `TemaConfig` é extensível: cores primárias, secundárias, fundo, borda, glow (boolean + config), ícone

### REQ-6: Componentes usam tema via prop/context

**User Story:** Como dev frontend, quero que componentes recebam tema de forma genérica, para que trocar campeonato troque automaticamente o visual sem if/else.

**Acceptance Criteria:**
1. Boolean `temaCopa` / `ehCopaMundo` substituído por `tema: TemaConfig` em componentes compartilhados (cards, modais, headers)
2. Página de palpites resolve o tema a partir do campeonato ativo e injeta via React Context ou prop drilling
3. Efeitos especiais (glow, blurs) condicionados via `tema.efeitos.glow` em vez de `ehCopaMundo`
4. Componentes Copa-específicos (`AbaJogosCopa`, `AbaDashboardCopa`) são refatorados para receber tema como prop (preparação para reutilização em futuros torneios Copa-style)

### REQ-7: Componente unificado de listagem de jogos

**User Story:** Como dev frontend, quero um único componente de listagem que se adapte ao tipo de campeonato, para não ter `AbaJogosCopa` e `AbaTodosJogos` duplicados.

**Acceptance Criteria:**
1. Um componente `ListaJogos` que recebe as fases e renderiza de acordo com a estrutura:
   - 1 fase (PONTOS_CORRIDOS) → navegação por rodada (comportamento atual Brasileirão)
   - N fases do mesmo tipo → tabs/dropdown de fase + navegação por rodada (comportamento atual grupos Copa)
   - Fases mistas (PONTOS_CORRIDOS + MATA_MATA) → pills de fase eliminatória (comportamento atual Copa)
2. `AbaJogosCopa` e `AbaTodosJogos` são removidos e substituídos pelo componente unificado
3. Lógica específica de chaveamento (labels TBD, posições do bracket) fica em helpers, não no componente de listagem
4. O componente é agnóstico de campeonato — recebe tema + fases + jogos, renderiza

### REQ-8: ChaveamentoService reutilizável

**User Story:** Como dev backend, quero que o ChaveamentoService funcione para qualquer torneio com fase de grupos + eliminatórias, para não reescrever na Copa 2030.

**Acceptance Criteria:**
1. Dados de bracket (chaveamento, posições, tabela de alocação de terceiros) são armazenados como configuração associada ao campeonato, não como constantes hardcoded
2. O service recebe a configuração de bracket via parâmetro/injeção, não importa diretamente `COPA_CHAVEAMENTO_16AVOS`
3. Métodos genéricos: `preencherProximaFase()`, `propagarVencedores()`, `calcularClassificacao()` operam sobre config genérica
4. Constantes da Copa 2026 ficam em arquivo de seed/config como dados de referência
5. Para Copa 2030: basta inserir novo campeonato + novo bracket config — zero código novo no service

### REQ-9: Eliminação de detecção por nome

**User Story:** Como dev, quero que nenhum código detecte campeonato por substring do nome, para que renomear um campeonato no banco não quebre o sistema.

**Acceptance Criteria:**
1. Todo `nome.includes('brasileiro')`, `nome.includes('copa')`, `nome.includes('Série A')` substituído por comparação de `slug`
2. Relação `temporada → campeonato` inclui `slug` no select em todas as queries relevantes
3. `ehCampeonatoCopa()` no frontend substituído por `campeonato.tipo === 'COPA'` ou `campeonato.slug === 'copa-do-mundo-2030'`
4. Hook `usePalpitesData` filtra grupos/temporadas por `campeonato.slug`

### REQ-10: Status e visibilidade de campeonatos

**User Story:** Como admin, quero controlar quais campeonatos aparecem no app via status no banco, para ativar/desativar campeonatos sem deploy.

**Acceptance Criteria:**
1. Campo `status` no model Campeonato: ATIVO, EM_BREVE, ENCERRADO
2. Frontend exibe abas apenas para campeonatos ATIVO
3. Campeonatos EM_BREVE aparecem com badge "Em breve" (desabilitado)
4. Mudar status no banco muda visibilidade no app sem deploy
5. Quando há apenas 1 campeonato ATIVO, o seletor de abas é ocultado

## Requisitos Não-Funcionais

### RNF-1: Retrocompatibilidade de dados
- Migration não-destrutiva — campos novos opcionais com default null
- Dados existentes continuam funcionando sem alteração
- Seed popula campos para campeonatos existentes

### RNF-2: Performance
- Endpoint `/campeonatos/config` responde em <50ms
- Frontend cacheia por 1h — 1 request por sessão
- Índice em `Campeonato.slug` para queries rápidas
- Prefetch da config no layout protegido (zero latência percebida)

### RNF-3: Manutenibilidade (meta principal)
- Adicionar novo campeonato liga/pontos corridos: 1 insert no banco + 0 código
- Adicionar novo torneio copa-style: 1 insert no banco + 1 arquivo de bracket config + 1 arquivo de tema
- Zero alterações em componentes, services ou constantes

### RNF-4: Preparação para personalização
- Estrutura de temas suporta extensão futura (tema por usuário)
- Cascata prevista: tema do campeonato → [futuro] tema do usuário → tema default

## Premissas

1. **Execução pós-Copa 2026** — a refatoração acontece depois do encerramento do torneio
2. **Palpite é livre** — qualquer usuário pode palpitar em qualquer campeonato ativo, com ou sem grupo
3. **Ranking com início de contagem** — quando o usuário entrar num grupo, só conta palpites após a data de entrada. Será implementado como feature separada (fora desta spec)
4. **Arquivos de configuração por tipo de campeonato** — não por edição. Copa 2030 atualiza os mesmos arquivos da Copa 2026, não cria pasta nova

## Estrutura de Arquivos de Configuração

```
src/config/campeonatos/
├── index.ts                    # Registry — mapeia slug → config
├── types.ts                    # Interfaces (CampeonatoConfig, BracketConfig, TemaConfig)
│
├── brasileirao/
│   ├── config.ts               # Metadados (slug, externoId, tipo: 'LIGA')
│   ├── fases.ts                # Fases e rodadas (PONTOS_CORRIDOS, 38 rodadas)
│   └── tema.ts                 # Cores e estilos visuais
│
└── copa-do-mundo/
    ├── config.ts               # Metadados (slug, externoId, tipo: 'COPA')
    ├── fases.ts                # Fases (grupos + eliminatórias)
    ├── tema.ts                 # Cores, glow, efeitos visuais
    ├── bracket.ts              # Chaveamento (posições por rodada)
    └── alocacao-terceiros.ts   # Tabela de melhores terceiros
```

**Regra:** quando regras mudam (Copa 2030, Brasileirão muda rodadas), mantém os mesmos arquivos — não duplica.

## Política de Qualidade — TOLERÂNCIA ZERO

Esta refatoração é uma oportunidade de **eliminar toda dívida técnica** nos arquivos tocados. Não é apenas mover código — é reescrever com qualidade máxima.

### Regras obrigatórias para TODOS os arquivos criados ou editados nesta spec:

1. **Zero `any`** — todo parâmetro, retorno e variável tipado com interfaces próprias. Sem exceção.
2. **Zero complexidade cognitiva > 15** — extrair helpers privados com nomes descritivos. Se um método tem mais de 15 linhas de lógica condicional, quebrar.
3. **Zero optional chaining faltante** — `!obj || !obj.prop` → `!obj?.prop`. Sempre.
4. **Zero imports não utilizados** — limpar em cada arquivo tocado.
5. **Zero código morto** — funções, variáveis, constantes e componentes que ninguém chama são DELETADOS. Não comentados, deletados.
6. **Zero duplicação** — se a mesma lógica aparece 2x, extrair em helper. Se o mesmo dado existe em 2 lugares, eliminar um.
7. **Zero string mágica** — toda string de comparação (slugs, status, tipos) vem de constantes ou do banco. Nunca inline.
8. **Zero detecção por nome** — nenhum `includes('copa')`, `includes('brasileiro')`, `includes('Série A')` pode sobreviver.
9. **Zero boolean genérico para tipo de campeonato** — `temaCopa`, `ehCopaMundo`, `ehBrasileiro` são eliminados. Substituídos por tipo/slug/tema.
10. **Zero cor hardcoded em componente** — toda cor específica de campeonato vem do arquivo de tema correspondente.

### Regras Sonar / Tamanho de Arquivo:

11. **Máximo 300 linhas por arquivo** — se ultrapassar, dividir em módulos menores com responsabilidade clara. Arquivos de 1000+ linhas (ex: `jogos.constants.ts`, `chaveamento.service.ts`, `jogo.service.ts`) DEVEM ser quebrados.
12. **Máximo 50 linhas por função/método** — se ultrapassar, extrair sub-funções com nomes descritivos.
13. **Máximo 3 níveis de indentação** — se precisar de `if` dentro de `if` dentro de `if`, extrair em método privado ou usar early return.
14. **Máximo 4 parâmetros por função** — acima disso, usar objeto de opções tipado.
15. **Zero funções com mais de 1 responsabilidade** — se o nome do método tem "e" ou "ou" (ex: `importarESync`, `validarOuCriar`), dividir.
16. **Zero classes/services com mais de 1 domínio** — se um service faz CRUD + importação + sincronização + finalização, dividir em services especializados.
17. **Zero code smells de Sonar** — Long Method, God Class, Feature Envy, Data Clump devem ser eliminados.
18. **Complexidade ciclomática máxima: 10** — funções com mais de 10 caminhos possíveis devem ser decompostas.

### Arquivos conhecidos que DEVEM ser divididos nesta refatoração:

| Arquivo | Linhas atuais | Ação |
|---------|--------------|------|
| `jogos.constants.ts` | ~2000+ | Dividir: constantes de módulo ficam, configs migram para `src/config/campeonatos/` |
| `chaveamento.service.ts` | ~1107 | Dividir: lógica genérica no service, dados de bracket em config, helpers em arquivo separado |
| `jogo.service.ts` | ~1000+ | Dividir: CRUD em `JogoService`, importação em `ImportacaoService`, sync em `SincronizacaoService` |
| `sincronizacao-automatica.service.ts` | ~350 | Limpar: remover métodos mortos (resolverFaseSlugCopa, etc.) |
| `palpites/page.tsx` (frontend) | ~250+ | Extrair: lógica de detecção pro hook, layout pro componente, tema pro provider |
| `aba-jogos-copa.tsx` (frontend) | ~300+ | Eliminado — absorvido pelo componente unificado `ListaJogos` |

### Ao editar um arquivo existente:

- Corrigir **100% dos problemas de lint** nesse arquivo (não 10% — 100%)
- Tipar **todos** os retornos de repository e parâmetros de service
- Aplicar early returns em vez de ifs aninhados
- Quebrar funções longas (> 30 linhas) em helpers
- Adicionar `readonly` em membros que não são reatribuídos
- Formatar com Prettier antes de considerar pronto

### Critério de "pronto" para cada task:

1. `getDiagnostics` → 0 errors, 0 warnings corrigíveis
2. `npx vitest run` → 0 falhas
3. Build Docker → BUILD_OK
4. `npx eslint` nos arquivos tocados → 0 errors
5. Zero `any` em código novo
6. Testes unitários cobrindo a lógica nova

**Se algum destes critérios falhar, a task NÃO está completa.**

## Fora de Escopo

- Personalização de cores pelo usuário (preferência pessoal) — futuro
- Tema por grupo (admin do grupo escolhe cores) — futuro
- Temas sazonais ou dinâmicos — futuro
- Implementação da regra de início de contagem no grupo — feature separada
- Migração de dados da Copa 2026 para o novo formato durante a Copa — após encerramento
