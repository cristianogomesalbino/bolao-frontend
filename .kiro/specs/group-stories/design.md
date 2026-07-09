# Design Document

## Overview

O módulo de Stories adiciona uma camada social ao bolão, gerando automaticamente destaques (stories) quando jogos são finalizados. A arquitetura segue o padrão existente do projeto: módulo NestJS com Repository Pattern, Domain Errors, Presenters e integração fire-and-forget com o fluxo de finalização de jogos.

A feature se divide em:
- **Backend**: novo módulo `stories` com geração automática, listagem, interação "Mandar um F", notificações e limpeza
- **Frontend**: carrossel de avatares na tela do grupo + visualizador fullscreen com swipe

## Architecture

### Diagrama de Fluxo (Backend)

```
JogoService.finalizar()
  → dispararNotificacoesJogoFinalizado()  (existente)
  → dispararStoriesJogoFinalizado()       (novo, mesmo padrão fire-and-forget)
      → StoryEventService.processarJogoFinalizado(jogoId)
          → StoryGeneratorService.gerarStoriesParaGrupo(jogo, grupo, membros)
              → gera ACERTOU_EM_CHEIO
              → gera ACERTOU_SOZINHO
              → gera SUBIU_RANKING
              → gera SEQUENCIA
              → gera NAO_PALPITOU
              → gera DOBROU_E_ACERTOU
          → StoryNotificacaoService.notificarNovosStories(grupo, jogo)
```

### Estrutura do Módulo Backend

```
src/modules/stories/
├── stories.constants.ts
├── stories.module.ts
├── controllers/
│   └── story.controller.ts
├── dto/
│   └── mandar-f.dto.ts
├── repositories/
│   ├── story.repository.interface.ts
│   ├── prisma-story.repository.ts
│   └── in-memory-story.repository.ts
├── services/
│   ├── story-event.service.ts         # Orquestrador (entry point)
│   ├── story-generator.service.ts     # Geração dos 6 tipos
│   ├── story-sequencia.service.ts     # Cálculo de sequência
│   ├── story-notificacao.service.ts   # Push de novos stories
│   └── story-reaction.service.ts      # Lógica do "Mandar um F"
└── types/
    └── story.types.ts
```

### Estrutura do Frontend

```
src/components/stories/
├── story-carousel.tsx          # Faixa de avatares horizontal
├── story-viewer.tsx            # Overlay fullscreen
├── story-card.tsx              # Layout genérico de 1 story
├── story-card-acertou.tsx      # Layout ACERTOU_EM_CHEIO
├── story-card-sozinho.tsx      # Layout ACERTOU_SOZINHO
├── story-card-ranking.tsx      # Layout SUBIU_RANKING
├── story-card-sequencia.tsx    # Layout SEQUENCIA
├── story-card-nao-palpitou.tsx # Layout NAO_PALPITOU + botão F
├── story-card-dobrou.tsx       # Layout DOBROU_E_ACERTOU
└── story-progress-bar.tsx      # Barra de progresso segmentada

src/services/stories.service.ts   # Chamadas API
src/types/stories.types.ts        # Tipos compartilhados
```

## Data Model

### Novas Tabelas Prisma

