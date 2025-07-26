const User = require('./User');
const Profile = require('./Profile');
const MatchPair = require('./MatchPair');
const MatchingRequest = require('./MatchingRequest');
const MatchingHistory = require('./MatchingHistory');
const Review = require('./Review');
const PointHistory = require('./PointHistory');

// 관계 설정
User.hasOne(Profile, { foreignKey: 'user_id' });
Profile.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(MatchingRequest, { foreignKey: 'user_id' });
MatchingRequest.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(PointHistory, { foreignKey: 'user_id' });
PointHistory.belongsTo(User, { foreignKey: 'user_id' });

// MatchPair와 User (userA, userB)
User.hasMany(MatchPair, { foreignKey: 'userA_id', as: 'MatchPairsA' });
User.hasMany(MatchPair, { foreignKey: 'userB_id', as: 'MatchPairsB' });
MatchPair.belongsTo(User, { foreignKey: 'userA_id', as: 'UserA' });
MatchPair.belongsTo(User, { foreignKey: 'userB_id', as: 'UserB' });

// MatchPair와 Review
MatchPair.hasMany(Review, { foreignKey: 'match_pair_id' });
Review.belongsTo(MatchPair, { foreignKey: 'match_pair_id' });

// Review와 User (리뷰어, 리뷰이)
User.hasMany(Review, { foreignKey: 'reviewer_id', as: 'ReviewsWritten' });
User.hasMany(Review, { foreignKey: 'reviewee_id', as: 'ReviewsReceived' });
Review.belongsTo(User, { foreignKey: 'reviewer_id', as: 'Reviewer' });
Review.belongsTo(User, { foreignKey: 'reviewee_id', as: 'Reviewee' });

// MatchPair와 MatchingHistory
MatchPair.hasOne(MatchingHistory, { foreignKey: 'match_pair_id' });
MatchingHistory.belongsTo(MatchPair, { foreignKey: 'match_pair_id' });

module.exports = {
  User,
  Profile,
  MatchPair,
  MatchingRequest,
  MatchingHistory,
  Review,
  PointHistory,
}; 