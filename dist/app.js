const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused = motionQuery.matches;
try { motionPaused = motionPaused || localStorage.getItem('dat-motion-paused') === 'true'; } catch {}
const motionButton = document.querySelector('.motion-toggle');

function setMotion(paused, persist = false) {
  motionPaused = paused;
  document.documentElement.classList.toggle('motion-paused', paused);
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.setAttribute('aria-label', paused ? 'Bật chuyển động' : 'Tạm dừng chuyển động');
  motionButton.title = paused ? 'Bật chuyển động' : 'Tạm dừng chuyển động';
  motionButton.innerHTML = paused
    ? '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 10 7-10 7V5Z" stroke="currentColor" stroke-width="1.8"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 6v12M16 6v12" stroke="currentColor" stroke-width="2.5"/></svg>';
  if (persist) { try { localStorage.setItem('dat-motion-paused', String(paused)); } catch {} }
  window.dispatchEvent(new CustomEvent('portfolio-motion', { detail: { paused } }));
}
setMotion(motionPaused);
motionButton.addEventListener('click', () => setMotion(!motionPaused, true));
motionQuery.addEventListener('change', event => setMotion(event.matches));

// Content stays readable when JavaScript or animation support is unavailable.
if ('IntersectionObserver' in window) {
  document.documentElement.classList.add('js-motion');
  const revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    }
  }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Mở menu');
  mobileNav.hidden = true;
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
  mobileNav.hidden = !open;
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuButton.focus(); }
});
document.addEventListener('click', event => {
  if (!mobileNav.hidden && !mobileNav.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
});
window.matchMedia('(min-width: 681px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

const progress = document.querySelector('.scroll-progress');
const navLinks = [...document.querySelectorAll('.desktop-nav a')];
const navSections = navLinks.map(a => document.querySelector(a.getAttribute('href')));
let scrollScheduled = false;
function updateScroll() {
  scrollScheduled = false;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0})`;
  let current = -1;
  navSections.forEach((section, i) => { if (section.getBoundingClientRect().top <= 180) current = i; });
  if (document.querySelector('#contact').getBoundingClientRect().top <= 180) current = -1;
  navLinks.forEach((link, i) => {
    if (i === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
window.addEventListener('scroll', () => {
  if (!scrollScheduled) { scrollScheduled = true; requestAnimationFrame(updateScroll); }
}, { passive: true });
window.addEventListener('resize', updateScroll, { passive: true });
updateScroll();

const architectureSteps = [
  { source: 'Terraform', subtitle: 'Infrastructure as Code', nodes: [['Network', 'VPC & kết nối'], ['EC2', 'Máy chủ'], ['ECR', 'Image registry']] },
  { source: 'Ansible', subtitle: 'Cấu hình tự động', nodes: [['Host', 'Cấu hình máy'], ['kubeadm', 'Khởi tạo cluster'], ['Kong', 'API gateway']] },
  { source: 'Kubernetes', subtitle: 'Quan sát workload', nodes: [['Prometheus', 'Metrics'], ['Grafana', 'Dashboard'], ['EFK', 'Logs tập trung']] }
];
const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];
const architecture = document.querySelector('.architecture');
let architectureTimer;
function selectTab(index, focus = false) {
  tabs.forEach((tab, i) => {
    const selected = i === index;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    panels[i].hidden = !selected;
  });
  const step = architectureSteps[index];
  document.querySelector('#arch-source-name').textContent = step.source;
  document.querySelector('#arch-source-sub').textContent = step.subtitle;
  ['one', 'two', 'three'].forEach((id, i) => {
    document.querySelector(`#arch-node-${id}`).textContent = step.nodes[i][0];
    document.querySelector(`#arch-sub-${id}`).textContent = step.nodes[i][1];
  });
  architecture.classList.remove('changing');
  if (!motionPaused) {
    void architecture.offsetWidth;
    architecture.classList.add('changing');
    clearTimeout(architectureTimer);
    architectureTimer = setTimeout(() => architecture.classList.remove('changing'), 550);
  }
  if (focus) tabs[index].focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(index));
  tab.addEventListener('keydown', event => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    selectTab(next, true);
  });
});

// Subtle movement is limited to precise pointers; touch scroll stays native.
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
document.querySelectorAll('.magnetic').forEach(el => {
  el.addEventListener('pointermove', event => {
    if (!finePointer.matches || motionPaused) return;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * 0.1;
    const y = (event.clientY - rect.top - rect.height / 2) * 0.12;
    el.style.transform = `translate(${x}px, ${y}px)`;
  });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
});
const demo = document.querySelector('.project-demo');
demo.addEventListener('pointermove', event => {
  if (!finePointer.matches || motionPaused) return;
  const rect = demo.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  demo.style.transform = `perspective(1200px) rotateX(${-y * 2}deg) rotateY(${x * 2}deg)`;
});
demo.addEventListener('pointerleave', () => { demo.style.transform = ''; });

