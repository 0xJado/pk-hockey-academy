import { defineCliConfig } from "sanity/cli";
import { getStudioConfig } from "./config";

export default defineCliConfig({
  api: getStudioConfig(),
  deployment: {
    appId: process.env.SANITY_STUDIO_APP_ID,
    autoUpdates: false,
  },
});
