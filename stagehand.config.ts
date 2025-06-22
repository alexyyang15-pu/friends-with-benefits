import { StagehandConfig } from "@browserbasehq/stagehand";

const config: StagehandConfig = {
  env: "LOCAL", // Use LOCAL for development, BROWSERBASE for production
  modelName: "google/gemini-2.0-flash",
  modelClientOptions: {
    apiKey: process.env.GEMINI_API_KEY,
  },
  // Browser options for LinkedIn scraping
  browserOptions: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
  },
  // Add delays to avoid being blocked
  defaultNavigationTimeout: 30000,
  defaultTimeout: 10000,
};

export default config; 