```prisma
enum TipoStory {
  ACERTOU_EM_CHEIO
  ACERTOU_SOZINHO
  SUBIU_RANKING
  SEQUENCIA_MOSCA
  SEQUENCIA_RESULTADO
  NAO_PALPITOU
  DOBROU_E_ACERTOU
}

model Story {
  id          String    @id @default(uuid())
  grupoId     String
  usuarioId   String
  jogoId      String
  rodada      Int?
  tipo        TipoStory
  dados       Json
  contadorFs  Int       @default(0)
  criadoEm    DateTime  @default(now())

  grupo       Grupo     @relation(fields: [grupoId], references: [id], onDelete: Cascade)
  usuario     Usuario   @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  jogo        Jogo      @relation(fields: [jogoId], references: [id], onDelete: Cascade)
  reacoes     StoryReacao[]

  @@unique([grupoId, usuarioId, jogoId, tipo])
  @@index([grupoId, criadoEm])
  @@index([grupoId, usuarioId])
}

model StoryReacao {
  id              String   @id @default(uuid())
  storyId         String
  remetenteId     String
  destinatarioId  String
  jogoId          String
  grupoId         String
  criadoEm        DateTime @default(now())

  story       Story    @relation(fields: [storyId], references: [id], onDelete: Cascade)

  @@unique([remetenteId, destinatarioId, jogoId, grupoId])
  @@index([storyId])
}

enum CategoriaRecorde {
  MOSCA       // Acertos em cheio consecutivos entre jogos
  RESULTADO   // Acertos de resultado na mesma rodada/fase
}

model RecordeSequencia {
  id          String            @id @default(uuid())
  grupoId     String
  temporadaId String
  categoria   CategoriaRecorde
  valor       Int               // Maior sequência alcançada
  criadoEm    DateTime          @default(now())
  atualizadoEm DateTime         @updatedAt

  grupo       Grupo             @relation(fields: [grupoId], references: [id], onDelete: Cascade)
  temporada   Temporada         @relation(fields: [temporadaId], references: [id], onDelete: Cascade)
  detentores  RecordeDetentor[]

  @@unique([grupoId, temporadaId, categoria])
  @@index([grupoId, temporadaId])
}

model RecordeDetentor {
  id          String           @id @default(uuid())
  recordeId   String
  usuarioId   String
  atingidoEm  DateTime         @default(now())

  recorde     RecordeSequencia @relation(fields: [recordeId], references: [id], onDelete: Cascade)

  @@unique([recordeId, usuarioId])
  @@index([recordeId])
}
```

### Relações Adicionais (models existentes)

```prisma
// Em Usuario: adicionar
stories        Story[]
storyReacoes   StoryReacao[]

// Em Grupo: adicionar
stories        Story[]
recordesSequencia RecordeSequencia[]
rankingSnapshots  RankingSnapshot[]

// Em Jogo: adicionar
stories        Story[]

// Em Temporada: adicionar
recordesSequencia RecordeSequencia[]
```

### RankingSnapshot (posição anterior para SUBIU_RANKING)

```prisma
model RankingSnapshot {
  id          String   @id @default(uuid())
  grupoId     String
  usuarioId   String
  faseId      String
  rodada      Int?
  posicao     Int
  pontuacao   Int
  criadoEm    DateTime @default(now())

  grupo       Grupo    @relation(fields: [grupoId], references: [id], onDelete: Cascade)

  @@unique([grupoId, usuarioId, faseId, rodada])
  @@index([grupoId, faseId, rodada])
}
```

O snapshot é gravado logo após o cálculo de ranking de cada jogo finalizado (no `StoryEventService`). Quando o próximo jogo for finalizado, o StoryGeneratorService lê o snapshot anterior com 1 SELECT e compara com a posição recém-calculada.

### Enum de Notificação (estender)

```prisma
enum TipoNotificacao {
  // ... existentes ...
  STORIES_GRUPO
  RECEBEU_F
}
```

### PreferenciaNotificacao (estender)

```prisma
model PreferenciaNotificacao {
  // ... existentes ...
  storiesGrupo    Boolean @default(true)
  recebeuF        Boolean @default(true)
}
```

### Estrutura do campo `dados` (JSONB) por tipo

