const ids = id => document.getElementById(id);
const form = ids('filters');
const facets = ['a', 'b', 'c'];
const pageSize = 18;
let catalog;
let page = 1;
let visible = [];
let lookup = new Map();
const query = ids('query');
const dialog = ids('detail');

function node(tag, value, className) {
  const el = document.createElement(tag);
  if (value !== undefined) el.textContent = value;
  if (className) el.className = className;
  return el;
}
function link(label, destination) {
  if (!destination) return null;
  try {
    const url = new URL(destination);
    if (url.protocol !== 'https:') return null;
    const a = node('a', label);
    Object.assign(a, {href: url.href, target: '_blank', rel: 'noopener noreferrer'});
    return a;
  } catch { return null; }
}
function normalize(value) {
  return String(value ?? '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
function labelDate(value) {
  if (!value) return 'Date unavailable';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat('en-CA', {dateStyle: 'medium', timeZone: 'UTC'}).format(new Date(value + 'T00:00:00Z'));
}
function details(record) {
  ids('detail-kicker').textContent = record.kicker;
  ids('detail-title').textContent = record.title;
  ids('detail-summary').textContent = record.summary || '';
  const image = ids('detail-image');
  image.hidden = true;
  image.removeAttribute('src');
  if (record.preview) {
    const verified = link('Preview', record.preview);
    if (verified) { image.src = verified.href; image.hidden = false; }
  }
  ids('detail-fields').replaceChildren(...Object.entries(record.fields || {}).flatMap(([name, value]) => value === '' || value == null ? [] : [node('dt', name), node('dd', value)]));
  ids('detail-links').replaceChildren(...record.links.map(item => link(item.label, item.url)).filter(Boolean));
  const matches = record.compare ? catalog.records.filter(other => other.compare === record.compare).sort((a, b) => a.date.localeCompare(b.date)) : [];
  ids('history').hidden = matches.length < 2;
  ids('history-list').replaceChildren(...matches.map(other => {
    const row = node('li', `${labelDate(other.date)} · ${other.highlight} · `);
    const citation = link(other.fields['Order'], other.links[0].url);
    if (citation) row.append(citation);
    return row;
  }));
  dialog.showModal();
}
function card(record) {
  const result = node('article', undefined, 'record');
  result.append(node('p', record.kicker, 'kicker'), node('h3', record.title));
  if (record.summary) result.append(node('p', record.summary, 'para'));
  const facts = node('div', undefined, 'facts');
  if (record.highlight) facts.append(node('strong', record.highlight, 'highlight'));
  facts.append(node('time', labelDate(record.date)));
  result.append(facts);
  const actions = node('div', undefined, 'actions');
  const detail = node('button', 'Details');
  detail.type = 'button';
  detail.setAttribute('aria-label', `Details for ${record.title}`);
  detail.addEventListener('click', () => details(record));
  actions.append(detail);
  const source = link('Source ↗', record.links[0]?.url);
  if (source) actions.append(source);
  result.append(actions);
  return result;
}
function refresh(resetPage = true) {
  if (!catalog) return;
  if (resetPage) page = 1;
  const words = normalize(query.value).split(' ').filter(Boolean);
  const selections = facets.map(key => ids(`facet-${key}`).value);
  const sort = ids('sort').value;
  visible = catalog.records.filter(record => words.every(word => lookup.get(record).includes(word)) &&
    selections.every((value, index) => !value || value === record[facets[index]]));
  visible.sort((a,b) => sort === 'title' ? a.title.localeCompare(b.title) :
    sort === 'old' ? (a.date || '9999').localeCompare(b.date || '9999') : (b.date || '').localeCompare(a.date || ''));
  const pages = Math.max(1, Math.ceil(visible.length / pageSize));
  page = Math.min(page, pages);
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, visible.length);
  ids('records').replaceChildren(...visible.slice(start, end).map(card));
  ids('status').textContent = visible.length ? `${visible.length.toLocaleString()} matches · showing ${start + 1}–${end}` : 'No matches. Try another search or reset the filters.';
  ids('export').disabled = visible.length === 0;
  ids('pagination').hidden = pages < 2;
  ids('page-label').textContent = `Page ${page} of ${pages}`;
  ids('previous').disabled = page === 1;
  ids('next').disabled = page >= pages;
}
function exportCsv() {
  const rows = [['Title', 'Primary filter', 'Secondary filter', 'Additional filter', 'Date', 'Value', 'Summary', 'Source URL'],
    ...visible.map(r => [r.title, r.a, r.b, r.c, r.date, r.highlight, r.summary, r.links[0]?.url])];
  const escape = value => {
    const text = String(value ?? '');
    const safe = /^[\s]*[=+\-@]/.test(text) ? "'" + text : text;
    return '"' + safe.replace(/"/g, '""') + '"';
  };
  const raw = rows.map(row => row.map(escape).join(',')).join('\r\n') + '\r\n';
  const url = URL.createObjectURL(new Blob([raw], {type: 'text/csv;charset=utf-8'}));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${catalog.slug}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
function setup(data) {
  if (!Array.isArray(data.records) || data.records.length === 0) throw new Error('Missing index records');
  catalog = data;
  lookup = new Map(data.records.map(r => [r, normalize([
    r.title, r.summary, r.kicker, r.a, r.b, r.c, r.highlight, r.date, r.keywords, ...Object.values(r.fields || {})
  ].join(' '))]));
  ids('coverage').textContent = data.coverage;
  ids('updated').textContent = `Snapshot ${labelDate(data.updated)}`;
  ids('method').textContent = data.method;
  ids('sources').replaceChildren(...data.sources.map(source => {
    const li = node('li');
    const a = link(source.label + ' ↗', source.url);
    if (a) li.append(a);
    return li;
  }));
  facets.forEach((key, index) => {
    const field = ids(`facet-${key}`);
    const label = data.facets[index];
    field.parentNode.hidden = !label;
    if (!label) return;
    field.setAttribute('aria-label', label);
    field.parentNode.querySelector('span').textContent = label;
    field.append(new Option('All', ''), ...[...new Set(data.records.map(r => r[key]).filter(Boolean))].sort().map(v => new Option(v, v)));
  });
  const chips = data.examples || [];
  ids('quick').hidden = !chips.length;
  chips.forEach(example => {
    const button = node('button', example);
    button.type = 'button';
    button.addEventListener('click', () => { form.reset(); query.value = example; refresh(); });
    ids('quick').append(button);
  });
  form.hidden = false;
  refresh();
}
form.addEventListener('input', () => refresh());
form.addEventListener('submit', event => { event.preventDefault(); refresh(); });
ids('reset').addEventListener('click', () => { form.reset(); refresh(); query.focus(); });
ids('export').addEventListener('click', exportCsv);
ids('previous').addEventListener('click', () => { page--; refresh(false); ids('search-heading').scrollIntoView(); });
ids('next').addEventListener('click', () => { page++; refresh(false); ids('search-heading').scrollIntoView(); });
ids('detail-image').addEventListener('error', () => { ids('detail-image').hidden = true; });
fetch(new URL('catalog.json', import.meta.url)).then(r => {
  if (!r.ok) throw new Error('Index unavailable');
  return r.json();
}).then(setup).catch(() => {
  ids('coverage').textContent = 'Index unavailable';
  ids('status').textContent = 'The source snapshot could not be loaded. Reload the page or open the official source above.';
});
