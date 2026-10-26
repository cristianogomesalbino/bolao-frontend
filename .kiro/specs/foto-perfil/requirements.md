# Requirements Document

## Introduction

Foto de perfil do usuário do Bolão. O arquivo fica num bucket público do Supabase Storage; o backend grava a URL em `fotoUrl`. A imagem substitui as iniciais nas telas que já identificam uma pessoa por iniciais. Sem foto, o restante do app continua utilizável; o ranking geral e o ranking por fase ficam bloqueados.

O login é JWT do Nest, não o Auth do Supabase. O browser não envia arquivo direto ao Storage. O upload, a troca e a remoção passam pela API autenticada.

Quem já usa o app vê o convite na primeira abertura depois desta versão. Usuário novo vê na primeira abertura. Recusar o convite inicial grava `Convite_Dispensado` neste dispositivo e não repete esse convite; recusar o modal de liberação do ranking só fecha o modal. O ranking continua fechado até existir `fotoUrl`.

## Glossary

- **Foto_Url**: URL pública da foto do usuário, ou `null`. Coluna `fotoUrl` em `Usuario`.
- **Avatar**: Componente que mostra a foto em círculo ou, sem foto ou se a imagem falhar, as iniciais do nome.
- **Modal_Inclusao**: Modal da primeira abertura para escolher, pré-visualizar e enviar a foto.
- **Modal_Aviso**: Modal exibido só depois da recusa do Modal_Inclusao, avisando que o ranking fica restrito.
- **Modal_Liberar**: Modal reaberto ao tentar acessar o ranking sem foto, com o texto "Adicione uma foto para liberar esta funcionalidade". Não é o convite inicial.
- **Convite_Dispensado**: Flag local (`localStorage`, por `usuarioId` neste dispositivo) gravada apenas quando o usuário confirma o Modal_Aviso ("Entendi") após recusar o Modal_Inclusao. Não libera o ranking. Recusar o Modal_Liberar não grava nem altera esta flag.
- **Ranking_Bloqueado**: Estado em que o usuário autenticado não tem Foto_Url. Aba Ranking, rota `/ranking` e card da copa não mostram posições.
- **Codigo_Ranking_Exige_Foto**: Identificador estável `RANKING_EXIGE_FOTO` no corpo do 403 das rotas de ranking geral e por fase. A UI não trata qualquer 403 como Ranking_Bloqueado (já existem 403 de papel no grupo).
- **Backend_API**: NestJS. Único escritor do bucket, com a service role.

## Conflicts resolved against the original spec

- `PATCH /usuarios/:id` com campo extra responde **400**, não 422: o `ValidationPipe` global usa `BadRequestException`.
- `PalpitePresenter` e `GET /grupos/:grupoId/jogos/:jogoId/palpites` **não** passam a incluir `fotoUrl`: hoje não devolvem `nomeUsuario`. Listas de palpites com iniciais usam `GET /grupos/:grupoId/ranking/jogos/:jogoId` (`PontuacaoJogoPresenter`).
- Não há tela de destaques no frontend. A API de destaques já expõe `autor.avatar` (hoje `null`); esta versão preenche esse campo e **não** cria tela nova.
- `secao-palpites-grupo` mostra só o primeiro nome, sem círculo: fica fora da lista de avatares.
- Erro de ranking bloqueado inclui `codigo`, não só HTTP 403 e mensagem, para não colidir com outros 403.

## Requirements

### Requirement 1: Enviar, trocar e validar a foto

**User Story:** Como usuário, eu quero colocar uma foto no perfil, para que as outras pessoas me reconheçam no bolão.

#### Acceptance Criteria

