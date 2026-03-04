// ===== TENANTS COMPONENT =====
// Módulo isolado para gerenciamento de inquilinos
// Usa event delegation sobre #content para evitar listeners globais

import { App, apiCall, openModal, closeModal } from '/app/script.js';

const TenantsComponent = {
    baseUrl: '/tenants',
    contentContainer: null,
    eventListenersAttached: false,

    /**
     * Inicializa o componente
     * Chamado apenas uma vez no startup
     */
    init: function() {
        this.contentContainer = document.getElementById('content');
        if (this.contentContainer && !this.eventListenersAttached) {
            this.attachEventListeners();
            this.eventListenersAttached = true;
        }
    },

    /**
     * Renderiza a lista de tenants
     * Injetada em #content
     * Autossuficiente: garante inicialização
     */
    renderList: async function() {
        // 🔥 Garante que o componente foi inicializado
        if (!this.contentContainer) {
            this.init();
        }

        try {
            const tenants = await apiCall(this.baseUrl);

            let html = '<div class="card">';
            html += '<div class="card-header">';
            html += '<h2>Meus Inquilinos</h2>';
            html += '<small class="card-header-description">Seus moradores. Guarde o nome, telefone e email para contatos importantes.</small>';
            html += '<button class="btn btn-primary btn-sm" data-component="tenants" data-action="add">+ Novo Inquilino</button>';
            html += '</div>';
            html += '<div class="card-body">';

            if (tenants.length === 0) {
                html += `
                    <div class="empty-state">
                        <span class="empty-icon" aria-hidden="true">👥</span>
                        <p class="empty-title">Sem inquilinos ainda</p>
                        <p class="empty-text">Adicione seus moradores para gerenciar contratos e cobranças.</p>
                        <button class="btn btn-primary btn-sm" data-component="tenants" data-action="add">+ Adicionar inquilino</button>
                    </div>`;
            } else {
                html += '<table class="table">';
                html += '<thead><tr><th>Nome</th><th>Documento</th><th>Email</th><th>Telefone</th><th>Ações</th></tr></thead>';
                html += '<tbody>';
                
                tenants.forEach(t => {
                    html += `<tr>
                        <td data-label="Nome"><strong class="card-title">${t.name}</strong></td>
                        <td data-label="Documento" class="card-subtitle">${t.document || '-'}</td>
                        <td data-label="Email" class="card-subtitle">${t.email || '-'}</td>
                        <td data-label="Telefone" class="card-subtitle">${t.phone || '-'}</td>
                        <td data-label="Ações" class="table-actions td-actions">
                            <button class="btn btn-sm btn-secondary" data-component="tenants" data-action="edit" data-id="${t.id}">Editar</button>
                        </td>
                    </tr>`;
                });
                
                html += '</tbody>';
                html += '</table>';
            }

            html += '</div></div>';
            this.contentContainer.innerHTML = html;
        } catch (error) {
            this.contentContainer.innerHTML = `<div class="error-message show">${error.message}</div>`;
        }
    },

    /**
     * Exibe o modal de criar/editar tenant
     * @param {Object|null} tenant - Dados do tenant para edição, null para criar novo
     */
    showForm: function(tenant = null) {
        const isEdit = tenant !== null;
        const title = isEdit ? 'Editar' : 'Novo';
        
        const form = `<h2>${title} Inquilino</h2>
            <form id="tenant-form" data-tenant-id="${tenant?.id || ''}">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nome *</label>
                        <input type="text" id="tenant-name" value="${tenant?.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Documento (CPF/CNPJ)</label>
                        <input type="text" id="tenant-document" value="${tenant?.document || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="tenant-email" value="${tenant?.email || ''}">
                    </div>
                    <div class="form-group">
                        <label>Telefone</label>
                        <input type="text" id="tenant-phone" value="${tenant?.phone || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Documento PDF (URL)</label>
                        <input type="url" id="tenant-document-url" value="${tenant?.document_url || ''}" placeholder="https://...">
                        ${tenant?.document_url ? `<a href="${tenant.document_url}" target="_blank" class="doc-link">Ver PDF atual</a>` : ''}
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
     * Manipula submit do formulário de tenant
     * @param {Event} event - Evento submit do form
     */
    _handleFormSubmit: async function(event) {
        event.preventDefault();
        
        try {
            const form = event.target;
            const tenantId = form.getAttribute('data-tenant-id');
            
            const data = {
                name: document.getElementById('tenant-name').value,
                document: document.getElementById('tenant-document').value,
                email: document.getElementById('tenant-email').value,
                phone: document.getElementById('tenant-phone').value,
                document_url: document.getElementById('tenant-document-url').value
            };

            if (tenantId) {
                // Editar
                await apiCall(`${this.baseUrl}/${tenantId}`, 'PUT', data);
            } else {
                // Criar
                await apiCall(this.baseUrl, 'POST', data);
            }

            closeModal();
            await this.renderList();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    },

    attachEventListeners: function() {
        const self = this;

        if (!this.contentContainer) return;

        // Delegação de submit dentro do container
        this.contentContainer.addEventListener('submit', function(e) {
            if (e.target.id === 'tenant-form') {
                self._handleFormSubmit(e);
            }
        });

        // Delegação de clique dentro do container
        this.contentContainer.addEventListener('click', function(e) {
            const btn = e.target.closest('[data-component="tenants"]');
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
                        .then(tenant => self.showForm(tenant))
                        .catch(err => alert('Erro: ' + err.message));
                    break;
            }
        });
    },

    /**
     * Recarrega a lista (sem reabilitar listeners)
     */
    refresh: async function() {
        await this.renderList();
    }
};

// ✅ Registrar componente no App
App.register('tenants', TenantsComponent);
