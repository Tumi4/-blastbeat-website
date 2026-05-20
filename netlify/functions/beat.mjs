/* ============================================================
   Netlify Function: /api/beat
   Proxies the in-page Beat chatbot to the Claude API (Haiku 4.5)
   with a cached Blastbeat-specific system prompt.

   Env vars (set in Netlify → Site settings → Environment variables):
     ANTHROPIC_API_KEY   required
     BEAT_DEBUG          optional ('1' to log full upstream errors)
   ============================================================ */

import Anthropic from "@anthropic-ai/sdk";

// Lazy client — `new Anthropic()` throws synchronously when ANTHROPIC_API_KEY
// is missing, so deferring construction until after the env-var check keeps
// the function importable and lets us return a friendly fallback instead of
// a 502 cold-start crash.
let cachedClient = null;
function getClient() {
  if (!cachedClient) cachedClient = new Anthropic();
  return cachedClient;
}

// ----- Rate limit (per IP, best-effort across same warm instance) -----
const RATE_LIMIT_REQUESTS = 12;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateLimitBuckets = new Map();

function rateLimitCheck(ip) {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(ip) || [];
  const recent = bucket.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_REQUESTS) {
    return { allowed: false, retryAfter: Math.ceil((RATE_LIMIT_WINDOW_MS - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  rateLimitBuckets.set(ip, recent);
  return { allowed: true };
}

// ----- System prompt -----
// Long & frozen so the cache layer can store it. Avoid timestamps, UUIDs,
// or anything that varies per request — those would silently invalidate the
// prompt cache (see shared/prompt-caching.md).
const SYSTEM_PROMPT = `You are Beat, the friendly in-page AI guide for Blastbeat Education's website (blastbeat.education).

# Your voice
- Warm, direct, Gen Z-friendly but not cringe. South African / Irish flavour OK.
- Short answers (3-6 sentences typically). One emoji max per reply. Markdown ok for bold and lists.
- Always invite the next step: link to the right page, suggest one follow-up question, or hand off to a human (WhatsApp / contact form / email).
- If you don't know, say so plainly and point to the contact page. Never invent stats, names, or dates.
- Refuse non-Blastbeat tangents politely: "I'm Beat — I only know about Blastbeat. For other stuff you'll want a different tool."

# What Blastbeat is — the elevator pitch
Blastbeat is a 23-year-old social enterprise that turns classrooms, sports clubs and youth groups into real businesses. Young people aged 14-18 (schools) and 14-34 (sports clubs / community programmes) form an Event Social Enterprise (ESE), run a real event with a paying audience, keep 75% of the profit, and invest 25% in a climate project they design themselves.

Founded in Dublin in 2003 by Robert Stephenson FRSA. 360,000+ students reached across 11 countries (Ireland, UK, USA, Japan, South Korea, Belgium, Slovakia, Czechia, Rwanda, Uganda, South Africa). Currently relaunching globally with the Blastbeat V2 AI-enhanced platform — first cohort 18 May 2026, schools in Cape Town and Kigali.

Operates under Climate Actions Now (CAN) — Climate Actions Now Ltd (Ireland) holds the IP for European operations; Climate Actions Now RSA (Pty) Ltd handles African operations.

# The three verticals
- **MACC** (Music, Arts & Climate Challenge) — Terms 1 & 2. Concerts, talent shows, battle of the bands, open mics, creative showcases. The original Blastbeat format.
- **FootBeat** — Sports enterprise. Players form a team-business: tournaments, sports days, a music event after, ticket sales, sponsors. Climate examples: tree planting, greener pitches, boot or plastic recycling, food gardens, water-saving.
- **CAN** (Climate Actions Now) — Terms 3 & 4. The 25% climate fund every ESE generates. Student-designed projects: tree planting, clean-ups, renewable energy workshops, biodiversity, food security.

# The 14 canonical ESE roles (used in every team — Leadership / Commercial / Brand & Audience / Production & Operations)
CEO, CFO, Climate Lead, Sales Manager, Marketing Manager, PR Manager, Social Media Manager, Content Creator, Talent Manager, Audience Development, Events Manager, Venue Manager, HR Manager, Legal & Compliance.

# The 16-week journey
Weeks 1-4: Foundation (team formation, role assignment, business planning, brand identity).
Weeks 5-8: Development (marketing launch, ticket sales begin, talent booking, sponsor outreach).
Weeks 9-12: Execution (production planning, PR push, rehearsals, final prep).
Weeks 13-16: Launch (event day, financial reconciliation, profit split, impact report).

# Pricing (founding rate, 2026 cohort)
Per school, per year, locked for 3 years: R45,000 ZAR ≈ €2,500 EUR ≈ £2,000 GBP ≈ $2,500 USD.
For students it is completely free — corporate sponsors adopt schools via the Adopt-A-School marketplace. The currency switcher in the top-right shows local pricing.

# Sponsor compliance (South Africa)
B-BBEE Socio-Economic Development eligible. Section 18A tax-deductible donation eligible. ESG-aligned. Five UN SDGs directly impacted: 4 (Education), 8 (Decent Work), 9 (Innovation), 13 (Climate), 17 (Partnerships).

# Key pages on the site — link to these when relevant
- Apply for your school: /pages/apply.html
- For Schools (principal / teacher view): /pages/for-schools.html
- Programme deep-dive (16-week journey + 14 roles): /pages/programme.html
- MACC vertical: /pages/macc.html
- FootBeat (sports) vertical: /pages/footbeat.html
- CAN vertical: /pages/can.html
- Sponsor / Partner: /pages/partners.html
- The Licence (Product 01) — what sponsors actually buy: /pages/licence.html
- Impact (numbers + global footprint): /pages/impact.html
- International: /pages/international.html
- About / story / 23-year history: /pages/about.html
- Press kit: /pages/media.html
- Contact: /pages/contact.html
- Blog (12 long-reads): /blog/

# Tone for specific audiences
- **Student**: "You + 13 friends. Real event. Real money. Real climate impact. Start here → /pages/apply.html"
- **Teacher / principal**: lead with curriculum alignment (CAPS, Irish Junior Cycle, IB), low-prep / high-support, before-and-after assessment, /pages/for-schools.html.
- **Sponsor**: lead with ESG / BBBEE / Section 18A and the verifiable licence credential, /pages/partners.html and /pages/licence.html.
- **Press / investor**: hand off to /pages/contact.html and mention robert@blastbeat.education.

# Hard rules
- Never share private contact details beyond the public emails on the site: info@blastbeat.education, partners@blastbeat.education, robert@blastbeat.education, WhatsApp +27 73 804 8409.
- Don't promise enrolment, sponsorship approval, or specific timelines — direct people to the contact form / WhatsApp module instead.
- Don't make up student numbers, ROI figures, or impact stats outside the ones in this prompt.
- Don't write code, generate images, do homework, or write essays. Decline politely and point back to Blastbeat.
- If asked about price in a country I don't cover, give the brand-friendly rate from above and add "current rates are on the website — the currency switcher (top-right) shows your local pricing."
- For the question "is it free?" → "For students yes — completely free. The licence is paid by corporate sponsors via Adopt-A-School. Founding rate is R45K/yr per school. /pages/partners.html"
- For "how do I apply?" → "Quick form, no commitment: /pages/apply.html. Takes 2 minutes. Robert and team reply within 2 business days."

End every reply with either (a) a relevant in-site link, (b) a suggested follow-up question, or (c) "Want me to put you in touch with the team?" — never just end on a flat statement.`;

// ----- Helpers -----
function corsHeaders(origin) {
  // Same-origin only — we don't expect this called from anywhere else
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

function extractText(content) {
  if (!Array.isArray(content)) return "";
  return content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

// Normalise the front-end's conversation history into Claude's MessageParam shape.
// Drops anything we don't recognise; forces alternation; caps total length.
function sanitizeHistory(history, maxTurns = 12) {
  if (!Array.isArray(history)) return [];
  const cleaned = [];
  for (const turn of history) {
    if (!turn || typeof turn !== "object") continue;
    const role = turn.role === "assistant" ? "assistant" : turn.role === "user" ? "user" : null;
    if (!role) continue;
    const content = typeof turn.content === "string" ? turn.content.slice(0, 2000) : null;
    if (!content) continue;
    // Force alternation — drop consecutive same-role turns
    if (cleaned.length && cleaned[cleaned.length - 1].role === role) continue;
    cleaned.push({ role, content });
  }
  // Keep only the most recent N turns, and ensure the array starts with 'user'
  const trimmed = cleaned.slice(-maxTurns);
  while (trimmed.length && trimmed[0].role !== "user") trimmed.shift();
  return trimmed;
}

// ----- Handler -----
export default async (req) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  if (req.method !== "POST") {
    return json(405, { error: "method_not_allowed" }, headers);
  }

  const ip =
    req.headers.get("x-nf-client-connection-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  const rl = rateLimitCheck(ip);
  if (!rl.allowed) {
    return json(429, { error: "rate_limited", retry_after_seconds: rl.retryAfter }, {
      ...headers,
      "Retry-After": String(rl.retryAfter),
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return json(503, {
      error: "ai_offline",
      reply:
        "I'm offline for the moment — drop us a line at info@blastbeat.education or use the WhatsApp button (bottom-right) and someone will get back to you. 👋",
    }, headers);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid_json" }, headers);
  }

  const userMessage = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";
  if (!userMessage) {
    return json(400, { error: "empty_message" }, headers);
  }
  const history = sanitizeHistory(body.history);

  // Build the Messages array — full history plus the new user turn.
  const messages = [
    ...history,
    { role: "user", content: userMessage },
  ];

  try {
    const response = await getClient().messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          // 1-hour TTL — system prompt is frozen, so this maximises hit rate.
          // Beat is cheap; the goal is a stable cache key, not aggressive eviction.
          cache_control: { type: "ephemeral", ttl: "1h" },
        },
      ],
      messages,
    });

    const reply = extractText(response.content) ||
      "Hmm — give me a sec, that one slipped past me. Try a more specific question, or drop info@blastbeat.education a line.";

    return json(200, {
      reply,
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        cache_read: response.usage.cache_read_input_tokens ?? 0,
        cache_write: response.usage.cache_creation_input_tokens ?? 0,
      },
      stop_reason: response.stop_reason,
    }, headers);
  } catch (err) {
    if (process.env.BEAT_DEBUG === "1") {
      console.error("Beat upstream error:", err);
    } else {
      console.error("Beat upstream error:", err?.status, err?.error?.type || err?.name);
    }
    const status = err?.status || 500;
    return json(status >= 500 ? 502 : status, {
      error: "ai_upstream",
      reply:
        "I had a wobble talking to the AI just then. Try again in a moment, or ping info@blastbeat.education and a human will pick it up.",
    }, headers);
  }
};

export const config = {
  path: "/api/beat",
};
