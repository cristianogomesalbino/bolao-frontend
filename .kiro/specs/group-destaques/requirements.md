# Requirements Document

## Introduction

Destaques/Destaques do Grupo é uma camada social adicionada ao bolão, inspirada no formato de Destaques para navegação. Quando eventos relevantes acontecem no grupo (acertos, subidas no ranking, sequências), o sistema gera automaticamente "destaques" que representam uma **timeline de acontecimentos do grupo**, apresentada como avatares em um carrossel. Ao tocar em um avatar, o usuário abre um visualizador em tela cheia que navega cronologicamente pelos acontecimentos recentes do grupo.

O avatar é apenas o ponto de entrada — o viewer navega **acontecimentos do grupo** em ordem cronológica, não destaques individuais de um membro.

A feature abrange backend (geração, persistência, interação "Mandar um F") e frontend (carrossel de avatares, visualizador fullscreen com navegação cronológica, auto-advance e barra de progresso animada).

Esta spec cobre a **Wave 1 (MVP)** — infraestrutura completa + 7 tipos base de destaque. Waves futuras estão documentadas em `docs/roadmap/destaques-waves.md`.

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

1. WHEN um jogo for finalizado, THE Destaque_Generator_Service SHALL gerar destaques para todos os membros de todos os grupos cuja temporada contenha a fase do jogo, avaliando individualmente cada membro contra os critérios dos tipos de destaque (ACERTOU_EM_CHEIO, UNICO_NA_MOSCA, SUBIU_RANKING, SEQUENCIA_MOSCA, SEQUENCIA_RESULTADO, NAO_PALPITOU, DOBROU_E_ACERTOU).
2. WHEN um membro acertar o placar exato (acerto em cheio) E não for o único do grupo a fazê-lo, THE Destaque_Generator_Service SHALL gerar um destaque do tipo ACERTOU_EM_CHEIO com os dados do placar e dos times (nome, sigla e escudo de cada time, gols marcados por cada lado).
3. WHEN um membro for o único do grupo a acertar o placar exato (na mosca) do jogo, THE Destaque_Generator_Service SHALL gerar um destaque do tipo UNICO_NA_MOSCA com as informações do jogo (times, placar e rodada). Neste caso, NÃO gerar ACERTOU_EM_CHEIO adicionalmente (UNICO_NA_MOSCA tem prioridade por ser mais raro).
4. WHEN um membro subir 2 ou mais posições no ranking do grupo OU subir 1 posição estando dentro do top 5, THE Destaque_Generator_Service SHALL gerar um destaque do tipo SUBIU_RANKING com a posição anterior, a nova posição e o top 5 do grupo (nome e pontuação de cada membro).
5. WHEN um membro acumular 2 ou mais acertos em cheio (placar exato) consecutivos na mesma rodada — sem nenhum jogo finalizado entre eles onde o membro não acertou em cheio (a ordem é por horário de finalização do jogo) — THE Destaque_Generator_Service SHALL gerar um destaque do tipo SEQUENCIA_MOSCA com a quantidade de acertos em cheio consecutivos na rodada, os dados dos últimos 5 jogos da sequência, o recorde atual do grupo nessa categoria e os detentores do recorde.
6. WHEN um membro acumular uma sequência de acertos de resultado (cheio + resultado) ao longo de jogos consecutivos (cross-rodada), THE Destaque_Generator_Service SHALL gerar um destaque do tipo SEQUENCIA_RESULTADO. O sistema deve consultar até 3 rodadas/fases anteriores para verificar o início da sequência. O destaque inclui a quantidade de acertos consecutivos, os dados dos últimos 5 jogos, o recorde atual do grupo e os detentores. Grava recordes.
7. WHEN um membro não registrar palpite para nenhum jogo de uma rodada que teve pelo menos 1 jogo finalizado, THE Destaque_Generator_Service SHALL gerar um único destaque do tipo NAO_PALPITOU consolidado por rodada, contendo a lista de jogos que o membro esqueceu e o total de jogos da rodada.
8. WHEN um membro usar palpite dobrado e acertar o resultado, THE Destaque_Generator_Service SHALL gerar um destaque do tipo DOBROU_E_ACERTOU com o placar do jogo, os times e a pontuação dobrada obtida.
9. THE Destaque_Generator_Service SHALL executar após o cálculo de pontuação e atualização do ranking, de forma fire-and-forget (sem bloquear o fluxo principal de finalização), seguindo o padrão existente de JogoService.dispararNotificacoesJogoFinalizado.
10. IF a geração de destaque falhar para um membro individual, THEN THE Destaque_Generator_Service SHALL registrar o erro em log e continuar a geração para os demais membros do grupo sem interromper o processo.
11. THE Destaque_Generator_Service SHALL garantir deduplicação por combinação de grupoId, usuarioId, jogoId e tipo, de modo que executar a geração mais de uma vez para o mesmo jogo não crie destaques duplicados.
12. WHEN um membro atender a múltiplos critérios de destaque no mesmo jogo (por exemplo, ACERTOU_EM_CHEIO e SUBIU_RANKING e SEQUENCIA_MOSCA), THE Destaque_Generator_Service SHALL gerar um destaque separado para cada tipo atendido, respeitando a regra de prioridade UNICO_NA_MOSCA > ACERTOU_EM_CHEIO.
13. WHEN um membro igualar ou superar o recorde do grupo em qualquer categoria de sequência, THE Destaque_Generator_Service SHALL atualizar o registro de recorde persistido com o novo valor e o(s) detentor(es).
14. WHEN dois ou mais membros empatarem no recorde de sequência, THE Sistema SHALL manter ambos como detentores do recorde simultaneamente.
15. WHEN o Destaque_Generator_Service gerar um destaque, THE Sistema SHALL sortear um título aleatório da lista de títulos configurados para o tipo do destaque, garantindo que não repita o título imediatamente anterior do mesmo tipo na mesma batch de geração (pickRandomTitle com exclusão do último usado). O título selecionado é persistido no campo `titulo` do destaque.
16. KNOWN LIMITATION: Se 2 jogos da mesma rodada finalizarem simultaneamente e o mesmo membro cravar ambos, a sequência pode ser calculada como 1 em vez de 2 na primeira execução. Na próxima finalização, a sequência se autocorrige. Risco aceitável dado que a sincronização é serial.

