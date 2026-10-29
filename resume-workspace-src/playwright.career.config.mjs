import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./e2e',testMatch:['admin-dashboard.spec.mjs','analytics.spec.mjs','career-explorer.spec.mjs','career-extras.spec.mjs','clear-journey.spec.mjs','finished-resumes.spec.mjs','template-switching.spec.mjs','profile-import.spec.mjs','imports.spec.mjs','digital-cv.spec.mjs','profile-gallery.spec.mjs','clear-flow.spec.mjs','google-auth.spec.mjs','studio.spec.mjs','profile-setup.spec.mjs','app-shell.spec.mjs','career.spec.mjs','service-library.spec.mjs','service-profile.spec.mjs'],timeout:40000,workers:1,maxFailures:process.env.CI?8:0,
 use:{trace:'retain-on-failure',screenshot:'only-on-failure',baseURL:'http://127.0.0.1:3000',viewport:{width:390,height:844},launchOptions:{channel:'chromium'}},
 webServer:{command:'node server.mjs',url:'http://127.0.0.1:3000',reuseExistingServer:!process.env.CI}
});
