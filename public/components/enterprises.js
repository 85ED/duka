// ===== ENTERPRISES COMPONENT =====
// Gerenciamento de Empreendimentos: listagem, cadastro e edição

import { App, apiCall, openModal, closeModal, showToast } from '/app/script.js';

const EnterprisesComponent = {
    baseUrl: '/enterprises',
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
     * Renderiza listagem de empreendimentos
     */
    async renderList() {
        if (!this.contentContainer) this.init();

        try {
            const enterprises = await apiCall(this.baseUrl);

            let html = `
                <div class="card">
                    <div class="card-header">
                        <h2>Meus Empreendimentos</h2>
                        <small class="card-subtitle">Organize seus imóveis por empreendimento — prédios, condomínios ou conjuntos. Cada empreendimento agrupa as unidades que você administra.</small>
                        <button class="btn btn-primary btn-sm" data-component="enterprises" data-action="add">
                            + Novo Empreendimento
                        </button>
                    </div>
                    <div class="card-body">`;

            if (enterprises.length === 0) {
                html += `
                    <div class="empty-state">
                        <span class="empty-icon" aria-hidden="true">🏗️</span>
                        <p class="empty-title">Nenhum empreendimento cadastrado</p>
                        <p class="empty-text">Cadastre seu primeiro empreendimento para organize suas unidades.</p>
                        <button class="btn btn-primary" data-component="enterprises" data-action="add">+ Novo Empreendimento</button>
                    </div>`;
            } else {
                html += `
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Endereço</th>
                                <th>Unidades</th>
                                <th>Ocupação</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>`;

                enterprises.forEach(e => {
                    const occupancy = e.units_count > 0 ? `${e.occupied_count}/${e.units_count}` : '0/0';
                    html += `<tr>
                        <td data-label="Nome"><strong class="card-title">${e.name}</strong></td>
                        <td data-label="Endereço" class="card-subtitle">${e.address || '—'}</td>
                        <td data-label="Unidades">${e.units_count}</td>
                        <td data-label="Ocupação">${occupancy}</td>
                        <td data-label="Ações" class="td-actions">
                            <button class="btn btn-sm btn-secondary" data-action="view-enterprise" data-id="${e.id}">
                                Ver Unidades
                            </button>
                            <button class="btn btn-sm btn-secondary" data-component="enterprises" data-action="edit" data-id="${e.id}">
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
     * Exibe formulário de cadastro/edição
     */
    showForm(enterprise = null) {
        const isEdit = enterprise !== null;

        const form = `
            <h2>${isEdit ? 'Editar' : 'Novo'} Empreendimento</h2>
            <form id="enterprise-form" ${isEdit ? `data-id="${enterprise.id}"` : ''}>
                <div class="form-row">
                    <div class="form-group">
                        <label>Nome *</label>
                        <input type="text" id="enterprise-name" value="${enterprise?.name || ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Endereço</label>
                        <input type="text" id="enterprise-address" value="${enterprise?.address || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Descrição</label>
                        <textarea id="enterprise-description">${enterprise?.description || ''}</textarea>
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
                name:        document.getElementById('enterprise-name').value,
                address:     document.getElementById('enterprise-address').value,
                description: document.getElementById('enterprise-description').value
            };

            if (id) {
                await apiCall(`${this.baseUrl}/${id}`, 'PUT', data);
            } else {
                await apiCall(this.baseUrl, 'POST', data);
            }

            closeModal();
            showToast('Tá guardado! Empreendimento atualizado.', 'success');
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
            if (e.target.id === 'enterprise-form') {
                self._handleFormSubmit(e);
            }
        });

        this.contentContainer.addEventListener('click', function(e) {
            const btn = e.target.closest('[data-component="enterprises"]');
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
                        .then(enterprise => self.showForm(enterprise))
                        .catch(err => alert('Erro: ' + err.message));
                    break;
            }
        });
    }
};

App.register('enterprises', EnterprisesComponent);
