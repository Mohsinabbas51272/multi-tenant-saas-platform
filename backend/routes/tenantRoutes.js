const express = require('express');
const router = express.Router();
const { 
  getTenants, 
  approveTenant, 
  updateTenantStatus,
  getUsers,
  blockUser,
  deleteUser,
  rejectTenant,
  deleteTenant,
  getStoreBySlug,
  getMyTenant
} = require('../controllers/tenantController');

// Public Storefront Access
router.get('/public/:slug', getStoreBySlug);

const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Authenticated tenant admin route (before superadmin-only middleware)
router.get('/my-tenant', authMiddleware, tenantMiddleware, roleMiddleware(['admin']), getMyTenant);

router.use(authMiddleware);
router.use(roleMiddleware(['superadmin']));

router.get('/', getTenants);
router.get('/users', getUsers);
router.patch('/:id/approve', approveTenant);
router.patch('/:id/reject', rejectTenant);
router.delete('/:id', deleteTenant);
router.patch('/users/:id/block', blockUser);
router.delete('/users/:id', deleteUser);
router.patch('/:id/status', updateTenantStatus);

module.exports = router;