1. THE Backend_API SHALL aceitar `POST /usuarios/me/foto` autenticado, `multipart/form-data`, campo `foto`, e responder com o usuário via `UsuarioPresenter`, incluindo Foto_Url.
2. THE Backend_API SHALL aplicar o limite de 5 MB **durante o recebimento** do multipart (antes de processar ou enviar ao Storage). Arquivo maior SHALL ser recusado; Foto_Url no banco SHALL permanecer inalterada.
3. THE Backend_API SHALL aceitar apenas JPEG, PNG e WebP, identificados pelo conteúdo do arquivo (magic bytes), não só pelo `Content-Type` ou extensão. THE Backend_API SHALL recusar SVG e qualquer outro tipo, inclusive SVG disfarçado de imagem.
4. WHEN o arquivo é válido, THE Backend_API SHALL converter de forma segura para WebP quadrado 512 × 512 com recorte central (`cover`) e gravar esse objeto. THE Backend_API SHALL não executar conteúdo do arquivo (somente decodificar como bitmap e reencodar).
5. WHEN o envio tem sucesso, THE resposta SHALL ser o usuário atualizado. THE cliente SHALL atualizar o usuário autenticado, o Avatar e invalidar os caches listados no Requirement 6.
6. WHEN o usuário envia outra foto, THE Backend_API SHALL gravar o objeto novo no Storage, persistir a URL nova no banco e só então tentar apagar o objeto anterior. THE resposta SHALL conter a URL nova.
7. THE Backend_API SHALL rejeitar `fotoUrl` em `PATCH /usuarios/:id` com 400 (whitelist + `forbidNonWhitelisted`). Só `POST /usuarios/me/foto` define a URL. Admin SHALL não enviar nem remover a foto de outro usuário (não há rota de foto por `:id`).
8. THE tela Minha Conta SHALL manter nome e e-mail no formulário atual. A foto não entra nesse PATCH.
9. THE tela Minha Conta SHALL abrir o seletor nativo (galeria ou câmera), mostrar pré-visualização circular e só então enviar.
10. IF o arquivo for inválido (tipo, SVG, maior que 5 MB) OR a conversão falhar, THEN THE Backend_API SHALL responder 400 com mensagem em português, SHALL não alterar Foto_Url e SHALL não deixar objeto novo no Storage. THE cliente SHALL exibir a mensagem e manter a foto anterior (ou as iniciais).
11. IF a rede ou a API falhar no envio, THEN THE cliente SHALL exibir erro em português, SHALL não alterar o Avatar local e SHALL manter Foto_Url anterior.

### Requirement 2: Consistência entre Storage e banco

**User Story:** Como usuário, eu não quero ver uma foto quebrada nem perder a foto antiga se o envio falhar no meio.

#### Acceptance Criteria

1. THE Backend_API SHALL persistir Foto_Url no banco somente depois do upload do objeto novo ter sucesso. URL inválida (aponta para objeto inexistente) SHALL não ser gravada.
2. IF o upload do objeto novo falhar, THEN THE banco SHALL permanecer com a Foto_Url anterior (ou `null`) e SHALL não existir objeto novo a preservar.
3. IF o banco falhar depois do upload novo, THEN THE Backend_API SHALL apagar o objeto novo e SHALL não alterar a Foto_Url anterior. THE cliente SHALL receber erro em português.
4. IF apagar o objeto antigo falhar depois de o banco já apontar para a URL nova, THEN THE operação SHALL ser considerada sucesso para o usuário (URL nova válida). THE Backend_API SHALL registrar a falha para limpeza posterior. Arquivo órfão antigo é preferível a URL inválida.
5. WHEN `DELETE /usuarios/me/foto` é chamado, THE Backend_API SHALL zerar Foto_Url no banco e depois tentar apagar o objeto. IF o Storage falhar, THEN Foto_Url SHALL permanecer `null` (órfão, não URL quebrada) e a resposta ao cliente SHALL ser sucesso com o usuário sem foto.
6. WHEN a conta é desativada (`DELETE /usuarios/:id`), THE Backend_API SHALL zerar ou ignorar Foto_Url e tentar apagar o objeto se existir, com a mesma preferência: não deixar URL pública apontando para arquivo inexistente.

### Requirement 3: Remover a foto

**User Story:** Como usuário, eu quero poder tirar a foto do perfil, sabendo que o ranking volta a ficar bloqueado.

#### Acceptance Criteria

1. THE Backend_API SHALL aceitar `DELETE /usuarios/me/foto` autenticado. THE resposta SHALL ser o usuário via `UsuarioPresenter` com `fotoUrl: null`.
2. WHILE existe Foto_Url, THE tela Minha Conta SHALL oferecer "Remover foto".
3. WHEN o usuário confirma a remoção, THE app SHALL avisar antes que o ranking volta a ficar bloqueado.
4. WHEN a remoção tem sucesso, THE cliente SHALL atualizar o usuário autenticado, o Avatar (iniciais), invalidar os caches do Requirement 6 e aplicar Ranking_Bloqueado de novo.
5. IF a rede falhar na remoção, THEN THE cliente SHALL manter a foto visível e exibir erro em português.

### Requirement 4: Convite na primeira abertura

**User Story:** Como usuário sem foto, eu quero ser convidado a adicionar a foto na primeira vez que abro o app, para saber que ela passou a existir.

#### Acceptance Criteria

