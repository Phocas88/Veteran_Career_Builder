# VA calculator rates and condition reference

Sources checked October 28, 2026:

- [VA compensation tables](https://www.va.gov/disability/compensation-rates/veteran-rates/): published **2026** dollar amounts, effective December 1, 2025.
- [VA SMC tables](https://www.va.gov/disability/compensation-rates/special-monthly-compensation-rates/): published **2026** amounts. SMC-S is a replacement basic schedule, not a flat addition. SMC-K is additive, including at a zero-percent combined rating.
- [SSA 2027 fact sheet](https://www.ssa.gov/cola/factsheets/2027.html): **3.6%** announced COLA.
- [VA rating calculation guidance](https://www.va.gov/disability/about-disability-ratings/): highest-first whole-person combination.
- [38 CFR 4.26](https://www.ecfr.gov/current/title-38/chapter-I/part-4/subpart-A/section-4.26): bilateral factor, which is not modeled here. Users can enter their VA-assigned combined rating instead.
- [38 CFR Part 4, Subpart B](https://www.ecfr.gov/current/title-38/chapter-I/part-4/subpart-B): diagnosis-specific rating schedules, linked from each condition category.

The 2027 selector intentionally says **COLA estimate**. The amount is projected from each applicable published 2026 table component, multiplied by 1.036 and rounded to cents. Additions are then multiplied by their dependent/award counts and summed in integer cents. Official future rounding or dollar amounts may differ. The projected amount is not represented as currently payable. The published 2026 option remains available. Unknown rate years are rejected.

When VA publishes its 2027 dollar tables, replace the projection with explicit verified tables for each basic/dependent status and SMC-S, and explicit child, parent, spouse Aid and Attendance, and SMC-K amounts. Set the year metadata to published, record the official effective date, update the UI and this note, and add fixtures from the official table examples. Do not silently relabel a percentage projection as a published table.

Common-condition names come from the main VCP calculator. The app adds searchable categories and plain-language descriptions, not automatic medical ratings. All percentages must be supplied by the user. Unlisted conditions can be entered manually. Condition type describes the user's recorded connection; it does not alter the rating math or establish eligibility. Do not infer awards or eligibility from a condition name.

Calculator state stays in memory in its current tab. No medical entries go to Firebase, AI, analytics, browser persistent storage, or resume/profile records. An explicit PDF download uses the existing self-hosted document engine to prepare a local PDF. A separate print action opens a local document, created with text nodes, for the browser's print menu. Downloads in progress are discarded if calculator/account state clears. Account clearing resets all calculator inputs.

Tests cover published examples, dependent arithmetic, projection labeling/rounding, zero-percent awards, SMC-S replacement, additive SMC-K, VA-awarded TDIU, category coverage, manual input, pending-edit confirmation, results focus, printing and no account writes.
