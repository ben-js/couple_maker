const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const User = sequelize.define('User', {
  user_id: { type: DataTypes.STRING, primaryKey: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'users',
  timestamps: false,
});

module.exports = User; 