#!/usr/bin/env python3
"""Static-analysis audit suite for the Blastbeat site.

Run from repo root: `python3 tests/audit.py`
Exits non-zero on any failure so it can gate CI.

Tests
  T1  HTML balance (all pages well-formed)
  T2  SEO presence + length budgets (title <=70, desc <=160, canonical, OG, H1)
  T3  Internal links resolve to on-disk files
  T4  Every <img src>, CSS url(), and preload href resolves
  T5  No <iframe src="">
  T6  Every visible <img> has meaningful alt OR aria-hidden
  T7  Every JS file parses
  T8  analytics.js installed on every public page
  T9  Every Netlify form has data-netlify-honeypot
  T10 BreadcrumbList schema on every non-home page
  T11 VideoObject schema on every page with a YouTube embed
  T12 Img dims (width+height) on about.html + licence.html
  T13 hreflang alternates on every public page
  T14 <picture> wrapper used for non-decorative <img src="*.webp">
  T15 No known-dead YouTube embed patterns (UU_<channel> sentinel + empty src=)
  T16 Mobile viewport meta on every HTML page (width=device-width, no scale lock)
  T17 No fixed inline pixel widths >= 380 that would force horizontal scroll
"""
import re, glob, html, os, subprocess, sys

ROOT = os.path.abspath(os.path.dirname(__file__) + '/..')
os.chdir(ROOT)

def _is_noindex(path):
    try:
        s = open(path, encoding='utf-8').read(4000)
    except Exception:
        return False
    return bool(re.search(r'<meta\s+name=["\']robots["\']\s+content=["\'][^"\']*noindex', s, re.I))

PAGES = sorted(glob.glob('pages/*.html') + ['index.html', 'pitch.html'])
# Indexable subset — SEO/breadcrumb/hreflang tests apply to these only.
INDEXABLE = [p for p in PAGES if not _is_noindex(p)]
INDEXABLE_BLOG_FILTER = lambda: [p for p in sorted(glob.glob('blog/*.html')) if not _is_noindex(p)]
BLOG  = sorted(glob.glob('blog/*.html'))
ALL_HTML = sorted(glob.glob('**/*.html', recursive=True))

from html.parser import HTMLParser
class Bal(HTMLParser):
    VOID = {'br','hr','img','input','meta','link','source','track','area','base','col','embed','param','wbr'}
    def __init__(self):
        super().__init__(); self.stack=[]; self.errs=[]
    def handle_starttag(self,t,a):
        if t in self.VOID: return
        self.stack.append((t,self.getpos()))
    def handle_endtag(self,t):
        if not self.stack: self.errs.append(('stray',t)); return
        if self.stack[-1][0]==t: self.stack.pop()
        else: self.errs.append(('mismatch',t,self.stack[-1][0]))

