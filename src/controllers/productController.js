const { Op } = require('sequelize');
const { Product } = require('../models');

async function list(req, res, next) {
  try {
    const where = {};
    if (req.query.size) where.size = req.query.size;
    if (req.query.color) where.color = req.query.color;
    if (req.query.lowStock === 'true') where.stock = { [Op.lte]: Math.max(0, Number(req.query.threshold || 5)) };
    if (req.query.search) where[Op.or] = [
      { name: { [Op.like]: `%${req.query.search}%` } },
      { description: { [Op.like]: `%${req.query.search}%` } },
    ];
    const products = await Product.findAll({ where, order: [['name', 'ASC']] });
    return res.json({ count: products.length, products });
  } catch (e) { return next(e); }
}
async function create(req, res, next) {
  try {
    const { name, description = null, size, color, price, stock = 0 } = req.body;
    if (!name || !size || !color || !Number.isFinite(Number(price)) || Number(price) <= 0 || !Number.isInteger(Number(stock)) || Number(stock) < 0)
      return res.status(400).json({ message: 'Informe nome, tamanho, cor, preço positivo e estoque inteiro não negativo.' });
    const product = await Product.create({ name, description, size, color, price, stock });
    return res.status(201).json({ message: 'Produto cadastrado.', product });
  } catch (e) { return next(e); }
}
async function getById(req, res, next) {
  try { const product = await Product.findByPk(req.params.id); if (!product) return res.status(404).json({ message: 'Produto não encontrado.' }); return res.json(product); }
  catch (e) { return next(e); }
}
async function update(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produto não encontrado.' });
    const allowed = ['name', 'description', 'size', 'color', 'price', 'stock'];
    const changes = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if ('price' in changes && (!Number.isFinite(Number(changes.price)) || Number(changes.price) <= 0)) return res.status(400).json({ message: 'Preço deve ser maior que zero.' });
    if ('stock' in changes && (!Number.isInteger(Number(changes.stock)) || Number(changes.stock) < 0)) return res.status(400).json({ message: 'Estoque deve ser um inteiro não negativo.' });
    await product.update(changes);
    return res.json({ message: 'Produto atualizado.', product });
  } catch (e) { return next(e); }
}
async function remove(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produto não encontrado.' });
    await product.destroy();
    return res.json({ message: 'Produto excluído.' });
  } catch (e) {
    if (e.name === 'SequelizeForeignKeyConstraintError') return res.status(409).json({ message: 'Este produto já possui vendas e não pode ser excluído.' });
    return next(e);
  }
}
module.exports = { list, create, getById, update, remove };
