const db = require('../config/database');
const rules = require('../services/financialRules');

function formatDate(date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getMonthRange(year, month) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month - 1, rules.daysInMonth(year, month)));
    return { start, end };
}

class Dashboard {
    static async getSummary(accountId, { year, month } = {}, userId = null) {
        const now = new Date();
        const selectedYear = year ? parseInt(year, 10) : now.getUTCFullYear();
        const selectedMonth = month ? parseInt(month, 10) : now.getUTCMonth() + 1;

        const { start: monthStart, end: monthEnd } = getMonthRange(selectedYear, selectedMonth);
        const monthStartStr = formatDate(monthStart);
        const monthEndStr = formatDate(monthEnd);

        const connection = await db.getConnection();
        try {
            const yearStart = `${selectedYear}-01-01`;
            const yearEnd = `${selectedYear}-12-31`;

            const [contracts] = await connection.execute(
                `SELECT c.id, c.unit_id, c.property_id, c.tenant_id, c.start_date, c.end_date, c.rent_amount,
                        t.name as tenant_name,
                        COALESCE(
                            (SELECT SUM(COALESCE(cs2.price, s2.default_price))
                             FROM contract_services cs2
                             JOIN services s2 ON cs2.service_id = s2.id
                             WHERE cs2.contract_id = c.id
                               AND cs2.status = 'active'
                               AND s2.status = 'active'), 0
                        ) as services_total
                 FROM contracts c
                 JOIN tenants t ON c.tenant_id = t.id
                 WHERE c.account_id = ?
                   AND c.status = 'active'
                   AND c.start_date <= ?
                   AND (c.end_date IS NULL OR c.end_date >= ?)`
                , [accountId, yearEnd, yearStart]
            );

            const contractForRules = contracts.map(c => ({
                id: c.id,
                unit_id: c.unit_id,
                property_id: c.property_id,
                tenant_id: c.tenant_id,
                tenant_name: c.tenant_name,
                startDate: c.start_date,
                endDate: c.end_date,
                monthlyValue: parseFloat(c.rent_amount) + parseFloat(c.services_total || 0)
            }));

            const sameDayReplacementSet = rules.buildSameDayReplacementSet(contractForRules);

            // Faturamento será calculado a partir das cobranças reais (após query de charges)
            let faturamentoMes = 0;

            const [receivedRows] = await connection.execute(
                `SELECT COALESCE(SUM(amount_paid), 0) as total
                 FROM payments
                 WHERE account_id = ?
                   AND status = 'confirmed'
                   AND payment_date >= ?
                   AND payment_date <= ?`,
                [accountId, monthStartStr, monthEndStr]
            );
            const recebidoMes = rules.centsToNumber(rules.parseToCents(receivedRows[0].total || 0));

            const [expenseRows] = await connection.execute(
                `SELECT COALESCE(SUM(amount), 0) as total
                 FROM expenses
                 WHERE account_id = ?
                   AND expense_date >= ?
                   AND expense_date <= ?`,
                [accountId, monthStartStr, monthEndStr]
            );
            const despesasMes = rules.centsToNumber(rules.parseToCents(expenseRows[0].total || 0));

            // Composição das despesas do mês (para gráfico de pizza)
            const [expenseBreakdownRows] = await connection.execute(
                `SELECT description, COALESCE(SUM(amount), 0) as total
                 FROM expenses
                 WHERE account_id = ?
                   AND expense_date >= ?
                   AND expense_date <= ?
                 GROUP BY description
                 ORDER BY total DESC`,
                [accountId, monthStartStr, monthEndStr]
            );
            const despesasComposicao = expenseBreakdownRows.map(r => ({
                description: r.description,
                amount: rules.centsToNumber(rules.parseToCents(r.total || 0))
            }));

            const [chargesMonth] = await connection.execute(
                `SELECT c.id, c.contract_id, c.total_amount, c.due_date,
                        COALESCE(SUM(p.amount_paid), 0) as paid_by_end
                 FROM charges c
                 LEFT JOIN payments p
                   ON p.charge_id = c.id
                  AND p.status = 'confirmed'
                  AND p.payment_date <= ?
                 WHERE c.account_id = ?
                   AND c.due_date >= ?
                   AND c.due_date <= ?
                   AND c.status != 'void'
                 GROUP BY c.id`,
                [monthEndStr, accountId, monthStartStr, monthEndStr]
            );

            let unpaidByEndTotalCents = 0n;
            let totalBilledChargesCents = 0n;
            const unpaidByContract = new Map();

            chargesMonth.forEach(ch => {
                const total = rules.parseToCents(ch.total_amount || 0);
                const paid = rules.parseToCents(ch.paid_by_end || 0);
                const unpaid = total - paid > 0n ? total - paid : 0n;
                totalBilledChargesCents += total;
                if (unpaid > 0n) {
                    unpaidByEndTotalCents += unpaid;
                    const prev = unpaidByContract.get(ch.contract_id) || 0n;
                    unpaidByContract.set(ch.contract_id, prev + unpaid);
                }
            });

            // Faturamento = soma real das cobranças do mês (aluguel + serviços)
            faturamentoMes = rules.centsToNumber(totalBilledChargesCents);

            const inadimplenciaMes = rules.calcInadimplenciaMes(
                faturamentoMes,
                rules.centsToNumber(unpaidByEndTotalCents)
            );

            const [overdueRows] = await connection.execute(
                `SELECT c.id, c.total_amount, COALESCE(SUM(p.amount_paid), 0) as paid_total
                 FROM charges c
                 LEFT JOIN payments p
                   ON p.charge_id = c.id
                  AND p.status = 'confirmed'
                 WHERE c.account_id = ?
                   AND c.status != 'paid'
                   AND c.status != 'void'
                   AND c.due_date < CURDATE()
                 GROUP BY c.id`,
                [accountId]
            );

            const inadimplenciaAcumuladaCents = overdueRows.reduce((sum, r) => {
                const total = rules.parseToCents(r.total_amount || 0);
                const paid = rules.parseToCents(r.paid_total || 0);
                const unpaid = total - paid > 0n ? total - paid : 0n;
                return sum + unpaid;
            }, 0n);
            const inadimplenciaAcumulada = rules.centsToNumber(inadimplenciaAcumuladaCents);

            const contractsActiveThisMonth = contractForRules.filter(c => {
                return rules.getActiveDaysInMonth(c, selectedYear, selectedMonth, sameDayReplacementSet) > 0;
            });

            const contratosAtivosCount = contractsActiveThisMonth.length;
            let contratosSemAtraso = 0;

            contractsActiveThisMonth.forEach(c => {
                const unpaidCents = unpaidByContract.get(c.id) || 0n;
                if (unpaidCents === 0n) {
                    contratosSemAtraso += 1;
                }
            });

            const unidadesAdimplentesPct = rules.calcUnidadesAdimplentesMes(contratosSemAtraso, contratosAtivosCount);

            const referenceDate = new Date();
            referenceDate.setHours(0, 0, 0, 0);
            const risco = contractsActiveThisMonth.map(c => {
                // Valor do contrato baseado nas cobranças reais (inclui aluguel + serviços)
                let contractChargesCents = 0n;
                chargesMonth.forEach(ch => {
                    if (ch.contract_id === c.id) {
                        contractChargesCents += rules.parseToCents(ch.total_amount || 0);
                    }
                });
                // Fallback para valor mensal do contrato se não houver cobrança
                const contractValue = contractChargesCents > 0n
                    ? rules.centsToNumber(contractChargesCents)
                    : rules.centsToNumber(rules.parseToCents(c.monthlyValue || 0));

                const impactoPct = faturamentoMes > 0
                    ? rules.roundTo((contractValue / faturamentoMes) * 100, 2)
                    : 0;

                const unpaidCents = unpaidByContract.get(c.id) || 0n;
                const isPaid = unpaidCents === 0n;
                let maxDiasAtraso = 0;
                chargesMonth.forEach(ch => {
                    if (ch.contract_id !== c.id) return;
                    const total = rules.parseToCents(ch.total_amount || 0);
                    const paid = rules.parseToCents(ch.paid_by_end || 0);
                    const remaining = total - paid > 0n ? total - paid : 0n;
                    if (remaining <= 0n) return;
                    const due = new Date(ch.due_date);
                    if (referenceDate > due) {
                        const diff = Math.floor((referenceDate - due) / (24 * 60 * 60 * 1000));
                        if (diff > maxDiasAtraso) maxDiasAtraso = diff;
                    }
                });

                // Calcular valor atualizado com multa + juros
                const overdueValue = rules.centsToNumber(unpaidCents);
                let valorAtualizado = overdueValue;
                if (maxDiasAtraso > 0 && overdueValue > 0) {
                    const multa = overdueValue * 0.02;
                    const juros = overdueValue * (0.0333 / 100) * maxDiasAtraso;
                    valorAtualizado = rules.roundTo(overdueValue + multa + juros, 2);
                }

                return {
                    tenant_name: c.tenant_name,
                    contract_value: contractValue,
                    overdue_value: rules.centsToNumber(unpaidCents),
                    valor_atualizado: valorAtualizado,
                    status: isPaid ? 'paid' : 'open',
                    days_overdue: maxDiasAtraso,
                    impact_pct: impactoPct
                };
            }).sort((a, b) => b.impact_pct - a.impact_pct);

            // Cobranças por mês do ano (para gráfico de evolução) - usa due_date
            const [chargesYearRows] = await connection.execute(
                `SELECT DATE_FORMAT(due_date, '%m') as m, COALESCE(SUM(total_amount), 0) as total
                 FROM charges
                 WHERE account_id = ?
                   AND due_date >= ? AND due_date <= ?
                   AND status != 'void'
                 GROUP BY DATE_FORMAT(due_date, '%m')`,
                [accountId, yearStart, yearEnd]
            );
            const chargesByMonth = new Map();
            chargesYearRows.forEach(r => chargesByMonth.set(parseInt(r.m, 10), rules.parseToCents(r.total || 0)));

            const [expensesYearRows] = await connection.execute(
                `SELECT DATE_FORMAT(expense_date, '%m') as m, COALESCE(SUM(amount), 0) as total
                 FROM expenses
                 WHERE account_id = ?
                   AND expense_date >= ? AND expense_date <= ?
                 GROUP BY DATE_FORMAT(expense_date, '%m')`,
                [accountId, yearStart, yearEnd]
            );
            const expensesByMonth = new Map();
            expensesYearRows.forEach(r => expensesByMonth.set(parseInt(r.m, 10), rules.parseToCents(r.total || 0)));

            const receitaLiquidaMensal = [];
            const despesasMensal = [];

            for (let m = 1; m <= 12; m += 1) {
                const faturamento = rules.centsToNumber(chargesByMonth.get(m) || 0n);
                const despesas = rules.centsToNumber(expensesByMonth.get(m) || 0n);
                const liquida = rules.roundTo(faturamento - despesas, 2);
                receitaLiquidaMensal.push({ month: m, value: liquida });
                despesasMensal.push({ month: m, value: despesas });
            }

            const resultadoOperacional = rules.calcResultadoOperacional(faturamentoMes, despesasMes);
            const resultadoCaixa = rules.calcResultadoCaixa(recebidoMes, despesasMes);
            
            // Lucro líquido = faturamento - despesas
            const lucroLiquido = rules.roundTo(faturamentoMes - despesasMes, 2);
            
            // Verificar se o usuário logado é um sócio (tem primary_user_id)
            // Se for, usar o primary_user_id para buscar a distribuição de lucros
            let primaryUserIdForShares = userId;
            let currentUserName = 'Você';
            
            if (userId) {
                const [currentUserRows] = await connection.execute(
                    `SELECT id, name, primary_user_id FROM users WHERE id = ? AND account_id = ?`,
                    [userId, accountId]
                );
                if (currentUserRows.length > 0 && currentUserRows[0].primary_user_id) {
                    // Usuário logado é um sócio, usa o primary_user_id
                    primaryUserIdForShares = currentUserRows[0].primary_user_id;
                    
                    // Buscar nome do usuário principal
                    const [primaryUserRows] = await connection.execute(
                        `SELECT name FROM users WHERE id = ?`,
                        [primaryUserIdForShares]
                    );
                    if (primaryUserRows.length > 0) {
                        currentUserName = primaryUserRows[0].name;
                    }
                }
            }
            
            // Buscar sócios do usuário principal para distribuição de lucro
            const [userPartners] = await connection.execute(
                `SELECT ps.*, u.name as partner_name
                 FROM partner_shares ps
                 JOIN users u ON ps.partner_user_id = u.id
                 WHERE ps.account_id = ? AND ps.primary_user_id = ? AND ps.status = 'active'
                 ORDER BY ps.percentage DESC`,
                [accountId, primaryUserIdForShares]
            );
            
            // Calcular distribuição de lucro
            let lucroDistribuido = [];
            if (userPartners && userPartners.length > 0) {
                // Incluir o usuário principal
                const totalPercentagem = userPartners.reduce((sum, p) => sum + p.percentage, 0);
                const percentagemPrincipal = 100 - totalPercentagem;
                
                if (percentagemPrincipal > 0) {
                    lucroDistribuido.push({
                        name: currentUserName,
                        percentage: percentagemPrincipal,
                        amount: rules.roundTo((lucroLiquido * percentagemPrincipal) / 100, 2)
                    });
                }
                
                // Adicionar sócios
                userPartners.forEach(p => {
                    lucroDistribuido.push({
                        name: p.partner_name,
                        percentage: p.percentage,
                        amount: rules.roundTo((lucroLiquido * p.percentage) / 100, 2)
                    });
                });
            } else {
                // Se não há sócios, tudo para o usuário principal
                lucroDistribuido.push({
                    name: currentUserName,
                    percentage: 100,
                    amount: lucroLiquido
                });
            }

            return {
                period: { year: selectedYear, month: selectedMonth },
                faturamento_mes: faturamentoMes,
                recebido_mes: recebidoMes,
                despesas_mes: despesasMes,
                resultado_operacional: resultadoOperacional,
                resultado_caixa: resultadoCaixa,
                lucro_liquido_mes: lucroLiquido,
                lucro_distribuido: lucroDistribuido,
                inadimplencia_mes_pct: inadimplenciaMes,
                inadimplencia_acumulada: inadimplenciaAcumulada,
                unidades_adimplentes_pct: unidadesAdimplentesPct,
                unidades_adimplentes: {
                    adimplentes: contratosSemAtraso,
                    total: contratosAtivosCount
                },
                receita_liquida_mensal: receitaLiquidaMensal,
                despesas_mensal: despesasMensal,
                despesas_composicao: despesasComposicao,
                risco_inquilinos: risco
            };
        } finally {
            connection.release();
        }
    }
}

module.exports = Dashboard;