def run():
    res = {}

    # T1
    p=t=0; fails=[]
    for f in PAGES + BLOG:
        t+=1; b=Bal()
        try: b.feed(open(f, encoding='utf-8').read())
        except Exception as e: fails.append((f,str(e))); continue
        if b.errs or b.stack: fails.append((f,b.errs[:1],b.stack[:1]))
        else: p+=1
    res['T1 HTML balance']=(p,t,fails)

    # T2 SEO — indexable pages only
    p=t=0; fails=[]
    for f in INDEXABLE:
        t+=1; s=open(f,encoding='utf-8').read(); iss=[]
        title=re.search(r'<title>(.*?)</title>',s,re.S)
        desc=re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']',s,re.S)
        if not title or len(html.unescape(title.group(1).strip()))>70: iss.append('title')
        if not desc or len(html.unescape(desc.group(1).strip()))>160: iss.append('desc')
        for n,r in [('canon',r'<link\s+rel=["\']canonical["\']'),('og_t',r'<meta\s+property=["\']og:title["\']'),('og_d',r'<meta\s+property=["\']og:description["\']'),('h1',r'<h1[^>]*>')]:
            if not re.search(r,s): iss.append(n)
        if iss: fails.append((f,iss))
        else: p+=1
    res['T2 SEO presence + lengths']=(p,t,fails)

    # T3 Internal links — honour clean URLs served by Netlify redirects
    REDIRECT_ROOTS = set()
    try:
        toml = open('netlify.toml', encoding='utf-8').read()
        for m in re.finditer(r'from\s*=\s*"(/[^"]+?)"', toml):
            REDIRECT_ROOTS.add(m.group(1).rstrip('*').rstrip('/'))
    except Exception:
        pass
    p=t=0; fails=[]; ap=set(ALL_HTML)
    for f in PAGES:
        s=open(f,encoding='utf-8').read()
        links=set(re.findall(r'href=["\'](/[^"\'#?]*\.html)(?:#[^"\']*)?["\']',s))|set(re.findall(r'href=["\'](/[^"\'#?]+/?)(?:#[^"\']*)?["\']',s))
        for href in links:
            t+=1; tgt=href.lstrip('/')
            if tgt.endswith('/'): tgt+='index.html'
            if not tgt: tgt='index.html'
            if tgt in ap or os.path.exists(tgt) or href.rstrip('/') in REDIRECT_ROOTS: p+=1
            else: fails.append((f,href))
    res['T3 Internal links']=(p,t,fails)

    # T4 Image refs
    p=t=0; fails=[]
    for f in PAGES + BLOG:
        s=open(f,encoding='utf-8').read()
        srcs=set(re.findall(r'<img[^>]+src=["\']/([^"\']+)["\']',s))
        srcs|=set(re.findall(r'<source[^>]+srcset=["\']/([^"\']+)["\']',s))
        srcs|=set(re.findall(r"url\(['\"]/([^'\"]+\.(?:jpe?g|png|webp|svg|gif|avif))['\"]\)", s))
        srcs|=set(re.findall(r'href=["\']/([^"\']+\.(?:webp|avif|jpg|png|svg))["\']', s))
        for src in srcs:
            t+=1
            if os.path.exists(src): p+=1
            else: fails.append((f,src))
    res['T4 Image refs resolve']=(p,t,fails)

    # T5
    p=t=0; fails=[]
    for f in PAGES + BLOG:
        s=open(f,encoding='utf-8').read(); t+=1
        if re.findall(r'<iframe[^>]+src=["\']["\']',s): fails.append(f)
        else: p+=1
    res['T5 No empty iframe']=(p,t,fails)

    # T6 alt
    p=t=0; fails=[]
    img_re=re.compile(r'<img\b([^>]*)>',re.S)
    for f in PAGES:
        s=open(f,encoding='utf-8').read()
        for m in img_re.finditer(s):
            a=m.group(1)
            if re.search(r'aria-hidden\s*=\s*["\']true["\']',a): continue
            if re.search(r'role\s*=\s*["\']presentation["\']',a): continue
            alt=re.search(r'\balt\s*=\s*["\']([^"\']*)["\']',a)
            t+=1
            if alt is None or alt.group(1).strip()=='': fails.append((f,'alt'))
            else: p+=1
    res['T6 IMG alt']=(p,t,fails)

    # T7 JS
    js=sorted(glob.glob('assets/js/*.js'))
    p=t=0; fails=[]
    for j in js:
        t+=1; r=subprocess.run(['node','--check',j],capture_output=True,text=True)
        if r.returncode==0: p+=1
        else: fails.append((j,r.stderr.splitlines()[0]))
    res['T7 JS syntax']=(p,t,fails)

    # T8 analytics installed
    p=t=0; fails=[]
    for f in PAGES + BLOG + ['thank-you.html','404.html']:
        t+=1
        if '/assets/js/analytics.js' in open(f,encoding='utf-8').read(): p+=1
        else: fails.append(f)
    res['T8 analytics.js installed']=(p,t,fails)

    # T9 honeypot
    p=t=0; fails=[]
    for f in glob.glob('pages/*.html')+['index.html']:
        s=open(f,encoding='utf-8').read()
        for form in re.findall(r'<form[^>]+data-netlify="true"[^>]*>',s):
            t+=1
            if 'data-netlify-honeypot' in form: p+=1
            else: fails.append((f,form[:60]))
    res['T9 form honeypots']=(p,t,fails)

    # T10 BreadcrumbList on every non-home indexable page (excludes noindex blog posts)
    p=t=0; fails=[]
    for f in INDEXABLE + INDEXABLE_BLOG_FILTER():
        if f=='index.html': continue
        t+=1
        if 'BreadcrumbList' in open(f,encoding='utf-8').read(): p+=1
        else: fails.append(f)
    res['T10 BreadcrumbList']=(p,t,fails)

    # T11 VideoObject on every page with a YouTube embed
    yt=re.compile(r'(?:youtu\.be/|youtube(?:-nocookie)?\.com/(?:embed/|watch\?v=)|youtu\.be%2F)([A-Za-z0-9_-]{11})')
    p=t=0; fails=[]
    for f in PAGES + BLOG:
        s=open(f,encoding='utf-8').read()
        ids={i for i in yt.findall(s) if i and not i.startswith('videoseries')}
        if not ids: continue
        t+=1
        if '"VideoObject"' in s: p+=1
        else: fails.append(f)
    res['T11 VideoObject schema']=(p,t,fails)

    # T12 Img dims on about + licence
    p=t=0; fails=[]
    for f in ['pages/about.html','pages/licence.html']:
        s=open(f,encoding='utf-8').read()
        for m in re.finditer(r'<img\b([^>]+)>',s):
            a=m.group(1)
            if not re.search(r'src=["\']/[^"\']+["\']', a): continue
            t+=1
            if re.search(r'\bwidth\s*=', a) and re.search(r'\bheight\s*=', a): p+=1
            else: fails.append((f,a[:60]))
    res['T12 Img dims (CLS pages)']=(p,t,fails)

    # T13 hreflang — indexable pages only (excludes noindex blog posts)
    p=t=0; fails=[]
    for f in INDEXABLE + INDEXABLE_BLOG_FILTER():
        t+=1
        s=open(f,encoding='utf-8').read()
        if 'hreflang="en-gb"' in s and 'hreflang="en-za"' in s and 'hreflang="x-default"' in s: p+=1
        else: fails.append(f)
    res['T13 hreflang alternates']=(p,t,fails)

    # T14 <picture> wrapper around <img src="*.webp">
    p=t=0; fails=[]
    for f in PAGES + BLOG:
        s=open(f,encoding='utf-8').read()
        # Tokenise picture regions: any <img *.webp> whose start index falls
        # between an opening <picture> and the matching </picture> is wrapped.
        picture_spans = []
        cursor = 0
        while True:
            open_idx = s.find('<picture>', cursor)
            if open_idx < 0: break
            close_idx = s.find('</picture>', open_idx)
            if close_idx < 0: break
            picture_spans.append((open_idx, close_idx))
            cursor = close_idx + len('</picture>')
        def in_picture(pos):
            return any(o <= pos < c for o,c in picture_spans)
        for m in re.finditer(r'<img\b[^>]*src=["\'][^"\']*\.webp["\'][^>]*>', s):
            t+=1
            if in_picture(m.start()): p+=1
            else: fails.append((f, m.group(0)[:80]))
    res['T14 <picture> for .webp']=(p,t,fails)

    # T15 No known-dead YouTube embed patterns. Deterministic guard against the
    # shapes we've already had break in production (Robert's screenshot batch):
    #   - videoseries?list=UU_<channel> — only valid if the UU id is real;
    #     "UU_blastbeatuk" was not, hence "video unavailable".
    #   - iframe with empty src=""
    #   - iframe pointing at deleted/missing IDs added to the deny-list below.
    DEAD_PATTERNS = [
        (re.compile(r'youtube[^"\']*embed/videoseries\?list=UU_'), 'invalid UU_ playlist id'),
        (re.compile(r'<iframe[^>]+src=["\']\s*["\']'), 'iframe with empty src'),
    ]
    p=t=0; fails=[]
    for f in PAGES + BLOG:
        s=open(f,encoding='utf-8').read(); t+=1
        page_bad = []
        for pat, why in DEAD_PATTERNS:
            for m in pat.finditer(s):
                page_bad.append(why + ' at ' + str(s.count('\n',0,m.start())+1))
        if page_bad: fails.append((f, page_bad))
        else: p+=1
    res['T15 No dead embed patterns']=(p,t,fails)

    # T16 Mobile baseline — every public HTML page ships <meta name="viewport"
    # content="width=device-width"> + must NOT disable pinch zoom (accessibility:
    # never user-scalable=no). Without device-width, phones render the site
    # as a zoomed-out desktop layout. With user-scalable=no, low-vision users
    # cannot zoom in. Both are silent UX failures.
    p=t=0; fails=[]
    vp_re = re.compile(r'<meta\s+name=["\']viewport["\']\s+content=["\']([^"\']+)["\']', re.I)
    SITE_HTML = [p for p in ALL_HTML
                 if not p.startswith('node_modules/')
                 and not p.startswith('test-results/')
                 and not p.startswith('playwright-report/')]
    for f in SITE_HTML:
        t+=1
        s=open(f,encoding='utf-8').read(2000)
        m = vp_re.search(s)
        if not m: fails.append((f,'missing')); continue
        v = m.group(1).lower()
        if 'width=device-width' not in v: fails.append((f,'no device-width')); continue
        if 'user-scalable=no' in v or 'user-scalable=0' in v:
            fails.append((f,'user-scalable=no blocks pinch-zoom')); continue
        p+=1
    res['T16 Mobile viewport meta']=(p,t,fails)

    # T17 No fixed-pixel widths on visible content >= 380px that would overflow
    # a 360px viewport. We allow:
    #   - `max-width: <N>px` (lets element shrink)
    #   - aria-hidden decorative elements (orb glows, blur layers)
    #   - SVG / canvas / video native sizing
    # Use a small parser pass so the regex doesn't generate false positives.
    p=t=0; fails=[]
    tag_w_re = re.compile(r'<(\w+)\b([^>]*style=["\'][^"\']*(?<!max-)(?<!min-)width\s*:\s*(\d{3,4})px[^"\']*["\'][^>]*)>', re.I)
    for f in PAGES + BLOG:
        s=open(f,encoding='utf-8').read(); t+=1
        page_bad = []
        for m in tag_w_re.finditer(s):
            tag = m.group(1).lower()
            attrs = m.group(2)
            try:
                px = int(m.group(3))
            except ValueError:
                continue
            if px < 380: continue
            if tag in ('svg', 'canvas', 'video', 'iframe'): continue
            # Decorative: aria-hidden or .orb/.glow/.veil/.bg classes — never
            # cause body overflow because they sit inside `overflow: hidden`
            # parents or use negative offsets.
            if 'aria-hidden' in attrs and 'true' in attrs: continue
            if re.search(r'class=["\'][^"\']*\b(orb|glow|veil|bg-blur|bg-orb|hero-bg)\b', attrs, re.I): continue
            line = s.count('\n',0,m.start())+1
            page_bad.append(f'<{tag}> width: {px}px at line {line}')
        if page_bad: fails.append((f, page_bad[:2]))
        else: p+=1
    res['T17 No overflowing inline widths']=(p,t,fails)

    return res

def report(res):
    print('='*64); print('  BLASTBEAT — PRODUCTION READINESS TEST SUITE'); print('='*64)
    total_p=total_t=0; any_fail=False
    for n,(pp,tt,ff) in res.items():
        sym='PASS' if pp==tt else 'FAIL'
        if pp!=tt: any_fail=True
        pct=100.0*pp/tt if tt else 100.0
        print(f"  [{sym}] {n:<32} {pp}/{tt} ({pct:5.1f}%)")
        if ff:
            for x in ff[:3]: print(f"          {x}")
        total_p+=pp; total_t+=tt
    print('-'*64); print(f"  OVERALL  {total_p}/{total_t}  ({100.0*total_p/total_t:.2f}%)")
    print('='*64)
    return 0 if not any_fail else 1

if __name__ == '__main__':
    sys.exit(report(run()))
