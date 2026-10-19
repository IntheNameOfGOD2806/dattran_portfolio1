import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';
import * as csstree from 'css-tree';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const { document, window } = parseHTML(fs.readFileSync(path.join(dist, 'index.html'), 'utf8'));
const ids = new Set();
for (const element of document.querySelectorAll('[id]')) {
  assert(!ids.has(element.id), `Duplicate ID: ${element.id}`);
  ids.add(element.id);
}
assert.equal(document.documentElement.lang, 'vi');
assert.equal(document.querySelectorAll('h1').length, 1);
for (const element of document.querySelectorAll('[href], [src], [aria-controls], [aria-labelledby]')) {
  for (const attribute of ['href', 'src']) {
    const value = element.getAttribute(attribute);
    if (!value || /^(https?:|mailto:|tel:|data:)/.test(value)) continue;
    if (value.startsWith('#')) assert(ids.has(value.slice(1)), `Broken anchor: ${value}`);
    else assert(fs.existsSync(path.resolve(dist, value)), `Missing asset: ${value}`);
  }
  for (const attribute of ['aria-controls', 'aria-labelledby']) {
    element.getAttribute(attribute)?.split(' ').forEach(id => assert(ids.has(id), `Missing ARIA target: ${id}`));
  }
}
for (const file of ['styles.css', 'identity.css', 'dark.css', 'assets/fonts.css']) {
  const full = path.join(dist, file);
  const css = fs.readFileSync(full, 'utf8');
  csstree.parse(css, { onParseError(error) { throw error; } });
  for (const match of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) {
    assert(fs.existsSync(path.resolve(path.dirname(full), match[1])), `Missing CSS asset: ${match[1]}`);
  }
}
for (const file of ['app.js', 'scene.js', 'vendor/RoundedBoxGeometry.js']) {
  const check = spawnSync(process.execPath, ['--check', path.join(dist, file)], { encoding: 'utf8' });
  assert.equal(check.status, 0, check.stderr);
}
const { RoundedBoxGeometry } = await import('../dist/vendor/RoundedBoxGeometry.js');
const geometry = new RoundedBoxGeometry(2.6, .47, 2.06, 2, .065);
geometry.computeBoundingBox();
for (const value of geometry.attributes.position.array) assert(Number.isFinite(value));
assert(Math.abs(geometry.boundingBox.max.x - 1.3) < .001);
geometry.dispose();

// Exercise the shipped UI logic without a browser or a remote service.
let copied = '';
const stored = new Map();
const timers = new Map();
let timerId = 0;
window.matchMedia = () => ({ matches: false, addEventListener() {} });
window.innerHeight = 900;
window.scrollY = 0;
document.querySelectorAll('section').forEach(el => { el.getBoundingClientRect = () => ({ top: 1000 }); });
const localStorage = { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value) };
const context = vm.createContext({
  window, document, localStorage,
  navigator: { clipboard: { async writeText(text) { copied = text; } } },
  CustomEvent: window.CustomEvent,
  requestAnimationFrame: () => 1,
  setTimeout: callback => { timers.set(++timerId, callback); return timerId; },
  clearTimeout: id => timers.delete(id),
  console,
});
vm.runInContext(fs.readFileSync(path.join(dist, 'app.js'), 'utf8'), context);
const click = selector => document.querySelector(selector).dispatchEvent(new window.Event('click', { bubbles: true }));
click('#tab-configure');
assert.equal(document.querySelector('#tab-configure').getAttribute('aria-selected'), 'true');
assert.equal(document.querySelector('#panel-configure').hidden, false);
assert.equal(document.querySelector('#panel-provision').hidden, true);
assert.equal(document.querySelector('#arch-source-name').textContent, 'Ansible');
click('#tab-observe');
assert.equal(document.querySelector('#arch-node-three').textContent, 'EFK');
const key = new window.Event('keydown', { bubbles: true });
key.key = 'Home';
document.querySelector('#tab-observe').dispatchEvent(key);
assert.equal(document.querySelector('#tab-provision').getAttribute('aria-selected'), 'true');
click('.menu-toggle');
assert.equal(document.querySelector('#mobile-nav').hidden, false);
assert.equal(document.querySelector('.menu-toggle').getAttribute('aria-expanded'), 'true');
click('#mobile-nav a');
assert.equal(document.querySelector('#mobile-nav').hidden, true);
click('.motion-toggle');
assert(document.documentElement.classList.contains('motion-paused'));
assert.equal(stored.get('dat-motion-paused'), 'true');
click('.motion-toggle');
assert(!document.documentElement.classList.contains('motion-paused'));
click('.copy-email');
await new Promise(resolve => setImmediate(resolve));
assert.equal(copied, 'tranthanhdat4321@gmail.com');
assert.match(document.querySelector('.contact-toast').textContent, /Đã sao chép/);
assert(fs.statSync(path.join(dist, 'assets/Tran_Thanh_Dat_Resume.pdf')).size > 1000);
console.log('PASS — assets, anchors, ARIA references, CSS syntax, JavaScript syntax, Three.js geometry, project tabs, keyboard navigation, mobile menu, motion preference, clipboard and CV.');
console.log('Browser layout and WebGL rendering have not been tested in this environment.');
