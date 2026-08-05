# HealthChain Design System

Design system for **HealthChain** — a blockchain-secured electronic medical records platform for Zambian hospitals. This repository covers the **patient-facing mobile app** (React Native / Expo): patients own their medical data and control who sees it. Records from other hospitals stay **locked** until the patient approves access from the app.

> **Brand name is always “HealthChain”** — never “MedLink”, never abbreviated. Patients sign in with their **National ID**, not email. Market context: Zambia, mid-range Android, variable connectivity, varying digital literacy.

---

## Sources

This system was built from the **HealthChain Patient Mobile App — Redesign Brief** (provided as text). No external codebase or Figma file was attached; if you have them, link them here so future contributors can reconcile:

- Codebase (React Native / Expo): _not provided — add path/repo_
- Figma: _not provided — add link_

The visual language below **refines and systematizes** the colors, type and patterns named in that brief.

---

## Product & screens

The patient app has eight screens, all recreated in `ui_kits/patient-app/`:

1. **Login** — National-ID + password, reassuring first impression.
2. **Records home** — visit list + quick actions (My Hospital ID, Health Trends).
3. **Visit detail** — full clinical record: vitals, consultation, diagnoses, prescriptions, labs, imaging, discharge.
4. **My Hospital ID** — a QR “digital ID card” the patient shows at reception (encodes only the patient ID).
5. **Access control center** _(signature feature)_ — approve/deny clinician requests, manage grants, view emergency overrides.
6. **Health Trends** — line charts of vitals over time.
7. **Referrals** — track referrals to other institutions.
8. **Profile** — demographics, account, support, sign out.

**Core metaphor:** `locked → request → pending → granted`. Away-institution records and all data access follow this one tactile flow (see `components/status/LockState`).

---

## CONTENT FUNDAMENTALS

How HealthChain talks to patients.

- **Voice:** calm, trustworthy, medical-grade but warm. The patient is in control; copy reassures rather than alarms.
- **Person:** address the patient as **“you”**; the app refers to **“your records”, “your permission”**. Possessive and empowering — “My Hospital ID”, “My records”. Never clinical jargon at the patient.
- **Tone by context:** neutral-calm for everyday data; reassuring for privacy moments (“This code contains only your patient ID — no medical information”); plain and direct for safety (“Allergies: Penicillin”).
- **Casing:** Sentence case everywhere — titles, buttons, labels. UPPERCASE only for tiny overlines/role badges (“PATIENT”, section labels) and the `critical` priority pill.
- **Buttons are verbs:** “Sign in”, “Approve access”, “Request access”, “Revoke”, “Update”. Destructive actions say exactly what they do.
- **Numbers & units:** always pair value with unit (`38.9 °C`, `128/84 mmHg`, `94 %`). IDs and codes in monospace (`VIS-2026-A3F2`, ICD `J45.909`, `NRC 123456/78/9`).
- **Reassurance pattern:** privacy/consent copy states what is *and isn’t* shared, then what still requires permission.
- **Emoji:** never. Trust is carried by iconography (lock, shield, verified), not emoji.
- **Empty states** are warm and explain what *will* appear: “No referrals yet — when your doctor refers you to another hospital, it’ll appear here.”
- **Examples:**
  - Tagline: “Your medical records, owned by you and unlocked only with your permission.”
  - Error: “Invalid credentials. Please try again.”
  - Transparency: “Permanently logged to blockchain · shown to you for transparency.”

---

## VISUAL FOUNDATIONS

