# Documento de Requisitos

## Introdução

Este documento especifica os requisitos de otimização de performance e qualidade de código para o frontend do Bolão. As otimizações foram identificadas através de análise estática e profiling do projeto, abrangendo re-renders desnecessários, duplicação de código, lazy loading, tratamento de erros e remoção de código morto.

## Glossário

- **Frontend**: Aplicação Next.js 15 (App Router) com TypeScript que compõe a interface do Bolão
- **Countdown_Component**: Componente isolado responsável por exibir e atualizar a contagem regressiva até o fechamento de palpites
- **CardJogoPalpite**: Componente de card que exibe informações de um jogo e permite ao usuário registrar palpites
- **usePalpiteMutation_Hook**: Hook customizado do React que encapsula a lógica de criação e atualização de palpites via TanStack React Query
- **Error_Boundary**: Componente React que captura erros de renderização em sua árvore de filhos e exibe uma UI de fallback
- **Sub_Component**: Componente React extraído de uma página para reduzir a complexidade cognitiva e o tamanho do arquivo
- **Dynamic_Import**: Importação assíncrona via `next/dynamic` que carrega componentes sob demanda (lazy loading)
- **Bundle_Config**: Configurações no `next.config.ts` que otimizam o tamanho do bundle de produção
- **Service_Layer**: Camada de serviços (`src/services/`) que encapsula chamadas HTTP ao backend
- **Query_Cache**: Cache gerenciado pelo TanStack React Query para armazenar dados de requisições

## Requisitos

### Requisito 1: Extrair Componente Countdown Isolado

**User Story:** Como usuário, eu quero que a página de detalhes do grupo não sofra re-renders completos a cada segundo, para que a navegação permaneça fluida e responsiva.

#### Critérios de Aceite

1. QUANDO o timer de countdown atualiza a cada segundo, O Countdown_Component DEVE re-renderizar apenas a si mesmo sem disparar re-render no componente pai, verificável pelo React Profiler registrando zero renders do pai durante uma janela de 5 segundos
2. O Countdown_Component DEVE aceitar uma data alvo como string ISO 8601 e um callback opcional onExpire a ser invocado quando o countdown chegar a zero
3. ENQUANTO o tempo restante até a data alvo for maior que zero, O Countdown_Component DEVE exibir horas, minutos e segundos no formato "HH:MM:SS" com valores de dois dígitos preenchidos com zero, onde horas podem exceder 99 para countdowns longos
4. QUANDO o countdown chegar a zero, O Countdown_Component DEVE exibir o texto "Encerrado", invocar o callback onExpire exatamente uma vez e parar o timer de intervalo interno
5. SE a data alvo estiver no passado no momento da montagem, ENTÃO O Countdown_Component DEVE exibir "Encerrado" imediatamente sem iniciar um intervalo e DEVE invocar o callback onExpire exatamente uma vez
6. QUANDO o Countdown_Component for desmontado, O Countdown_Component DEVE limpar o timer de intervalo ativo para prevenir memory leaks e atualizações de estado em componente desmontado
7. O Countdown_Component DEVE atualizar seu valor exibido em intervalos de 1000 milissegundos

### Requisito 2: Memoizar CardJogoPalpite

**User Story:** Como usuário, eu quero que a lista de jogos com palpites renderize de forma eficiente, para que interações com um card não causem re-renders em todos os outros cards da lista.

#### Critérios de Aceite

1. O CardJogoPalpite DEVE ser envolvido com React.memo usando a função de comparação customizada definida no critério 3 para prevenir re-renders quando as props comparadas não mudaram
2. QUANDO um componente pai re-renderiza devido a mudanças de estado não relacionadas a um card específico, O CardJogoPalpite NÃO DEVE re-renderizar se as props avaliadas pela função de comparação permanecerem iguais
3. O CardJogoPalpite DEVE usar uma função de comparação customizada que retorna true (pulando re-render) quando todas as seguintes props forem iguais entre renders anterior e próximo: jogo.id, jogo.status, jogo.golsCasa, jogo.golsFora, jogo.dataHora, palpitavel, grupoId e ativo
4. A função de comparação customizada do CardJogoPalpite DEVE excluir a prop de callback onFoco da comparação para que novas referências de função criadas em re-renders do pai não disparem re-renders nos cards irmãos

