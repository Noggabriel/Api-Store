const { Op, fn, col, literal } = require('sequelize');
const { Product, Sale, SaleItem } = require('../models');
async function summary(req, res, next) {
  try {
    const lowStockThreshold = Math.max(0, Number(req.query.threshold || 5));
    const [productCount, stockUnits, lowStockCount, salesCount, revenue, topItems] = await Promise.all([
      Product.count(), Product.sum('stock'), Product.count({ where: { stock: { [Op.lte]: lowStockThreshold } } }),
      Sale.count(), Sale.sum('totalAmount'),
      SaleItem.findAll({ attributes: ['productId', [fn('SUM', col('quantity')), 'quantitySold']], group: ['productId'], order: [[literal('quantitySold'), 'DESC']], limit: 5, include: [{ model: Product, as: 'product', attributes: ['name', 'size', 'color'] }] })
    ]);
    return res.json({ productsCount: productCount, unitsInStock: Number(stockUnits || 0), productsLowStock: lowStockCount, salesCount, totalRevenue: Number(revenue || 0), lowStockThreshold, bestSellingProducts: topItems });
  } catch (e) { return next(e); }
}
module.exports = { summary };
