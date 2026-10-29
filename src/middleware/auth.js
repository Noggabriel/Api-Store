const jwt = require('jsonwebtoken');

// Protege rotas que exigem um token JWT válido no formato Bearer.
function verifyToken(req, res, next) {
  const authorization = req.get('Authorization');
  const [scheme, token] = authorization ? authorization.split(' ') : [];

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Token de acesso ausente ou malformado.' });
  }

  try {
    // Verifica assinatura e validade; jwt.verify também rejeita tokens expirados.
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Disponibiliza o ID autenticado para os controllers seguintes.
    req.user = { id: payload.sub };
    return next();
  } catch {
    // Token inválido ou expirado não pode acessar a rota protegida.
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}

module.exports = { verifyToken };