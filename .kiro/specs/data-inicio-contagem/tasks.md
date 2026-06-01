# Implementation Plan: dataInicioContagem (Dropdown + Resolução)

## Overview

Implementação do campo `dataInicioContagem` no módulo de Grupos usando abordagem de dropdown com resolução automática. O admin seleciona uma rodada/fase em um dropdown, o backend resolve a `dataHora` do primeiro jogo dessa seleção e persiste como `dataInicioContagem` (DateTime nullable). A lógica de filtragem no ranking permanece a mesma (comparação por DateTime).

**Workspaces:**
- Backend: `/home/cristiano_albino/Documentos/Pessoais/Projeto/app-bolao/bolao-backend/`
- Frontend: `/home/cristiano_albino/Documentos/Pessoais/Projeto/app-bolao/bolao-frontend/`

## Tasks

- [ ] 1. Backend — Schema e Repository
  - [ ] 1.1 Adicionar campo `dataInicioContagem` ao Prisma schema e gerar migration
    - Adicionar `dataInicioContagem DateTime?` no model `Grupo` em `prisma/schema.prisma`
    - Executar `prisma migrate dev --name add_data_inicio_contagem`
    - _Requirements: 1.1_

  - [ ] 1.2 Atualizar interface `GrupoRepository` e implementações (Prisma + InMemory)
    - Adicionar `dataInicioContagem?: Date | null` no parâmetro `data` do método `criar`
    - Adicionar `dataInicioContagem?: Date | null` no tipo `Partial` do método `atualizar`
    - Atualizar `PrismaGrupoRepository` para incluir o campo nos métodos `criar`, `buscarPorId`, `buscarPorIdSimples` e `atualizar`
    - Atualizar `InMemoryGrupoRepository` com `dataInicioContagem: data.dataInicioContagem ?? null` na criação e spread no `atualizar`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 1.3 Escrever testes unitários para InMemoryGrupoRepository (campo dataInicioContagem)
    - Testar: criar sem `dataInicioContagem` → persiste null
    - Testar: atualizar com `dataInicioContagem: null` → substitui valor anterior
    - Testar: atualizar sem campo → mantém valor existente
    - _Requirements: 4.4, 4.5, 4.6_

- [ ] 2. Backend — InicioContagemService (resolução + opções)
  - [ ] 2.1 Criar `InicioContagemService` com método `resolver`
    - Criar arquivo `src/modules/grupos/services/inicio-contagem.service.ts`
    - Injetar `FaseRepository` e `JogoRepository`
    - Implementar método `resolver(selecao: InicioContagemDto): Promise<Date | null>`
    - Para tipo RODADA: buscar jogos da fase com rodada específica, retornar MIN(dataHora)
    - Para tipo FASE: buscar todos os jogos da fase, retornar MIN(dataHora)
    - Retornar null se não houver jogos ou todos com dataHora null (com warning log)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ] 2.2 Implementar método `listarOpcoes` no InicioContagemService
    - Método `listarOpcoes(temporadaId: string): Promise<OpcaoInicioContagem[]>`
    - Validar que temporada existe (lançar TemporadaNaoEncontradaError se não)
    - Para temporada com 1 fase PONTOS_CORRIDOS (Brasileirão): retornar "Todas as rodadas" + "Rodada 2" até "Rodada N"
    - Para temporada com múltiplas fases PONTOS_CORRIDOS (Copa): retornar "Todas as rodadas" + "Xª rodada fase de grupos" + fases MATA_MATA por ordem
    - Criar interface `OpcaoInicioContagem` com campos label, valor?, tipo?, faseId?, rodada?
    - _Requirements: 10.1, 10.2, 10.3, 10.6_

  - [ ] 2.3 Implementar validação de pertencimento fase-temporada
    - Criar método privado `validarFasePertenceTemporada(faseId: string, temporadaId: string)` no GruposService ou InicioContagemService
    - Buscar fase por ID e verificar se `fase.temporadaId === temporadaId`
    - Se não pertence, lançar erro 400 com mensagem "A fase informada não pertence à temporada do grupo"
    - _Requirements: 11.7_

  - [ ]* 2.4 Escrever testes unitários para InicioContagemService
    - Testar: `resolver` com tipo RODADA e jogos existentes → retorna MIN(dataHora)
    - Testar: `resolver` com tipo FASE e jogos existentes → retorna MIN(dataHora) de todos os jogos da fase
    - Testar: `resolver` com jogos sem dataHora → retorna null
    - Testar: `resolver` com faseId inexistente → lança FaseNaoEncontradaError
    - Testar: `listarOpcoes` para Brasileirão (1 fase PONTOS_CORRIDOS) → "Todas as rodadas" + rodadas 2..38
    - Testar: `listarOpcoes` para Copa do Mundo (múltiplas fases) → opções de grupos + eliminatórias
    - Testar: `listarOpcoes` com temporadaId inexistente → lança TemporadaNaoEncontradaError
    - _Requirements: 8.5, 8.6, 8.7, 8.8_

