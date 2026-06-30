/* ============================================================
   Netlify Function: submission-created
   ----------------------------------------------------------------
   Fires automatically on every Netlify Forms submission. Routes
   different forms to different reply templates, sends a rich
   audience-aware auto-reply to the submitter, and notifies the
   right people on the Blastbeat team.

   This function complements (does not replace) Netlify's built-in
   form notifications. Built-in notifications still cover the case
   where this function fails — both can run.

   Env vars (set in Netlify → Site settings → Environment variables):
     RESEND_API_KEY      optional. If set, sends real emails via Resend.
                         If unset, the function logs the would-be payload
                         and returns 200 so the submission still completes.
     RESEND_FROM         optional. Default: 'Blastbeat <noreply@blastbeat.education>'
     TEAM_NOTIFY_EMAILS  optional. CSV. Default: 'robert@blastbeat.education,tumelo@blastbeat.education'
     FUNCTION_DEBUG      optional ('1' to log every payload regardless of send result)

   Why Resend (not SES/SendGrid):
     - Single HTTP call, no SDK dependency to add to the bundle.
     - DNS setup is straightforward (one CNAME + the SPF/DKIM we
       already need anyway for Robert's outbound).
     - We can swap to SES later by changing only this file —
       the audience routing and template logic are provider-agnostic.

   ============================================================ */

// The live Blastbeat V2 app (Trixta-hosted). Single source of truth for the
// "Get started" link in the demo auto-reply — change here if the URL moves.
const DEMO_APP_URL = process.env.DEMO_APP_URL || 'https://trx-3675.devspace.trixta.io/';

export default async function handler(req) {
  let body;
  try { body = await req.json(); } catch { return new Response('bad json', { status: 400 }); }

  // Netlify wraps the form payload in { payload: { form_name, data: {...}, ... } }
  const payload = body.payload || body;
  const formName = payload.form_name || payload['form-name'] || '';
  const data = payload.data || payload || {};

  if (process.env.FUNCTION_DEBUG === '1') {
    console.log('submission-created', { formName, data });
  }

  const route = routesByForm[formName];
  if (!route) {
    console.log(`No route configured for form "${formName}" — built-in notifications still apply.`);
    return new Response('no route', { status: 200 });
  }

  const { autoReply, teamAlert } = route(data);
  const recipients = (process.env.TEAM_NOTIFY_EMAILS || 'robert@blastbeat.education,tumelo@blastbeat.education')
    .split(',').map(s => s.trim()).filter(Boolean);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('RESEND_API_KEY not set — auto-reply skipped. Built-in Netlify notifications still apply.');
    console.log('auto-reply preview:', autoReply);
    console.log('team-alert preview:', teamAlert);
    return new Response('logged (no key)', { status: 200 });
  }

  // 1. Auto-reply to the submitter
  const sendOne = async (to, subject, html) => {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'Blastbeat <noreply@blastbeat.education>',
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      console.log('Resend error', r.status, text);
    }
    return r.ok;
  };

  const tasks = [];
  if (data.email && autoReply) tasks.push(sendOne(data.email, autoReply.subject, autoReply.html));
  if (teamAlert) tasks.push(sendOne(recipients, teamAlert.subject, teamAlert.html));

  await Promise.all(tasks);
  return new Response('ok', { status: 200 });
}

// ============================================================
// Per-form routing. Each route returns { autoReply, teamAlert }.
// Templates are inline HTML — kept simple, scannable, no images.
// ============================================================

const safe = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const wrap = (body) => `<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e;line-height:1.55;">${body}<hr style="border:none;border-top:1px solid #ddd;margin:32px 0 16px;"><p style="font-size:12px;color:#666;">Climate Actions Now group &middot; <a href="https://www.blastbeat.education" style="color:#666;">blastbeat.education</a></p></div>`;

