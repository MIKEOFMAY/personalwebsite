// js/main.js - COMPLETE WORKING VERSION

// ==============================
// LOADER & CURSOR
// ==============================
window.addEventListener('load', () => setTimeout(() => {
    document.getElementById('loader')?.classList.add('hidden');
}, 1000));

const cDot = document.getElementById('cDot'), cOut = document.getElementById('cOut');
let mx = 0, my = 0, ox = 0, oy = 0;
document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
function animCursor() {
    ox += (mx - ox) * 0.12; oy += (my - oy) * 0.12;
    if(cDot) { cDot.style.left = mx + 'px'; cDot.style.top = my + 'px'; }
    if(cOut) { cOut.style.left = ox + 'px'; cOut.style.top = oy + 'px'; }
    requestAnimationFrame(animCursor);
}
animCursor();
document.querySelectorAll('a, button, .skill-tag, .card-deck-btn, .card-dot, .contact-btn').forEach(el => {
    el.addEventListener('mouseenter', () => cOut?.classList.add('hover'));
    el.addEventListener('mouseleave', () => cOut?.classList.remove('hover'));
});

// ==============================
// NAVIGATION
// ==============================
const navTog = document.getElementById('navToggle'), navLks = document.getElementById('navLinks');
navTog?.addEventListener('click', () => { navTog.classList.toggle('active'); navLks?.classList.toggle('active'); });
document.querySelectorAll('.nav-links a').forEach(l => l.addEventListener('click', () => { 
    navTog?.classList.remove('active'); navLks?.classList.remove('active'); 
}));
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => { nav?.classList.toggle('scrolled', window.scrollY > 50); });

// ==============================
// PROGRESS & GRADIENT
// ==============================
// ==============================
// PROGRESS & GRADIENT
// ==============================
const pBar = document.getElementById('pBar')
const gradientBg = document.getElementById('gradientBg')

// --- Pixel canvas setup ---
const pixelCanvas = document.createElement('canvas')
pixelCanvas.setAttribute('aria-hidden', 'true')
pixelCanvas.style.cssText = [
  'position:fixed', 'top:0', 'left:0',
  'width:100vw', 'height:100vh',
  'pointer-events:none', 'z-index:0',
  'image-rendering:pixelated',
  'mix-blend-mode:screen',
  'opacity:0'
].join(';')
document.body.appendChild(pixelCanvas)
const pCtx = pixelCanvas.getContext('2d')

function resizePixelCanvas() {
  pixelCanvas.width  = Math.ceil(window.innerWidth  / 6)
  pixelCanvas.height = Math.ceil(window.innerHeight / 6)
  pixelCanvas.style.width  = window.innerWidth  + 'px'
  pixelCanvas.style.height = window.innerHeight + 'px'
}
resizePixelCanvas()
window.addEventListener('resize', resizePixelCanvas)

const PIXEL_PALETTE = [
  [254, 94,  50,  0.55],
  [255, 140, 80,  0.40],
  [200, 80,  120, 0.35],
  [120, 60,  180, 0.30],
  [40,  40,  80,  0.45],
  [255, 220, 180, 0.25],
]

