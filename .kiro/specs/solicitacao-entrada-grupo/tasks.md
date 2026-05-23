# Implementation Plan: Solicitação de Entrada em Grupo

## Overview

Implementação full-stack da funcionalidade de solicitação de entrada em grupos públicos com aprovação do administrador. O plano segue a ordem: backend (banco, services, controllers) → frontend (tipos, services, componentes) → modificações em páginas existentes → testes.

## Tasks

- [ ] 1. Backend - Modelo de dados e migração
  - [ ] 1.1 Criar model Solicitacao no schema Prisma
    - Adicionar enum `StatusSolicitacao` (PENDENTE, APROVADA, REJEITADA)
    - Adicionar model `Solicitacao` com campos: id, usuarioId, grupoId, status, dataCriacao, dataResposta
    - Configurar relations com Usuario e Grupo (onDelete: Cascade)
    - Adicionar índices: `[grupoId, status]` e `[usuarioId]`
    - Mapear para tabela `solicitacoes`
    - Gerar e executar migração Prisma
    - _Requirements: 2.1, 3.1, 7.1_

- [ ] 2. Backend - Service de Solicitações
  - [ ] 2.1 Implementar `SolicitacoesService`
    - Criar arquivo `solicitacoes.service.ts` no módulo de grupos
    - Implementar `buscarGruposPublicos(busca, usuarioId)`: filtrar por `privado=false`, `nome ILIKE`, excluir grupos onde usuário já é membro, incluir `minhaSolicitacao` do usuário, limitar a 20 resultados, ordenar por nome ASC
    - Implementar `criarSolicitacao(grupoId, usuarioId)`: validar grupo público, validar não é membro, validar não existe PENDENTE, criar com status PENDENTE
    - Implementar `listarSolicitacoesPendentes(grupoId)`: filtrar por status PENDENTE, incluir dados do usuário, ordenar por dataCriacao ASC
    - Implementar `responderSolicitacao(solicitacaoId, status, adminId)`: atualizar status e dataResposta; se APROVADA, verificar maxParticipantes e criar registro em membros_grupo com role MEMBER
    - Implementar `listarMinhasSolicitacoes(usuarioId)`: retornar todas as solicitações do usuário com dados do grupo, ordenar por dataCriacao DESC
    - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.3, 4.1, 4.2, 4.3, 5.2, 5.3, 7.1, 7.2_

- [ ] 3. Backend - Controller de Solicitações
  - [ ] 3.1 Implementar `SolicitacoesController`
    - Criar arquivo `solicitacoes.controller.ts`
    - Implementar `GET /grupos/publicos?busca=termo` com validação de min 3 caracteres
    - Implementar `POST /grupos/:grupoId/solicitacoes` com AuthGuard
    - Implementar `GET /grupos/:grupoId/solicitacoes` com AuthGuard + verificação de role ADMIN
    - Implementar `PATCH /grupos/:grupoId/solicitacoes/:solicitacaoId` com AuthGuard + verificação de role ADMIN, body `{ status: 'APROVADA' | 'REJEITADA' }`
    - Implementar `GET /solicitacoes/minhas` com AuthGuard
    - Registrar controller e service no módulo
    - _Requirements: 1.2, 2.2, 3.1, 4.1, 5.2, 7.1_

  - [ ] 3.2 Ajustar endpoint `GET /grupos/:grupoId` para não-membros
    - Verificar se o usuário autenticado é membro do grupo
    - Se NÃO é membro: retornar dados limitados (id, nome, privado, totalParticipantes, maxParticipantes, ehMembro: false, minhaSolicitacao)
    - Se é membro: manter comportamento atual
    - _Requirements: 1.4, 2.4_

- [ ] 4. Checkpoint - Backend completo
  - Garantir que todos os endpoints estão funcionando corretamente
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Frontend - Tipos TypeScript
  - [ ] 5.1 Criar arquivo `src/types/solicitacao.types.ts`
    - Definir type `StatusSolicitacao = 'PENDENTE' | 'APROVADA' | 'REJEITADA'`
    - Definir interface `Solicitacao` com campos: id, usuarioId, grupoId, status, dataCriacao, dataResposta, usuario?
    - Definir interface `SolicitacaoComGrupo` estendendo Solicitacao com campo grupo (id, nome, totalParticipantes)
    - Definir interface `GrupoPublico` com campos: id, nome, totalParticipantes, maxParticipantes, privado, minhaSolicitacao?
    - Definir interface `GrupoDetalheLimitado` com campos: id, nome, privado, totalParticipantes, maxParticipantes, ehMembro, minhaSolicitacao?
    - Exportar no `src/types/index.ts`
    - _Requirements: 1.3, 2.4, 3.3, 7.2_

