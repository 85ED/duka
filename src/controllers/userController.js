const User = require('../models/User');
const PartnerShare = require('../models/PartnerShare');

// Create a new partner/subsidiary user
exports.createPartner = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Only admin can create partners
        const isAdmin = await User.isAdmin(req.user.id, req.user.accountId);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can create partners' });
        }

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        // Create new user as partner of the admin
        const userId = await User.create({
            accountId: req.user.accountId,
            name,
            email,
            password,
            role: 'member',
            primaryUserId: req.user.id
        });

        res.status(201).json({ message: 'Partner created', userId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Create profile of partnership shares between users
exports.setPartnerShare = async (req, res) => {
    try {
        const { partnerUserId, percentage } = req.body;

        // Only admin can set partner shares
        const isAdmin = await User.isAdmin(req.user.id, req.user.accountId);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can set partner shares' });
        }

        if (!partnerUserId || percentage === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Verify partner exists
        const partner = await User.findById(partnerUserId, req.user.accountId);
        if (!partner) {
            return res.status(404).json({ error: 'Partner not found' });
        }

        const shareId = await PartnerShare.create({
            accountId: req.user.accountId,
            primaryUserId: req.user.id,
            partnerUserId,
            percentage
        });

        res.status(201).json({ message: 'Partner share created', shareId });
    } catch (error) {
        console.error(error);
        if (error.message.includes('between 0 and 100')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

// Get all partners and their shares
exports.getPartners = async (req, res) => {
    try {
        const isAdmin = await User.isAdmin(req.user.id, req.user.accountId);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can view partners' });
        }

        const partners = await PartnerShare.getPartnersOf(req.user.accountId, req.user.id);
        res.json(partners);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update partner share percentage
exports.updatePartnerShare = async (req, res) => {
    try {
        const { shareId } = req.params;
        const { percentage } = req.body;

        const isAdmin = await User.isAdmin(req.user.id, req.user.accountId);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can update partner shares' });
        }

        const share = await PartnerShare.findById(shareId, req.user.accountId);
        if (!share) {
            return res.status(404).json({ error: 'Share not found' });
        }

        await PartnerShare.updatePercentage(shareId, req.user.accountId, percentage);

        res.json({ message: 'Partner share updated' });
    } catch (error) {
        console.error(error);
        if (error.message.includes('between 0 and 100')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

// List all users in account
exports.listUsers = async (req, res) => {
    try {
        const isAdmin = await User.isAdmin(req.user.id, req.user.accountId);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can list users' });
        }

        const users = await User.findAll(req.user.accountId);
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get my profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id, req.user.accountId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get partner shares if user is admin
        const isAdmin = user.role === 'admin';
        if (isAdmin) {
            const partners = await PartnerShare.getPartnersOf(req.user.accountId, req.user.id);
            user.partners = partners;
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
