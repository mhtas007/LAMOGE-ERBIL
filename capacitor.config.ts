import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.lamego.pos",
  appName: "MAS POS",
  webDir: "dist",
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  },
  server: {
    androidScheme: "https",
    cleartext: true,
    allowNavigation: ["*"]
  }
};

export default config;
