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

# � STATUS: 1/11 Componentes (9%)

```
✅ 1 completo    → Tenants (modelo de referência)
⏳ 10 pendentes  → Escalonados em 3 fases por complexidade
```

---

# 📋 Telas a Refatorar (Ordem Recomendada)

## ✅ CONCLUÍDO (1/11)
- ✔ **Tenants** - Modelo de referência já implementado

## ⏳ PHASE 1: CRUD Simples (4/11)
- ⬜ **Contracts** ← PRÓXIMO (extração ~200 linhas)
- ⬜ **Units** (Unidades)
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

### Fase 1: Componentes Pequenos (Esta semana)

1. ⬜ **Contracts** (~200 linhas, CRUD simples) - PRÓXIMO
2. ⬜ **Units** (~180 linhas, CRUD simples)
3. ⬜ **Enterprises** (~150 linhas, CRUD simples)
4. ⬜ **Properties** (~200 linhas, legado)

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

