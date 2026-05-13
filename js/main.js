// js/main.js

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
// SPRING PHYSICS ENGINE
// ==============================
class SpringValue {
    constructor(value = 0, friction = 20, tension = 170) {
        this.value = value; this.target = value; this.velocity = 0;
        this.friction = friction; this.tension = tension; this.active = false; this.listeners = [];
    }
    set(target) { this.target = target; this.active = true; }
    onChange(fn) { this.listeners.push(fn); return this; }
    update() {
        if (!this.active) return false;
        const diff = this.target - this.value;
        const springForce = diff * this.tension * 0.001;
        const dampingForce = -this.velocity * this.friction * 0.1;
        this.velocity += springForce + dampingForce;
        this.value += this.velocity;
        if (Math.abs(diff) < 0.01 && Math.abs(this.velocity) < 0.01) {
            this.value = this.target; this.velocity = 0; this.active = false;
        }
        this.listeners.forEach(fn => fn(this.value));
        return this.active;
    }
}

// ==============================
// CARD DECK CLASS
// ==============================
class CardDeck {
    constructor(sceneEl, cardsData) {
        this.sceneEl = sceneEl; this.cardsData = cardsData;
        this.gone = new Set(); this.springs = []; this.currentTopIndex = 0;
        this.isDragging = false; this.dragStartX = 0; this.dragStartY = 0;
        this.dragMoveX = 0; this.dragMoveY = 0; this.lastTime = 0; this.lastX = 0;
        this.velocityX = 0; this.rafId = null; this.resetTimeout = null;
        this.width = sceneEl.offsetWidth || 380; this.init();
    }

    init() {
        this.springs = this.cardsData.map((_, i) => ({
            x: new SpringValue(0, 20, 200), y: new SpringValue(i * -4, 20, 200),
            rot: new SpringValue(this.randomRot(i), 20, 200),
            scale: new SpringValue(1, 20, 200), opacity: new SpringValue(1, 15, 150),
        }));
        this.cardsData.forEach((_, i) => {
            this.springs[i].y.set(i * -4); this.springs[i].scale.set(1);
            this.springs[i].rot.set(this.randomRot(i));
            this.springs[i].scale.value = 1.5; this.springs[i].scale.target = 1;
            this.springs[i].scale.active = true;
            this.springs[i].y.value = -800 + (i * -20);
            this.springs[i].y.target = i * -4; this.springs[i].y.active = true;
            this.springs[i].friction = 30; this.springs[i].tension = 300;
            this.springs[i].scale.friction = 30; this.springs[i].scale.tension = 300;
        });
        this.createDOM(); this.setupDrag(); this.setupNav(); this.startLoop();
    }

    randomRot(i) { return -10 + Math.random() * 20; }