```typescript
// ACERTOU_EM_CHEIO
interface DadosAcertouEmCheio {
  golsCasa: number;
  golsFora: number;
  timeCasa: { nome: string; sigla: string; escudo: string | null };
  timeFora: { nome: string; sigla: string; escudo: string | null };
}

// ACERTOU_SOZINHO
interface DadosAcertouSozinho {
  golsCasa: number;
  golsFora: number;
  timeCasa: { nome: string; sigla: string; escudo: string | null };
  timeFora: { nome: string; sigla: string; escudo: string | null };
  rodada: number | null;
}

// SUBIU_RANKING
interface DadosSubiuRanking {
  posicaoAnterior: number;
  posicaoNova: number;
  top5: Array<{ posicao: number; nome: string; pontuacao: number }>;
}

// SEQUENCIA_MOSCA
interface DadosSequenciaMosca {
  quantidadeAcertos: number;
  ultimosJogos: Array<{
    timeCasa: string;
    timeFora: string;
    golsCasa: number;
    golsFora: number;
    rodada: number | null;
    acertouEmCheio: boolean;
  }>;
  recorde: {
    valor: number;
    detentores: Array<{ nome: string; usuarioId: string }>;
    ehNovoRecorde: boolean;
  };
}

// SEQUENCIA_RESULTADO
interface DadosSequenciaResultado {
  quantidadeAcertos: number;
  rodada: number | null;
  ultimosJogos: Array<{
    timeCasa: string;
    timeFora: string;
    golsCasa: number;
    golsFora: number;
    acertou: boolean;
  }>;
  recorde: {
    valor: number;
    detentores: Array<{ nome: string; usuarioId: string }>;
    ehNovoRecorde: boolean;
  };
}

// NAO_PALPITOU
interface DadosNaoPalpitou {
  golsCasa: number;
  golsFora: number;
  timeCasa: { nome: string; sigla: string; escudo: string | null };
  timeFora: { nome: string; sigla: string; escudo: string | null };
  rodada: number | null;
}

// DOBROU_E_ACERTOU
interface DadosDobrouEAcertou {
  golsCasa: number;
  golsFora: number;
  timeCasa: { nome: string; sigla: string; escudo: string | null };
  timeFora: { nome: string; sigla: string; escudo: string | null };
  pontosObtidos: number;
}
```

## Endpoints (API)

### Listagem de Stories do Grupo

```
GET /grupos/:grupoId/stories
Guard: GroupRoleGuard (ADMIN, MEMBER)
Response: StoryListagemResponse
```

### Listagem de Stories da Home (agregado)

```
GET /stories
Guard: JwtAuthGuard (global — usuário autenticado)
Response: StoryHomeResponse
```

Retorna stories de todos os grupos do usuário (rodada atual + anterior), agrupados por grupo e por membro.

Response shape:
```typescript
interface StoryHomeResponse {
  grupos: Array<{
    grupoId: string;
    grupoNome: string;
    grupoIcone: string | null;
    membros: StoryMembroListagem[];
  }>;
}

interface StoryMembroListagem {
  usuarioId: string;
  nome: string;
  avatar: string | null;
  storyMaisRecente: TipoStory;
  stories: StoryItemListagem[];
}

interface StoryItemListagem {
  id: string;
  tipo: TipoStory;
  dados: Record<string, unknown>;
  jogoId: string;
  rodada: number | null;
  criadoEm: string;
  contadorFs: number;
  jaEnviouF: boolean;
}
```

### Listagem do Grupo (mesma shape de `membros`)

```typescript
interface StoryListagemResponse {
  membros: StoryMembroListagem[];
}
```

### Mandar um F

```
POST /grupos/:grupoId/stories/:storyId/mandar-f
Guard: GroupRoleGuard (ADMIN, MEMBER)
Response: { contadorFs: number }
```

Constraint de deduplicação: `@@unique([remetenteId, destinatarioId, jogoId, grupoId])`

## Services (Backend)

### StoryEventService (Orquestrador)

Responsabilidade: receber o evento de jogo finalizado e coordenar a geração de stories para todos os grupos afetados.

```typescript
async processarJogoFinalizado(jogoId: string): Promise<void> {
  // 1. Buscar jogo com times
  // 2. Buscar fase → temporada → grupos
  // 3. Para cada grupo: gerar stories
  // 4. Para cada grupo: enviar notificação consolidada
}
```

### StoryGeneratorService

