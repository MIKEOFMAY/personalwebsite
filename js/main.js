// ── CURSOR ────────────────────────────────────
const cur = document.getElementById('cur');
const curR = document.getElementById('cur-r');
let mx=0,my=0,rx=0,ry=0;

document.addEventListener('mousemove', e => {
  mx=e.clientX; my=e.clientY;
  cur.style.left=mx+'px'; cur.style.top=my+'px';
});

(function loop(){
  rx+=(mx-rx)*.1; ry+=(my-ry)*.1;
  curR.style.left=rx+'px'; curR.style.top=ry+'px';
  requestAnimationFrame(loop);
})();

document.querySelectorAll('a,button,.work-card,.hover-link').forEach(el=>{
  el.addEventListener('mouseenter',()=>document.body.classList.add('link-hover'));
  el.addEventListener('mouseleave',()=>document.body.classList.remove('link-hover'));
});

// ── PAGE TRANSITIONS ──────────────────────────
const veil = document.getElementById('page-veil');

// Reveal on load
window.addEventListener('DOMContentLoaded',()=>{
  veil.classList.add('reveal');
  setTimeout(()=>veil.classList.remove('reveal'),500);
});

// Cover on nav click
document.querySelectorAll('a[data-nav]').forEach(link=>{
  link.addEventListener('click', e=>{
    e.preventDefault();
    const href = link.getAttribute('href');
    veil.classList.add('cover');
    setTimeout(()=>{ window.location.href=href; },450);
  });
});

// ── SCROLL REVEAL ─────────────────────────────
const obs = new IntersectionObserver(entries=>{
  entries.forEach((e,i)=>{
    if(e.isIntersecting) setTimeout(()=>e.target.classList.add('in'), i*70);
  });
},{threshold:0.08});
document.querySelectorAll('.sr').forEach(el=>obs.observe(el));