1. WHEN o usuário autenticado não tem Foto_Url AND Convite_Dispensado é falso, THE app SHALL abrir o Modal_Inclusao na primeira tela protegida, inclusive se essa tela for `/ranking`. Vale para usuário novo e para o primeiro acesso desta versão por quem já usava o app.
2. WHEN o usuário toca em "Adicionar foto" no Modal_Inclusao e o envio termina com sucesso, THE app SHALL fechar o modal, atualizar o estado (Requirement 6) e liberar o ranking. THE app SHALL não gravar Convite_Dispensado nesse caminho.
3. WHEN o usuário toca em "Agora não" no Modal_Inclusao, THE app SHALL abrir o Modal_Aviso informando que, sem foto, o acesso ao ranking fica restrito, com o botão "Entendi". THE app SHALL ainda não gravar Convite_Dispensado.
4. WHEN o usuário toca em "Entendi" no Modal_Aviso, THE app SHALL gravar Convite_Dispensado para aquele `usuarioId` neste dispositivo, fechar os modais e deixar o restante do app utilizável (exceto o ranking).
5. WHEN Convite_Dispensado já é verdadeiro, THE app SHALL não repetir o Modal_Inclusao nem o Modal_Aviso na abertura.
6. THE Modal_Aviso SHALL aparecer só nessa recusa inicial, não ao recusar o Modal_Liberar nem a cada tentativa de abrir o ranking.

### Requirement 5: Ranking exige foto

**User Story:** Como usuário que recusou a foto, eu quero ser avisado ao tocar no ranking e poder adicionar a foto para liberar a funcionalidade.

#### Acceptance Criteria

1. WHILE Foto_Url é `null`, THE app SHALL impedir a aba Ranking, a rota `/ranking` (link direto incluso) e o card de ranking da copa de mostrar posições. THE app SHALL não tratar a ausência de foto como erro genérico de carregamento.
2. WHEN Convite_Dispensado é verdadeiro AND o usuário toca numa dessas entradas sem Foto_Url, THE app SHALL abrir o Modal_Liberar com o texto "Adicione uma foto para liberar esta funcionalidade" e as ações "Adicionar foto" e "Agora não".
3. WHEN o usuário toca em "Agora não" no Modal_Liberar, THE app SHALL apenas fechar o modal, SHALL permanecer fora do ranking e SHALL **não** gravar nem alterar Convite_Dispensado. THE app SHALL **não** abrir o Modal_Aviso.
4. WHEN o envio da foto tem sucesso a partir do Modal_Liberar, THE app SHALL fechar o modal, atualizar o estado (Requirement 6) e liberar aba, rota e card da copa.
5. THE Backend_API SHALL responder **403** em `GET /grupos/:grupoId/ranking/geral` e `GET /grupos/:grupoId/ranking/fases/:faseId` se o autenticado não tem Foto_Url. O corpo SHALL seguir o formato de erros da API (`erros[]`) e incluir `codigo: "RANKING_EXIGE_FOTO"` e mensagem em português.
6. THE Backend_API SHALL manter liberado `GET /grupos/:grupoId/ranking/jogos/:jogoId` (detalhe do jogo / palpites dos membros), mesmo sem Foto_Url.
7. WHEN a UI recebe 403 **com** Codigo_Ranking_Exige_Foto, THE app SHALL tratar como Ranking_Bloqueado (Modal_Liberar se o convite já foi dispensado) e SHALL não exibir tela de erro genérica. WHEN a UI recebe outro 403, THE app SHALL **não** interpretá-lo como falta de foto.
8. WHILE Foto_Url é `null`, THE app SHALL manter palpites, membros e detalhe de jogo utilizáveis.
9. WHEN o autenticado tem Foto_Url, THE ranking geral e o ranking por fase SHALL incluir `fotoUrl` ao lado de `nomeUsuario` em cada entrada.

### Requirement 6: Estado do cliente após adicionar ou remover a foto

**User Story:** Como usuário, eu quero ver a foto nova (ou as iniciais) na hora, sem recarregar o app.

#### Acceptance Criteria

1. WHEN `POST /usuarios/me/foto` ou `DELETE /usuarios/me/foto` retorna sucesso, THE app SHALL mesclar o usuário da resposta na store de autenticação (`atualizarUsuario`).
2. THE app SHALL atualizar o Avatar em Minha Conta de imediato com a Foto_Url nova ou com iniciais se `null`.
3. THE app SHALL invalidar as queries que mostram outras pessoas ou o próprio ranking: perfil (`['usuario', 'perfil']`), ranking da página, ranking do grupo/copa, membros do grupo e detalhamento de jogo (`ranking/jogos`). THE app SHALL não invalidar endpoints que não incluem Foto_Url (Requirement 8).
4. THE chamada de envio SHALL usar o `apiClient` existente **sem** forçar `Content-Type: application/json` no multipart.