Responsabilidade: gerar stories para um grupo específico dado um jogo finalizado.

```typescript
async gerarStoriesParaGrupo(
  jogo: JogoComTimes,
  grupo: GrupoBasico,
  membros: MembroComUsuario[],
): Promise<void> {
  // Busca palpites do jogo para todos os membros
  // Calcula ranking ANTES e DEPOIS do jogo
  // Para cada membro, avalia cada tipo de story
  // Persiste em batch via criarVarios()
}
```

Detalhes por tipo:

- **ACERTOU_EM_CHEIO**: `PontuacaoService.calcular()` retorna `categoriaAcerto === 'ACERTO_EM_CHEIO'`
- **ACERTOU_SOZINHO**: conta membros com `categoriaAcerto === 'ACERTO_DE_RESULTADO' || categoriaAcerto === 'ACERTO_EM_CHEIO'`; se apenas 1 membro acertou o resultado, gera o story
- **SUBIU_RANKING**: compara posição atual (calculada) com posição anterior (lida do RankingSnapshot — 1 SELECT simples)
- **SEQUENCIA**: delega para StorySequenciaService
- **NAO_PALPITOU**: membro sem palpite para o jogo
- **DOBROU_E_ACERTOU**: membro tem PalpiteDobrado para o jogo E `categoriaAcerto !== null && categoriaAcerto !== 'ERRO_TOTAL'`

### StorySequenciaService

Responsabilidade: calcular sequências nas 2 categorias e gerenciar recordes.

```typescript
async calcularSequenciaMosca(
  usuarioId: string,
  faseId: string,
  jogoAtualId: string,
): Promise<{ quantidade: number; ultimosJogos: JogoSequencia[] } | null> {
  // Busca todos os jogos finalizados da temporada (cross-fase), ordenados por dataHora
  // Busca palpites do usuário para esses jogos
  // Conta acertos EM CHEIO consecutivos de trás para frente (do jogo atual para anteriores)
  // Retorna null se < 2 acertos consecutivos
}

async calcularSequenciaResultado(
  usuarioId: string,
  faseId: string,
  rodada: number | null,
  jogoAtualId: string,
): Promise<{ quantidade: number; ultimosJogos: JogoSequencia[] } | null> {
  // Busca jogos finalizados da mesma rodada/fase
  // Busca palpites do usuário para esses jogos
  // Conta acertos de resultado (cheio + resultado) consecutivos
  // Retorna null se < 2 acertos
}

async atualizarRecorde(
  grupoId: string,
  temporadaId: string,
  categoria: 'MOSCA' | 'RESULTADO',
  usuarioId: string,
  novoValor: number,
): Promise<{ valor: number; detentores: Detentor[]; ehNovoRecorde: boolean }> {
  // Busca recorde atual do grupo para a categoria
  // Se não existe: cria com valor e detentor
  // Se novoValor > recorde.valor: atualiza valor, limpa detentores antigos, adiciona novo
  // Se novoValor === recorde.valor: adiciona detentor (mantém os existentes)
  // Retorna recorde atualizado + flag ehNovoRecorde
}
```

### StoryReactionService

Responsabilidade: registrar "F" e validar regras de negócio.

```typescript
async mandarF(storyId: string, usuarioId: string, grupoId: string): Promise<number> {
  // Valida: story existe e não expirou (< 7 dias)
  // Valida: story.tipo === NAO_PALPITOU
  // Valida: story.usuarioId !== usuarioId (não pode F em si mesmo)
  // Valida: não existe StoryReacao para (storyId, usuarioId)
  // Cria StoryReacao
  // Incrementa story.contadorFs
  // Dispara notificação push (fire-and-forget)
  // Retorna novo contadorFs
}
```

### StoryNotificacaoService

Responsabilidade: enviar push consolidado quando stories são gerados.