### Requisito 3: Criar Hook Compartilhado usePalpiteMutation

**User Story:** Como desenvolvedor, eu quero unificar a lógica duplicada de criação e atualização de palpites em um único hook reutilizável, para reduzir manutenção e garantir comportamento consistente.

#### Critérios de Aceite

1. O usePalpiteMutation_Hook DEVE encapsular a lógica de criar um novo palpite (via POST /jogos/:jogoId/palpites) e atualizar um palpite existente (via PATCH /palpites/:palpiteId) em um único hook
2. O usePalpiteMutation_Hook DEVE atualizar a entrada do Query_Cache ['meu-palpite', jogoId] em caso de mutação bem-sucedida com os dados do Palpite retornado
3. O usePalpiteMutation_Hook DEVE expor os estados isPending, isSuccess e error para o componente consumidor
4. QUANDO um palpite for criado ou atualizado com sucesso, O usePalpiteMutation_Hook DEVE invocar um callback opcional onSuccess fornecido pelo consumidor, passando o objeto Palpite retornado
5. O Frontend DEVE usar usePalpiteMutation_Hook em components/jogos/card-jogo-palpite.tsx e components/palpite/palpite-inline-form.tsx, substituindo a lógica de mutação inline
6. O Frontend DEVE deletar o arquivo obsoleto components/palpites/card-jogo-palpite.tsx após migração para o hook compartilhado
7. O usePalpiteMutation_Hook DEVE aceitar jogoId e um palpiteId opcional como parâmetros para determinar se deve criar ou atualizar

### Requisito 4: Adicionar Error Boundaries

**User Story:** Como usuário, eu quero que falhas em seções específicas da página não derrubem a aplicação inteira, para que eu possa continuar usando as partes funcionais.

#### Critérios de Aceite

1. O Frontend DEVE envolver cada seção dependente de query (ranking, próximo jogo, lista de palpites) com seu próprio componente Error_Boundary independente, de forma que uma falha em uma seção não afete a renderização das outras seções
2. QUANDO um erro de runtime ocorrer dentro de um Error_Boundary, O Error_Boundary DEVE exibir uma UI de fallback contendo o nome da seção que falhou e um botão de retry, enquanto todas as seções irmãs fora daquele Error_Boundary continuam renderizando normalmente
3. QUANDO o usuário clicar no botão de retry, O Error_Boundary DEVE resetar seu estado de erro e tentar re-renderizar os filhos
4. SE o re-render disparado pelo botão de retry resultar em outro erro de runtime, ENTÃO O Error_Boundary DEVE exibir a mesma UI de fallback novamente com o botão de retry ainda disponível
5. QUANDO um erro de runtime for capturado por um Error_Boundary, O Error_Boundary DEVE logar a mensagem de erro e o component stack no console do navegador

### Requisito 5: Refatorar Páginas Grandes em Sub-Componentes

**User Story:** Como desenvolvedor, eu quero que páginas com mais de 200 linhas sejam decompostas em sub-componentes, para melhorar a legibilidade e facilitar manutenção.

#### Critérios de Aceite

1. O Frontend DEVE refatorar o grupos/[grupoId]/page.tsx (~330 linhas) em pelo menos 2 sub-componentes, reduzindo o arquivo principal da página para no máximo 200 linhas enquanto cada sub-componente extraído contém uma única seção lógica de UI
2. O Frontend DEVE refatorar o grupos/[grupoId]/configuracoes/page.tsx (~250 linhas) em pelo menos 2 sub-componentes, reduzindo o arquivo principal da página para no máximo 200 linhas
3. O Frontend DEVE colocar sub-componentes extraídos no diretório src/components/ organizado por pasta de domínio (ex: src/components/grupo/, src/components/palpite/) seguindo a convenção existente do projeto
4. QUANDO uma página for refatorada em sub-componentes, O Frontend DEVE preservar toda funcionalidade existente, saída de renderização e interações do usuário sem regressão
5. SE o palpites/page.tsx exceder 200 linhas no momento da refatoração, ENTÃO O Frontend DEVE decompô-lo em sub-componentes reduzindo o arquivo principal para no máximo 200 linhas

