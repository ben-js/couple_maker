const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('your_db_name', 'root', 'your_password', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false, // SQL 로그 보기 원하면 true
});

module.exports = sequelize; 