- [ ] 6. Frontend - Service de Solicitações
  - [ ] 6.1 Criar arquivo `src/services/solicitacao.service.ts`
    - Implementar `buscarGruposPublicos(busca: string): Promise<GrupoPublico[]>` - GET /grupos/publicos?busca=
    - Implementar `criarSolicitacao(grupoId: string): Promise<Solicitacao>` - POST /grupos/:grupoId/solicitacoes
    - Implementar `listarSolicitacoesPendentes(grupoId: string): Promise<Solicitacao[]>` - GET /grupos/:grupoId/solicitacoes
    - Implementar `responderSolicitacao(grupoId, solicitacaoId, status): Promise<Solicitacao>` - PATCH /grupos/:grupoId/solicitacoes/:solicitacaoId
    - Implementar `listarMinhasSolicitacoes(): Promise<SolicitacaoComGrupo[]>` - GET /solicitacoes/minhas
    - Exportar no `src/services/index.ts`
    - _Requirements: 1.2, 2.2, 3.1, 4.1, 5.2, 7.1_

- [ ] 7. Frontend - Componente CardGrupoPesquisa
  - [ ] 7.1 Criar `src/components/grupo/card-grupo-pesquisa.tsx`
    - Receber props: `grupo: GrupoPublico`
    - Exibir nome do grupo, quantidade de participantes (totalParticipantes), indicador de grupo público (ícone Globe)
    - Renderizar botão baseado no estado de `minhaSolicitacao`:
      - null → "Solicitar Entrada" (habilitado)
      - status PENDENTE → "Solicitação Enviada" (desabilitado)
      - status REJEITADA → "Solicitar Novamente" (habilitado)
    - Ao clicar no botão, chamar `criarSolicitacao` via mutation do React Query
    - Exibir loading state durante envio
    - Exibir mensagem de sucesso após confirmação
    - Exibir mensagem de erro se falhar (manter botão habilitado)
    - Invalidar queries `['grupos-publicos']` e `['minhas-solicitacoes']` após sucesso
    - Adicionar `data-testid` nos elementos interativos
    - _Requirements: 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 7.2 Escrever teste de propriedade para CardGrupoPesquisa
    - **Property 2: GrupoPublico card displays all required information**
    - **Property 4: Button state is determined by solicitacao status**
    - **Validates: Requirements 1.3, 2.1, 2.4, 2.6, 7.3**

- [ ] 8. Frontend - Componente SecaoPesquisaGrupos
  - [ ] 8.1 Criar `src/components/grupo/secao-pesquisa-grupos.tsx`
    - Input de busca com validação mínima de 3 caracteres (usar schema Zod `schemaBuscaGrupos`)
    - Debounce de 300ms no input antes de disparar busca
    - Usar React Query com key `['grupos-publicos', busca]` para buscar resultados
    - Renderizar lista de `CardGrupoPesquisa` com os resultados
    - Exibir mensagem "Nenhum grupo encontrado" quando busca retornar vazio
    - Exibir estado de loading durante a busca
    - Adicionar `data-testid` nos elementos
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ]* 8.2 Escrever teste de propriedade para filtragem de busca
    - **Property 1: Search filtering returns only matching results**
    - **Validates: Requirements 1.2**

- [ ] 9. Frontend - Componente SecaoSolicitacoesPendentes
  - [ ] 9.1 Criar `src/components/grupo/card-solicitacao.tsx`
    - Receber props: `solicitacao: Solicitacao`, `grupoId: string`
    - Exibir nome do solicitante, email e data de envio formatada
    - Botão "Aprovar" que chama `responderSolicitacao` com status APROVADA
    - Botão "Rejeitar" que abre modal de confirmação antes de chamar `responderSolicitacao` com status REJEITADA
    - Exibir loading state nos botões durante processamento
    - Exibir mensagens de erro específicas (grupo cheio, erro genérico)
    - Invalidar queries `['grupo', grupoId, 'solicitacoes']` e `['grupo', grupoId, 'membros']` após sucesso
    - Adicionar `data-testid` nos elementos
    - _Requirements: 3.3, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4_

  - [ ] 9.2 Criar `src/components/grupo/secao-solicitacoes-pendentes.tsx`
    - Receber props: `grupoId: string`
    - Usar React Query com key `['grupo', grupoId, 'solicitacoes']` para buscar solicitações pendentes
    - Exibir título "Solicitações Pendentes" com badge numérico da contagem
    - Renderizar lista de `CardSolicitacao` para cada solicitação
    - Exibir mensagem "Não há solicitações no momento" quando lista vazia
    - Adicionar `data-testid` nos elementos
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 9.3 Escrever testes de propriedade para SecaoSolicitacoesPendentes
    - **Property 5: Pending solicitacoes count matches data length**
    - **Property 6: Solicitacao pendente card displays required user information**
    - **Validates: Requirements 3.1, 3.3**

