// js/main.js - VANILLA JS CARD STACK WITH CLICK-TO-ENLARGE

// ==============================
// LOADER & CURSOR (keep existing)
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
// NAVIGATION (keep existing)
// ==============================
const navTog = document.getElementById('navToggle'), navLks = document.getElementById('navLinks');
navTog?.addEventListener('click', () => { navTog.classList.toggle('active'); navLks?.classList.toggle('active'); });
document.querySelectorAll('.nav-links a').forEach(l => l.addEventListener('click', () => { 
    navTog?.classList.remove('active'); navLks?.classList.remove('active'); 
}));
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => { nav?.classList.toggle('scrolled', window.scrollY > 50); });

// ==============================
// PROGRESS & GRADIENT (keep existing)
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
// REVEAL & NAV ACTIVE (keep existing)
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
// 🎴 TAROT CARD STACK ENGINE (NEW - REPLACES OLD CardDeck)
// ==============================
class TarotCardStack {
    constructor(sceneEl, cardImages) {
        this.sceneEl = sceneEl;
        this.cardImages = cardImages;
        this.cards = [];
        this.gone = new Set();
        this.currentIndex = 0;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.velocityX = 0;
        this.lastTime = 0;
        this.lastX = 0;
        this.sceneWidth = sceneEl.offsetWidth || 380;
        this.sceneHeight = sceneEl.offsetHeight || 520;
        this.init();
    }

    init() {
        // Create card elements
        this.cardImages.forEach((imgSrc, index) => {
            const card = document.createElement('div');
            card.className = 'tarot-card';
            card.dataset.index = index;
            card.style.zIndex = this.cardImages.length - index;
            
            // Stack offset: each card slightly lower than the one above
            const yOffset = index * -4;
            const randomRot = -10 + Math.random() * 20;
            const scale = 1 - (index * 0.02);
            
            card.innerHTML = `
                <div class="tarot-card-inner" style="
                    transform: translateY(${yOffset}px) scale(${scale}) rotate(${randomRot}deg);
                    background-image: url('${imgSrc}');
                ">
                    <span class="tarot-label">${index + 1}</span>
                    ${index === 0 ? '<span class="tarot-hint">Click to enlarge • Drag to dismiss</span>' : ''}
                </div>
            `;
            
            this.sceneEl.appendChild(card);
            this.cards.push(card);
            
            // Setup drag events
            this.setupCardDrag(card, index);
            
            // Setup click to enlarge
            card.addEventListener('click', (e) => {
                if (this.isDragging) return;
                this.enlargeCard(imgSrc);
            });
        });
        
        // Create navigation buttons
        this.createNavButtons();
        
        // Create dots indicator
        this.createDots();
    }

    setupCardDrag(card, index) {
        const cardInner = card.querySelector('.tarot-card-inner');
        
        // Touch events
        cardInner.addEventListener('touchstart', (e) => {
            if (this.gone.has(index) || index !== this.currentIndex) return;
            this.isDragging = true;
            this.startX = e.touches[0].clientX;
            this.startY = e.touches[0].clientY;
            this.lastX = this.startX;
            this.lastTime = Date.now();
            this.velocityX = 0;
            cardInner.style.cursor = 'grabbing';
            cardInner.style.transition = 'none';
        }, { passive: true });

        cardInner.addEventListener('touchmove', (e) => {
            if (!this.isDragging) return;
            const cx = e.touches[0].clientX;
            const cy = e.touches[0].clientY;
            const now = Date.now();
            const dt = now - this.lastTime;
            
            if (dt > 0) {
                this.velocityX = (cx - this.lastX) / dt * 16;
            }
            this.lastX = cx;
            this.lastTime = now;
            
            this.currentX = cx - this.startX;
            this.currentY = cy - this.startY;
            const rot = this.currentX / 10;
            
            // Apply drag transform
            cardInner.style.transform = `
                translate(${this.currentX}px, ${this.currentY * 0.3}px) 
                rotate(${rot}deg) 
                scale(1.05)
            `;
        }, { passive: true });

        cardInner.addEventListener('touchend', () => {
            if (!this.isDragging) return;
            this.isDragging = false;
            cardInner.style.cursor = 'grab';
            this.onDragEnd(card, index);
        });

        // Mouse events
        cardInner.addEventListener('mousedown', (e) => {
            if (this.gone.has(index) || index !== this.currentIndex) return;
            this.isDragging = true;
            this.startX = e.clientX;
            this.startY = e.clientY;
            this.lastX = this.startX;
            this.lastTime = Date.now();
            this.velocityX = 0;
            cardInner.style.cursor = 'grabbing';
            cardInner.style.transition = 'none';
            e.preventDefault();
        });
    }

