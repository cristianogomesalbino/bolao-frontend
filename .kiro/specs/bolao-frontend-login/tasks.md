# Implementation Plan: Bolão Frontend Login

## Overview

Implementação do módulo de autenticação do frontend PWA do Bolão usando Next.js 15 (App Router), Tailwind CSS, shadcn/ui, Zustand, React Hook Form + Zod, TanStack Query e Axios. O projeto será construído incrementalmente: scaffolding → infraestrutura (API client, store, tokens) → páginas de auth → PWA → testes.

## Tasks

- [x] 1. Scaffolding do projeto Next.js 15
  - [x] 1.1 Criar projeto Next.js 15 com App Router e TypeScript strict mode
    - Executar `npx create-next-app@latest` com flags: `--typescript --tailwind --eslint --app --src-dir`
    - Configurar `tsconfig.json` com `strict: true`
    - _Requirements: 1.1, 1.8_

  - [x] 1.2 Configurar Tailwind CSS com paleta esportiva
    - Estender `tailwind.config.ts` com cores: primaria (#16a34a), secundaria (#1e40af), destaque (#f59e0b), fundo (#1a1a2e), superficie (#16213e), texto (#e2e8f0), erro (#ef4444), sucesso (#22c55e)
    - Configurar CSS global com fundo escuro e fonte base
    - _Requirements: 1.2, 11.1_

  - [x] 1.3 Instalar e configurar shadcn/ui
    - Executar `npx shadcn@latest init` com estilo "default"
    - Adicionar componentes: Button, Input, Label, Card, Alert
    - _Requirements: 1.3_

  - [x] 1.4 Instalar dependências do projeto
    - Instalar: `axios`, `zustand`, `react-hook-form`, `@hookform/resolvers`, `zod`, `@tanstack/react-query`
    - Instalar devDependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `fast-check`, `jsdom`, `msw`, `@vitejs/plugin-react`
    - _Requirements: 1.6, 1.7_

  - [x] 1.5 Criar estrutura de pastas escalável
    - Criar diretórios: `src/components/ui/`, `src/components/auth/`, `src/components/layout/`, `src/lib/`, `src/hooks/`, `src/services/`, `src/stores/`, `src/types/`
    - Criar `src/app/(auth)/layout.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/cadastro/page.tsx`, `src/app/(auth)/esqueci-senha/page.tsx`, `src/app/(auth)/resetar-senha/page.tsx`
    - Criar `src/app/(protegido)/layout.tsx`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 2. Checkpoint - Verificar scaffolding
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Infraestrutura de autenticação
  - [x] 3.1 Criar tipos TypeScript para auth e usuário
    - Criar `src/types/auth.types.ts` com interfaces: `DadosLogin`, `DadosCriarUsuario`, `DadosResetarSenha`, `RespostaTokens`, `ErroApi`, `EstadoAutenticacao`
    - Criar `src/types/usuario.types.ts` com interface `Usuario` (id, nome, email, perfil)
    - _Requirements: 5.1_

  - [x] 3.2 Implementar schemas de validação Zod
    - Criar `src/lib/validacoes.ts` com schemas: `schemaEmail`, `schemaSenha`, `schemaNome`, `schemaLogin`, `schemaCadastro`, `schemaEsqueciSenha`, `schemaResetarSenha`
    - Mensagens de erro em português (ex: "Email inválido", "Senha deve ter pelo menos 6 caracteres")
    - Validar confirmação de senha com `.refine()`
    - _Requirements: 6.2, 6.3, 7.2, 7.3, 7.4, 7.5, 8.2, 9.3, 9.4_

  - [ ]* 3.3 Write property tests for Zod validation schemas
    - **Property 8: Validação de email rejeita formatos inválidos**
    - **Property 9: Validação de senha rejeita strings curtas**
    - **Property 10: Confirmação de senha deve corresponder**
    - **Validates: Requirements 6.2, 6.3, 7.3, 7.4, 7.5, 8.2, 9.3, 9.4**

  - [x] 3.4 Implementar API client com Axios e interceptors
    - Criar `src/lib/api-client.ts` com instância Axios configurada via `NEXT_PUBLIC_API_URL`
    - Implementar request interceptor que anexa Bearer token do store
    - Implementar response interceptor para tratar 401 com refresh automático
    - Implementar fila de requisições concorrentes durante refresh
    - Transformar erros de rede em `ErroApi` com mensagem em português
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 3.5 Write property tests for API client
    - **Property 1: Token de acesso é anexado a toda requisição autenticada**
    - **Property 2: Fila de requisições durante refresh de token**
    - **Property 3: Erros de rede produzem objeto estruturado**
    - **Validates: Requirements 3.2, 3.6, 3.7**

  - [x] 3.6 Implementar Auth Store com Zustand
    - Criar `src/stores/auth.store.ts` com estado: `usuario`, `estaAutenticado`, `estaCarregando`
    - Implementar ações: `login`, `logout`, `atualizarUsuario`, `inicializar`
    - Implementar GerenciadorToken integrado: `obterAccessToken`, `obterRefreshToken`, `salvarTokens`, `atualizarAccessToken`, `limparTokens`
    - AccessToken em memória, RefreshToken em localStorage
    - Na inicialização, verificar refreshToken e tentar obter novo accessToken
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.5_

  - [ ]* 3.7 Write property tests for Auth Store
    - **Property 4: Round-trip de armazenamento de tokens**
    - **Property 5: Derivação do estado de autenticação**
    - **Property 6: Store mantém perfil do usuário após login**
    - **Validates: Requirements 4.1, 4.2, 4.4, 5.1**

  - [x] 3.8 Implementar services de autenticação e usuário
    - Criar `src/services/auth.service.ts` com funções: `login`, `refresh`, `logout`, `esqueciSenha`, `resetarSenha`
    - Criar `src/services/usuario.service.ts` com funções: `buscarPerfil`, `criarUsuario`
    - Usar o ApiClient para todas as chamadas
    - _Requirements: 6.5, 7.7, 8.3, 9.5_

  - [x] 3.9 Configurar TanStack Query provider
    - Criar `src/lib/query-client.ts` com configuração padrão (retry, staleTime)
    - Criar provider wrapper no root layout
    - _Requirements: 1.7_

- [x] 4. Checkpoint - Verificar infraestrutura
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Componentes de layout e proteção de rotas
  - [x] 5.1 Implementar GuardAutenticacao
    - Criar `src/components/auth/guard-autenticacao.tsx`
    - Se `estaCarregando`: renderizar skeleton/loading
    - Se `!estaAutenticado`: redirecionar para `/login`
    - Se `estaAutenticado`: renderizar children
    - _Requirements: 5.3_

  - [ ]* 5.2 Write property test for GuardAutenticacao
    - **Property 7: Redirecionamento de rotas protegidas**
    - **Validates: Requirements 5.3**

  - [x] 5.3 Implementar layout de rotas protegidas
    - Criar `src/app/(protegido)/layout.tsx` usando GuardAutenticacao
    - Criar `src/app/(protegido)/page.tsx` como página inicial placeholder
    - _Requirements: 5.3_

  - [x] 5.4 Implementar layout de auth (páginas públicas)
    - Criar `src/app/(auth)/layout.tsx` com layout centralizado, coluna única, max-width 400px em desktop
    - Redirecionar usuário autenticado para página inicial
    - Aplicar estilo visual esportivo (fundo escuro, logo)
    - _Requirements: 5.4, 11.4, 11.5_

  - [x] 5.5 Criar componente Logo e IndicadorOffline
    - Criar `src/components/layout/logo-bolao.tsx` com logo/título estilizado
    - Criar `src/components/layout/indicador-offline.tsx` com banner de offline
    - _Requirements: 10.5_

- [x] 6. Páginas de autenticação
  - [x] 6.1 Implementar FormularioLogin e página de login
    - Criar `src/components/auth/formulario-login.tsx` com React Hook Form + Zod
    - Campos: email (inputMode="email", autocomplete="email"), senha (autocomplete="current-password")
    - Validação inline em português abaixo de cada campo
    - Botão com indicador de carregamento durante requisição
    - Exibir erro "Email ou senha incorretos" acima do formulário quando backend retornar erro
    - Links: "Criar conta" → /cadastro, "Esqueci minha senha" → /esqueci-senha
    - Criar `src/app/(auth)/login/page.tsx` integrando o formulário com auth store
    - Inputs com min 44x44px touch target, font-size 16px
    - Labels, atributos ARIA e navegação por teclado
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12, 11.2, 11.3, 11.6_

  - [ ]* 6.2 Write property test for FormularioLogin
    - **Property 11: Formulário de login submete payload correto**
    - **Validates: Requirements 6.5**

  - [x] 6.3 Implementar FormularioCadastro e página de cadastro
    - Criar `src/components/auth/formulario-cadastro.tsx` com React Hook Form + Zod
    - Campos: nome (min 3 chars), email, senha (min 6 chars), confirmarSenha
    - Validação inline em português abaixo de cada campo
    - Botão com indicador de carregamento durante requisição
    - Exibir erro "Este email já está cadastrado" quando backend retornar 409
    - Após sucesso: mensagem de sucesso e redirect para /login
    - Link: "Já tenho conta" → /login
    - Criar `src/app/(auth)/cadastro/page.tsx` integrando o formulário
    - Inputs com min 44x44px touch target, font-size 16px
    - Labels, atributos ARIA e navegação por teclado
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 7.12, 7.13, 11.2, 11.3, 11.6_

  - [ ]* 6.4 Write property test for FormularioCadastro
    - **Property 12: Formulário de cadastro submete payload correto**
    - **Validates: Requirements 7.7**

  - [x] 6.5 Implementar FormularioEsqueciSenha e página esqueci-senha
    - Criar `src/components/auth/formulario-esqueci-senha.tsx` com React Hook Form + Zod
    - Campo: email
    - Após sucesso: exibir mensagem genérica "Se o email estiver cadastrado, você receberá instruções para recuperar sua senha" (independente de o email existir)
    - Botão com indicador de carregamento durante requisição
    - Link: "Voltar ao login" → /login
    - Criar `src/app/(auth)/esqueci-senha/page.tsx` integrando o formulário
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [ ]* 6.6 Write property test for FormularioEsqueciSenha
    - **Property 13: Formulário de esqueci-senha submete payload correto**
    - **Validates: Requirements 8.3**

  - [x] 6.7 Implementar FormularioResetarSenha e página resetar-senha
    - Criar `src/components/auth/formulario-resetar-senha.tsx` com React Hook Form + Zod
    - Extrair token do query param da URL
    - Campos: novaSenha (min 6 chars), confirmarSenha
    - Após sucesso: exibir "Senha alterada com sucesso" com link para /login
    - Exibir erro "Link de recuperação inválido ou expirado. Solicite um novo." quando backend retornar token inválido
    - Se URL não contiver token: exibir mensagem de erro com link para /esqueci-senha
    - Criar `src/app/(auth)/resetar-senha/page.tsx` integrando o formulário
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [ ]* 6.8 Write property test for FormularioResetarSenha
    - **Property 14: Formulário de resetar-senha submete payload correto**
    - **Validates: Requirements 9.5**

- [x] 7. Checkpoint - Verificar páginas de auth
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Configuração PWA
  - [x] 8.1 Configurar manifest.json e ícones
    - Criar `public/manifest.json` com name "Bolão", short_name "Bolão", start_url "/", display "standalone", background_color "#1a1a2e", theme_color "#16a34a"
    - Criar ícones placeholder em `public/icons/icon-192x192.png` e `public/icons/icon-512x512.png`
    - Adicionar meta tags no root layout: viewport, theme-color, apple-mobile-web-app-capable
    - _Requirements: 10.1, 10.2, 10.6_

  - [x] 8.2 Configurar Service Worker com next-pwa
    - Instalar `next-pwa` e configurar em `next.config.ts`
    - Configurar estratégia cache-first para assets estáticos (JS, CSS, imagens)
    - Configurar estratégia network-first para `/usuarios/me`
    - _Requirements: 1.5, 10.3, 10.4_

- [x] 9. Integração final e wiring
  - [x] 9.1 Configurar root layout com providers
    - Criar `src/app/layout.tsx` com: TanStack Query provider, inicialização do auth store, metadata PWA, fonte e estilos globais
    - Incluir IndicadorOffline no layout
    - _Requirements: 1.7, 10.5_

  - [x] 9.2 Criar hook useAuth e useUsuario
    - Criar `src/hooks/use-auth.ts` como hook de conveniência para o auth store
    - Criar `src/hooks/use-usuario.ts` usando TanStack Query para buscar perfil
    - _Requirements: 5.2_

  - [x] 9.3 Criar arquivo de utilitários
    - Criar `src/lib/utils.ts` com função `cn()` para merge de classes Tailwind
    - Criar `.env.local.example` com `NEXT_PUBLIC_API_URL=http://localhost:3000`
    - _Requirements: 3.1_

  - [x] 9.4 Configurar Vitest
    - Criar `vitest.config.ts` com jsdom environment, path aliases, setup files
    - Criar `vitest.setup.ts` com imports de `@testing-library/jest-dom`
    - _Requirements: 1.8_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- All UI text and variable names in Portuguese (pt-BR)
- The project uses TypeScript with strict mode throughout