```typescript
async notificarNovosStories(grupo: GrupoBasico, jogoId: string, quantidade: number): Promise<void> {
  // Deduplicação: existeNotificacao(tipo: STORIES_GRUPO, grupoId, jogoId)
  // Busca membros com inscrição push + preferência storiesGrupo habilitada
  // Cria notificação consolidada
  // Envia push para todos os membros elegíveis
}
```

## Integração com JogoService

Seguindo o padrão existente de `dispararNotificacoesJogoFinalizado`:

```typescript
// Em JogoService - adicionar:
@Optional()
@Inject(STORIES.EVENT_SERVICE_TOKEN)
private readonly storyEventService?: StoryEventService;

private dispararStoriesJogoFinalizado(jogoId: string): void {
  if (!this.storyEventService) return;
  this.storyEventService
    .processarJogoFinalizado(jogoId)
    .catch((err) =>
      this.logger.error(`Erro stories pós-finalização: ${err.message}`, err.stack),
    );
}

// Chamado em finalizar() após dispararNotificacoesJogoFinalizado()
```

## Cron Job (Limpeza)

```typescript
// Em StoryCronService
@Cron('0 5 * * *') // 02:00 BRT
async limparStoriesAntigos(): Promise<void> {
  // Deleta stories com criadoEm < 30 dias
  // Cascade remove StoryReacao automaticamente via onDelete: Cascade
}
```

## Frontend (Design Resumido)

### Story Carousel

- Componente client (`'use client'`) posicionado na page do grupo
- Fetch via `GET /grupos/:grupoId/stories` com SWR/TanStack Query
- Renderiza lista horizontal de avatares com `overflow-x: auto`
- Cada avatar mostra ícone do tipo do story mais recente
- Oculto enquanto loading ou se lista vazia (height 0, sem skeleton)

### Story Viewer

- Modal/overlay fullscreen ativado ao clicar em um avatar
- Estado local: `currentIndex` para navegar entre stories do usuário selecionado
- Navegação: touch events (swipe) + tap zones (metade esquerda/direita)
- Barra de progresso com `N` segmentos (CSS flex com transition)
- Botão X no canto superior direito para fechar
- Auto-fecha ao passar do último story

### Formatação de Tempo

```typescript
function formatarTempoRelativo(criadoEm: string): string {
  const diffMs = Date.now() - new Date(criadoEm).getTime();
  const minutos = Math.floor(diffMs / 60000);
  if (minutos < 60) return `há ${minutos} minutos`;
  const horas = Math.floor(minutos / 60);
  if (horas < 48) return `há ${horas} horas`;
  const dias = Math.floor(horas / 24);
  return `há ${dias} dias`;
}
```

## Domain Errors

```typescript
// src/common/errors/domain-errors/stories.errors.ts
export class StoryNaoEncontradoError extends DomainError { ... }
export class StoryExpiradoError extends DomainError { ... }
export class ReacaoApenasNaoPalpitouError extends DomainError { ... }
export class NaoPodeEnviarFParaSiMesmoError extends DomainError { ... }
export class UsuarioJaEnviouFError extends DomainError { ... }
```

## Constants

