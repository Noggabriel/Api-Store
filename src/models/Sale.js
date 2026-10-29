const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Sale = sequelize.define('Sale', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, { tableName: 'Sales', timestamps: true, underscored: false });
module.exports = Sale;
