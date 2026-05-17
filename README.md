# Bolão Frontend

Frontend PWA do sistema de bolão de futebol. Aplicação mobile-first com tema esportivo escuro.

## Stack

- Next.js 15 (App Router)
- TypeScript (strict mode)
- Tailwind CSS v4 (paleta esportiva customizada)
- shadcn/ui (componentes acessíveis)
- Zustand (estado de autenticação)
- React Hook Form + Zod (formulários e validação)
- TanStack Query (data fetching)
- Axios (HTTP client com interceptors)
- PWA (manifest + service worker via @ducanh2912/next-pwa)
- Vitest + Testing Library + fast-check (testes)

## Ambiente de Desenvolvimento (Docker)

O projeto roda dentro de Docker com hot reload.

```bash
# Primeira vez — instalar dependências no host
npm install

# Iniciar em modo dev (porta 3003)
sh dev start-dev

# Parar containers
sh dev stop

# Ver logs
sh dev logs

# Instalar pacotes (com container rodando)
sh dev npm install <pacote>

# Executar comandos npx
sh dev npx <comando>

# Build de produção
sh dev start-prod
```

## Variáveis de Ambiente

Copie `.env.local.example` para `.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3002
PORT=3003
```

## Estrutura do Projeto

```
src/
├── app/
│   ├── layout.tsx              # Root layout (providers, PWA meta tags)
│   ├── page.tsx                # Raiz — redireciona pra /login ou /inicio
│   ├── globals.css             # Tailwind v4 + paleta esportiva
│   ├── (auth)/                 # Route group — páginas públicas
│   │   ├── layout.tsx          # Layout centralizado com logo
│   │   ├── login/page.tsx
│   │   ├── cadastro/page.tsx
│   │   ├── esqueci-senha/page.tsx
│   │   └── resetar-senha/page.tsx
│   └── (protegido)/            # Route group — requer autenticação
│       ├── layout.tsx          # GuardAutenticacao wrapper
│       └── inicio/page.tsx
├── components/
│   ├── ui/                     # Primitivos shadcn/ui (Button, Input, Label, Card, Alert)
│   ├── auth/                   # Formulários de autenticação + guard
│   │   ├── formulario-login.tsx
│   │   ├── formulario-cadastro.tsx
│   │   ├── formulario-esqueci-senha.tsx
│   │   ├── formulario-resetar-senha.tsx
│   │   └── guard-autenticacao.tsx
│   ├── layout/                 # Componentes de layout
│   │   ├── logo-bolao.tsx
│   │   └── indicador-offline.tsx
│   └── providers.tsx           # QueryClient + inicialização auth
├── hooks/
│   ├── use-auth.ts             # Hook de conveniência pro auth store
│   └── use-usuario.ts          # TanStack Query — buscar perfil
├── lib/
│   ├── api-client.ts           # Axios com interceptors (token refresh automático)
│   ├── query-client.ts         # Configuração TanStack Query
│   ├── validacoes.ts           # Schemas Zod (login, cadastro, etc.)
│   └── utils.ts                # cn() para merge de classes
├── services/
│   ├── auth.service.ts         # login, refresh, logout, esqueciSenha, resetarSenha
│   └── usuario.service.ts      # buscarPerfil, criarUsuario
├── stores/
│   └── auth.store.ts           # Zustand — estado + gerenciador de tokens
└── types/
    ├── auth.types.ts           # DadosLogin, RespostaTokens, ErroApi, etc.
    └── usuario.types.ts        # Usuario
```

## Paleta de Cores

| Nome | Hex | Uso |
|------|-----|-----|
| primaria | #16a34a | Botões, ações principais |
| secundaria | #1e40af | Elementos secundários |
| destaque | #f59e0b | Destaques, badges |
| fundo | #1a1a2e | Background geral |
| superficie | #16213e | Cards, inputs |
| texto | #e2e8f0 | Texto principal |
| link | #4ade80 | Links (verde claro) |
| erro | #ef4444 | Erros, alertas |
| sucesso | #22c55e | Confirmações |

## Fluxo de Autenticação

1. Usuário acessa `/` → redireciona pra `/login` (se não autenticado)
2. Faz login → tokens salvos (access em memória, refresh em localStorage)
3. Redireciona pra `/inicio`
4. Requisições autenticadas anexam Bearer token automaticamente
5. Se token expira → refresh automático via interceptor
6. Se refresh falha → limpa tokens, redireciona pra `/login`

## Endpoints do Backend Consumidos

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /auth/login | Login (email + senha) |
| POST | /auth/refresh | Renovar token |
| POST | /auth/logout | Logout |
| POST | /auth/esqueci-senha | Solicitar recuperação |
| POST | /auth/resetar-senha | Resetar senha com token |
| POST | /usuarios | Criar conta |
| GET | /usuarios/me | Perfil do usuário autenticado |

## Testes

```bash
# Rodar testes uma vez
npm test

# Rodar em watch mode
npm run test:watch
```

Framework: Vitest + React Testing Library + fast-check (property-based testing)

## PWA

- Manifest em `public/manifest.json`
- Ícones em `public/icons/` (placeholder — substituir por ícones reais)
- Service worker gerado automaticamente em produção
- Instalável na home screen do celular

## Portas

| Serviço | Porta |
|---------|-------|
| Backend | 3002 |
| Frontend | 3003 |

## Roadmap

- [x] Autenticação (login, cadastro, recuperação de senha)
- [ ] Login com Google (OAuth 2.0)
- [ ] Módulo de Grupos
- [ ] Módulo de Palpites
- [ ] Módulo de Ranking
- [ ] Notificações push
- [ ] Tema light/dark automático
