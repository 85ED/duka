const db = require('../src/config/database');
const Account = require('../src/models/Account');
const User = require('../src/models/User');
const Enterprise = require('../src/models/Enterprise');
const Unit = require('../src/models/Unit');
const Tenant = require('../src/models/Tenant');
const Contract = require('../src/models/Contract');
const Charge = require('../src/models/Charge');
const Payment = require('../src/models/Payment');

async function seed() {
    try {
        console.log('Starting Seed...');

        // ===== 1. CREATE PLATFORM ACCOUNT & ADMIN =====
        console.log('Criando conta da Plataforma...');
        const platformAccountId = await Account.create('Đuka Platform', 'platform');

        console.log('Criando Platform Admin...');
        const platformAdminId = await User.create({
            accountId: platformAccountId,
            name: 'Edson Felix',
            email: 'edsonfelixnet@icloud.com',
            password: 'admin123',
            role: 'platform_admin'
        });

        console.log('✅ Platform Admin criado!');
        console.log(`   Email: edsonfelixnet@icloud.com`);
        console.log(`   Senha: admin123`);
        console.log(`   Role: platform_admin\n`);

        // ===== 2. CREATE FIRST CLIENT ACCOUNT =====
        console.log('Criando primeiro cliente para testes...');
        const clientAccountId = await Account.create('Administradora Exemplo', 'client');

        const clientAdminId = await User.create({
            accountId: clientAccountId,
            name: 'João da Silva',
            email: 'joao@exemplo.com',
            password: 'cliente123',
            role: 'client_admin'
        });

        console.log('✅ Cliente criado!');
        console.log(`   Nome da Empresa: Administradora Exemplo`);
        console.log(`   Admin Email: joao@exemplo.com`);
        console.log(`   Admin Senha: cliente123\n`);

        // ===== 3. CRIAR SÓCIOS DO CLIENTE =====
        console.log('Criando sócios do cliente...');
        const socio1Id = await User.create({
            accountId: clientAccountId,
            name: 'Talita Silva',
            email: 'talita@exemplo.com',
            password: 'socio123',
            role: 'client_member',
            primaryUserId: clientAdminId
        });

        console.log('✅ Sócios criados!\n');

        // ===== 4. CRIAR DADOS DE TESTE COM NOVO MODELO =====
        console.log('Criando empreendimento de teste...');
        const enterpriseId = await Enterprise.create({
            accountId: clientAccountId,
            name: 'Edifício Flores',
            address: 'Rua das Flores, 123',
            description: 'Prédio residencial com 10 unidades'
        });

        console.log('Criando unidades de teste...');
        const unit1Id = await Unit.create({
            accountId: clientAccountId,
            enterpriseId,
            identifier: 'Apto 101',
            description: '2 quartos, 1 vaga',
            areaSqm: 65
        });
        const unit2Id = await Unit.create({
            accountId: clientAccountId,
            enterpriseId,
            identifier: 'Apto 102',
            description: '3 quartos, 2 vagas',
            areaSqm: 85
        });
        const unit3Id = await Unit.create({
            accountId: clientAccountId,
            enterpriseId,
            identifier: 'Apto 201',
            description: '2 quartos, 1 vaga',
            areaSqm: 65
        });

        console.log('✅ Empreendimento e unidades criados!\n');

        console.log('Criando inquilino de teste...');
        const tenantId = await Tenant.create({
            accountId: clientAccountId,
            name: 'Maria Inquilina',
            document: '12345678900',
            email: 'maria@email.com',
            phone: '11999999999'
        });

        console.log('Criando contrato de teste...');
        const contractId = await Contract.create({
            accountId: clientAccountId,
            unitId: unit1Id,
            tenantId,
            startDate: '2026-01-01',
            endDate: '2026-12-31',
            rentAmount: 1500.00
        });

        console.log('Criando cobrança de teste...');
        const chargeId = await Charge.create({
            accountId: clientAccountId,
            contractId,
            referenceMonth: '2026-02-01',
            dueDate: '2026-02-10'
        });

        await Charge.addItem(chargeId, clientAccountId, {
            description: 'Aluguel Fevereiro/2026',
            amount: 1500.00,
            type: 'rent'
        });

        console.log('\n✅ Seed Completed Successfully!');
        console.log('\n📒 DADOS DE ACESSO:\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('PLATAFORMA ADMIN (você)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Email: edsonfelixnet@icloud.com');
        console.log('Senha: admin123');
        console.log('Role: platform_admin');
        console.log('Dashboard: Gerenciar Clientes\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('CLIENTE EXEMPLO (Teste)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Email: joao@exemplo.com');
        console.log('Senha: cliente123');
        console.log('Role: client_admin');
        console.log('Dashboard: Empreendimentos, Unidades, etc\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('SÓCIO DO CLIENTE (Teste)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Email: talita@exemplo.com');
        console.log('Senha: socio123');
        console.log('Role: client_member');
        console.log('Dashboard: Mesmo do cliente (compartilhado)\n');
        
        process.exit(0);

    } catch (error) {
        console.error('Seed Failed:', error);
        process.exit(1);
    }
}

seed();
