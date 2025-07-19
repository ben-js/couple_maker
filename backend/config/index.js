const config = {
  env: 'development',
  port: 3000,
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://192.168.219.100:3000',
      'http://192.168.219.100:3001',
      'http://localhost:19006',
      'exp://localhost:19000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  s3: {
    bucket: 'date-sense',
    basePath: 'images/profile',
    urlExpire: 900
  },
  dynamodb: {
    region: 'ap-northeast-2',
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
    jwtSecret: 'dev-secret-key',
    expiresIn: '7d'
  }
};

module.exports = config; 