    onDragEnd(card, index) {
        const cardInner = card.querySelector('.tarot-card-inner');
        const trigger = Math.abs(this.velocityX) > 12; // Flick threshold
        const dir = this.currentX < 0 ? -1 : 1;
        
        if (trigger) {
            // Card flies away
            this.gone.add(index);
            const flyX = dir * (300 + this.sceneWidth);
            cardInner.style.transition = 'transform 0.5s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.5s';
            cardInner.style.transform = `translate(${flyX}px, ${dir * 20}px) rotate(${dir * 30}deg) scale(0.8)`;
            cardInner.style.opacity = '0';
            
            // Update to next card
            this.currentIndex = this.getNextActiveIndex();
            this.updateDots();
            
            // Reset if all cards gone
            if (this.gone.size === this.cardImages.length) {
                setTimeout(() => {
                    this.gone.clear();
                    this.currentIndex = 0;
                    this.resetAll();
                }, 600);
            }
        } else {
            // Card snaps back
            const yOffset = index * -4;
            const randomRot = -10 + Math.random() * 20;
            const scale = 1 - (index * 0.02);
            cardInner.style.transition = 'transform 0.5s cubic-bezier(0.76, 0, 0.24, 1)';
            cardInner.style.transform = `translateY(${yOffset}px) scale(${scale}) rotate(${randomRot}deg)`;
            cardInner.style.opacity = '1';
        }
        this.currentX = 0;
        this.currentY = 0;
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
            <button class="tarot-btn prev-btn" aria-label="Previous">
                <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button class="tarot-btn next-btn" aria-label="Next">
                <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
            </button>
        `;
        this.sceneEl.parentElement.appendChild(nav);
        
        nav.querySelector('.prev-btn').addEventListener('click', () => this.navPrev());
        nav.querySelector('.next-btn').addEventListener('click', () => this.navNext());
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
        const card = this.cards[i];
        const cardInner = card.querySelector('.tarot-card-inner');
        
        this.gone.add(i);
        cardInner.style.transition = 'transform 0.5s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.5s';
        cardInner.style.transform = 'translate(400px, 20px) rotate(25deg) scale(0.8)';
        cardInner.style.opacity = '0';
        
        this.currentIndex = this.getNextActiveIndex();
        this.updateDots();
        
        if (this.gone.size === this.cardImages.length) {
            setTimeout(() => {
                this.gone.clear();
                this.currentIndex = 0;
                this.resetAll();
            }, 600);
        }
    }

    navPrev() {
        const goneIndices = Array.from(this.gone).sort((a, b) => b - a);
        if (goneIndices.length === 0) return;
        const lastGone = goneIndices[0];
        this.gone.delete(lastGone);
        
        const card = this.cards[lastGone];
        const cardInner = card.querySelector('.tarot-card-inner');
        const yOffset = lastGone * -4;
        const randomRot = -10 + Math.random() * 20;
        const scale = 1 - (lastGone * 0.02);
        
        cardInner.style.transition = 'transform 0.5s cubic-bezier(0.76, 0, 0.24, 1)';
        cardInner.style.transform = `translateY(${yOffset}px) scale(${scale}) rotate(${randomRot}deg)`;
        cardInner.style.opacity = '1';
        
        this.currentIndex = lastGone;
        this.updateDots();
    }

    resetAll() {
        this.cards.forEach((card, index) => {
            const cardInner = card.querySelector('.tarot-card-inner');
            const yOffset = index * -4;
            const randomRot = -10 + Math.random() * 20;
            const scale = 1 - (index * 0.02);
            
            cardInner.style.transition = 'transform 0.5s cubic-bezier(0.76, 0, 0.24, 1)';
            cardInner.style.transform = `translateY(${yOffset}px) scale(${scale}) rotate(${randomRot}deg)`;
            cardInner.style.opacity = '1';
            card.style.zIndex = this.cardImages.length - index;
        });
        this.updateDots();
    }

    // 🎯 CLICK TO ENLARGE FUNCTION
    enlargeCard(imgSrc) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'tarot-modal';
        modal.innerHTML = `
            <div class="tarot-modal-content">
                <img src="${imgSrc}" alt="Enlarged card" class="tarot-modal-image">
                <button class="tarot-modal-close" aria-label="Close">✕</button>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(modal);
        
        // Close on click outside or X button
        const close = () => {
            modal.style.opacity = '0';
            modal.style.pointerEvents = 'none';
            setTimeout(() => modal.remove(), 300);
        };
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('tarot-modal-close')) {
                close();
            }
        });
        
        // Close on Escape key
        const onEscape = (e) => {
            if (e.key === 'Escape') {
                close();
                document.removeEventListener('keydown', onEscape);
            }
        };
        document.addEventListener('keydown', onEscape);
    }
}

