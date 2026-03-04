# Duka Design System - Revolução Mobile-First

**Última atualização:** 04/03/2026
**Versão:** 2.0.0
**Inspirações:** Tinder (gestos fluidos) + Uber (clareza de estados)

---

## 1. Filosofia de Design

### Princípios Fundamentais

1. **Polegar em Primeiro Lugar**
   - Toda ação crítica está na parte inferior da tela (alcance natural do polegar)
   - Zona de conforto: 80-120px do bottom da tela
   - Informações consultivas no topo (não exigem toque frequente)

2. **Gestos > Cliques**
   - Swipe left/right para ações secundárias (editar/deletar)
   - Tap para ação primária (ver detalhes/abrir)
   - Long press para opções avançadas
   - Pull to refresh nativo

3. **Estados Sempre Visíveis**
   - Loading: skeleton screens (não spinners genéricos)
   - Empty state: ilustração + CTA claro + UX writing humanizado
   - Error: mensagem clara + ação de recuperação
   - Success: feedback visual + micro-animação

4. **UX Writing Brasileiro**
   - ✅ "Sem cobranças este mês"
   - ❌ "Nenhum resultado encontrado"
   - ✅ "Tá tudo pago!"
   - ❌ "100% de taxa de pagamento"
   - ✅ "Adicionar despesa"
   - ❌ "Criar nova despesa"

---

## 2. Sistema de Cores

### Paleta Base (Inspiração: Modern + Warm)

```css
:root {
  /* Neutros (base cinza quente) */
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-300: #D1D5DB;
  --gray-500: #6B7280;
  --gray-700: #374151;
  --gray-900: #111827;

  /* Primary (Azul confiança - uso estratégico) */
  --primary-50: #EFF6FF;
  --primary-500: #3B82F6;
  --primary-600: #2563EB;
  --primary-700: #1D4ED8;

  /* Semânticos */
  --success-50: #ECFDF5;
  --success-500: #10B981;
  --success-600: #059669;

  --warning-50: #FFFBEB;
  --warning-500: #F59E0B;
  --warning-600: #D97706;

  --danger-50: #FEF2F2;
  --danger-500: #EF4444;
  --danger-600: #DC2626;

  /* Backgrounds */
  --bg-app: var(--gray-50);
  --bg-card: #FFFFFF;
  --bg-elevated: #FFFFFF;
}
```

### Regras de Uso

- **Fundo da app:** `--bg-app` (cinza quente, menos cansativo que branco puro)
- **Cards:** `--bg-card` + sombra sutil + borda quase imperceptível
- **Azul primário:** APENAS botões CTA e links importantes
- **Headers de seção:** `--gray-100` ou gradiente suave (nunca azul chapado)
- **Status financeiro:**
  - Pago: verde (`--success-500`)
  - Pendente: amarelo (`--warning-500`)
  - Atrasado: vermelho (`--danger-500`)

---

## 3. Tipografia

### Escala de Tamanhos

```css
:root {
  /* Mobile-first (base 16px) */
  --text-xs: 12px;      /* Labels secundárias */
  --text-sm: 14px;      /* Corpo de texto */
  --text-base: 16px;    /* Corpo principal */
  --text-lg: 18px;      /* Subtítulos */
  --text-xl: 20px;      /* Títulos de card */
  --text-2xl: 24px;     /* Títulos de seção */
  --text-3xl: 30px;     /* Hero numbers (dashboard) */
  --text-4xl: 36px;     /* Super hero (valores grandes) */

  /* Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### Hierarquia Visual

**Hero Metrics (Dashboard)**
```html
<div class="metric-hero">
  <span class="metric-label">A RECEBER NO MÊS</span>
  <span class="metric-value">R$ 7.850,00</span>
</div>
```
```css
.metric-label {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--gray-500);
}

.metric-value {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--gray-900);
  font-variant-numeric: tabular-nums; /* Alinha números */
}
```

**Listas/Cards**
```css
.card-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--gray-900);
}

.card-subtitle {
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  color: var(--gray-500);
}

.card-value {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--gray-900);
  font-variant-numeric: tabular-nums;
}
```

---

## 4. Espaçamento e Layout

### Sistema 4px Base

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
}
```