```typescript
export const STORIES = {
  TAG: 'Stories',
  STORY_REPOSITORY_TOKEN: 'STORY_REPOSITORY',
  EVENT_SERVICE_TOKEN: 'STORY_EVENT_SERVICE',

  LIMITES: {
    EXPIRACAO_DIAS: 7,
    LIMPEZA_DIAS: 30,
    SEQUENCIA_MOSCA_MINIMA: 2,
    SEQUENCIA_RESULTADO_RODADAS_ATRAS: 3,
    ULTIMOS_JOGOS_SEQUENCIA: 5,
    MAX_STORIES_LISTAGEM: 20,
    MIN_STORIES_VIEWER: 5,
    SUBIU_RANKING_MINIMO: 2,
    SUBIU_RANKING_TOP: 5,
  },

  TIMER_POR_TIPO: {
    ACERTOU_EM_CHEIO: 5,
    UNICO_NA_MOSCA: 6,
    SUBIU_RANKING: 8,
    SEQUENCIA_MOSCA: 7,
    SEQUENCIA_RESULTADO: 7,
    NAO_PALPITOU: 5,
    DOBROU_E_ACERTOU: 6,
  } as Record<string, number>,

  PRIORIDADE_POR_TIPO: {
    UNICO_NA_MOSCA: 1,
    NAO_PALPITOU: 2,
    SEQUENCIA_MOSCA: 3,
    SEQUENCIA_RESULTADO: 4,
    ACERTOU_EM_CHEIO: 5,
    SUBIU_RANKING: 6,
    DOBROU_E_ACERTOU: 7,
  } as Record<string, number>,

  CRON: {
    LIMPEZA_DIARIA: '0 5 * * *', // 02:00 BRT
  },

  MENSAGENS: {
    STORY_NAO_ENCONTRADO: 'Story não encontrado',
    STORY_EXPIRADO: 'Story expirado',
    REACAO_APENAS_NAO_PALPITOU: 'Reações do tipo F são permitidas apenas em stories de tipo NAO_PALPITOU',
    NAO_PODE_F_PARA_SI_MESMO: 'Não é permitido enviar F para si mesmo',
    USUARIO_JA_ENVIOU_F: 'Você já enviou um F para este story',
    F_ENVIADO_SUCESSO: 'F enviado com sucesso',
  },

  TEMPLATES: {
    NOVOS_STORIES: {
      titulo: 'Novos destaques!',
      mensagem: (grupoNome: string, quantidade: number) =>
        `${quantidade} novos destaques no grupo ${grupoNome}. Veja o que aconteceu!`,
    },
    RECEBEU_F: {
      titulo: 'Recebeu um F!',
      mensagem: (nomeRemetente: string) =>
        `${nomeRemetente} mandou um F pra você. 😴`,
    },
  },
} as const;
```

## Catálogo de Títulos (StoryTitle)

Estrutura preparada pra evolução (rarity, A/B, temas sazonais):

```typescript
interface StoryTitle {
  id: string;                              // Identificador único (ex: 'cheio-01')
  title: string;                           // Texto exibido (ex: 'Cravou!')
  emoji: string;                           // Emoji do tipo (ex: '🎯')
  rarity?: 'common' | 'rare' | 'epic';    // Futuro: títulos raros aparecem menos
}

// Catálogo em constants
export const STORY_TITULOS: Record<TipoStory, StoryTitle[]> = {
  ACERTOU_EM_CHEIO: [
    { id: 'cheio-01', title: 'Cravou!', emoji: '🎯' },
    { id: 'cheio-02', title: 'Na mosca!', emoji: '🎯' },
    { id: 'cheio-03', title: 'Bola de cristal!', emoji: '🎯' },
    { id: 'cheio-04', title: 'Tá hackeado?', emoji: '🎯' },
    { id: 'cheio-05', title: 'Quem te contou?', emoji: '🎯' },
    { id: 'cheio-06', title: 'Combinou com o juiz!', emoji: '🎯' },
    { id: 'cheio-07', title: 'Nostradamus!', emoji: '🎯' },
    { id: 'cheio-08', title: 'Bruxo!', emoji: '🎯' },
    // ...
  ],
  UNICO_NA_MOSCA: [
    { id: 'unico-01', title: 'Vidente!', emoji: '🦄' },
    { id: 'unico-02', title: 'Só ele viu!', emoji: '🦄' },
    { id: 'unico-03', title: 'O escolhido', emoji: '🦄' },
    // ...
  ],
  // ... demais tipos
};
```

### pickRandomTitle (sem repetição imediata)

```typescript
function pickRandomTitle(tipo: TipoStory, ultimoIdUsado?: string): StoryTitle {
  const titulos = STORY_TITULOS[tipo];
  const disponiveis = ultimoIdUsado
    ? titulos.filter(t => t.id !== ultimoIdUsado)
    : titulos;
  return disponiveis[Math.floor(Math.random() * disponiveis.length)];
}
```