function drawPixels(progress) {
  const w = pixelCanvas.width
  const h = pixelCanvas.height
  pCtx.clearRect(0, 0, w, h)
  const density  = progress * progress * 0.65
  const maxAlpha = progress * 0.9
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      if (Math.random() > density) continue
      const col   = PIXEL_PALETTE[Math.floor(Math.random() * PIXEL_PALETTE.length)]
      const alpha = col[3] * maxAlpha * (0.4 + Math.random() * 0.6)
      pCtx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${alpha})`
      pCtx.fillRect(x, y, 1, 1)
    }
  }
}

// --- Unified scroll handler ---
let lastProgress = -1
let rafId = null

function onScroll() {
  const s = document.documentElement.scrollTop || document.body.scrollTop
  const h = document.documentElement.scrollHeight - window.innerHeight
  const scrollRatio = h > 0 ? s / h : 0

  // Progress bar
  if (pBar) pBar.style.width = (scrollRatio * 100) + '%'

  // Find education section to anchor gradient start
  const eduSection = document.getElementById('education')
                  || document.querySelector('section:nth-of-type(2)')
  let startRatio = 0.12
  if (eduSection) {
    const eduTop = eduSection.getBoundingClientRect().top + s
    startRatio = eduTop / document.documentElement.scrollHeight
  }

  // progress: 0 when education enters view → 1 at page bottom
  const rawProgress = (scrollRatio - startRatio) / (1 - startRatio)
  const progress    = Math.min(1, Math.max(0, rawProgress))

  // Gradient background
  if (gradientBg) {
    if (progress > 0) {
      gradientBg.classList.add('active')
      gradientBg.style.opacity          = Math.min(1, progress * 2).toFixed(3)
      gradientBg.style.backgroundPosition = `0% ${(progress * 80).toFixed(1)}%`
    } else {
      gradientBg.classList.remove('active')
      gradientBg.style.opacity           = '0'
      gradientBg.style.backgroundPosition = '0% 0%'
    }
    gradientBg.style.setProperty('--grad-progress', progress.toFixed(3))
  }

  // Pixel overlay — skip repaint if progress barely changed
  pixelCanvas.style.opacity = (progress * 0.75).toFixed(3)
  if (Math.abs(progress - lastProgress) >= 0.008) {
    lastProgress = progress
    cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => drawPixels(progress))
  }
}

window.addEventListener('scroll', onScroll, { passive: true })
window.addEventListener('resize', onScroll)
onScroll() 

// ==============================
// REVEAL & NAV ACTIVE
// ==============================
const obs = new IntersectionObserver(entries => entries.forEach(e => { 
    if(e.isIntersecting) e.target.classList.add('active'); 
}), { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

const secs = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');
const secObs = new IntersectionObserver(entries => entries.forEach(e => {
    if(e.isIntersecting) { 
        const id = e.target.id; 
        navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id)); 
    }
}), { threshold: 0.3 });
secs.forEach(s => secObs.observe(s));

document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', function(e) {
    e.preventDefault();
    const t = document.querySelector(this.getAttribute('href'));
    if(t) { window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth' }); }
}));

// ==============================
// 🎴 CARD STACK — SELECTED WORKS
// ==============================

const workCards = [
  {
    title: 'Brand Identity',
    desc: 'Visual identity system for a lifestyle brand — logomark, type hierarchy, and colour palette.',
    tag: 'Branding',
    bg: '#1a1a2e',
    accent: '#e94560',
  },
  {
    title: 'Editorial Layout',
    desc: 'Magazine spread design for a quarterly arts publication, balancing image and long-form text.',
    tag: 'Print',
    bg: '#2d4a3e',
    accent: '#88d498',
  },
  {
    title: 'Motion Graphics',
    desc: 'Animated title sequence and lower-thirds package for an independent short film.',
    tag: 'Motion',
    bg: '#2c1654',
    accent: '#c77dff',
  },
  {
    title: 'Web Design',
    desc: 'End-to-end UX and visual design for an e-commerce experience — desktop and mobile.',
    tag: 'Digital',
    bg: '#1b2838',
    accent: '#66c0f4',
  },
  {
    title: 'Packaging',
    desc: 'Product line packaging for a local food startup — structural design, illustration, and print prep.',
    tag: 'Packaging',
    bg: '#3d2b1f',
    accent: '#f4a261',
  },
  {
    title: 'Photography',
    desc: 'Portrait series documenting creative workers across the city, shot on medium format film.',
    tag: 'Photo',
    bg: '#1c1c1c',
    accent: '#e0e0e0',
  },
]

// ==============================
// CSS STYLES (auto-injected)
// ==============================
;(function injectWorkStyles() {
  const style = document.createElement('style')
  style.textContent = `
    .work-stack-scene {
      position: relative;
      width: 300px;
      height: 420px;
      margin: 0 auto;
    }
    .work-card {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      will-change: transform;
      cursor: grab;
      user-select: none;
      -webkit-user-select: none;
    }
    .work-card-inner {
      width: 100%; height: 100%;
      border-radius: 18px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 28px 26px;
      box-shadow: 0 30px 80px rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.15);
      transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease;
      overflow: hidden;
      position: relative;
    }
    .work-card-inner::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(160deg, rgba(255,255,255,0.06) 0%, transparent 60%);
      border-radius: inherit;
      pointer-events: none;
    }
    .work-card-tag {
      display: inline-block;
      font-family: var(--font-headers);
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      padding: 5px 12px;
      border-radius: 20px;
      margin-bottom: 14px;
      width: fit-content;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(6px);
    }
    .work-card-title {
      font-family: var(--font-headers);
      font-size: 1.5rem;
      font-weight: 800;
      color: #fff;
      margin: 0 0 10px;
      line-height: 1.2;
      letter-spacing: -0.3px;
    }
    .work-card-desc {
      font-family: var(--font-body, system-ui);
      font-size: 0.8rem;
      line-height: 1.55;
      color: rgba(255,255,255,0.72);
      margin: 0;
    }
    .work-card-num {
      position: absolute;
      top: 24px;
      right: 24px;
      font-family: var(--font-headers);
      font-size: 0.65rem;
      font-weight: 700;
      color: rgba(255,255,255,0.35);
      letter-spacing: 1px;
    }
    .work-hint {
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(8px);
      color: rgba(255,255,255,0.9);
      font-family: var(--font-headers);
      font-size: 0.6rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 7px 12px;
      border-radius: 20px;
      line-height: 1.5;
      animation: wPulse 2.5s ease-in-out infinite;
    }
    @keyframes wPulse {
      0%,100% { opacity: 0.7; transform: scale(1); }
      50%      { opacity: 1;   transform: scale(1.03); }
    }

    /* nav & dots */
    .work-nav { display:flex; justify-content:center; gap:20px; margin-top:30px; }
    .work-btn {
      width:48px; height:48px; border-radius:50%;
      border:2px solid var(--gray-200); background:var(--white);
      cursor:pointer; display:flex; align-items:center; justify-content:center;
      transition:all 0.25s var(--ease);
      box-shadow:0 4px 12px rgba(0,0,0,0.08);
    }
    .work-btn:hover {
      border-color:var(--orange); background:var(--orange);
      transform:translateY(-2px); box-shadow:0 8px 25px rgba(254,94,50,0.25);
    }
    .work-btn:hover svg { stroke:#fff; }
    .work-btn svg { width:20px; height:20px; stroke:var(--black); stroke-width:2.5; fill:none; }
    .work-dots { display:flex; justify-content:center; gap:9px; margin-top:22px; }
    .work-dot {
      width:10px; height:10px; border-radius:50%;
      background:var(--gray-200); cursor:pointer;
      transition:all 0.25s var(--ease); border:2px solid transparent;
    }
    .work-dot.active { background:var(--orange); transform:scale(1.4); border-color:rgba(254,94,50,0.35); }
    .work-dot.gone   { opacity:0; pointer-events:none; }

    /* modal */
    .work-modal {
      position:fixed; inset:0;
      background:rgba(0,0,0,0.88);
      display:flex; align-items:center; justify-content:center;
      z-index:10000; animation:wFadeIn 0.22s ease;
    }
    .work-modal-card {
      width: min(340px, 90vw);
      height: min(480px, 88vh);
      border-radius:22px;
      display:flex; flex-direction:column; justify-content:flex-end;
      padding:36px 32px;
      position:relative;
      overflow:hidden;
      animation:wZoomIn 0.25s ease;
      box-shadow:0 40px 120px rgba(0,0,0,0.5);
    }
    .work-modal-card::before {
      content:'';
      position:absolute; inset:0;
      background:linear-gradient(160deg,rgba(255,255,255,0.07) 0%,transparent 60%);
      pointer-events:none;
    }
    .work-modal-close {
      position:absolute; top:-52px; right:0;
      background:#fff; border:none;
      width:40px; height:40px; border-radius:50%;
      font-size:22px; font-weight:300; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      transition:all 0.2s ease; color:var(--black);
    }
    .work-modal-close:hover { transform:scale(1.12); background:var(--orange); color:#fff; }
    @keyframes wFadeIn { from{opacity:0} to{opacity:1} }
    @keyframes wZoomIn { from{transform:scale(0.9);opacity:0} to{transform:scale(1);opacity:1} }
  `
  document.head.appendChild(style)
})()

// ==============================
// CARD STACK CLASS
// ==============================
class WorkCardStack {
  constructor(sceneEl, works) {
    this.sceneEl = sceneEl
    this.works = works
    this.cards = []
    this.gone = new Set()
    this.currentIndex = 0
    this.isDragging = false
    this.init()
  }

  // 3D transform matching React Spring demo feel
  trans(rot, scale) {
    return `perspective(1500px) rotateX(4deg) rotateY(${rot / 10}deg) rotateZ(${rot}deg) scale(${scale})`
  }

  buildCardHTML(work, index, total) {
    return `
      <div class="work-card-inner" style="background:${work.bg};">
        <span class="work-card-num">${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
        ${index === 0 ? '<span class="work-hint">Click to enlarge · Drag to dismiss</span>' : ''}
        <span class="work-card-tag" style="color:${work.accent};">${work.tag}</span>
        <h3 class="work-card-title" style="color:#fff;">${work.title}</h3>
        <p class="work-card-desc">${work.desc}</p>
      </div>
    `
  }

  init() {
    this.works.forEach((work, index) => {
      const card = document.createElement('div')
      card.className = 'work-card'
      card.style.zIndex = this.works.length - index

      const yOff = index * -5
      const rot = -8 + Math.random() * 16
      card.innerHTML = this.buildCardHTML(work, index, this.works.length)

      const inner = card.querySelector('.work-card-inner')
      inner.style.transform = this.trans(rot, 1 - index * 0.02)
      inner.style.marginTop = yOff + 'px'
      inner._baseRot = rot
      inner._baseScale = 1 - index * 0.02
      inner._baseY = yOff

      this.sceneEl.appendChild(card)
      this.cards.push(card)

      card.addEventListener('click', e => {
        if (this.isDragging) return
        e.stopPropagation()
        this.enlargeCard(work)
      })

      if (index === 0) this.setupDrag(card, index)
    })

    this.createNav()
    this.createDots()
  }

  setupDrag(card, index) {
    const inner = card.querySelector('.work-card-inner')
    let startX = 0, currentX = 0, velX = 0, lastX = 0, lastT = 0
    const THRESHOLD = 80

    inner.addEventListener('mousedown', e => {
      if (index !== this.currentIndex || this.gone.has(index)) return
      this.isDragging = false          // reset; set true on first move
      startX = e.clientX
      lastX = startX; lastT = Date.now()
      inner.style.transition = 'none'
      inner.style.cursor = 'grabbing'
    })

    document.addEventListener('mousemove', e => {
      if (inner.style.cursor !== 'grabbing' || index !== this.currentIndex) return
      this.isDragging = true
      currentX = e.clientX - startX
      const now = Date.now(), dt = now - lastT
      if (dt > 0) velX = (e.clientX - lastX) / dt * 16
      lastX = e.clientX; lastT = now
      inner.style.transform = this.trans(currentX / 8, 1.06)
      inner.style.marginTop = inner._baseY + 'px'
    })

    document.addEventListener('mouseup', () => {
      if (inner.style.cursor !== 'grabbing' || index !== this.currentIndex) return
      inner.style.cursor = 'grab'
      const wasDragging = this.isDragging
      setTimeout(() => { this.isDragging = false }, 50)

      if (wasDragging && (Math.abs(velX) > 20 || Math.abs(currentX) > THRESHOLD)) {
        this.flyAway(card, index, currentX)
      } else {
        this.snapBack(inner)
      }
      currentX = 0; velX = 0
    })

    // Touch support
    inner.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX
      lastX = startX; lastT = Date.now()
      inner.style.transition = 'none'
    }, { passive: true })

    inner.addEventListener('touchmove', e => {
      if (index !== this.currentIndex) return
      this.isDragging = true
      currentX = e.touches[0].clientX - startX
      const now = Date.now(), dt = now - lastT
      if (dt > 0) velX = (e.touches[0].clientX - lastX) / dt * 16
      lastX = e.touches[0].clientX; lastT = now
      inner.style.transform = this.trans(currentX / 8, 1.06)
    }, { passive: true })

    inner.addEventListener('touchend', () => {
      const wasDragging = this.isDragging
      setTimeout(() => { this.isDragging = false }, 50)
      if (wasDragging && (Math.abs(velX) > 20 || Math.abs(currentX) > THRESHOLD)) {
        this.flyAway(card, index, currentX)
      } else {
        this.snapBack(inner)
      }
      currentX = 0; velX = 0
    })
  }

  flyAway(card, index, direction) {
    const inner = card.querySelector('.work-card-inner')
    const dir = direction < 0 ? -1 : 1
    inner.style.transition = 'transform 0.4s ease, opacity 0.4s ease'
    inner.style.transform = `perspective(1500px) rotateX(4deg) rotateY(${dir * 25}deg) rotateZ(${dir * 20}deg) translateX(${dir * 120}%) scale(0.9)`
    inner.style.opacity = '0'
    this.gone.add(index)
    this.currentIndex = this.nextActive()
    this.updateDots()

    if (this.gone.size === this.works.length) {
      setTimeout(() => { this.gone.clear(); this.currentIndex = 0; this.resetAll() }, 500)
    }
  }

  snapBack(inner) {
    inner.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease'
    inner.style.transform = this.trans(inner._baseRot, inner._baseScale)
    inner.style.opacity = '1'
  }

  nextActive() {
    for (let i = 0; i < this.works.length; i++) {
      if (!this.gone.has(i)) return i
    }
    return 0
  }

  createNav() {
    const nav = document.createElement('div')
    nav.className = 'work-nav'
    nav.innerHTML = `
      <button class="work-btn prev-btn" aria-label="Previous">
        <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button class="work-btn next-btn" aria-label="Next">
        <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    `
    this.sceneEl.parentElement.appendChild(nav)
    nav.querySelector('.next-btn').onclick = () => this.navNext()
    nav.querySelector('.prev-btn').onclick = () => this.navPrev()
  }

  createDots() {
    const wrap = document.createElement('div')
    wrap.className = 'work-dots'
    this.works.forEach((_, i) => {
      const d = document.createElement('span')
      d.className = 'work-dot' + (i === 0 ? ' active' : '')
      wrap.appendChild(d)
    })
    this.sceneEl.parentElement.appendChild(wrap)
    this.dotsEl = wrap
  }

  updateDots() {
    if (!this.dotsEl) return
    this.dotsEl.querySelectorAll('.work-dot').forEach((d, i) => {
      d.className = 'work-dot' +
        (i === this.currentIndex && !this.gone.has(i) ? ' active' : '') +
        (this.gone.has(i) ? ' gone' : '')
    })
  }

  navNext() {
    const i = this.currentIndex
    if (!this.gone.has(i)) this.flyAway(this.cards[i], i, 100)
  }

  navPrev() {
    const gone = Array.from(this.gone).sort((a, b) => b - a)
    if (!gone.length) return
    const last = gone[0]
    this.gone.delete(last)
    this.snapBack(this.cards[last].querySelector('.work-card-inner'))
    this.currentIndex = last
    this.updateDots()
  }

  resetAll() {
    this.cards.forEach((card, i) => {
      const inner = card.querySelector('.work-card-inner')
      inner.style.transition = 'transform 0.45s ease, opacity 0.3s ease'
      inner.style.opacity = '1'
      inner.style.transform = this.trans(inner._baseRot, inner._baseScale)
      inner.style.marginTop = inner._baseY + 'px'
    })
    this.updateDots()
  }

  enlargeCard(work) {
    if (document.querySelector('.work-modal')) return
    const modal = document.createElement('div')
    modal.className = 'work-modal'
    modal.innerHTML = `
      <div class="work-modal-card" style="background:${work.bg};">
        <button class="work-modal-close" aria-label="Close">✕</button>
        <span class="work-card-tag" style="color:${work.accent}; margin-bottom:18px;">${work.tag}</span>
        <h2 class="work-card-title" style="font-size:2rem; margin-bottom:14px;">${work.title}</h2>
        <p class="work-card-desc" style="font-size:0.9rem;">${work.desc}</p>
      </div>
    `
    document.body.appendChild(modal)
    const close = () => { modal.style.opacity = '0'; setTimeout(() => modal.remove(), 200) }
    modal.onclick = e => { if (e.target === modal || e.target.closest('.work-modal-close')) close() }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close() }, { once: true })
  }
}

// ==============================
// BUILD WORKS SECTION
// ==============================
const worksContainer = document.getElementById('worksContainer')
if (worksContainer) {
  const wrapper = document.createElement('div')
  wrapper.className = 'card-stack-wrapper reveal'
  wrapper.innerHTML = `
    <div class="card-stack-header">
      <span class="card-stack-num">04</span>
      <h3 class="card-stack-title">Selected Works</h3>
      <p class="card-stack-desc">Click any card to enlarge · Drag to dismiss · Use arrows to navigate</p>
    </div>
    <div class="work-stack-scene" id="work-scene"></div>
  `
  worksContainer.appendChild(wrapper)
  const scene = document.getElementById('work-scene')
  if (scene) new WorkCardStack(scene, workCards)
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
}