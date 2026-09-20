# Claude Code Handoff: Career-Guide Contrast + Military Job-Code Expansion

Last updated: 2026-09-20

This document is the task-specific continuation guide for the mobile contrast repair and the military job-code/MOS expansion. Read the repository-level `HANDOFF.md` first for the full product, deployment, authentication, legal, and repository context.

## Owner intent

The owner does not want a veteran's MOS, AFSC, rating, or specialty reduced to one stereotypical civilian job. Each code page should make a veteran think: "I have more options than I realized."

The experience level must matter. An E-2 88M should see hands-on driving, inspections, documentation, and safety evidence. An E-7 88M should see fleet readiness, multi-team scheduling, risk ownership, training, and resource forecasting. Do not give them the same résumé framing.

The long-term content standard is:

1. official direct crosswalks;
2. adjacent roles supported by the code's actual capabilities;
3. new-direction/stretch roles with an explicit credential bridge;
4. civilian, federal/state/local, contractor, and apprenticeship routes where relevant;
5. experience-level guidance that distinguishes hands-on execution, frontline leadership, and organization-level ownership;
6. honest licensing and qualification caveats;
7. code-specific human curation, not only keyword classification.

## What was implemented

### 1. Career-guide contrast repair

The supplied mobile screenshots showed `veteran-manufacturing-careers.html` with near-white text on a white background. The page had structural classes such as `.hero`, `.content`, `.card`, and `.hsub`, but its page-specific stylesheet had been lost. `vcp-styles.css` applies a dark-site text token to `.vcp-enhanced`, which made the unstyled white page unreadable.

Added:

- `career-guide-fallback.css`

Applied it to the seven career guides that had no `.hero` definition before their hero markup:

- `veteran-aviation-careers.html`
- `veteran-construction-management-careers.html`
- `veteran-energy-careers.html`
- `veteran-financial-services-careers.html`
- `veteran-human-resources-careers.html`
- `veteran-manufacturing-careers.html`
- `veteran-supply-chain-careers.html`

The fallback provides high-contrast dark heroes, dark body copy on white cards, accessible buttons, readable tables/callouts, and a single-column mobile layout.

### 2. Replaced the one-cluster MOS redirects

Previously, all 561 files under `mos/` were ~1 KB `noindex` redirect stubs. Each branch hub pointed every military code to exactly one broad career cluster. Example: Army 12B Combat Engineer incorrectly pointed only to law enforcement/security.

Now:

- all 561 job-code files are substantive, indexable reference pages;
- all six branch hubs link to `/mos/<normalized-code>.html`;
- every page contains multiple career directions rather than one cluster;
- every page distinguishes junior, NCO/frontline leader, and senior NCO experience (or officer leadership bands when the title indicates an officer code);
- direct civilian matches use the official O*NET/Defense Manpower military crosswalk where available;
- every pathway states the civilian credential or terminology bridge instead of implying automatic qualification;
- old meta-refresh, canonical-to-cluster, and `noindex` behavior is gone;
- `sitemap.xml` now includes the job-code pages (771 URLs total at generation time).

### 3. Official source data

The compact committed data file is:

- `mos-crosswalk-data.json`

Source:

- O*NET Military Occupational Classification Crosswalk, August 2024
- O*NET says its military search combines DMDC mappings with Department of Labor/DoD analysis, RAND Army KSA work, service COOL data, and ASVAB/Careers in the Military supplements.
- Primary source page: `https://www.onetcenter.org/crosswalks.html`
- Download used: `https://www.onetcenter.org/dl_files/2019/military_crosswalk.zip`

The downloaded source ZIP and expanded CSV were intentionally kept outside the repository:

- `C:\Users\vince\Downloads\military_crosswalk.zip`
- `C:\Users\vince\Downloads\military_crosswalk_data\military_crosswalk\milx0724.csv`

Do not commit the 8.7 MB raw CSV unless there is a deliberate reason. The compact JSON is enough for normal regeneration.

## Generator architecture

Primary script:

- `scripts/generate-mos-guides.mjs`

Inputs:

- `vcp-mos-data.js` - branch/code/title inventory
- `mos-crosswalk-data.json` - compact official civilian mappings
- optional raw O*NET/DMDC CSV argument to rebuild the compact mapping

