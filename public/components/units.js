// ===== UNITS COMPONENT =====
// Gerenciamento de Unidades: listagem, cadastro e edição

import { App, apiCall, openModal, closeModal, showToast, formatCurrency } from '/app/script.js';

const UnitsComponent = {
    baseUrl: '/units',
    contentContainer: null,
    eventListenersAttached: false,

    /**
     * Inicializa o componente
     */
    init() {
        this.contentContainer = document.getElementById('content');
        if (this.contentContainer && !this.eventListenersAttached) {
            this.attachEventListeners();
            this.eventListenersAttached = true;
        }
    },

    /**
     * Renderiza listagem de unidades
     * Aceita filtro opcional por empresa
     */
    async renderList(enterpriseId = null) {
        if (!this.contentContainer) this.init();

        try {
            let url = this.baseUrl;
            if (enterpriseId) url += `?enterpriseId=${enterpriseId}`;

            const [units, enterprises] = await Promise.all([
                apiCall(url),
                apiCall('/enterprises')
            ]);

            let html = `
                <div class="card">
                    <div class="card-header">
                        <h2>Minhas Unidades</h2>
                        <small class="card-subtitle">Cada casa ou apartamento que você aluga. Veja quem mora em cada uma e quando o contrato termina.</small>
                        <button class="btn btn-primary btn-sm" data-component="units" data-action="add">
                            + Nova Unidade
                        </button>
                    </div>
                    <div class="card-body">`;

            if (units.length === 0) {
                html += `
                    <div class="empty-state">
                        <span class="empty-icon" aria-hidden="true">🏢</span>
                        <p class="empty-title">Nenhuma unidade cadastrada</p>
                        <p class="empty-text">Cadastre sua primeira unidade para começar a gerenciar os aluguéis.</p>
                        <button class="btn btn-primary" data-component="units" data-action="add">+ Nova Unidade</button>
                    </div>`;
            } else {
                html += `
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Empreendimento</th>
                                <th>Unidade</th>
                                <th>Status</th>
                                <th>Inquilino</th>
                                <th>Aluguel</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>`;

                units.forEach(u => {
                    html += `<tr>
                        <td data-label="Empreendimento" class="card-subtitle">${u.enterprise_name}</td>
                        <td data-label="Unidade"><strong class="card-title">${u.identifier}</strong></td>
                        <td data-label="Status">${this._getStatusBadge(u.unit_status)}</td>
                        <td data-label="Inquilino">${u.tenant_name || '—'}</td>
                        <td data-label="Aluguel">${u.rent_amount ? `<span class="charge-amount">${formatCurrency(u.rent_amount)}</span>` : '—'}</td>
                        <td data-label="Ações" class="td-actions">
                            <button class="btn btn-sm btn-secondary" data-component="units" data-action="edit" data-id="${u.id}">
                                <i class="fa-solid fa-pen"></i> Editar
                            </button>
                        </td>
                    </tr>`;
                });

                html += `</tbody></table>`;
            }

            html += `</div></div>`;
            this.contentContainer.innerHTML = html;
        } catch (error) {
            this.contentContainer.innerHTML = `<div class="error-message show">${error.message}</div>`;
        }
    },

    /**
     * Retorna badge de status com classes DS v2
     */
    _getStatusBadge(status) {
        const badges = {
            'vacant':   '<span class="badge badge-gray">Vaga</span>',
            'occupied': '<span class="badge badge-success">Ocupada</span>',
            'overdue':  '<span class="badge badge-danger">Atrasada</span>',
            'expiring': '<span class="badge badge-warning">Vencendo</span>'
        };
        return badges[status] || badges['vacant'];
    },

    /**
     * Exibe formulário de cadastro/edição
     */
    async showForm(unit = null) {
        const isEdit = unit !== null;
        const enterprises = await apiCall('/enterprises');

        const enterpriseOptions = enterprises.map(e =>
            `<option value="${e.id}" ${unit?.enterprise_id === e.id ? 'selected' : ''}>${e.name}</option>`
        ).join('');

        const form = `
            <h2>${isEdit ? 'Editar' : 'Nova'} Unidade</h2>
            <form id="unit-form" ${isEdit ? `data-id="${unit.id}"` : ''}>
                <div class="form-row">
                    <div class="form-group">
                        <label>Empreendimento *</label>
                        <select id="unit-enterprise" required ${isEdit ? 'disabled' : ''}>
                            <option value="">Selecione...</option>
                            ${enterpriseOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Identificador *</label>
                        <input type="text" id="unit-identifier" value="${unit?.identifier || ''}" placeholder="Ex: Apto 101, Sala 01" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Área (m²)</label>
                        <input type="number" step="0.01" id="unit-area" value="${unit?.area_sqm || ''}">
                    </div>
                    <div class="form-group">
                        <label>Descrição</label>
                        <input type="text" id="unit-description" value="${unit?.description || ''}">
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" data-modal-cancel>Cancelar</button>
                    <button type="submit" class="btn btn-primary">Salvar</button>
                </div>
            </form>`;

        openModal(form);
    },

    /**
     * Processa submit do formulário (delegado via #content)
     */
    async _handleFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const id = form.getAttribute('data-id');

        try {
            const data = {
                enterpriseId: parseInt(document.getElementById('unit-enterprise').value),
                identifier:   document.getElementById('unit-identifier').value,
                areaSqm:      document.getElementById('unit-area').value || null,
                description:  document.getElementById('unit-description').value
            };

            if (id) {
                await apiCall(`${this.baseUrl}/${id}`, 'PUT', data);
            } else {
                await apiCall(this.baseUrl, 'POST', data);
            }

            closeModal();
            showToast('Tá guardado! Unidade atualizada.', 'success');
            await this.renderList();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    },

    /**
     * Event listeners com delegação em #content
     */
    attachEventListeners() {
        const self = this;

        this.contentContainer.addEventListener('submit', function(e) {
            if (e.target.id === 'unit-form') {
                self._handleFormSubmit(e);
            }
        });

        this.contentContainer.addEventListener('click', function(e) {
            const btn = e.target.closest('[data-component="units"]');
            if (!btn) return;

            const action = btn.getAttribute('data-action');
            const id = btn.getAttribute('data-id');

            switch (action) {
                case 'add':
                    e.preventDefault();
                    self.showForm(null);
                    break;
                case 'edit':
                    e.preventDefault();
                    apiCall(`${self.baseUrl}/${id}`)
                        .then(u => self.showForm(u))
                        .catch(err => alert('Erro: ' + err.message));
                    break;
            }
        });
    }
};

App.register('units', UnitsComponent);
