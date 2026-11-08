# Requirements Document

## Introduction

Destaques/Destaques do Grupo é uma camada social adicionada ao bolão, inspirada no formato de Destaques para navegação. Quando eventos relevantes acontecem no grupo (acertos, subidas no ranking, sequências), o sistema gera automaticamente "destaques" que representam uma **timeline de acontecimentos do grupo**, apresentada como avatares em um carrossel. Ao tocar em um avatar, o usuário abre um visualizador em tela cheia que navega cronologicamente pelos acontecimentos recentes do grupo.

O avatar é apenas o ponto de entrada — o viewer navega **acontecimentos do grupo** em ordem cronológica, não destaques individuais de um membro.

A feature abrange backend (geração, persistência, interação "Mandar um F") e frontend (carrossel de avatares, visualizador fullscreen com navegação cronológica, auto-advance e barra de progresso animada).

Esta spec cobre a **Wave 1 (MVP)** + polimento de produto. `SEQUENCIA_MOSCA` permanece no enum/histórico mas **não é gerada**. O viewer no grupo é inline (não overlay fullscreen). Detalhes da regra em vigor: `design.md` (seção Estado atual) e `tasks.md`.

## Glossary

- **Destaque**: Registro persistido no banco representando um acontecimento relevante no grupo, vinculado a um usuário, jogo e rodada específicos.
- **Destaque_Viewer**: Componente frontend de tela cheia que exibe destaques em ordem cronológica com navegação por swipe, auto-advance, barra de progresso animada e controles de fechar.
- **Destaque_Carousel**: Faixa horizontal de avatares exibida na tela do grupo, entre as abas e o card "Próximo Jogo".
- **Destaque_Generator_Service**: Service backend responsável por gerar destaques automaticamente após a finalização de um jogo.
- **Destaque_Type**: Enumeração dos tipos de destaque possíveis: ACERTOU_EM_CHEIO, UNICO_NA_MOSCA, SUBIU_RANKING, SEQUENCIA_MOSCA, SEQUENCIA_RESULTADO, NAO_PALPITOU, DOBROU_E_ACERTOU.
- **Reaction_F**: Interação social onde um membro do grupo envia um "F" para o autor de um destaque do tipo NAO_PALPITOU.
- **Recorde_Sequencia**: Registro persistido do maior número de acertos consecutivos dentro de um grupo por categoria (mosca ou resultado), com os detentores atuais. Reseta a cada temporada.
- **Visualizado**: Estado que indica que um membro já viu determinado destaque. Avatares com destaques novos (não visualizados) exibem borda colorida; já vistos exibem borda cinza.
- **Sistema**: O sistema Bolão (backend + frontend) como um todo.
- **Grupo**: Grupo de bolão onde os membros participam com palpites.
- **Membro**: Usuário que pertence a um grupo de bolão.

## Requirements

### Requisito 1: Modelo de Dados de Destaque

**User Destaque:** Como desenvolvedor, eu quero um modelo de dados persistido para destaques, para que o sistema armazene e consulte destaques de forma eficiente.

#### Critérios de Aceitação

1. THE Sistema SHALL persistir cada destaque com os campos: id (UUID gerado automaticamente), grupoId (UUID), usuarioId (UUID), jogoId (UUID), rodada (inteiro positivo entre 1 e 38), tipo (Destaque_Type), dados (JSONB com estrutura validada conforme o tipo do destaque), titulo (String — título randomizado selecionado na geração), contadorFs (Int, default 0), criadoEm (timestamp com timezone, preenchido automaticamente na criação).
2. WHEN um destaque for criado, THE Sistema SHALL vincular o destaque a exatamente um grupo, um usuário e um jogo, aplicando foreign keys para grupoId, usuarioId e jogoId.
3. THE Sistema SHALL indexar destaques por grupoId e criadoEm (índice composto) para consultas de listagem ordenadas por data.
4. THE Sistema SHALL indexar destaques por grupoId e usuarioId (índice composto) para consultas filtradas por membro.
5. THE Sistema SHALL indexar destaques por grupoId e rodada (índice composto) para consultas filtradas por rodada.
6. THE Sistema SHALL garantir unicidade da combinação (grupoId, usuarioId, jogoId, tipo), impedindo a criação de destaques duplicados para o mesmo evento.
7. IF um destaque for criado referenciando um grupoId, usuarioId ou jogoId inexistente, THEN THE Sistema SHALL rejeitar a operação com erro indicando qual entidade referenciada não foi encontrada.
8. THE Sistema SHALL persistir um registro de visualização (DestaqueVisualizacao) com os campos: destaqueId, usuarioId, visualizadoEm (timestamp). Constraint: @@unique([destaqueId, usuarioId]).

