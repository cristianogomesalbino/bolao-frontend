# Requisitos — Unificação de Campeonatos

## Contexto

A configuração de campeonatos está duplicada entre backend (constantes em `jogos.constants.ts`) e frontend (array hardcoded em `jogo.types.ts`). A lógica de diferenciação entre campeonatos usa if/else por slug e string matching por nome, espalhada em ~15 arquivos. Isso impede adicionar novos campeonatos sem alterar código em dezenas de lugares.

O tema visual da Copa do Mundo está hardcoded em ~10 componentes via boolean `temaCopa` / `ehCopaMundo`.

## Requisitos

### REQ-1: Modelo de dados enriquecido para Campeonato
- O model `Campeonato` no Prisma deve incluir: `slug` (String, unique), `externoId` (String?, ID na API GE), `tema` (Json?, configuração visual), `tipo` (String?, ex: 'LIGA' | 'COPA')
- O model `Fase` deve incluir: `slugExterno` (String?, slug da fase na API externa) e `maxRodadas` (Int, número máximo de rodadas)
- Migration deve popular os campos para os campeonatos existentes (Brasileirão e Copa do Mundo 2026)
- Campos opcionais — não quebram dados existentes

### REQ-2: Endpoint de configuração de campeonatos
- Novo endpoint público `GET /campeonatos/config` que retorna lista de campeonatos com suas fases, slugs, tema e metadados
- Resposta inclui: id, slug, nome, tipo, tema, e array de fases (id, nome, slugExterno, tipo, maxRodadas, ordem)
- Cacheable — dados mudam raramente (staleTime longo no frontend)
- Substitui a necessidade do frontend manter array `CAMPEONATOS` hardcoded

### REQ-3: Backend usa dados do banco em vez de constantes hardcoded
- `SincronizacaoAutomaticaService.resolverCampeonatoSlug()` deve usar campo `slug` do model Campeonato (via relação fase → temporada → campeonato) em vez de string matching por nome
- `SincronizacaoAutomaticaService.resolverFaseSlug()` deve usar campo `slugExterno` da Fase em vez de if/else por campeonato
- Eliminar `resolverFaseSlugCopa()` — resolvido pelo `slugExterno`
- `CAMPEONATO_CONFIGS` continua existindo como fallback/validação mas não é mais a fonte primária
- `BRASILEIRAO_CAMPEONATO_ID` e `COPA_DO_MUNDO_CAMPEONATO_ID` migram para campo `externoId` no banco

### REQ-4: Frontend consome configuração do backend
- Substituir array hardcoded `CAMPEONATOS` em `jogo.types.ts` por dados buscados via `GET /campeonatos/config`
- O tipo `CampeonatoSlug` passa a ser `string` (não mais union type fechada)
- Criar hook `useCampeonatosConfig()` com React Query (staleTime: 1h)
- Página de admin/importar e hook `usePalpitesData` devem consumir o hook em vez de constantes
- Eliminar `ehCampeonatoCopa()` baseado em nome — usar `slug === 'copa-do-mundo-2026'` via config

### REQ-5: Arquivo de configuração visual da Copa do Mundo
- Criar arquivo `src/config/temas/copa-do-mundo.ts` centralizando TODAS as cores, classes CSS e efeitos visuais da Copa que hoje estão espalhados nos componentes
- Inclui: cores de fundo, header, bordas, botões, efeitos glow (posição, cor, tamanho, blur)
- Componentes passam a importar deste arquivo em vez de hardcodar strings de cor
- O tema da Copa é FIXO (não personalizável pelo usuário) — tratamento especial

### REQ-6: Estrutura de temas preparada para personalização futura
- Criar arquivo `src/config/temas/default.ts` com tema padrão do app (cores atuais do Brasileirão/genérico)
- Criar `src/config/temas/index.ts` que exporta interface `TemaConfig` e função `obterTema(slug)` que retorna o tema correto
- Interface `TemaConfig` deve ser extensível (campos opcionais para efeitos visuais, ícones, etc.)
- Lógica: se campeonato === 'copa-do-mundo-2026' → tema fixo da Copa. Caso contrário → tema default (futuro: tema do usuário)
- NÃO implementar personalização pelo usuário agora — apenas preparar a estrutura

### REQ-7: Componentes unificados com tema genérico
- Substituir boolean `temaCopa` / `ehCopaMundo` nos componentes por objeto de tema
- Componentes recebem tema via prop ou context em vez de decidir internamente
- A página de palpites seleciona o tema baseado no campeonato ativo e passa para os filhos
- Manter renderização condicional de efeitos glow (só Copa tem) via flag `tema.glow`

### REQ-8: Eliminação de detecção por nome de campeonato
- Todo código que usa `nome.includes('brasileiro')`, `nome.includes('copa')`, `nome.includes('Série A')` deve ser substituído por comparação de `slug`
- A relação `temporada → campeonato` deve incluir `slug` no select para que o frontend tenha acesso direto
- `usePalpitesData` deve filtrar grupos/temporadas por `campeonato.slug` em vez de `ehCampeonatoCopa(nome)`

## Requisitos Não-Funcionais

### RNF-1: Retrocompatibilidade
- Nenhum endpoint existente pode quebrar
- Dados existentes no banco devem continuar funcionando (migration não-destrutiva)
- O array `CAMPEONATO_CONFIGS` no backend pode ser mantido como fallback durante a transição

### RNF-2: Performance
- O endpoint `/campeonatos/config` deve responder em <50ms (dados simples, poucas linhas)
- Frontend cacheia resultado por 1h — zero requests adicionais por sessão normal
- Queries de sincronização não devem ter degradação (índice em `slug`)

### RNF-3: Manutenibilidade
- Adicionar um novo campeonato deve requerer apenas: 1 insert no banco + 1 arquivo de tema (se visual especial) — zero alterações em componentes
- Tema da Copa concentrado em 1 arquivo, não espalhado em componentes

## Fora de Escopo (futuro)

- Personalização de cores pelo usuário (preferência pessoal)
- Tema por grupo (admin do grupo escolhe cores)
- Temas sazonais ou dinâmicos
- Unificação de `AbaJogosCopa` + `AbaTodosJogos` (componente único adaptativo) — pode vir depois
- `ChaveamentoService` continua específico da Copa (regra de torneio legítima)
