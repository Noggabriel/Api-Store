const express = require('express');
const { verifyToken } = require('../middleware/auth');
const controller = require('../controllers/saleController');
const router = express.Router();
router.use(verifyToken);
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);
module.exports = router;
