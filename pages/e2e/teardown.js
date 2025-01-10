async function globalTeardown() {
  const { mockServer, devServer } = global.__SERVERS__;
  
  // Stop both servers
  await mockServer.stop();
  await new Promise((resolve) => devServer.close(resolve));
  
  delete global.__SERVERS__;
}

module.exports = globalTeardown;