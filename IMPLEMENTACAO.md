# 🚀 GUIA DE IMPLEMENTAÇÃO - ĐUKA REFACTOR

## 📋 Visão Geral

Este documento fornece instruções passo a passo para a equipe implementar a refatoração do sistema Đuka.

---

## 🎯 Objetivos da Refatoração

1. **Modularizar** o monólito de ~2900 linhas em componentes reutilizáveis
2. **Eliminar** inline styles e CSS espalhado pelo JavaScript
3. **Centralizar** todo o CSS em um Design System unificado
4. **Melhorar** a manutenibilidade e escalabilidade do código
5. **Manter** 100% de compatibilidade com o sistema atual

---

## 📁 Estrutura de Arquivos Criada

```
public/app/
├── duka-design-system.css     ← CSS GLOBAL (NOVO - USAR ESTE)
├── index.html                 ← Atualizado para usar design system
├── script.js                  ← Orquestrador principal
├── style.css                  ← DEPRECADO (não usar mais)
└── style-responsive.css       ← DEPRECADO (não usar mais)

Documentação/
├── REFACTOR.md                ← Plano de refatoração (ATUALIZADO)
├── CSS-GUIDE.md              ← Guia completo de CSS
└── IMPLEMENTACAO.md          ← Este arquivo
```

---

## 🎨 Design System Implementado

### Arquivo: `public/app/duka-design-system.css`

Um sistema de design completo com:

- ✅ **Design Tokens**: Cores, espaçamentos, tipografia
- ✅ **Componentes**: Cards, botões, badges, forms, tables, modals
- ✅ **Layout Utilities**: Flexbox, grid, spacing
- ✅ **Responsividade**: Breakpoints automáticos
- ✅ **Estados**: Hover, active, disabled, loading
- ✅ **Temas**: Cores consistentes em toda aplicação

### Como Usar

**SEMPRE use classes do design system:**

```javascript
// ❌ ERRADO
html += '<div style="color: red; padding: 10px;">Erro</div>';

// ✅ CERTO
html += '<div class="text-danger p-3">Erro</div>';
```

---

## 🔧 Passo a Passo para Refatorar um Componente

### 1. Escolher Componente

Seguir ordem do `REFACTOR.md`:
- ✅ Tenants (já feito - usar como referência)
- ⏳ Contracts (próximo)
- ⏳ Units
- ⏳ Enterprises
- ... (ver lista completa no REFACTOR.md)

### 2. Criar Arquivo do Componente

```bash
# Criar arquivo em public/components/
touch public/components/contracts.js
```

### 3. Copiar Template Base

