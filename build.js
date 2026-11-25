// Zero-dependency site builder. Run: node build.js  ->  output in /dist
const fs = require('fs'), path = require('path');
const R = __dirname, D = path.join(R, 'dist');
const S = JSON.parse(fs.readFileSync(path.join(R, 'site.json'), 'utf8'));
const BASE = S.url.replace(/\/$/, '');
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const FONTS = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap';
const ICON = "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Ctext y=%27.9em%27 font-size=%2790%27%3E%F0%9F%95%AF%EF%B8%8F%3C/text%3E%3C/svg%3E";

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmt = d => d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear();

// ---------- tiny markdown ----------
function inline(s) {
  s = s.replace(/(\w)'(\w)/g, '$1\u2019$2').replace(/"([^"\n]+)"/g, '\u201C$1\u201D');
  s = esc(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s;
}
function md(src) {
  return src.replace(/\r/g, '').replace(/^(#{1,4}\s+.*)$/gm, '\n$1\n').split(/\n{2,}/).map(b => {
    b = b.trim(); if (!b) return '';
    let m;
    if ((m = b.match(/^(#{1,4})\s+(.*)$/))) return `<h${Math.max(2, m[1].length)}>${inline(m[2])}</h${Math.max(2, m[1].length)}>`;
    if (/^-{3,}$|^\*{3,}$/.test(b)) return '<hr>';
    const lines = b.split('\n');
    if (lines.every(l => /^>\s?/.test(l))) return `<blockquote><p>${inline(lines.map(l => l.replace(/^>\s?/, '')).join(' '))}</p></blockquote>`;
    if (lines.every(l => /^[-*]\s+/.test(l))) return '<ul>' + lines.map(l => `<li>${inline(l.replace(/^[-*]\s+/, ''))}</li>`).join('') + '</ul>';
    if (lines.every(l => /^\d+\.\s+/.test(l))) return '<ol>' + lines.map(l => `<li>${inline(l.replace(/^\d+\.\s+/, ''))}</li>`).join('') + '</ol>';
    return `<p>${lines.map(inline).join('<br>')}</p>`;
  }).join('\n');
}
function parse(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/), meta = {};
  if (!m) return { meta, body: raw };
  m[1].split(/\r?\n/).forEach(l => { const i = l.indexOf(':'); if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, ''); });
  return { meta, body: m[2] };
}

// ---------- posts ----------
function loadPosts() {
  const dir = path.join(R, 'posts');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.md')).map(f => {
    const { meta, body } = parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    let date = new Date(meta.date); if (isNaN(date)) date = new Date();
    const plain = body.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#>*_`]/g, '').replace(/\s+/g, ' ').trim();
    return {
      slug: f.replace(/\.md$/, ''), title: meta.title || f.replace(/\.md$/, ''), date,
      desc: meta.description || (plain.length > 155 ? plain.slice(0, 152).trim() + '\u2026' : plain),
      html: md(body), draft: /^true$/i.test(meta.draft || '')
    };
  }).filter(p => !p.draft).sort((a, b) => b.date - a.date);
}

// ---------- templates ----------
function head({ title, desc, p, type, ld, noindex }) {
  const url = BASE + p, img = S.ogImage ? (S.ogImage.startsWith('http') ? S.ogImage : BASE + S.ogImage) : '';
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
<link rel="alternate" type="application/rss+xml" title="${esc(S.name)}" href="${BASE}/feed.xml">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${esc(S.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
${img ? `<meta property="og:image" content="${img}">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image" content="${img}">` : '<meta name="twitter:card" content="summary">'}
<link rel="icon" href="${ICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="${FONTS}" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;
}
const person = { '@type': 'Person', name: S.name, jobTitle: 'Author', url: BASE + '/' };
function shell(h, inner) {
  return `<!DOCTYPE html>
<html lang="en"><head>${h}</head><body>
<div class="wrap pg"><div class="bar"><a href="/">\u2190 ${esc(S.name)}</a><a href="/journal/">Journal</a></div>
${inner}
</div>
<footer><b>${esc(S.name)}</b>\u00A9 ${new Date().getFullYear()} \u00B7 <a href="mailto:${S.email}">${S.email}</a></footer>
<script src="/main.js" defer></script>
<noscript><style>.rv{opacity:1!important;transform:none!important}</style></noscript>
</body></html>`;
}
const item = p => `<a class="entry rv" href="/journal/${p.slug}/"><time>${fmt(p.date)}</time><div><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p></div></a>`;
const cta = `<div class="cta"><a class="btn" href="mailto:${S.email}?subject=Subscribe%20me%20to%20updates">Join the inner circle</a></div>`;

// ---------- build ----------
function write(rel, content) { const f = path.join(D, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); }
fs.rmSync(D, { recursive: true, force: true });
fs.mkdirSync(D, { recursive: true });
const P = loadPosts();

// static files
['style.css', 'main.js'].forEach(f => fs.copyFileSync(path.join(R, 'src', f), path.join(D, f)));
if (fs.existsSync(path.join(R, 'public'))) fs.cpSync(path.join(R, 'public'), D, { recursive: true });

// home
const homeLD = [{ '@context': 'https://schema.org', ...person, description: S.description },
  { '@context': 'https://schema.org', '@type': 'Book', name: S.bookTitle, author: person, description: S.description }];
let home = fs.readFileSync(path.join(R, 'src', 'index.html'), 'utf8');
home = home.replace('{{HEAD}}', () => head({ title: S.title, desc: S.description, p: '/', type: 'website', ld: homeLD }))
           .replace('{{LATEST}}', () => P.slice(0, 3).map(item).join('\n') || '<p>First post coming soon.</p>');
write('index.html', home);

// journal index
write('journal/index.html', shell(head({ title: 'Journal \u2013 ' + S.name, desc: 'Updates, teasers and stories from ' + S.name + ', author of ' + S.bookTitle + '.', p: '/journal/', type: 'website', ld: { '@context': 'https://schema.org', '@type': 'Blog', name: S.name + ' \u2013 Journal', url: BASE + '/journal/' } }),
  `<h1 class="post-h">Updates from the dark</h1><span class="meta">The journal</span>\n${P.map(item).join('\n') || '<p>First post coming soon.</p>'}`));

// posts
P.forEach(p => write(`journal/${p.slug}/index.html`, shell(head({ title: p.title + ' \u2013 ' + S.name, desc: p.desc, p: `/journal/${p.slug}/`, type: 'article',
  ld: { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.desc, datePublished: p.date.toISOString(), author: person, mainEntityOfPage: `${BASE}/journal/${p.slug}/` } }),
  `<article><span class="meta">${fmt(p.date)}</span><h1 class="post-h">${esc(p.title)}</h1><div class="prose">${p.html}</div></article>\n${cta}`)));

// 404, sitemap, robots, rss
write('404.html', shell(head({ title: 'Lost in the dark \u2013 ' + S.name, desc: 'Page not found.', p: '/404.html', type: 'website', ld: {}, noindex: true }),
  '<h1 class="post-h">Nothing here</h1><p>The page you were looking for has gone dark. <a href="/">Return to the beginning.</a></p>'));
const urls = [['/', ''], ['/journal/', ''], ...P.map(p => [`/journal/${p.slug}/`, p.date.toISOString().slice(0, 10)])];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, d]) => `<url><loc>${BASE}${u}</loc>${d ? `<lastmod>${d}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap.xml\n`);
write('feed.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${esc(S.name)}</title><link>${BASE}/</link><description>${esc(S.description)}</description>\n${P.map(p => `<item><title>${esc(p.title)}</title><link>${BASE}/journal/${p.slug}/</link><guid>${BASE}/journal/${p.slug}/</guid><pubDate>${p.date.toUTCString()}</pubDate><description>${esc(p.desc)}</description></item>`).join('\n')}\n</channel></rss>\n`);
console.log(`Built ${P.length} post(s) -> dist/`);
