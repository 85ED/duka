// ===== EXPENSES COMPONENT =====
// Módulo isolado para gerenciamento de despesas
// Event delegation: lista → #content | formulários no modal → #modal-body

import { App, apiCall, openModal, closeModal, showToast, formatCurrency, formatDate } from '/app/script.js';

const ExpensesComponent = {
    baseUrl: '/expenses',
    contentContainer: null,
    eventListenersAttached: false,
    modalListenersAttached: false,
    _allExpenses: [],

    init() {
        this.contentContainer = document.getElementById('content');
        if (this.contentContainer && !this.eventListenersAttached) {
            this.attachEventListeners();
            this.eventListenersAttached = true;
        }
        if (!this.modalListenersAttached) {
            this.attachModalListeners();
            this.modalListenersAttached = true;
        }
    },

    // ─── Renderização ────────────────────────────────────────────

    async renderList() {
        if (!this.contentContainer) this.init();

        try {
            const expenses = await apiCall(this.baseUrl);
            if (!expenses || !Array.isArray(expenses)) throw new Error('Resposta inválida da API de despesas');

            this._allExpenses = expenses;

            const pendingCount = expenses.filter(e => e.status === 'pending').length;
            const paidCount    = expenses.filter(e => e.status === 'paid').length;

            let html = `
                <div class="card">
                    <div class="card-header">
                        <h2>Despesas (${expenses.length} encontradas)</h2>
                        <button class="btn btn-primary btn-sm" data-component="expenses" data-action="add">+ Nova Despesa</button>
                        <select id="expense-status-filter" class="filter-select" data-component="expenses" data-action="filter">
                            <option value="">Todas (${expenses.length})</option>
                            <option value="pending">Pendentes (${pendingCount})</option>
                            <option value="paid">Pagas (${paidCount})</option>
                        </select>
                    </div>
                    <div class="card-body">`;

            html += this._buildTable(expenses);
            html += '</div></div>';
            this.contentContainer.innerHTML = html;
        } catch (error) {
            this.contentContainer.innerHTML = `<div class="error-message show">${error.message}</div>`;
        }
    },

    _buildTable(list) {
        if (list.length === 0) {
            return `
                <div class="empty-state">
                    <span class="empty-icon" aria-hidden="true">📊</span>
                    <p class="empty-title">Nenhuma despesa encontrada</p>
                    <p class="empty-text">Registre uma despesa para acompanhar os gastos.</p>
                </div>`;
        }

        let html = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Empreendimento</th>
                        <th>Categoria</th>
                        <th>Descrição</th>
                        <th>Valor</th>
                        <th>Data</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>`;

        list.forEach(ex => {
            const badge = `<span class="badge badge-${ex.status}">${ex.status}</span>`;
            const cat   = ex.category || 'Outros';

            html += `<tr>
                <td data-label="Empreendimento">${ex.property_address || 'Geral'}</td>
                <td data-label="Categoria"><span class="category-tag">${cat}</span></td>
                <td data-label="Descrição">${ex.description}</td>
                <td data-label="Valor">${formatCurrency(ex.amount)}</td>
                <td data-label="Data">${formatDate(ex.expense_date)}</td>
                <td data-label="Status">${badge}</td>
                <td data-label="Ações" class="td-actions">
                    ${ex.status === 'pending' ? `<button class="btn btn-sm btn-success" data-component="expenses" data-action="mark-paid" data-id="${ex.id}">Baixar</button>` : ''}
                </td>
            </tr>`;
        });

        html += '</tbody></table>';
        return html;
    },

    _filterByStatus(status) {
        const filtered = status ? this._allExpenses.filter(e => e.status === status) : this._allExpenses;
        const tableContainer = this.contentContainer.querySelector('.card-body');
        if (tableContainer) tableContainer.innerHTML = this._buildTable(filtered);
    },

    async showForm() {
        try {
            const properties = await apiCall('/properties');

            let propOptions = '<option value="">Despesa geral (sem propriedade)</option>';
            properties.forEach(p => {
                propOptions += `<option value="${p.id}">${p.address}</option>`;
            });

            const form = `
                <h2>Nova Despesa</h2>
                <form id="expense-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Propriedade</label>
                            <select id="exp-prop-id">${propOptions}</select>
                        </div>
                        <div class="form-group">
                            <label>Categoria</label>
                            <select id="exp-category">
                                <option value="">Selecione...</option>
                                <option value="Água">Água</option>
                                <option value="Luz">Luz</option>
                                <option value="Energia">Energia</option>
                                <option value="Internet">Internet</option>
                                <option value="Manutenção">Manutenção</option>
                                <option value="Limpeza">Limpeza</option>
                                <option value="Condomínio">Condomínio</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Descrição *</label>
                            <input type="text" id="exp-description" required>
                        </div>
                        <div class="form-group">
                            <label>Valor *</label>
                            <input type="number" id="exp-amount" step="0.01" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Data *</label>
                            <input type="date" id="exp-date" required>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" data-modal-cancel>Cancelar</button>
                        <button type="submit" class="btn btn-primary">Registrar</button>
                    </div>
                </form>`;

            openModal(form);
        } catch (error) {
            alert('Erro ao carregar propriedades: ' + error.message);
        }
    },

    async _markPaid(expenseId) {
        try {
            await apiCall(`${this.baseUrl}/${expenseId}/pay`, 'PATCH');
            showToast('Despesa baixada com sucesso', 'success');
            await this.renderList();
        } catch (error) {
            showToast('Erro: ' + error.message, 'error');
        }
    },

    // ─── Event Listeners ─────────────────────────────────────────

    attachEventListeners() {
        const self = this;

        this.contentContainer.addEventListener('click', function (e) {
            const btn = e.target.closest('[data-component="expenses"]');
            if (!btn) return;
            e.preventDefault();

            const action = btn.getAttribute('data-action');
            const id     = btn.getAttribute('data-id');

            switch (action) {
                case 'add':       self.showForm(); break;
                case 'mark-paid': self._markPaid(parseInt(id)); break;
            }
        });

        this.contentContainer.addEventListener('change', function (e) {
            if (e.target.id === 'expense-status-filter') {
                self._filterByStatus(e.target.value);
            }
        });
    },

    attachModalListeners() {
        const self = this;
        const modalBody = document.getElementById('modal-body');
        if (!modalBody) return;

        modalBody.addEventListener('submit', async function (e) {
            if (e.target.id !== 'expense-form') return;
            e.preventDefault();

            try {
                await apiCall('/expenses', 'POST', {
                    property_id:  document.getElementById('exp-prop-id').value || null,
                    category:     document.getElementById('exp-category').value,
                    description:  document.getElementById('exp-description').value,
                    amount:       parseFloat(document.getElementById('exp-amount').value),
                    expense_date: document.getElementById('exp-date').value
                });
                closeModal();
                showToast('Despesa registrada!', 'success');
                await self.renderList();
            } catch (error) {
                alert('Erro: ' + error.message);
            }
        });
    }
};

App.register('expenses', ExpensesComponent);
