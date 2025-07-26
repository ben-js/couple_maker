const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Review = sequelize.define('Review', {
  review_id: { type: DataTypes.STRING, primaryKey: true },
  match_pair_id: { type: DataTypes.STRING, allowNull: false },
  reviewer_id: { type: DataTypes.STRING, allowNull: false },
  reviewee_id: { type: DataTypes.STRING, allowNull: false },
  rating_appearance: { type: DataTypes.INTEGER },
  rating_conversation: { type: DataTypes.INTEGER },
  rating_manner: { type: DataTypes.INTEGER },
  rating_sincerity: { type: DataTypes.INTEGER },
  rating_total: { type: DataTypes.INTEGER },
  comment: { type: DataTypes.TEXT },
  tags: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'reviews',
  timestamps: false,
});

module.exports = Review; 