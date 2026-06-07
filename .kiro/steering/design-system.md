---
inclusion: auto
description: Design system do frontend — paleta de cores, tipografia, componentes UI, glassmorphism e padrões visuais.
---

# Design System — Bolão Frontend

## Identidade Visual

App esportivo premium com tema dark. Inspiração: Sofascore, OneFootball, Spotify.

## Paleta de Cores

Definida em `src/app/globals.css` via `@theme`:

| Token | Hex | Uso |
|-------|-----|-----|
| `primaria` | #16a34a | Botões principais, ações, glow |
| `primaria-claro` | #22d35e | Hover de botões |
| `secundaria` | #1e40af | Elementos secundários |
| `destaque` | #f59e0b | Badges, alertas informativos |
| `fundo` | #0B1020 | Background geral (com radial gradient) |
| `superficie` | #132238 | Cards, inputs (via white/opacity) |
| `texto` | #e2e8f0 | Texto principal |
| `link` | #4ade80 | Links (verde claro, diferente do botão) |
| `erro` | #ef4444 | Erros, zona de perigo |
| `sucesso` | #22c55e | Confirmações |

## Fundo

Nunca usar cor sólida pura. Sempre com profundidade:

```css
body {
  background: radial-gradient(circle at top, #132238, #0B1020 55%);
}
```

Páginas de auth adicionam:
- Textura sutil de gramado (`.bg-campo`)
- Radial gradients verde/azul muito sutis

## Cards (Glassmorphism)

```tsx
// Padrão base do Card component
"rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl text-texto shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
```

Variações:
- Card Home (Brasileirão): `border-primaria shadow-[0_0_20px_rgba(22,163,74,0.2)]` — borda verde sólida + glow
- Card Home (Copa): `border-[#ffdf00] shadow-[0_0_24px_rgba(255,223,0,0.3)]` — borda amarela sólida + glow
- Card com destaque: `border-primaria/15 shadow-[0_0_20px_rgba(22,163,74,0.08)]`
- Card de perigo: `border-erro/20`

## Tema Copa do Mundo

Quando o grupo ativo pertence à Copa do Mundo, cards mudam de tema automaticamente:

| Elemento | Brasileirão | Copa do Mundo |
|----------|-------------|---------------|
| Borda | `border-primaria` (verde) | `border-[#ffdf00]` (amarelo) |
| Fundo | `from-superficie/60 to-fundo/80` | `from-[#009c3b]/20 via-[#003d1a] to-[#ffdf00]/10` |
| Textos título | `text-texto/50` | `text-[#ffdf00]/90` |
| Nomes times | `text-texto` | `text-[#ffdf00]` |
| Countdown | `text-primaria-claro` | `text-[#ff8c00]` |
| Botão | `bg-primaria` | `bg-[#009c3b]` |
| Glow escudos | branco (`bg-white/15`) | amarelo (`bg-[#ffdf00]/25`) |
| Ícone | ⚽ | 🏆 |

Cores Copa (referência — bandeira do Brasil):
- Verde escuro (fundo): `#003d1a`
- Verde Brasil (bordas/ações): `#009c3b`
- Amarelo (destaques/textos): `#ffdf00`
- Laranja (countdown): `#ff8c00`

Detecção: `grupo.temporada.campeonato.nome.toLowerCase().includes('copa')`

## Inputs

```tsx
"h-12 border-white/10 bg-white/5 placeholder:text-texto/30 focus:border-primaria focus:ring-4 focus:ring-primaria/10 transition-all"
```

- Altura: `h-12` (48px — bom pra touch)
- Padding: `px-4`
- Font size: `text-base` (16px — previne zoom iOS)
- Focus: borda verde + ring suave + glow

## Botões

- Default (verde): hover sobe 1px + sombra verde + verde mais claro
- Outline: `border-white/10 hover:bg-white/5`
- Destructive: vermelho
- Ghost: transparente, hover com bg sutil
- Disabled: `opacity-50`

## Tipografia

- Headers: `font-semibold` ou `font-bold`
- Body: `text-sm` ou `text-base`
- Labels: `text-sm font-medium`
- Captions: `text-[10px] ou text-[11px] uppercase tracking-wider`
- Erros: `text-xs text-erro/90`

## Opacidades de Texto

| Uso | Classe |
|-----|--------|
| Texto principal | `text-texto` |
| Texto secundário | `text-texto/70` |
| Texto terciário | `text-texto/50` |
| Texto sutil | `text-texto/40` |
| Texto quase invisível | `text-texto/30` |

## Espaçamento

