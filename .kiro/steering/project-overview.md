---
inclusion: auto
description: Visão geral do projeto frontend — stack, estrutura de pastas, ambiente Docker e endpoints consumidos.
---

# Bolão Frontend — Visão Geral

PWA mobile-first para gerenciamento de bolões de campeonatos de futebol.

## Stack

- Next.js 15 (App Router) com TypeScript strict
- Tailwind CSS v4 (configuração via CSS @theme)
- shadcn/ui (componentes acessíveis customizados)
- Zustand (estado de autenticação)
- TanStack Query (data fetching com cache)
- React Hook Form + Zod (formulários e validação)
- Axios (HTTP client com interceptors de token refresh)
- PWA (@ducanh2912/next-pwa)
- Vitest + Testing Library + fast-check (testes)

## Ambiente de Desenvolvimento (Docker)

O projeto roda dentro de Docker com hot reload.

- Iniciar dev: `sh dev start-dev`
- Parar: `sh dev stop`
- Logs: `sh dev logs`
- Instalar pacotes: `sh dev npm install <pacote>`
- Executar npx: `sh dev npx <comando>`
- Build produção: `sh dev start-prod`

**IMPORTANTE:** Se precisar instalar pacotes, rodar `npm install` no host primeiro (o container monta o node_modules do host).

## Portas

| Serviço | Porta |
|---------|-------|
| Backend (NestJS) | 3002 |
| Frontend (Next.js) | 3003 |

## Estrutura de Pastas

```
src/
├── app/                    # Rotas (App Router)
│   ├── (auth)/             # Route group — páginas públicas (login, cadastro, etc.)
│   ├── (protegido)/        # Route group — requer autenticação
│   ├── layout.tsx          # Root layout (providers, PWA meta tags)
│   ├── page.tsx            # Raiz — redireciona pra /login ou /inicio
│   └── globals.css         # Tailwind v4 + paleta + animações
├── components/
│   ├── ui/                 # Primitivos shadcn/ui (Button, Input, Label, Card, Alert)
│   ├── auth/               # Componentes de autenticação (formulário login, warm-up)
│   ├── home/               # Cards da home (próximos jogos, ranking, grupos, avisos)
│   ├── palpites/           # Componentes de palpites (aba-todos, aba-meus, lista-membros, modal-grupo)
│   ├── palpite/            # Formulário inline de palpite (palpite-inline-form)
│   ├── jogos/              # Cards de jogo com palpite (card-jogo-palpite)
│   ├── copa-do-mundo/      # Seção Copa (dashboard, classificação, meus palpites, seletor fases)
│   ├── usuario/            # Componentes de perfil/conta (alterar senha, editar perfil)
│   ├── icons/              # Ícones SVG customizados (icon-palpite)
│   └── layout/             # Layout (logo, bottom nav, indicador offline)
├── hooks/                  # Hooks customizados (useAuth, useUsuario)
├── lib/                    # Utilitários (api-client, validações, query-client, jogo-helpers)
├── services/               # Chamadas à API agrupadas por módulo
├── stores/                 # Zustand stores
└── types/                  # Definições de tipos TypeScript
```

## Fluxo de Autenticação

- JWT: access token (15min) em memória + refresh token (7d) em localStorage
- Interceptor Axios faz refresh automático em 401
- Rotas protegidas via `GuardAutenticacao` component
- Rotas de auth redirecionam pra `/inicio` se já autenticado

## Endpoints do Backend Consumidos

### Auth
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /auth/login | Login |
| POST | /auth/refresh | Renovar token |
| POST | /auth/logout | Logout |
| POST | /auth/esqueci-senha | Recuperação de senha |
| POST | /auth/resetar-senha | Resetar senha |

### Usuários
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /usuarios | Criar conta |
| GET | /usuarios/me | Perfil autenticado |
| PATCH | /usuarios/:id | Atualizar perfil |
| DELETE | /usuarios/:id | Excluir conta |
| PATCH | /usuarios/me/grupo-favorito | Definir grupo favorito |