- [ ] 3. Backend — DTOs e GruposService
  - [ ] 3.1 Criar `InicioContagemDto` e atualizar CriarGrupoDto e UpdateGrupoDto
    - Criar `src/modules/grupos/dto/inicio-contagem.dto.ts` com validação nested
    - Campos: `tipo` (@IsIn(['RODADA', 'FASE'])), `faseId` (@IsUUID), `rodada` (@ValidateIf + @IsInt + @Min(1))
    - No `CriarGrupoDto`: adicionar `inicioContagem?: InicioContagemDto` com @IsOptional, @ValidateNested, @Type
    - No `UpdateGrupoDto`: adicionar `inicioContagem?: InicioContagemDto | null` com @IsOptional, @ValidateIf(!== null), @ValidateNested, @Type
    - Mensagens de validação em português
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ] 3.2 Integrar InicioContagemService no GruposService (criar e atualizar)
    - Injetar `InicioContagemService` no `GruposService`
    - No método `criar`: se `dto.inicioContagem` presente, validar pertencimento + resolver → persistir resultado
    - No método `atualizar`: se `dto.inicioContagem === null` → persistir null; se presente → validar + resolver
    - Se `dto.inicioContagem` não enviado (undefined) → não alterar campo existente
    - Registrar `InicioContagemService` no `GruposModule` (providers + exports se necessário)
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [ ] 4. Backend — Endpoint de opções + Presenter
  - [ ] 4.1 Criar endpoint `GET /temporadas/:temporadaId/opcoes-inicio-contagem`
    - Adicionar rota no `TemporadasController`
    - Injetar `InicioContagemService` no controller (ou criar controller dedicado)
    - Decorar com `@ApiOperation`, `@ApiResponse`, `@ApiTags`
    - Usar `ParseUUIDCustomPipe` para validar temporadaId
    - Acessível por qualquer usuário autenticado (sem guard de role adicional)
    - _Requirements: 10.1, 10.4, 10.5_

  - [ ] 4.2 Expor campo `dataInicioContagem` no GrupoPresenter
    - Adicionar `dataInicioContagem: grupo.dataInicioContagem ? grupo.dataInicioContagem.toISOString() : null` nos métodos `toHttp`, `toHttpMembro` e `toHttpAdmin`
    - NÃO incluir em `toHttpBasico`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 4.3 Escrever testes unitários para GrupoPresenter (dataInicioContagem)
    - Testar: `toHttp` com `dataInicioContagem` Date → retorna ISO string
    - Testar: `toHttp` com `dataInicioContagem` null → retorna null
    - Testar: `toHttpBasico` → não inclui campo
    - _Requirements: 5.1, 5.4, 5.5_

