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