const emailButton = document.querySelector('.copy-email');
const toast = document.querySelector('.contact-toast');
let toastTimer;
emailButton.addEventListener('click', async () => {
  const email = 'tranthanhdat4321@gmail.com';
  clearTimeout(toastTimer);
  try {
    await navigator.clipboard.writeText(email);
    toast.textContent = 'Đã sao chép email. Hẹn gặp trong hộp thư!';
    emailButton.querySelector('span').textContent = 'Đã sao chép';
    emailButton.setAttribute('aria-label', 'Đã sao chép địa chỉ email');
  } catch {
    toast.textContent = 'Chưa thể sao chép tự động. Bạn có thể chọn địa chỉ email để sao chép.';
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(document.querySelector('.email-link'));
      selection.removeAllRanges(); selection.addRange(range);
    }
  }
  toastTimer = setTimeout(() => {
    toast.textContent = '';
    emailButton.querySelector('span').textContent = 'Sao chép';
    emailButton.setAttribute('aria-label', 'Sao chép địa chỉ email');
  }, 6000);
});

const whoami = document.querySelector('#whoami');
let typingTimer;
let typingStarted = false;
const whoamiText = 'developer → devops';
function finishTyping() {
  clearTimeout(typingTimer);
  whoami.textContent = whoamiText;
}
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting || typingStarted) return;
    typingStarted = true;
    observer.disconnect();
    if (motionPaused) return;
    let index = 0;
    whoami.textContent = '';
    const type = () => {
      if (motionPaused) { finishTyping(); return; }
      whoami.textContent = whoamiText.slice(0, ++index);
      if (index < whoamiText.length) typingTimer = setTimeout(type, 80);
    };
    type();
  }, { threshold: 0.8 });
  observer.observe(whoami);
}
window.addEventListener('portfolio-motion', event => {
  if (event.detail.paused) {
    finishTyping();
    document.querySelectorAll('.magnetic').forEach(el => { el.style.transform = ''; });
    demo.style.transform = '';
  }
});

// Color is part of the playground. Store only a local visual preference.
const paletteButton = document.querySelector('.palette-toggle');
const palettes = [{ id: 'orange', name: 'Cam' }, { id: 'violet', name: 'Tím' }, { id: 'lime', name: 'Lime' }];
let paletteIndex = 0;
try {
  const saved = localStorage.getItem('dat-palette');
  paletteIndex = Math.max(0, palettes.findIndex(palette => palette.id === saved));
} catch {}
function applyPalette() {
  const palette = palettes[paletteIndex];
  document.documentElement.dataset.palette = palette.id;
  paletteButton.querySelector('.palette-name').textContent = palette.name;
  paletteButton.setAttribute('aria-label', `Đổi bảng màu, hiện tại: ${palette.name}`);
  paletteButton.title = `Đổi bảng màu, hiện tại: ${palette.name}`;
}
applyPalette();
paletteButton.addEventListener('click', () => {
  paletteIndex = (paletteIndex + 1) % palettes.length;
  applyPalette();
  try { localStorage.setItem('dat-palette', palettes[paletteIndex].id); } catch {}
});

// A bounded burst, with no continuous particle loop or work in hidden tabs.
const confettiLayer = document.querySelector('.confetti-layer');
let confettiTimer;
function burstAt(x, y) {
  if (motionPaused || document.hidden) return;
  confettiLayer.replaceChildren();
  clearTimeout(confettiTimer);
  for (let i = 0; i < 28; i++) {
    const bit = document.createElement('i');
    bit.className = 'confetti-bit';
    bit.style.left = `${x}px`;
    bit.style.top = `${y}px`;
    const angle = (Math.PI * 2 * i) / 28;
    const distance = 70 + Math.random() * 150;
    bit.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    bit.style.setProperty('--dy', `${Math.sin(angle) * distance + 90}px`);
    bit.style.setProperty('--spin', `${Math.random() * 700 - 350}deg`);
    confettiLayer.appendChild(bit);
  }
  confettiTimer = setTimeout(() => confettiLayer.replaceChildren(), 1200);
}
const sticker = document.querySelector('.burst-sticker');
sticker.addEventListener('click', () => {
  const rect = sticker.getBoundingClientRect();
  burstAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
  sticker.querySelector('small').textContent = 'SHIPPED ✓';
  clearTimeout(sticker.resetTimer);
  sticker.resetTimer = setTimeout(() => { sticker.querySelector('small').textContent = 'BẤM THỬ ↗'; }, 1800);
});