```javascript
// ===== CONTRACTS COMPONENT =====
// Gerenciamento de contratos

import { App, apiCall, openModal, closeModal } from '/app/script.js';

const ContractsComponent = {
    baseUrl: '/contracts',
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
     */
    async renderList() {
        if (!this.contentContainer) {
            this.init();
        }

        try {
            const data = await apiCall(this.baseUrl);

            let html = `
                <div class="card">
                    <div class="card-header">
                        <h2>Contratos</h2>
                        <button class="btn btn-primary"
                                data-component="contracts"
                                data-action="add">
                            <i class="fa-solid fa-plus"></i>
                            Novo Contrato
                        </button>
                    </div>
                    <div class="card-body">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Inquilino</th>
                                    <th>Unidade</th>
                                    <th>Início</th>
                                    <th>Término</th>
                                    <th>Valor</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            data.forEach(item => {
                html += `
                    <tr>
                        <td class="font-medium">${item.tenant_name}</td>
                        <td class="text-secondary">${item.unit_name}</td>
                        <td class="text-secondary">${formatDate(item.start_date)}</td>
                        <td class="text-secondary">${formatDate(item.end_date)}</td>
                        <td class="font-medium">R$ ${formatCurrency(item.monthly_value)}</td>
                        <td>
                            <div class="table-actions">
                                <button class="btn btn-sm btn-primary"
                                        data-component="contracts"
                                        data-action="edit"
                                        data-id="${item.id}">
                                    Editar
                                </button>
                                <button class="btn btn-sm btn-danger"
                                        data-component="contracts"
                                        data-action="delete"
                                        data-id="${item.id}">
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

            this.contentContainer.innerHTML = html;
        } catch (error) {
            this.contentContainer.innerHTML = `
                <div class="error-message show">${error.message}</div>
            `;
        }
    },

    /**
     * Exibe formulário
     */
    showForm: function(item = null) {
        const isEdit = item !== null;

        const form = `
            <h2>${isEdit ? 'Editar' : 'Novo'} Contrato</h2>
            <form id="contracts-form" data-id="${item?.id || ''}">
                <div class="form-row">
                    <div class="form-group">
                        <label>Inquilino</label>
                        <select name="tenant_id" required>
                            <option value="">Selecione</option>
                            <!-- Carregar opções via API -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Unidade</label>
                        <select name="unit_id" required>
                            <option value="">Selecione</option>
                            <!-- Carregar opções via API -->
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Data Início</label>
                        <input type="date" name="start_date"
                               value="${item?.start_date || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Data Término</label>
                        <input type="date" name="end_date"
                               value="${item?.end_date || ''}" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Valor Mensal (R$)</label>
                        <input type="number" name="monthly_value"
                               value="${item?.monthly_value || ''}"
                               step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Dia Vencimento</label>
                        <input type="number" name="due_day"
                               value="${item?.due_day || '10'}"
                               min="1" max="31" required>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary"
                            onclick="closeModal()">
                        Cancelar
                    </button>
                    <button type="submit" class="btn btn-primary">
                        ${isEdit ? 'Atualizar' : 'Criar'}
                    </button>
                </div>
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
            const formData = new FormData(form);

            const data = {
                tenant_id: formData.get('tenant_id'),
                unit_id: formData.get('unit_id'),
                start_date: formData.get('start_date'),
                end_date: formData.get('end_date'),
                monthly_value: parseFloat(formData.get('monthly_value')),
                due_day: parseInt(formData.get('due_day'))
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

        // Submit de formulário
        this.contentContainer.addEventListener('submit', function(e) {
            if (e.target.id === 'contracts-form') {
                self._handleFormSubmit(e);
            }
        });

        // Clicks em botões
        this.contentContainer.addEventListener('click', function(e) {
            const btn = e.target.closest('[data-component="contracts"]');
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

                case 'delete':
                    e.preventDefault();
                    if (confirm('Confirma exclusão?')) {
                        apiCall(`${self.baseUrl}/${id}`, 'DELETE')
                            .then(() => self.renderList())
                            .catch(err => alert('Erro: ' + err.message));
                    }
                    break;
            }
        });
    }
};

// ✅ SEMPRE TERMINAR COM:
App.register('contracts', ContractsComponent);
```

### 4. Remover Inline Styles

Procurar e substituir todos os inline styles por classes:

```javascript
// ❌ ANTES
html += '<div style="display: flex; gap: 10px; padding: 20px;">';

// ✅ DEPOIS
html += '<div class="flex gap-3 p-5">';
```

**Mapeamento comum:**

| Inline Style | Classe Design System |
|-------------|---------------------|
| `style="display: flex;"` | `class="flex"` |
| `style="gap: 12px;"` | `class="gap-3"` |
| `style="padding: 20px;"` | `class="p-5"` |
| `style="margin-bottom: 16px;"` | `class="mb-4"` |
| `style="color: #64748b;"` | `class="text-secondary"` |
| `style="font-weight: 600;"` | `class="font-semibold"` |
| `style="text-align: center;"` | `class="text-center"` |
| `style="border-radius: 8px;"` | `class="rounded-md"` |

### 5. Atualizar script.js

No arquivo principal `script.js`, adicionar a função de carregamento:

```javascript
async function loadContracts() {
    updatePageTitle('Contratos');

    const contracts = await App.loadComponent('contracts');

    if (!contracts) {
        console.error('ContractsComponent não carregado');
        return;
    }

    await contracts.renderList();
}
```

### 6. Testar

1. Abrir aplicação no navegador
2. Navegar para a tela do componente
3. Testar todas as funcionalidades:
   - Listagem
   - Criar novo
   - Editar existente
   - Excluir
   - Validações
4. Verificar console (zero erros)
5. Testar em mobile (responsividade)

### 7. Commit

```bash
git add public/components/contracts.js
git add public/app/script.js
git commit -m "refactor: extract Contracts component"
```

---

## 📝 Checklist de Qualidade

Antes de considerar um componente completo:

### CSS
- [ ] Zero inline styles (`style="..."`)
- [ ] Zero manipulação de `.style` no JS
- [ ] Todas as classes existem no `duka-design-system.css`
- [ ] Classes semânticas e reutilizáveis

### JavaScript
- [ ] Componente segue template padrão
- [ ] Usa event delegation (não recria listeners)
- [ ] Termina com `App.register('name', Component)`
- [ ] Não acessa variáveis globais diretamente
- [ ] Imports explícitos no topo

### Funcionalidade
- [ ] Listagem funciona
- [ ] Criar funciona
- [ ] Editar funciona
- [ ] Excluir funciona
- [ ] Validações funcionam
- [ ] Mensagens de erro aparecem

### UX
- [ ] Responsivo em mobile
- [ ] Botões tem feedback visual
- [ ] Loading states quando necessário
- [ ] Confirmações para ações destrutivas

### Código
- [ ] Sem console.logs desnecessários
- [ ] Sem código comentado
- [ ] Nomes de variáveis descritivos
- [ ] Funções com responsabilidade única

---

## 🎓 Convenções do Projeto

### Nomenclatura

**Arquivos:**
- Componentes: `lowercase-kebab.js` (ex: `contract-services.js`)
- CSS: `lowercase-kebab.css`

**Classes CSS:**
- Utilities: `lowercase-hyphen` (ex: `text-center`)
- Componentes: `component-element` (ex: `card-header`)
- Estados: `state-name` (ex: `is-active`, `has-error`)

**JavaScript:**
- Componentes: `PascalCaseComponent` (ex: `ContractsComponent`)
- Funções: `camelCase` (ex: `renderList`)
- Privadas: `_camelCase` (ex: `_handleSubmit`)
- Constantes: `UPPER_SNAKE_CASE` (ex: `API_BASE_URL`)

### Estrutura de Componente

Sempre seguir esta ordem:

1. Comentário de cabeçalho
2. Imports
3. Objeto do componente:
   - Propriedades (baseUrl, containers, flags)
   - init()
   - renderList()
   - showForm()
   - _handleFormSubmit()
   - _outros métodos privados
   - attachEventListeners()
4. App.register()

### Comentários

```javascript
/**
 * Descrição do que a função faz
 * @param {type} param - descrição
 * @returns {type} descrição
 */