### Requisito 2: Geração Automática de Destaques

**User Destaque:** Como membro do grupo, eu quero que destaques sejam gerados automaticamente quando um jogo é finalizado, para que eu descubra o que aconteceu sem ação manual.

#### Critérios de Aceitação

1. WHEN um jogo for finalizado, THE Destaque_Generator_Service SHALL gerar destaques para todos os membros de todos os grupos cuja temporada contenha a fase do jogo, avaliando individualmente cada membro contra os critérios dos tipos ativos (ACERTOU_EM_CHEIO, UNICO_NA_MOSCA, SUBIU_RANKING, SEQUENCIA_RESULTADO, NAO_PALPITOU, DOBROU_E_ACERTOU). `SEQUENCIA_MOSCA` NÃO é gerada.
2. WHEN um membro acertar o placar exato (acerto em cheio) E não for o único do grupo a fazê-lo, THE Destaque_Generator_Service SHALL gerar um destaque do tipo ACERTOU_EM_CHEIO com os dados do placar e dos times (nome, sigla e escudo de cada time, gols marcados por cada lado). WHEN 3 ou mais membros cravarem o mesmo jogo, THE Sistema SHALL consolidar esses destaques em um único card de **panelinha** na listagem (participantes no JSONB; título de catálogo próprio).
3. WHEN um membro for o único do grupo a acertar o placar exato (na mosca) do jogo, THE Destaque_Generator_Service SHALL gerar um destaque do tipo UNICO_NA_MOSCA com as informações do jogo (times, placar e rodada). Neste caso, NÃO gerar ACERTOU_EM_CHEIO adicionalmente (UNICO_NA_MOSCA tem prioridade por ser mais raro).
4. WHEN um membro subir 2 ou mais posições no ranking do grupo OU subir 1 posição estando dentro do top 5, THE Destaque_Generator_Service SHALL gerar um destaque do tipo SUBIU_RANKING com a posição anterior, a nova posição e o top 5 do grupo (nome e pontuação de cada membro).
5. THE Destaque_Generator_Service SHALL NOT gerar `SEQUENCIA_MOSCA` na regra atual (tipo fora de escopo de produto; se existir residual, é removido/ignorado).
6. WHEN um membro acumular uma sequência de acertos de resultado (cheio + resultado) com pelo menos 3 jogos e 4 pontos, THE Destaque_Generator_Service SHALL gerar um destaque do tipo SEQUENCIA_RESULTADO. A sequência pode cruzar no máximo 1 rodada anterior (só se o fim da anterior pontuou); jogos com o mesmo horário de início formam um slot — se algum não pontuou, o slot quebra a sequência. Na listagem, THE Sistema SHALL manter no máximo 1 card de sequência por pessoa/rodada (a melhor). Grava recordes da categoria RESULTADO.
7. WHEN um membro não registrar palpite para nenhum jogo de uma rodada que teve pelo menos 1 jogo finalizado, THE Destaque_Generator_Service SHALL gerar um único destaque do tipo NAO_PALPITOU consolidado por rodada, contendo a lista de jogos que o membro esqueceu e o total de jogos da rodada.
8. WHEN um membro usar palpite dobrado e acertar o resultado, THE Destaque_Generator_Service SHALL gerar um destaque do tipo DOBROU_E_ACERTOU com o placar do jogo, os times e a pontuação dobrada obtida.
9. THE Destaque_Generator_Service SHALL executar após o cálculo de pontuação e atualização do ranking, de forma fire-and-forget (sem bloquear o fluxo principal de finalização), seguindo o padrão existente de JogoService.dispararNotificacoesJogoFinalizado.
10. IF a geração de destaque falhar para um membro individual, THEN THE Destaque_Generator_Service SHALL registrar o erro em log e continuar a geração para os demais membros do grupo sem interromper o processo.
11. THE Destaque_Generator_Service SHALL garantir deduplicação por combinação de grupoId, usuarioId, jogoId e tipo, de modo que executar a geração mais de uma vez para o mesmo jogo não crie destaques duplicados.
12. WHEN um membro atender a múltiplos critérios de destaque no mesmo jogo (por exemplo, ACERTOU_EM_CHEIO e SUBIU_RANKING), THE Destaque_Generator_Service SHALL gerar um destaque separado para cada tipo atendido, respeitando a regra de prioridade UNICO_NA_MOSCA > ACERTOU_EM_CHEIO.
13. WHEN um membro igualar ou superar o recorde do grupo na categoria RESULTADO, THE Destaque_Generator_Service SHALL atualizar o registro de recorde persistido com o novo valor e o(s) detentor(es).
14. WHEN dois ou mais membros empatarem no recorde de sequência, THE Sistema SHALL manter ambos como detentores do recorde simultaneamente.
15. WHEN o Destaque_Generator_Service gerar um destaque, THE Sistema SHALL sortear um título aleatório da lista de títulos configurados para o tipo, evitando repetição imediata e títulos já usados na rodada quando houver alternativa. IF o título tiver `titleFeminino`, THE Sistema SHALL flexionar pelo primeiro nome do autor (heurística PT-BR). O texto final é persistido em `titulo`.
16. KNOWN LIMITATION: jogos com o mesmo horário de início não têm ordem de encerramento confiável na API — o slot inteiro quebra a sequência se algum não pontuou. Risco aceitável.

