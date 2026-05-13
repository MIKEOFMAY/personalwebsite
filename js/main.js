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
const pBar = document.getElementById('pBar');
window.addEventListener('scroll', () => {
    const s = document.documentElement.scrollTop || document.body.scrollTop;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if(pBar) pBar.style.width = ((s / h) * 100) + '%';
});
const gradientBg = document.getElementById('gradientBg');
window.addEventListener('scroll', () => {
    const s = document.documentElement.scrollTop || document.body.scrollTop;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    gradientBg?.classList.toggle('active', (s / h) > 0.15);
});

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
// 🎴 TAROT CARD STACK - FIXED & COMPLETE
// ==============================
class TarotCardStack {
    constructor(sceneEl, cardImages) {
        this.sceneEl = sceneEl;
        this.cardImages = cardImages;
        this.cards = [];
        this.gone = new Set();
        this.currentIndex = 0;
        this.isDragging = false;
        this.sceneWidth = sceneEl.offsetWidth || 380;
        this.init();
    }

    init() {
        this.cardImages.forEach((imgSrc, index) => {
            const card = document.createElement('div');
            card.className = 'tarot-card';
            card.style.zIndex = this.cardImages.length - index;
            
            const yOffset = index * -4;
            const randomRot = -10 + Math.random() * 20;
            const scale = 1 - (index * 0.02);
            
            card.innerHTML = `
                <div class="tarot-card-inner" style="
                    transform: translateY(${yOffset}px) scale(${scale}) rotate(${randomRot}deg);
                    background-image: url('${imgSrc}');
                ">
                    <span class="tarot-label">${index + 1}</span>
                    ${index === 0 ? '<span class="tarot-hint">↑ Click any card to enlarge<br>↔ Drag top card to dismiss</span>' : ''}
                </div>
            `;
            
            this.sceneEl.appendChild(card);
            this.cards.push(card);
            
            // ✅ Click ANY card to enlarge
            card.addEventListener('click', (e) => {
                if (this.isDragging) return;
                e.stopPropagation();
                this.enlargeCard(imgSrc);
            });
            
            // Drag ONLY top card
            if (index === 0) this.setupDrag(card, index);
        });
        
        this.createNavButtons();
        this.createDots();
    }

    setupDrag(card, index) {
        const cardInner = card.querySelector('.tarot-card-inner');
        let startX = 0, currentX = 0, velocityX = 0, lastTime = 0, lastX = 0;
        const dragThreshold = 80;
        
        cardInner.addEventListener('mousedown', (e) => {
            if (index !== this.currentIndex || this.gone.has(index)) return;
            this.isDragging = true;
            startX = e.clientX;
            lastX = startX;
            lastTime = Date.now();
            cardInner.style.transition = 'none';
            cardInner.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging || index !== this.currentIndex) return;
            currentX = e.clientX - startX;
            const now = Date.now();
            const dt = now - lastTime;
            if (dt > 0) velocityX = (e.clientX - lastX) / dt * 16;
            lastX = e.clientX;
            lastTime = now;
            const rot = currentX / 12;
            cardInner.style.transform = `translate(${currentX}px, 0) rotate(${rot}deg) scale(1.05)`;
        });
        
