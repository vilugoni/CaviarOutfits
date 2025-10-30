/* ==============================================================
   SCROLL SLIDERS (marcas / polaroid)
   ============================================================== */
function scrollSlider(id, distance) {
    const el = document.getElementById(id);
    if (el) el.scrollBy({ left: distance, behavior: 'smooth' });
}

/* ==============================================================
   NAVEGACIÓN SMOOTH + CIERRE MENÚ
   ============================================================== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const h = a.getAttribute('href');
        if (h.startsWith('#') && h !== '#') {
            e.preventDefault();
            document.querySelector(h).scrollIntoView({ behavior: 'smooth' });
            const c = document.getElementById('navbarMenu');
            if (c && bootstrap.Collapse.getInstance(c)) {
                bootstrap.Collapse.getInstance(c).hide();
            }
        }
    });
});

/* ==============================================================
   DRAG-TO-SCROLL EN POLAROID (opcional, mantiene el comportamiento)
   ============================================================== */
const polaroid = document.getElementById('polaroid-slider');
if (polaroid) {
    let down = false, startX, scrollLeft;
    polaroid.addEventListener('mousedown', e => {
        down = true;
        polaroid.style.cursor = 'grabbing';
        startX = e.pageX - polaroid.offsetLeft;
        scrollLeft = polaroid.scrollLeft;
    });
    polaroid.addEventListener('mouseleave', () => { down = false; polaroid.style.cursor = 'grab'; });
    polaroid.addEventListener('mouseup', () => { down = false; polaroid.style.cursor = 'grab'; });
    polaroid.addEventListener('mousemove', e => {
        if (!down) return;
        e.preventDefault();
        const walk = (e.pageX - polaroid.offsetLeft - startX) * 2;
        polaroid.scrollLeft = scrollLeft - walk;
    });
}

/* ==============================================================
   MODO OSCURO
   ============================================================== */