### Requisito 3: Listagem de Destaques do Grupo

**User Destaque:** Como membro do grupo, eu quero consultar os destaques recentes do grupo, para que o frontend exiba o carrossel de avatares e o visualizador.

#### Critérios de Aceitação

1. WHEN um membro autenticado requisitar os destaques do grupo via GET /grupos/:grupoId/destaques, THE Sistema SHALL retornar entre 5 e 20 destaques da rodada atual e da rodada anterior (complementando com rodada anterior se rodada atual tiver menos de 5), ordenados por data de criação decrescente, incluindo para cada destaque: id, tipo, titulo, dados, jogoId, rodada, criadoEm, contadorFs, jaEnviouF, visualizado (booleano), e dados do autor (usuarioId, nome, avatar).
2. WHEN não houver destaques na rodada atual nem na anterior, THE Sistema SHALL retornar uma lista vazia.
3. IF um usuário autenticado que não é membro do grupo (nem ADMIN nem MEMBER) requisitar os destaques, THEN THE Sistema SHALL rejeitar a requisição com erro de acesso negado.
4. THE Sistema SHALL restringir o acesso ao endpoint exclusivamente a membros do grupo com role ADMIN ou MEMBER, utilizando GroupRoleGuard.
5. THE Sistema SHALL determinar "rodada atual" como a menor rodada com jogos não finalizados na fase; "rodada anterior" é rodada atual - 1.
6. WHEN o frontend da Home precisar exibir destaques, THE Sistema SHALL reusar o endpoint GET /grupos/:grupoFavoritoId/destaques, onde o grupoFavoritoId é determinado pelo frontend a partir dos dados do usuário (não há endpoint separado de Home).
7. THE Sistema SHALL retornar os destaques como lista cronológica (não agrupados por membro), com dados do autor em cada item, para que o frontend navegue como timeline do grupo. Dentro da mesma rodada e timestamp próximo, a ordenação de desempate é por prioridade de tipo: UNICO_NA_MOSCA (1), NAO_PALPITOU (2), SEQUENCIA_MOSCA (3), SEQUENCIA_RESULTADO (4), ACERTOU_EM_CHEIO (5), SUBIU_RANKING (6), DOBROU_E_ACERTOU (7). A prioridade não é persistida — é derivada do tipo na query via CASE.

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

