---
inclusion: auto
---

# Progresso do Projeto — Bolão Frontend

## Status Atual

Branch ativa: `feature/grupos` (não mergeada ainda)
Última branch mergeada: `feature/perfil-usuario` → develop

## Módulos Implementados

### 1. Autenticação ✅ (mergeado em develop)
- Login com email/senha (React Hook Form + Zod)
- Cadastro de usuário
- Esqueci senha / Resetar senha
- Token management (access em memória, refresh em localStorage)
- API client com interceptors (refresh automático em 401)
- Guard de rotas protegidas
- Redirect: `/` → `/login` ou `/inicio`
- Validação em tempo real (mode: 'onChange')
- Mostrar/ocultar senha
- Shake no card ao errar login
- Agenda semanal na tela de login (mock)

### 2. Perfil / Minha Conta ✅ (mergeado em develop)
- Rota: `/minha-conta`
- Editar nome e email
- Alterar senha com indicador de força
- Excluir conta com confirmação em 2 passos
- Header sticky com blur
- Avatar com iniciais

### 3. Home ✅ (na branch feature/grupos)
- Header com "Olá, Cristiano 👋" + avatar com iniciais
- Card próximo jogo com escudos reais (next/image + s.sde.globo.com)
- Card meus grupos (mock)
- Card ranking (mock com medalhas)
- Card próximos jogos (lista compacta)
- Bottom navigation (Home, Grupos, Jogos, Conta)
- Countdown em tempo real

### 4. Grupos 🔧 (na branch feature/grupos — em andamento)
- Listagem de grupos com cards (ícone, participantes, rodada, status)
- Criar grupo com hero cinematográfico + imagem decorativa
- Formulário: nome, temporada (select customizado), stepper participantes, toggle privado
- Configurações avançadas (palpite automático, palpite dobrado)
- Entrar por código de convite
- Detalhes do grupo (membros, código convite, compartilhar, sair)
- Modal de confirmação customizado (substituiu confirm() nativo)
- Invalidação de cache após criar/entrar

### 5. Admin (temporário)
- Rota: `/admin/importar`
- Importar jogos da API do GE (cria campeonato + temporada + fase + importa)

## Infraestrutura

### Docker
- `docker-compose.yml` com profiles dev/prod
- Script `dev` (sh dev start-dev, stop, logs, npm, npx)
- Porta: 3003 (backend na 3002)
- Volume monta node_modules do host (sem npm install no container)
- **IMPORTANTE:** Sempre `sh dev stop` + `sudo rm -rf .next` antes de reiniciar se der erro de permissão

### PWA
- manifest.json (Bolão, standalone, verde)
- Ícones SVG placeholder
- @ducanh2912/next-pwa (desabilitado em dev)
- Meta tags mobile

### Design System
- Tailwind CSS v4 (configuração via @theme no CSS)
- Paleta: fundo #0B1020, texto #f1f5f9, primaria #16a34a, link #4ade80
- Cards: glassmorphism (bg-white/[0.03], backdrop-blur, border-white/[0.12])
- Inputs: h-12, rounded-xl, border-white/[0.1], bg-white/[0.04]
- Botão principal: gradient verde, glow, hover lift
- Bottom nav: flutuante, rounded-2xl, backdrop-blur-2xl
- Ícones: Lucide React, cor #22c55e
- Animações: fadeIn, shake (definidas em globals.css)
- Autofill fix: -webkit-box-shadow com #0a0f1e

### Componentes UI (shadcn/ui customizados)
- Button (6 variantes + hover lift no default)
- Input (rounded-xl, focus glow verde)
- Label
- Card (glassmorphism)
- Alert (default + destructive)
- Modal de confirmação

## Problemas Conhecidos

- `.next` pode ficar com permissões de root (criado pelo Docker) — resolver com `sudo rm -rf .next`
- Escudos dos times: backend retorna só timeCasaId/timeForaId nos jogos, não inclui dados do time (nome, escudo) — precisa endpoint melhorado ou join no frontend
- IndicadorServidor foi removido do providers (causava erro) — implementar depois de forma correta
- Dados da home são mock — integrar com backend quando endpoints estiverem prontos

## Pendências da Branch feature/grupos

- [ ] Commitar e mergear em develop (usar --no-ff)
- [ ] Testar fluxo completo: criar grupo → listar → entrar por convite → ver detalhes
- [ ] Remover botão admin temporário da home (ou mover pra rota admin)

## Próximos Passos

1. Mergear feature/grupos em develop
2. Módulo de Jogos (listar jogos por fase, dar palpite)
3. Módulo de Palpites (criar, editar, meus palpites)
4. Módulo de Ranking (geral, por fase, detalhamento)
5. Login com Google (OAuth)
6. Seletor de tema (cores)
7. Integração real com backend (substituir mocks)
8. Testes E2E com Playwright

## Convenções Importantes

- Variáveis e UI em português (pt-BR)
- data-testid em todos elementos interativos (ver steering testabilidade.md)
- Componentes: kebab-case arquivo, PascalCase componente
- Services: um por módulo do backend
- Git: merge --no-ff, commits em português
- Imagens de times: domínio s.sde.globo.com (liberado em next.config.ts)
- Hue-rotate pra mudar cor de imagens monocromáticas (futuro tema)
