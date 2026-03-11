// ===== CONTRACTS COMPONENT =====
// Módulo isolado para gerenciamento de contratos
// Event delegation: lista → #content | formulários no modal → #modal-body

import { App, apiCall, openModal, closeModal, showToast, formatCurrency, formatDate } from '/app/script.js';

const ContractsComponent = {
    baseUrl: '/contracts',
    contentContainer: null,
    eventListenersAttached: false,
    modalListenersAttached: false,

    /**
     * Inicializa o componente.
     * Registra delegação no #content (lista) e no #modal-body (formulários).
     */
    init: function() {
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
     * Renderiza a lista de contratos em #content.
     * Autossuficiente: garante init().
     */
    renderList: async function() {
        console.log('[CONTRACTS] Starting renderList');
        if (!this.contentContainer) {
            console.log('[CONTRACTS] Content container not found, initializing...');
            this.init();
        }

        try {
            console.log('[CONTRACTS] Fetching contracts list...');
            const contracts = await apiCall(this.baseUrl);

            let html = '<div class="card">';
            html += '<div class="card-header">';
            html += '<h2>Meus Contratos</h2>';
            html += '<small class="card-header-description">Gerencie todos os aluguéis ativos. Veja o valor, as datas e os serviços de cada contrato. Encerre ou substitua um inquilino quando precisar.</small>';
            html += '<button class="btn btn-primary btn-sm" data-component="contracts" data-action="add">+ Novo Contrato</button>';
            html += '</div>';
            html += '<div class="card-body">';

            const activeContracts = contracts.filter(c => c.status === 'active');
            const historicalContracts = contracts.filter(c => c.status !== 'active');

            if (activeContracts.length === 0) {
                html += `
                    <div class="empty-state">
                        <span class="empty-icon" aria-hidden="true">📋</span>
                        <p class="empty-title">Nenhum contrato ativo</p>
                        <p class="empty-text">Crie um contrato para começar a cobrar seu inquilino.</p>
                        <button class="btn btn-primary btn-sm" data-component="contracts" data-action="add">+ Criar contrato</button>
                    </div>`;
            } else {
                html += this._renderContractRows(activeContracts, false);
            }

            if (historicalContracts.length > 0) {
                html += `
                    <hr style="margin: 24px 0; border-color: var(--gray-200);">
                    <h3 style="font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
                        <i class="fa-solid fa-clock-rotate-left"></i> Histórico de contratos encerrados
                    </h3>`;
                html += this._renderContractRows(historicalContracts, true);
            }

            html += '</div></div>';
            this.contentContainer.innerHTML = html;
            console.log('[CONTRACTS] renderList completed successfully');
        } catch (error) {
            console.error('[CONTRACTS] renderList error:', error);
            this.contentContainer.innerHTML = `<div class="error-message show">${error.message}</div>`;
        }
    },

    /**
     * Gera HTML da tabela de contratos (ativo ou histórico).
     */
    _renderContractRows: function(contracts, isHistory) {
        const agora = new Date();
        const opacity = isHistory ? ' style="opacity:0.65"' : '';

        let html = `<table class="table"${opacity}>`;
        html += '<thead><tr><th>Local</th><th>Inquilino</th><th>Valor</th><th>Permanência</th><th>Início – Vigência</th><th class="col-acoes">Ações</th></tr></thead>';
        html += '<tbody>';

        contracts.forEach(c => {
            const location = c.location_name || c.property_address || '-';
            const inicio = new Date(c.start_date);

            const anos = Math.floor((agora - inicio) / (365.25 * 24 * 60 * 60 * 1000));
            const meses = Math.floor(((agora - inicio) % (365.25 * 24 * 60 * 60 * 1000)) / (30 * 24 * 60 * 60 * 1000));
            let permanencia;
            if (anos > 0) {
                permanencia = `${anos} ano${anos > 1 ? 's' : ''} ${meses}m`;
            } else if (meses > 0) {
                permanencia = `${meses} mês${meses > 1 ? 'es' : ''}`;
            } else {
                permanencia = 'Novo';
            }

            const alertaReajuste = !isHistory && anos > 0
                ? ' <span class="badge badge-danger"><i class="fa-solid fa-rotate"></i> Reajuste</span>'
                : '';

            let vigencia;
            if (isHistory) {
                vigencia = this._terminationBadge(c.status, c.termination_reason);
            } else if (!c.end_date) {
                vigencia = '<span class="badge badge-success"><i class="fa-solid fa-infinity"></i> Indeterminado</span>';
            } else {
                const fim = new Date(c.end_date);
                const diasAte = Math.floor((fim - agora) / (24 * 60 * 60 * 1000));
                if (diasAte < 0) {
                    vigencia = '<span class="badge badge-success"><i class="fa-solid fa-infinity"></i> Indeterminado</span>';
                } else if (diasAte < 90) {
                    vigencia = `<span class="badge badge-warning"><i class="fa-regular fa-clock"></i> ${diasAte} dias</span>`;
                } else {
                    vigencia = '<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Vigente</span>';
                }
            }

            const acoes = isHistory
                ? `<span class="card-subtitle" style="font-size:var(--text-xs)">Encerrado em ${c.terminated_on ? formatDate(c.terminated_on) : '—'}</span>`
                : `
                    ${c.contract_url ? `<a href="${c.contract_url}" target="_blank" class="btn btn-sm btn-primary doc-link"><i class="fa-solid fa-file-pdf"></i> PDF</a>` : ''}
                    <button class="btn btn-sm btn-secondary" data-component="contracts" data-action="edit" data-id="${c.id}">
                        <i class="fa-solid fa-pen"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-secondary" data-component="contracts" data-action="services" data-id="${c.id}">
                        Serviços
                    </button>
                    <button class="btn btn-sm btn-danger" data-component="contracts" data-action="terminate" data-id="${c.id}">
                        <i class="fa-solid fa-ban"></i> Encerrar
                    </button>`;

            // Valor total = aluguel + serviços ativos
            const servicosTotal = parseFloat(c.services_total) || 0;
            const valorTotal = parseFloat(c.rent_amount) + servicosTotal;
            const valorHtml = servicosTotal > 0
                ? `<span class="charge-amount">${formatCurrency(valorTotal)}</span><br><small style="color:var(--gray-500);">Aluguel: ${formatCurrency(c.rent_amount)} + Serviços: ${formatCurrency(servicosTotal)}</small>`
                : `<span class="charge-amount">${formatCurrency(c.rent_amount)}</span>`;

            html += `<tr>
                <td data-label="Local"><strong class="card-title">${location}</strong></td>
                <td data-label="Inquilino" class="card-subtitle">${c.tenant_name}</td>
                <td data-label="Valor">${valorHtml}</td>
                <td data-label="Permanência">${permanencia}${alertaReajuste}</td>
                <td data-label="Vigência">
                    ${formatDate(c.start_date)} até ${c.end_date ? formatDate(c.end_date) : '—'}
                    <br><small>${vigencia}</small>
                </td>
                <td data-label="Ações" class="table-actions td-actions">${acoes}</td>
            </tr>`;
        });

        html += '</tbody></table>';
        return html;
    },

    /**
     * Retorna badge de encerramento conforme reason/status.
     */
    _terminationBadge: function(status, reason) {
        if (status === 'replaced') {
            return '<span class="badge badge-gray"><i class="fa-solid fa-arrow-right-arrow-left"></i> Substituído</span>';
        }
        const map = {
            'cancelled':  '<span class="badge badge-danger"><i class="fa-solid fa-ban"></i> Cancelado</span>',
            'expired':    '<span class="badge badge-gray"><i class="fa-solid fa-hourglass-end"></i> Expirado</span>',
            'rescinded':  '<span class="badge badge-warning"><i class="fa-solid fa-file-circle-xmark"></i> Rescindido</span>',
        };
        return map[reason] || '<span class="badge badge-gray"><i class="fa-solid fa-circle-xmark"></i> Encerrado</span>';
    },

    /**
     * Modal de substituição de inquílino:
     * Encerra o contrato atual (reason=replaced) e cria um novo para a mesma unidade.
     */
    showReplaceForm: async function(contractId, unitId, currentRent, locationLabel) {
        try {
            const tenants = await apiCall('/tenants');
            let tenantOptions = '<option value="">Selecione...</option>';
            tenants.forEach(t => {
                tenantOptions += `<option value="${t.id}">${t.name}</option>`;
            });

            const today = new Date().toISOString().slice(0, 10);

            const form = `
                <h2><i class="fa-solid fa-arrows-rotate"></i> Substituir Inquílino</h2>
                <p style="color:var(--gray-600); margin-bottom:4px;">
                    Unidade: <strong>${locationLabel}</strong>
                </p>
                <p style="color:var(--gray-500); font-size:var(--text-sm); margin-bottom:20px;">
                    O contrato atual será encerrado com motivo <em>"Substituído"</em> e um novo será criado.
                </p>
                <form id="replace-contract-form"
                      data-old-contract-id="${contractId}"
                      data-unit-id="${unitId}">
                    <h3 style="font-size:var(--text-sm); font-weight:600; color:var(--gray-500); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:12px;">Novo Inquílino</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Inquílino *</label>
                            <select id="replace-tenant-id" required>${tenantOptions}</select>
                        </div>
                        <div class="form-group">
                            <label>Valor do Aluguel *</label>
                            <input type="number" id="replace-rent" step="0.01" value="${currentRent}" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Data Inicial *</label>
                            <input type="date" id="replace-start-date" value="${today}" required>
                        </div>
                        <div class="form-group">
                            <label>Data Final</label>
                            <input type="date" id="replace-end-date">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" data-modal-cancel>Cancelar</button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fa-solid fa-arrows-rotate"></i> Confirmar substituição
                        </button>
                    </div>
                </form>`;

            openModal(form);
        } catch (error) {
            alert('Erro ao carregar inquílinos: ' + error.message);
        }
    },

    /**
     * Encerra o contrato antigo e cria um novo para a mesma unidade.
     */
    _submitReplaceContract: async function(form) {
        const oldId  = form.getAttribute('data-old-contract-id');
        const unitId = form.getAttribute('data-unit-id');

        await apiCall(`${this.baseUrl}/${oldId}/terminate`, 'PATCH', { reason: 'replaced' });

        await apiCall(this.baseUrl, 'POST', {
            unitId:     parseInt(unitId),
            tenantId:   parseInt(document.getElementById('replace-tenant-id').value),
            startDate:  document.getElementById('replace-start-date').value,
            endDate:    document.getElementById('replace-end-date').value || null,
            rentAmount: parseFloat(document.getElementById('replace-rent').value)
        });

        closeModal();
        showToast('✅ Contrato substituído! Novo inquílino vinculado.', 'success');
        await this.renderList();
    },

    /**
     * Modal de confirmação de encerramento.
     */
    showTerminateForm: function(contractId) {
        const form = `
            <h2><i class="fa-solid fa-ban"></i> Encerrar Contrato</h2>
            <p style="color:var(--gray-600); margin-bottom:20px;">Selecione o motivo. O contrato será movido para o histórico e a unidade ficará disponível.</p>
            <form id="terminate-contract-form" data-id="${contractId}">
                <div class="form-group">
                    <label>Motivo do encerramento *</label>
                    <div style="display:flex; flex-direction:column; gap:10px; margin-top:8px;">
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:normal;">
                            <input type="radio" name="terminate-reason" value="expired" required> Expirado — prazo do contrato chegou ao fim
                        </label>
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:normal;">
                            <input type="radio" name="terminate-reason" value="cancelled"> Cancelado — acordo entre as partes
                        </label>
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:normal;">
                            <input type="radio" name="terminate-reason" value="rescinded"> Rescindido — quebra contratual
                        </label>
                    </div>
                </div>
                <div class="form-actions" style="margin-top:24px;">
                    <button type="button" class="btn btn-secondary" data-modal-cancel>Cancelar</button>
                    <button type="submit" class="btn btn-danger"><i class="fa-solid fa-ban"></i> Confirmar encerramento</button>
                </div>
            </form>`;
        openModal(form);
    },

    /**
     * Executa o encerramento via API.
     */
    _submitTerminate: async function(form) {
        const id = form.getAttribute('data-id');
        const reasonEl = form.querySelector('input[name="terminate-reason"]:checked');
        if (!reasonEl) {
            alert('Selecione o motivo do encerramento.');
            return;
        }
        console.log('[CONTRACTS] Terminating contract:', id, 'Reason:', reasonEl.value);
        await apiCall(`${this.baseUrl}/${id}/terminate`, 'PATCH', { reason: reasonEl.value });
        console.log('[CONTRACTS] Contract terminated successfully');
        closeModal();
        showToast('Contrato encerrado. Unidade disponível.', 'success');
        await this.renderList();
    },

    /**
     * Abre modal de criação de contrato.
     * Carrega unidades vagas e inquilinos disponíveis.
     */
    showForm: async function() {
        try {
            console.log('[CONTRACTS] Loading units and tenants...');
            const [units, tenants] = await Promise.all([
                apiCall('/units'),
                apiCall('/tenants')
            ]);

            console.log('[CONTRACTS] All units:', units);
            console.log('[CONTRACTS] Filtering for vacant units...');
            
            const availableUnits = units.filter(u => u.unit_status === 'vacant');

            let unitOptions = '<option value="">Selecione...</option>';
            availableUnits.forEach(u => {
                unitOptions += `<option value="${u.id}">${u.enterprise_name} - ${u.identifier}</option>`;
            });
            if (availableUnits.length === 0) {
                unitOptions += '<option value="" disabled>Nenhuma unidade disponível</option>';
            }

            console.log('[CONTRACTS] Available units count:', availableUnits.length);

            let tenantOptions = '<option value="">Selecione...</option>';
            tenants.forEach(t => {
                tenantOptions += `<option value="${t.id}">${t.name}</option>`;
            });

            const form = `
                <h2>Novo Contrato</h2>
                <form id="contract-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Unidade *</label>
                            <select id="unit-id" required>${unitOptions}</select>
                        </div>
                        <div class="form-group">
                            <label>Inquilino *</label>
                            <select id="tenant-id" required>${tenantOptions}</select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Data Inicial *</label>
                            <input type="date" id="start-date" required>
                        </div>
                        <div class="form-group">
                            <label>Data Final</label>
                            <input type="date" id="end-date">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Valor do Aluguel *</label>
                            <input type="number" id="rent-amount" step="0.01" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Endereço do contrato</label>
                            <input type="text" id="contract-address" placeholder="Ex: Rua X, 123 - Apto 45">
                        </div>
                        <div class="form-group">
                            <label>Link do contrato (PDF)</label>
                            <input type="url" id="contract-url" placeholder="https://...">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" data-modal-cancel>Cancelar</button>
                        <button type="submit" class="btn btn-primary">Criar Contrato</button>
                    </div>
                </form>`;

            openModal(form);
        } catch (error) {
            alert('Erro ao carregar dados: ' + error.message);
        }
    },

    /**
     * Abre modal de edição de contrato.
     * @param {string|number} contractId
     */
    showEditForm: async function(contractId) {
        try {
            const contract = await apiCall(`${this.baseUrl}/${contractId}`);

            const hoje = new Date();
            const fim = contract.end_date ? new Date(contract.end_date) : null;
            let statusContrato = 'Vigente';

            if (!fim) {
                statusContrato = '<span class="badge badge-success"><i class="fa-solid fa-infinity"></i> Indeterminado</span>';
            } else if (fim < hoje) {
                statusContrato = '<span class="badge badge-success"><i class="fa-solid fa-infinity"></i> Indeterminado (auto)</span>';
            } else {
                const diasAte = Math.floor((fim - hoje) / (24 * 60 * 60 * 1000));
                if (diasAte < 90) {
                    statusContrato = `<span class="badge badge-warning"><i class="fa-regular fa-clock"></i> Vence em ${diasAte} dias</span>`;
                } else {
                    statusContrato = '<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Vigente</span>';
                }
            }

            const contractAddress = contract.contract_address || 'Não informado';
            const contractLinkHtml = contract.contract_url
                ? `<a href="${contract.contract_url}" target="_blank" rel="noopener" class="doc-link">
                       <i class="fa-solid fa-file-pdf"></i> Ver PDF
                   </a>`
                : '<span class="text-secondary">Não vinculado</span>';

            // location_name vem do findAll; findById retorna enterprise_name + unit_identifier
            const locationLabel = contract.location_name
                || (contract.enterprise_name && contract.unit_identifier
                    ? `${contract.enterprise_name} — ${contract.unit_identifier}`
                    : contract.property_address
                    || contract.unit_identifier
                    || 'Contrato');

            const form = `
                <h2>Contrato: ${locationLabel}</h2>
                <p><strong>Inquilino:</strong> ${contract.tenant_name}</p>
                <p><strong>Endereço:</strong> ${contractAddress}</p>
                <p><strong>Link:</strong> ${contractLinkHtml}</p>
                <p><strong>Status:</strong> ${statusContrato}</p>
                <hr>
                <form id="edit-contract-form" data-contract-id="${contractId}">
                    <div class="form-group">
                        <label>Link do Contrato (URL do PDF)</label>
                        <input type="url" id="edit-contract-url"
                               placeholder="https://exemplo.com/contrato.pdf"
                               value="${contract.contract_url || ''}">
                        <small>Cole o link para o contrato em PDF (Google Drive, OneDrive, etc.)</small>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Data Inicial</label>
                            <input type="date" id="edit-start-date" value="${contract.start_date}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Data Final</label>
                            <input type="date" id="edit-end-date" value="${contract.end_date || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Valor do Aluguel</label>
                            <input type="number" id="edit-rent-amount" step="0.01" value="${contract.rent_amount}">
                        </div>
                        <div class="form-group">
                            <label>Dia do Vencimento (1–31)</label>
                            <input type="number" id="edit-due-day" min="1" max="31" value="${contract.due_day || 10}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Juros Diário (%) — padrão 0.0333 (≈1%/mês)</label>
                            <input type="number" id="edit-late-fee" step="0.0001" value="${contract.late_fee_daily || 0.0333}">
                        </div>
                        <div class="form-group">
                            <label>Multa por Atraso (%) — padrão 2%</label>
                            <input type="number" id="edit-late-fee-percent" step="0.01" value="${contract.late_fee_percent || 2}">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" data-modal-cancel>Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar Alterações</button>
                    </div>
                </form>

                <hr style="margin: 32px 0 16px; border-color: var(--gray-200);">
                <p style="font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--gray-400); margin-bottom: 12px;"><i class="fa-solid fa-triangle-exclamation"></i> Ações do contrato</p>
                <p style="font-size: var(--text-sm); color: var(--gray-500); margin-bottom: 12px;">O histórico é preservado em qualquer caso.</p>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button type="button" class="btn btn-danger"
                            data-modal-action="terminate-from-edit"
                            data-id="${contractId}">
                        <i class="fa-solid fa-ban"></i> Encerrar contrato
                    </button>
                    <button type="button" class="btn btn-secondary"
                            data-modal-action="replace-from-edit"
                            data-id="${contractId}"
                            data-unit-id="${contract.unit_id}"
                            data-rent="${contract.rent_amount}"
                            data-location="${(locationLabel).replace(/"/g, '&quot;')}">
                        <i class="fa-solid fa-arrows-rotate"></i> Substituir inquílino
                    </button>
                </div>`;

            openModal(form);
        } catch (error) {
            alert('Erro ao carregar contrato: ' + error.message);
        }
    },

    /**
     * Abre modal de serviços vinculados ao contrato.
     * @param {string|number} contractId
     */
    showServices: async function(contractId) {
        try {
            const [contract, services, contractServices] = await Promise.all([
                apiCall(`${this.baseUrl}/${contractId}`),
                apiCall('/services'),
                apiCall(`${this.baseUrl}/${contractId}/services`)
            ]);

            let listHtml = `
                <div class="empty-state">
                    <span class="empty-icon" aria-hidden="true">🛠️</span>
                    <p class="empty-title">Nenhum serviço ativo</p>
                    <p class="empty-text">Use o formulário abaixo para adicionar um serviço a este contrato.</p>
                </div>`;
            if (contractServices.length > 0) {
                listHtml  = '<table class="table">';
                listHtml += '<thead><tr><th>Serviço</th><th>Valor</th><th>Início</th><th>Status</th><th class="col-acoes">Ações</th></tr></thead>';
                listHtml += '<tbody>';
                contractServices.forEach(cs => {
                    const valor = cs.price !== null ? cs.price : cs.default_price;
                    const statusBadge = cs.status === 'active'
                        ? '<span class="badge badge-success">Ativo</span>'
                        : '<span class="badge badge-gray">Inativo</span>';
                    const cancelBtn = cs.status === 'active'
                        ? `<button class="btn btn-sm btn-secondary"
                                   data-action="cancel-service"
                                   data-contract-id="${contractId}"
                                   data-cs-id="${cs.id}">Remover</button>`
                        : '-';
                    listHtml += `<tr>
                        <td data-label="Serviço">${cs.service_name}</td>
                        <td data-label="Valor">${formatCurrency(valor)}</td>
                        <td data-label="Início">${formatDate(cs.start_date)}</td>
                        <td data-label="Status">${statusBadge}</td>
                        <td data-label="Ações" class="table-actions td-actions">${cancelBtn}</td>
                    </tr>`;
                });
                listHtml += '</tbody></table>';
            }

            let serviceOptions = '<option value="">Selecione...</option>';
            services.filter(s => s.status === 'active').forEach(s => {
                serviceOptions += `<option value="${s.id}" data-price="${s.default_price}">${s.name} (${formatCurrency(s.default_price)})</option>`;
            });

            const form = `
                <h2>Serviços — ${contract.location_name || (contract.enterprise_name ? contract.enterprise_name + ' - ' + contract.unit_identifier : contract.property_address) || 'Contrato'}</h2>
                <p><strong>Inquilino:</strong> ${contract.tenant_name}</p>
                <hr>
                <h3>Serviços Ativos</h3>
                ${listHtml}
                <hr>
                <h3>Adicionar Serviço</h3>
                <form id="contract-service-form" data-contract-id="${contractId}">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Serviço *</label>
                            <select id="cs-service" required>${serviceOptions}</select>
                        </div>
                        <div class="form-group">
                            <label>Valor</label>
                            <input type="number" id="cs-price" step="0.01" placeholder="Deixe vazio para usar o padrão">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Começa em</label>
                            <input type="date" id="cs-start-date" value="${new Date().toISOString().slice(0, 10)}">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" data-modal-cancel>Fechar</button>
                        <button type="submit" class="btn btn-primary">Adicionar</button>
                    </div>
                </form>`;

            openModal(form);

            // Auto-preenche valor do serviço ao selecionar
            const serviceSelect = document.getElementById('cs-service');
            if (serviceSelect) {
                serviceSelect.addEventListener('change', () => {
                    const price = serviceSelect.options[serviceSelect.selectedIndex]?.getAttribute('data-price');
                    if (price) document.getElementById('cs-price').value = price;
                });
            }
        } catch (error) {
            alert('Erro ao carregar serviços: ' + error.message);
        }
    },

    // ─── Handlers de formulário ───────────────────────────────────────────────

    _submitNewContract: async function() {
        const contractData = {
            unitId:          parseInt(document.getElementById('unit-id').value),
            tenantId:        parseInt(document.getElementById('tenant-id').value),
            startDate:       document.getElementById('start-date').value,
            endDate:         document.getElementById('end-date').value,
            rentAmount:      parseFloat(document.getElementById('rent-amount').value),
            contractAddress: document.getElementById('contract-address').value,
            contractUrl:     document.getElementById('contract-url').value
        };
        console.log('[CONTRACTS] Creating new contract:', contractData);
        await apiCall('/contracts', 'POST', contractData);
        console.log('[CONTRACTS] Contract created successfully');
        closeModal();
        await this.renderList();
    },

    _submitEditContract: async function(form) {
        const contractId = form.getAttribute('data-contract-id');
        const editData = {
            contractUrl:      document.getElementById('edit-contract-url').value || null,
            rentAmount:       parseFloat(document.getElementById('edit-rent-amount').value),
            endDate:          document.getElementById('edit-end-date').value || null,
            dueDay:           parseInt(document.getElementById('edit-due-day').value),
            lateFeeDaily:     parseFloat(document.getElementById('edit-late-fee').value),
            lateFeePencent:   parseFloat(document.getElementById('edit-late-fee-percent').value)
        };
        console.log('[CONTRACTS] Updating contract:', contractId, editData);
        await apiCall(`${this.baseUrl}/${contractId}`, 'PUT', editData);
        console.log('[CONTRACTS] Contract updated successfully');
        closeModal();
        showToast('Tá guardado! Contrato atualizado.', 'success');
        await this.renderList();
    },

    _submitContractService: async function(form) {
        const contractId = form.getAttribute('data-contract-id');
        const priceValue = document.getElementById('cs-price').value;
        const serviceData = {
            serviceId: parseInt(document.getElementById('cs-service').value),
            price:     priceValue ? parseFloat(priceValue) : undefined,
            startDate: document.getElementById('cs-start-date').value
        };
        console.log('[CONTRACTS] Adding service to contract:', contractId, serviceData);
        await apiCall(`${this.baseUrl}/${contractId}/services`, 'POST', serviceData);
        console.log('[CONTRACTS] Service added successfully');
        await this.showServices(parseInt(contractId));
    },

    _cancelService: async function(contractId, contractServiceId) {
        await apiCall(`${this.baseUrl}/${contractId}/services/${contractServiceId}`, 'PUT');
        await this.showServices(contractId);
    },

    // ─── Event Listeners ─────────────────────────────────────────────────────

    /**
     * Delegação sobre #content → ações da listagem (add / edit / services).
     */
    attachEventListeners: function() {
        const self = this;

        this.contentContainer.addEventListener('click', function(e) {
            const btn = e.target.closest('[data-component="contracts"]');
            if (!btn) return;

            e.preventDefault();
            const action = btn.getAttribute('data-action');
            const id     = btn.getAttribute('data-id');

            switch (action) {
                case 'add':
                    self.showForm();
                    break;
                case 'edit':
                    self.showEditForm(id);
                    break;
                case 'services':
                    self.showServices(id);
                    break;
                case 'terminate':
                    self.showTerminateForm(id);
                    break;
            }
        });
    },

    /**
     * Delegação sobre #modal-body → submits e ações internas dos modais.
     * Registrada UMA vez: #modal-body é estático no DOM.
     */
    attachModalListeners: function() {
        const self = this;
        const modalBody = document.getElementById('modal-body');
        if (!modalBody) return;

        // Submits dos formulários de contratos
        modalBody.addEventListener('submit', async function(e) {
            // Filtra apenas formulários de contratos
            const knownForms = ['contract-form', 'edit-contract-form', 'contract-service-form', 'terminate-contract-form', 'replace-contract-form'];
            if (!knownForms.includes(e.target.id)) return;

            e.preventDefault();
            try {
                console.log('[CONTRACTS] Form submit:', e.target.id);
                switch (e.target.id) {
                    case 'contract-form':
                        await self._submitNewContract();
                        break;
                    case 'edit-contract-form':
                        await self._submitEditContract(e.target);
                        break;
                    case 'contract-service-form':
                        await self._submitContractService(e.target);
                        break;
                    case 'terminate-contract-form':
                        await self._submitTerminate(e.target);
                        break;
                    case 'replace-contract-form':
                        await self._submitReplaceContract(e.target);
                        break;
                }
            } catch (error) {
                console.error('[CONTRACTS] Form submit error:', error);
                alert('❌ Erro ao processar contrato:\n\n' + error.message);
            }
        });

        // Clique em "Remover" dentro da lista de serviços do modal
        // E clique nos botões de ação do modal de edição (terminate/replace)
        modalBody.addEventListener('click', async function(e) {
            // Cancel-service
            const cancelSvc = e.target.closest('[data-action="cancel-service"]');
            if (cancelSvc) {
                e.preventDefault();
                const contractId = parseInt(cancelSvc.getAttribute('data-contract-id'));
                const csId       = parseInt(cancelSvc.getAttribute('data-cs-id'));
                try { await self._cancelService(contractId, csId); } catch(err) { alert('Erro: ' + err.message); }
                return;
            }

            // Botões dentro do modal de edição: terminate / replace
            const modalBtn = e.target.closest('[data-modal-action]');
            if (!modalBtn) return;
            e.preventDefault();

            const action   = modalBtn.getAttribute('data-modal-action');
            const id       = modalBtn.getAttribute('data-id');
            const unitId   = modalBtn.getAttribute('data-unit-id');
            const rent     = modalBtn.getAttribute('data-rent');
            const location = modalBtn.getAttribute('data-location');

            try {
                switch (action) {
                    case 'terminate-from-edit':
                        self.showTerminateForm(id);
                        break;
                    case 'replace-from-edit':
                        await self.showReplaceForm(id, unitId, rent, location);
                        break;
                }
            } catch (err) {
                alert('Erro: ' + err.message);
            }
        });
    },

    /**
     * Recarrega a lista sem reativar listeners.
     */
    refresh: async function() {
        await this.renderList();
    }
};

// ✅ Registrar componente no App
App.register('contracts', ContractsComponent);
