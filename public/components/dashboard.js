// ===== DASHBOARD COMPONENT =====
// Módulo isolado para o painel financeiro (KPIs, gráficos, tabela de risco)
// Event delegation: filtros ano/mês → #content (change)  |  tooltips via mouseenter/leave

import { App, apiCall, formatCurrency, updatePageTitle } from '/app/script.js';

const DashboardComponent = {
    contentContainer: null,
    eventListenersAttached: false,

    init() {
        this.contentContainer = document.getElementById('content');
        if (this.contentContainer && !this.eventListenersAttached) {
            this.attachEventListeners();
            this.eventListenersAttached = true;
        }
    },

    async renderList(selectedYear, selectedMonth) {
        if (!this.contentContainer) this.init();
        updatePageTitle('Dashboard');

        try {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            const year = selectedYear || currentYear;
            const month = selectedMonth || currentMonth;
            const stats = await apiCall(`/financial/summary?year=${year}&month=${month}`);

            const inadimplenciaMesLabel = stats.inadimplencia_mes_pct === null
                ? 'Indefinida'
                : `${stats.inadimplencia_mes_pct.toFixed(2)}%`;

            const unidadeAdimplenteLabel = `${(stats.unidades_adimplentes_pct || 0).toFixed(2)}%`;

            const years = [];
            for (let y = currentYear - 2; y <= currentYear + 1; y += 1) years.push(y);

            const periodYear  = stats.period?.year  || year;
            const periodMonth = stats.period?.month || month;

            let yearOptions = '';
            years.forEach(y => {
                yearOptions += `<option value="${y}" ${y === periodYear ? 'selected' : ''}>${y}</option>`;
            });

            let monthOptions = '';
            for (let m = 1; m <= 12; m++) {
                monthOptions += `<option value="${m}" ${m === periodMonth ? 'selected' : ''}>${String(m).padStart(2, '0')}</option>`;
            }

            // ── Lucro distribuído ────────────────────────────────
            let lucroDistribuidoHtml = '';
            if (stats.lucro_distribuido?.length > 0) {
                lucroDistribuidoHtml = '<div style="padding: 12px; background: var(--light-bg); border-radius: 8px;">';
                stats.lucro_distribuido.forEach(dist => {
                    const pct = typeof dist.percentage === 'number' ? dist.percentage : parseFloat(dist.percentage) || 0;
                    lucroDistribuidoHtml += `
                        <div style="margin-bottom: 12px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px;">
                                <span style="font-weight: 500;">${dist.name}</span>
                                <span>${pct.toFixed(1)}% (${formatCurrency(dist.amount)})</span>
                            </div>
                            <div style="height: 8px; background: var(--border-color); border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; background: linear-gradient(90deg, #10b981, #059669); width: ${Math.max(0, pct)}%; transition: width 0.3s ease;"></div>
                            </div>
                        </div>`;
                });
                lucroDistribuidoHtml += '</div>';
            }

            // ── KPIs ─────────────────────────────────────────────
            let html = '<p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px;">Visao financeira do mes selecionado.</p>';

            html += `
                <div class="dashboard-kpis">
                    <div class="kpi-row">
                        <div class="kpi-card"><div class="kpi-label">Faturamento do mes</div><div class="kpi-value">${formatCurrency(stats.faturamento_mes)}</div></div>
                        <div class="kpi-card"><div class="kpi-label">Recebido no mes</div><div class="kpi-value">${formatCurrency(stats.recebido_mes)}</div></div>
                        <div class="kpi-card"><div class="kpi-label">Despesas do mes</div><div class="kpi-value">${formatCurrency(stats.despesas_mes)}</div></div>
                        <div class="kpi-card"><div class="kpi-label">Resultado operacional</div><div class="kpi-value">${formatCurrency(stats.resultado_operacional)}</div></div>
                    </div>
                    <div class="kpi-row">
                        <div class="kpi-card"><div class="kpi-label">Resultado de caixa</div><div class="kpi-value">${formatCurrency(stats.resultado_caixa)}</div></div>
                        <div class="kpi-card">
                            <div class="kpi-label">Inadimplencia do mes</div>
                            <div class="kpi-value">${inadimplenciaMesLabel}</div>
                            <div class="kpi-subtext">Acumulada: ${formatCurrency(stats.inadimplencia_acumulada)}</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-label">Unidades adimplentes</div>
                            <div class="kpi-value">${unidadeAdimplenteLabel}</div>
                            <div class="kpi-subtext">${stats.unidades_adimplentes.adimplentes}/${stats.unidades_adimplentes.total}</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-label">Lucro Liquido do mes</div>
                            <div class="kpi-value">${formatCurrency(stats.lucro_liquido_mes)}</div>
                            ${lucroDistribuidoHtml}
                        </div>
                    </div>
                </div>`;

            // ── Gráfico receita ──────────────────────────────────
            const receitaSeries = stats.receita_liquida_mensal || [];
            const maxReceita = Math.max(1, ...receitaSeries.map(s => Math.abs(s.value)));

            let receitaBars = '';
            receitaSeries.forEach(s => {
                const intValue = Math.round(s.value);
                const height   = Math.round((Math.abs(s.value) / maxReceita) * 100);
                const signClass = s.value < 0 ? 'bar-negative' : 'bar-positive';
                receitaBars += `
                    <div class="chart-bar" data-month="${String(s.month).padStart(2, '0')}" data-value="${formatCurrency(intValue)}">
                        <div class="bar ${signClass}" style="height: ${height}%"></div>
                        <div class="bar-label">${String(s.month).padStart(2, '0')}</div>
                    </div>`;
            });

            html += `
                <div class="card">
                    <div class="card-header card-header-flex">
                        <h2>Evolucao do negocio</h2>
                        <div class="dashboard-filters">
                            <label>Ano <select id="dash-year">${yearOptions}</select></label>
                            <label>Mes <select id="dash-month">${monthOptions}</select></label>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="chart" data-chart="receita">${receitaBars}</div>
                    </div>
                </div>`;

            // ── Gráfico despesas ─────────────────────────────────
            const despesasSeries = Array.from({length: 12}, (_, i) => {
                const found = (stats.despesas_mensal || []).find(s => Number(s.month) === i + 1);
                return { month: i + 1, value: found ? found.value : 0 };
            });
            const maxDespesas = Math.max(1, ...despesasSeries.map(s => s.value));

            let despesasBars = '';
            despesasSeries.forEach(s => {
                const intValue = Math.round(s.value);
                const height   = Math.round((s.value / maxDespesas) * 100);
                despesasBars += `
                    <div class="chart-bar" data-month="${String(s.month).padStart(2, '0')}" data-value="${formatCurrency(intValue)}">
                        <div class="bar bar-neutral" style="height: ${height}%"></div>
                        <div class="bar-label">${String(s.month).padStart(2, '0')}</div>
                    </div>`;
            });

            html += `
                <div class="card">
                    <div class="card-header"><h2>Despesas do ano</h2></div>
                    <div class="card-body">
                        <div class="chart" data-chart="despesas">${despesasBars}</div>
                        <div id="chart-tooltip" class="chart-tooltip"></div>
                    </div>
                </div>`;

            // ── Tabela de risco ──────────────────────────────────
            let riscoRows = '';
            (stats.risco_inquilinos || []).forEach(r => {
                riscoRows += `<tr>
                    <td data-label="Inquilino">${r.tenant_name}</td>
                    <td data-label="Valor contrato">${formatCurrency(r.contract_value)}</td>
                    <td data-label="Valor vencido">${formatCurrency(r.overdue_value)}</td>
                    <td data-label="Dias atraso">${r.days_overdue}</td>
                    <td data-label="Impacto">${r.impact_pct.toFixed(2)}%</td>
                </tr>`;
            });

            html += `
                <div class="card">
                    <div class="card-header"><h2>Risco financeiro por inquilino</h2></div>
                    <div class="card-body">
                        <table class="table">
                            <thead><tr><th>Inquilino</th><th>Valor do contrato</th><th>Valor vencido</th><th>Dias em atraso</th><th>Impacto</th></tr></thead>
                            <tbody>
                                ${riscoRows || '<tr><td colspan="5" style="text-align:center; color: var(--text-secondary);">Sem dados no periodo</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>`;

            this.contentContainer.innerHTML = html;
            this._bindTooltips();
        } catch (error) {
            this.contentContainer.innerHTML = `<div class="error-message show">${error.message}</div>`;
        }
    },

    // ─── Tooltips nas barras do gráfico ──────────────────────────

    _bindTooltips() {
        this.contentContainer.querySelectorAll('.chart-bar').forEach(bar => {
            bar.addEventListener('mouseenter', function (e) {
                const month = this.getAttribute('data-month');
                const value = this.getAttribute('data-value');
                if (!month || !value) return;

                const tooltip = document.createElement('div');
                tooltip.className = 'chart-tooltip-active';
                tooltip.textContent = `Mês ${month}: ${value}`;
                Object.assign(tooltip.style, {
                    position: 'fixed', background: '#2d3748', color: 'white',
                    padding: '6px 12px', borderRadius: '4px', fontSize: '12px',
                    zIndex: '1000', pointerEvents: 'none'
                });
                document.body.appendChild(tooltip);

                const move = (ev) => {
                    tooltip.style.left = (ev.clientX + 10) + 'px';
                    tooltip.style.top  = (ev.clientY - 30) + 'px';
                };
                move(e);
                this.addEventListener('mousemove', move);
                this._tooltip = tooltip;
                this._move = move;
            });

            bar.addEventListener('mouseleave', function () {
                if (this._tooltip) {
                    document.body.removeChild(this._tooltip);
                    this.removeEventListener('mousemove', this._move);
                    this._tooltip = null;
                }
            });
        });
    },

    // ─── Event Listeners (filtros ano/mês) ───────────────────────

    attachEventListeners() {
        const self = this;
        this.contentContainer.addEventListener('change', function (e) {
            if (e.target.id === 'dash-year' || e.target.id === 'dash-month') {
                const yearEl  = document.getElementById('dash-year');
                const monthEl = document.getElementById('dash-month');
                if (yearEl && monthEl) {
                    self.renderList(parseInt(yearEl.value, 10), parseInt(monthEl.value, 10));
                }
            }
        });
    }
};

App.register('dashboard', DashboardComponent);
