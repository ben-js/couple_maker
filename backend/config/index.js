require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:19006',
      'exp://localhost:19000',
      'https://staging.datesense.com',
      'https://datesense.com'
    ],
    credentials: true
  },
  s3: {
    bucket: process.env.S3_BUCKET_NAME || 'date-sense',
    basePath: process.env.S3_BASE_PATH || 'images/profile',
    urlExpire: parseInt(process.env.S3_URL_EXPIRE || '900', 10)
  },
  dynamodb: {
    region: process.env.AWS_REGION || 'ap-northeast-2',
    usersTable: process.env.DDB_USERS_TABLE || 'Users',
    profilesTable: process.env.DDB_PROFILES_TABLE || 'Profiles',
    preferencesTable: process.env.DDB_PREFERENCES_TABLE || 'Preferences',
    matchingRequestsTable: process.env.DDB_MATCHING_REQUESTS_TABLE || 'MatchingRequests',
    matchPairsTable: process.env.DDB_MATCH_PAIRS_TABLE || 'MatchPairs',
    proposalsTable: process.env.DDB_PROPOSALS_TABLE || 'Proposals',
    reviewsTable: process.env.DDB_REVIEWS_TABLE || 'Reviews',
    reviewStatsTable: process.env.DDB_REVIEW_STATS_TABLE || 'ReviewStats',
    userStatusHistoryTable: process.env.DDB_USER_STATUS_HISTORY_TABLE || 'UserStatusHistory',
    pointHistoryTable: process.env.DDB_POINT_HISTORY_TABLE || 'PointHistory',
    matchingHistoryTable: process.env.DDB_MATCHING_HISTORY_TABLE || 'MatchingHistory',
    notificationSettingsTable: process.env.DDB_NOTIFICATION_SETTINGS_TABLE || 'NotificationSettings',
    pushTokensTable: process.env.DDB_PUSH_TOKENS_TABLE || 'PushTokens',
    adminLogsTable: process.env.DDB_ADMIN_LOGS_TABLE || 'AdminLogs'
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  }
};

module.exports = config; 