- [ ] 5. Backend — RankingService (lógica de filtragem)
  - [ ] 5.1 Implementar método `filtrarJogosPorDataInicioContagem` no RankingService
    - Criar método privado que retorna todos os jogos se `dataInicioContagem` é null
    - Se `dataInicioContagem` definido: incluir jogos com `dataHora` null (adiados) e jogos com `dataHora >= dataInicioContagem`
    - Excluir jogos com `dataHora` estritamente anterior a `dataInicioContagem`
    - Comparação com `new Date(...).getTime()` para precisão de milissegundos
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 5.2 Integrar filtro no método `calcularRanking` e garantir que `obterDetalhamentoJogo` não aplica filtro
    - Alterar `calcularRanking` para chamar `filtrarJogosPorDataInicioContagem` antes do cálculo de pontos
    - Usar `jogosFiltrados` em vez de `jogosFinalizados` no loop de cálculo
    - Confirmar que `obterDetalhamentoJogo` não chama o filtro
    - _Requirements: 3.5, 3.6, 3.7_

  - [ ]* 5.3 Escrever teste de propriedade: Sem filtro quando dataInicioContagem é null
    - **Property 1: Sem filtro quando dataInicioContagem é null**
    - Usar `fast-check` para gerar arrays de jogos com datas arbitrárias
    - Validar que `filtrarJogosPorDataInicioContagem(jogos, null)` retorna array idêntico à entrada
    - Mínimo 100 iterações
    - **Validates: Requirements 3.1**

  - [ ]* 5.4 Escrever teste de propriedade: Filtro correto por data
    - **Property 2: Filtro correto por data — inclusão se e somente se dataHora >= dataInicioContagem ou dataHora é null**
    - Usar `fast-check` para gerar `dataInicioContagem` e jogos com datas variadas (incluindo null)
    - Validar que cada jogo incluído satisfaz: `dataHora === null || dataHora >= dataInicioContagem`
    - Validar que cada jogo excluído tem `dataHora < dataInicioContagem`
    - Mínimo 100 iterações
    - **Validates: Requirements 3.2, 3.3, 3.4**

  - [ ]* 5.5 Escrever testes unitários do RankingService para dataInicioContagem
    - Instanciação direta com InMemory repositories
    - Teste: grupo com `dataInicioContagem` + 2 jogos (um antes, um depois) → ranking conta apenas o posterior
    - Teste: grupo com `dataInicioContagem` null → ranking conta todos os jogos
    - Teste: grupo com `dataInicioContagem` + jogo com `dataHora` null → jogo incluído
    - Teste: grupo com `dataInicioContagem` + jogo com `dataHora === dataInicioContagem` → jogo incluído (fronteira)
    - Teste: `obterDetalhamentoJogo` não aplica filtro
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 6. Checkpoint — Backend core
  - Ensure all tests pass (`npx vitest run`), build OK (`npx nest build`), ask the user if questions arise.

- [ ] 7. Backend — GruposService integration tests + Postman
  - [ ]* 7.1 Escrever testes unitários do GruposService para integração com InicioContagemService
    - GruposService instanciado com mock de InicioContagemService
    - Teste: criação com `inicioContagem` → chama resolver, persiste resultado
    - Teste: criação sem `inicioContagem` → persiste null, não chama resolver
    - Teste: atualização com `inicioContagem: null` → persiste null
    - Teste: atualização com `inicioContagem` de fase de outra temporada → erro 400
    - _Requirements: 2.5, 2.6, 2.7, 11.7_

  - [ ] 7.2 Atualizar Postman Collection
    - Adicionar `"inicioContagem": { "tipo": "RODADA", "faseId": "{{faseId}}", "rodada": 5 }` no body do endpoint "Criar Grupo"
    - Adicionar `"inicioContagem": { "tipo": "FASE", "faseId": "{{faseId}}" }` no body do endpoint "Atualizar Grupo"
    - Adicionar endpoint "Opções de Início de Contagem" (GET /temporadas/{{temporadaId}}/opcoes-inicio-contagem) na folder "Temporadas"
    - Manter estrutura válida Postman Collection v2.1
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 8. Checkpoint — Backend completo
  - Ensure all tests pass, build OK, ask the user if questions arise.