No Story persistido: apenas `titulo` (texto final) e opcionalmente `tituloId` no campo JSONB `dados` para analytics futuro. O emoji é derivável do tipo (não precisa persistir).

## Notification Actions (Progressive Enhancement)

Nos dispositivos que suportam (Android Chrome, Desktop Chrome/Edge/Firefox), a notificação de "Não palpitou" inclui um botão de ação "Mandar F" diretamente na notificação push. Onde não é suportado (iOS/Safari), a notificação apenas abre o app no story.

### Service Worker — Push Handler

```typescript
// worker/index.ts — dentro do evento 'push'
const data = event.data?.json();

if (data?.tipo === 'NAO_PALPITOU' && data?.storyId) {
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.svg',
      tag: `story-${data.storyId}`,
      data: {
        url: `/grupos/${data.grupoId}/stories`,
        storyId: data.storyId,
        grupoId: data.grupoId,
        tipo: 'NAO_PALPITOU',
      },
      actions: [
        { action: 'mandar-f', title: '🪦 Mandar F' },
        { action: 'abrir', title: 'Ver Story' },
      ],
    })
  );
} else {
  // Notificação padrão sem actions
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.svg',
      tag: `story-grupo-${data.grupoId}`,
      data: { url: `/grupos/${data.grupoId}/stories` },
    })
  );
}
```

### Service Worker — Notification Click Handler

```typescript
// worker/index.ts — dentro do evento 'notificationclick'
const notifData = event.notification.data;
event.notification.close();

if (event.action === 'mandar-f' && notifData.storyId && notifData.grupoId) {
  // Dispara fetch direto do Service Worker
  event.waitUntil(
    fetch(`/api/grupos/${notifData.grupoId}/stories/${notifData.storyId}/mandar-f`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // cookies httpOnly
    }).catch(() => {
      // Fallback: abre o app no story se fetch falhar
      return clients.openWindow(notifData.url);
    })
  );
} else {
  // Ação padrão: abrir/focar janela no URL do story
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      const existing = windowClients.find((c) => c.url.includes(notifData.url));
      if (existing) return existing.focus();
      return clients.openWindow(notifData.url);
    })
  );
}
```

### Backend — Payload diferenciado para push NAO_PALPITOU

Quando o `StoryNotificacaoService` envia push para o tipo NAO_PALPITOU individual (quando alguém manda um F ou story é gerado), inclui campos extras no payload:

```typescript
// Em StoryNotificacaoService
const pushPayload = {
  title: 'João não palpitou!',
  body: 'Mande um F',
  tipo: 'NAO_PALPITOU',
  storyId: story.id,
  grupoId: story.grupoId,
};
```

### Compatibilidade

| Plataforma | Notification Actions | Comportamento |
|-----------|---------------------|---------------|
| Android Chrome | ✅ Suportado | Botão "Mandar F" dispara fetch direto |
| Desktop Chrome/Edge/Firefox | ✅ Suportado | Botão "Mandar F" dispara fetch direto |
| iOS Safari (PWA) | ❌ Não suportado | Notificação simples → abre app no story |
| iOS Safari (browser) | ❌ Push não suportado | N/A |

### Fallback

- Se o `fetch` do Service Worker falhar (token expirado, rede indisponível), abre o app no story como fallback
- Se o dispositivo não suporta `actions`, o campo é silenciosamente ignorado pela API de Notification — a notificação aparece sem botões
- Não requer detecção de feature no frontend: o SW sempre envia `actions`, dispositivos que não suportam simplesmente não exibem

## Considerações de Performance

