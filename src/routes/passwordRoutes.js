const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/passwordController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all password routes
router.use(authMiddleware);
router.post('/', passwordController.createCredential);
router.get('/', passwordController.getAllCredentials);
router.put('/:id', passwordController.updateCredential);
router.delete('/:id', passwordController.deleteCredential);

module.exports = router;