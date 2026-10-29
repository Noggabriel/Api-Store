const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(255), allowNull: false, validate: { notEmpty: true } },
  description: { type: DataTypes.TEXT, allowNull: true },
  size: { type: DataTypes.STRING(10), allowNull: false },
  color: { type: DataTypes.STRING(50), allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0.01 } },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
}, { tableName: 'Products', timestamps: true, underscored: false });
module.exports = Product;
