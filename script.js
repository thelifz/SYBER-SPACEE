/**
 * SYBER SPACE // AUTHORIZED WHOLESALE SURVEILLANCE
 * GSAP 3 CYBERNETIC MOTION CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize GSAP & Plugins
    if (typeof gsap !== 'undefined') {
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }
        initGsapMotion();
    }

    // 2. Initialize Telemetry Engines
    initHudClock();
    initReticleCursor();
    initVideoAutoplay();
    initMarqueeScrollBoost();
});

/* ==========================================================================
   1. REAL-TIME HUD CLOCK (Exact match to screenshot 2: 12:18:08:44)
   ========================================================================== */
function initHudClock() {
    const clockEl = document.getElementById('hud-clock');
    if (!clockEl) return;

    function renderTime() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        const cs = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
        clockEl.textContent = `${h}:${m}:${s}:${cs}`;
        requestAnimationFrame(renderTime);
    }
    requestAnimationFrame(renderTime);
}

/* ==========================================================================
   2. INTERACTIVE TACTICAL RETICLE CURSOR
   ========================================================================== */
function initReticleCursor() {
    const reticle = document.getElementById('hud-reticle');
    if (!reticle || window.matchMedia('(pointer: coarse)').matches) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;
    let isHovering = false;

    window.addEventListener('mousemove', (e) => {
        document.body.classList.add('cursor-active');
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Check hover states on interactive elements
    const interactiveElements = document.querySelectorAll('a, button, .deploy-card, .tier-box, .btn-observe-box');
    interactiveElements.forEach((el) => {
        el.addEventListener('mouseenter', () => {
            isHovering = true;
            reticle.style.width = '52px';
            reticle.style.height = '52px';
            const ring = reticle.querySelector('.reticle-ring');
            if (ring) {
                ring.style.borderColor = 'rgba(0, 255, 102, 0.9)';
                ring.style.borderStyle = 'solid';
            }
        });
        el.addEventListener('mouseleave', () => {
            isHovering = false;
            reticle.style.width = '36px';
            reticle.style.height = '36px';
            const ring = reticle.querySelector('.reticle-ring');
            if (ring) {
                ring.style.borderColor = 'rgba(0, 255, 102, 0.45)';
                ring.style.borderStyle = 'dashed';
            }
        });
    });

    // Smooth animation loop
    function updateReticle() {
        const ease = 0.28;
        currentX += (mouseX - currentX) * ease;
        currentY += (mouseY - currentY) * ease;
        reticle.style.transform = `translate(${currentX}px, ${currentY}px)`;
        requestAnimationFrame(updateReticle);
    }
    requestAnimationFrame(updateReticle);
}

/* ==========================================================================
   3. GSAP 3 ANIMATIONS & SCROLLTRIGGERS
   ========================================================================== */
function initGsapMotion() {
    // Hero Entrance Timeline
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    heroTl.from('.cctv-monitor-window', {
        duration: 1.2,
        scale: 0.96,
        opacity: 0,
        y: 25
    });

    heroTl.from('.cctv-telemetry-top', {
        duration: 0.7,
        opacity: 0,
        y: -15
    }, '-=0.6');

    heroTl.from('.observe-title.glitch-effect', {
        duration: 0.9,
        opacity: 0,
        y: 35,
        skewX: -4
    }, '-=0.5');

    heroTl.from('.observe-kicker-sub', {
        duration: 0.7,
        opacity: 0,
        y: 15
    }, '-=0.4');

    heroTl.from('.btn-observe-box', {
        duration: 0.6,
        opacity: 0,
        scale: 0.9
    }, '-=0.3');

    // Hero Glitch Jitter Effect
    const glitchTitle = document.querySelector('.observe-title.glitch-effect');
    if (glitchTitle) {
        setInterval(() => {
            if (Math.random() > 0.65) {
                gsap.to(glitchTitle, {
                    x: (Math.random() - 0.5) * 6,
                    skewX: (Math.random() - 0.5) * 4,
                    duration: 0.08,
                    yoyo: true,
                    repeat: 1,
                    ease: 'rough'
                });
            }
        }, 3200);
    }

    // ScrollTrigger: Mission Deployments Section
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.from('.deployments-top-bar', {
            scrollTrigger: {
                trigger: '.observe-deployments-section',
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            duration: 0.9,
            opacity: 0,
            y: 40,
            ease: 'power3.out'
        });

        // Stagger Cards Reveal
        gsap.from('.deploy-card', {
            scrollTrigger: {
                trigger: '.deployments-cards-grid',
                start: 'top 82%',
                toggleActions: 'play none none none'
            },
            duration: 0.8,
            opacity: 0,
            y: 50,
            stagger: 0.18,
            ease: 'power3.out'
        });

        // ScrollTrigger: Wholesale Tiers
        gsap.from('.wholesale-intro-header', {
            scrollTrigger: {
                trigger: '.observe-wholesale-section',
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            duration: 0.8,
            opacity: 0,
            y: 30,
            ease: 'power3.out'
        });

        gsap.from('.tier-box', {
            scrollTrigger: {
                trigger: '.wholesale-cards-row',
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            duration: 0.8,
            opacity: 0,
            y: 45,
            stagger: 0.15,
            ease: 'power3.out'
        });

        // ScrollTrigger: Procurement Hotline
        gsap.from('.procurement-box', {
            scrollTrigger: {
                trigger: '.observe-contact-section',
                start: 'top 82%',
                toggleActions: 'play none none none'
            },
            duration: 0.9,
            opacity: 0,
            scale: 0.96,
            ease: 'power3.out'
        });
    }
}

/* ==========================================================================
   4. MARQUEE SCROLL VELOCITY BOOST
   ========================================================================== */
function initMarqueeScrollBoost() {
    const track = document.querySelector('.ribbon-marquee-track');
    if (!track) return;

    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;

    window.addEventListener('scroll', () => {
        const delta = Math.abs(window.scrollY - lastScrollY);
        scrollVelocity = Math.min(delta * 0.15, 2.5);
        lastScrollY = window.scrollY;

        track.style.animationDuration = `${Math.max(12, 32 - scrollVelocity * 8)}s`;

        clearTimeout(track._timeout);
        track._timeout = setTimeout(() => {
            track.style.animationDuration = '32s';
        }, 150);
    }, { passive: true });
}

/* ==========================================================================
   5. VIDEO AUTOPLAY FALLBACK & SMOOTH PLAY
   ========================================================================== */
function initVideoAutoplay() {
    const video = document.getElementById('cctv-video-stream');
    if (!video) return;

    video.muted = true;
    video.playsInline = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
        playPromise.catch(() => {
            // If autoplay is blocked by browser policy, play on first user interaction
            const resumePlay = () => {
                video.play();
                window.removeEventListener('click', resumePlay);
                window.removeEventListener('scroll', resumePlay);
                window.removeEventListener('touchstart', resumePlay);
            };
            window.addEventListener('click', resumePlay);
            window.addEventListener('scroll', resumePlay);
            window.addEventListener('touchstart', resumePlay);
        });
    }
}
