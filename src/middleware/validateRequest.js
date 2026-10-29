const { validationResult } = require('express-validator');

// Reúne os erros das regras de validação executadas antes deste middleware.
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Interrompe a requisição inválida e informa quais campos precisam ser corrigidos.
    return res.status(400).json({
      message: 'Dados da requisição inválidos.',
      errors: errors.array().map(({ path, msg }) => ({ field: path, message: msg })),
    });
  }
  // Sem erros, permite que a requisição chegue ao controller.
  return next();
}

module.exports = validateRequest;