### Requisito 3: Listagem de Destaques do Grupo

**User Destaque:** Como membro do grupo, eu quero consultar os destaques recentes do grupo, para que o frontend exiba o carrossel de avatares e o visualizador.

#### Critérios de Aceitação

1. WHEN um membro autenticado requisitar GET /grupos/:grupoId/destaques, THE Sistema SHALL retornar até 20 destaques da rodada solicitada (query `?rodada=`) ou, sem query, da rodada Atual, após dedupe/panelinha/seleção diversa. Cada item inclui: id, tipo, titulo, dados, jogoId, rodada, criadoEm, contadorFs, jaEnviouF, visualizado, autor (usuarioId, nome, avatar=null). A resposta também inclui `rodadasDisponiveis`.
2. WHEN não houver destaques na rodada pedida/Atual, THE Sistema SHALL retornar lista vazia (podendo ainda informar `rodadasDisponiveis`).
3. IF um usuário autenticado que não é membro do grupo (nem ADMIN nem MEMBER) requisitar os destaques, THEN THE Sistema SHALL rejeitar a requisição com erro de acesso negado.
4. THE Sistema SHALL restringir o acesso ao endpoint exclusivamente a membros do grupo com role ADMIN ou MEMBER, utilizando GroupRoleGuard.
5. THE Sistema SHALL determinar "rodada Atual" do feed como a **maior rodada com pelo menos um jogo finalizado** na fase de pontos corridos do grupo.
6. WHEN o frontend da Home precisar exibir destaques, THE Sistema SHALL reusar o endpoint GET /grupos/:grupoFavoritoId/destaques, onde o grupoFavoritoId é determinado pelo frontend a partir dos dados do usuário (não há endpoint separado de Home).
7. THE Sistema SHALL retornar os destaques como lista (não agrupados por membro), com seleção diversa por prioridade de tipo para não monopolizar o limite: UNICO_NA_MOSCA (1), NAO_PALPITOU (2), SEQUENCIA_RESULTADO (3), ACERTOU_EM_CHEIO (4), SUBIU_RANKING (5), DOBROU_E_ACERTOU (6). A prioridade não é persistida.