```

---

## 🚨 Problemas Comuns e Soluções

### Problema: Componente não carrega

**Causa**: Não registrado ou erro de import

**Solução**:
```javascript
// Verificar se termina com:
App.register('nome', NomeComponent);

// Verificar imports:
import { App, apiCall } from '/app/script.js';
```

### Problema: Estilos não aplicam

**Causa**: Classe não existe no design system

**Solução**:
1. Verificar se classe existe em `duka-design-system.css`
2. Se não existe, adicionar lá PRIMEIRO
3. Usar a classe no componente

### Problema: Event listeners não funcionam

**Causa**: Listeners não anexados ou recreation

**Solução**:
```javascript
// Usar event delegation
attachEventListeners: function() {
    this.contentContainer.addEventListener('click', function(e) {
        const btn = e.target.closest('[data-component="nome"]');
        if (!btn) return;
        // ... handle
    });
}
```

### Problema: Dados não carregam

**Causa**: Erro na chamada da API

**Solução**:
```javascript
try {
    const data = await apiCall(this.baseUrl);
    // ... processar
} catch (error) {
    console.error('Erro ao carregar:', error);
    // Mostrar mensagem ao usuário
}
```

---

## 📚 Recursos

### Documentação
- `REFACTOR.md` - Plano completo de refatoração
- `CSS-GUIDE.md` - Guia de uso do Design System
- `IMPLEMENTACAO.md` - Este arquivo

### Referências
- Componente Tenants: `public/components/tenants.js` (já implementado)
- Design System: `public/app/duka-design-system.css`

### Ferramentas
- VS Code: Extensões recomendadas
  - ESLint
  - Prettier
  - CSS Peek
  - Auto Rename Tag

---

## 🎯 Ordem de Implementação Recomendada

### Semana 1: CRUD Simples
1. ✅ Tenants (completo - referência)
2. ⏳ Contracts
3. ⏳ Units
4. ⏳ Enterprises

### Semana 2: Complexidade Média
5. ⏳ Charges
6. ⏳ Expenses
7. ⏳ Services
8. ⏳ Users

### Semana 3: Avançados
9. ⏳ Partners
10. ⏳ Clients
11. ⏳ Dashboard

---

## ✅ Resultado Esperado

Ao final da refatoração:

- ✅ **Zero inline styles** em todo o código JavaScript
- ✅ **CSS centralizado** em um único arquivo de design system
- ✅ **Componentes modulares** e reutilizáveis
- ✅ **Código manutenível** e escalável
- ✅ **100% funcional** - nenhuma quebra de funcionalidade
- ✅ **Documentação completa** para novos desenvolvedores
- ✅ **Base sólida** para futuras features

---

## 🤝 Suporte

Dúvidas durante a implementação:

1. Consultar `CSS-GUIDE.md` para questões de estilo
2. Consultar `REFACTOR.md` para arquitetura
3. Ver componente Tenants como referência
4. Abrir issue/discussão no repositório

---

**Boa refatoração! 🚀**

Versão: 1.0.0
Data: 2026-03-04
