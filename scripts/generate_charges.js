const db = require('../src/config/database');
const Charge = require('../src/models/Charge');
// We need to fetch active contracts directly or via Contract model? 
// Let's use raw query here for batch processing efficiently or add method to Contract.
// Raw query is fine for script.

async function generateMonthlyCharges() {
    try {
        console.log('Starting Automatic Charge Generation...');

        const connection = await db.getConnection();

        // 1. Calculate Reference Month (First day of current month)
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const referenceMonth = `${year}-${month}-01`;

        console.log(`Reference Month: ${referenceMonth}`);

        // 2. Find Active Contracts that don't have a charge for this reference month
        // We need to fetch account_id too to pass to Charge.create (or simpler: insert directly)
        // Using Charge.create maintains logic (transaction + item rent).
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

        console.log(`Found ${contracts.length} contracts needing charges.`);

        if (contracts.length === 0) {
            console.log('No charges to generate.');
            process.exit(0);
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

                console.log(`Generating charge for Contract ${contract.id} with due day ${safeDay}...`);

                await Charge.create({
                    accountId: contract.account_id,
                    contractId: contract.id,
                    referenceMonth,
                    dueDate
                });

                successCount++;
            } catch (err) {
                console.error(`Failed for contract ${contract.id}:`, err);
                errorCount++;
            }
        }

        console.log(`Job Finished. Success: ${successCount}, Errors: ${errorCount}`);
        process.exit(0);
    } catch (error) {
        console.error('Critical Error:', error);
        process.exit(1);
    }
}

generateMonthlyCharges();
