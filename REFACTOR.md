# REFACTOR PLAN – Frontend Modularization (Đuka)

## 🎯 Objetivo

Migrar gradualmente o frontend monolítico (`public/app/script.js`)
para arquitetura modular baseada em componentes isolados,
sem framework (Vanilla JS), mantendo compatibilidade total
com o sistema atual.

---

# 🧭 DEFINIÇÕES ESTRUTURAIS OBRIGATÓRIAS

## 1️⃣ Separação Definitiva de Login e SPA

- `/login` → `login.html` (isolado, sem SPA)
- `/app` → `index.html` (SPA real)

**login.html NÃO pode conter:**
- sidebar
- app-section
- componentes carregados

**index.html é o único ponto que carrega a SPA.**

---

## 2️⃣ Ponto Único de Entrada (Single Entry Point)

Somente `public/app/script.js` carregado no HTML.

❌ **NUNCA** adicionar múltiplos `<script>` por componente manualmente no HTML.

Componentes devem se auto-registrar:

```html
<!-- Apenas UMA ordem obrigatória -->
<script src="/app/script.js"></script>
```

E dentro de `script.js`, componentes são carregados e registrados via:

```javascript
window.App.register('tenants', TenantsComponent);
```

---

## 3️⃣ Registry Central de Componentes

**Adicionar no topo de script.js (ANTES de qualquer componente ser chamado):**

```javascript
window.App = {
    components: {},
    register(name, component) {
        this.components[name] = component;
        console.log(`✓ ${name} component registered`);
    },
    get(name) {
        const comp = this.components[name];
        if (!comp) {
            console.error(`✗ ${name} component not registered`);
        }
        return comp;
    }
};
```

**Cada componente deve terminar com:**

```javascript
// ❌ ERRADO:
// window.App.TenantsComponent = TenantsComponent;

// ✅ CERTO:
App.register('tenants', TenantsComponent);
```

**Chamar sempre via:**

```javascript
const tenants = App.get('tenants');
if (tenants) {
    await tenants.renderList();
}
```

---

## 4️⃣ Ordem de Inicialização (CRÍTICA)

1. DOMContentLoaded
2. App bootstrap (registry criado)
3. Carregamento de componentes (todos registrados)
4. Inicialização de listeners globais
5. Roteamento

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // 1. App registry já existe
    // 2. Todos os componentes já foram registrados
    // 3. Agora inicializar listeners
    const tenants = App.get('tenants');
    if (tenants) tenants.init();
});
```

---

## 5️⃣ Proibição de Dependência Global

Componentes **NÃO PODEM:**
- ❌ Acessar variáveis globais soltas (`token`, `currentUser`, etc)
- ❌ Acessar outros componentes diretamente
- ❌ Modificar DOM fora de `#content`
- ❌ Usar `document.addEventListener` (usar `#content` apenas)

**OBRIGATÓRIO:**
- ✅ Receber dados via parâmetros
- ✅ Usar `App.get()` para dependências
- ✅ Usar `#content` para renderização

---

## 6️⃣ Fallback Defensivo Obrigatório

**Toda chamada de função deve proteger contra componente não registrado:**

```javascript
async function loadTenants() {
    updatePageTitle('Inquilinos');
    const tenants = App.get('tenants');
    if (!tenants) {
        console.error('TenantsComponent não registrado');
        return;
    }
    await tenants.renderList();
}
```

---

## 7️⃣ Regra de CSS

- ❌ Proibido inline `style="..."`
- ✅ Toda classe nova em `style.css` ou `style-responsive.css`
- ❌ Componentes **não definem CSS via JS**

```javascript
// ❌ ERRADO:
html += '<div style="color: red;">Título</div>';

// ✅ CERTO:
html += '<div class="error-title">Título</div>';
// (classe definida em CSS)
```

---

## 8️⃣ Script.js Deve Ficar Apenas com:

- ✅ Registry / Bootstrap
- ✅ Roteamento (switch das ações)
- ✅ `updatePageTitle()`
- ✅ `logout()`
- ✅ `toggleSidebar()`
- ✅ Menu initialization
- ✅ autenticação básica (login/logout)

