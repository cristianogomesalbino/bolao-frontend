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
│   ├── auth/               # Componentes de autenticação
│   ├── home/               # Cards da home (próximo jogo, ranking, grupos)
│   ├── usuario/            # Componentes de perfil/conta
│   └── layout/             # Layout (logo, bottom nav, indicador offline)
├── hooks/                  # Hooks customizados (useAuth, useUsuario)
├── lib/                    # Utilitários (api-client, validações, query-client)
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

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /auth/login | Login |
| POST | /auth/refresh | Renovar token |
| POST | /auth/logout | Logout |
| POST | /auth/esqueci-senha | Recuperação de senha |
| POST | /auth/resetar-senha | Resetar senha |
| POST | /usuarios | Criar conta |
| GET | /usuarios/me | Perfil autenticado |
| PATCH | /usuarios/:id | Atualizar perfil |
| DELETE | /usuarios/:id | Excluir conta |
| GET | /fases/:faseId/jogos | Listar jogos |
| POST | /jogos/importar | Importar jogos (SUPER_ADMIN) |

## Idioma

- UI e mensagens: português brasileiro (pt-BR)
- Nomes de variáveis, funções, componentes: português
- Tipos e interfaces: português (ex: `DadosLogin`, `Usuario`, `ErroApi`)
- Exceções: termos técnicos sem tradução direta (ex: `store`, `hook`, `provider`)

## Roadmap de Módulos

1. ~~Auth (login, cadastro, recuperação)~~ ✅
2. ~~Perfil/Minha Conta~~ ✅
3. ~~Home com cards informativos~~ ✅
4. Grupos — listar, criar, entrar, gerenciar
5. Palpites — dar palpite, editar, meus palpites
6. Ranking — geral, por fase, detalhamento
7. Login com Google (OAuth)
8. Notificações push
