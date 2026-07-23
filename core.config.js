/* Aligned app module: core.config.js (split from live; load order matters) */

/* ===================================================================
   CONFIG - integration points.
   =================================================================== */
const CONFIG = {
  N8N_WEBHOOK: 'https://alignedwebservices.app.n8n.cloud/webhook/remake', // live engine (reel mode)
  SCRIPT_WEBHOOK: 'https://alignedwebservices.app.n8n.cloud/webhook/script-video', // live script engine
  PRESENTERS_FEED: 'https://alignedwebservices.app.n8n.cloud/webhook/presenters', // FULL Avatar V presenter catalogue, built + cached server-side (see "Aligned - Avatar V Presenter Library")
  PRESENTER_LOOKS: 'https://alignedwebservices.app.n8n.cloud/webhook/presenter-looks', // one presenter's looks, fetched only when the customer opens that presenter
  AVATARS_WEBHOOK: '', // RETIRED: the old /webhook/avatars2 feed read page ONE of an alphabetical list, which is why every presenter was an A-name. Do not revive it.
  TWIN_WEBHOOK: 'https://alignedwebservices.app.n8n.cloud/webhook/create-twin', // upload footage -> digital twin + consent link
  VOICE_WEBHOOK: 'https://alignedwebservices.app.n8n.cloud/webhook/clone-voice', // clones the customer's real voice (ElevenLabs) from their twin clip
  TWINBUILD_WEBHOOK: 'https://alignedwebservices.app.n8n.cloud/webhook/twin-build', // AI Twin (Higgsfield Soul): upload 5-20 selfies -> train a consistent identity
  TWINCONSENT_WEBHOOK: 'https://alignedwebservices.app.n8n.cloud/webhook/twin-consent', // returns the unique consent + verification script the user must read on camera
  HFAVATAR_WEBHOOK: 'https://alignedwebservices.app.n8n.cloud/webhook/hf-avatar', // shared Higgsfield twin engine: {email,mode,script,scene,videoId,callbackUrl} -> renders + delivers a twin video (Simple or Scroll Stopper)
  HGAVATAR_WEBHOOK: 'https://alignedwebservices.app.n8n.cloud/webhook/hg-avatar', // HeyGen talking-avatar engine, used when we have a real HeyGen avatar id (stock presenters). Wants camelCase {avatarId,voiceId,script,email,videoId,aspect,callbackUrl}. WARNING: every field is optional server-side, so a missing or misspelled avatarId does NOT error - it quietly falls back to Chris's own twin and the customer gets a video of a stranger. Always send a real avatarId.
  TWINDELIVER: 'https://alignedwebservices.app.n8n.cloud/webhook/twin-deliver', // engine callback: emails the finished twin video to the user
  GENPRESENTER: 'https://alignedwebservices.app.n8n.cloud/webhook/gen-presenter', // generate a brand-new AI presenter (from a description or AI-designed) -> returns a Cloudinary photo url
  AGENT_WEBHOOK: 'https://alignedwebservices.app.n8n.cloud/webhook/agent', // Claude content strategist agent (async: returns a jobId instantly)
  AGENT_POLL: 'https://alignedwebservices.app.n8n.cloud/webhook/agent-poll', // poll for the finished agent/plan result by jobId (avoids the ~100s proxy timeout on long plan builds)
  FETCH_SITE: 'https://alignedwebservices.app.n8n.cloud/webhook/fetch-site', // reads a customer's website -> text the agent uses to tailor the plan
  PLAN_WEBHOOK: 'https://alignedwebservices.app.n8n.cloud/webhook/plan', // daily content plan engine (activate)
  PLAN_CONTROL: 'https://alignedwebservices.app.n8n.cloud/webhook/plan-control', // pause/resume the daily render schedule
  DECISION: 'https://alignedwebservices.app.n8n.cloud/webhook/decision', // approve->auto-post / reject->re-render (same endpoint decide.html hits)
  CREDIT_WEBHOOK: 'https://alignedwebservices.app.n8n.cloud/webhook/credit-ping', // low-credit tracker/alerts
  CLOUDINARY_CLOUD: 'dpmcro85d',      // Cloudinary cloud name (public)
  CLOUDINARY_PRESET: 'aligned_twins', // unsigned upload preset (public)
  SIGNUP_WEBHOOK: 'https://alignedwebservices.app.n8n.cloud/webhook/signup', // sends the welcome email (Gmail) on signup
  PROFILE_WEBHOOK: 'https://alignedwebservices.app.n8n.cloud/webhook/profile', // saves name/phone server-side so they aren't trapped in one browser
  ACCOUNT_GET:  'https://alignedwebservices.app.n8n.cloud/webhook/account-get',  // fetch a customer's account by email (cross-device login)
  ACCOUNT_SAVE: 'https://alignedwebservices.app.n8n.cloud/webhook/account-save', // persist the account server-side (source of truth)
  AUTH_WEBHOOK: 'https://alignedwebservices.app.n8n.cloud/webhook/auth', // server-side login / register / set-password (signed session tokens)
  NOTIFY_WEBHOOK: 'https://alignedwebservices.app.n8n.cloud/webhook/notify', // emails Chris on signups, add-on buys, connect requests
  REFERRAL: 'https://alignedwebservices.app.n8n.cloud/webhook/referral', // records a partner referral (from ?ref=CODE) when a referred visitor signs up
  AUTOPILOT_ONBOARD: 'https://alignedwebservices.app.n8n.cloud/webhook/autopilot-onboard', // Social Autopilot: emails the customer the 2-step onboarding + emails Chris a paste-ready Gram Genies client sheet
  SOCIAL_AUTOPILOT_LINK: 'https://api.alignedwebservices.ca/payment-link/6a4c0f4cd6425bc9468482df', // GHL $297/mo recurring checkout for the Creator "Social Autopilot" add-on
  CRM_LOC: 'https://alignedwebservices.app.n8n.cloud/webhook/crm-loc', // resolve a client's CRM sub-account (locationId) from their email, so CRM deep-links to the active client
  LOGIN_LINK_WEBHOOK:   'https://alignedwebservices.app.n8n.cloud/webhook/login-link',   // emails a one-time magic login link
  LOGIN_VERIFY_WEBHOOK: 'https://alignedwebservices.app.n8n.cloud/webhook/login-verify', // verifies the magic link token
  FACELESS_WEBHOOK: 'https://alignedwebservices.app.n8n.cloud/webhook/faceless', // no-avatar pipeline: voiceover (cloned voice) + B-roll + Submagic captions
  STOCK_BROLL: 'https://alignedwebservices.app.n8n.cloud/webhook/stock-broll', // returns matching portrait stock clips for faceless days when the customer has no B-roll of their own
  CAROUSEL: 'https://alignedwebservices.app.n8n.cloud/webhook/carousel', // turns a topic/script into branded swipe-carousel slides + emails them to review/post
  HYPERFRAMES: 'https://alignedwebservices.app.n8n.cloud/webhook/hyperframes', // (retired) old HeyGen HyperFrames reel path
  REEL_REQUEST: 'https://alignedwebservices.app.n8n.cloud/webhook/reel-request', // manual cinematic reel -> Reel Request Queue (Higgsfield pipeline, generated on the schedule)
  UPLOAD_WEBHOOK: 'https://alignedwebservices.app.n8n.cloud/webhook/upload', // "upload a video" pipeline: Submagic captions the customer's own video + deliver
  CONNECT_WEBHOOK: 'https://alignedwebservices.app.n8n.cloud/webhook/connect-social', // sends the authorize link via GHL
  CONNECT_AUTH_URL: 'https://app.alignedwebservices.ca/connect', // base authorize destination (set to real OAuth/connect once built)
  SOCIAL_STATUS: 'https://alignedwebservices.app.n8n.cloud/webhook/social-status', // live check: reads which platforms are actually connected in GHL
  TWIN_STATUS: 'https://alignedwebservices.app.n8n.cloud/webhook/twin-status', // reads the twin's HeyGen training status + preview image
  TWIN_LOOKS: 'https://alignedwebservices.app.n8n.cloud/webhook/twin-looks', // lists the twin group's real looks (HeyGen) so all recorded looks appear in the pickers
  READY_VIDEOS: 'https://alignedwebservices.app.n8n.cloud/webhook/ready-videos', // which of my videos have finished rendering (so the dashboard flips them to Awaiting approval)
  AVATAR_IV: 'https://alignedwebservices.app.n8n.cloud/webhook/avatar-iv', // one-click ultra-realistic (Avatar IV) re-render of a video using the customer's twin photo + cloned voice
  UGC_SCRIPT: 'https://alignedwebservices.app.n8n.cloud/webhook/ugc-ad-script', // UGC ad: product details -> 3 ad script variations (hooks + shot list + caption)
  UGC_RENDER: 'https://alignedwebservices.app.n8n.cloud/webhook/ugc-render', // UGC ad: chosen script -> presenter + product cutaway ad, delivered to Approvals
  AVATAR_SHOTS: 'https://alignedwebservices.app.n8n.cloud/webhook/avatar-shots', // cinematic clip (Avatar Shots): POST {email,topic,lookId,videoId,name,phone} -> 70-credit HeyGen cinematic clip delivered to Approvals
  CINEMATIC_SCENE: 'https://alignedwebservices.app.n8n.cloud/webhook/cinematic-scene', // cinematic scene: POST {email,prompt,script,avatar_ids,videoId,name,phone,caption,duration} -> 150-credit AI scene clip delivered to Approvals
  AV4_CREDIT: 'https://alignedwebservices.app.n8n.cloud/webhook/av4-credit', // server-authoritative ultra-realistic credit wallet: POST {email,amount} (+ on payment / − on upgrade) → returns new balance
  STRIPE_LINKS: {
    creator:   'https://api.alignedwebservices.ca/payment-link/6a2edd4171a0aa761e464ad2',
    thumbnail: 'https://api.alignedwebservices.ca/payment-link/6a2edf2b03b17c94f57163ac',
    packs:     'https://api.alignedwebservices.ca/payment-link/6a2edf9e71a0aa761e464add',
    social:    'https://api.alignedwebservices.ca/payment-link/6a32f6f6eaa0b5cf5db55f95', // Social Connect - hands-free posting, $29/mo (GHL product)
    rss:       'https://api.alignedwebservices.ca/payment-link/6a394ee1ed4f7e6d093c5c32', // News Feed to Video - $19/mo (GHL product/payment link)
    av4_25:    'https://api.alignedwebservices.ca/payment-link/6a396afe7a7ef176dee58393', // Ultra-realistic credits - $25 top-up (GHL one-time)
    av4_50:    'https://api.alignedwebservices.ca/payment-link/6a396b637a7ef176dee58395', // Ultra-realistic credits - $50 top-up (GHL one-time)
    thumb10:   'https://api.alignedwebservices.ca/payment-link/6a4051a89b12592b36824e1d', // (legacy) Premium Thumbnails - 10 Pack, $15
    thumb30:   'https://api.alignedwebservices.ca/payment-link/6a4051ee390a6e280643afda', // (legacy) Premium Thumbnails - 30 Pack, $35
    c20:       'https://api.alignedwebservices.ca/payment-link/6a409546390a6e280643b014', // Aligned Credits - 200 credits, $20 (GHL one-time)
    c50:       'https://api.alignedwebservices.ca/payment-link/6a40957b9b12592b36824e5f', // Aligned Credits - 575 credits, $50 (GHL one-time)
    c80:       'https://api.alignedwebservices.ca/payment-link/6a4095a8390a6e280643b017'  // Aligned Credits - 1,000 credits, $80 (GHL one-time)
  },
  THUMB_BALANCE: 'https://alignedwebservices.app.n8n.cloud/webhook/thumb-balance', // (legacy) POST {email} -> premium-thumbnail credits left
  CREDIT_BALANCE: 'https://alignedwebservices.app.n8n.cloud/webhook/credit-balance', // unified Aligned Credits wallet: POST {email} -> {available, plan}
  USE_CREDIT: 'https://alignedwebservices.app.n8n.cloud/webhook/use-credit', // POST {email, amount} -> deduct N credits -> {ok, remaining}
  ADD_CREDIT: 'https://alignedwebservices.app.n8n.cloud/webhook/add-credit', // POST {email, credits} -> add N credits (comped/test top-ups)
  CONTENT_AUDIT: 'https://alignedwebservices.app.n8n.cloud/webhook/content-audit', // POST {email,niche,links} -> exposure-focused content health audit (score + gaps)
  FEEDBACK: 'https://alignedwebservices.app.n8n.cloud/webhook/feedback', // Suggest-a-feature: POST {email,name,plan,title,message} -> formatted internal email to Chris (SMTP)
  RSS_SAVE: 'https://alignedwebservices.app.n8n.cloud/webhook/rss-save', // saves a customer's RSS feeds so the backend can auto-make a reel from each new item
  HANDOFF_WEBHOOK: 'https://alignedwebservices.app.n8n.cloud/webhook/twin-handoff', // twin phone handoff: op=create mints a short-lived token (+ consent script) for the QR, op=resolve reads it on the phone
  TWIN_CONSENT_REMINDER: 'https://alignedwebservices.app.n8n.cloud/webhook/twin-consent-reminder', // POST {email,name,consent_url} -> emails the user a branded button that reopens their HeyGen consent page (fired once when they tap "I'll do it later")
  MOCKUP_BUILD: 'https://alignedwebservices.app.n8n.cloud/webhook/build-mockup', // self-serve builders: POST {id,company,siteGoals,message,currentSite,brandColor,brandAccent,brandLogo,name,email,phone,source} -> renders a hosted preview into staticData[id]
  MOCKUP_GET: 'https://alignedwebservices.app.n8n.cloud/webhook/mockup', // GET ?id=X&embed=1 -> preview HTML (returns an AWS_BUILDING marker page while still rendering)
  MOCKUP_EDIT: 'https://alignedwebservices.app.n8n.cloud/webhook/edit-mockup', // refine loop: POST {id,request} -> AI rewrites the preview in place -> {ok}
  GOLIVE_URL: 'https://alignedwebservices.ca/?golive=', // take the approved preview live (append the mockup id)
  STRIPE_PORTAL: 'https://dkes9fgpox0tudursux4.app.clientclub.net/',
  TRIAL_DAYS: 7,
  DEMO_VIDEO_URL: '' // paste a demo video URL (mp4 or YouTube/Vimeo embed) to show it on the landing page
};

