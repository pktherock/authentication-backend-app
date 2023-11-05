const {
  PORT,
  SALT_ROUNDS,
  PRODUCTION,
  SESSION_SECRET,
  SESSION_TIME_OUT,
  JWT_ACCESS_SECRET,
  JWT_ACCESS_TIME_OUT,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_TIME_OUT,
  EMAIL_USER_NAME,
  EMAIL_USER_PASSWORD,
  MONGODB_URI,
  MONGO_USER,
  MONGO_USER_PASSWORD,
  DB_NAME,
  CLIENT_URL,
} = process.env;

const config = {
  port: Number(PORT) || 3000,
  saltRounds: Number(SALT_ROUNDS),
  production: PRODUCTION === "true",
  sessionSecret: String(SESSION_SECRET),
  sessionTimeOut: Number(SESSION_TIME_OUT),
  jwtAccessSecret: String(JWT_ACCESS_SECRET),
  jwtAccessTimeOut: String(JWT_ACCESS_TIME_OUT),
  jwtRefreshSecret: String(JWT_REFRESH_SECRET),
  jwtRefreshTimeOut: String(JWT_REFRESH_TIME_OUT),
  emailUser: String(EMAIL_USER_NAME),
  emailPass: String(EMAIL_USER_PASSWORD),
  mongoUri: String(MONGODB_URI),
  mongoUser: String(MONGO_USER),
  mongoUserPass: String(MONGO_USER_PASSWORD),
  dbName: String(DB_NAME),
  clientUrl: String(CLIENT_URL), // will user react very soon
};

Object.freeze(config);

export default config;
