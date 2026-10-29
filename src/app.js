const express = require('express');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
const reportRoutes = require('./routes/reportRoutes');
const app = express();
app.use(express.json({ limit: '50kb' }));
// Front-end estático servido pela própria API para evitar configuração de CORS.
app.use(express.static(path.join(__dirname, '../public')));
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'Moda Store API' }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/reports', reportRoutes);
app.use((req, res) => res.status(404).json({ message: 'Rota não encontrada.' }));
app.use((error, req, res, next) => {
  console.error(error);
  if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ message: 'Já existe um registro com esses dados.' });
  if (error.name === 'SequelizeValidationError') return res.status(400).json({ message: 'Dados inválidos.', errors: error.errors.map(e => e.message) });
  return res.status(500).json({ message: 'Erro interno do servidor.' });
});
module.exports = app;