    createDOM() {
        this.springs.forEach((sp, i) => {
            const el = document.createElement('div');
            el.className = 'card-spring'; el.dataset.index = i;
            el.style.zIndex = this.cardsData.length - i;
            const card = this.cardsData[i];
            el.innerHTML = `
                <div class="card-inner">
                    <img src="${card.img}" alt="${card.label}" loading="lazy" />
                    <span class="card-label">${card.label}</span>
                    ${i === 0 ? '<span class="card-hint">Drag or swipe →</span>' : ''}
                </div>
            `;
            this.sceneEl.appendChild(el); sp.el = el;
        });
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'card-dots';
        this.cardsData.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.className = 'card-dot' + (i === 0 ? ' active' : '');
            dot.dataset.idx = i; dotsContainer.appendChild(dot);
        });
        this.sceneEl.parentElement.appendChild(dotsContainer);
        this.dotsContainer = dotsContainer;

        const navContainer = document.createElement('div');
        navContainer.className = 'card-deck-nav';
        navContainer.innerHTML = `
            <button class="card-deck-btn prev-btn" aria-label="Previous">
                <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button class="card-deck-btn next-btn" aria-label="Next">
                <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
            </button>
        `;
        this.sceneEl.parentElement.appendChild(navContainer);
        this.prevBtn = navContainer.querySelector('.prev-btn');
        this.nextBtn = navContainer.querySelector('.next-btn');
    }

    setupDrag() {
        this.cardsData.forEach((_, i) => {
            const sp = this.springs[i];
            sp.el.addEventListener('touchstart', (e) => {
                if (this.currentTopIndex !== i || this.gone.has(i)) return;
                this.isDragging = true;
                this.dragStartX = e.touches[0].clientX;
                this.dragStartY = e.touches[0].clientY;
                this.lastX = this.dragStartX; this.lastTime = Date.now();
                this.velocityX = 0;
                sp.el.querySelector('.card-inner').style.cursor = 'grabbing';
                sp.scale.set(1.1);
            }, { passive: true });
            sp.el.addEventListener('touchmove', (e) => {
                if (!this.isDragging) return;
                const cx = e.touches[0].clientX, cy = e.touches[0].clientY;
                const now = Date.now(), dt = now - this.lastTime;
                if (dt > 0) this.velocityX = (cx - this.lastX) / dt * 16;
                this.lastX = cx; this.lastTime = now;
                this.dragMoveX = cx - this.dragStartX; this.dragMoveY = cy - this.dragStartY;
                const rot = this.dragMoveX / 10;
                sp.x.value = this.dragMoveX; sp.rot.value = rot;
            }, { passive: true });
            sp.el.addEventListener('touchend', () => {
                if (!this.isDragging) return;
                this.isDragging = false;
                sp.el.querySelector('.card-inner').style.cursor = 'grab';
                this.onDragEnd(i);
            });
            sp.el.addEventListener('mousedown', (e) => {
                if (this.currentTopIndex !== i || this.gone.has(i)) return;
                this.isDragging = true;
                this.dragStartX = e.clientX; this.dragStartY = e.clientY;
                this.lastX = this.dragStartX; this.lastTime = Date.now();
                this.velocityX = 0;
                sp.el.querySelector('.card-inner').style.cursor = 'grabbing';
                sp.scale.set(1.1); e.preventDefault();
            });
        });
        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const i = this.currentTopIndex, sp = this.springs[i];
            const cx = e.clientX, cy = e.clientY, now = Date.now(), dt = now - this.lastTime;
            if (dt > 0) this.velocityX = (cx - this.lastX) / dt * 16;
            this.lastX = cx; this.lastTime = now;
            this.dragMoveX = cx - this.dragStartX; this.dragMoveY = cy - this.dragStartY;
            const rot = this.dragMoveX / 10;
            sp.x.value = this.dragMoveX; sp.rot.value = rot;
        });
        document.addEventListener('mouseup', () => {
            if (!this.isDragging) return;
            this.isDragging = false;
            const sp = this.springs[this.currentTopIndex];
            if(sp?.el?.querySelector('.card-inner')) {
                sp.el.querySelector('.card-inner').style.cursor = 'grab';
            }
            this.onDragEnd(this.currentTopIndex);
        });
    }

    onDragEnd(i) {
        const sp = this.springs[i];
        const trigger = Math.abs(this.velocityX) > 12;
        const dir = this.dragMoveX < 0 ? -1 : 1;
        if (trigger) {
            this.gone.add(i);
            const flyX = dir * (200 + this.width);
            sp.x.set(flyX); sp.rot.set(dir * 20); sp.scale.set(0.8);
            sp.x.friction = 30; sp.x.tension = 200; sp.rot.friction = 30; sp.rot.tension = 200;
            this.currentTopIndex = this.getNextActiveIndex();
            this.updateDots();
            if (this.gone.size === this.cardsData.length) {
                clearTimeout(this.resetTimeout);
                this.resetTimeout = setTimeout(() => {
                    this.gone.clear(); this.currentTopIndex = 0; this.resetAll();
                }, 600);
            }
        } else {
            sp.x.set(0); sp.rot.set(this.randomRot(i)); sp.scale.set(1);
            sp.x.friction = 20; sp.x.tension = 500;
        }
        this.dragMoveX = 0; this.dragMoveY = 0;
    }

    getNextActiveIndex() {
        for (let i = 0; i < this.cardsData.length; i++) {
            if (!this.gone.has(i)) return i;
        }
        return 0;
    }

    updateDots() {
        if (!this.dotsContainer) return;
        this.dotsContainer.querySelectorAll('.card-dot').forEach((dot, idx) => {
            const isGone = this.gone.has(idx);
            dot.classList.toggle('active', idx === this.currentTopIndex && !isGone);
            dot.classList.toggle('invisible', isGone);
        });
    }

    setupNav() {
        this.prevBtn?.addEventListener('click', () => this.navPrev());
        this.nextBtn?.addEventListener('click', () => this.navNext());
        if (this.dotsContainer) {
            this.dotsContainer.querySelectorAll('.card-dot').forEach(dot => {
                dot.addEventListener('click', () => {
                    const idx = parseInt(dot.dataset.idx);
                    if (!this.gone.has(idx)) { /* optional: jump to card */ }
                });
            });
        }
    }

    navNext() {
        const i = this.currentTopIndex;
        if (this.gone.has(i)) return;
        this.gone.add(i); const sp = this.springs[i];
        sp.x.set(200 + this.width); sp.rot.set(25); sp.scale.set(0.8);
        sp.x.friction = 30; sp.x.tension = 200;
        this.currentTopIndex = this.getNextActiveIndex();
        this.updateDots();
        if (this.gone.size === this.cardsData.length) {
            clearTimeout(this.resetTimeout);
            this.resetTimeout = setTimeout(() => {
                this.gone.clear(); this.currentTopIndex = 0; this.resetAll();
            }, 600);
        }
    }

    navPrev() {
        const goneIndices = Array.from(this.gone).sort((a, b) => b - a);
        if (goneIndices.length === 0) return;
        const lastGone = goneIndices[0];
        this.gone.delete(lastGone); const sp = this.springs[lastGone];
        sp.x.set(0); sp.rot.set(this.randomRot(lastGone)); sp.scale.set(1);
        sp.y.set(lastGone * -4); sp.x.friction = 20; sp.x.tension = 500;
        this.currentTopIndex = lastGone; this.updateDots();
    }

    resetAll() {
        this.cardsData.forEach((_, i) => {
            const sp = this.springs[i];
            sp.x.set(0); sp.y.set(i * -4); sp.rot.set(this.randomRot(i));
            sp.scale.set(1); sp.opacity.set(1);
            sp.x.friction = 20; sp.x.tension = 500; sp.y.friction = 20; sp.y.tension = 500;
        });
        this.updateDots();
    }

    startLoop() {
        const loop = () => {
            let anyActive = false;
            this.springs.forEach(sp => {
                if (sp.x.update()) anyActive = true;
                if (sp.y.update()) anyActive = true;
                if (sp.rot.update()) anyActive = true;
                if (sp.scale.update()) anyActive = true;
                if (sp.opacity.update()) anyActive = true;
                if (sp.el) {
                    const x = sp.x.value, y = sp.y.value, rot = sp.rot.value;
                    const scale = sp.scale.value, opacity = sp.opacity.value;
                    const isGone = this.gone.has(parseInt(sp.el.dataset.index));
                    sp.el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg) scale(${scale})`;
                    sp.el.style.opacity = isGone ? 0 : opacity;
                    sp.el.style.zIndex = this.cardsData.length - parseInt(sp.el.dataset.index);
                    sp.el.style.pointerEvents = (parseInt(sp.el.dataset.index) === this.currentTopIndex && !isGone) ? 'auto' : 'none';
                }
            });
            this.rafId = requestAnimationFrame(loop);
        };
        loop();
    }
}

// ==============================
// PROJECT DATA (update paths to local images)
// ==============================
const projectData = [
    {
        num: '01', name: 'GOATGOAT — Cosmetics Brand',
        desc: 'Complete brand identity, packaging design, and digital presence for a homemade cosmetics line. AI-assisted visual prototyping using Stable Diffusion.',
        tags: ['Brand Identity', 'Packaging', 'AI Imaging', 'E-commerce'],
        cards: [
            { img: 'images/project1-1.jpg', label: 'Product Packaging' },
            { img: 'images/project1-2.jpg', label: 'Brand Visuals' },
            { img: 'images/project1-3.jpg', label: 'Social Media' },
            { img: 'images/project1-4.jpg', label: 'AI Prototypes' },
            { img: 'images/project1-5.jpg', label: 'Digital Presence' }
        ]
    },
    {
        num: '02', name: 'Monk and Co — Menswear Brand',
        desc: 'Creative direction for a casual menswear brand. Visual identity, campaign design, product line aesthetics, and digital content strategy.',
        tags: ['Creative Direction', 'Fashion', 'Campaign Design', 'Brand Strategy'],
        cards: [
            { img: 'images/project2-1.jpg', label: 'Brand Identity' },
            { img: 'images/project2-2.jpg', label: 'Campaign Design' },
            { img: 'images/project2-3.jpg', label: 'Product Line' },
            { img: 'images/project2-4.jpg', label: 'Digital Content' },
            { img: 'images/project2-5.jpg', label: 'Visual Identity' }
        ]
    },
    {
        num: '03', name: "May's Organic — Organic Cosmetics",
        desc: 'Full brand identity development including logo, packaging, tone of voice, product photography, and marketing collateral.',
        tags: ['Logo Design', 'Packaging', 'Photography', 'Tone of Voice'],
        cards: [
            { img: 'images/project3-1.jpg', label: 'Logo & Identity' },
            { img: 'images/project3-2.jpg', label: 'Product Range' },
            { img: 'images/project3-3.jpg', label: 'Photography' },
            { img: 'images/project3-4.jpg', label: 'Packaging Design' }
        ]
    },
    {
        num: '04', name: "Twin's Thesis — Clothing Label",
        desc: 'Independent fashion label: clothing range design, brand identity, production coordination, and visual merchandising.',
        tags: ['Fashion Design', 'Brand Identity', 'Merchandising', 'Production'],
        cards: [
            { img: 'images/project4-1.jpg', label: 'Clothing Range' },
            { img: 'images/project4-2.jpg', label: 'Brand Identity' },
            { img: 'images/project4-3.jpg', label: 'Visual Merchandising' },
            { img: 'images/project4-4.jpg', label: 'Production' }
        ]
    },
    {
        num: '05', name: 'Mazuma Bot — Forex Trading UI',
        desc: 'UI design and brand presentation for an automated forex trading platform. Collaborative design-development workflow.',
        tags: ['UI Design', 'FinTech', 'Brand Presentation', 'UX'],
        cards: [
            { img: 'images/project5-1.jpg', label: 'Dashboard UI' },
            { img: 'images/project5-2.jpg', label: 'Data Visualization' },
            { img: 'images/project5-3.jpg', label: 'Analytics' },
            { img: 'images/project5-4.jpg', label: 'Platform Design' }
        ]
    },
    {
        num: '06', name: 'Rukita.co — Interior Design',
        desc: 'Interior design solutions for residential and co-living properties across Jakarta. Project coordination and spatial planning.',
        tags: ['Interior Design', 'Spatial Planning', '3D Rendering', 'Project Management'],
        cards: [
            { img: 'images/project6-1.jpg', label: 'Living Space' },
            { img: 'images/project6-2.jpg', label: 'Co-living Design' },
            { img: 'images/project6-3.jpg', label: 'Residential' },
            { img: 'images/project6-4.jpg', label: '3D Render' },
            { img: 'images/project6-5.jpg', label: 'Material Specs' }
        ]
    }
];

// ==============================
// BUILD WORKS SECTION
// ==============================
const worksContainer = document.getElementById('worksContainer');
if(worksContainer) {
    projectData.forEach((proj, projIdx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'card-stack-wrapper reveal' + (projIdx % 2 === 1 ? ' reveal-d1' : '');
        wrapper.innerHTML = `
            <div class="card-stack-header">
                <span class="card-stack-num">${proj.num}</span>
                <h3 class="card-stack-title">${proj.name}</h3>
                <p class="card-stack-desc">${proj.desc}</p>
                <div class="work-tags">
                    ${proj.tags.map(t => `<span class="work-tag">${t}</span>`).join('')}
                </div>
            </div>
            <div class="card-deck-scene" id="scene-${projIdx}"></div>
        `;
        worksContainer.appendChild(wrapper);
    });
    document.querySelectorAll('.card-deck-scene').forEach(scene => {
        const idx = parseInt(scene.id.replace('scene-', ''));
        new CardDeck(scene, projectData[idx].cards);
    });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}