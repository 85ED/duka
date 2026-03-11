// ===== UNITS COMPONENT =====
// Gerenciamento de Unidades: listagem, cadastro e edição

import { App, apiCall, openModal, closeModal, showToast, formatCurrency } from '/app/script.js';

const UnitsComponent = {
    baseUrl: '/units',
    contentContainer: null,
    eventListenersAttached: false,
    modalListenersAttached: false,

    /**
     * Inicializa o componente
     */
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
                        <small class="card-subtitle">Cadastre e organize as unidades do seu portfólio. Veja o status de cada uma, quem está ocupando e libere unidades quando necessário.</small>
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
                                <th class="col-acoes">Ações</th>
                            </tr>
                        </thead>
                        <tbody>`;

                units.forEach(u => {
                    const liberarBtn = u.unit_status !== 'vacant' && u.contract_id
                        ? `<button class="btn btn-sm btn-danger" data-component="units" data-action="release" data-id="${u.contract_id}" data-unit-name="${u.identifier}">
                               <i class="fa-solid fa-door-open"></i> Liberar
                           </button>`
                        : '';

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
                            ${liberarBtn}
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
     * Modal de confirmação para liberar uma unidade (encerra o contrato ativo)
     */
    showReleaseForm(contractId, unitName) {
        const form = `
            <h2><i class="fa-solid fa-door-open"></i> Liberar Unidade</h2>
            <p style="color:var(--gray-600); margin-bottom:20px;">
                A unidade <strong>${unitName}</strong> será marcada como disponível.
                O contrato será encerrado e movido para o histórico.
            </p>
            <form id="release-form" data-contract-id="${contractId}">
                <div class="form-group">
                    <label>Motivo do encerramento *</label>
                    <div style="display:flex; flex-direction:column; gap:10px; margin-top:8px;">
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:normal;">
                            <input type="radio" name="release-reason" value="expired" required> Expirado — prazo chegou ao fim
                        </label>
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:normal;">
                            <input type="radio" name="release-reason" value="cancelled"> Cancelado — acordo entre as partes
                        </label>
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:normal;">
                            <input type="radio" name="release-reason" value="rescinded"> Rescindido — quebra contratual
                        </label>
                    </div>
                </div>
                <div class="form-actions" style="margin-top:24px;">
                    <button type="button" class="btn btn-secondary" data-modal-cancel>Cancelar</button>
                    <button type="submit" class="btn btn-danger"><i class="fa-solid fa-door-open"></i> Confirmar liberação</button>
                </div>
            </form>`;
        openModal(form);
    },

    /**
     * Processa encerramento do contrato para liberar a unidade
     */
    async _handleReleaseSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const contractId = form.getAttribute('data-contract-id');
        const reasonEl = form.querySelector('input[name="release-reason"]:checked');

        if (!reasonEl) {
            alert('Selecione o motivo do encerramento.');
            return;
        }

        try {
            await apiCall(`/contracts/${contractId}/terminate`, 'PATCH', { reason: reasonEl.value });
            closeModal();
            showToast('Unidade liberada! Contrato encerrado.', 'success');
            await this.renderList();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
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
            </form>
            ${isEdit && unit.contract_id ? `
            <hr style="margin: 28px 0 14px; border-color: var(--gray-200);">
            <p style="font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--gray-400); margin-bottom: 10px;">
                <i class="fa-solid fa-triangle-exclamation"></i> Ações da unidade
            </p>
            <p style="font-size: var(--text-sm); color: var(--gray-500); margin-bottom: 12px;">
                Unidade ocupada por <strong>${unit.tenant_name || 'inquílino'}</strong>.
                Ao liberar, o contrato será encerrado e a unidade ficará vaga.
            </p>
            <button type="button" class="btn btn-danger"
                    data-modal-action="release-from-edit"
                    data-contract-id="${unit.contract_id}"
                    data-unit-name="${unit.identifier}">
                <i class="fa-solid fa-door-open"></i> Liberar unidade
            </button>` : ''}`;

        openModal(form);
    },

    /**
     * Processa submit do formulário (delegado via #modal-body)
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
     * Event listeners de submit delegados via #modal-body
     * (os formulários unit-form e release-form abrem dentro do modal)
     */
    attachModalListeners() {
        const self = this;
        const modalBody = document.getElementById('modal-body');
        if (!modalBody) return;
        modalBody.addEventListener('submit', function(e) {
            if (e.target.id === 'unit-form') {
                self._handleFormSubmit(e);
            }
            if (e.target.id === 'release-form') {
                self._handleReleaseSubmit(e);
            }
        });
        // Botão Liberar dentro do modal de edição
        modalBody.addEventListener('click', function(e) {
            const btn = e.target.closest('[data-modal-action="release-from-edit"]');
            if (!btn) return;
            e.preventDefault();
            const contractId  = btn.getAttribute('data-contract-id');
            const unitName    = btn.getAttribute('data-unit-name');
            self.showReleaseForm(contractId, unitName);
        });
    },

    /**
     * Event listeners de clique com delegação em #content
     */
    attachEventListeners() {
        const self = this;

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
                case 'release':
                    e.preventDefault();
                    self.showReleaseForm(id, btn.getAttribute('data-unit-name'));
                    break;
            }
        });
    }
};

App.register('units', UnitsComponent);
