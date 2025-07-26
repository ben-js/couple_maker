const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Profile = sequelize.define('Profile', {
  profile_id: { type: DataTypes.STRING, primaryKey: true },
  user_id: { type: DataTypes.STRING, allowNull: false },
  nickname: { type: DataTypes.STRING },
  birth_date: { type: DataTypes.DATEONLY },
  gender: { type: DataTypes.STRING },
  job: { type: DataTypes.STRING },
  mbti: { type: DataTypes.STRING },
  photo_url: { type: DataTypes.STRING },
  intro: { type: DataTypes.TEXT },
}, {
  tableName: 'profiles',
  timestamps: false,
});

module.exports = Profile; 