❌ **NUNCA:**
- ❌ HTML gigante concatenado
- ❌ Lógica complexa de renderização
- ❌ Event listeners complexos (tudo em componentes)

---

# 📌 Estado Atual

- 1 arquivo principal com ~2900+ linhas
- Renderização via string concatenation + innerHTML
- Event listeners espalhados
- CSS inline misturado no JS
- Alta duplicação de padrão entre telas

---

# 🧱 Arquitetura Alvo

```
public/
 ├── app/
 │    ├── script.js (orquestrador APENAS)
 │    ├── style.css
 │    ├── index.html (SPA única)
 │    └── login.html (login isolado)
 │
 ├── components/
 │    ├── tenants.js
 │    ├── contracts.js
 │    ├── properties.js
 │    ├── enterprises.js
 │    ├── units.js
 │    ├── charges.js
 │    ├── expenses.js
 │    ├── services.js
 │    └── dashboard.js
```

---

# 📐 Padrão Obrigatório de Cada Componente

Cada componente deve:

1. Ter namespace isolado (`const NomeComponent = { ... }`)
2. Usar event delegation apenas no container (`#content`)
3. Não usar `document.addEventListener` global
4. Não recriar listeners a cada render
5. Não usar inline styles
6. Não acessar variáveis globais diretamente
7. **Terminar com `App.register('name', NomeComponent)`**

Estrutura padrão:

```javascript
const TenantsComponent = {
    baseUrl: '/tenants',
    contentContainer: null,
    eventListenersAttached: false,

    init: function() {
        this.contentContainer = document.getElementById('content');
        if (this.contentContainer && !this.eventListenersAttached) {
            this.attachEventListeners();
            this.eventListenersAttached = true;
        }
    },

    renderList: async function() { /* ... */ },

    showForm: function(data) { /* ... */ },

    _handleFormSubmit: async function(event) { /* ... */ },

    attachEventListeners: function() { /* ... */ }
};

// ✅ SEMPRE TERMINAR COM:
App.register('tenants', TenantsComponent);
```

---

# 🔄 Processo de Refatoração por Tela

Sempre seguir este passo a passo:

1️⃣ Identificar função `loadXXX()` no script.js
2️⃣ Identificar função `showXXXForm()`
3️⃣ Identificar actions no switch principal
4️⃣ Extrair código da tela COMPLETO
5️⃣ Criar novo arquivo em `/public/components/XXX.js`
6️⃣ Mover código mantendo comportamento idêntico
7️⃣ **Terminar arquivo com `App.register('xxx', XXXComponent)`**
8️⃣ Remover inline styles e criar classes CSS em `style.css`
9️⃣ Testar manualmente fluxo completo
🔟 Adicionar `<script src="/components/xxx.js"></script>` em `script.js` (carregar antes de eventos)

**Exemplo de substituição no script.js:**

```javascript
// ❌ ANTES:
async function loadTenants() {
    // ... 200 linhas de código
}

// ✅ DEPOIS:
async function loadTenants() {
    updatePageTitle('Inquilinos');
    const tenants = App.get('tenants');
    if (!tenants) {
        console.error('TenantsComponent não registrado');
        return;
    }
    await tenants.renderList();
}
```

---

# 📌 STATUS: 2/11 Componentes (18%)

```
✅ 2 completos   → Tenants (modelo de referência), Contracts
⏳ 9 pendentes   → Escalonados em 3 fases por complexidade
```

---

# 📋 Telas a Refatorar (Ordem Recomendada)

## ✅ CONCLUÍDO (2/11)
- ✔ **Tenants** - Modelo de referência já implementado
- ✔ **Contracts** - CRUD completo + Serviços vinculados

## ⏳ PHASE 1: CRUD Simples (4/11)
- ◾ **Units** (Unidades) ← PRÓXIMO
- ⬜ **Enterprises** (Empresas)
- ⬜ **Properties** (Propriedades - legado)

## ⏳ PHASE 2: Complexidade Média (6/11)
- ⬜ **Charges** (com lógica de status)
- ⬜ **Expenses** (com filtros)
- ⬜ **Services** (com catálogo)
- ⬜ **Users** (com controle de acesso)
- ⬜ **Partners** (Sócios)
- ⬜ **Clients** (Admin only)

