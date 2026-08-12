# Requirements Document

## Introduction

Refatoração do sistema de onboarding do Bolão, substituindo o tour sequencial (react-joyride) por um modelo de **beacons com hints sob demanda**. Cada funcionalidade com dica disponível recebe uma bolinha pulsante (beacon) no canto do elemento. O usuário toca no beacon para ver o tooltip explicativo — abordagem não-intrusiva que respeita o tempo do usuário e funciona bem em elementos condicionais que aparecem dias após o cadastro.

## Glossary

- **Beacon**: Bolinha verde pulsante (6-8px) posicionada no canto superior direito de um Elemento_Alvo que possui hint não dispensado. Convida o usuário a interagir sem interromper.
- **Hint**: Tooltip informativo que aparece quando o usuário toca no Beacon. Contém título, descrição e botão "Entendi".
- **Hint_Registry**: Registro declarativo centralizado de todos os hints disponíveis no sistema.
- **Hints_Store**: Store Zustand que gerencia o estado dos hints (dispensados, pendentes de sync).
- **Hints_Provider**: Componente React responsável por observar a presença dos Elementos_Alvo e renderizar Beacons nos que possuem hint não dispensado.
- **Backend_API**: Endpoint REST do backend NestJS que persiste os hints dispensados pelo usuário.
- **LocalStorage_Sync**: Mecanismo de fallback offline para persistir hints dispensados localmente.
- **IntersectionObserver**: API do navegador utilizada para detectar quando um Elemento_Alvo está visível no viewport.
- **Elemento_Alvo**: Elemento DOM identificado por seletor CSS (`data-hint`) ao qual um hint é atrelado.

## Requirements

### Requirement 1: Auto-exibição na Primeira Aparição do Elemento

**User Story:** Como usuário do Bolão, eu quero que as dicas de funcionalidades visíveis sejam mostradas automaticamente na primeira vez que o elemento aparece na tela, para que eu aprenda sem precisar procurar.

#### Acceptance Criteria

1. WHEN um Elemento_Alvo com hint não dispensado fica visível no viewport pela primeira vez (nunca antes exibido para o usuário), THE Hints_Provider SHALL exibir o Hint Tooltip automaticamente posicionado junto ao elemento.
2. THE Hints_Provider SHALL exibir no máximo um Hint Tooltip auto-exibido por vez. Quando há múltiplos elementos visíveis com hints inéditos, SHALL exibi-los sequencialmente com 500ms de intervalo após dispensar cada um.
3. WHILE um Hint Tooltip auto-exibido está visível, THE interface SHALL permitir interação irrestrita com todos os elementos da página (não-modal, sem overlay).
4. WHEN o usuário dispensa o Hint Tooltip auto-exibido ("Entendi"), THE Hints_Store SHALL marcar o hintId como dispensado (nunca mais aparece).
5. WHEN o usuário fecha o Hint Tooltip auto-exibido sem dispensar (toca fora, navega, ou tecla Escape), THE Hints_Store SHALL marcar o hintId como "já exibido" — nas próximas visitas, esse hint aparecerá como Beacon (não auto-exibe novamente).

### Requirement 2: Beacon para Hints Já Exibidos ou Condicionais

**User Story:** Como usuário do Bolão, eu quero ver uma bolinha verde pulsante nos elementos que possuem dica disponível mas que eu ainda não dispensei, para saber onde existem explicações quando eu quiser.

#### Acceptance Criteria

1. WHEN um Elemento_Alvo possui hint que já foi auto-exibido anteriormente mas não foi dispensado, THE Hints_Provider SHALL renderizar um Beacon no canto superior direito do elemento.
2. WHEN um Elemento_Alvo com hint inédito fica visível mas outro Hint Tooltip auto-exibido já está na tela, THE Hints_Provider SHALL renderizar um Beacon temporário nesse elemento até que sua vez de auto-exibição chegue.
3. THE Beacon SHALL ter tamanho de 8px de diâmetro com animação de pulso (scale 1→1.4 em loop) na cor primária do sistema.
4. THE Beacon SHALL ter área de toque mínima de 44x44px (acessibilidade mobile) via padding invisível.
5. WHEN o usuário toca em um Beacon, THE Hints_Provider SHALL exibir o Hint Tooltip correspondente.
6. WHEN o hint do Elemento_Alvo já foi dispensado, THE Hints_Provider SHALL não renderizar Beacon nem tooltip.

### Requirement 3: Dispensar Hints

**User Story:** Como usuário do Bolão, eu quero dispensar uma dica tocando em "Entendi" para que o beacon nunca mais apareça naquele elemento.

#### Acceptance Criteria

1. WHEN o usuário toca no botão "Entendi" do Hint Tooltip, THE Hints_Provider SHALL remover o tooltip e o beacon do Elemento_Alvo imediatamente.
2. WHEN o usuário toca no botão "Entendi", THE Hints_Store SHALL marcar o hintId como dispensado.
3. WHEN um hintId está marcado como dispensado, THE Hints_Provider SHALL omitir o Beacon para aquele hintId em todas as visitas subsequentes.
4. WHEN o usuário toca fora do Hint Tooltip (ou navega para outra página), THE Hints_Provider SHALL ocultar o tooltip mas manter o Beacon visível (hint não dispensado).

### Requirement 4: Persistência Granular no Backend

**User Story:** Como usuário do Bolão, eu quero que minhas dicas dispensadas sejam sincronizadas entre dispositivos, para não ver beacons repetidos ao trocar de aparelho.

#### Acceptance Criteria

