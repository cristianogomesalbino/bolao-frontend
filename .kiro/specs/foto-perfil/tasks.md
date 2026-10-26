# Implementation Plan: Foto de perfil

## Overview

Upload da foto pelo backend para o Supabase Storage, avatar no lugar das iniciais e bloqueio do ranking enquanto `fotoUrl` for nula. Requisitos em `requirements.md`. Desenho em `design.md`.

## Tasks

- [ ] 1. Backend — coluna, upload e URL nos payloads
  - [ ] 1.1 Adicionar `fotoUrl String?` em `Usuario` e criar a migration
    - _Requirements: 1.6_
  - [ ] 1.2 `POST /usuarios/me/foto` e `DELETE /usuarios/me/foto`
    - Multipart, campo `foto`. Validar JPEG, PNG e WebP até 5 MB pelo conteúdo. Recusar SVG.
    - Gerar WebP 512px, gravar em `avatares/{usuarioId}/{uuid}.webp` com a service role, apagar o objeto anterior.
    - Delete zera `fotoUrl` e apaga o objeto. Desativar a conta também apaga o objeto.
    - `PATCH /usuarios/:id` continua sem aceitar `fotoUrl`.
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 4.3, 4.4_
  - [ ] 1.3 Incluir `fotoUrl` no presenter do usuário, no select de membros, no ranking e nos payloads de palpite que já devolvem `nomeUsuario`
    - _Requirements: 3.9, 5.2_
  - [ ] 1.4 Responder 403 em ranking geral e ranking por fase quando o autenticado não tem `fotoUrl`. Manter `ranking/jogos/:jogoId` liberado.
    - _Requirements: 3.5, 3.6_

- [ ] 2. Frontend — avatar e Minha Conta
  - [ ] 2.1 Estender os tipos e o serviço de usuário com `fotoUrl`. O POST da foto não herda `Content-Type: application/json`.
    - _Requirements: 1.1, 5.2_
  - [ ] 2.2 Criar `AvatarUsuario` com fallback de iniciais e usar em Minha Conta, ranking, membros, configurações do grupo, palpites, jogo, copa e destaques.
    - _Requirements: 1.3, 1.4, 5.1_
  - [ ] 2.3 Em Minha Conta, seletor nativo, pré-visualização circular, envio e "Remover foto" com aviso de que o ranking volta a bloquear. Atualizar a store de auth.
    - _Requirements: 1.7, 1.8, 4.1, 4.2, 4.3_

- [ ] 3. Frontend — convite e trava do ranking
  - [ ] 3.1 Na primeira abertura sem foto, abrir o modal de inclusão. "Agora não" abre o aviso de ranking restrito e grava a dispensa local. Não repetir na abertura seguinte.
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [ ] 3.2 Bloquear aba Ranking, rota `/ranking` e card da copa sem `fotoUrl`. Ao tocar, abrir o modal com "Adicione uma foto para liberar esta funcionalidade". Tratar 403 como estado bloqueado.
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7, 3.8_