## ⏳ PHASE 3: Complexa (1/11)
- ⬜ **Dashboard** (gráficos, múltiplos dados)

---

# 🚫 O que NÃO Fazer

- ❌ Não migrar tudo de uma vez
- ❌ Não alterar lógica de backend
- ❌ Não mudar estrutura visual
- ❌ Não criar dependência circular entre componentes
- ❌ Não usar framework
- ❌ Não mexer em login neste momento
- ❌ Não adicionar múltiplos `<script>` no HTML manualmente
- ❌ Não usar `window.App.XXXComponent` diretamente (sempre usar `App.get()`)
- ❌ Não definir CSS via JavaScript
- ❌ Não deixar componentes acessarem `token` ou `currentUser` globalmente

---

# 🧠 Estratégia

- Refatoração incremental
- 1 tela por vez
- Sem breaking changes
- Sistema continua funcionando em produção durante o processo
- Registry central garante não há conflitos de carregamento

---
# 🔐 Regras de Módulos (Obrigatórias)

Estas regras são **invioláveis**. Qualquer violação quebra a arquitetura.

## 1️⃣ Nenhuma Variável Global

- ❌ Nunca use `window.xxx = ...`
- ❌ Nunca acesse variáveis soltas do `window`
- ✅ Sempre importe explicitamente: `import { xxx } from '/app/script.js'`

```javascript
// ❌ ERRADO:
window.apiCall = apiCall;
const resultado = apiCall('/tenants');

// ✅ CERTO:
import { apiCall } from '/app/script.js';
const resultado = await apiCall('/tenants');
```

---

## 2️⃣ Todo Helper Deve Ser Exportado

Se um componente usa uma função do `script.js`:

1. Adicione `export` na função em `script.js`
2. Importe em `components/XXX.js`

```javascript
// script.js
export function meuHelper() { ... }

// components/xxx.js
import { meuHelper } from '/app/script.js';
meuHelper();
```

---

## 3️⃣ Todo Componente Importa Explicitamente

Dependencies claras = código rastreável

```javascript
// ✅ CERTO - Dependências explícitas
import { App, apiCall, openModal, closeModal } from '/app/script.js';

const MeuComponent = { ... };
App.register('meu', MeuComponent);
```

---

## 4️⃣ renderList Garante init()

Cada componente é autossuficiente

```javascript
async renderList() {
    // 🔥 Auto-inicializa se necessário
    if (!this.contentContainer) {
        this.init();
    }
    
    // ... resto da lógica
}
```

---

## 5️⃣ HTML Nunca Muda Para Adicionar Componentes

- ❌ Nunca adicionar `<script src="/components/xxx.js">`
- ✅ Sempre usar: `const comp = await App.loadComponent('xxx')`

O `index.html` permanece **IMUTÁVEL** após estar pronto.

```html
<!-- FINAL - NUNCA MUDA MAIS -->
<script type="module" src="/app/script.js"></script>
```

---

# 📋 Template Oficial de Componente

**Todos os componentes DEVEM seguir este padrão exatamente.**

Sem variação. Sem criatividade. Sem invenção.

