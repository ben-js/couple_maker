const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const MatchPair = sequelize.define('MatchPair', {
  match_pair_id: { type: DataTypes.STRING, primaryKey: true },
  userA_id: { type: DataTypes.STRING, allowNull: false },
  userB_id: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING },
  final_status: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'match_pairs',
  timestamps: false,
});

module.exports = MatchPair; 