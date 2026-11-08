# Search visibility and Profile contrast

Reviewed 8 November 2026 against frontend `385a9b600dc4746090861a9aa36dd1ee0f90e1b6`.

## Verified starting point

The public homepage, robots file and sitemap each returned HTTP 200. The homepage already had a title, description and canonical URL. Its generated sitemap contained only the homepage. The paid workspace retained `noindex,follow` and was excluded by robots rules.

The requested Profile controls were reproduced with a synthetic signed-in account. “Guide me through my profile” used RGB(80,96,69) text on an RGB(16,16,16) parent. “Previous section” used RGB(49,55,44) on a translucent white button over the same dark parent. These were surviving backgrounds from the older black theme, not missing text.

The live VeteranCareerPath.com homepage still linked its resume hero button to `/resumereview/`, rather than directly to the separate domain. No conclusion about Google's actual indexing or rank can be drawn from these checks. Search Console was not yet set up, and its account verification remains a separate owner step.

## Implementation

- Three substantial public pages cover different tasks: `/military-to-civilian-resume/`, `/federal-resume/` and `/veteran-cover-letter/`. They contain original examples, practical checklists, current product behavior, appropriate service links and related guides. Content is present in the initial HTML and can be read without JavaScript.
- The federal page links current official USAJOBS and OPM guidance. It explains the standard two-page limit, month/year dates, hours per week, specialized-experience evidence and announcement-specific instructions. It does not promise government acceptance or eligibility.
- The homepage has a Guides link and a visible guide section. Guide pages have unique titles, descriptions, canonicals, share metadata, real example PDF/image links, visible breadcrumbs and related links. Their layout uses the existing paper/olive theme.
- Organization, WebSite, Service, Article and BreadcrumbList structured data describe actual visible content. No ratings, reviews or ranking claims are invented. The public sitemap expands from one URL to four and excludes private editor, checkout and user-document URLs.
- Shared public-page JavaScript initializes carousels only where present. Installed visitors can read guides without being redirected into the workspace. Existing checkout-return and installed-root behavior remain covered by tests.
- AdSense remains restricted to the public landing page after separate consent. Guide pages, the workspace and private documents do not gain ads. Existing analytics consent and the dedicated GA4 property remain unchanged.
- VeteranCareerPath.com's existing homepage hero link points directly to VeteranResumes.com with a clear service label. This is a relevant, visible product link; no hidden links, purchased backlinks, forum posts or automated outreach are added.
- Profile guide, section-navigation, save and setup-control backgrounds use the current light theme. Previous/Next controls have explicit readable normal, hover and disabled states. The existing guided setup and section navigation are preserved.

## Validation

The website build and 130 workspace unit tests passed. All 18 public-website browser tests passed, including three new guide journeys. Fifteen focused Profile/setup/guidance journeys passed, including the two new contrast-and-navigation regressions.

New checks cover no-JavaScript discovery, canonical/sitemap consistency, valid structured-data JSON, real example PDFs and images, phone/desktop layout, guide-to-cover-letter navigation, guide privacy behavior, installed visitors retaining guide access, readable Profile controls including hover, actual Previous/Next navigation and keyboard access to setup prompts.

A supplemental first-screen scan of all nine workspace tools found no text-contrast candidates below 4.5:1 in the inspected text controls after the fix. This is a bounded check, not full WCAG certification. Final full-suite and deployment results are recorded in the pull request release receipt.

## Google setup and useful promotion

Use [Google Search Console](https://search.google.com/search-console/welcome) to verify the URL-prefix property `https://veteranresumes.com/`. An HTML verification tag can be published when the owner supplies Google's public token. Then submit `https://veteranresumes.com/sitemap.xml` and inspect the homepage and three new guides. GA4 and AdSense configuration alone do not establish Search Console verification.

Measure impressions, clicks, search terms and indexing status before claiming ranking gains. Relevant starting queries include veteran resume builder, military-to-civilian resume, post-service resume, federal resume for veterans and veteran cover letter. No tool or code repository can guarantee first place; publishing and sitemap submission do not guarantee indexing.

Useful additional placements are contextual links on the main site's resume examples, military transition guides and MOS-result pages; the owner's LinkedIn/other profile links; email signatures; event QR codes; and resource pages operated by veteran organizations or college veteran centers with their approval. These are referral and discovery opportunities, not permission to post or contact others automatically. Avoid paid ranking links, mass directory submissions and automated forum-comment campaigns.

Primary references: [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [Google link-spam policy](https://developers.google.com/search/docs/essentials/spam-policies#link-spam), [current USAJOBS resume guidance](https://usajobshelp.opm.gov/hc/en-us/articles/52839989720851-How-do-I-write-a-resume-for-a-federal-job), and [OPM two-page applicant guidance](https://www.opm.gov/policy-data-oversight/hiring-information/merit-hiring-plan-resources/applicant-guidance-on-the-two-page-resume-limit/).
