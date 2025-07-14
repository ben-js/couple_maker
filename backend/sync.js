const sequelize = require('./sequelize');
require('./models'); // 모든 모델 및 관계 설정

sequelize.sync({ alter: true })
  .then(() => {
    console.log('모든 테이블이 성공적으로 동기화되었습니다.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('테이블 동기화 중 오류 발생:', err);
    process.exit(1);
  }); 