```javascript
// ===== [COMPONENTE] COMPONENT =====
// Descrição breve

import { App, apiCall, openModal, closeModal } from '/app/script.js';

const [Componente]Component = {
    baseUrl: '/endpoint',
    contentContainer: null,
    eventListenersAttached: false,

    /**
     * Inicializa o componente
     */
    init: function() {
        this.contentContainer = document.getElementById('content');
        if (this.contentContainer && !this.eventListenersAttached) {
            this.attachEventListeners();
            this.eventListenersAttached = true;
        }
    },

    /**
     * Renderiza listagem
     * Autossuficiente - garante init
     */
    async renderList() {
        if (!this.contentContainer) {
            this.init();
        }

        try {
            const data = await apiCall(this.baseUrl);

            let html = '<div class="card">';
            // ... montar HTML
            html += '</div>';

            this.contentContainer.innerHTML = html;
        } catch (error) {
            this.contentContainer.innerHTML = `<div class="error-message show">${error.message}</div>`;
        }
    },

    /**
     * Exibe formulário
     */
    showForm: function(item = null) {
        const form = `
            <h2>${item ? 'Editar' : 'Novo'}</h2>
            <form id="[componente]-form">
                <!-- campos aqui -->
            </form>
        `;
        openModal(form);
    },

    /**
     * Manipula submit do form
     */
    _handleFormSubmit: async function(event) {
        event.preventDefault();
        const self = this;

        try {
            const form = event.target;
            const id = form.getAttribute('data-id');

            const data = {
                // extrair dados do form
            };

            if (id) {
                await apiCall(`${this.baseUrl}/${id}`, 'PUT', data);
            } else {
                await apiCall(this.baseUrl, 'POST', data);
            }

            closeModal();
            await this.renderList();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    },

    /**
     * Event listeners com delegação
     */
    attachEventListeners: function() {
        const self = this;

        this.contentContainer.addEventListener('submit', function(e) {
            if (e.target.id === '[componente]-form') {
                self._handleFormSubmit(e);
            }
        });

        this.contentContainer.addEventListener('click', function(e) {
            const btn = e.target.closest('[data-component="[componente]"]');
            if (!btn) return;

            const action = btn.getAttribute('data-action');
            const id = btn.getAttribute('data-id');

            switch(action) {
                case 'add':
                    e.preventDefault();
                    self.showForm(null);
                    break;
                case 'edit':
                    e.preventDefault();
                    apiCall(`${self.baseUrl}/${id}`)
                        .then(item => self.showForm(item))
                        .catch(err => alert('Erro: ' + err.message));
                    break;
            }
        });
    }
};

// ✅ SEMPRE TERMINAR COM:
App.register('[componente]', [Componente]Component);
```

---

# � Status de Refatoração (Andamento)

## ✅ Concluído

- ✅ **Tenants** (Inquilinos) - Modelo de referência
- ✅ **Contracts** (Contratos) — `/public/components/contracts.js`
  - CRUD completo (criar, editar contrato)
  - Submodal de serviços vinculados ao contrato
  - Zero inline styles — usa `badge-success/pending/overdue`, `doc-link`, `table-actions`
  - `formatCurrency` e `formatDate` agora exportados de `script.js`
  - Event delegation: lista → `#content` | formulários/modal → `#modal-body`

### Fase 1: Componentes Pequenos (Esta semana)

1. ◾ **Units** (~180 linhas, CRUD simples) - PRÓXIMO
2. ◾ **Enterprises** (~150 linhas, CRUD simples)
3. ◾ **Properties** (~200 linhas, legado)

### Fase 2: Componentes Médios (Próxima semana)

5. ⬜ **Charges** (~300 linhas, com status)
6. ⬜ **Expenses** (~250 linhas, com filtros)
7. ⬜ **Services** (~200 linhas, CRUD simples)
8. ⬜ **Users** (~280 linhas, gerenciamento)
9. ⬜ **Partners** (~250 linhas, sócios)
10. ⬜ **Clients** (~300 linhas, admin only)

### Fase 3: Componentes Complexos (Última)

11. ⬜ **Dashboard** (~500+ linhas)

---

# 🔄 Ordem de Refatoração (Estratégica)

---

# 📊 Checklist de Refatoração Por Tela

Para cada tela seguir:

✅ Criar `/public/components/[componente].js`
✅ Copiar estrutura do template oficial
✅ Identificar `loadXXX()` no script.js
✅ Extrair código mantendo comportamento 100% idêntico
✅ Adicionar `export` para funções usadas no componente
✅ Ajustar `loadXXX()` para usar `App.loadComponent()`
✅ Remover inline styles → criar classes CSS
✅ Remover código antigo de `script.js`
✅ Testar manualmente fluxo completo
✅ Verificar console (zero erros/warnings)

---

# 🚫 Anti-Padrões (PROIBIDO)

