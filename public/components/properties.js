// ===== PROPERTIES COMPONENT =====
// Gerenciamento de Propriedades (sistema legado: property_id)

import { App, apiCall, openModal, closeModal, showToast, updatePageTitle } from '/app/script.js';

const PropertiesComponent = {
    baseUrl: '/properties',
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
     * Renderiza a listagem de propriedades
     */
    async renderList() {
        if (!this.contentContainer) this.init();
        updatePageTitle('Propriedades');

        try {
            const properties = await apiCall(this.baseUrl);

            const emptyState = properties.length === 0
                ? `<div class="empty-state">
                       <div class="empty-icon"><i class="fa-solid fa-building"></i></div>
                       <p class="empty-title">Nenhuma propriedade cadastrada</p>
                       <p class="empty-text">Propriedades são os imóveis físicos (sistema legado). Use Empresas e Unidades para o novo cadastro.</p>
                   </div>`
                : `<table class="table">
                       <thead>
                           <tr>
                               <th>Endereço</th>
                               <th>Descrição</th>
                               <th style="text-align:center;">Ações</th>
                           </tr>
                       </thead>
                       <tbody>
                           ${properties.map(p => `
                               <tr>
                                   <td data-label="Endereço">${p.address}</td>
                                   <td data-label="Descrição">${p.description || '-'}</td>
                                   <td data-label="Ações" class="td-actions">
                                       <button class="btn btn-sm btn-secondary"
                                           data-component="properties"
                                           data-action="edit"
                                           data-id="${p.id}">
                                           <i class="fa-solid fa-pen"></i> Editar
                                       </button>
                                   </td>
                               </tr>`).join('')}
                       </tbody>
                   </table>`;

            this.contentContainer.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h2 class="card-title">Propriedades</h2>
                            <small class="card-subtitle">Imóveis do sistema legado (property_id). Para novos cadastros, use Empresas → Unidades.</small>
                        </div>
                        <button class="btn btn-primary btn-sm"
                            data-component="properties"
                            data-action="add">
                            + Nova Propriedade
                        </button>
                    </div>
                    <div class="card-body">${emptyState}</div>
                </div>`;
        } catch (error) {
            this.contentContainer.innerHTML = `<div class="error-message show">${error.message}</div>`;
        }
    },

    /**
     * Abre modal de criação/edição
     */
    showForm(property = null) {
        const isEdit = !!property;
        const title = isEdit ? 'Editar Propriedade' : 'Nova Propriedade';

        const form = `
            <h2>${title}</h2>
            <form id="property-form">
                <input type="hidden" id="prop-id" value="${isEdit ? property.id : ''}">
                <div class="form-row">
                    <div class="form-group">
                        <label>Endereço *</label>
                        <input type="text" id="prop-address" required
                            value="${isEdit ? property.address : ''}">
                    </div>
                    <div class="form-group">
                        <label>Descrição</label>
                        <input type="text" id="prop-description"
                            value="${isEdit ? (property.description || '') : ''}">
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary">Cancelar</button>
                    <button type="submit" class="btn btn-primary">
                        ${isEdit ? 'Salvar alterações' : 'Salvar'}
                    </button>
                </div>
            </form>`;

        openModal(form);
    },

    /**
     * Processa submit do formulário (delegado via #modal-body)
     */
    async _handleFormSubmit(event) {
        event.preventDefault();
        const id = document.getElementById('prop-id').value;
        const isEdit = !!id;

        const data = {
            address: document.getElementById('prop-address').value.trim(),
            description: document.getElementById('prop-description').value.trim()
        };

        try {
            if (isEdit) {
                await apiCall(`${this.baseUrl}/${id}`, 'PUT', data);
                showToast('Propriedade atualizada!', 'success');
            } else {
                await apiCall(this.baseUrl, 'POST', data);
                showToast('Propriedade criada!', 'success');
            }
            closeModal();
            await this.renderList();
        } catch (error) {
            showToast('Erro: ' + error.message, 'error');
        }
    },

    /**
     * Event listeners de submit delegados via #modal-body
     */
    attachModalListeners() {
        const self = this;
        const modalBody = document.getElementById('modal-body');
        if (!modalBody) return;
        modalBody.addEventListener('submit', function(e) {
            if (e.target.id === 'property-form') {
                self._handleFormSubmit(e);
            }
        });
    },

    /**
     * Event listeners de clique com delegação em #content
     */
    attachEventListeners() {
        const self = this;

        this.contentContainer.addEventListener('click', function(e) {
            const btn = e.target.closest('[data-component="properties"]');
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
                        .then(p => self.showForm(p))
                        .catch(err => showToast('Erro: ' + err.message, 'error'));
                    break;
            }
        });
    }
};

App.register('properties', PropertiesComponent);