        document.addEventListener('mouseup', () => {
        if (!this.isDragging || index !== this.currentIndex) return;
        this.isDragging = false;
        cardInner.style.cursor = 'grab';
        
        if (Math.abs(velocityX) > 20 || Math.abs(currentX) > dragThreshold) {  // ← velocityX was > 10
            this.flyAway(card, index, currentX);
        } else {
            this.snapBack(card, index);
        }
    });
}

    flyAway(card, index, direction) {
        const cardInner = card.querySelector('.tarot-card-inner');
        const dir = direction < 0 ? -1 : 1;
        const flyX = dir * (400 + this.sceneWidth);
        
        this.gone.add(index);
        cardInner.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
        cardInner.style.transform = `translate(${flyX}px, ${dir * 30}px) rotate(${dir * 25}deg) scale(0.9)`;
        cardInner.style.opacity = '0';
        
        this.currentIndex = this.getNextActiveIndex();
        this.updateDots();
        
        if (this.gone.size === this.cardImages.length) {
            setTimeout(() => {
                this.gone.clear();
                this.currentIndex = 0;
                this.resetAll();
            }, 500);
        }
    }

    snapBack(card, index) {
        const cardInner = card.querySelector('.tarot-card-inner');
        const yOffset = index * -4;
        const randomRot = -10 + Math.random() * 20;
        const scale = 1 - (index * 0.02);
        cardInner.style.transition = 'transform 0.4s cubic-bezier(0.76,0,0.24,1)';
        cardInner.style.transform = `translateY(${yOffset}px) scale(${scale}) rotate(${randomRot}deg)`;
        cardInner.style.opacity = '1';
    }

    getNextActiveIndex() {
        for (let i = 0; i < this.cardImages.length; i++) {
            if (!this.gone.has(i)) return i;
        }
        return 0;
    }

    createNavButtons() {
        const nav = document.createElement('div');
        nav.className = 'tarot-nav';
        nav.innerHTML = `
            <button class="tarot-btn prev-btn">
                <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" fill="none"/></svg>
            </button>
            <button class="tarot-btn next-btn">
                <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" fill="none"/></svg>
            </button>
        `;
        this.sceneEl.parentElement.appendChild(nav);
        nav.querySelector('.prev-btn').onclick = () => this.navPrev();
        nav.querySelector('.next-btn').onclick = () => this.navNext();
    }

    createDots() {
        const dots = document.createElement('div');
        dots.className = 'tarot-dots';
        this.cardImages.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.className = 'tarot-dot' + (i === 0 ? ' active' : '');
            dot.dataset.idx = i;
            dots.appendChild(dot);
        });
        this.sceneEl.parentElement.appendChild(dots);
        this.dotsContainer = dots;
    }

    updateDots() {
        if (!this.dotsContainer) return;
        this.dotsContainer.querySelectorAll('.tarot-dot').forEach((dot, idx) => {
            const isGone = this.gone.has(idx);
            dot.classList.toggle('active', idx === this.currentIndex && !isGone);
            dot.classList.toggle('invisible', isGone);
        });
    }

    navNext() {
        const i = this.currentIndex;
        if (this.gone.has(i)) return;
        this.flyAway(this.cards[i], i, 100);
    }

    navPrev() {
        const goneIndices = Array.from(this.gone).sort((a, b) => b - a);
        if (goneIndices.length === 0) return;
        const lastGone = goneIndices[0];
        this.gone.delete(lastGone);
        this.snapBack(this.cards[lastGone], lastGone);
        this.currentIndex = lastGone;
        this.updateDots();
    }

    resetAll() {
        this.cards.forEach((card, index) => {
            const cardInner = card.querySelector('.tarot-card-inner');
            const yOffset = index * -4;
            const randomRot = -10 + Math.random() * 20;
            const scale = 1 - (index * 0.02);
            card.style.zIndex = this.cardImages.length - index;
            cardInner.style.transition = 'transform 0.4s ease';
            cardInner.style.transform = `translateY(${yOffset}px) scale(${scale}) rotate(${randomRot}deg)`;
            cardInner.style.opacity = '1';
        });
        this.updateDots();
    }

    enlargeCard(imgSrc) {
        if (document.querySelector('.tarot-modal')) return;
        const modal = document.createElement('div');
        modal.className = 'tarot-modal';
        modal.innerHTML = `
            <div class="tarot-modal-content">
                <img src="${imgSrc}" alt="Enlarged" class="tarot-modal-image">
                <button class="tarot-modal-close" aria-label="Close">✕</button>
            </div>
        `;
        document.body.appendChild(modal);
        const close = () => {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 200);
        };
        modal.onclick = (e) => { if (e.target === modal || e.target.closest('.tarot-modal-close')) close(); };
        document.addEventListener('keydown', function onEsc(e) {
            if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); }
        }, { once: true });
    }
}

