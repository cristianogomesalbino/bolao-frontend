# Implementation Tasks

## Task Dependency Graph

```
T1 (PontuacaoPadrao) ──┐
T2 (Endpoint backend) ──┼── T5 (ConteudoExpandidoGrupo)
T3 (useGrupoAtivo) ─────┼── T6 (Integração page)
T4 (SeletorGrupo) ──────┘        │
                                  T7 (Substituir pontuação existente)
                                  T8 (Testes)
```

## Tasks

### Task 1: Criar componente PontuacaoPadrao

- [ ] Criar `src/components/ui/pontuacao-padrao.tsx`
- [ ] Props: `pontos: number`, `temaCopa?: boolean`
- [ ] Renderizar: "3 pontos 🎯" (cheio), "1 ponto ⚡" (parcial), "0 pontos" (erro)
- [ ] Usar singular "ponto" quando valor = 1
- [ ] Adicionar `data-testid="pontuacao-padrao"`
- [ ] Estilização: `text-[10px] font-semibold` com cores por tema

### Task 2: Criar endpoint palpites-membros no backend

- [ ] Criar rota `GET /grupos/:grupoId/jogos/:jogoId/palpites-membros` no `PalpiteController`
- [ ] Guard: `GroupRoleGuard` com `@GroupRoles(GRUPO_ROLE.ADMIN, GRUPO_ROLE.MEMBER)`
- [ ] Service: buscar membros do grupo + palpites do jogo
- [ ] Lógica: se jogo.status é AGENDADO ou ADIADO, retornar golsCasa/golsFora como null (ocultar placar)
- [ ] Resposta: `[{ nome, golsCasa, golsFora, palpitou, pontosFinais?, categoriaAcerto? }]`
- [ ] Incluir pontosFinais e categoriaAcerto apenas para jogos FINALIZADOS
- [ ] Adicionar service no frontend: `buscarPalpitesMembros(grupoId, jogoId)` em `palpite.service.ts`
- [ ] Testes unitários no backend (service + controller)

### Task 3: Criar hook useGrupoAtivoPalpites

- [ ] Criar `src/hooks/useGrupoAtivoPalpites.ts`
- [ ] Receber `campeonato: CampeonatoSlug` como parâmetro
- [ ] Buscar grupos do usuário via query existente `['grupos']`
- [ ] Filtrar grupos que pertencem ao campeonato selecionado
- [ ] Lógica de resolução: 0 grupos → `semGrupos: true`; 1 grupo → seleciona automaticamente; 2+ grupos → usa favorito ou `semGrupoFavorito: true`
- [ ] Retornar: `grupoAtivoId`, `grupoAtivoNome`, `podeTrocar`, `gruposDisponiveis`, `semGrupoFavorito`, `semGrupos`, `trocarGrupo`
- [ ] `trocarGrupo` atualiza estado local (sem persistir)

### Task 4: Criar componente SeletorGrupoPalpites

- [ ] Criar `src/components/palpites/seletor-grupo-palpites.tsx`
- [ ] Exibir label com nome do grupo ativo (badge com cor do campeonato)
- [ ] Botão "Trocar grupo" que abre dropdown com lista de grupos
- [ ] Reutilizar padrão visual do `FiltroGrupoDropdown` do card-ranking
- [ ] Props: `grupoAtivo`, `gruposDisponiveis`, `onTrocar`, `temaCopa`
- [ ] Usar `CORES_CAMPEONATO` para estilização
- [ ] Adicionar `data-testid="seletor-grupo-palpites"`

### Task 5: Criar componente ConteudoExpandidoGrupo

- [ ] Criar `src/components/palpites/conteudo-expandido-grupo.tsx`
- [ ] Props: `jogoId`, `grupoId`, `statusJogo`, `golsCasaReal`, `golsForaReal`, `temaCopa`
- [ ] Implementar `determinarEstadoChevron(statusJogo)` → 'pre_jogo' | 'ao_vivo' | 'finalizado'
- [ ] **Pré-jogo**: useQuery com `buscarEstatisticasPalpite` → lista membros (●/○ Palpitou/Pendente)
- [ ] **Ao vivo**: useQuery com `buscarPalpitesMembros` → lista com "nome: X × Y"
- [ ] **Finalizado**: useQuery com `buscarPalpitesMembros` (com pontuação) → lista ordenada por pontos + PontuacaoPadrao
- [ ] Lazy loading: `enabled` condicionado a prop de visibilidade
- [ ] Usar cores de `CORES_CAMPEONATO` baseado em `temaCopa`
- [ ] Adicionar `data-testid="conteudo-expandido-grupo"`

### Task 6: Integrar na página de palpites

- [ ] Importar `useGrupoAtivoPalpites` na `PalpitesPage`
- [ ] Se `semGrupoFavorito`: exibir alerta + redirecionar para `/grupos`
- [ ] Se `semGrupos`: exibir estado vazio com CTA
- [ ] Se `podeTrocar`: renderizar `SeletorGrupoPalpites` acima dos cards
- [ ] Passar `grupoAtivoId` para os componentes `AbaTodosJogos` e `AbaJogosCopa`
- [ ] Atualizar `CardJogoPalpite` para usar `ConteudoExpandidoGrupo` quando `grupoId` disponível
- [ ] Manter fallback do chevron atual (sem grupo → mensagem "Entre em um grupo")

### Task 7: Substituir pontuação existente pelo PontuacaoPadrao

- [ ] Substituir exibição de "+3 pts 🎯" no `CardJogoPalpite` por `<PontuacaoPadrao pontos={pts} />`
- [ ] Substituir em `card-ranking.tsx` onde exibe pontuação individual
- [ ] Garantir que o formato "X ponto(s) {ícone}" está consistente em todo o app
- [ ] Verificar `AbaMeusPalpitesCopa` e `aba-meus-palpites` para usar o mesmo componente

### Task 8: Testes

- [ ] Teste unitário: `PontuacaoPadrao` — renderiza corretamente para 0, 1, 3 pontos
- [ ] Teste unitário: `useGrupoAtivoPalpites` — cenários 0/1/2+ grupos, favorito presente/ausente
- [ ] Teste unitário backend: endpoint palpites-membros — oculta gols pré-jogo, revela ao vivo/finalizado
- [ ] Teste integração: chevron expandido muda de estado conforme status do jogo
- [ ] Verificar data-testid em todos os novos componentes