const PLATFORMS = ['Facebook','Instagram','TikTok','YouTube','LinkedIn','X'];
// where to send users who don't have an account on a platform yet
const SIGNUP_URLS = {
  Facebook:  'https://www.facebook.com/r.php',
  Instagram: 'https://www.instagram.com/accounts/emailsignup/',
  TikTok:    'https://www.tiktok.com/signup',
  YouTube:   'https://accounts.google.com/signup',
  LinkedIn:  'https://www.linkedin.com/signup',
  X:         'https://x.com/i/flow/signup'
};
const CAPTIONS = [
  {id:'bold', name:'Bold & punchy', desc:'Big animated words, high energy', def:true},
  {id:'minimal', name:'Clean & minimal', desc:'Subtle, understated, out of the way'},
  {id:'karaoke', name:'Word-by-word', desc:'Each word pops as it\'s spoken'}
];

const THUMB_PRICE = 9; // Creator thumbnail add-on, $/mo (unlimited)
const SOCIAL_PRICE = 29; // Social Connect add-on, $/mo (we connect your socials & auto-post for you) - competitive land price; CRM bundled is the differentiator
const RSS_PRICE = 19; // RSS Auto-Content add-on, $/mo - turn a blog/newsletter/podcast feed into reels automatically (~1 video/day)
const THUMB_COLORS = [
  {name:'Yellow - best for clicks', hex:'ffde00'},
  {name:'Red', hex:'ff3b30'},
  {name:'Green', hex:'34c759'},
  {name:'Orange', hex:'ff9500'},
  {name:'Cyan', hex:'00e5ff'},
  {name:'White', hex:'ffffff'}
];
function userBrandAccent(){ var bk=(DB.user&&DB.user.brandKit)||null; return (bk && bk.accentFrom) ? String(bk.accentFrom).replace('#','') : ''; }
function thumbColor(){ var ba=userBrandAccent(); if(ba) return ba; return (DB.user && DB.user.thumbColor) || 'ffde00'; }
const TWIN = {id:'twin', name:'My twin', twin:true};
/* ===== FALLBACK presenters (HeyGen) ==================================================
   THESE 12 ARE THE SAFETY NET, NOT THE LIBRARY.
   The real picker is the FULL Avatar V catalogue loaded by loadAvatars() below from
   /webhook/presenters (hundreds of presenters, paginated server-side). These 12 are what
   the customer sees only if that feed is unreachable, so the picker is never empty.

   Every avatar in the product is HeyGen: the customer's own twin AND these stock
   presenters. Each `id` below is a REAL HeyGen look id, so it can be passed straight to
   a HeyGen render (v3 /videos, type:'avatar', avatar_id) with no translation step.

   Chosen deliberately for a small-business customer base: balanced gender, varied
   ethnicity and age, and a spread of settings (home, kitchen, office, lounge).
   Each was checked BY EYE from its preview image, because HeyGen's gender/age metadata
   is inconsistent and sometimes simply wrong.

   All 12 are photo_avatar "looks" that report supported_api_engines
   ["avatar_v","avatar_iv","avatar_iii"], so they work on the default Avatar IV engine
   AND support transparent-background webm renders (used by the showcase composite).
   Do NOT swap these for HeyGen "studio_avatar" entries: many of those support ONLY
   avatar_iii and will fail on the default engine.

   `preview` points at our own Cloudinary copy (public id hgp_<name>), not HeyGen's URL.
   HeyGen serves some previews from signed CloudFront links that EXPIRE and have broken
   posting for us before, so every preview is rehosted and permanent.

   PAGINATION LESSON - please read before "fixing" the avatar library again:
   The old stock library looked broken because every presenter had an A-name (Abigail,
   Adam, Alice...). That was never a HeyGen limitation. The old feed simply fetched
   page ONE of an alphabetical list and stopped. HeyGen's public library actually holds
   ~1,466 presenters / ~21,000 looks. To read it properly you must follow the `token`
   cursor returned by list_avatar_groups / list_avatar_looks and keep paging until
   has_more is false. Do not hardcode a workaround for a pagination bug.
   ==================================================================================== */