// ==============================
// CSS STYLES (auto-injected)
// ==============================
(function injectTarotStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .tarot-card{position:absolute;top:0;left:0;width:100%;height:100%;will-change:transform;cursor:grab;user-select:none;-webkit-user-select:none}
        .tarot-card-inner{width:100%;height:100%;border-radius:15px;background-size:cover;background-position:center;background-repeat:no-repeat;box-shadow:0 20px 60px rgba(0,0,0,0.2);display:flex;align-items:flex-end;justify-content:center;padding-bottom:35px;transition:transform 0.3s ease,opacity 0.3s ease}
        .tarot-card-inner:active{cursor:grabbing}
        .tarot-label{background:rgba(0,0,0,0.75);color:#fff;font-family:var(--font-headers);font-weight:700;font-size:1rem;padding:10px 20px;border-radius:25px;text-align:center}
        .tarot-hint{position:absolute;top:20px;right:20px;background:rgba(255,255,255,0.95);color:var(--black);font-family:var(--font-headers);font-size:0.65rem;text-transform:uppercase;letter-spacing:0.5px;padding:8px 14px;border-radius:18px;text-align:right;line-height:1.4;animation:pulse 2.5s ease-in-out infinite;max-width:140px}
        @keyframes pulse{0%,100%{opacity:0.7;transform:scale(1)}50%{opacity:1;transform:scale(1.03)}}
        .tarot-nav{display:flex;justify-content:center;gap:25px;margin-top:35px}
        .tarot-btn{width:52px;height:52px;border-radius:50%;border:2px solid var(--gray-200);background:var(--white);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.25s var(--ease);box-shadow:0 4px 12px rgba(0,0,0,0.08)}
        .tarot-btn:hover{border-color:var(--orange);background:var(--orange);transform:translateY(-2px);box-shadow:0 8px 25px rgba(254,94,50,0.25)}
        .tarot-btn:hover svg{stroke:var(--white)}
        .tarot-btn svg{width:22px;height:22px;stroke:var(--black);stroke-width:2;fill:none}
        .tarot-dots{display:flex;justify-content:center;gap:10px;margin-top:25px}
        .tarot-dot{width:11px;height:11px;border-radius:50%;background:var(--gray-200);cursor:pointer;transition:all 0.25s var(--ease);border:2px solid transparent}
        .tarot-dot.active{background:var(--orange);transform:scale(1.4);border-color:rgba(254,94,50,0.35)}
        .tarot-dot.invisible{opacity:0;pointer-events:none}
        .tarot-modal{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;z-index:10000;opacity:1;transition:opacity 0.25s ease;animation:fadeIn 0.25s ease}
        .tarot-modal-content{position:relative;max-width:96vw;max-height:96vh;animation:zoomIn 0.25s ease}
        .tarot-modal-image{max-width:100%;max-height:92vh;border-radius:12px;box-shadow:0 25px 80px rgba(0,0,0,0.6);object-fit:contain;display:block}
        .tarot-modal-close{position:absolute;top:-50px;right:0;background:#fff;border:none;width:42px;height:42px;border-radius:50%;font-size:26px;font-weight:300;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s ease;color:var(--black)}
        .tarot-modal-close:hover{transform:scale(1.15);background:var(--orange);color:#fff}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes zoomIn{from{transform:scale(0.92);opacity:0}to{transform:scale(1);opacity:1}}
    `;
    document.head.appendChild(style);
})();

// ==============================
// TAROT CARD IMAGES
// ==============================
const tarotCardImages = [
    'https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/9/9b/RWS_Tarot_07_Chariot.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_06_Lovers.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/RWS_Tarot_02_High_Priestess.jpg/690px-RWS_Tarot_02_High_Priestess.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg',
];

// ==============================
// BUILD WORKS SECTION
// ==============================
const worksContainer = document.getElementById('worksContainer');
if (worksContainer) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-stack-wrapper reveal';
    wrapper.innerHTML = `
        <div class="card-stack-header">
            <span class="card-stack-num">04</span>
            <h3 class="card-stack-title">Selected Works</h3>
            <p class="card-stack-desc">Click any card to view full size • Drag top card to dismiss • Use arrows to navigate</p>
        </div>
        <div class="card-deck-scene" id="tarot-scene"></div>
    `;
    worksContainer.appendChild(wrapper);
    const scene = document.getElementById('tarot-scene');
    if (scene) new TarotCardStack(scene, tarotCardImages);
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}