const routesByForm = {
  // ----------------------------------------------------------------
  // DEMO ACCESS REQUEST — pages/demo.html
  // Audience-aware confirmation; team alert calls out the audience
  // so Robert or Tumelo can pick the right one to follow up.
  // ----------------------------------------------------------------
  'demo-access-request': (d) => {
    const audience = d.audience || '';
    const nameFirst = String(d.name || '').trim().split(/\s+/)[0] || 'there';
    const flavour = {
      'Principal / Head Teacher': 'We&rsquo;ll send a code that opens the educator side so you can see what the cohort actually sees.',
      'HOD / Curriculum lead':    'We&rsquo;ll send a code that surfaces the role-and-curriculum map first &mdash; that&rsquo;s usually the most useful view for you.',
      'Teacher / Facilitator':    'We&rsquo;ll send a code that drops you into the cohort dashboard the way a facilitator uses it.',
      'Sports club / Federation': 'We&rsquo;ll send a code into the FootBeat lane so you can walk the tournament + business side.',
      'Sponsor / CSR / ESG team': 'We&rsquo;ll send a code that highlights the credential, the impact report and the 75/25 climate split.',
      'Foundation / Funder':      'We&rsquo;ll send a code that highlights the audit trail, the verifiable credential and the climate ring-fence.',
      'Government / Ministry':    'We&rsquo;ll send a code that highlights the framework alignment and the SDG mapping.',
      'Journalist / Researcher':  'We&rsquo;ll send a code and a short brief covering history, real numbers and a few case studies.',
      'Education consultant':     'We&rsquo;ll send a code and a short brief on the curriculum mapping you can show your clients.',
      'Parent':                   'We&rsquo;ll send a code and a short note explaining what your child would actually do, week by week.',
      'Student (18+)':            'We&rsquo;ll send a code straight into the student view.',
      'Other':                    'We&rsquo;ll send a code with a short note about what we think will be most useful for your context.',
    }[audience] || 'We&rsquo;ll send a code with a short note on what we&rsquo;d most like you to look at.';

    return {
      autoReply: {
        subject: 'You’re in — launch your Blastbeat V2 demo',
        html: wrap(`
          <p>Hi ${safe(nameFirst)},</p>
          <p>Thanks for asking for a look at Blastbeat V2. ${flavour}</p>
          <p>You can step straight into the live app now:</p>
          <p style="text-align:center;margin:28px 0;">
            <a href="${DEMO_APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#6366F1,#A855F7,#FF2D78);color:#ffffff;text-decoration:none;font-weight:800;font-size:16px;padding:14px 32px;border-radius:999px;font-family:Helvetica,Arial,sans-serif;">&#128640; Get started &mdash; launch the app</a>
          </p>
          <p style="font-size:13px;color:#666;text-align:center;">Or paste this into your browser: <a href="${DEMO_APP_URL}">${DEMO_APP_URL}</a></p>
          <p><strong>What happens next:</strong> Robert or Tumelo will also reply personally within one business day with a short note on what we&rsquo;d most like you to look at. No drip sequences, no sales calls unless you ask for one.</p>
          <p>If anything is urgent, WhatsApp Tumelo on <a href="https://wa.me/27738048409">+27 73 804 8409</a>.</p>
          <p>Warmly,<br>The Blastbeat team</p>
        `),
      },
      teamAlert: {
        subject: `Demo request — ${safe(audience || 'Unknown audience')} — ${safe(d.name || 'no name')}`,
        html: wrap(`
          <h2 style="font-size:18px;margin:0 0 16px;">New demo access request</h2>
          <table style="border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:4px 12px 4px 0;color:#666;">Name</td><td><strong>${safe(d.name)}</strong></td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666;">Email</td><td><a href="mailto:${safe(d.email)}">${safe(d.email)}</a></td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666;">Audience</td><td><strong>${safe(d.audience)}</strong></td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666;">Organisation</td><td>${safe(d.organisation)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666;">Region</td><td>${safe(d.region)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666;">Phone</td><td>${safe(d.phone)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666;">Source</td><td>${safe(d.source)}</td></tr>
          </table>
          <p style="margin-top:16px;"><strong>What they want to see:</strong></p>
          <p style="background:#f5f5f7;padding:12px 16px;border-radius:8px;">${safe(d.focus) || '(not specified)'}</p>
          <p style="margin-top:24px;font-size:13px;color:#666;">Reply within one business day. Net submission is also visible in the Netlify dashboard for the record.</p>
        `),
      },
    };
  },

  // ----------------------------------------------------------------
  // SCHOOL APPLICATION — pages/apply.html
  // ----------------------------------------------------------------
  'school-application': (d) => ({
    autoReply: {
      subject: 'Your Blastbeat school application — received',
      html: wrap(`
        <p>Hi ${safe(String(d['contact-name'] || d.name || '').split(/\s+/)[0] || 'there')},</p>
        <p>Thanks for applying for ${safe(d['school-name'] || 'your school')}. We've got it. Robert or Tumelo will be in touch within one business day with next steps.</p>
        <p>If you'd like to walk the V2 demo while we look at your application, request a code at <a href="https://www.blastbeat.education/demo">blastbeat.education/demo</a>.</p>
        <p>Warmly,<br>The Blastbeat team</p>
      `),
    },
    teamAlert: {
      subject: `School application — ${safe(d['school-name'] || d.name || 'unknown')}`,
      html: wrap(`<h2 style="font-size:18px;margin:0 0 16px;">School application</h2><pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;background:#f5f5f7;padding:12px;border-radius:8px;">${safe(JSON.stringify(d, null, 2))}</pre>`),
    },
  }),

  // ----------------------------------------------------------------
  // SPONSORSHIP / PARTNER ENQUIRY — pages/partners.html
  // ----------------------------------------------------------------
  'sponsorship-enquiry': (d) => ({
    autoReply: {
      subject: 'Your Blastbeat sponsorship enquiry — received',
      html: wrap(`
        <p>Hi ${safe(String(d.name || '').split(/\s+/)[0] || 'there')},</p>
        <p>Thanks for the sponsorship enquiry. Robert will reply personally within one business day with the next step.</p>
        <p>While you wait: every Blastbeat licence is a W3C Verifiable Credential. You can see what one looks like at <a href="https://www.blastbeat.education/verify">blastbeat.education/verify</a>.</p>
        <p>Warmly,<br>The Blastbeat team</p>
      `),
    },
    teamAlert: {
      subject: `Sponsorship enquiry — ${safe(d['company-name'] || d.name || 'unknown')}`,
      html: wrap(`<h2 style="font-size:18px;margin:0 0 16px;">Sponsorship enquiry</h2><pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;background:#f5f5f7;padding:12px;border-radius:8px;">${safe(JSON.stringify(d, null, 2))}</pre>`),
    },
  }),

  // ----------------------------------------------------------------
  // PARTNER PROGRAM APPLICATION — pages/partner-program.html
  // ----------------------------------------------------------------
  'partner-application': (d) => ({
    autoReply: {
      subject: 'Your Blastbeat partner application — received',
      html: wrap(`
        <p>Hi ${safe(String(d.name || '').split(/\s+/)[0] || 'there')},</p>
        <p>Thanks for applying to the Blastbeat partner cohort. Tumelo reviews every application personally and will be in touch within 2 business days.</p>
        <p>Warmly,<br>The Blastbeat team</p>
      `),
    },
    teamAlert: {
      subject: `Partner application — ${safe(d.name || 'unknown')} (${safe(d.category || d.region || '')})`,
      html: wrap(`<h2 style="font-size:18px;margin:0 0 16px;">Partner application</h2><pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;background:#f5f5f7;padding:12px;border-radius:8px;">${safe(JSON.stringify(d, null, 2))}</pre>`),
    },
  }),

  // ----------------------------------------------------------------
  // GENERAL CONTACT — pages/contact.html
  // ----------------------------------------------------------------
  'contact': (d) => ({
    autoReply: {
      subject: 'Thanks for getting in touch with Blastbeat',
      html: wrap(`
        <p>Hi ${safe(String(d.name || '').split(/\s+/)[0] || 'there')},</p>
        <p>We've got your message. Reply within one business day, often sooner.</p>
        <p>Warmly,<br>The Blastbeat team</p>
      `),
    },
    teamAlert: {
      subject: `Contact form — ${safe(d.topic || 'enquiry')} from ${safe(d.name || 'unknown')}`,
      html: wrap(`<h2 style="font-size:18px;margin:0 0 16px;">Contact</h2><pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;background:#f5f5f7;padding:12px;border-radius:8px;">${safe(JSON.stringify(d, null, 2))}</pre>`),
    },
  }),
};