- Entre cards: `space-y-4` ou `space-y-5`
- Padding de card: `p-4` ou `p-5`
- Entre campos de form: `space-y-3.5`
- Label → input: `space-y-1.5`
- Max width de conteúdo: `max-w-[480px]`
- Max width de forms auth: `max-w-[380px]`

## Animações

Definidas em `globals.css`:
- `shake` — feedback de erro (0.5s)
- `fadeIn` — entrada suave com slide-up (0.5s, delay 0.3s)
- `animate-spin` — loading spinners
- `transition-all duration-200` — transições gerais

## Responsividade (Mobile-First)

- Base: 320px+
- Touch targets: mínimo 44x44px (inputs h-12, botões h-11/h-12)
- Padding lateral: `px-4`
- Conteúdo centralizado com max-width
- Bottom navigation fixa com safe-area

## Ícones

- Biblioteca: Lucide React
- Tamanho padrão: 18-20px
- Cor: herda do texto (usar opacidade pra contraste)

## Escudos de Times

- Fonte: `s.sde.globo.com` (SVGs do Globo Esporte)
- Usar `<img>` com `object-contain` (SVGs externos)
- Fallback: sigla do time em círculo
- Domínio liberado em `next.config.ts` → `remotePatterns`
- Filtros visuais: `brightness-110 saturate-[1.1]` para cores mais vivas
- Drop shadow: `drop-shadow-[0_0_16px_rgba(255,255,255,0.2)]` para glow sutil
- Sem borda nem fundo no container (limpo)

## Padrões de Glow

| Elemento | Classe |
|----------|--------|
| Ícone header | `drop-shadow-[0_0_10px_rgba(34,211,94,0.8)]` |
| Botão criar | `shadow-[0_0_20px_rgba(34,211,94,0.6)]` |
| Engrenagem config | `drop-shadow-[0_0_14px_rgba(34,211,94,1)]` |
| Escudos times | `drop-shadow-[0_0_16px_rgba(255,255,255,0.2)]` |
| Borda card gradiente | mask technique com `WebkitMaskComposite: 'xor'` |

## Override de SVG no Button

O componente Button tem `[&_svg]:size-4` global. Para ícones maiores dentro de Button, usar:
```tsx
className="[&_svg]:size-7" // ou size-6, size-8, etc.
```

## Countdown

- Formato: `HH:MM:SS` em `font-mono font-bold`
- Cor: `text-primaria-claro` (ativo), `text-erro` (encerrado), `text-destaque` (adiado)
- Atualiza a cada 1s via `setInterval` no `useEffect`
- Encerra 1 minuto antes do jogo (CRON de palpite automático)

## Badges de Status

| Status | Estilo |
|--------|--------|
| V (vitória) | `bg-primaria text-white` |
| E (empate) | `bg-destaque text-white` |
| D (derrota) | `bg-erro text-white` |
| Adiado | `text-destaque bg-destaque/15 border border-destaque/30` |
| ATRASADO | `text-destaque bg-destaque/15 border border-destaque/30` |
| Admin | `text-destaque/70 bg-destaque/10` |
| Online | bolinha `h-1.5 w-1.5 rounded-full bg-primaria` |

## Títulos de Seção (estilo iOS Settings)

```tsx
"text-[10px] text-primaria-claro/80 uppercase tracking-[0.15em] font-bold"
```

## Zona de Perigo (colapsável)

```tsx
"rounded-2xl border border-erro/20 bg-erro/[0.02] overflow-hidden"
// Chevron gira 180° ao expandir
// Conteúdo com animate-[fadeIn_0.2s_ease-out]
```

## Timezone

Sempre usar `timeZone: 'America/Sao_Paulo'` ao formatar datas de jogos:
```tsx
new Date(dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
```

## Padrões de Feedback

- Loading: spinner no botão + texto "Ação..." + inputs disabled
- Sucesso: Alert verde com ✓ + fade-out após 3s
- Erro: Alert vermelho + shake no card
- Validação: borda vermelha no input + mensagem abaixo em `text-xs`

## Bottom Navigation

- 4 itens: Home, Grupos, Jogos, Conta
- Ativo: cor primária + stroke mais grosso
- Inativo: `text-texto/35`
- Background: `bg-fundo/90 backdrop-blur-lg`
- Safe area pra notch: `padding-bottom: env(safe-area-inset-bottom)`

## Header (Páginas Protegidas)

- Sticky top com blur: `sticky top-0 bg-fundo/80 backdrop-blur-lg`
- Borda inferior sutil: `border-b border-white/[0.05]`
- Altura confortável: `py-4`
