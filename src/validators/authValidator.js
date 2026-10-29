const { body } = require('express-validator');

const registerRules = [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório.').isLength({ max: 100 }).withMessage('Nome deve ter até 100 caracteres.'),
  body('email').trim().isEmail().withMessage('Informe um e-mail válido.').normalizeEmail().isLength({ max: 160 }).withMessage('E-mail deve ter até 160 caracteres.'),
  body('password').isString().isLength({ min: 8, max: 72 }).withMessage('Senha deve ter entre 8 e 72 caracteres.'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Informe um e-mail válido.').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Senha é obrigatória.'),
];

module.exports = { registerRules, loginRules };