### Requisito 4: Interação "Mandar um F"

**User Destaque:** Como membro do grupo, eu quero enviar um "F" para quem não palpitou, para interagir de forma divertida com os colegas do grupo.

#### Critérios de Aceitação

1. WHEN um membro autenticado e pertencente ao grupo enviar um "F" para um destaque do tipo NAO_PALPITOU, THE Sistema SHALL registrar a reação e incrementar o contador de Fs do destaque em 1 unidade. Constraint de deduplicação: @@unique([remetenteId, destaqueId]).
2. IF um membro tentar enviar um "F" para um destaque que não seja do tipo NAO_PALPITOU, THEN THE Sistema SHALL rejeitar a requisição com um Domain Error indicando que reações do tipo F são permitidas apenas em destaques NAO_PALPITOU.
3. IF um membro tentar enviar um "F" para o próprio destaque, THEN THE Sistema SHALL rejeitar a requisição com um Domain Error informando que não é permitido enviar F para si mesmo.
4. IF um membro tentar enviar um segundo "F" para o mesmo destaque, THEN THE Sistema SHALL rejeitar a requisição com um Domain Error informando que o usuário já enviou um F.
5. IF um membro tentar enviar um "F" para um destaque inexistente ou de uma rodada que não é atual nem anterior, THEN THE Sistema SHALL rejeitar a requisição com um Domain Error de recurso não encontrado.
6. WHEN um "F" for registrado com sucesso, THE Sistema SHALL enviar uma notificação push para o autor do destaque no formato "[Remetente] mandou um F por você ter esquecido de palpitar [TimeCasa] x [TimeFora]", respeitando as preferências de notificação do autor.
7. WHEN múltiplos membros enviarem F para o mesmo destaque, THE Sistema SHALL agrupar as notificações no formato "X pessoas mandaram um F — [TimeCasa] x [TimeFora]" em vez de enviar uma notificação por remetente.
8. WHEN um membro autenticado consultar um destaque, THE Sistema SHALL retornar o contador total de Fs do destaque e um indicador booleano informando se o membro já enviou um F para aquele destaque.
9. THE Sistema SHALL restringir o envio de "F" a membros do grupo ao qual o destaque pertence (ADMIN ou MEMBER), rejeitando requisições de não-membros com erro de autorização.

### Requisito 5: Feed de Destaques no Grupo (Frontend)

**User Destaque:** Como membro do grupo, eu quero ver os destaques recentes na tela do grupo, para descobrir o que rolou na rodada.

#### Critérios de Aceitação

1. THE Destaque_Carousel SHALL ser posicionado na tela do grupo (entre o topo do conteúdo e as demais seções do grupo).
2. THE Destaque_Carousel SHALL exibir o Destaque_Viewer inline com os destaques da rodada ativa (não uma faixa de avatares como entrada principal).
3. THE Destaque_Carousel SHALL oferecer filtro de rodada com até 2 botões (`rodadasDisponiveis` da API), sendo o primeiro a Atual.
4. WHEN o membro trocar o filtro de rodada, THE Sistema SHALL recarregar os destaques da rodada escolhida via `?rodada=`.
5. WHILE não houver destaques nem rodadas disponíveis, THE Destaque_Carousel SHALL permanecer oculto.
6. WHILE os dados estiverem carregando, THE Destaque_Carousel SHALL exibir placeholder de loading.
7. IF a requisição de destaques falhar, THEN THE Destaque_Carousel SHALL ocultar o viewer sem mensagem de erro técnica.
8. THE Destaque_Carousel MAY ser exibido na Home com os destaques do grupo favorito e aviso textual: "Grupo favorito: [Nome]. Para ver outros, acesse o grupo desejado."