const FALLBACK_AVATARS = [
  // --- men ---
  {id:'e82fbce307d84673940849e40ac27808', name:'Marco',   voice:'544053989dc94655915bc864a5f81b53', preview:'https://res.cloudinary.com/dpmcro85d/image/upload/hgp_marco.png'},   // 30s, warm + casual, home office
  {id:'f13e313828634f56b4e1cd92b2db9ab9', name:'Theo',    voice:'748c2de9e04041bd9de5da58c62692a6', preview:'https://res.cloudinary.com/dpmcro85d/image/upload/hgp_theo.png'},    // 50s, suit, seasoned/advisory
  {id:'efb536a628bc4aca822dcdbd28657c46', name:'Enzo',    voice:'1a4fe6318c714c7096bcb1509a46e64e', preview:'https://res.cloudinary.com/dpmcro85d/image/upload/hgp_enzo.jpg'},    // 30s, relaxed shirt, at home
  {id:'db8ef6b54e6142cba9a7bbf1d8dbf000', name:'Anton',   voice:'c69b0f2e20254e8a9bd3a37329344d1f', preview:'https://res.cloudinary.com/dpmcro85d/image/upload/hgp_anton.jpg'},   // 30s, smart-casual, bright home
  {id:'ae729c0facb6489ca9b46df880c44245', name:'Shun',    voice:'8c78cc18f956476d8264c5d85de45429', preview:'https://res.cloudinary.com/dpmcro85d/image/upload/hgp_shun.jpg'},    // 30s, tailored, design-studio lounge
  {id:'c1aaf321df5a4f6dace727c2b449008d', name:'Junho',   voice:'20d30810dcc14a46a861b77aa3a5b673', preview:'https://res.cloudinary.com/dpmcro85d/image/upload/hgp_junho.jpg'},   // 20s, friendly + casual, living room
  // --- women ---
  {id:'b32c1de920ed41618ed09c34a4a5ac7d', name:'Talia',   voice:'aed6e0251e4a4786b7b5417c0c30f6eb', preview:'https://res.cloudinary.com/dpmcro85d/image/upload/hgp_talia.png'},   // 30s, upbeat, bright cafe/office
  {id:'d9fc39c4b5a246b98929bea09cb2344d', name:'Emi',     voice:'b644a7c9f5f741b7b37d3edbc17ee94f', preview:'https://res.cloudinary.com/dpmcro85d/image/upload/hgp_emi.png'},     // 30s, sharp blazer, modern office
  {id:'ef80926273304f48b8dca4ff5c3cbe07', name:'Elena',   voice:'ac7d71d630d041a7b90473492c6d9a1c', preview:'https://res.cloudinary.com/dpmcro85d/image/upload/hgp_elena.png'},   // 40s, calm + credible, office
  {id:'fc953cf335014c288aa316791842ea91', name:'Nadia',   voice:'2a5bb822fe0f46c28bef00b9c43a6ff7', preview:'https://res.cloudinary.com/dpmcro85d/image/upload/hgp_nadia.jpg'},   // 30s, kitchen/home, everyday
  {id:'df8a5747ac294a1da92be457dc1c8516', name:'Rosalia', voice:'e8cf286bc0cb42ddabd049faceaad77e', preview:'https://res.cloudinary.com/dpmcro85d/image/upload/hgp_rosalia.png'}, // 30s, hospitality/boutique warmth
  {id:'edd98e1d53c94553a26acc9faa4aa458', name:'Yara',    voice:'ee3f332067094a49beb73209b1c455c6', preview:'https://res.cloudinary.com/dpmcro85d/image/upload/hgp_yara.png'}     // 40s, coach/consultant, home studio
];