Outputs:

- 561 `mos/*.html` pages
- updated links and pathway counts in all six branch hubs

Normal regeneration:

```powershell
node scripts/generate-mos-guides.mjs
node scripts/validate-mos-guides.mjs
python generate-sitemap.py
node scripts/content-quality-audit.mjs .
node scripts/build-hosting.mjs .
```

Rebuild the compact crosswalk from a newer official CSV:

```powershell
node scripts/generate-mos-guides.mjs "C:\path\to\new-military-crosswalk.csv"
```

The generator currently contains:

- `PATHS`: reusable pathway families (`engineering`, `logistics`, `mechanical`, `technology`, and `operations`);
- `familyFor(title)`: a fallback title classifier;
- `CURATED`: per-branch/per-code human overrides;
- `experienceBands()`: rank/scope framing;
- official crosswalk extraction and O*NET code/title display;
- hub-card rewriting and missing-card insertion.

## Current 12B override

`CURATED['Army|12B']` is the first bespoke example. It explicitly describes combat engineering as construction, route/terrain reconnaissance, heavy equipment, demolition safety, obstacle reduction, logistics, and team problem solving.

Its page offers seven directions:

1. construction operations;
2. heavy equipment operator;
3. surveying or GIS technician;
4. emergency management specialist;
5. safety coordinator;
6. project coordinator;
7. regulated explosives/blasting support.

The page does **not** claim that 12B automatically qualifies someone as a civil engineer, surveyor, safety professional, or licensed blaster. Credential gaps are explicit.

Official Army references used to validate the 12B model:

- 2025 Army enlisted MOS specifications for 12B, including skill-level duties: `https://api.army.mil/e2/c/downloads/2025/12/04/20612de5/chapter-10c-enlisted-mos-specifications.pdf`
- U.S. Army overview of combat-engineer mobility, countermobility, survivability, construction, and problem solving: `https://www.army.mil/article/200797/combat_engineers_enable_infantry_commanders_soldiers`

## Validation

Dedicated validator:

- `scripts/validate-mos-guides.mjs`

It confirms that all 561 inventory entries:

- have a generated page;
- are linked from the correct branch hub;
- contain official-crosswalk, rank-difference, multiple-direction, and qualification-caveat sections;
- are no longer redirects or `noindex` pages.

Last result:

```text
Validated 561 military job-code entries across 6 branch hubs.
```

Content quality audit result:

```text
Audited 803 HTML routes.
mos_reference: 561
thin_mos_review: 0
```

Hosting build result:

```text
Firebase hosting directory built at C:\dev\Veteran_Career_Builder\.firebase-public
```

The output contained `career-guide-fallback.css` and all 561 `mos/*.html` files.

## Important limitation: baseline vs. full human curation

The implementation is a major improvement over one-link redirects, but do not describe all 561 pages as individually hand-curated yet.

Current state:

- authoritative direct mappings are code-specific where the official crosswalk has data;
- titles and official O*NET roles are code-specific;
- rank/scope framing is built into every page;
- multi-path exploration is available for every page;
- 12B has a bespoke human override;
- the remaining pages use one of five broad pathway families selected from the military title.

Therefore the next editorial phase is to expand `CURATED`, one occupation family at a time. The generator is deliberately designed so the work is additive and repeatable.

## Recommended curation order

Prioritize high-volume, high-risk, or badly stereotyped codes first:

1. Army 11B/11C/12-series/13-series/19-series/31B/35-series/68W/88M/91-series/92-series;
2. Marine infantry, combat engineer, communications, aviation maintenance, logistics, and admin codes;
3. Navy engineering, aviation, nuclear, Seabee, corpsman, IT/CT, logistics, and deck ratings;
4. Air Force maintenance, civil engineering, security forces, logistics, medical, intelligence, cyber, and airfield codes;
5. Coast Guard deck, engineering, aviation, maritime enforcement, intelligence, IT, MST, and response codes;
6. Space Force operations, cyber, intelligence, acquisitions, engineering, and test codes.

For every override, research official duties by skill level and add:

- 6-10 real capabilities;
- 6-10 career directions across at least three sectors;
- why the experience relates;
- required bridge/credential;
- a relevant internal route;
- federal occupational series when defensible;
- apprenticeship or licensing route when relevant;
- explicit language differences for junior, mid-level, and senior experience.

## Suggested `CURATED` evolution

The current override only supports `family`, `intro`, and `capabilities`. Extend it so a code can optionally supply its own `paths` and `bands`:

```js
const CURATED = {
  'Army|12B': {
    intro: '...',
    capabilities: ['...'],
    paths: [
      ['Construction operations', 'Civilian', 'Why it fits', 'Credential bridge', 'internal-page.html']
    ],
    bands: [
      ['E-1–E-4', 'Hands-on evidence specific to 12B'],
      ['E-5–E-6', 'Team/squad scope specific to 12B'],
      ['E-7–E-9', 'Platoon/company/program scope specific to 12B']
    ]
  }
};
```

Then change `page()` to prefer `curated.paths ?? PATHS[family]` and `curated.bands ?? experienceBands(...)`.

For maintainability, move overrides out of the generator once they grow beyond roughly 25 entries:

- recommended new file: `data/mos-curation.json` or `data/mos-curation.js`;
- add a JSON schema and validator;
- require citations/source URLs per override;
- add `reviewedAt` and `reviewedBy` fields;
- add a `status` such as `baseline`, `researched`, or `veteran-reviewed`.

## Editorial safety rules

- Never imply that military experience automatically grants a civilian license or protected professional title.
- Distinguish adjacent experience from direct qualification.
- Avoid presenting salary figures without a current authoritative source and date.
- Do not reduce combat arms to law enforcement/security.
- Do not reduce drivers to trucking, maintainers to mechanics, medics to EMT, intelligence to analyst, or senior NCOs to generic managers.
- Search by tasks, equipment, systems, scale, and outcomes—not only the military title.
- Treat rank as a clue to scope, never proof of duties. Assignment history controls.
- Keep federal qualification language tied to the specific vacancy's specialized-experience requirement.
- Do not restore the removed VA claim-building tool; see root `HANDOFF.md`.

## Contrast follow-up

The fallback stylesheet fixes the seven known broken career pages. Claude Code should still run a rendered mobile screenshot sweep over all career-cluster pages because the repository contains several generations of inline styles.

At minimum verify at 360x800 and 390x844:

- hero heading/subheading contrast;
- body text and link contrast;
- cards and callouts;
- tables without viewport overflow;
- hamburger and accordion touch targets;
- legal bar wrapping;
- floating Scout button overlap.

The Codex in-app browser connection was unavailable during this task, so verification was source-, validator-, audit-, and hosting-build-based rather than screenshot-based.

## Files changed by this task

- `career-guide-fallback.css` (new)
- seven `veteran-*-careers.html` pages listed above
- `scripts/generate-mos-guides.mjs` (new)
- `scripts/validate-mos-guides.mjs` (new)
- `mos-crosswalk-data.json` (new)
- all 561 `mos/*.html` pages
- all six branch hub pages
- `generate-sitemap.py`
- `sitemap.xml`
- `reports/content-quality-audit.csv`
- `reports/content-quality-summary.json`
- this handoff

## Deployment workflow

Follow the repository's required PR flow from `HANDOFF.md`:

```powershell
git fetch origin main
git checkout -b <branch> origin/main
# edit/regenerate/validate
git add <files>
git commit -m "..." -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
git push origin HEAD:<branch>
gh pr create --head <branch> --base main --title "..." --body "..."
gh pr merge <number> --squash --delete-branch
```

Do not edit `app.bundle.js` by hand. This task does not change `app.js`, so no app bundle change is expected.

## Immediate next step for Claude Code

Start with a focused research batch rather than attempting hundreds of shallow rewrites:

1. extend the override structure to support code-specific `paths`, `bands`, citations, and review status;
2. fully curate Army 11B, 12B, 68W, 88M, 91B, and 92Y as the first representative set;
3. run the generator and validator;
4. render those six pages on mobile and desktop;
5. get veteran/SME review before scaling the pattern to the next family.

The goal is not just more pages. The goal is a trustworthy opportunity map that respects what the veteran actually did and shows credible routes they may not have considered.