### Requisito 6: Visualizador de Destaques (Frontend)

**User Destaque:** Como membro do grupo, eu quero consumir os acontecimentos recentes do grupo em tela cheia com navegação cronológica, para ter uma experiência rápida e imersiva.

#### Critérios de Aceitação

1. WHEN o Destaque_Viewer for exibido, THE Sistema SHALL mostrar a timeline da rodada ativa (não filtrada por membro). O card muda conforme o destaque atual.
2. THE Destaque_Viewer SHALL ser inline no grupo (não overlay fullscreen) com: barra de progresso segmentada, card do tipo, título, dados contextuais e rodapé com rodada.
3. THE Destaque_Viewer SHALL permitir navegação por swipe horizontal e tap (direita = próximo, esquerda = anterior). Toques em botões interativos (ex: "Mandar F") NÃO devem avançar (stopPropagation).
4. THE Destaque_Viewer NÃO exige botão X / swipe-down de fechar (é inline na página do grupo).
5. THE Destaque_Viewer SHALL implementar auto-advance com timer por tipo: NAO_PALPITOU e ACERTOU_EM_CHEIO: 5s; UNICO_NA_MOSCA e DOBROU_E_ACERTOU: 6s; SEQUENCIA_RESULTADO: 7s; SUBIU_RANKING: 8s. Long press pausa.
6. THE Destaque_Viewer SHALL exibir a barra de progresso com segmentos que preenchem ao longo do timer do tipo.
7. WHEN o membro tocar e segurar (long press), THE Destaque_Viewer SHALL pausar o timer e a animação; ao soltar, retoma.
8. WHEN o destaque for NAO_PALPITOU, THE Destaque_Viewer SHALL exibir o botão "Mandar um F" com contador.
9. WHEN o F for enviado com sucesso, THE Destaque_Viewer SHALL atualizar o estado para "já mandou" e o contador.
10. IF o F falhar, THEN THE Destaque_Viewer SHALL manter o botão e mostrar erro amigável em PT-BR.
11. THE API SHALL limitar a listagem a no máximo 20 destaques por request; o FE consome a lista retornada da rodada ativa.
12. WHEN o viewer atingir o último destaque, THE Destaque_Viewer SHALL indicar o fim e NÃO avançar automaticamente além.
13. WHEN destaques forem exibidos, THE frontend SHALL marcar visualização em batch (ao desmontar o viewer): POST /grupos/:grupoId/destaques/visualizar.
14. WHEN o membro tentar voltar antes do primeiro destaque, THE Destaque_Viewer SHALL permanecer no atual.

### Requisito 7: Layout Específico por Tipo de Destaque

**User Destaque:** Como membro do grupo, eu quero que cada tipo de destaque tenha um layout visual distinto, para que eu identifique rapidamente o tipo de destaque.

#### Critérios de Aceitação

