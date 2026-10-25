/**
 * SYBER SPACE // AUTHORIZED WHOLESALE SURVEILLANCE
 * GSAP 3 MOTION CONTROLLER & CCTV MULTI-FEED SLIDESHOW
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize GSAP & Plugins
    if (typeof gsap !== 'undefined') {
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }
        initGsapMotion();
    }

    // 2. Initialize Core Systems
    initHudClock();
    initCctvSlideshow();
    initMarqueeScrollBoost();
});

/* ==========================================================================
   1. REAL-TIME HUD CLOCK (20:22:06:66)
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
   2. HIGH-DEFINITION CCTV MULTI-FEED SLIDESHOW CONTROLLER
   ========================================================================== */
function initCctvSlideshow() {
    const slides = document.querySelectorAll('.cctv-slide');
    const tabs = document.querySelectorAll('.cam-tab-btn');
    const prevBtn = document.getElementById('cctv-prev-btn');
    const nextBtn = document.getElementById('cctv-next-btn');
    const titleEl = document.getElementById('active-cam-title');
    const specsEl = document.getElementById('active-cam-specs');
    const progressBar = document.getElementById('slide-progress');
    const monitor = document.querySelector('.cctv-monitor-window');

    if (!slides.length) return;

    let currentIndex = 0;
    const totalSlides = slides.length;
    const SLIDE_DURATION = 5500; // 5.5 seconds per feed
    let slideTimer = null;
    let progressStartTime = 0;
    let isPaused = false;
    let animFrame = null;

    function goToSlide(newIndex) {
        if (newIndex === currentIndex && slides[currentIndex].classList.contains('active')) {
            return;
        }

        // Pause previous video if it exists
        const prevVideo = slides[currentIndex].querySelector('video');
        if (prevVideo) {
            prevVideo.pause();
        }

        // Deactivate current slide & tab
        slides[currentIndex].classList.remove('active');
        if (tabs[currentIndex]) {
            tabs[currentIndex].classList.remove('active');
        }

        // Update index (wraps around)
        currentIndex = (newIndex + totalSlides) % totalSlides;

        const nextSlide = slides[currentIndex];
        nextSlide.classList.add('active');

        if (tabs[currentIndex]) {
            tabs[currentIndex].classList.add('active');
        }

        // Play active video if it exists
        const nextVideo = nextSlide.querySelector('video');
        if (nextVideo) {
            nextVideo.currentTime = 0;
            const playPromise = nextVideo.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Browser policy fallback
                });
            }
        }

        // Update Top Telemetry Bar smoothly
        const camTitle = nextSlide.getAttribute('data-cam');
        const camSpecs = nextSlide.getAttribute('data-specs');

        if (titleEl && camTitle) {
            titleEl.textContent = camTitle;
        }
        if (specsEl && camSpecs) {
            specsEl.innerHTML = camSpecs;
        }

        resetProgress();
    }

    function nextSlide() {
        goToSlide(currentIndex + 1);
    }

    function prevSlide() {
        goToSlide(currentIndex - 1);
    }

    // Progress Bar Animation Loop
    function updateProgress(now) {
        if (!isPaused && progressStartTime > 0) {
            const elapsed = now - progressStartTime;
            const progress = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }

            if (elapsed >= SLIDE_DURATION) {
                nextSlide();
                return;
            }
        }
        animFrame = requestAnimationFrame(updateProgress);
    }

    function resetProgress() {
        progressStartTime = performance.now();
        if (progressBar) {
            progressBar.style.width = '0%';
        }
    }

    // Event Listeners
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const idx = parseInt(tab.getAttribute('data-index'), 10);
            goToSlide(idx);
        });
    });

    // Pause on Hover
    if (monitor) {
        monitor.addEventListener('mouseenter', () => {
            isPaused = true;
        });
        monitor.addEventListener('mouseleave', () => {
            isPaused = false;
            progressStartTime = performance.now();
        });
    }

    // Keyboard Navigation
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
    });

    // Touch Swipe Navigation for Mobile
    let touchStartX = 0;
    if (monitor) {
        monitor.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        monitor.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            if (touchStartX - touchEndX > 50) nextSlide();
            if (touchEndX - touchStartX > 50) prevSlide();
        }, { passive: true });
    }

    // Start slideshow
    resetProgress();
    animFrame = requestAnimationFrame(updateProgress);
}

/* ==========================================================================
   3. GSAP 3 ANIMATIONS & SCROLLTRIGGERS
   ========================================================================== */
function initGsapMotion() {
    // Hero Entrance Timeline
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    heroTl.from('.cctv-monitor-window', {
        duration: 1.1,
        scale: 0.97,
        opacity: 0,
        y: 20
    });

    heroTl.from('.cctv-telemetry-top', {
        duration: 0.6,
        opacity: 0,
        y: -15
    }, '-=0.6');

    heroTl.from('.observe-title.glitch-effect', {
        duration: 0.9,
        opacity: 0,
        y: 30,
        skewX: -3
    }, '-=0.5');

    heroTl.from('.observe-kicker-sub', {
        duration: 0.6,
        opacity: 0,
        y: 15
    }, '-=0.4');

    heroTl.from('.btn-observe-box', {
        duration: 0.6,
        opacity: 0,
        scale: 0.92
    }, '-=0.3');

    // Subtle Glitch Jitter on Headline
    const glitchTitle = document.querySelector('.observe-title.glitch-effect');
    if (glitchTitle) {
        setInterval(() => {
            if (Math.random() > 0.65) {
                gsap.to(glitchTitle, {
                    x: (Math.random() - 0.5) * 5,
                    skewX: (Math.random() - 0.5) * 3,
                    duration: 0.08,
                    yoyo: true,
                    repeat: 1,
                    ease: 'rough'
                });
            }
        }, 3400);
    }

    // ScrollTrigger: Wholesale Tiers
    if (typeof ScrollTrigger !== 'undefined') {
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

        // ScrollTrigger: Procurement Box
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
