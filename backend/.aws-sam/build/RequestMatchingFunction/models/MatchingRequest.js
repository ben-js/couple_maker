const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const MatchingRequest = sequelize.define('MatchingRequest', {
  request_id: { type: DataTypes.STRING, primaryKey: true },
  user_id: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'matching_requests',
  timestamps: false,
});

module.exports = MatchingRequest; 