1. WHEN um hint é dispensado, THE Hints_Store SHALL enviar uma requisição à Backend_API informando o hintId dispensado.
2. THE Backend_API SHALL armazenar a lista de hintIds dispensados por usuário no campo `hintsDispensados: string[]` do modelo de usuário.
3. WHEN a Backend_API recebe um hintId que já consta na lista, THE Backend_API SHALL retornar sucesso sem duplicar (idempotente).
4. WHEN o usuário realiza login, THE Hints_Store SHALL carregar a lista de hintIds dispensados a partir do perfil retornado pela Backend_API.

### Requirement 5: Resiliência Offline

**User Story:** Como usuário do Bolão em conexão instável, eu quero que meus hints dispensados sejam salvos localmente e sincronizados quando a conexão retornar.

#### Acceptance Criteria

1. IF a requisição à Backend_API para dispensar um hint falha, THEN THE LocalStorage_Sync SHALL salvar o hintId em uma lista de pendentes no localStorage.
2. WHEN a aplicação é inicializada e existem hintIds pendentes, THE LocalStorage_Sync SHALL tentar sincronizar cada um com a Backend_API.
3. WHEN a sincronização de um hintId pendente é bem-sucedida, THE LocalStorage_Sync SHALL removê-lo da lista de pendentes.
4. IF a sincronização falha novamente, THEN THE LocalStorage_Sync SHALL manter o hintId na lista para próxima tentativa.

### Requirement 6: Registro Declarativo de Hints

**User Story:** Como desenvolvedor, eu quero definir hints de forma declarativa em um registry centralizado, para facilitar manutenção e adição de novos hints.

#### Acceptance Criteria

1. THE Hint_Registry SHALL definir cada hint com: hintId (único), target (seletor CSS `[data-hint="id"]`), titulo, conteudo, placement (top/bottom/left/right/auto).
2. THE Hint_Registry SHALL agrupar hints por página/rota para filtragem eficiente.
3. WHEN um hint é adicionado ao Hint_Registry, THE Hints_Provider SHALL reconhecê-lo automaticamente sem alterar outros componentes.
4. THE Hint_Registry SHALL suportar campo opcional `prioridade` (1-5) para ordenar exibição quando múltiplos beacons ficam visíveis simultaneamente.

### Requirement 7: Resetar Hints

**User Story:** Como usuário do Bolão, eu quero poder resetar todas as dicas para revê-las, caso queira relembrar funcionalidades.

#### Acceptance Criteria

1. WHEN o usuário aciona "Resetar dicas" na interface, THE Hints_Store SHALL limpar todos os hintIds dispensados do estado local.
2. WHEN o usuário aciona "Resetar dicas", THE Hints_Store SHALL enviar requisição à Backend_API para limpar `hintsDispensados` do perfil.
3. WHEN o reset é bem-sucedido e Elementos_Alvo estão visíveis, THE Hints_Provider SHALL renderizar os Beacons correspondentes imediatamente.
4. THE interface SHALL disponibilizar a opção "Resetar dicas" na página Minha Conta.

### Requirement 8: Componente Visual do Hint Tooltip

**User Story:** Como usuário do Bolão, eu quero que o tooltip de dica seja claro, compacto e acessível em mobile, para ler sem esforço.

#### Acceptance Criteria

1. THE Hint Tooltip SHALL exibir título (font-semibold), texto descritivo (font-normal, texto/70) e botão "Entendi" (cor primária).
2. THE Hint Tooltip SHALL ter largura máxima de 280px e não transbordar o viewport em telas de 320px+.
3. THE Hint Tooltip SHALL posicionar-se conforme placement, recalculando se a posição preferida causa transbordo.
4. THE Hint Tooltip SHALL incluir `role="tooltip"` e ser dismissível via tecla Escape.
5. THE Hint Tooltip SHALL ter visual consistente com o design system existente (glassmorphism: `bg-[#0f1a2e]/95 backdrop-blur-2xl border border-white/[0.12]`).

### Requirement 9: Toast de Descobribilidade

**User Story:** Como novo usuário do Bolão, eu quero ser informado sobre a existência das bolinhas de dica na minha primeira visita, para saber que elas existem.

#### Acceptance Criteria

1. WHEN o usuário acessa o app pela primeira vez após o cadastro (nenhum hint dispensado e nenhum tour completo), THE sistema SHALL exibir um toast informativo: "Procure as bolinhas verdes para dicas sobre cada funcionalidade".
2. THE toast SHALL desaparecer automaticamente após 5 segundos ou ao ser dispensado pelo usuário.
3. THE toast SHALL ser exibido no máximo uma vez por usuário (persistido como flag no perfil).

### Requirement 10: Migração do Sistema Existente

**User Story:** Como desenvolvedor, eu quero migrar o sistema de tour sequencial para beacons preservando o histórico do usuário, para que ninguém veja dicas que já conhece.

#### Acceptance Criteria

1. THE Hint_Registry SHALL mapear cada step existente no tour-registry para um hintId único (formato: `hint-{pagina}-{identificador}`).
2. WHEN o sistema migrado é implantado, THE Backend_API SHALL converter o campo `toursCompletos` existente: para cada tourId completo, marcar todos os hintIds correspondentes como dispensados em `hintsDispensados`.
3. WHEN a migração é concluída, THE codebase SHALL remover a dependência do react-joyride e os componentes TourProvider, TourPageWrapper, BotaoRefazerTour e TooltipTour.
4. THE migração SHALL preservar o botão "?" existente, alterando sua funcionalidade de "Refazer tour" para "Resetar dicas" conforme Requirement 7.
5. THE atributos `data-tour` existentes nos elementos SHALL ser renomeados para `data-hint` durante a migração.