❌ `window.App.XXX = Component`
❌ `<script src="/components/xxx.js">` no HTML
❌ Funções não exportadas
❌ Componentes sem `App.register()`
❌ Dependências implícitas (globais)
❌ Listeners recreados a cada render
❌ Inline styles em componentes
❌ HTML alterado para adicionar componentes

---
# � Registry Central Obrigatório

**A partir desta etapa, nenhum componente deve ser incluído manualmente no HTML.**

O carregamento será dinâmico via:

```javascript
const comp = await App.loadComponent('nome');
```

## Implementação do Registry

**No topo de `script.js`:**

```javascript
const App = {
    components: {},

    register(name, component) {
        this.components[name] = component;
    },

    get(name) {
        return this.components[name];
    },

    async loadComponent(name) {
        if (this.components[name]) {
            return this.components[name];
        }

        try {
            await import(`/components/${name}.js`);
            return this.components[name];
        } catch (err) {
            console.error(`Erro ao carregar componente ${name}`, err);
            return null;
        }
    }
};

window.App = App;
```

## Regras Obrigatórias

- ✅ Apenas 1 `<script type="module" src="/app/script.js"></script>` no `index.html`
- ✅ Todo componente deve finalizar com: `App.register('nome', NomeComponent);`
- ❌ Nunca usar: `window.App.NomeComponent = ...`
- ❌ Nunca adicionar `<script src="/components/...">` manualmente
- ✅ Sempre usar: `const comp = await App.loadComponent('nome');`

## Exemplo de Componente Moderno

```javascript
const MeuComponent = {
    // ... lógica
};

// Ao final do arquivo:
App.register('meu', MeuComponent);
```

## Exemplo de Uso

```javascript
async function loadMeuComponente() {
    updatePageTitle('Meu Componente');
    
    const comp = await App.loadComponent('meu');
    
    if (!comp) {
        console.error('MeuComponent não carregado');
        return;
    }
    
    await comp.renderList();
}
```

## Resultado Arquitetural

- ✅ 1 único `<script>` no HTML
- ✅ Carregamento sob demanda
- ✅ Sem enxame de scripts
- ✅ Escalável para N componentes
- ✅ Desacoplamento total
- ✅ Mini framework modular próprio

Agora você pode escalar para:

- `contracts.js`
- `dashboard.js`
- `charges.js`
- `expenses.js`
- `properties.js`
- ... N componentes

**Sem tocar no HTML nunca mais.**

---

# 🎨 INTEGRAÇÃO CSS — Design System v2 (Mobile-First)

## Status: ✅ Design System v2 Ativo (04/03/2026)

**Fonte da verdade visual:** [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)

### Ordem de carregamento de CSS (`index.html`)

```
public/app/tokens.css          ← v2: VARIÁVEIS (carregar primeiro — sempre)
public/app/style-responsive.css  ← LEGADO: tabelas responsivas (data-label) — manter até migração completa
public/app/duka-design-system.css ← LEGADO: bridge — usar apenas o que v2 não cobre ainda
public/app/components-v2.css   ← v2: COMPONENTES (carrega por último — prevalece sobre legado)
```

**Regra:** quando houver conflito de classes, `components-v2.css` vence.

---

## 🎯 Regras de Ouro CSS (v2)

> **Fonte única de verdade: [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)**

```
❌ NUNCA  style="..."  (inline)
❌ NUNCA  cores hardcoded  (#3B82F6, rgb(...))
❌ NUNCA  tamanhos hardcoded  (16px, 1.5rem)
❌ NUNCA  criar nova classe sem checar tokens.css e components-v2.css
✅ SEMPRE  var(--primary-600), var(--text-lg), var(--space-4)
✅ SEMPRE  classes semânticas do components-v2.css
✅ SEMPRE  mobile-first: base mobile → @media (min-width: 640px) → 1024px
```

---

## 📦 Arquivos do Design System v2

| Arquivo | Caminho | Uso |
|---|---|---|
| Bíblia visual | `DESIGN_SYSTEM.md` | Leia antes de qualquer decisão visual |
| Variáveis CSS | `public/app/tokens.css` | `var(--primary-600)`, `var(--space-4)`, etc. |
| Componentes v2 | `public/app/components-v2.css` | `.badge-success`, `.metric-card`, `.empty-state`, etc. |
| Legado (manter) | `public/app/style-responsive.css` | Tabelas `data-label` no mobile |
| Legado (deprecar) | `public/app/duka-design-system.css` | Bridge — remover quando todas as telas migrarem |

