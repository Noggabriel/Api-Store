const User = require('./User');
const Product = require('./Product');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');

User.hasMany(Sale, { foreignKey: { name: 'userId', allowNull: false }, as: 'sales', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Sale.belongsTo(User, { foreignKey: { name: 'userId', allowNull: false }, as: 'seller', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Sale.hasMany(SaleItem, { foreignKey: { name: 'saleId', allowNull: false }, as: 'items', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
SaleItem.belongsTo(Sale, { foreignKey: { name: 'saleId', allowNull: false }, as: 'sale', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Product.hasMany(SaleItem, { foreignKey: { name: 'productId', allowNull: false }, as: 'saleItems', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
SaleItem.belongsTo(Product, { foreignKey: { name: 'productId', allowNull: false }, as: 'product', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
module.exports = { User, Product, Sale, SaleItem };
