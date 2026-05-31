---
inclusion: auto
description: Diretrizes de testabilidade — convenções de data-testid para testes E2E com Playwright.
---

# Testabilidade — Diretrizes para Playwright

## Regra Principal

Todo elemento interativo ou que exibe informação relevante DEVE ter um atributo `data-testid` para facilitar a identificação nos testes E2E com Playwright.

## Convenção de Nomenclatura

Usar kebab-case com prefixo do contexto:

```
data-testid="[contexto]-[elemento]-[variante?]"
```

### Exemplos:

```tsx
// Formulários
<form data-testid="login-form">
<input data-testid="login-input-email" />
<input data-testid="login-input-senha" />
<button data-testid="login-btn-entrar">

// Cards
<div data-testid="home-card-proximo-jogo">
<div data-testid="home-card-ranking">
<div data-testid="home-card-grupos">

// Navegação
<nav data-testid="bottom-nav">
<button data-testid="nav-btn-home">
<button data-testid="nav-btn-grupos">

// Listas dinâmicas (usar ID do item)
<div data-testid={`grupo-item-${grupo.id}`}>
<div data-testid={`ranking-posicao-${posicao}`}>

// Feedback
<div data-testid="alert-erro">
<div data-testid="alert-sucesso">
<div data-testid="loading-spinner">
```

## Elementos que DEVEM ter data-testid

- Botões de ação (submit, navegação, logout)
- Inputs de formulário
- Links de navegação principal
- Cards informativos
- Alertas de erro/sucesso
- Indicadores de loading
- Itens de lista (com ID dinâmico)
- Modais e confirmações
- Header e footer
- Bottom navigation

## Elementos que NÃO precisam

- Ícones decorativos
- Separadores visuais
- Textos estáticos sem interação
- Wrappers de layout puro

## Padrão nos Testes Playwright

```typescript
// Localizar por data-testid
await page.getByTestId('login-btn-entrar').click();
await page.getByTestId('login-input-email').fill('email@teste.com');
await expect(page.getByTestId('alert-erro')).toBeVisible();
```

## Regras

- NUNCA usar classes CSS ou IDs para localizar elementos nos testes
- NUNCA usar seletores frágeis (nth-child, texto exato que pode mudar)
- SEMPRE preferir data-testid para elementos testáveis
- SEMPRE usar nomes descritivos e consistentes
- Em listas, incluir o ID do item no data-testid
