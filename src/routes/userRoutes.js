const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/send-verification', userController.sendVerificationEmail);
router.post('/verify-email', userController.verifyEmail);
router.post('/request-delete-account', userController.requestAccountDeletion);
router.post('/confirm-delete-account', userController.confirmAccountDeletion);
router.post('/request-password-reset', userController.requestPasswordReset);
router.post('/confirm-password-reset', userController.confirmPasswordReset);

module.exports = router;