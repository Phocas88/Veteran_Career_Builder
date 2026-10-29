# Publish the generated resume app once

GitHub Pages must use **GitHub Actions** as its publishing source. The source branch does not include generated app dependencies. The automatic branch publisher can otherwise replace the built site on each main-branch commit until the custom build finishes.

In [repository Pages settings](https://github.com/Phocas88/Veteran_Career_Builder/settings/pages), set **Build and deployment → Source → GitHub Actions**. Keep the custom domain as VeteranCareerPath.com. This is a repository administration setting; the connected GitHub code tools cannot edit it. No DNS or Firebase changes are needed.

The `publish-pages` job checks this setting, deploys the tested `.firebase-public` artifact, then verifies the public app, guide and billing authorization boundary. `resumereview/analytics-guide.html` and its stylesheet are also committed so the owner guide stays available if a legacy publisher runs. The independent Firebase mirror job can fail without preventing the GitHub Pages publication.
