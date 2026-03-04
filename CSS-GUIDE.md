# 🎨 GUIA DE CSS - ĐUKA DESIGN SYSTEM

## 📖 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Arquivos](#estrutura-de-arquivos)
3. [Regras Obrigatórias](#regras-obrigatórias)
4. [Sistema de Cores](#sistema-de-cores)
5. [Typography](#typography)
6. [Layout & Spacing](#layout--spacing)
7. [Componentes](#componentes)
8. [Classes Utilitárias](#classes-utilitárias)
9. [Responsividade](#responsividade)
10. [Exemplos Práticos](#exemplos-práticos)

---

## Visão Geral

O **Đuka Design System** é um sistema de design completo e imutável que fornece todas as classes CSS necessárias para construir a interface do aplicativo.

### 🎯 Objetivos

- **Consistência visual** em toda a aplicação
- **Manutenibilidade** através de classes reutilizáveis
- **Produtividade** acelerada no desenvolvimento
- **Zero inline styles** no JavaScript
- **Responsividade** embutida

---

## Estrutura de Arquivos

```
public/app/
├── duka-design-system.css  ← ARQUIVO PRINCIPAL (USAR ESTE)
├── style.css               ← DEPRECADO (migrar para design system)
├── style-responsive.css    ← DEPRECADO (migrar para design system)
└── style-landing.css       ← Apenas para landing page
```

### ⚠️ IMPORTANTE

- **USAR**: `duka-design-system.css`
- **NÃO USAR**: `style.css`, `style-responsive.css` (deprecados)
- **MIGRAÇÃO**: Novos componentes devem usar apenas o Design System

---

## Regras Obrigatórias

### ❌ NUNCA FAZER

```javascript
// ❌ PROIBIDO - Inline styles
html += '<div style="color: red; padding: 10px;">Texto</div>';

// ❌ PROIBIDO - Manipulação direta de styles
element.style.backgroundColor = '#ff0000';
element.style.display = 'none';

// ❌ PROIBIDO - Criar styles dinamicamente
const style = document.createElement('style');
style.textContent = '.custom { color: red; }';
document.head.appendChild(style);
```

### ✅ SEMPRE FAZER

```javascript
// ✅ CORRETO - Usar classes do design system
html += '<div class="text-danger p-3">Texto</div>';

// ✅ CORRETO - Toggle classes
element.classList.add('hidden');
element.classList.remove('hidden');
element.classList.toggle('active');

// ✅ CORRETO - Se não existe classe, adicionar no design system PRIMEIRO
// Depois usar a nova classe
html += '<div class="minha-nova-classe">Conteúdo</div>';
```

---

## Sistema de Cores

### Paleta Principal

```css
/* Cores Primárias */
--primary-color: #2563eb     /* Azul principal */
--primary-hover: #1d4ed8     /* Azul hover */
--primary-light: rgba(37, 99, 235, 0.1)  /* Azul claro */

/* Cores de Status */
--success-color: #10b981     /* Verde sucesso */
--danger-color: #ef4444      /* Vermelho erro */
--warning-color: #f59e0b     /* Amarelo aviso */
--info-color: #3b82f6        /* Azul info */

/* Cores de Background */
--bg-primary: #ffffff        /* Branco */
--bg-secondary: #f8fafc      /* Cinza claro */
--bg-tertiary: #f1f5f9       /* Cinza */

/* Cores de Texto */
--text-primary: #1e293b      /* Preto/Cinza escuro */
--text-secondary: #64748b    /* Cinza médio */
--text-tertiary: #94a3b8     /* Cinza claro */
```

### Classes de Cor

```html
<!-- Texto -->
<p class="text-primary">Texto principal</p>
<p class="text-secondary">Texto secundário</p>
<p class="text-tertiary">Texto terciário</p>

<!-- Background -->
<div class="bg-primary">Fundo branco</div>
<div class="bg-secondary">Fundo cinza claro</div>
<div class="bg-tertiary">Fundo cinza</div>
```

---

## Typography

### Tamanhos de Fonte

| Classe | Tamanho | Uso |
|--------|---------|-----|
| `text-xs` | 11px | Tags, labels pequenas |
| `text-sm` | 12px | Legendas, descrições |
| `text-base` | 14px | Texto padrão |
| `text-lg` | 16px | Subtítulos |
| `text-xl` | 18px | Títulos seção |
| `text-2xl` | 20px | Títulos card |
| `text-3xl` | 24px | Títulos página |

### Pesos de Fonte

```html
<p class="font-normal">Texto normal (400)</p>
<p class="font-medium">Texto médio (500)</p>
<p class="font-semibold">Texto semi-negrito (600)</p>
<p class="font-bold">Texto negrito (700)</p>
```

### Alinhamento

```html
<p class="text-left">Esquerda</p>
<p class="text-center">Centro</p>
<p class="text-right">Direita</p>
```

### Transformações

```html
<p class="uppercase">MAIÚSCULAS</p>
<p class="lowercase">minúsculas</p>
<p class="capitalize">Primeira Letra Maiúscula</p>
```

---

## Layout & Spacing

### Flexbox

```html
<!-- Container flex -->
<div class="flex items-center justify-between gap-4">
  <span>Esquerda</span>
  <span>Direita</span>
</div>

<!-- Flex column -->
<div class="flex flex-col gap-3">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Gap (Espaçamento entre elementos)

| Classe | Valor | Pixels |
|--------|-------|--------|
| `gap-1` | 4px | 4px |
| `gap-2` | 8px | 8px |
| `gap-3` | 12px | 12px |
| `gap-4` | 16px | 16px |
| `gap-5` | 20px | 20px |
| `gap-6` | 24px | 24px |
| `gap-8` | 32px | 32px |

### Margin & Padding

```html
<!-- Margin -->
<div class="m-4">Margem em todos os lados</div>
<div class="mt-4">Margem no topo</div>
<div class="mb-4">Margem embaixo</div>

<!-- Padding -->
<div class="p-4">Padding em todos os lados</div>
```

---

## Componentes

### 1. Cards

```html
<div class="card">
  <div class="card-header">
    <h2>Título do Card</h2>
    <button class="btn btn-primary">Ação</button>
  </div>
  <div class="card-body">
    <p>Conteúdo do card</p>
  </div>
  <div class="card-footer">
    <button class="btn btn-secondary">Cancelar</button>
  </div>
</div>
```

### 2. Botões

```html
<!-- Variantes -->
<button class="btn btn-primary">Primário</button>
<button class="btn btn-secondary">Secundário</button>
<button class="btn btn-success">Sucesso</button>
<button class="btn btn-danger">Perigo</button>
<button class="btn btn-warning">Aviso</button>

<!-- Tamanhos -->
<button class="btn btn-primary btn-sm">Pequeno</button>
<button class="btn btn-primary">Normal</button>
<button class="btn btn-primary btn-lg">Grande</button>

<!-- Largura total -->
<button class="btn btn-primary btn-full">Botão Full Width</button>

<!-- Desabilitado -->
<button class="btn btn-primary" disabled>Desabilitado</button>
```

### 3. Badges

```html
<span class="badge badge-success">Pago</span>
<span class="badge badge-pending">Pendente</span>
<span class="badge badge-overdue">Atrasado</span>
<span class="badge badge-info">Info</span>
```

### 4. Tabelas

```html
<table class="table">
  <thead>
    <tr>
      <th>Nome</th>
      <th>Email</th>
      <th>Ações</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>João Silva</td>
      <td>joao@example.com</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-sm btn-primary">Editar</button>
          <button class="btn btn-sm btn-danger">Excluir</button>
        </div>
      </td>
    </tr>
  </tbody>
</table>
```

### 5. Formulários

```html
<form class="form-container">
  <div class="form-row">
    <div class="form-group">
      <label>Nome</label>
      <input type="text" placeholder="Digite o nome">
    </div>

    <div class="form-group">
      <label>Email</label>
      <input type="email" placeholder="Digite o email">
    </div>
  </div>

  <div class="form-group">
    <label>Descrição</label>
    <textarea placeholder="Digite a descrição"></textarea>
  </div>

  <div class="form-actions">
    <button type="button" class="btn btn-secondary">Cancelar</button>
    <button type="submit" class="btn btn-primary">Salvar</button>
  </div>
</form>
```

### 6. Modal

```html
<div id="modal" class="modal">
  <div class="modal-content">
    <button class="modal-close">×</button>
    <h2>Título do Modal</h2>
    <p>Conteúdo do modal aqui</p>
    <div class="form-actions">
      <button class="btn btn-secondary">Cancelar</button>
      <button class="btn btn-primary">Confirmar</button>
    </div>
  </div>
</div>
```

### 7. Dashboard Cards

```html
<!-- Card simples -->
<div class="dashboard-card">
  <div class="dashboard-label">Total de Inquilinos</div>
  <div class="dashboard-value">42</div>
  <div class="dashboard-subtext">3 novos este mês</div>
</div>

<!-- Card com cor de status -->
<div class="dashboard-card success">
  <div class="dashboard-label">Receita</div>
  <div class="dashboard-value">R$ 45.000</div>
</div>

<div class="dashboard-card danger">
  <div class="dashboard-label">Atrasos</div>
  <div class="dashboard-value">5</div>
</div>
```

### 8. KPI Cards

```html
<div class="dashboard-kpis">
  <div class="kpi-row">
    <div class="kpi-card">
      <div class="kpi-label">Receita Total</div>
      <div class="kpi-value">R$ 125.000</div>
      <div class="kpi-subtext">+12% vs mês anterior</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-label">Ocupação</div>
      <div class="kpi-value">95%</div>
      <div class="kpi-subtext">38 de 40 unidades</div>
    </div>
  </div>
</div>
```

### 9. Toast Notifications

```javascript
// JavaScript para criar toast
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="toast-icon fa-solid fa-check-circle"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

// Uso
showToast('Salvo com sucesso!', 'success');
showToast('Erro ao salvar', 'error');
showToast('Atenção: verifique os dados', 'warning');
```

---

## Classes Utilitárias

### Display

```html
<div class="block">Block</div>
<div class="inline-block">Inline Block</div>
<div class="flex">Flex</div>
<div class="grid">Grid</div>
<div class="hidden">Escondido</div>
```

### Width & Height

```html
<div class="w-full">Largura 100%</div>
<div class="h-full">Altura 100%</div>
```

### Cursor

```html
<div class="cursor-pointer">Cursor pointer</div>
<div class="cursor-not-allowed">Cursor not-allowed</div>
```

### Opacity

```html
<div class="opacity-0">Invisível</div>
<div class="opacity-50">50% opacidade</div>
<div class="opacity-100">Visível</div>
```

### Bordas

```html
<div class="border">Com borda</div>
<div class="border-t">Borda no topo</div>
<div class="border-b">Borda embaixo</div>

<div class="rounded">Cantos arredondados (6px)</div>
<div class="rounded-md">Cantos arredondados (8px)</div>
<div class="rounded-lg">Cantos arredondados (12px)</div>
<div class="rounded-full">Totalmente arredondado</div>
```

### Sombras

```html
<div class="shadow-sm">Sombra pequena</div>
<div class="shadow">Sombra média</div>
<div class="shadow-md">Sombra grande</div>
<div class="shadow-lg">Sombra extra grande</div>
```

---

## Responsividade

O design system é totalmente responsivo. Todos os componentes se adaptam automaticamente.

### Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Comportamento Responsivo

```html
<!-- Grid responsivo automático -->
<div class="dashboard">
  <div class="dashboard-card">Card 1</div>
  <div class="dashboard-card">Card 2</div>
  <div class="dashboard-card">Card 3</div>
</div>

<!-- Formulário responsivo -->
<div class="form-row">
  <div class="form-group">Campo 1</div>
  <div class="form-group">Campo 2</div>
</div>
```

No mobile:
- Sidebar se torna drawer lateral
- Tabelas ficam scrollable
- Form fields empilham verticalmente
- Dashboard cards ocupam largura total

---

## Exemplos Práticos

### Exemplo 1: Lista de Inquilinos

```javascript
async function renderTenantsTable(tenants) {
  let html = `
    <div class="card">
      <div class="card-header">
        <h2>Inquilinos</h2>
        <button class="btn btn-primary" data-action="add">
          <i class="fa-solid fa-plus"></i>
          Novo Inquilino
        </button>
      </div>
      <div class="card-body">
        <table class="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
  `;

  tenants.forEach(tenant => {
    html += `
      <tr>
        <td class="font-medium">${tenant.name}</td>
        <td class="text-secondary">${tenant.email}</td>
        <td class="text-secondary">${tenant.phone}</td>
        <td>
          <span class="badge ${tenant.active ? 'badge-success' : 'badge-pending'}">
            ${tenant.active ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-primary" data-action="edit" data-id="${tenant.id}">
              Editar
            </button>
            <button class="btn btn-sm btn-danger" data-action="delete" data-id="${tenant.id}">
              Excluir
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;

  return html;
}
```

### Exemplo 2: Dashboard com KPIs

```javascript
function renderDashboard(data) {
  return `
    <div class="dashboard-kpis">
      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-label">Receita Mensal</div>
          <div class="kpi-value">R$ ${formatCurrency(data.revenue)}</div>
          <div class="kpi-subtext">
            <span class="text-${data.revenueGrowth > 0 ? 'success' : 'danger'}">
              ${data.revenueGrowth > 0 ? '+' : ''}${data.revenueGrowth}%
            </span>
            vs mês anterior
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Taxa de Ocupação</div>
          <div class="kpi-value">${data.occupancyRate}%</div>
          <div class="kpi-subtext">${data.occupiedUnits} de ${data.totalUnits} unidades</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Cobranças Pendentes</div>
          <div class="kpi-value">${data.pendingCharges}</div>
          <div class="kpi-subtext">R$ ${formatCurrency(data.pendingAmount)}</div>
        </div>
      </div>
    </div>

    <div class="dashboard">
      <div class="dashboard-card success">
        <div class="dashboard-label">Pagamentos em dia</div>
        <div class="dashboard-value">${data.onTimePayments}</div>
      </div>

      <div class="dashboard-card danger">
        <div class="dashboard-label">Atrasos</div>
        <div class="dashboard-value">${data.overduePayments}</div>
      </div>

      <div class="dashboard-card warning">
        <div class="dashboard-label">Vencendo hoje</div>
        <div class="dashboard-value">${data.dueTodayPayments}</div>
      </div>
    </div>
  `;
}
```

### Exemplo 3: Formulário de Contrato

```javascript
function renderContractForm(contract = null) {
  const isEdit = contract !== null;

  return `
    <form class="form-container" id="contract-form" data-id="${contract?.id || ''}">
      <h2 class="mb-6">${isEdit ? 'Editar' : 'Novo'} Contrato</h2>

      <div class="form-row">
        <div class="form-group">
          <label>Inquilino</label>
          <select name="tenant_id" required>
            <option value="">Selecione um inquilino</option>
            <!-- opções aqui -->
          </select>
        </div>

        <div class="form-group">
          <label>Unidade</label>
          <select name="unit_id" required>
            <option value="">Selecione uma unidade</option>
            <!-- opções aqui -->
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Data de Início</label>
          <input type="date" name="start_date" value="${contract?.start_date || ''}" required>
        </div>

        <div class="form-group">
          <label>Data de Término</label>
          <input type="date" name="end_date" value="${contract?.end_date || ''}" required>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Valor Mensal (R$)</label>
          <input type="number" name="monthly_value" value="${contract?.monthly_value || ''}"
                 step="0.01" min="0" required>
        </div>

        <div class="form-group">
          <label>Dia de Vencimento</label>
          <input type="number" name="due_day" value="${contract?.due_day || '10'}"
                 min="1" max="31" required>
        </div>
      </div>

      <div class="form-group">
        <label>Observações</label>
        <textarea name="notes" rows="4">${contract?.notes || ''}</textarea>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary">
          ${isEdit ? 'Atualizar' : 'Criar'} Contrato
        </button>
      </div>
    </form>
  `;
}
```

---

## 🎓 Boas Práticas

1. **Sempre use classes do Design System**
   - Nunca crie inline styles
   - Se precisar de novo estilo, adicione no `duka-design-system.css`

2. **Seja semântico**
   - Use classes que descrevem o propósito, não a aparência
   - Ex: `badge-success` ao invés de `green-badge`

3. **Combine classes**
   - Aproveite as utilities para criar layouts complexos
   - Ex: `flex items-center justify-between gap-4`

4. **Mantenha consistência**
   - Use o mesmo padrão de componentes em todo o app
   - Siga os exemplos deste guia

5. **Responsividade é automática**
   - Confie nos breakpoints do sistema
   - Não crie media queries customizadas

---

## 📚 Recursos Adicionais

- **Arquivo principal**: `public/app/duka-design-system.css`
- **Documento de refatoração**: `REFACTOR.md`
- **Ícones**: Font Awesome 6.5.1

---

## ✅ Checklist para Novos Componentes

Antes de finalizar um componente, verifique:

- [ ] Não há inline styles (`style="..."`)
- [ ] Não há manipulação de `.style` no JavaScript
- [ ] Todas as classes existem no Design System
- [ ] O componente é responsivo
- [ ] Os espaçamentos seguem o sistema de 8px
- [ ] As cores seguem a paleta definida
- [ ] Os botões e badges usam as classes corretas
- [ ] Forms usam `form-group`, `form-row`, `form-actions`
- [ ] Cards usam `card`, `card-header`, `card-body`
- [ ] Testado em mobile e desktop

---

**Versão**: 1.0.0
**Data**: 2026-03-04
**Autor**: Equipe Đuka
