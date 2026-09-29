const SOURCES = {
  xml: { url: 'data/disciplines.xml', parse: parseXml },
  json: { url: 'data/disciplines.json', parse: parseJson }
};

function parseXml(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('Некоректний XML');
  return [...doc.querySelectorAll('discipline')].map((node) => ({
    name: node.querySelector('name').textContent.trim(),
    hours: Number(node.querySelector('hours').textContent),
    credits: Number(node.querySelector('credits').textContent),
    teacher: node.querySelector('teacher').textContent.trim()
  }));
}

function parseJson(text) {
  const data = JSON.parse(text);
  return data.disciplines.map((item) => ({
    name: item.name,
    hours: Number(item.hours),
    credits: Number(item.credits),
    teacher: item.teacher
  }));
}

const maxByHours = (items) => items.reduce((best, item) => (item.hours > best.hours ? item : best));

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderWinner(target, item) {
  target.replaceChildren();
  const card = el('article', 'winner');
  const hours = el('p', 'winner__hours');
  hours.append(el('span', 'winner__num', String(item.hours)), el('span', 'winner__unit', 'годин'));
  const list = el('dl', 'winner__meta');
  const rows = [['Назва', item.name], ['Викладач', item.teacher]];
  rows.forEach(([label, value]) => {
    const row = el('div', 'winner__row');
    row.append(el('dt', null, label), el('dd', null, value));
    list.append(row);
  });
  card.append(hours, list);
  target.append(card);
}

function renderError(target, message) {
  target.replaceChildren(el('p', 'error', message));
}

function renderTable(items) {
  const body = document.getElementById('table-body');
  const top = maxByHours(items);
  body.replaceChildren(
    ...items.map((item) => {
      const row = el('tr', item === top ? 'is-max' : '');
      [item.name, item.hours, item.credits, item.teacher].forEach((value) => row.append(el('td', null, String(value))));
      return row;
    })
  );
}

function bindFallback(kind, onText) {
  const loader = document.getElementById(`${kind}-loader`);
  const input = document.getElementById(`${kind}-file`);
  loader.hidden = false;
  input.addEventListener('change', async () => {
    const [file] = input.files;
    if (file) onText(await file.text());
  });
}

function show(kind, text) {
  const target = document.getElementById(`${kind}-result`);
  try {
    const items = SOURCES[kind].parse(text);
    renderWinner(target, maxByHours(items));
    if (kind === 'xml') renderTable(items);
  } catch (error) {
    renderError(target, error.message);
  }
}

async function init(kind) {
  const target = document.getElementById(`${kind}-result`);
  try {
    const response = await fetch(SOURCES[kind].url);
    if (!response.ok) throw new Error(String(response.status));
    show(kind, await response.text());
  } catch {
    renderError(target, 'Файл недоступний. Оберіть його вручну.');
    bindFallback(kind, (text) => show(kind, text));
  }
}

Object.keys(SOURCES).forEach(init);
