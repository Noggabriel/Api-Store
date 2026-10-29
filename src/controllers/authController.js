const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Cria uma conta depois que a rota valida os dados recebidos.
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    // Impede que o mesmo endereço de e-mail seja cadastrado mais de uma vez.
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(409).json({ message: 'Este e-mail já está cadastrado.' });

    // O banco recebe apenas o hash bcrypt, nunca a senha em texto puro.
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: passwordHash });
    // Não inclui o hash da senha na resposta enviada ao cliente.
    return res.status(201).json({
      message: 'Conta criada com sucesso.',
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    // Encaminha erros inesperados ao middleware central do Express.
    return next(error);
  }
}

// Autentica o cliente e emite um JWT quando a senha confere.
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    // Compara a senha informada com o hash armazenado pelo bcrypt.
    const passwordMatches = user && await bcrypt.compare(password, user.password);
    if (!passwordMatches) return res.status(401).json({ message: 'E-mail ou senha incorretos.' });

    // O ID do cliente fica no subject do token e será usado nas rotas protegidas.
    const token = jwt.sign({}, process.env.JWT_SECRET, {
      subject: String(user.id),
      expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    });
    return res.json({ token, tokenType: 'Bearer', expiresIn: process.env.JWT_EXPIRES_IN || '2h' });
  } catch (error) {
    return next(error);
  }
}

module.exports = { register, login };