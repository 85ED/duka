const db = require('../src/config/database');
const Charge = require('../src/models/Charge');

async function generateMonthlyCharges() {
    try {
        console.log('[CRON] 🔄 Starting Automatic Charge Generation...');

        const connection = await db.getConnection();

        // 1. Calculate Reference Month (First day of current month)
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const referenceMonth = `${year}-${month}-01`;

        console.log(`[CRON] 📅 Reference Month: ${referenceMonth}`);

        // 2. Find Active Contracts that don't have a charge for this reference month
        const [contracts] = await connection.execute(
            `SELECT c.id, c.account_id, c.rent_amount, c.due_day 
             FROM contracts c
             WHERE c.status = 'active'
             AND NOT EXISTS (
                SELECT 1 FROM charges ch 
                WHERE ch.contract_id = c.id 
                AND ch.reference_month = ?
                AND ch.status != 'void'
             )`,
            [referenceMonth]
        );

        console.log(`[CRON] 📊 Found ${contracts.length} contracts needing charges.`);

        if (contracts.length === 0) {
            console.log('[CRON] ✅ No charges to generate.');
            return { success: true, generated: 0, errors: 0 };
        }

        let successCount = 0;
        let errorCount = 0;

        const daysInMonth = (y, m) => new Date(y, m, 0).getDate();
        const maxDay = daysInMonth(year, parseInt(month, 10));

        for (const contract of contracts) {
            try {
                const preferredDay = contract.due_day || 10;
                const safeDay = Math.min(preferredDay, maxDay);
                const dueDate = `${year}-${month}-${String(safeDay).padStart(2, '0')}`;

                console.log(`[CRON] 📝 Generating charge for Contract ${contract.id} with due day ${safeDay}...`);

                await Charge.create({
                    accountId: contract.account_id,
                    contractId: contract.id,
                    referenceMonth,
                    dueDate
                });

                successCount++;
            } catch (err) {
                console.error(`[CRON] ❌ Failed for contract ${contract.id}:`, err.message);
                errorCount++;
            }
        }

        console.log(`[CRON] ✅ Job Finished. Success: ${successCount}, Errors: ${errorCount}`);
        return { success: true, generated: successCount, errors: errorCount };
    } catch (error) {
        console.error('[CRON] 🔴 Critical Error:', error.message);
        return { success: false, error: error.message };
    }
}

// Export for use in server.js or as standalone script
module.exports = { generateMonthlyCharges };

// If run directly as a script
if (require.main === module) {
    generateMonthlyCharges().then(() => {
        process.exit(0);
    }).catch(() => {
        process.exit(1);
    });
}