- [ ] 10. Frontend - Componente SecaoMinhasSolicitacoes
  - [ ] 10.1 Criar `src/components/grupo/secao-minhas-solicitacoes.tsx`
    - Usar React Query com key `['minhas-solicitacoes']` para buscar solicitações do usuário
    - Exibir cada solicitação com: nome do grupo, data de envio, status atual (PENDENTE, APROVADA, REJEITADA)
    - Para status REJEITADA: exibir botão "Solicitar Novamente" que cria nova solicitação
    - Ao clicar "Solicitar Novamente": chamar `criarSolicitacao`, invalidar `['minhas-solicitacoes']`
    - Exibir loading e feedback de erro/sucesso
    - Adicionar `data-testid` nos elementos
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 10.2 Escrever teste de propriedade para SecaoMinhasSolicitacoes
    - **Property 7: Minhas solicitações displays complete information per item**
    - **Validates: Requirements 7.1, 7.2**

- [ ] 11. Frontend - Componente PreviewGrupoNaoMembro
  - [ ] 11.1 Criar `src/components/grupo/preview-grupo-nao-membro.tsx`
    - Receber props: `grupo: GrupoDetalheLimitado`
    - Exibir dados limitados: nome, indicador público/privado, total de participantes, max participantes
    - NÃO exibir: ranking, atividade, membros, código de convite
    - Renderizar botão de solicitação baseado em `minhaSolicitacao` (mesma lógica do CardGrupoPesquisa)
    - Exibir loading, sucesso e erro no fluxo de solicitação
    - Adicionar `data-testid` nos elementos
    - _Requirements: 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 11.2 Escrever teste de propriedade para PreviewGrupoNaoMembro
    - **Property 3: Non-member view hides internal group details**
    - **Validates: Requirements 1.4**

- [ ] 12. Checkpoint - Componentes frontend completos
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Frontend - Modificações em páginas existentes
  - [ ] 13.1 Modificar página `/grupos` (page.tsx)
    - Adicionar `SecaoPesquisaGrupos` abaixo do header da página
    - Adicionar `SecaoMinhasSolicitacoes` como seção separada (abaixo de "Meus Grupos" ou em tab)
    - Manter funcionalidade existente intacta
    - _Requirements: 1.1, 6.3, 7.1_

  - [ ] 13.2 Modificar página `/grupos/[grupoId]` (page.tsx)
    - Verificar se o usuário é membro do grupo (campo `ehMembro` na resposta da API)
    - Se NÃO é membro: renderizar `PreviewGrupoNaoMembro` ao invés do conteúdo completo
    - Se é membro: manter comportamento atual
    - _Requirements: 1.4, 2.1, 6.1_

  - [ ] 13.3 Modificar página `/grupos/[grupoId]/configuracoes` (page.tsx)
    - Adicionar `SecaoSolicitacoesPendentes` antes da seção de membros (visível apenas para ADMIN)
    - Passar `grupoId` como prop
    - _Requirements: 3.1, 3.2_

- [ ] 14. Frontend - Validações Zod
  - [ ] 14.1 Adicionar schemas de validação em `src/lib/validacoes.ts`
    - Adicionar `schemaBuscaGrupos` com validação de min 3 caracteres
    - Adicionar `schemaRespostaSolicitacao` com enum ['APROVADA', 'REJEITADA']
    - _Requirements: 1.2, 4.1, 5.2_

- [ ] 15. Checkpoint - Integração completa
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 16. Testes unitários
  - [ ]* 16.1 Testes unitários para SecaoPesquisaGrupos
    - Testar renderização do input de busca
    - Testar estado vazio (nenhum resultado)
    - Testar exibição de resultados
    - Testar validação de mínimo 3 caracteres
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ]* 16.2 Testes unitários para CardGrupoPesquisa
    - Testar clique no botão "Solicitar Entrada" dispara API call
    - Testar feedback de sucesso após envio
    - Testar tratamento de erros (rede, 409, 400)
    - Testar estado desabilitado quando solicitação pendente
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 16.3 Testes unitários para SecaoSolicitacoesPendentes e CardSolicitacao
    - Testar renderização da lista de solicitações
    - Testar estado vazio
    - Testar modal de confirmação ao rejeitar
    - Testar remoção do item após aprovação/rejeição
    - Testar mensagem de erro "grupo cheio"
    - _Requirements: 3.1, 3.4, 4.2, 4.3, 5.1, 5.3_

  - [ ]* 16.4 Testes unitários para SecaoMinhasSolicitacoes
    - Testar renderização com diferentes status
    - Testar clique em "Solicitar Novamente"
    - _Requirements: 7.1, 7.3, 7.4_

  - [ ]* 16.5 Testes unitários para solicitacao.service.ts
    - Testar chamadas corretas ao apiClient para cada função
    - Testar parâmetros e URLs
    - _Requirements: 1.2, 2.2, 3.1, 4.1, 5.2, 7.1_

- [ ] 17. Final checkpoint - Todos os testes passando
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Testes de propriedade validam propriedades universais de correção definidas no design
- Testes unitários validam cenários específicos e edge cases
- O backend usa NestJS + Prisma + PostgreSQL
- O frontend usa Next.js + React Query + Tailwind CSS + Zod
- Seguir os padrões existentes do projeto (apiClient, tipos, services)
