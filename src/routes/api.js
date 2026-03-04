const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

const authController = require('../controllers/authController');
const clientController = require('../controllers/clientController');
const userController = require('../controllers/userController');
const propertyController = require('../controllers/propertyController');
const contractController = require('../controllers/contractController');
const contractServiceController = require('../controllers/contractServiceController');
const financialController = require('../controllers/financialController');
const expenseController = require('../controllers/expenseController');
const enterpriseController = require('../controllers/enterpriseController');
const unitController = require('../controllers/unitController');
const serviceController = require('../controllers/serviceController');

// Auth (public)
router.post('/auth/login', authController.login);
router.get('/auth/verify', authMiddleware, authController.verifyToken);

// Protected Routes
router.use(authMiddleware);

// Platform Admin Routes - Gerenciar Clientes
router.get('/admin/clients', clientController.listClients);
router.post('/admin/clients', clientController.createClient);
router.get('/admin/clients/:clientId', clientController.getClient);
router.put('/admin/clients/:clientId', clientController.updateClient);
router.delete('/admin/clients/:clientId', clientController.deleteClient);

// Platform Admin Routes - Gerenciar Usuários de Clientes
router.get('/admin/clients/:clientId/users', clientController.listClientUsers);
router.post('/admin/clients/:clientId/users', clientController.createClientUser);
router.put('/admin/users/:userId', clientController.updateUser);
router.post('/admin/users/:userId/reset-password', clientController.resetUserPassword);

// Users & Partners
router.get('/users/me', userController.getProfile);
router.post('/users/partners', userController.createPartner);
router.post('/users/partner-shares', userController.setPartnerShare);
router.get('/users/partners', userController.getPartners);
router.put('/users/partner-shares/:shareId', userController.updatePartnerShare);
router.get('/users', userController.listUsers);

// Enterprises (Empreendimentos)
router.post('/enterprises', enterpriseController.createEnterprise);
router.get('/enterprises', enterpriseController.listEnterprises);
router.get('/enterprises/:id', enterpriseController.getEnterprise);
router.put('/enterprises/:id', enterpriseController.updateEnterprise);
router.delete('/enterprises/:id', enterpriseController.deleteEnterprise);

// Units (Unidades)
router.post('/units', unitController.createUnit);
router.get('/units', unitController.listUnits);
router.get('/units/stats', unitController.getUnitStats);
router.get('/units/:id', unitController.getUnit);
router.put('/units/:id', unitController.updateUnit);
router.delete('/units/:id', unitController.deleteUnit);

// Properties & Tenants (mantido para compatibilidade)
router.post('/properties', propertyController.createProperty);
router.get('/properties', propertyController.listProperties);
router.get('/properties/:propertyId', propertyController.getProperty);
router.put('/properties/:propertyId', propertyController.updateProperty);
	router.post('/tenants', propertyController.createTenant);
	router.get('/tenants', propertyController.listTenants);

	// Novo CRUD de inquilinos (com PDF)
	const tenantController = require('../controllers/tenantController');
	router.put('/tenants/:id', tenantController.update);
	router.get('/tenants/:id', tenantController.findById);

// Contracts
router.post('/contracts', contractController.createContract);
router.get('/contracts', contractController.listContracts);
router.get('/contracts/:id', contractController.getContract);
router.put('/contracts/:contractId', contractController.updateContract);
router.patch('/contracts/:contractId/terminate', contractController.terminateContract);
router.get('/contracts/:contractId/services', contractServiceController.listContractServices);
router.post('/contracts/:contractId/services', contractServiceController.addContractService);
router.put('/contracts/:contractId/services/:contractServiceId', contractServiceController.deactivateContractService);
router.post('/contracts/:contractId/replace', contractController.replaceContract);
router.post('/contracts/:contractId/adjustment', contractController.applyAdjustment);
router.get('/contracts/:propertyId/history', contractController.getPropertyHistory);
router.get('/contract-history', contractController.listContractHistory);

// Services (Servicos)
router.get('/services', serviceController.listServices);
router.post('/services', serviceController.createService);
router.put('/services/:id', serviceController.updateService);

// Financial - Charges & Payments
router.post('/charges', financialController.createCharge);
router.get('/charges', financialController.listCharges);
router.get('/charges/:id', financialController.getCharge);
router.put('/charges/:id/void', financialController.voidCharge);
router.post('/charges/:chargeId/items', financialController.addChargeItem);
router.post('/charges/:chargeId/quick-pay', financialController.quickPayment);
router.post('/payments', financialController.registerPayment);

// Financial - Dashboard
router.get('/financial/summary', financialController.getDashboardSummary);

// Expenses
router.post('/expenses', expenseController.createExpense);
router.get('/expenses', expenseController.listExpenses);
router.get('/expenses/:id', expenseController.getExpense);
router.put('/expenses/:id/status', expenseController.updateExpenseStatus);
router.get('/properties/:propertyId/expenses', expenseController.getPropertyExpenses);

module.exports = router;