### Requisito 5: Carrossel de Avatares (Frontend)

**User Destaque:** Como membro do grupo, eu quero ver uma faixa de avatares na tela do grupo indicando quem tem destaques, para que eu saiba rapidamente que há novidades.

#### Critérios de Aceitação

1. THE Destaque_Carousel SHALL ser posicionado na tela do grupo entre as abas (Dashboard/Classificação/Meus Palpites) e o card "Próximo Jogo".
2. THE Destaque_Carousel SHALL exibir avatares circulares dos membros que possuem destaques na rodada atual ou anterior, com scroll horizontal.
3. THE Destaque_Carousel SHALL ordenar avatares: primeiro os que possuem destaques não-visualizados (borda colorida/gradiente), depois os já-vistos (borda cinza/opaca). Dentro de cada grupo, ordenar por data do destaque mais recente.
4. WHEN o membro tocar em um avatar do carrossel, THE Sistema SHALL abrir o Destaque_Viewer iniciando no primeiro destaque não-visualizado daquele membro na timeline cronológica (ou no mais recente se todos já foram vistos).
5. WHILE não houver destaques disponíveis, THE Destaque_Carousel SHALL permanecer oculto (não ocupar espaço na tela).
6. THE Destaque_Carousel SHALL exibir no máximo o avatar de cada membro uma vez, independentemente da quantidade de destaques do membro.
7. THE Destaque_Carousel SHALL exibir sobre cada avatar um ícone indicador correspondente ao tipo do destaque mais recente do membro (conforme Destaque_Type).
8. WHILE os dados de destaques estiverem sendo carregados, THE Destaque_Carousel SHALL permanecer oculto até que a resposta da API seja recebida.
9. IF a requisição de destaques falhar, THEN THE Destaque_Carousel SHALL permanecer oculto sem exibir mensagem de erro ao membro.
10. THE Destaque_Carousel SHALL ser exibido na Home do usuário usando os destaques do grupo favorito, com aviso textual: "Grupo favorito: [Nome]. Para ver outros, acesse o grupo desejado."

### Requisito 6: Visualizador de Destaques (Frontend)

**User Destaque:** Como membro do grupo, eu quero consumir os acontecimentos recentes do grupo em tela cheia com navegação cronológica, para ter uma experiência rápida e imersiva.

#### Critérios de Aceitação