### Anatomia de um Card

```
┌─────────────────────────────────────┐
│ [padding: 20px (--space-5)]         │
│                                     │
│  TÍTULO (--text-lg, semibold)       │  ← 4px gap
│  Subtítulo (--text-sm, gray-500)   │  ← 16px gap
│                                     │
│  Label (--text-xs, uppercase)       │  ← 4px gap
│  Valor (--text-xl, semibold)        │  ← 16px gap
│                                     │
│  [actions: buttons ou badges]       │
│                                     │
└─────────────────────────────────────┘
    ↑ 16px margin-bottom
```

### Grid de Métricas (Dashboard)

```css
.metrics-grid {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
}

/* 1 coluna no mobile, 2 em tablets, 3+ em desktop */
@media (min-width: 640px) {
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .metrics-grid { grid-template-columns: repeat(3, 1fr); }
}
```

---

## 5. Componentes Core

### 5.1 Card Base

```css
.card {
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--gray-200);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
```

### 5.2 Badge de Status

```html
<span class="badge badge-success">Pago</span>
<span class="badge badge-warning">Pendente</span>
<span class="badge badge-danger">Atrasado</span>
```

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  font-variant-numeric: tabular-nums;
}

.badge-success {
  background: var(--success-50);
  color: var(--success-600);
}

.badge-warning {
  background: var(--warning-50);
  color: var(--warning-600);
}

.badge-danger {
  background: var(--danger-50);
  color: var(--danger-600);
}
```

### 5.3 Botão Primário

```html
<button class="btn btn-primary">
  <span class="btn-label">Adicionar cobrança</span>
</button>
```

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 48px; /* Touch target mínimo */
}

.btn-primary {
  background: var(--primary-600);
  color: white;
}

.btn-primary:active {
  background: var(--primary-700);
  transform: scale(0.96);
}
```

### 5.4 Bottom Navigation

```html
<nav class="bottom-nav">
  <a href="#dashboard" class="nav-item active">
    <span class="nav-icon">📊</span>
    <span class="nav-label">Início</span>
  </a>
  <a href="#charges" class="nav-item">
    <span class="nav-icon">💰</span>
    <span class="nav-label">Cobranças</span>
  </a>
  <!-- ... -->
</nav>
```

```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: var(--bg-elevated);
  border-top: 1px solid var(--gray-200);
  padding: 8px 0;
  z-index: 100;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.04);
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  color: var(--gray-500);
  text-decoration: none;
  transition: color 0.2s;
}

.nav-item.active {
  color: var(--primary-600);
}

.nav-icon {
  font-size: 24px;
}

.nav-label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}
```

---

## 6. Micro-interações

### 6.1 Loading States (Skeleton)

```html
<div class="card skeleton">
  <div class="skeleton-line skeleton-title"></div>
  <div class="skeleton-line skeleton-text"></div>
  <div class="skeleton-line skeleton-text short"></div>
</div>
```

```css
.skeleton {
  pointer-events: none;
}

.skeleton-line {
  height: 16px;
  background: linear-gradient(
    90deg,
    var(--gray-200) 25%,
    var(--gray-100) 50%,
    var(--gray-200) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 4px;
  margin-bottom: 12px;
}

.skeleton-title {
  height: 24px;
  width: 60%;
}

.skeleton-text {
  width: 100%;
}

.skeleton-text.short {
  width: 40%;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 6.2 Pull to Refresh

```js
let startY = 0;
let currentY = 0;

container.addEventListener('touchstart', (e) => {
  startY = e.touches[0].clientY;
});

container.addEventListener('touchmove', (e) => {
  currentY = e.touches[0].clientY;
  const diff = currentY - startY;

  if (diff > 0 && container.scrollTop === 0) {
    // Mostrar indicador de refresh
    refreshIndicator.style.transform = `translateY(${Math.min(diff, 80)}px)`;
  }
});

