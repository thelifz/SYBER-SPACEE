/**
 * SYBER SPACE — ADVANCED SURVEILLANCE SYSTEMS
 * ASUS ROG HIGH-PRECISION CYBERNETIC GSAP CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize GSAP & Plugins
    if (typeof gsap !== 'undefined') {
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }
        initRogAnimations();
    }

    // 2. Initialize Telemetry Engines
    initTelemetryClock();
    initBitrateMonitor();
    initReticleCursor();
    initAutoplayVideos();
});

/* ==========================================================================
   1. TELEMETRY CLOCK & BITRATE SIMULATOR
   ========================================================================== */
function initTelemetryClock() {
    const clockEl = document.getElementById('telemetry-clock');
    if (!clockEl) return;

    function update() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        const ms = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
        clockEl.textContent = `${h}:${m}:${s}.${ms}`;
        requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function initBitrateMonitor() {
    const bitrateEl = document.getElementById('stream-bitrate-val');
    const fpsEl = document.getElementById('telemetry-fps');
    if (!bitrateEl) return;

    setInterval(() => {
        const base = 8400;
        const variance = Math.floor(Math.random() * 320) - 160;
        bitrateEl.textContent = `${base + variance} KBPS`;

        if (fpsEl) {
            const fpsVar = (59.8 + Math.random() * 0.4).toFixed(1);
            fpsEl.textContent = fpsVar;
        }
    }, 1200);
}

/* ==========================================================================
   2. INTERACTIVE TACTICAL RETICLE CURSOR
   ========================================================================== */
function initReticleCursor() {
    const reticle = document.getElementById('hud-reticle');
    if (!reticle || window.matchMedia('(pointer: coarse)').matches) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    gsap.ticker.add(() => {
        gsap.to(reticle, {
            x: mouseX,
            y: mouseY,
            duration: 0.12,
            ease: 'power2.out',
            overwrite: 'auto'
        });
    });

    // Hover reactions on interactive elements
    const interactives = document.querySelectorAll('button, a, .zone-card, .matrix-card, .feed-btn');
    interactives.forEach(el => {
        el.addEventListener('mouseenter', () => {
            gsap.to(reticle, { scale: 1.4, duration: 0.2 });
            reticle.style.borderColor = '#00f0ff';
        });
        el.addEventListener('mouseleave', () => {
            gsap.to(reticle, { scale: 1, duration: 0.2 });
            reticle.style.borderColor = '#ff0037';
        });
    });
}

/* ==========================================================================
   3. MULTI-FEED VIDEO STREAM SWITCHER
   ========================================================================== */
function switchVideoFeed(index) {
    const vid1 = document.getElementById('stream-video-1');
    const vid2 = document.getElementById('stream-video-2');
    const btn1 = document.getElementById('btn-feed-1');
    const btn2 = document.getElementById('btn-feed-2');
    const channelLabel = document.getElementById('active-stream-channel');
    const monitorFrame = document.getElementById('monitor-frame');

    if (!vid1 || !vid2) return;

    // Tactical Glitch Flash on Switch
    if (typeof gsap !== 'undefined') {
        gsap.fromTo(monitorFrame, 
            { filter: 'brightness(2.2) contrast(1.5)' },
            { filter: 'brightness(1) contrast(1)', duration: 0.35, ease: 'power2.out' }
        );
    }

    if (index === 1) {
        vid2.classList.remove('active');
        vid2.pause();
        vid1.classList.add('active');
        vid1.play().catch(() => {});

        if (btn1) btn1.classList.add('active');
        if (btn2) btn2.classList.remove('active');
        if (channelLabel) channelLabel.textContent = 'CAM 01 // PARKING PERIMETER';
    } else {
        vid1.classList.remove('active');
        vid1.pause();
        vid2.classList.add('active');
        vid2.play().catch(() => {});

        if (btn2) btn2.classList.add('active');
        if (btn1) btn1.classList.remove('active');
        if (channelLabel) channelLabel.textContent = 'CAM 02 // LOGISTICS BAY';
    }
}
window.switchVideoFeed = switchVideoFeed;

function initAutoplayVideos() {
    const vid1 = document.getElementById('stream-video-1');
    if (vid1) {
        vid1.play().catch(e => {
            console.log('Autoplay deferred until user interaction');
        });
    }
}

/* ==========================================================================
   4. GSAP 3 & SCROLLTRIGGER ARCHITECTURE
   ========================================================================== */
function initRogAnimations() {
    // 1. Hero Monitor Entrance Timeline
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    heroTl.from('.rog-header', {
        y: -40,
        opacity: 0,
        duration: 0.8
    })
    .from('.hero-tactical-header', {
        opacity: 0,
        y: -10,
        duration: 0.5
    }, '-=0.4')
    .from('.rog-monitor-frame', {
        scale: 0.95,
        opacity: 0,
        duration: 1,
        ease: 'power2.out'
    }, '-=0.3')
    .from('.hero-impact-strip', {
        y: 30,
        opacity: 0,
        duration: 0.8
    }, '-=0.4');

    // 2. ScrollTrigger: Tactical Deployment Cards Stagger
    if (document.querySelector('.zones-grid')) {
        gsap.from('.zone-card', {
            scrollTrigger: {
                trigger: '.rog-zones-section',
                start: 'top 75%',
                toggleActions: 'play none none none'
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out'
        });
    }

    // 3. ScrollTrigger: Flagship Hardware Architecture & Callouts
    if (document.querySelector('#pinned-hardware')) {
        const hwTl = gsap.timeline({
            scrollTrigger: {
                trigger: '.rog-hardware-section',
                start: 'top 70%',
                toggleActions: 'play none none none'
            }
        });

        hwTl.from('.hardware-visual-core', {
            scale: 0.85,
            opacity: 0,
            duration: 0.9,
            ease: 'back.out(1.4)'
        })
        .from('.callout-tl', { x: -40, opacity: 0, duration: 0.5 }, '-=0.3')
        .from('.callout-tr', { x: 40, opacity: 0, duration: 0.5 }, '-=0.4')
        .from('.callout-bl', { x: -40, opacity: 0, duration: 0.5 }, '-=0.4')
        .from('.callout-br', { x: 40, opacity: 0, duration: 0.5 }, '-=0.4');
    }

    // 4. ScrollTrigger: Technical Specification Matrix
    if (document.querySelector('.matrix-grid')) {
        gsap.from('.matrix-card', {
            scrollTrigger: {
                trigger: '.rog-matrix-section',
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            y: 30,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out'
        });
    }

    // 5. ScrollTrigger: Procurement Action Card Reveal
    if (document.querySelector('.procurement-card')) {
        gsap.from('.procurement-card', {
            scrollTrigger: {
                trigger: '.rog-procurement-section',
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            scale: 0.96,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out'
        });
    }
}
