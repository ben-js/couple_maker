const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const MatchingHistory = sequelize.define('MatchingHistory', {
  history_id: { type: DataTypes.STRING, primaryKey: true },
  match_pair_id: { type: DataTypes.STRING, allowNull: false },
  userA_id: { type: DataTypes.STRING, allowNull: false },
  userB_id: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING },
  finished_at: { type: DataTypes.DATE },
}, {
  tableName: 'matching_history',
  timestamps: false,
});

module.exports = MatchingHistory; 