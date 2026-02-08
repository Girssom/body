export const config = {
  port: Number(process.env.PORT) || 3001,
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    mchId: process.env.WECHAT_MCH_ID || '',
    apiKeyV3: process.env.WECHAT_API_KEY_V3 || '',
    notifyUrl: process.env.WECHAT_NOTIFY_URL || '',
    certPath: process.env.WECHAT_CERT_PATH || '',
  },

  tos: {
    accessKeyId: process.env.TOS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.TOS_ACCESS_KEY_SECRET || '',
    region: process.env.TOS_REGION || 'cn-north-1',
    bucket: process.env.TOS_BUCKET || '',
    endpoint: process.env.TOS_ENDPOINT || '',
  },

  databasePath: process.env.DATABASE_PATH || './data/fitness.db',
};