### Requisito 6: Implementar Lazy Loading com next/dynamic

**User Story:** Como usuário, eu quero que modais e conteúdo de abas secundárias sejam carregados sob demanda, para que o carregamento inicial da página seja mais rápido.

#### Critérios de Aceite

1. O Frontend DEVE carregar componentes de modal (ModalConfirmacao e qualquer componente renderizado condicionalmente via padrão overlay/dialog) usando next/dynamic com ssr: false
2. O Frontend DEVE carregar componentes de conteúdo de aba que não são visíveis no render inicial (ex: conteúdo exibido apenas após interação do usuário com aba ou toggle de filtro) usando next/dynamic
3. ENQUANTO um componente importado dinamicamente estiver carregando, O Frontend DEVE exibir um placeholder de loading que ocupa as mesmas dimensões do componente alvo e contém um skeleton animado ou spinner de no máximo 48x48 pixels
4. O Frontend NÃO DEVE introduzir um Cumulative Layout Shift (CLS) maior que 0.1 quando o componente carregado dinamicamente renderizar
5. SE um componente importado dinamicamente falhar ao carregar devido a erro de rede, ENTÃO O Frontend DEVE exibir uma mensagem de erro inline indicando a falha e oferecer uma ação de retry para re-tentar o import

### Requisito 7: Corrigir Import Dinâmico em classificacao.service.ts

**User Story:** Como desenvolvedor, eu quero que o serviço de classificação use import estático como todos os outros serviços, para manter consistência e evitar overhead desnecessário.

#### Critérios de Aceite

1. O classificacao.service.ts DEVE usar uma declaração de import estático top-level `import apiClient from '@/lib/api-client'` idêntica ao padrão usado por jogo.service.ts e palpite.service.ts
2. O classificacao.service.ts NÃO DEVE conter nenhuma chamada dinâmica `await import()` para apiClient
3. QUANDO o import estático for aplicado, A função `buscarClassificacao` DEVE preservar seu comportamento existente: aceitar um parâmetro opcional `season`, chamar o endpoint `/classificacao`, retornar `ClassificacaoTime[]` em caso de sucesso
4. QUANDO a refatoração estiver completa, O projeto DEVE compilar sem erros TypeScript relacionados ao classificacao.service.ts

### Requisito 8: Padronizar Tratamento de Erros nos Services

**User Story:** Como desenvolvedor, eu quero que todos os serviços tratem erros de forma consistente, para que falhas sejam propagadas de maneira previsível ao chamador.

#### Critérios de Aceite

1. A Service_Layer DEVE propagar erros ao chamador sem interceptação try/catch, permitindo que o TanStack React Query gerencie estados de erro na camada de UI
2. SE uma função de serviço retornar um valor fallback em caso de erro ao invés de propagar, ENTÃO A Service_Layer DEVE incluir um comentário de código acima do bloco try/catch explicando o motivo da supressão e qual valor fallback é retornado
3. SE uma função de serviço capturar um erro e retornar um valor fallback, ENTÃO A Service_Layer DEVE retornar um valor que seja distinguível por tipo de uma resposta bem-sucedida (ex: null ao invés de array vazio) para que chamadores possam diferenciar entre "sem dados" e "requisição falhou"
4. O classificacao.service.ts DEVE propagar erros de buscarClassificacao ao invés de retornar array vazio no bloco catch
5. O jogo.service.ts DEVE propagar erros de buscarDadosTemporada e contarJogosAdiadosRodada ao invés de retornar objetos fallback ou valores zero no bloco catch
6. SE uma função de serviço intencionalmente retornar um fallback para uma query não-crítica (ex: buscarMeuPalpite retornando null quando nenhum palpite existe), ENTÃO A Service_Layer DEVE capturar apenas a condição de erro específica esperada (como resposta 404) e re-lançar todos os outros erros

### Requisito 9: Remover Código Morto

**User Story:** Como desenvolvedor, eu quero que código não utilizado seja removido do projeto, para reduzir o tamanho do bundle e eliminar confusão durante manutenção.

