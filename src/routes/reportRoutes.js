const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { summary } = require('../controllers/reportController');
const router = express.Router();
router.use(verifyToken);
router.get('/summary', summary);
module.exports = router;
