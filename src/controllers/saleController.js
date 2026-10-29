const db = require('../config/database');
const { Product, Sale, SaleItem, User } = require('../models');

async function create(req, res, next) {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Informe ao menos um item na venda.' });
  const quantities = new Map();
  for (const item of items) {
    const productId = Number(item.productId), quantity = Number(item.quantity);
    if (!Number.isInteger(productId) || productId < 1 || !Number.isInteger(quantity) || quantity < 1)
      return res.status(400).json({ message: 'Cada item precisa de productId e quantity inteiros positivos.' });
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }
  const transaction = await db.transaction();
  try {
    const prepared = [];
    let totalAmount = 0;
    for (const [productId, quantity] of quantities) {
      const product = await Product.findByPk(productId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!product) { await transaction.rollback(); return res.status(404).json({ message: `Produto ${productId} não encontrado.` }); }
      if (product.stock < quantity) { await transaction.rollback(); return res.status(409).json({ message: `Estoque insuficiente para ${product.name}. Disponível: ${product.stock}.` }); }
      const unitPrice = Number(product.price);
      totalAmount += unitPrice * quantity;
      prepared.push({ product, quantity, unitPrice });
    }
    totalAmount = Number(totalAmount.toFixed(2));
    const sale = await Sale.create({ userId: req.user.id, totalAmount: totalAmount.toFixed(2) }, { transaction });
    for (const item of prepared) {
      await SaleItem.create({ saleId: sale.id, productId: item.product.id, quantity: item.quantity, unitPrice: item.unitPrice.toFixed(2) }, { transaction });
      await item.product.update({ stock: item.product.stock - item.quantity }, { transaction });
    }
    await transaction.commit();
    const result = await Sale.findByPk(sale.id, { include: [
      { model: SaleItem, as: 'items', include: [{ model: Product, as: 'product' }] },
      { model: User, as: 'seller', attributes: ['id', 'name', 'email'] },
    ] });
    return res.status(201).json({ message: 'Venda registrada e estoque atualizado.', sale: result });
  } catch (e) { if (!transaction.finished) await transaction.rollback(); return next(e); }
}
async function list(req, res, next) {
  try {
    const sales = await Sale.findAll({ include: [
      { model: SaleItem, as: 'items', include: [{ model: Product, as: 'product' }] },
      { model: User, as: 'seller', attributes: ['id', 'name'] },
    ], order: [['createdAt', 'DESC']] });
    return res.json({ count: sales.length, sales });
  } catch (e) { return next(e); }
}
async function getById(req, res, next) {
  try {
    const sale = await Sale.findByPk(req.params.id, { include: [
      { model: SaleItem, as: 'items', include: [{ model: Product, as: 'product' }] },
      { model: User, as: 'seller', attributes: ['id', 'name'] },
    ] });
    if (!sale) return res.status(404).json({ message: 'Venda não encontrada.' });
    return res.json(sale);
  } catch (e) { return next(e); }
}
module.exports = { create, list, getById };
