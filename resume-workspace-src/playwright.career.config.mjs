import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./e2e',testMatch:['studio.spec.mjs','profile-setup.spec.mjs','app-shell.spec.mjs','career.spec.mjs','service-library.spec.mjs','service-profile.spec.mjs'],timeout:40000,workers:1,
 use:{baseURL:'http://127.0.0.1:3000',viewport:{width:390,height:844},launchOptions:{channel:'chromium'}},
 webServer:{command:'node server.mjs',url:'http://127.0.0.1:3000',reuseExistingServer:!process.env.CI}
});