const darkToggle = document.querySelector('#darkModeToggle a');
if (darkToggle) {
    darkToggle.addEventListener('click', e => {
        e.preventDefault();
        document.body.classList.toggle('dark-mode');
        const i = darkToggle.querySelector('i');
        i.classList.toggle('bi-moon-stars-fill');
        i.classList.toggle('bi-sun-fill');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        darkToggle.querySelector('i').classList.replace('bi-moon-stars-fill', 'bi-sun-fill');
    }
}

/* ==============================================================
   JUEGO: CATCH THE SWAG – RESTAURADO COMO ANTES
   ============================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const container   = document.getElementById('gameContainer');
    const inner       = document.getElementById('gameInner');
    const basket      = document.getElementById('basket');
    const pauseBtn    = document.getElementById('pauseButton');
    const specialDisp = document.getElementById('specialPhotoDisplay');
    const specialImg  = document.getElementById('specialPhotoImg');
    const prize       = document.getElementById('prizeNotification');
    const pausedOv    = document.getElementById('gamePausedOverlay');

    // ---- IMÁGENES DE PRENDAS ----
    const IMAGES = [
        'capt_web/fotojuego1.png',
        'capt_web/fotojuego2.png',
        'capt_web/fotojuego3.png',
        'capt_web/fotojuego4.png'
    ];
    const imgs = IMAGES.map(src => { const i = new Image(); i.src = src; return i; });

    // ---- ESTADO DEL JUEGO ----
    let active = false, items = [], paused = false, special = '', caught = 0, interval = null;
    const NEED = 5;                                   // veces que hay que atrapar la foto especial
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ease = reduced ? 'none' : 'power1.out';

    // ---- ACCESIBILIDAD ----
    function announce(msg) {
        const el = document.createElement('div');
        el.setAttribute('aria-live', 'assertive');
        el.setAttribute('aria-atomic', 'true');
        el.className = 'sr-only';
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }

    // ---- INICIO ----
    function start() {
        caught = 0;
        special = IMAGES[Math.floor(Math.random() * IMAGES.length)];
        specialImg.src = special;
        specialImg.alt = 'Foto especial a atrapar';
        specialDisp.classList.remove('d-none');
        announce('Foto especial mostrada. Atrápala 5 veces para ganar.');

        setTimeout(() => {
            specialDisp.classList.add('d-none');
            active = true;
            paused = false;
            pauseBtn.style.display = 'block';
            pausedOv.style.display = 'none';
            pauseBtn.textContent = 'PAUSA';
            announce('Juego iniciado. Mueve la cesta para atrapar las fotos.');

            if (interval) clearInterval(interval);
            interval = setInterval(() => { if (active && !paused) spawn(); }, 1500);
        }, 3000);
    }

    // ---- SPAWN DE PRENDA ----
    function spawn() {
        if (!active || paused) return;

        const img = imgs[Math.floor(Math.random() * imgs.length)];
        const el = document.createElement('img');
        el.src = img.src;
        el.className = 'falling-item';
        el.alt = 'Prenda cayendo';
        el.style.left = Math.random() * (container.offsetWidth - 120) + 60 + 'px';
        el.style.top = '-120px';
        inner.appendChild(el);

        const isSpecial = el.src.includes(special.split('/').pop());
        const dur = 4 + Math.random() * 2;
        const rot = Math.random() * 180 - 90;

        gsap.to(el, {
            y: container.offsetHeight + 120,
            rotation: rot,
            ease,
            duration: dur,
            onComplete: () => el.remove()
        });

        items.push({ el, isSpecial });
    }

    // ---- MOVIMIENTO DE LA CESTA (mouse + touch) ----
    const moveBasket = e => {
        if (!active || paused) return;
        const rect = container.getBoundingClientRect();
        const clientX = e.clientX ?? e.touches[0].clientX;
        const x = clientX - rect.left;
        const w = basket.offsetWidth;
        let target = x - w / 2;
        target = Math.max(0, Math.min(target, container.offsetWidth - w));
        basket.style.left = target + 'px';
    };

    container.addEventListener('mousemove', moveBasket);
    container.addEventListener('touchmove', e => {
        e.preventDefault();               // <-- crucial para iOS
        moveBasket(e);
    }, { passive: false });

    // ---- PAUSA (botón) ----
    pauseBtn.addEventListener('click', () => {
        if (!active) return;
        paused = !paused;
        pauseBtn.textContent = paused ? 'REANUDAR' : 'PAUSA';
        pausedOv.style.display = paused ? 'flex' : 'none';
        announce(paused ? 'Juego pausado.' : 'Juego reanudado.');
    });

    // ---- PAUSA (doble-clic) ----
    container.addEventListener('dblclick', e => {
        e.preventDefault();
        if (!active) return;
        paused = !paused;
        pauseBtn.textContent = paused ? 'REANUDAR' : 'PAUSA';
        pausedOv.style.display = paused ? 'flex' : 'none';
        announce(paused ? 'Juego pausado por doble clic.' : 'Juego reanudado por doble clic.');
    });

    // ---- COLISIÓN ----
    gsap.ticker.add(() => {
        if (!active || paused) return;
        items = items.filter(i => {
            if (collide(i.el)) {
                if (i.isSpecial) {
                    caught++;
                    gsap.to(i.el, { scale: 1.8, opacity: 0, duration: 0.4, ease: 'back.in', onComplete: () => i.el.remove() });
                    announce(`¡Foto especial atrapada! Quedan ${NEED - caught}.`);
                    if (caught >= NEED) setTimeout(win, 500);
                } else {
                    gsap.to(i.el, { scale: 1.5, opacity: 0, duration: 0.3, ease: 'back.in', onComplete: () => i.el.remove() });
                }
                return false;
            }
            return true;
        });
    });

    function collide(el) {
        const a = el.getBoundingClientRect();
        const b = basket.getBoundingClientRect();
        return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
    }

    // ---- GANAR ----
    function win() {
        active = false;
        paused = true;
        clearInterval(interval);
        interval = null;
        pauseBtn.style.display = 'none';
        pausedOv.style.display = 'none';
        prize.classList.remove('d-none');
        announce('¡Premio desbloqueado! Has atrapado la Polaroid especial 5 veces.');

        setTimeout(() => {
            prize.classList.add('d-none');
            items.forEach(i => i.el.remove());
            items = [];
            start();
        }, 4000);
    }

    // ---- ARRANQUE ----
    start();
});

/* ==============================================================
   TICKER INFINITO (GSAP)
   ============================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.querySelector('.ticker-wrapper');
    const content = document.querySelector('.ticker-content');
    if (!wrapper || !content) return;

    const clone = content.cloneNode(true);
    wrapper.appendChild(clone);
    const width = content.offsetWidth;

    gsap.set(wrapper, { x: 0 });
    gsap.timeline({ repeat: -1 })
        .to(wrapper, { x: -width, duration: 15, ease: 'none' })
        .to(wrapper, { x: 0, duration: 0 });
});

/* ==============================================================
   FORMULARIOS (novalidate)
   ============================================================== */
document.querySelectorAll('form[novalidate]').forEach(f => {
    f.addEventListener('submit', e => {
        e.preventDefault();
        let valid = true;
        f.querySelectorAll('[required]').forEach(i => {
            if (!i.value.trim() || (i.type === 'email' && !i.validity.valid)) {
                i.classList.add('is-invalid');
                valid = false;
            } else {
                i.classList.remove('is-invalid');
            }
        });
        if (valid) {
            alert('¡Enviado con éxito!');
            f.reset();
        }
    });
});