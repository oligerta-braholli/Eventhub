module.exports = async function globalTeardown() {
  const mongod = global.__MONGOD__;
  if (mongod) {
    await mongod.stop();
  }
};