container.addEventListener('touchend', () => {
  if (currentY - startY > 80) {
    // Trigger refresh
    fetchData();
  }
  refreshIndicator.style.transform = 'translateY(0)';
});
```

### 6.3 Swipe Actions (Cards de Lista)

```html
<div class="swipeable-card">
  <div class="card-actions-left">
    <button class="action-edit">Editar</button>
  </div>
  <div class="card-content">
    <!-- Conteúdo do card -->
  </div>
  <div class="card-actions-right">
    <button class="action-delete">Excluir</button>
  </div>
</div>
```

```css
.swipeable-card {
  position: relative;
  overflow: hidden;
}

.card-actions-left,
.card-actions-right {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-actions-left {
  left: 0;
  background: var(--primary-500);
}

.card-actions-right {
  right: 0;
  background: var(--danger-500);
}

.card-content {
  position: relative;
  z-index: 2;
  background: var(--bg-card);
  transition: transform 0.3s ease;
}
```

---

## 7. Padrões de UX Writing

### Empty States

```
❌ "Nenhum registro encontrado"
✅ "Nenhuma cobrança por aqui ainda"
   + botão "Adicionar primeira cobrança"

❌ "Não há dados"
✅ "Sem despesas este mês"
   + subtexto "Adicione gastos de manutenção, reparos, etc."

❌ "Lista vazia"
✅ "Tá tudo pago! 🎉"
```

### Error Messages

```
❌ "Erro ao processar requisição"
✅ "Não conseguimos salvar. Tenta de novo?"
   + botão "Tentar novamente"

❌ "Falha na autenticação"
✅ "Essa senha não tá batendo"
   + link "Esqueci minha senha"

❌ "Campos obrigatórios não preenchidos"
✅ "Falta preencher: nome do inquilino e valor"
```

### Success Messages

```
❌ "Operação realizada com sucesso"
✅ "Cobrança criada!"

❌ "Dados salvos"
✅ "Tá guardado"

❌ "Pagamento registrado"
✅ "Pagamento confirmado 💸"
```

### Botões de Ação

```
❌ "Submeter formulário"
✅ "Salvar cobrança"

❌ "Criar novo"
✅ "Adicionar despesa"

❌ "Cancelar operação"
✅ "Deixa pra depois"
```

---

## 8. Responsividade Mobile-First

### Breakpoints

```css
/* Mobile (padrão) */
@media (max-width: 639px) {
  /* 100% das telas mobile */
}

/* Tablet */
@media (min-width: 640px) {
  /* Grid 2 colunas, side-by-side onde faz sentido */
}

/* Desktop */
@media (min-width: 1024px) {
  /* Sidebar fixa, grid 3+ colunas, hover states */
}
```

### Touch Targets

- **Mínimo:** 48x48px (recomendação WCAG)
- **Ideal:** 56x56px (mais confortável)
- **Espaçamento entre alvos:** mínimo 8px

### Densidade de Informação

**Mobile:**
- 1 métrica por linha (hero numbers)
- Cards full-width com padding 16px
- Listas com avatar/ícone + 2 linhas de texto max

**Tablet:**
- 2 métricas por linha
- Cards em grid 2 colunas
- Listas com 3 colunas de informação

**Desktop:**
- 3-4 métricas por linha
- Sidebar + conteúdo principal
- Tabelas tradicionais (não cards)

---

## 9. Acessibilidade

### Contraste de Cores

Todos os pares texto/fundo atendem WCAG AA:
- `--gray-900` em `--bg-card`: 16.8:1 ✅
- `--gray-500` em `--bg-card`: 4.8:1 ✅
- `--primary-600` em white: 4.5:1 ✅

### Foco Visível

```css
*:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

### Textos Alternativos

```html
<!-- Ícones decorativos -->
<span class="icon" aria-hidden="true">💰</span>

<!-- Ícones funcionais -->
<button aria-label="Editar cobrança">
  <span class="icon">✏️</span>
</button>
```

---

## 10. Performance

### Otimizações CSS

```css
/* GPU acceleration para animações */
.card {
  will-change: transform;
  transform: translateZ(0);
}

/* Evitar layout shifts */
.skeleton-line {
  content-visibility: auto;
}
```

### Lazy Loading

```html
<img
  src="placeholder.jpg"
  data-src="real-image.jpg"
  loading="lazy"
  alt="Foto do imóvel"
>
```

### Bundle Size

- CSS crítico inline (<10kb)
- Fontes: system stack (sem web fonts)
- Ícones: SVG inline ou emoji (sem biblioteca de ícones)

---

## 11. Implementação Prática

### Estrutura de Pastas

```
src/
├── components/
│   ├── Dashboard/
│   │   ├── MetricCard.tsx
│   │   ├── MetricsGrid.tsx
│   │   └── styles.css
│   ├── Charges/
│   │   ├── ChargeCard.tsx
│   │   ├── ChargesList.tsx
│   │   └── styles.css
│   ├── Expenses/
│   │   ├── ExpenseCard.tsx
│   │   ├── ExpensesList.tsx
│   │   └── styles.css
│   └── shared/
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       └── BottomNav.tsx
├── styles/
│   ├── tokens.css        # Variáveis CSS
│   ├── reset.css         # Normalize
│   ├── utilities.css     # Classes utilitárias
│   └── animations.css    # Keyframes
└── lib/
    ├── supabase.ts
    └── formatters.ts     # Formatação de moeda, data, etc.
```

### Checklist de Componente Novo

- [ ] Mobile-first (funciona em 320px de largura)
- [ ] Touch target mínimo 48px
- [ ] Loading state (skeleton)
- [ ] Empty state (com UX writing BR)
- [ ] Error state (com ação de recuperação)
- [ ] Transições suaves (<300ms)
- [ ] Contraste WCAG AA
- [ ] Focus visible para teclado
- [ ] Testes em iPhone SE e Android pequeno

---

## 12. Migração do Sistema Antigo

### Passo a Passo

1. **Auditoria de componentes existentes**
   - Listar todos os `.card`, `.table`, `.modal` do CSS antigo
   - Identificar variações (card-primary, card-secondary, etc.)

2. **Criar componentes novos em paralelo**
   - Não sobrescrever CSS antigo imediatamente
   - Criar `v2-card`, `v2-table`, etc.

3. **Migrar tela por tela**
   - Começar por Dashboard (impacto visual imediato)
   - Depois Cobranças e Despesas (mais usadas)
   - Por último: relatórios e configurações

4. **Remover CSS legado**
   - Após 100% das telas migradas
   - Deletar `style.css` e `style-responsive.css` antigos

### Compatibilidade Temporária

```css
/* Legacy support (remover após migração) */
.card:not(.v2-card) {
  /* CSS antigo */
}

.v2-card {
  /* CSS novo */
}
```

---

## 13. Guia de Contribuição

### Adicionando um Novo Componente

1. **Design primeiro**
   - Sketch mobile + desktop no Figma/papel
   - Validar com usuário/stakeholder

2. **Tokens CSS**
   - Usar APENAS variáveis de `tokens.css`
   - Nunca hardcoded colors/sizes

3. **Estados completos**
   ```tsx
   - [ ] Default
   - [ ] Hover (desktop)
   - [ ] Active/Pressed
   - [ ] Focus
   - [ ] Disabled
   - [ ] Loading
   - [ ] Error
   ```

4. **Documentar**
   - Adicionar exemplo neste arquivo
   - Screenshot mobile + desktop
   - Props/classes disponíveis

### Code Review Checklist

- [ ] Mobile testado em device real (não só Chrome DevTools)
- [ ] Lighthouse: Performance >90, Accessibility >95
- [ ] Sem `console.log` ou comentários TODO
- [ ] UX writing revisado (português BR natural)
- [ ] Animações <300ms
- [ ] Bundle size não aumentou >5%

---

## 14. Referências e Inspirações

### Design Systems Estudados

- **Uber Design:** https://www.uber.design/
- **Tinder UI Patterns:** (análise do app nativo)
- **Stripe Dashboard:** https://stripe.com (hierarquia de dados financeiros)
- **Linear:** https://linear.app (micro-interações suaves)

### Recursos Técnicos

- **WCAG 2.1 Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **Touch Target Size:** https://web.dev/accessible-tap-targets/
- **CSS Animations Performance:** https://web.dev/animations/

---

## Contato e Manutenção

**Última revisão:** 04/03/2026
**Responsável:** Equipe Duka
**Dúvidas:** Este documento é vivo. Atualize sempre que criar novos padrões.
