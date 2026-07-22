# Aligned: AI content platform

A multi-tenant AI SaaS platform. Designed and built by one person in roughly two months.

A user signs up, records consent, and builds a digital twin of themselves plus a cloned voice. From then on the engine writes, generates, captions, schedules and posts short-form video in their likeness and their voice, every day, to Instagram, Facebook, TikTok and YouTube. The only human step is approval.

**Status: deployed, pre-revenue, zero paying customers.** See [what is not finished](#what-is-not-finished) below, which is the most useful section in this document.

---

## What it does

**Four generation modes**, selectable per day inside a content plan so a month of output does not look like a month of the same video:

- **Avatar**: an on-camera presenter delivering the script as the user's twin
- **Faceless**: B-roll with AI voiceover, from an uploaded clip library or auto-sourced stock
- **Cinematic**: the user's twin composited into a generated AI scene
- **Cinematic reel**: motion-graphics treatment

**AI content strategist**: ingests a website URL or an uploaded document and generates an editable 30-day plan of hooks, scripts and captions. Users can save multiple plans but only one runs daily renders at a time, which is a deliberate constraint on runaway spend.

**Rejection feedback loop**: when a user rejects a video they say why, and that signal shapes the next generation rather than being discarded.

**Around it:** a conversational website builder, credit-based billing, social OAuth, and an agency white-label tier where partner agencies resell the platform under their own brand at their own retail price.

---

## Architecture

No monolith, no framework. A single self-contained HTML application talking over HTTP to **62 discrete workflow endpoints**, each owning one job.

| Domain | Endpoints |
|---|---|
| Identity | signup, auth, login-link, login-verify, profile, account-get, account-save, oauth |
| Billing | add-credit, use-credit, credit-balance, credit-ping, thumb-balance, referral |
| Twin and voice | create-twin, twin-build, twin-status, twin-looks, twin-consent, twin-deliver, twin-handoff, clone-voice |
| Generation | script-video, avatar-iv, avatar-shots, cinematic-scene, faceless, reel-request, hyperframes, carousel, ugc-ad-script, ugc-render, stock-broll, gen-presenter, presenters, presenter-looks, remake |
| Distribution | connect-social, social-status, autopilot-onboard, ready-videos, decision, feedback |
| Planning | plan, plan-control, content-audit, rss-save |
| Sites and CRM | build-mockup, edit-mockup, mockup, fetch-site, crm-loc, crm-status |
| Agents | agent, agent-poll, assistant |

**Stack:** n8n for orchestration, HeyGen, ElevenLabs, Kling 3.0, Higgsfield and Creatomate for generation, Cloudinary for media, Meta Graph, TikTok and YouTube for distribution, GoHighLevel for CRM, Netlify for hosting.

---

## Why one HTML file

This is the decision I get asked about most, so here is the honest answer.

**The case for it.** A single self-contained file deploys atomically. There is no build step to break. One person can diff two versions and roll back in seconds. It let me reach version 86 in about two months without a team, a CI pipeline or a framework upgrade treadmill.

**The case against it.** It does not survive a second developer. There is no module boundary, no type safety, no test suite. Merge conflicts would be brutal. Onboarding someone would mean handing them 4,700 lines in one file and wishing them luck.

**What I actually think.** It was the right call for one person shipping fast and it is the wrong call the moment a second person joins. If I were doing this with a team of five I would not choose it. I can argue either side, and I would rather be asked about the trade-off than pretend it was not one.

---

## Unit economics

Generation costs real money at every vendor, and those costs move. So the billing layer is abstracted:

- A metered credit currency sits between the customer and raw per-model cost
- A vendor balance floor halts generation before the account runs dry mid-queue
- Batch caps bound spend per scheduled run
- Only one content plan renders at a time per account

These went into the specification before the features were built, not into a post-mortem after the first surprise invoice.

---

## What is not finished

In June I ran a launch-readiness audit against my own platform and wrote the findings down instead of shipping past them. Three blockers, still open:

**1. Account state lives in the browser, not on a server.**
Accounts, videos and plans are stored in browser local storage. Sign up on a phone, open a laptop, and the account is not there. Clear the browser and it is gone. There is no central record of customers. For a paid product this is the single biggest risk and it is the first thing I would fix.

**2. The trial does not gate anything.**
After seven days a non-paying user can keep generating video, and every video costs real money at HeyGen, ElevenLabs and Creatomate. Monthly per-plan limits are not enforced either; they only trigger a low-credit alert.

**3. Render failures have no failure path.**
If a render fails partway, the video sits at "Rendering" forever. No error, no retry, no notification to the user or to me.

**Fix order if I had runway:** server-authoritative accounts first, because everything else is built on sand without it. Then real paywall enforcement, because the current state means growth costs me money. Then the render failure path.

---

## Why this document exists

Most portfolios show the good parts. I think the more useful signal is whether someone knows exactly where their own work falls short and can say so in plain language.

I built a working multi-product AI platform alone in two months. It has never been tested by a stranger's credit card. Both of those are true.

---

**Chris Perkins** · chris@alignedwebservices.ca · [alignedwebservices.ca](https://alignedwebservices.ca)
