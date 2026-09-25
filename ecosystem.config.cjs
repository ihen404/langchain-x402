module.exports = {
  apps: [
    {
      name: "mock-sepolia-server",
      script: "mock-sepolia-server.js",
      env: {
        NODE_ENV: "development"
      }
    },
    {
      name: "x402-scraper-agent",
      script: "agent-runner.js",
      autorestart: false,
      env: {
        NETWORK: "sepolia",
        TARGET_URL: "http://localhost:4000/scrape"
      }
    }
  ]
};
