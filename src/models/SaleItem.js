const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const SaleItem = sequelize.define('SaleItem', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, { tableName: 'SaleItems', timestamps: true, underscored: false });
module.exports = SaleItem;