---

## 📋 Nomenclatura Obrigatória (v2)

| Tipo | Classe v2 (usar) | Legado (não criar mais) |
|---|---|---|
| Badge pago / sucesso | `badge badge-success` | — |
| Badge pendente / aviso | `badge badge-warning` | `badge-pending` |
| Badge atrasado / perigo | `badge badge-danger` | `badge-overdue` |
| Badge neutro | `badge badge-gray` | — |
| Botão pequeno | `btn btn-sm` | `btn-small` |
| Botão full width | `btn btn-full` | — |
| Estado vazio estruturado | `.empty-state > .empty-icon + .empty-title + .empty-text` | `<p class="empty-state">` simples |
| Métrica grande | `metric-card > metric-label + metric-value` | — |
| Ações na tabela | `table-actions td-actions` (ambas para mobile) | somente `td-actions` |
| Link documento | `doc-link` | inline style |
| Campo somente-leitura | `input[readonly]` (CSS nativo via tokens) | `style="background: ..."` |
| Texto secundário | `text-secondary` | inline `color` |

---

## 🧱 Template HTML v2 de Cada Tela

```javascript
// ✅ PADRÃO OBRIGATÓRIO – Tela com lista
let html = `
    <div class="card">
        <div class="card-header">
            <h2>Título da Tela</h2>
            <small class="card-header-description">Descrição opcional</small>
            <button class="btn btn-primary btn-sm"
                    data-component="nome" data-action="add">
                + Adicionar [item]
            </button>
        </div>
        <div class="card-body">
            <table class="table">
                <thead><tr><th>Coluna</th><th>Ações</th></tr></thead>
                <tbody>
                    <tr>
                        <td data-label="Coluna">valor</td>
                        <td class="table-actions td-actions">
                            <button class="btn btn-sm btn-secondary"
                                    data-component="nome" data-action="edit"
                                    data-id="${item.id}">Editar</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>`;

// ✅ PADRÃO OBRIGATÓRIO – Empty state
let emptyHtml = `
    <div class="empty-state">
        <span class="empty-icon" aria-hidden="true">📋</span>
        <p class="empty-title">Sem [itens] ainda</p>
        <p class="empty-text">Adicione [itens] para começar.</p>
        <button class="btn btn-primary btn-sm"
                data-component="nome" data-action="add">
            + Adicionar [item]
        </button>
    </div>`;
```

---

## 📐 UX Writing Obrigatório (Português BR Natural)

| Contexto | ❌ Não usar | ✅ Usar |
|---|---|---|
| Empty state | "Nenhum registro encontrado" | "Sem [itens] ainda" |
| Empty state | "Lista vazia" | "Tá tudo pago! 🎉" / "Nenhuma cobrança por aqui" |
| Erro geral | "Erro ao processar requisição" | "Não conseguimos salvar. Tenta de novo?" |
| Sucesso | "Operação realizada com sucesso" | "Tá guardado" / "Cobrança criada!" |
| Botão criar | "Criar novo" | "Adicionar [item]" |
| Botão cancelar | "Cancelar operação" | "Deixa pra depois" |

---

## 🚀 Workflow de Refatoração por Tela (v2)

Para cada tela pendente, seguir esta ordem:

1. Ler [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) (fonte da verdade)
2. Ler `public/app/tokens.css` (variáveis disponíveis)
3. Ler `public/app/components-v2.css` (classes disponíveis)
4. Criar `/public/components/[nome].js` baseado em `tenants.js` como modelo
5. Zero inline styles — usar APENAS variáveis de `tokens.css` + classes de `components-v2.css`
6. Empty states com estrutura completa (`.empty-icon + .empty-title + .empty-text`)
7. UX writing em português BR natural (ver tabela acima)
8. Testar: mobile 375px → tablet 768px → desktop 1280px (touch targets ≥ 48px)
9. Commit por componente
10. Atualizar tabela de status abaixo

