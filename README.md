# Bolão Frontend

PWA mobile-first para gerenciamento de bolões de campeonatos de futebol. Tema escuro esportivo com suporte a Brasileirão e Copa do Mundo.

## Setup Rápido (5 minutos)

```bash
# 1. Clone
git clone <repo-url>
cd bolao-frontend

# 2. Instale dependências no host (obrigatório — container monta node_modules do host)
npm install

# 3. Configure variáveis de ambiente
cp .env.local.example .env

# 4. Inicie em modo dev (porta 3003)
sh dev start-dev

# 5. Acesse
open http://localhost:3003
```

> O backend precisa estar rodando na porta 3002 para funcionar. Ver `bolao-backend/README.md`.

## Variáveis de Ambiente

| Variável | Descrição | Default |
|----------|-----------|---------|
| `NEXT_PUBLIC_API_URL` | URL do backend | `http://localhost:3002` |
| `PORT` | Porta do frontend | `3003` |

## Stack

| Tecnologia | Uso |
|------------|-----|
| Next.js 15 (App Router) | Framework + SSR/SSG |
| TypeScript strict | Tipagem |
| Tailwind CSS v4 | Estilização (tema via CSS @theme) |
| shadcn/ui | Componentes acessíveis |
| Zustand | Estado global (auth) |
| TanStack Query | Data fetching + cache |
| React Hook Form + Zod | Formulários + validação |
| Axios | HTTP client com interceptors |
| @ducanh2912/next-pwa | PWA (manifest + service worker) |
| Vitest + Testing Library | Testes unitários |

## Comandos

```bash
sh dev start-dev          # Dev com hot reload (porta 3003)
sh dev stop               # Parar containers
sh dev logs               # Ver logs do container
sh dev npm install <pkg>  # Instalar pacote
sh dev npx <cmd>          # Executar npx no container
sh dev start-prod         # Build de produção
npm test                  # Testes (roda no host)
npx tsc --noEmit          # Type-check (roda no host)
```

## Estrutura do Projeto

```
src/
├── app/                        # Rotas (App Router)
│   ├── (auth)/                 # Públicas: login, cadastro, esqueci/resetar senha
│   ├── (protegido)/            # Requer auth: inicio, palpites, grupos, admin
│   ├── layout.tsx              # Root layout (providers, PWA)
│   └── globals.css             # Tailwind v4 + paleta + animações
├── components/
│   ├── ui/                     # Primitivos shadcn/ui
│   ├── auth/                   # Formulários de login/cadastro
│   ├── home/                   # Cards: próximos jogos, ranking, grupos, avisos
│   ├── palpites/               # Aba todos, aba meus, lista-membros, modal-grupo
│   ├── palpite/                # Formulário inline de palpite
│   ├── jogos/                  # Card jogo com palpite integrado
│   ├── copa-do-mundo/          # Dashboard, classificação, seletor fases
│   ├── usuario/                # Perfil, alterar senha
│   ├── icons/                  # SVGs customizados (ícone palpite)
│   └── layout/                 # Bottom nav, logo, indicador offline
├── hooks/                      # useAuth, useUsuario, useHomeData, usePalpitesData, usePalpiteCard
├── lib/                        # Utilitários compartilhados
│   ├── api-client.ts           # Axios + interceptors (refresh automático)
│   ├── jogo-helpers.ts         # calcularCountdown, calcularTempoJogo, ehCampeonatoCopa
│   ├── pontuacao-formatada.ts  # formatarPontuacao (singular/plural)
│   ├── avisos.ts               # Gestão de avisos admin (localStorage)
│   ├── validacoes.ts           # Schemas Zod
│   ├── query-client.ts         # Config TanStack Query
│   └── utils.ts                # cn() para merge de classes
├── services/                   # Chamadas à API (1 arquivo por módulo)
│   ├── auth.service.ts
│   ├── usuario.service.ts
│   ├── grupo.service.ts
│   ├── jogo.service.ts
│   ├── palpite.service.ts
│   └── classificacao.service.ts
├── stores/
│   └── auth.store.ts           # Zustand: tokens + usuario + inicialização
└── types/                      # Interfaces TypeScript (1 por entidade)
```

## Módulos Implementados

- ✅ **Auth** — Login, cadastro, recuperação de senha, guard de rotas
- ✅ **Perfil** — Editar nome/email, alterar senha, excluir conta
- ✅ **Home** — Cards: próximos jogos (ao vivo + countdown), ranking com pódio, meus grupos, avisos admin
- ✅ **Grupos** — Listar, criar, entrar, configurar, membros, código convite
- ✅ **Palpites** — Dar palpite inline, editar, lote, meus palpites, estatísticas do grupo
- ✅ **Ranking** — Geral, por rodada, variação de posição, detalhamento por jogo
- ✅ **Copa do Mundo** — Dashboard, classificação por grupos, palpites com tema amarelo/verde
- ✅ **Admin** — Importar jogos, sincronizar placares

## Autenticação

- JWT: access token (15min) em memória + refresh token (7d) em localStorage
- Interceptor Axios faz refresh automático em 401
- Guard `GuardAutenticacao` protege rotas `(protegido)/`
- Warm-up: verifica `/health` do backend no login (mostra "servidor acordando" se Supabase dorme)

## Temas (Copa vs Brasileirão)

O frontend adapta cores automaticamente baseado no campeonato:
- **Brasileirão:** verde (#16a34a), fundo escuro, borda verde nos cards
- **Copa do Mundo:** amarelo (#ffdf00) + verde (#009c3b), glow dourado, fundo verde escuro

Detecção: `ehCampeonatoCopa(nome)` via `lib/jogo-helpers.ts`

## Deploy

- **Plataforma:** Vercel
- **Branch de produção:** `main`
- **Deploy automático:** push em main → build → deploy
- **Variável no Vercel:** `NEXT_PUBLIC_API_URL` = URL do backend em produção

## Testes

```bash
npm test                 # Roda uma vez
npm run test:watch       # Watch mode
```

Framework: Vitest + React Testing Library + fast-check (property-based)

## Portas

| Serviço | Porta |
|---------|-------|
| Backend (NestJS) | 3002 |
| Frontend (Next.js) | 3003 |