1. WHEN o destaque for do tipo ACERTOU_EM_CHEIO individual, THE Destaque_Viewer SHALL exibir: avatar do autor, título, placar "X × Y" e ícone 🎯. WHEN for panelinha (3+ participantes), THE card SHALL omitir o avatar individual, centralizar o conteúdo e listar os nomes em duas colunas.
2. WHEN o destaque for do tipo UNICO_NA_MOSCA, THE Destaque_Viewer SHALL exibir: avatar, título (flexionado se aplicável), placar e ícone 🦄.
3. WHEN o destaque for do tipo SUBIU_RANKING, THE Destaque_Viewer SHALL exibir: avatar, título, posição nova/anterior, Top 5 em duas colunas e ícone 🚀.
4. THE Destaque_Viewer NÃO precisa de layout de `SEQUENCIA_MOSCA` enquanto o tipo não for gerado.
5. WHEN o destaque for do tipo SEQUENCIA_RESULTADO, THE Destaque_Viewer SHALL exibir: avatar, título, quantidade de jogos da sequência, pontos (quando disponível), badge de novo recorde e ícone 🔥.
6. WHEN o destaque for do tipo NAO_PALPITOU, THE Destaque_Viewer SHALL exibir: avatar do autor, título randomizado, lista de jogos esquecidos na rodada com nomes dos times e placar, contador de Fs recebidos, botão "Mandar um F" (ou estado "Você já mandou um F") e ícone 😴 como indicador visual do tipo.
7. WHEN o destaque for do tipo DOBROU_E_ACERTOU, THE Destaque_Viewer SHALL exibir: avatar do autor, título randomizado, placar do jogo, escudos e nomes dos times, pontuação dobrada obtida com destaque visual dourado e ícone 💎 como indicador visual do tipo.
8. THE Destaque_Viewer SHALL aplicar um gradiente de fundo ou cor de destaque distinta para cada Destaque_Type, permitindo diferenciação visual imediata ao navegar entre destaques.
9. WHEN o membro igualar ou superar o recorde do grupo na categoria exibida, THE Destaque_Viewer SHALL exibir um badge "🏆 Novo recorde!" em destaque no destaque.

### Requisito 8: Notificação de Destaque Gerado

**User Destaque:** Como membro do grupo, eu quero ser notificado quando novos destaques forem gerados no grupo, para que eu abra o app e descubra o que aconteceu.

#### Critérios de Aceitação

1. WHEN novos destaques forem gerados após a finalização de um jogo, THE Sistema SHALL enviar uma notificação push para todos os membros do grupo que possuem inscrição push ativa, informando a quantidade de novos destaques disponíveis no grupo.
2. THE Sistema SHALL consolidar a notificação em uma única mensagem por grupo por jogo finalizado, utilizando o método de deduplicação existente (existeNotificacao) com a combinação tipo DESTAQUES_GRUPO, grupoId e jogoId.
3. IF a preferência DESTAQUES_GRUPO do membro estiver desabilitada no PreferenciaNotificacao, THEN THE Sistema SHALL não enviar a notificação push para esse membro.
4. WHEN o membro tocar na notificação push de destaques, THE Sistema SHALL direcionar o membro para a tela de destaques do grupo correspondente (deep-link).
5. THE Sistema SHALL registrar o tipo de notificação como DESTAQUES_GRUPO no enum de tipos de notificação e adicionar o campo booleano correspondente no modelo PreferenciaNotificacao com valor padrão habilitado (true).

### Requisito 9: Expiração e Limpeza de Destaques

**User Destaque:** Como desenvolvedor, eu quero que destaques antigos sejam removidos periodicamente, para que o banco não acumule dados desnecessários.

#### Critérios de Aceitação

1. THE Sistema SHALL considerar destaques visíveis no carrossel e viewer apenas se pertencerem à rodada atual ou à rodada anterior da fase correspondente.
2. THE Sistema SHALL considerar destaques com mais de 30 dias (a partir de criadoEm) como elegíveis para hard delete.
3. THE Sistema SHALL executar um cron job diário no horário `0 5 * * *` (02:00 BRT) removendo do banco de dados todos os destaques com criadoEm anterior a 30 dias.
4. WHEN o cron job de limpeza remover destaques, THE Sistema SHALL remover em cascata todas as reações (Reaction_F) e visualizações (DestaqueVisualizacao) associadas aos destaques deletados.
5. IF o cron job de limpeza falhar, THEN THE Sistema SHALL registrar o erro em log com a mensagem e stack trace sem interromper a execução da aplicação.
6. WHEN um destaque de rodada não-atual e não-anterior for consultado diretamente por ID, THE Sistema SHALL retornar erro de recurso não encontrado (destaques fora do escopo visível não são acessíveis via API, mas permanecem no banco para histórico futuro até os 30 dias).