- [ ] 9. Frontend — Tipos, Service e Dropdown de Criação
  - [ ] 9.1 Atualizar tipos do frontend e criar service de opções
    - Adicionar `dataInicioContagem: string | null` na interface `Grupo`
    - Criar interface `OpcaoInicioContagem` com campos: label, valor?, tipo?, faseId?, rodada?
    - Criar interface `InicioContagemPayload` com campos: tipo, faseId, rodada?
    - Atualizar payload de criação: `inicioContagem?: InicioContagemPayload`
    - Atualizar payload de atualização: `inicioContagem?: InicioContagemPayload | null`
    - Criar função `buscarOpcoesInicioContagem(temporadaId: string)` no service de temporadas
    - _Requirements: 5.1, 6.5, 7.3, 10.1_

  - [ ] 9.2 Adicionar dropdown de início de contagem no formulário de criação de grupo
    - Componente Select/dropdown com label "Início da contagem de pontos" na seção de configurações avançadas
    - Buscar opções via `buscarOpcoesInicioContagem(temporadaId)` quando temporada é selecionada
    - Estado de loading: dropdown desabilitado com texto "Carregando opções..."
    - Primeira opção "Todas as rodadas" = sem filtro
    - No submit: se "Todas as rodadas" selecionada → omitir campo; senão → enviar `{ tipo, faseId, rodada? }`
    - Tratamento de erro ao buscar opções: mensagem abaixo do dropdown
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 10. Frontend — Dropdown de Edição
  - [ ] 10.1 Adicionar dropdown de início de contagem no formulário de edição de grupo
    - Componente Select/dropdown com label "Início da contagem de pontos"
    - Carregar opções via `buscarOpcoesInicioContagem(grupo.temporadaId)` no mount
    - Pré-selecionar opção correspondente ao `dataInicioContagem` atual (comparar com datas das opções), ou "Todas as rodadas" se null
    - Texto auxiliar abaixo: "Jogos finalizados antes da rodada/fase selecionada não serão contabilizados no ranking"
    - Ao selecionar "Todas as rodadas" e submeter → enviar `inicioContagem: null`
    - Ao selecionar opção específica e submeter → enviar `inicioContagem: { tipo, faseId, rodada? }`
    - Tratamento de erro: mensagem no topo do formulário, seleção preservada
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 11. Final checkpoint
  - Ensure all tests pass (backend + frontend), builds OK, ask the user if questions arise.

## Notes

- Tasks marcadas com `*` contêm testes e podem ser executadas em paralelo com as tasks de implementação da mesma wave
- Cada task referencia requirements específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Property tests validam propriedades universais de corretude da filtragem
- Unit tests validam exemplos específicos e edge cases
- Backend usa Vitest + fast-check; frontend usa Vitest + React Testing Library
- O filtro é aplicado na camada de cálculo (RankingService), não na query do repositório
- O campo persiste DateTime (não a seleção) — se jogos forem remarcados, a data não muda automaticamente
- O endpoint de opções é calculado on-the-fly (não persistido) — reflete jogos existentes no momento da consulta
- Para pré-seleção no edit: frontend compara `dataInicioContagem` com datas calculadas para cada opção

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 3, "tasks": ["2.4", "3.1"] },
    { "id": 4, "tasks": ["3.2", "4.1", "4.2"] },
    { "id": 5, "tasks": ["4.3", "5.1"] },
    { "id": 6, "tasks": ["5.2", "5.3", "5.4", "5.5"] },
    { "id": 7, "tasks": ["7.1", "7.2"] },
    { "id": 8, "tasks": ["9.1"] },
    { "id": 9, "tasks": ["9.2"] },
    { "id": 10, "tasks": ["10.1"] }
  ]
}
```
