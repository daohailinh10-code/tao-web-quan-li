import { BOOK_CATALOG } from '../server/book_catalog.js';

const normalize = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const tokens = value => new Set(normalize(value).split(' ').filter(Boolean));
const start = Number(process.argv[2] || 0);
const count = Number(process.argv[3] || 100);
const candidates = BOOK_CATALOG.filter(book => !book.image).slice(start, start + count);

for (let i = 0; i < candidates.length; i++) {
  const book = candidates[i];
  const params = new URLSearchParams({ title: book.name, author: book.author, fields: 'title,author_name,cover_i,key', limit: '8' });
  try {
    const response = await fetch(`https://openlibrary.org/search.json?${params}`, { headers: { 'User-Agent': 'PinkBookManager/1.0 (book cover research)' }, signal: AbortSignal.timeout(20000) });
    if (!response.ok) { process.stderr.write(`${book.sku}: HTTP ${response.status}\n`); continue; }
    const result = await response.json();
    const wantedTitle = normalize(book.name);
    const wantedAuthor = tokens(book.author);
    const match = (result.docs || []).find(doc => {
      if (!doc.cover_i || normalize(doc.title) !== wantedTitle) return false;
      const authors = tokens((doc.author_name || []).join(' '));
      const overlap = [...wantedAuthor].filter(word => authors.has(word)).length;
      return overlap >= Math.max(1, Math.ceil(wantedAuthor.size * 0.5));
    });
    if (match) process.stdout.write(`${JSON.stringify({ sku: book.sku, image: `https://covers.openlibrary.org/b/id/${match.cover_i}-L.jpg`, source: `https://openlibrary.org${match.key}`, title: match.title, authors: match.author_name })}\n`);
  } catch (error) { process.stderr.write(`${book.sku}: ${error.message}\n`); }
  if ((i + 1) % 20 === 0) process.stderr.write(`Checked ${start + i + 1} books\n`);
  await new Promise(resolve => setTimeout(resolve, 250));
}