### Grupos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /grupos?membro=true | Listar meus grupos |
| GET | /grupos?privado=false | Listar grupos públicos |
| GET | /grupos/:grupoId | Detalhes do grupo |
| POST | /grupos | Criar grupo |
| PATCH | /grupos/:grupoId | Atualizar grupo |
| DELETE | /grupos/:grupoId | Excluir grupo |
| POST | /grupos/entrar | Entrar por código convite |
| GET | /grupos/:grupoId/membros | Listar membros |
| POST | /grupos/:grupoId/adicionar | Adicionar membro por email |
| DELETE | /grupos/:grupoId/sair | Sair do grupo |
| DELETE | /grupos/:grupoId/usuarios/:id | Remover membro |
| PATCH | /grupos/:grupoId/regenerar-convite | Gerar novo convite |
| PATCH | /grupos/:grupoId/usuarios/:id/cargo | Alterar role |

### Jogos / Temporadas / Fases
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /temporadas | Listar temporadas |
| GET | /temporadas/:id/fases | Listar fases |
| GET | /temporadas/:id/dados | Dados otimizados (próximo jogo + adiados) |
| GET | /temporadas/:id/jogos | Todos os jogos da temporada |
| GET | /fases/:faseId/jogos | Listar jogos (rodada, status) |
| POST | /jogos/importar | Importar jogos (SUPER_ADMIN) |
| POST | /fases/:faseId/jogos/sincronizar | Sincronizar placares |
| GET | /classificacao | Classificação Brasileirão |

### Palpites
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /jogos/:jogoId/palpites | Criar palpite |
| PATCH | /palpites/:id | Atualizar palpite |
| GET | /jogos/:jogoId/meu-palpite | Buscar meu palpite |
| POST | /meus-palpites/por-jogos | Batch: meus palpites por IDs |
| GET | /meus-palpites | Listar meus palpites (temporada) |
| GET | /grupos/:grupoId/jogos/:jogoId/palpites | Palpites do grupo |
| GET | /grupos/:grupoId/jogos/:jogoId/palpites/estatisticas | Distribuição |

### Ranking
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /grupos/:grupoId/ranking/geral | Ranking geral |
| GET | /grupos/:grupoId/ranking/fases/:faseId | Ranking por fase/rodada |
| GET | /grupos/:grupoId/ranking/jogos/:jogoId | Detalhamento por jogo |

## Idioma

- UI e mensagens: português brasileiro (pt-BR)
- Nomes de variáveis, funções, componentes: português
- Tipos e interfaces: português (ex: `DadosLogin`, `Usuario`, `ErroApi`)
- Exceções: termos técnicos sem tradução direta (ex: `store`, `hook`, `provider`)

## Roadmap de Módulos

1. ~~Auth (login, cadastro, recuperação)~~ ✅
2. ~~Perfil/Minha Conta~~ ✅
3. ~~Home com cards informativos~~ ✅
4. ~~Grupos — listar, criar, entrar, gerenciar~~ ✅
5. ~~Palpites — dar palpite, editar, meus palpites~~ ✅
6. ~~Ranking — geral, por fase, detalhamento~~ ✅
7. Login com Google (OAuth)
8. Notificações push

## Utilitários Compartilhados (`src/lib/`)

| Arquivo | Funções exportadas |
|---------|-------------------|
| `api-client.ts` | `apiClient` (Axios instance com interceptors) |
| `validacoes.ts` | Schemas Zod reutilizáveis |
| `query-client.ts` | Configuração do TanStack Query |
| `jogo-helpers.ts` | `calcularCountdown`, `calcularTempoJogo`, `ehCampeonatoCopa` |
| `pontuacao-formatada.ts` | `formatarPontuacao` (singular/plural) |
| `pontuacao.ts` | Lógica de cálculo de pontos |
| `avisos.ts` | Gestão de avisos admin (localStorage) |