// ==============================
// 🎴 TAROT CARD CSS (add to css/style.css or inline)
// ==============================
function injectTarotStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Tarot Card Stack */
        .tarot-card {
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            will-change: transform;
            cursor: grab;
            user-select: none;
            -webkit-user-select: none;
        }
        .tarot-card-inner {
            width: 100%; height: 100%;
            border-radius: 15px;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            box-shadow: 0 15px 50px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.1);
            display: flex; align-items: flex-end; justify-content: center;
            padding-bottom: 30px;
            transition: transform 0.3s ease, opacity 0.3s ease;
        }
        .tarot-card-inner:active { cursor: grabbing; }
        .tarot-label {
            background: rgba(0,0,0,0.7);
            color: white;
            font-family: var(--font-headers);
            font-weight: 700;
            font-size: 0.9rem;
            padding: 8px 16px;
            border-radius: 20px;
        }
        .tarot-hint {
            position: absolute;
            top: 15px; right: 15px;
            background: rgba(255,255,255,0.95);
            color: var(--black);
            font-family: var(--font-headers);
            font-size: 0.6rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 6px 12px;
            border-radius: 15px;
            animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 0.7; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); }
        }
        
        /* Navigation */
        .tarot-nav {
            display: flex; justify-content: center; gap: 20px;
            margin-top: 30px;
        }
        .tarot-btn {
            width: 50px; height: 50px;
            border-radius: 50%;
            border: 2px solid var(--gray-200);
            background: var(--white);
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.3s var(--ease);
        }
        .tarot-btn:hover {
            border-color: var(--orange);
            background: var(--orange);
            transform: translateY(-3px);
        }
        .tarot-btn:hover svg { stroke: var(--white); }
        .tarot-btn svg {
            width: 20px; height: 20px;
            stroke: var(--black); stroke-width: 2; fill: none;
        }
        
        /* Dots */
        .tarot-dots {
            display: flex; justify-content: center; gap: 8px;
            margin-top: 20px;
        }
        .tarot-dot {
            width: 10px; height: 10px;
            border-radius: 50%;
            background: var(--gray-200);
            cursor: pointer;
            transition: all 0.3s var(--ease);
            border: 2px solid transparent;
        }
        .tarot-dot.active {
            background: var(--orange);
            transform: scale(1.3);
            border-color: rgba(254,94,50,0.3);
        }
        .tarot-dot.invisible {
            opacity: 0; pointer-events: none;
        }
        
        /* Modal for enlarged card */
        .tarot-modal {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.9);
            display: flex; align-items: center; justify-content: center;
            z-index: 9999;
            opacity: 1;
            transition: opacity 0.3s ease;
            animation: fadeIn 0.3s ease;
        }
        .tarot-modal-content {
            position: relative;
            max-width: 95vw;
            max-height: 95vh;
            animation: zoomIn 0.3s ease;
        }
        .tarot-modal-image {
            max-width: 100%;
            max-height: 90vh;
            border-radius: 10px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            object-fit: contain; /* ← This preserves actual image ratio! */
        }
        .tarot-modal-close {
            position: absolute;
            top: -45px; right: 0;
            background: white;
            border: none;
            width: 40px; height: 40px;
            border-radius: 50%;
            font-size: 24px;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.2s, background 0.2s;
        }
        .tarot-modal-close:hover {
            transform: scale(1.1);
            background: var(--orange);
            color: white;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    `;
    document.head.appendChild(style);
}
injectTarotStyles();

// ==============================
// PROJECT DATA - TAROT CARD IMAGES
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
// BUILD WORKS SECTION WITH TAROT CARDS
// ==============================
const worksContainer = document.getElementById('worksContainer');
if(worksContainer) {
    // Create a single tarot card stack for the works section
    const wrapper = document.createElement('div');
    wrapper.className = 'card-stack-wrapper reveal';
    wrapper.innerHTML = `
        <div class="card-stack-header">
            <span class="card-stack-num">04</span>
            <h3 class="card-stack-title">Selected Works</h3>
            <p class="card-stack-desc">A curated collection of projects. Click any card to view full size • Drag to dismiss.</p>
        </div>
        <div class="card-deck-scene" id="tarot-scene"></div>
    `;
    worksContainer.appendChild(wrapper);
    
    // Initialize tarot card stack
    const scene = document.getElementById('tarot-scene');
    if(scene) {
        new TarotCardStack(scene, tarotCardImages);
    }
    
    // Re-observe reveals
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}