### Requirement 7: Onde a foto aparece e quais payloads mudam

**User Story:** Como participante, eu quero ver a foto de cada pessoa nos mesmos lugares em que hoje vejo as iniciais.

#### Acceptance Criteria

1. THE Avatar SHALL ser o único componente de iniciais ou foto, com `nome`, Foto_Url e tamanho, e `alt` igual ao nome.
2. THE Backend_API SHALL incluir `fotoUrl: string | null` **somente** nestes payloads:
   - `UsuarioPresenter`: `GET /usuarios/me`, `GET /usuarios/:id`, `POST /usuarios`, `PATCH /usuarios/:id`, `PATCH /usuarios/me/grupo-favorito`, `POST /usuarios/me/foto`, `DELETE /usuarios/me/foto`
   - `GET /grupos/:grupoId/membros`: objeto `usuario` (hoje `id` e `nome`; acrescentar `fotoUrl`)
   - `RankingPresenter`: `GET /grupos/:grupoId/ranking/geral` e `GET /grupos/:grupoId/ranking/fases/:faseId`
   - `PontuacaoJogoPresenter`: `GET /grupos/:grupoId/ranking/jogos/:jogoId` (fonte das listas de palpites com iniciais)
   - listagem de destaques: campo já existente `autor.avatar`, preenchido com Foto_Url ou `null` (hoje está hardcoded `null`)
3. THE telas que hoje mostram iniciais SHALL passar a usar o Avatar:
   - Minha Conta
   - `card-ranking` (página `/ranking` e dashboard da copa)
   - membros do grupo
   - lista de membros em configurações do grupo
   - `lista-palpites-membros` (usada no card de jogo e no próximo jogo da copa)
4. THE app SHALL continuar usando ícone genérico na aba Conta e nos headers de seção.
5. IF a imagem falhar ao carregar no Avatar, THEN THE Avatar SHALL mostrar as iniciais.

### Requirement 8: Fora desta versão

**User Story:** Como time, eu quero que esta entrega não abra escopo extra.

#### Acceptance Criteria

1. THE app SHALL **não** incluir `fotoUrl` em `PalpitePresenter`, `GET /grupos/:grupoId/jogos/:jogoId/palpites`, estatísticas de palpite, listagem de grupos, notificações nem outros endpoints que hoje não identificam a pessoa por nome+iniciais.
2. THE app SHALL **não** implementar foto, descrição ou upload de grupo; o grupo segue com emoji em `icone`.
3. THE app SHALL **não** implementar login social, avatar de provedor, editor de corte, várias fotos, galeria nem moderação de conteúdo.
4. THE app SHALL **não** criar tela de destaques nesta versão. Preencher `autor.avatar` na API não implica UI nova.

### Requirement 9: Testes obrigatórios

**User Story:** Como time, eu quero cobrir falhas reais, não só o caminho feliz.

#### Acceptance Criteria

1. THE testes SHALL cobrir upload inválido: arquivo maior que 5 MB no recebimento, SVG, tipo que não é JPEG/PNG/WebP, e magic bytes que não batem com a extensão. Nestes casos Foto_Url SHALL permanecer inalterada e nenhum objeto novo SHALL permanecer no Storage.
2. THE testes SHALL cobrir falha de Storage no upload (objeto novo não sobe) e falha de banco depois do upload novo (objeto novo é apagado; Foto_Url anterior permanece).
3. THE testes SHALL cobrir substituição: URL nova válida, objeto antigo removido ou, se a remoção antiga falhar, URL nova mesmo assim válida.
4. THE testes SHALL cobrir `DELETE /usuarios/me/foto`: banco com `fotoUrl` nulo; objeto removido ou órfão se o Storage falhar; ranking volta a exigir foto.
5. THE testes SHALL cobrir 403 com `RANKING_EXIGE_FOTO` em ranking geral e por fase sem foto, e 200 em `GET .../ranking/jogos/:jogoId` sem foto.
6. THE testes de cliente SHALL cobrir: falha de carregamento da imagem (iniciais); falha de rede no POST e no DELETE (estado anterior preservado); navegação direta para `/ranking` sem foto (sem posições; Modal_Inclusao se o convite não foi dispensado, Modal_Liberar se foi); recusa do Modal_Liberar sem gravar Convite_Dispensado; tentativa de ler ranking geral/fase pela API sem foto.
