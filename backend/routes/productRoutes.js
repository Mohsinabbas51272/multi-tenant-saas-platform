const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct, getStaff, registerStaff, getLowStockProducts, getGlobalProducts } = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const subscriptionMiddleware = require('../middleware/subscriptionMiddleware');
const { uploadCloud } = require('../utils/cloudinary');

// Public global route (must be BEFORE authMiddleware)
router.get('/global', getGlobalProducts);

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(subscriptionMiddleware);

// Admin and User can view products
router.get('/', getProducts);

// Only Admin can manage products and staff
router.post('/', roleMiddleware(['admin']), uploadCloud.single('image'), createProduct);
router.put('/:id', roleMiddleware(['admin']), uploadCloud.single('image'), updateProduct);
router.get('/low-stock', roleMiddleware(['admin']), getLowStockProducts);
router.delete('/:id', roleMiddleware(['admin']), deleteProduct);

// Staff management (Tenant Admin only)
router.get('/staff', roleMiddleware(['admin']), getStaff);
router.post('/staff', roleMiddleware(['admin']), registerStaff);

module.exports = router;