1. **Geração em batch**: `criarVarios()` para persistir todos os stories de uma vez por grupo
2. **Ranking comparativo**: para SUBIU_RANKING, calcular ranking com e sem o jogo atual é custoso. Alternativa: guardar posição do último jogo finalizado no cache e comparar com a nova posição
3. **Listagem por rodada**: filtro `WHERE rodada IN (rodadaAtual, rodadaAtual - 1)` no índice composto `(grupoId, rodada)` garante scan eficiente
4. **Deduplicação**: unique constraint `(grupoId, usuarioId, jogoId, tipo)` previne duplicatas a nível de banco
5. **Cascade delete**: `onDelete: Cascade` em StoryReacao garante limpeza sem queries extras

## Decisões de Design

| Decisão | Opção Escolhida | Justificativa |
|---------|----------------|---------------|
| Persistência vs on-the-fly | Persistido em banco | Evita recalcular a cada visualização; permite "Mandar um F" com contador |
| Campo `dados` como JSONB | Sim | Flexibilidade por tipo sem criar 6 tabelas de detalhes |
| `contadorFs` denormalizado no Story | Sim | Evita COUNT(*) em cada listagem |
| Módulo separado vs dentro de notificações | Módulo separado | Responsabilidade distinta; evita inchar o módulo de notificações |
| Expiração rodada atual+anterior / 30d hard delete | Filtro por rodada na query + cron 30d | Não precisa de campo de status; stories de rodadas antigas ficam no banco pro histórico futuro até limpeza |
| Cálculo de SUBIU_RANKING | Snapshot de posição anterior (RankingSnapshot) | 1 SELECT no índice em vez de recalcular ranking inteiro 2x. Escala melhor conforme temporada acumula jogos |

## Design Visual (Referência)

### Anatomia do Card de Story

```
┌────────────────────────────────────┐
│  ══════════════════════════════     │ ← Barra de progresso (segmentos animados)
│                                    │
│       ○ Avatar do autor            │
│       [emoji tipo] Nome            │
│                                    │
│     ╔══════════════════════╗       │
│     ║   TÍTULO DINÂMICO   ║       │ ← Título grande (randomizado, StoryTitle)
│     ║   Subtítulo descrit. ║       │ ← Descrição contextual
│     ╚══════════════════════╝       │
│                                    │
│       ┌─────┐       ┌─────┐       │
│       │Escudo│ X × Y │Escudo│      │ ← Placar + escudos (quando aplicável)
│       └─────┘       └─────┘       │
│                                    │
│     ⚽ TimeCasa × TimeFora         │ ← Rodapé: info do jogo
│     📅 Rodada 12 · 21/08 · 21:45  │
│                                    │
│     [🪦 MANDAR UM F] (se aplicável)│ ← CTA interativo (NAO_PALPITOU only)
└────────────────────────────────────┘
```

### Paleta de Cores por Tipo

| Tipo | Cor Predominante | Hex | Emoção |
|------|-----------------|-----|--------|
| ACERTOU_EM_CHEIO | Verde | #22C55E | Celebração, sucesso |
| UNICO_NA_MOSCA | Roxo | #8B5CF6 | Exclusividade, raridade |
| SUBIU_RANKING | Azul | #3B82F6 | Progresso, movimento |
| SEQUENCIA_MOSCA | Laranja | #F97316 | Energia, fogo |
| SEQUENCIA_RESULTADO | Laranja | #F97316 | Energia, fogo |
| NAO_PALPITOU | Cinza | #6B7280 | Ausência, sono |
| DOBROU_E_ACERTOU | Dourado | #F59E0B | Premiação, risco |

### Princípios Visuais

1. **Identidade consistente** — todos os cards seguem a mesma estrutura visual
2. **Cores por tipo** — cada tipo tem cor predominante que comunica emoção
3. **Fundo temático** — ilustração esportiva com overlay escuro (70-80% opacidade) para legibilidade
4. **Legibilidade máxima** — texto sempre em alto contraste sobre o fundo
5. **Imersão** — atmosfera de estádio, luzes, torcida e elementos do futebol
6. **Escudos centrais** — quando há placar, os escudos dos times são elemento visual principal
7. **Imagens vetoriais/3D leve** — estilo ilustrativo, não fotográfico
