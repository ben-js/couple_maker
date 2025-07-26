const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const PointHistory = sequelize.define('PointHistory', {
  point_id: { type: DataTypes.STRING, primaryKey: true },
  user_id: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.STRING },
  description: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'points_history',
  timestamps: false,
});

module.exports = PointHistory; 