#### Critérios de Aceite

1. SE a função `buscarProximosJogos` em jogo.service.ts tiver zero referências de import fora de seu próprio arquivo (verificado via análise estática do projeto), ENTÃO O Frontend DEVE remover a função e seu import de tipo `JogoProximo` associado do jogo.service.ts
2. SE nenhum arquivo no projeto importar de `@/services` ou `@/services/index` (verificado via análise estática de declarações de import), ENTÃO O Frontend DEVE deletar o arquivo services/index.ts inteiramente
3. SE nenhum arquivo no projeto importar de `@/services` ou `@/services/index` mas pelo menos um alvo de export (auth.service, usuario.service, grupo.service) for importado diretamente em outro lugar, ENTÃO O Frontend DEVE deletar apenas services/index.ts sem afetar os arquivos de serviço individuais
4. QUANDO endpoints reais de API para dados de ranking e lista de próximos jogos forem integrados ao inicio/page.tsx, O Frontend DEVE remover as constantes hardcoded `mockRanking` e `mockProximosJogos`, a função helper `proximaData`, e todos os valores de prop hardcoded inline passados ao `CardProximoJogo`
5. QUANDO qualquer critério neste requisito resultar em deleção de arquivo ou remoção de função, O Frontend DEVE verificar que o projeto compila sem erros executando o processo de build com sucesso

### Requisito 10: Corrigir Cache do Batch de Palpites

**User Story:** Como usuário, eu quero que meus palpites reflitam dados atualizados quando volto à aplicação, para que eu não veja informações desatualizadas.

#### Critérios de Aceite

1. O Query_Cache DEVE configurar a query de batch de palpites com staleTime de 300000ms (5 minutos) ao invés de Infinity, garantindo que os dados em cache sejam considerados stale e elegíveis para refetch após 5 minutos
2. QUANDO o usuário retornar à aba do navegador (evento de window focus), O Query_Cache DEVE disparar um refetch da query de batch de palpites se os dados em cache excederam o staleTime de 300000ms
3. SE o componente pai já popular a entrada de cache ['meu-palpite', jogoId] via query batch, ENTÃO O Frontend NÃO DEVE emitir uma chamada useQuery individual redundante para a mesma queryKey no palpite-inline-form.tsx
4. QUANDO o refetch da query batch de palpites completar com sucesso após window focus, O Frontend DEVE atualizar todos os componentes de palpite renderizados em 1 ciclo de render para exibir os valores atualizados de golsCasa e golsFora

### Requisito 11: Corrigir Google Fonts Não Utilizadas

**User Story:** Como usuário, eu quero que fontes desnecessárias não sejam carregadas, para que o tempo de carregamento inicial da página seja reduzido.

#### Critérios de Aceite

1. O Frontend DEVE aplicar a família de fontes Geist (carregada via next/font no layout.tsx) ao elemento body substituindo a declaração `font-family: Arial, Helvetica, sans-serif` no globals.css por `font-family: var(--font-geist-sans), sans-serif`
2. O Frontend NÃO DEVE carregar recursos de fonte que são sobrescritos por declarações font-family do globals.css
3. QUANDO a correção de fonte for aplicada, O Frontend DEVE renderizar todo texto do body usando a família de fontes Geist ao invés de Arial

### Requisito 12: Adicionar Otimizações de Bundle ao next.config.ts

**User Story:** Como usuário, eu quero que o bundle de produção seja o menor possível, para que a aplicação carregue rapidamente em conexões lentas.

#### Critérios de Aceite

1. O Bundle_Config DEVE incluir o pacote lucide-react no array experimental.optimizePackageImports para habilitar tree-shaking de ícones não utilizados
2. O Bundle_Config DEVE incluir configuração compiler.removeConsole que remove declarações console.log, console.debug e console.info de builds de produção enquanto preserva console.warn e console.error
3. QUANDO a aplicação for buildada com `next build`, O Bundle_Config DEVE produzir um bundle de produção onde apenas os ícones lucide-react explicitamente importados no código fonte são incluídos na saída
4. ENQUANTO em modo de desenvolvimento (next dev), O Bundle_Config DEVE deixar todos os métodos console funcionais e não modificados
