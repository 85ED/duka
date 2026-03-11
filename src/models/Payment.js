const db = require('../config/database');

class Payment {
    // Baixa rápida - Permite data de pagamento customizada e valor customizado
    static async quickPay({ accountId, chargeId, userId, amountPaid, paymentDate, paymentMethod }) {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Buscar cobrança com juros
            const [charges] = await connection.execute(
                `SELECT c.id, c.total_amount, c.status, c.due_date, cnt.late_fee_daily, cnt.late_fee_percent
                 FROM charges c
                 JOIN contracts cnt ON c.contract_id = cnt.id
                 WHERE c.id = ? AND c.account_id = ? FOR UPDATE`,
                [chargeId, accountId]
            );

            if (!charges.length) throw new Error('Cobrança não encontrada');
            const charge = charges[0];

            if (charge.status === 'paid') throw new Error('Cobrança já está paga');

            // 2. Usar valores fornecidos ou calcular padrões
            const dataPagamento = paymentDate || new Date().toISOString().split('T')[0];
            const metodo = paymentMethod || 'pix';
            let valorFinal = amountPaid || parseFloat(charge.total_amount);
            let diasAtraso = 0;
            let juros = 0;
            let multa = 0;

            // Calcular juros e multa baseado na data de pagamento informada
            if (dataPagamento) {
                const vencimento = new Date(charge.due_date + 'T00:00:00');
                const pagamento = new Date(dataPagamento + 'T00:00:00');
                
                if (pagamento > vencimento) {
                    diasAtraso = Math.floor((pagamento - vencimento) / (1000 * 60 * 60 * 24));
                    const taxaDiaria = parseFloat(charge.late_fee_daily || 0.0333);
                    const multaPercent = parseFloat(charge.late_fee_percent || 2.00);
                    
                    multa = parseFloat(charge.total_amount) * (multaPercent / 100);
                    juros = parseFloat(charge.total_amount) * (taxaDiaria / 100) * diasAtraso;
                    
                    // Se amountPaid não foi fornecido, usa o valor com multa + juros
                    if (!amountPaid) {
                        valorFinal = parseFloat(charge.total_amount) + multa + juros;
                    }
                }
            }

            // 3. Registrar pagamento
            await connection.execute(
                'INSERT INTO payments (account_id, charge_id, created_by_user_id, amount_paid, payment_date, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, "confirmed")',
                [accountId, chargeId, userId, valorFinal, dataPagamento, metodo]
            );

            // 4. Atualizar status da cobrança
            await connection.execute(
                'UPDATE charges SET status = "paid" WHERE id = ?',
                [chargeId]
            );

            await connection.commit();
            return { 
                message: 'Pagamento registrado',
                valorOriginal: parseFloat(charge.total_amount),
                diasAtraso,
                multa: Math.round(multa * 100) / 100,
                juros: Math.round(juros * 100) / 100,
                valorPago: Math.round(valorFinal * 100) / 100,
                dataPagamento,
                metodo
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async register({ accountId, chargeId, userId, amountPaid, paymentDate, paymentMethod }) {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Lock Charge
            const [charges] = await connection.execute(
                'SELECT id, total_amount, status FROM charges WHERE id = ? AND account_id = ? FOR UPDATE',
                [chargeId, accountId]
            );

            if (!charges.length) throw new Error('Charge not found');
            const charge = charges[0];

            // 2. Sum existing confirmed payments
            const [paymentSum] = await connection.execute(
                'SELECT COALESCE(SUM(amount_paid), 0) as total_paid FROM payments WHERE charge_id = ? AND status = "confirmed"',
                [chargeId]
            );
            const currentPaid = parseFloat(paymentSum[0].total_paid);
            const newAmount = parseFloat(amountPaid);
            const totalDue = parseFloat(charge.total_amount);

            // 3. Validate
            if (currentPaid + newAmount > totalDue) {
                throw new Error('Payment amount exceeds charge total');
            }

            // 4. Insert Payment
            await connection.execute(
                'INSERT INTO payments (account_id, charge_id, created_by_user_id, amount_paid, payment_date, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, "confirmed")',
                [accountId, chargeId, userId, newAmount, paymentDate, paymentMethod]
            );

            // 5. Update Charge Status
            const isFullyPaid = (currentPaid + newAmount) >= totalDue;
            const newStatus = isFullyPaid ? 'paid' : 'pending'; // Stays pending if partial

            if (newStatus !== charge.status) {
                await connection.execute(
                    'UPDATE charges SET status = ? WHERE id = ?',
                    [newStatus, chargeId]
                );
            }

            await connection.commit();
            return { message: 'Payment registered', newStatus };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = Payment;