const halo = document.querySelector('.cursor-halo');
let pointerFrame = 0;
let pointerPosition = { x: 0, y: 0 };
document.addEventListener('pointermove', event => {
  if (!finePointer.matches || motionPaused || event.pointerType === 'touch') return;
  pointerPosition = { x: event.clientX, y: event.clientY };
  if (pointerFrame) return;
  pointerFrame = requestAnimationFrame(() => {
    pointerFrame = 0;
    halo.style.transform = `translate(${pointerPosition.x}px, ${pointerPosition.y}px)`;
    halo.style.opacity = '1';
  });
}, { passive: true });
document.addEventListener('pointerover', event => {
  halo.classList.toggle('active', Boolean(event.target.closest('a, button, input, #scene-container')));
});
document.documentElement.addEventListener('pointerleave', () => { halo.style.opacity = '0'; });
window.addEventListener('blur', () => { halo.style.opacity = '0'; });
window.addEventListener('portfolio-motion', event => {
  if (event.detail.paused) {
    confettiLayer.replaceChildren();
    halo.style.opacity = '0';
  }
});

// A deterministic educational demo. It never sends deployment commands.
const deployButton = document.querySelector('.deploy-button');
const deployStatus = document.querySelector('.deploy-status');
const deployStages = [...document.querySelectorAll('.pipeline-stages li')];
const stageMessages = [
  '01 / Build — Đóng gói ứng dụng thành container image.',
  '02 / Test — Kiểm tra ứng dụng trước khi triển khai.',
  '03 / Deploy — Cập nhật workload trên Kubernetes.',
  '04 / Observe — Theo dõi metrics và logs sau triển khai.'
];
let deployTimer;
let deployRunning = false;
let deployIndex = 0;
function advanceDeploy() {
  if (document.hidden || !deployRunning) return;
  deployStages.forEach((stage, i) => {
    stage.classList.toggle('done', i < deployIndex);
    stage.classList.toggle('running', i === deployIndex);
    if (i === deployIndex) stage.setAttribute('aria-current', 'step');
    else stage.removeAttribute('aria-current');
  });
  if (deployIndex === deployStages.length) {
    deployRunning = false;
    deployStatus.textContent = '✓ Mô phỏng hoàn tất. Build → Test → Deploy → Observe.';
    deployButton.disabled = false;
    deployButton.innerHTML = 'Chạy lại <span aria-hidden="true">↻</span>';
    const rect = deployButton.getBoundingClientRect();
    if (rect.top > 0 && rect.bottom < window.innerHeight) burstAt(rect.left + rect.width / 2, rect.top);
    return;
  }
  deployStatus.textContent = stageMessages[deployIndex];
  deployIndex++;
  deployTimer = setTimeout(advanceDeploy, 850);
}
deployButton.addEventListener('click', () => {
  if (deployRunning) return;
  deployRunning = true;
  deployIndex = 0;
  deployButton.disabled = true;
  deployButton.textContent = 'Đang chạy…';
  advanceDeploy();
});
document.addEventListener('visibilitychange', () => {
  halo.style.opacity = '0';
  if (document.hidden) {
    clearTimeout(deployTimer);
    confettiLayer.replaceChildren();
  } else if (deployRunning) advanceDeploy();
});

// This terminal recognizes a small allowlist; it never evaluates user input.
const terminalForm = document.querySelector('.terminal-form');
const terminalInput = document.querySelector('#terminal-input');
const terminalOutput = document.querySelector('.terminal-output');
const terminalCommands = {
  help: 'Lệnh có sẵn: whoami · stack · projects · contact · clear',
  whoami: 'Trần Thành Đạt / Junior DevOps Engineer\nHà Nội · Software → Infrastructure',
  stack: 'Linux · Docker · Kubernetes · OpenShift\nGitLab CI/CD · Terraform · Ansible\nPrometheus · Grafana · EFK',
  projects: 'terra / Kubernetes trên AWS\nTerraform → Ansible → kubeadm\nXem phần Dự án để khám phá repo và kiến trúc.',
  contact: 'Email: tranthanhdat4321@gmail.com\nGitHub: IntheNameOfGOD2806'
};
const commandHistory = [];
let historyIndex = 0;
terminalForm.addEventListener('submit', event => {
  event.preventDefault();
  const command = terminalInput.value.trim().toLowerCase();
  if (!command) return;
  commandHistory.push(command);
  if (commandHistory.length > 30) commandHistory.shift();
  historyIndex = commandHistory.length;
  terminalInput.value = '';
  if (command === 'clear') { terminalOutput.replaceChildren(); return; }
  const output = document.createElement('p');
  const response = Object.hasOwn(terminalCommands, command)
    ? terminalCommands[command]
    : `Không tìm thấy lệnh “${command}”. Gõ help để xem hướng dẫn.`;
  output.textContent = `$ ${command}\n${response}`;
  terminalOutput.appendChild(output);
  while (terminalOutput.children.length > 12) terminalOutput.firstElementChild.remove();
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
});
terminalInput.addEventListener('keydown', event => {
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
  event.preventDefault();
  historyIndex = Math.max(0, Math.min(commandHistory.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
  terminalInput.value = commandHistory[historyIndex] || '';
});
