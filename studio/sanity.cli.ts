import { defineCliConfig } from "sanity/cli";
import { getStudioConfig } from "./config";

export default defineCliConfig({ api: getStudioConfig() });
