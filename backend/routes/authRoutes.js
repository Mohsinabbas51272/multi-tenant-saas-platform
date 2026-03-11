const express = require('express');
const router = express.Router();
const { login, registerTenant, registerCustomer } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', registerTenant);
router.post('/register-customer', registerCustomer);

module.exports = router;