- **Color:** a single brand green (`#059669`) anchors trust and the “granted/healthy” state, deepening to `#047857` for pressed/dark. Soft green tints (`#ECFDF5`, `#D1FAE5`) wash backgrounds and selected chips. Neutrals are a warm-cool ink ramp on a near-white `#FAFAFB` app surface with white cards. Semantic hues are reserved and consistent: **coral** = critical/destructive, **amber** = urgent/warning, **blue** = info, **violet** = accent/blockchain. Each semantic has a soft tint for fills and a darker ink for text-on-light (WCAG AA).
- **Type:** **DM Sans** is the UI workhorse (400–700). **Playfair Display** appears only at display moments — the wordmark and the login hero — for warmth without cost on small screens. **DM Mono** carries IDs, codes and the QR payload. Mobile scale tops at 34px display / 26px h1; nothing functional below 13px. Tight tracking on headings, generous 1.5 line-height on body.
- **Spacing:** 8pt grid with 4px half-steps. 20px screen gutters. Touch targets ≥ 44px (buttons 48px, inputs 52px). Generous vertical rhythm between sections (20–24px).
- **Backgrounds:** flat and quiet — `#FAFAFB` app surface, white cards. No photography (low bandwidth). The only gradient is a subtle radial on the login/ID-card chrome and the brand-green ID card; never gradient-on-gradient, never the AI-slop purple gradient.
- **Cards:** white, `1px #E5E7EB` border, 14–18px radius, soft low-spread shadow (`--elev-1/2`). The ID card is the one bold surface (deep-green, 24px radius, raised). Optional 4px left accent stripe for status emphasis — used sparingly.
- **Corners:** 10/14/18/24px ramp; pills fully rounded.
- **Elevation:** restrained, RN-translatable — low-spread shadows only, no heavy blur. A green-tinted lift (`--elev-brand`) on primary CTAs and the FAB.
- **Borders vs shadow:** cards use border + faint shadow together; dividers are `1px` hairlines (`--border-faint`).
- **Transparency & blur:** avoided for performance — overlays use a flat `rgba(10,14,26,0.45)` scrim, not backdrop-blur.
- **Animation:** calm and quick (120–320ms), standard/`ease-out` curves. Buttons press-scale to 0.97; sheets slide up; sections rotate a chevron. **No bounce** on clinical data; no infinite decorative loops (only the loading-state pulse).
- **Hover/press:** mobile-first — press states (scale-down, slightly deeper fill) carry interaction. Web previews darken/lighten via the same tints.
- **Safety-critical info** (blood type, allergies, abnormal labs, critical priority) is **never color alone** — always color **+ icon + position**: a coral tinted banner with an alert-triangle, pinned to the top of the screen/card.
- **Imagery:** essentially none beyond the logo and stroke icons; the QR matrix is the most graphic element.

---

## ICONOGRAPHY

- **System:** a curated **stroke icon set** (2px, 24px grid, round caps/joins) shipped inline in `components/core/Icon.jsx`. Path data **mirrors [Lucide](https://lucide.dev)** (ISC-licensed) so the design system has **no runtime dependency**. In production React Native, use **`lucide-react-native`** with the same names.
- **Why inline:** low bandwidth + RN portability. Icons are monochrome and inherit `currentColor`, so they tint to any token.
- **Usage:** icons are functional, not decorative — `lock`/`unlock`/`shield`/`shield-check` for the access metaphor and trust signals; `alert-triangle`/`alert-octagon` for warning/critical (escalating weight); medical glyphs `heart-pulse`/`stethoscope`/`pill`/`flask`/`scan` label clinical sections; `qr-code`, `fingerprint`, `link` (chain = blockchain) for product-specific moments.
- **No emoji. No PNG icons.** The brand mark (`assets/logo-mark.svg`) is the only bespoke vector — a shield holding a medical cross built from two interlocking chain links.
- **Available names:** see the `IconName` union in `components/core/Icon.d.ts`.

> ⚠️ **Substitution flagged:** icon path data approximates Lucide; the brand fonts (DM Sans, Playfair Display, DM Mono) load from **Google Fonts CDN**, not self-hosted. Provide official `.woff2`/`.ttf` files to self-host (see Caveats in the handoff).

---

## Index / manifest

**Root**
- `styles.css` — global entry point (import this); `@import`s the token files below.
- `readme.md` — this file.
- `SKILL.md` — Agent-Skills-compatible usage guide.

**Tokens** (`tokens/`) — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`

**Foundations** (`guidelines/*.card.html`) — color (brand / ink / semantic), type (display / body), spacing (scale / radii-elevation), brand (logo). Rendered in the Design System tab.

**Components** (`components/`)
- `core/` — `Icon`, `Button`, `IconButton`, `Card`, `Avatar`
- `status/` — `StatusPill`, `PriorityPill`, `TrustBadge`, `LockState`
- `forms/` — `Input`, `PermissionChip`
- `navigation/` — `TabBar`, `ScreenHeader`
- `feedback/` — `EmptyState`, `VitalStat`, `SectionHeader`, `ListRow`

**UI kit** (`ui_kits/patient-app/`) — interactive recreation of all 8 screens. Open `index.html`.

**Assets** (`assets/`) — `logo-mark.svg`.