---

## 📊 Status das Telas (CSS v2)

### ✅ Concluído

| Tela | Arquivo | CSS v2 |
|---|---|---|
| Tenants | `/public/components/tenants.js` | ✅ empty-state estruturado, tokens v2 |
| Contracts | `/public/components/contracts.js` | ✅ badge-warning/danger, empty-state, tokens v2 |

### ⏳ Phase 1 — CRUD Simples

| Tela | Arquivo | Status |
|---|---|---|
| Units | `/public/components/units.js` | ⬜ Pendente ← PRÓXIMO |
| Enterprises | `/public/components/enterprises.js` | ⬜ Pendente |
| Properties | `/public/components/properties.js` | ⬜ Pendente |

### ⏳ Phase 2 — Complexidade Média

| Tela | Arquivo | Status |
|---|---|---|
| Charges | `/public/components/charges.js` | ⬜ Pendente |
| Expenses | `/public/components/expenses.js` | ⬜ Pendente |
| Services | `/public/components/services.js` | ⬜ Pendente |
| Users | `/public/components/users.js` | ⬜ Pendente |
| Partners | `/public/components/partners.js` | ⬜ Pendente |
| Clients | `/public/components/clients.js` | ⬜ Pendente |

### ⏳ Phase 3 — Complexa

| Tela | Arquivo | Status |
|---|---|---|
| Dashboard | `/public/components/dashboard.js` | ⬜ Pendente |

---

## 🔁 Prompt Genérico para Próxima Tela

```
Estamos seguindo rigorosamente o documento REFACTOR.md como fonte única de verdade.
1. Leia o REFACTOR.md.
2. Identifique qual foi a última tela refatorada.
3. Selecione automaticamente a próxima tela pendente na ordem definida.
4. Refatore apenas essa tela.
5. Atualize o REFACTOR.md marcando-a como concluída.

Regras obrigatórias (não violar):
- Não alterar arquitetura, backend, layout, login, index.html.
- Não adicionar novos <script>.
- Não usar variáveis globais, window.*, document.addEventListener global.
- Usar event delegation dentro de #content.
- Seguir exatamente o padrão de TenantsComponent.
- Usar ES Modules com import explícito.
- Registrar via App.register('nome', NomeComponent).
- renderList() deve garantir init().
- Manter comportamento idêntico ao atual.
- Substituir no script.js apenas a função loadXXX correspondente.

CSS obrigatório (Design System v2):
- Fonte da verdade visual: DESIGN_SYSTEM.md
- Variáveis: public/app/tokens.css (var(--primary-600), var(--space-4), etc.)
- Componentes: public/app/components-v2.css (classes usáveis)
- ZERO inline styles
- ZERO cores ou tamanhos hardcoded
- Empty states com estrutura: .empty-state > .empty-icon + .empty-title + .empty-text + .btn
- UX writing em português BR natural (ver tabela de UX Writing no REFACTOR.md)
- Badges: badge-success / badge-warning / badge-danger / badge-gray
- Mobile-first: touch target ≥ 48px em botões de ação

Entregar somente:
1. Arquivo completo do novo componente.
2. Trecho exato a substituir no script.js.
3. Atualização objetiva do REFACTOR.md marcando como concluído. Nada além disso.
```

---

## 📝 Checklist de Aceite por Tela (v2)

- [ ] Componente criado em `/public/components/`
- [ ] Zero inline `style="..."` no HTML gerado
- [ ] Zero cores/tamanhos hardcoded (só `var(--...)`)
- [ ] Empty state com `.empty-icon + .empty-title + .empty-text`
- [ ] UX writing BR natural (sem "Nenhum resultado encontrado")
- [ ] Badges usando `badge-success/warning/danger/gray` (não `pending/overdue`)
- [ ] `load[Nome]()` em script.js → thin wrapper via `App.loadComponent()`
- [ ] Funcionalidade 100% preservada
- [ ] Testado em mobile 375px e desktop 1280px
- [ ] Console sem erros
- [ ] Tabela de status acima atualizada de ⬜ para ✅

---