1. WHEN o Destaque_Viewer for aberto, THE Sistema SHALL exibir os destaques como uma timeline cronológica dos acontecimentos do grupo (não filtrada por membro). O avatar do autor muda conforme cada destaque é exibido.
2. THE Destaque_Viewer SHALL exibir cada destaque em modo overlay tela cheia com: barra de progresso segmentada animada no topo, avatar do autor atual, ícone representativo do Destaque_Type, título randomizado, dados contextuais do jogo (times, placar, rodada) e tempo relativo no formato "há X minutos" (1–59 min), "há X horas" (1–47 h) ou "há X dias" (1–2 dias).
3. THE Destaque_Viewer SHALL permitir navegação por swipe horizontal (esquerda para próximo, direita para anterior) e por tap (toque na metade direita da tela para próximo, toque na metade esquerda da tela para anterior). Toques em botões interativos (ex: "Mandar F") NÃO devem ativar a navegação (stopPropagation).
4. THE Destaque_Viewer SHALL exibir um botão de fechar no canto superior direito E suportar swipe-down para fechar (gesto de dispensar modal).
5. THE Destaque_Viewer SHALL implementar auto-advance com timer variável por tipo: NAO_PALPITOU e ACERTOU_EM_CHEIO: 5s; UNICO_NA_MOSCA e DOBROU_E_ACERTOU: 6s; SEQUENCIA_MOSCA e SEQUENCIA_RESULTADO: 7s; SUBIU_RANKING: 8s. O timer pausa se o membro interagir.
6. THE Destaque_Viewer SHALL exibir a barra de progresso com segmentos de largura igual que preenchem gradualmente ao longo do tempo de exibição configurado por tipo. O segmento ativo preenche com animação linear; segmentos anteriores ficam cheios; segmentos posteriores ficam vazios.
7. WHEN o membro tocar e segurar (long press) no destaque, THE Destaque_Viewer SHALL pausar o timer de auto-advance e a animação da barra de progresso. Ao soltar, retoma.
8. WHEN o destaque exibido for do tipo NAO_PALPITOU, THE Destaque_Viewer SHALL exibir o botão "Mandar um F" com o contador de Fs recebidos pelo destaque.
9. WHEN o membro tocar em "Mandar um F" e a requisição for processada com sucesso, THE Destaque_Viewer SHALL substituir o botão por "Você já mandou um F" com ícone de confirmação e atualizar o contador de Fs.
10. IF a requisição de "Mandar um F" falhar, THEN THE Destaque_Viewer SHALL manter o botão "Mandar um F" no estado original e exibir uma mensagem de erro indicando que a ação não pôde ser concluída.
11. THE Destaque_Viewer SHALL garantir uma amostragem de no mínimo 5 e no máximo 20 destaques. Se a rodada atual tiver menos de 5, complementar com destaques da rodada anterior.
12. WHEN o viewer atingir o último destaque da amostragem, THE Destaque_Viewer SHALL exibir um indicador visual de "fim" e permitir que o membro feche manualmente (botão X, swipe-down ou tap). NÃO fechar automaticamente.
13. WHEN um destaque for exibido no viewer, THE Sistema SHALL registrar a visualização. Ao fechar o viewer, o frontend envia em batch: POST /grupos/:grupoId/destaques/visualizar com body { destaqueIds: string[] }.
14. WHEN o membro tentar navegar antes do primeiro destaque, THE Destaque_Viewer SHALL permanecer no destaque atual sem executar nenhuma ação.

### Requisito 7: Layout Específico por Tipo de Destaque

**User Destaque:** Como membro do grupo, eu quero que cada tipo de destaque tenha um layout visual distinto, para que eu identifique rapidamente o tipo de destaque.

#### Critérios de Aceitação

1. WHEN o destaque for do tipo ACERTOU_EM_CHEIO, THE Destaque_Viewer SHALL exibir: avatar do autor, título randomizado, placar do jogo no formato "X × Y", escudos dos times (imagem do campo `escudo`), nomes dos times e ícone 🎯 como indicador visual do tipo.
2. WHEN o destaque for do tipo UNICO_NA_MOSCA, THE Destaque_Viewer SHALL exibir: avatar do autor, título randomizado, texto destacando que foi o único a cravar o placar, nomes dos times com placar, rodada do jogo e ícone 🦄 como indicador visual do tipo.
3. WHEN o destaque for do tipo SUBIU_RANKING, THE Destaque_Viewer SHALL exibir: avatar do autor, título randomizado, posição anterior e nova posição com destaque visual na diferença, lista do Top 5 do grupo (posição, nome e pontuação) e ícone 📈 como indicador visual do tipo.
4. WHEN o destaque for do tipo SEQUENCIA_MOSCA, THE Destaque_Viewer SHALL exibir: avatar do autor, título randomizado, quantidade de acertos na mosca na rodada, linha visual representando os últimos 5 jogos com indicadores de acerto em cheio (🎯) e erro (❌), nomes dos times de cada jogo na sequência, recorde atual do grupo com nome(s) do(s) detentor(es) e ícone 🔥 como indicador visual do tipo.
5. WHEN o destaque for do tipo SEQUENCIA_RESULTADO, THE Destaque_Viewer SHALL exibir: avatar do autor, título randomizado, quantidade de acertos consecutivos cross-rodada, linha visual representando os últimos 5 jogos com indicadores de acerto (✅) e erro (❌), nomes dos times de cada jogo, recorde atual do grupo com nome(s) do(s) detentor(es) e ícone 🔥 como indicador visual do tipo.
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
