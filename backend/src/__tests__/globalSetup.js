const { MongoMemoryReplSet } = require('mongodb-memory-server');

module.exports = async function globalSetup() {
  const mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongod.waitUntilRunning();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test-jwt-secret-do-not-use-in-production';
  process.env.NODE_ENV = 'test';
  process.env.FRONTEND_URL = 'http://localhost:5173';
  global.__MONGOD__ = mongod;
};