/* --- ROLLBACK: the previous Higgsfield-generated stock presenters. -------------------
   If the HeyGen presenters above ever need to be reverted, delete the block above and
   uncomment this one. These ids are NOT HeyGen ids - they only worked with the
   Higgsfield photo-animation path (/webhook/hf-avatar), which drives the preview photo.
const FALLBACK_AVATARS = [
  {id:'hfp_maya',  name:'Maya',  voice:'21m00Tcm4TlvDq8ikWAM', preview:'https://res.cloudinary.com/dpmcro85d/image/upload/hfp_maya.png'},
  {id:'hfp_ethan', name:'Ethan', voice:'pNInz6obpgDQGcFmaJgB', preview:'https://res.cloudinary.com/dpmcro85d/image/upload/hfp_ethan.png'},
  {id:'hfp_zara',  name:'Zara',  voice:'21m00Tcm4TlvDq8ikWAM', preview:'https://res.cloudinary.com/dpmcro85d/image/upload/hfp_zara.png'},
  {id:'hfp_arjun', name:'Arjun', voice:'pNInz6obpgDQGcFmaJgB', preview:'https://res.cloudinary.com/dpmcro85d/image/upload/hfp_arjun.png'},
  {id:'hfp_kai',   name:'Kai',   voice:'pNInz6obpgDQGcFmaJgB', preview:'https://res.cloudinary.com/dpmcro85d/image/upload/hfp_kai.png'},
  {id:'hfp_grace', name:'Grace', voice:'21m00Tcm4TlvDq8ikWAM', preview:'https://res.cloudinary.com/dpmcro85d/image/upload/hfp_grace.png'}
];
   ---------------------------------------------------------------------------------- */
