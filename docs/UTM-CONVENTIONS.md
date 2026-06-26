# Blastbeat UTM & Conversion Tracking — Convention

**Owner:** Tumi · **Last reviewed:** 2026-06-04

This is the single source of truth for how Blastbeat tags inbound links and
fires conversion events. Every campaign, email, deck, social post or pitch URL
that we measure goes through this convention.

---

## 1 · Why this matters

Every untagged link makes your acquisition report a lie. UTMs let GA4 / GTM
attribute a conversion (apply, sponsor enquiry, pitch click) back to the
campaign that produced it. Without the convention you'll see "Direct / None"
for half your traffic and have no idea what's working.

---

## 2 · The five UTM parameters

| Param | Required | Lowercase only | Examples |
|---|---|---|---|
| `utm_source` | yes | yes | `linkedin`, `whatsapp`, `email`, `robert-conference-jun26` |
| `utm_medium` | yes | yes | `social`, `cpc`, `email`, `referral`, `qr`, `sms` |
| `utm_campaign` | yes | yes | `2026-pilot`, `2winaid-launch`, `founders-circle` |
| `utm_content` | optional | yes | `hero-cta`, `gold-button`, `footer-link`, `whatsapp-rob` |
| `utm_term` | optional | yes | Used for **paid search** only — the keyword we bid on |

### Rules

1. **Lowercase, hyphen-separated, no spaces, no special characters.**
   `?utm_source=Robert-Conference` ≠ `?utm_source=robert-conference`. GA4
   treats them as different sources.
2. **Always use all three required params** (`source`, `medium`, `campaign`).
3. **Never re-use `utm_campaign` across unrelated efforts.** Add a year if
   the campaign repeats: `2winaid-launch-2026`, `2winaid-launch-2027`.
4. **One link per channel.** If the same campaign goes out on LinkedIn,
   WhatsApp and email, build three different URLs.

---

## 3 · Source / medium reference

Use **one** of these. If you need a new value, add it here first.

### `utm_medium` (the channel category)

```
social     — LinkedIn, Instagram, Facebook, X, TikTok
email      — any 1:1, newsletter, mailto link
cpc        — Google Ads, LinkedIn ads, Meta ads (paid click)
qr         — QR code (conference handout, sticker, business card)
sms        — SMS / WhatsApp Business
referral   — partner site placement
print      — magazine, brochure, banner with a short URL
```

### `utm_source` (the specific publisher / context)

```
linkedin                — Robert's LinkedIn
linkedin-blastbeat      — Blastbeat company page
whatsapp                — 1:1 WhatsApp
whatsapp-broadcast      — WhatsApp broadcast list
email-newsletter        — monthly newsletter
email-robert            — Robert's 1:1 outreach
robert-conference-jun26 — specific conference handout
google                  — Google search ad
meta                    — Meta ads (FB + IG)
naspers                 — partner referral from Naspers
```

---

## 4 · Canonical link templates

Copy, paste, swap.

**20-school pitch URL** (for Robert's banker outreach)
```
https://www.blastbeat.education/pitch.html?utm_source=robert-conference-jun26&utm_medium=qr&utm_campaign=2026-pilot
```

**For-schools (cold school outreach)**
```
https://www.blastbeat.education/pages/for-schools.html?utm_source=email-robert&utm_medium=email&utm_campaign=2026-pilot
```

**Apply form (warm leads)**
```
https://www.blastbeat.education/pages/apply.html?utm_source=linkedin&utm_medium=social&utm_campaign=2026-pilot&utm_content=hero-cta
```

**2winAid sponsorship**
```
https://www.blastbeat.education/pages/2winaid.html?utm_source=email-robert&utm_medium=email&utm_campaign=2winaid-launch-2026
```

**Founders' Circle**
```
https://www.blastbeat.education/pages/patrons.html?utm_source=robert-conference-jun26&utm_medium=qr&utm_campaign=founders-circle-2026
```

---

## 5 · Conversion events — fire from code

These are wired through `assets/js/analytics.js` and exposed as
`window.bbTrack(eventName, params)`. They push to `dataLayer` even in GTM
stub mode, so you can verify wiring before going live.

| Event name | When it fires | Required params |
|---|---|---|
| `view_pitch` | pitch.html loaded | `utm_source`, `utm_campaign` (auto from URL) |
| `apply_started` | first input focus on apply form | none |
| `apply_completed` | apply form submits successfully | `school_name`, `country` |
| `sponsorship_enquiry` | sponsorship-enquiry form submits | `tier`, `country` |
| `licence_clicked` | "Licence" CTA clicked | `source_page` |
| `contact_submitted` | contact form submits | `topic` |
| `beat_chat_opened` | Beat bot opened | none |
| `beat_chat_message` | user sends a Beat message | `intent` (from KB) |

Example call (in any HTML page or JS file):

```js
window.bbTrack && window.bbTrack('apply_completed', {
  school_name: form.schoolName.value,
  country: form.country.value
});
```

---

## 6 · GA4 setup checklist (do once when wiring GTM)

1. Create GA4 property → Admin → Data Streams → Web → grab the
   `G-XXXXXXXXXX` measurement ID.
2. Create GTM container → Admin → grab `GTM-XXXXXXX`.
3. In GTM: add a GA4 Configuration tag with the G- ID, fire on **All Pages**.
4. In GTM: for each `bbTrack` event in §5, add a Custom Event trigger and a
   GA4 Event tag that maps the dataLayer params.
5. Mark `apply_completed`, `sponsorship_enquiry`, `contact_submitted` as
   **Key Events** in GA4 (Admin → Events → toggle "Mark as key event").
6. Set the conversion value:
   - `apply_completed` — 1
   - `sponsorship_enquiry` — by tier (see /assets/js/admin.js TIER_VALUE map)
   - `contact_submitted` — 0.25
7. Open `assets/js/analytics.js`, replace `GTM_ID = 'GTM-XXXXXXX'` with the
   real ID, commit. GTM goes live.

---

## 7 · Meta Pixel + LinkedIn Insight (when ready)

Both go in **as tags inside GTM** — never paste the pixel snippet directly
into a page. That way our consent banner gates them properly under Consent
Mode v2 and the cookie banner reject button actually rejects them.

| Pixel | GTM tag template | Consent category |
|---|---|---|
| Meta Pixel | Facebook Pixel (community template) | `ad_storage` |
| LinkedIn Insight | LinkedIn Insight Tag (community template) | `ad_storage` |
| Google Ads conversion | Google Ads Conversion Tracking | `ad_storage` |

Wire them once → trigger them on the same events as §5.

---

## 8 · Auditing & hygiene

- **Quarterly:** review GA4 Acquisition report. Any `Source / Medium = (not set)`
  rows means we shipped an untagged link. Find it, fix it.
- **Before every campaign:** build the link, paste in
  [ga-dev-tools.app/campaign-url-builder/](https://ga-dev-tools.app/campaign-url-builder/),
  share the result, not the raw URL.
- **Never strip query string** on redirects. Netlify `_redirects` must preserve
  UTMs.

---

*This document is the contract. If it's not here, it's not the convention.*