let STOCK_AVATARS = FALLBACK_AVATARS.slice(); // reliable, permanent previews - this is the source of truth
function allAvatars(){ return [TWIN].concat(STOCK_AVATARS); }

const PLANS = {
  creator:{name:'Creator', price:97, anchor:297, videos:15, who:'Solo founders, consultants, creators and local businesses who want to show up consistently without ever filming or editing.', features:['15 videos/mo (up to 60s each)','Your AI twin + studio presenters','Auto-written captions & hashtags','30-day content plan on autopilot','Optional thumbnails, cinematic clips & more with credits','Approve or request changes by text','Hands-free posting to your socials'], note:'Need more? Extra video packs and Aligned Credits available any time.'}
};

const ADDONS = [
  {name:'News Feed to Video', buy:'rss', desc:'Connect a blog, newsletter or podcast feed and we automatically turn each new post into a reel in your voice - one video per day per feed, straight to your Approvals. Never uses credits. $'+RSS_PRICE+'/mo.'},
  {name:'Extra video credits', buy:'packs', desc:'Top up Aligned Credits any time for extra videos, thumbnails and cinematic clips beyond your monthly amount.'},
  {name:'Social engagement', buy:'autopilot', desc:'We reply to your DMs & comments and grow your following on autopilot. $297/mo - set it up in Social Autopilot below.'}
];

