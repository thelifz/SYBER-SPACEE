
// Image error recovery helper for robust mobile display
function setupImageErrorRecovery() {
    document.querySelectorAll('img.product-card-img').forEach(img => {
        img.addEventListener('error', function onImgError() {
            if (!this.dataset.retried) {
                this.dataset.retried = '1';
                const rawSrc = this.src.split('?')[0];
                this.src = rawSrc + '?retry=' + Date.now();
            }
        });
    });
}

// About Us Section Live Feed Video Initialization & Autoplay Assurance
function initAboutFeedVideo() {
    const feedVid = document.getElementById('about-feed-video') || document.querySelector('.about-feed-video');
    if (!feedVid) return;

    feedVid.muted = true;
    feedVid.defaultMuted = true;
    feedVid.playsInline = true;
    feedVid.setAttribute('muted', '');
    feedVid.setAttribute('playsinline', '');

    const tryPlayFeed = () => {
        feedVid.muted = true;
        const playPromise = feedVid.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // If browser restricts initial autoplay, resume on first user interaction
                const onUserInteract = () => {
                    feedVid.muted = true;
                    feedVid.play().catch(() => {});
                    window.removeEventListener('click', onUserInteract);
                    window.removeEventListener('scroll', onUserInteract);
                    window.removeEventListener('touchstart', onUserInteract);
                };
                window.addEventListener('click', onUserInteract, { passive: true, once: true });
                window.addEventListener('scroll', onUserInteract, { passive: true, once: true });
                window.addEventListener('touchstart', onUserInteract, { passive: true, once: true });
            });
        }
    };

    if (feedVid.readyState === 0) {
        feedVid.load();
    }
    tryPlayFeed();

    // IntersectionObserver guarantees playback starts when scrolled into view
    if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    tryPlayFeed();
                }
            });
        }, { threshold: 0.1 });
        obs.observe(feedVid);
    }

    // Resume video playback when tab becomes active again
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && feedVid.paused) {
            tryPlayFeed();
        }
    });
}

// ==========================================================================
// SYBER SPACE — Jesko Jets Interaction & Cinematic Surveillance Engine
// ==========================================================================

// Global Hero Slideshow State
let initialProductCards = [];
let currentSlideIndex = 0;
let slideTimer = null;
const VIDEO_SLIDE_DURATION = 8000; // 8 seconds per surveillance video
const OFFER_SLIDE_DURATION = 7000; // 7 seconds per promotional offer slide

const heroSlides = [
    {
        id: 'slide-0',
        type: 'video',
        videoId: 'hero-video-1',
        name: 'CAM 01 // PARKING PERIMETER',
        res: '3840 × 2160 • 60 FPS • H.265+'
    },
    {
        id: 'slide-1',
        type: 'video',
        videoId: 'hero-video-2',
        name: 'CAM 02 // INTERIOR AISLE',
        res: '3840 × 2160 • 60 FPS • H.265+'
    },
    {
        id: 'slide-2',
        type: 'offer',
        name: 'OFFER 01 // iDADA 3MP SMART PT',
        res: 'WHOLESALE BESTSELLER • ONLY ₹1,850 • DIRECT FACTORY RATE'
    },
    {
        id: 'slide-3',
        type: 'offer',
        name: 'OFFER 02 // TRUEVIEW 4G MINI PT',
        res: 'FLASH DEAL • 4G CELLULAR • ONLY ₹3,200'
    },
    {
        id: 'slide-4',
        type: 'offer',
        name: 'OFFER 03 // CP PLUS EZYKAM PT',
        res: 'HOT SELLER • 360° VIEW • ONLY ₹1,980'
    }
];

// Mobile Phone Detection & Slide Filtering (Phones: Strictly Offer Images, Zero Video)
function isMobilePhone() {
    return window.innerWidth <= 768;
}

function getActiveHeroSlides() {
    if (isMobilePhone()) {
        // Exclude heavy 4K videos on mobile; cycle strictly through promotional offer images
        return heroSlides.filter(s => s.type === 'offer');
    }
    return heroSlides;
}

function getCurrentHeroSlide() {
    const active = getActiveHeroSlides();
    return active[currentSlideIndex % active.length] || heroSlides[0];
}

let isNightVisionActive = false;

// Audio Synthesizer Context for UI click sound effects
let audioCtx = null;

// ==========================================================================
// 1. DOM INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Header Scroll Shadow
    const header = document.getElementById('main-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 40) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // Mobile Hamburger Menu
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const mobileOverlay = document.getElementById('mobile-menu-overlay');
    if (menuToggle && mobileOverlay) {
        menuToggle.addEventListener('click', () => {
            const isOpen = mobileOverlay.classList.toggle('open');
            menuToggle.classList.toggle('active', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        mobileOverlay.querySelectorAll('.mobile-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileOverlay.classList.remove('open');
                menuToggle.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // Live UTC Clock Ticker
    const timecodeElem = document.getElementById('timecode-display') || document.getElementById('live-timecode');
    if (timecodeElem) {
        function updateTimecode() {
            const now = new Date();
            const h = String(now.getUTCHours()).padStart(2, '0');
            const m = String(now.getUTCMinutes()).padStart(2, '0');
            const s = String(now.getUTCSeconds()).padStart(2, '0');
            const ms = String(Math.floor(now.getUTCMilliseconds() / 10)).padStart(2, '0');
            timecodeElem.textContent = `${h}:${m}:${s}.${ms} UTC`;
        }
        setInterval(updateTimecode, 60);
        updateTimecode();
    }

    // Slide Navigation Hover & Auto-Advance Control (Pauses only when hovering nav controls)
    const hudNav = document.querySelector('.hud-slideshow-nav');
    if (hudNav) {
        hudNav.addEventListener('mouseenter', () => {
            if (slideTimer) {
                clearTimeout(slideTimer);
                slideTimer = null;
            }
        });
        hudNav.addEventListener('mouseleave', () => {
            if (!slideTimer) {
                const current = getCurrentHeroSlide();
                const dur = current && current.type === 'video' ? VIDEO_SLIDE_DURATION : OFFER_SLIDE_DURATION;
                slideTimer = setTimeout(nextSlide, dur);
            }
        });
    }

    // Auto-advance surveillance videos when playback finishes
    const heroVid1 = document.getElementById('hero-video-1');
    const heroVid2 = document.getElementById('hero-video-2');
    [heroVid1, heroVid2].forEach(v => {
        if (!v) return;
        v.addEventListener('ended', () => {
            nextSlide();
        });
    });

    // Visibility change handler to resume slideshow smoothly when tab reactivates
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && !slideTimer) {
            const current = getCurrentHeroSlide();
            const dur = current && current.type === 'video' ? VIDEO_SLIDE_DURATION : OFFER_SLIDE_DURATION;
            slideTimer = setTimeout(nextSlide, dur);
        }
    });

    // Initialize Products Grid for Filter Engine
    const grid = document.getElementById('products-grid');
    if (grid) {
        initialProductCards = Array.from(grid.querySelectorAll('.product-card'));
    }

    // Initialize Shopping Cart Badge
    updateCartCountDisplay();
    onFilterCriteriaChange();

    // Mark hero viewport ready and start Hero Slideshow on Slide 0
    const vp = document.getElementById('hero-viewport');
    if (vp) vp.classList.add('js-ready');
    try {
        showSlide(0);
    } catch (err) {
        console.error('showSlide(0) init error:', err);
    }

    // Deep-link auto-navigation for slide and viewport scroll
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
        setTimeout(() => {
            completeHeaderSearch(searchParam);
        }, 150);
    }
    const slideParam = urlParams.get('slide');
    if (slideParam !== null) {
        const slideIdx = parseInt(slideParam, 10);
        if (!isNaN(slideIdx)) {
            setTimeout(() => {
                goToSlideAndScroll(slideIdx);
            }, 120);
        }
    } else if (window.location.hash === '#hero-viewport') {
        setTimeout(() => {
            goToSlideAndScroll(0);
        }, 120);
    }

    // Auto-adapt Hero Slideshow when viewport resizes between desktop and mobile phone
    let lastIsMobile = isMobilePhone();
    window.addEventListener('resize', () => {
        const curIsMobile = isMobilePhone();
        if (curIsMobile !== lastIsMobile) {
            lastIsMobile = curIsMobile;
            showSlide(0);
            onFilterCriteriaChange();
        }
    });

    // Mobile Phone Touch Swipe for Promotional Offer Slides
    const heroViewportEl = document.getElementById('hero-viewport');
    if (heroViewportEl) {
        let heroTouchStartX = 0;
        let heroTouchEndX = 0;
        heroViewportEl.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches.length > 0) {
                heroTouchStartX = e.touches[0].clientX;
            }
        }, { passive: true });
        heroViewportEl.addEventListener('touchend', (e) => {
            if (e.changedTouches && e.changedTouches.length > 0) {
                heroTouchEndX = e.changedTouches[0].clientX;
                const deltaX = heroTouchEndX - heroTouchStartX;
                if (Math.abs(deltaX) > 40) {
                    if (deltaX < 0) {
                        nextSlide(); // Swipe left -> Next offer
                    } else {
                        prevSlide(); // Swipe right -> Previous offer
                    }
                }
            }
        }, { passive: true });
    }

    setupImageErrorRecovery();
    initAboutFeedVideo();
    initGsapMagic();
    console.log("SYBER SPACE — Video & Offer Surveillance Engine initialized successfully.");
});

// ==========================================================================
// 2. UNIFIED HERO SLIDESHOW CONTROLLER ([ PREV ]  01 // 05  [ NEXT ])
// ==========================================================================
function showSlide(index) {
    if (slideTimer) {
        clearTimeout(slideTimer);
        slideTimer = null;
    }

    const activeSlides = getActiveHeroSlides();
    currentSlideIndex = (index + activeSlides.length) % activeSlides.length;
    const current = activeSlides[currentSlideIndex];

    // 1. Activate Target Slide Element
    const allSlides = document.querySelectorAll('.hero-slide');
    allSlides.forEach(slideEl => {
        if (slideEl.id === current.id) {
            slideEl.classList.add('active');
        } else {
            slideEl.classList.remove('active');
        }
    });

    // 2. Update HUD Telemetry
    const counterEl = document.getElementById('slide-counter') || document.getElementById('hero-nav-counter');
    const feedText = document.getElementById('feed-name-display') || document.getElementById('current-feed-name');
    const resolutionText = document.getElementById('resolution-chip');
    const recDot = document.getElementById('rec-dot') || document.getElementById('rec-status-dot');
    const videoControlsGroup = document.getElementById('video-controls-group');
    const viewport = document.getElementById('hero-viewport') || document.getElementById('hero-video-viewport');

    if (counterEl) {
        const currNum = String(currentSlideIndex + 1).padStart(2, '0');
        const totNum = String(activeSlides.length).padStart(2, '0');
        counterEl.textContent = `${currNum} // ${totNum}`;
    }

    if (feedText) {
        feedText.textContent = current.name;
    }

    if (resolutionText) {
        resolutionText.innerHTML = `<span>${current.res}</span>`;
    }

    // Video Elements
    const vid1 = document.getElementById('hero-video-1');
    const vid2 = document.getElementById('hero-video-2');

    if (current.type === 'video' && !isMobilePhone()) {
        // Video Slide Active:
        if (viewport) {
            viewport.classList.remove('is-offer-slide');
        }

        // Show Night Vision Toggle ONLY on video slides
        if (videoControlsGroup) {
            videoControlsGroup.style.display = 'inline-flex';
        }

        // Recording Dot is RED for live camera
        if (recDot) {
            recDot.style.background = '#ef4444';
            recDot.style.boxShadow = '0 0 10px #ef4444';
        }

        // Manage Video Playback
        const activeVideo = current.videoId === 'hero-video-1' ? vid1 : vid2;
        const inactiveVideo = current.videoId === 'hero-video-1' ? vid2 : vid1;

        if (inactiveVideo) {
            inactiveVideo.pause();
        }

        if (activeVideo) {
            activeVideo.muted = true;
            activeVideo.currentTime = 0;
            const playPromise = activeVideo.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    activeVideo.muted = true;
                    activeVideo.play().catch(() => {});
                });
            }
        }

        // Sync Night Vision button state
        syncNightVisionUI();

        // Auto-advance after video duration
        slideTimer = setTimeout(nextSlide, VIDEO_SLIDE_DURATION);

    } else if (current.type === 'offer') {
        // Offer Slide Active:
        if (viewport) {
            viewport.classList.add('is-offer-slide');
            // Remove night vision visual filter on offer slides
            viewport.classList.remove('night-vision-mode');
            viewport.classList.remove('night-vision-active');
        }

        // STRICTLY HIDE Night Vision toggle on offer slides
        if (videoControlsGroup) {
            videoControlsGroup.style.display = 'none';
        }

        // Pause all video feeds
        if (vid1 && typeof vid1.pause === "function") vid1.pause();
        if (vid2 && typeof vid2.pause === "function") vid2.pause();

        // Deal Dot is EMERALD GREEN for offer slides
        if (recDot) {
            recDot.style.background = '#10b981';
            recDot.style.boxShadow = '0 0 12px #10b981';
        }

        // Auto-advance after offer duration
        slideTimer = setTimeout(nextSlide, OFFER_SLIDE_DURATION);
    }
}

function nextSlide() {
    showSlide(currentSlideIndex + 1);
}

function prevSlide() {
    showSlide(currentSlideIndex - 1);
}

function goToSlide(index) {
    showSlide(index);
}

function goToSlideAndScroll(index, e) {
    if (e) {
        e.preventDefault();
    }
    if (isMobilePhone()) {
        const activeIdx = index >= 2 ? (index - 2) : 0;
        showSlide(activeIdx);
    } else {
        showSlide(index);
    }

    const viewport = document.getElementById('hero-viewport');
    if (viewport) {
        const header = document.getElementById('main-header');
        const headerHeight = header ? header.offsetHeight : 80;
        const rect = viewport.getBoundingClientRect();
        const targetY = window.pageYOffset + rect.top - headerHeight - 12;

        window.scrollTo({
            top: Math.max(0, targetY),
            behavior: 'smooth'
        });
    }

    const mobileOverlay = document.getElementById('mobile-menu-overlay');
    const menuToggle = document.getElementById('mobile-menu-toggle');
    if (mobileOverlay && mobileOverlay.classList.contains('open')) {
        mobileOverlay.classList.remove('open');
        if (menuToggle) menuToggle.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Aliases for backward compatibility
function nextHeroSlide() { nextSlide(); }
function prevHeroSlide() { prevSlide(); }
function showHeroSlide(idx) { showSlide(idx); }
function selectHeroStage(idx) {
    if (idx === 2) {
        showSlide(2);
    } else {
        showSlide(idx);
    }
}

// Keyboard arrow and escape navigation
window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) return;
    
    const modal = document.getElementById('product-detail-modal');
    const isModalOpen = modal && modal.classList.contains('active');
    
    if (isModalOpen) {
        if (e.key === 'Escape') {
            closeProductModal();
        } else if (e.key === 'ArrowLeft') {
            cycleModalProductImage(-1);
        } else if (e.key === 'ArrowRight') {
            cycleModalProductImage(1);
        }
        return;
    }

    if (e.key === 'ArrowLeft') {
        prevSlide();
    } else if (e.key === 'ArrowRight') {
        nextSlide();
    }
});

// ==========================================================================
// 3. NIGHT VISION & AUDIO CONTROLLERS (SURVEILLANCE ONLY)
// ==========================================================================
function toggleNightVision(e) {
    if (e) {
        e.stopPropagation();
        e.preventDefault();
    }
    const current = getCurrentHeroSlide();
    if (current && current.type !== 'video') return; // Strictly for video slides

    isNightVisionActive = !isNightVisionActive;
    syncNightVisionUI();
    }

function syncNightVisionUI() {
    const viewport = document.getElementById('hero-viewport') || document.getElementById('hero-video-viewport');
    const btn = document.getElementById('night-vision-btn');
    const label = document.getElementById('night-vision-label');
    const current = getCurrentHeroSlide();

    if (!btn || !label) return;

    if (current && current.type === 'video' && isNightVisionActive) {
        if (viewport) {
            viewport.classList.add('night-vision-mode');
            viewport.classList.add('night-vision-active');
        }
        btn.classList.add('active');
        label.textContent = 'NIGHT VISION: ON';
    } else {
        if (viewport) {
            viewport.classList.remove('night-vision-mode');
            viewport.classList.remove('night-vision-active');
        }
        btn.classList.remove('active');
        label.textContent = 'NIGHT VISION: OFF';
    }
}

// ==========================================================================
// 4. WEB AUDIO API SYNTHESIZER (TACTILE SOUND EFFECTS)
// ==========================================================================
function getAudioContext() {
    return null;
}

function playCameraSnapSound() {
    // Audio muted per specification: zero clicks, zero sounds
}

function playCameraBeep() {
    // Audio muted per specification: zero beeps
}

// ==========================================================================
// 5. CATALOG FILTERING, SEARCH & SORT SYSTEM
// ==========================================================================
function onPriceSliderChange(val) {
    const display = document.getElementById('price-max-display');
    if (display) {
        display.textContent = `Up to ₹${parseInt(val, 10).toLocaleString('en-IN')}`;
    }
    onFilterCriteriaChange();
}

function resetSidebarFilters() {
    currentTextCategory = 'all';
    currentTextBrand = 'all';
    document.querySelectorAll('.text-cat-pill').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.text-brand-pill').forEach(b => b.classList.remove('active'));
    const firstCat = document.querySelector('.text-cat-pill');
    const firstBrand = document.querySelector('.text-brand-pill');
    if (firstCat) firstCat.classList.add('active');
    if (firstBrand) firstBrand.classList.add('active');
    document.querySelectorAll('input[name="brand"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[name="category"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[name="feature"]').forEach(cb => cb.checked = false);

    const slider = document.getElementById('price-range-slider');
    const display = document.getElementById('price-max-display');
    if (slider) slider.value = 12000;
    if (display) display.textContent = 'Up to ₹12,000';

    const searchInput = document.getElementById('camera-search-input');
    const clearBtn = document.getElementById('search-clear-btn');
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';

    const sortSelect = document.getElementById('refine-sort');
    if (sortSelect) sortSelect.value = 'featured';

    onFilterCriteriaChange();
}

// ==========================================================================
// 5. SEARCH SUGGESTIONS & AUTOCOMPLETE DATA ENGINE
// ==========================================================================
const searchSuggestionsData = [
    // Hero & Bestselling Models
    {
        title: "iDADA ID-Q2i35S-TD 3MP Pan & Tilt Smart Wi-Fi Camera",
        query: "iDADA ID-Q2i35S-TD",
        tag: "model",
        tagLabel: "BESTSELLER",
        sub: "₹1,850 • #1 Wholesale Bestseller • 3MP PT Smart Wi-Fi",
        keywords: ["idada", "q2i35s", "id-q2i35s-td", "smart wifi", "pan tilt", "bestseller", "wholesale"]
    },
    {
        title: "CP PLUS Ezykam CP-E28Q 2MP Pan & Tilt Wi-Fi Camera",
        query: "CP PLUS CP-E28Q",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹1,980 • CP PLUS Ezykam Full HD 360° Smart Camera",
        keywords: ["cp plus", "cpplus", "ezykam", "e28q", "cp-e28q", "pan tilt", "wifi"]
    },
    {
        title: "CP PLUS Ezykam CP-E38Q 3MP Pan & Tilt Wi-Fi Camera",
        query: "CP-E38Q",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹2,235 • 3MP 2K Ultra HD Pan & Tilt Smart Indoor",
        keywords: ["cp-e38q", "e38q", "3mp", "cpplus", "ezykam", "pan tilt"]
    },
    {
        title: "CP PLUS Ezykam CP-E21Q 2MP Pan & Tilt with LAN",
        query: "CP-E21Q",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹2,035 • 2MP 1080P PT with Dedicated RJ45 LAN",
        keywords: ["cp-e21q", "e21q", "lan", "rj45", "cpplus", "ezykam"]
    },
    {
        title: "CP PLUS Ezykam CP-E31Q 3MP Pan & Tilt with LAN",
        query: "CP-E31Q",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹2,290 • 3MP 2K PT with Dedicated RJ45 LAN",
        keywords: ["cp-e31q", "e31q", "lan", "rj45", "3mp", "cpplus"]
    },
    {
        title: "CP PLUS Ezykam CP-E48Q 4MP Pan & Tilt Wi-Fi Camera",
        query: "CP-E48Q",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹2,525 • 4MP Quad HD 2K Indoor Smart PT",
        keywords: ["cp-e48q", "e48q", "4mp", "quad hd", "cpplus"]
    },
    {
        title: "CP PLUS Ezykam CP-E41Q 4MP Pan & Tilt with LAN",
        query: "CP-E41Q",
        tag: "model",
        tagLabel: "PRO",
        sub: "₹2,640 • 4MP Quad HD PT with 15m IR & LAN",
        keywords: ["cp-e41q", "e41q", "4mp", "lan", "rj45", "cpplus"]
    },
    {
        title: "CP PLUS Ezykam CP-Z43Q 4MP Outdoor Full Color PT",
        query: "CP-Z43Q",
        tag: "model",
        tagLabel: "OUTDOOR",
        sub: "₹3,365 • 4MP IP65 Weatherproof Full Color PT",
        keywords: ["cp-z43q", "z43q", "outdoor", "color vision", "ip65", "cpplus"]
    },
    {
        title: "CP PLUS Ezykam CP-Z45Q 4MP Outdoor Full Color PT",
        query: "CP-Z45Q",
        tag: "model",
        tagLabel: "OUTDOOR",
        sub: "₹3,425 • 4MP IP65 All-Weather Sweeping PT",
        keywords: ["cp-z45q", "z45q", "outdoor", "color vision", "ip65", "cpplus"]
    },
    {
        title: "CP PLUS EzyLiv EZ-P34Q 3MP Full Color Wi-Fi PT",
        query: "EZ-P34Q",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹2,070 • 3MP Active White Light Deterrence PT",
        keywords: ["ez-p34q", "p34q", "ezyliv", "active deterrence", "cpplus"]
    },

    {
        title: "Trueview T18296S Smart Wi-Fi Robot PT Camera 3MP",
        query: "T18296S",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹1,725 • Trueview 3MP Robotic Pan-Tilt Voice Intercom",
        keywords: ["t18296s", "trueview", "robot", "pt", "wifi", "3mp"]
    },
    {
        title: "Trueview T18294S Smart Wi-Fi Dome Camera 3MP",
        query: "T18294S",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹2,150 • Trueview 3MP Wide Angle Ceiling Dome",
        keywords: ["t18294s", "trueview", "dome", "wifi", "3mp", "indoor"]
    },
    {
        title: "Trueview T18295S Smart Wi-Fi Bullet Camera 3MP IP66",
        query: "T18295S",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹2,250 • Trueview 3MP IP66 All-Weather Bullet",
        keywords: ["t18295s", "trueview", "bullet", "wifi", "ip66", "outdoor"]
    },
    {
        title: "Trueview T18290S Smart Wi-Fi Mini PT Camera 3MP IP65",
        query: "T18290S",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹2,900 • Trueview 3MP Outdoor PT Full Color Night",
        keywords: ["t18290s", "trueview", "mini pt", "ip65", "color night", "wifi"]
    },
    {
        title: "Trueview T18293SF Smart 4G Dome Camera 3MP (4G/5G SIM)",
        query: "T18293SF",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹2,500 • Trueview 3MP 4G/5G Cellular SIM Dome",
        keywords: ["t18293sf", "trueview", "4g", "sim", "dome", "cellular"]
    },
    {
        title: "Trueview T18292SF Smart 4G Bullet Camera 3MP IP66",
        query: "T18292SF",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹2,600 • Trueview 3MP IP66 Outdoor 4G SIM Bullet",
        keywords: ["t18292sf", "trueview", "4g", "bullet", "ip66", "sim"]
    },
    {
        title: "Trueview T18291SF Smart 4G Mini PT Camera 3MP IP65",
        query: "T18291SF",
        tag: "model",
        tagLabel: "BESTSELLER",
        sub: "₹3,200 • Trueview 3MP 4G SIM Motorized PTZ Off-Grid",
        keywords: ["t18291sf", "trueview", "4g", "mini pt", "sim", "ptz", "bestseller"]
    },
    {
        title: "Trueview T292357-A Solar Power Hub 36W 13500mAh BMS",
        query: "T292357-A",
        tag: "model",
        tagLabel: "OFF-GRID",
        sub: "₹3,700 • 36W Monocrystalline Solar Panel + 13.5Ah Battery",
        keywords: ["t292357-a", "solar", "hub", "trueview", "battery", "bms", "off-grid"]
    },
    {
        title: "Trueview T38236-A 10 Channel Wi-Fi NVR 8MP Support",
        query: "T38236-A",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹5,000 • 10Ch Wireless NVR • 8MP/5MP/6TB Dual Antenna",
        keywords: ["t38236-a", "nvr", "wifi", "10 channel", "trueview", "wireless"]
    },
    {
        title: "Trueview T38118-AE 16 Channel 8MP 4K NVR (1 SATA)",
        query: "T38118-AE",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹4,500 • 16Ch 8MP 4K UHD Network Video Recorder",
        keywords: ["t38118-ae", "nvr", "16 channel", "4k", "trueview"]
    },
    {
        title: "Trueview T38119-AE 32 Channel 8MP 4K NVR (2 SATA)",
        query: "T38119-AE",
        tag: "model",
        tagLabel: "ENTERPRISE",
        sub: "₹7,500 • 32Ch Enterprise NVR • Dual SATA 16TB",
        keywords: ["t38119-ae", "nvr", "32 channel", "enterprise", "trueview", "dual sata"]
    },
    {
        title: "Trueview T18258-A 4G Router R300 300Mbps SIM Slot",
        query: "T18258-A",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹1,225 • 300Mbps 4G SIM Cellular Router",
        keywords: ["t18258-a", "router", "r300", "4g", "trueview", "sim"]
    },
    {
        title: "Trueview T18259-A 4G Router R500 5dB High-Gain Dual Antenna",
        query: "T18259-A",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹1,350 • Dual 5dB High-Gain 4G Router",
        keywords: ["t18259-a", "router", "r500", "4g", "trueview", "antennas"]
    },
    {
        title: "Trueview T18182-A 4G Router Dual LAN 4 High-Gain Antennas",
        query: "T18182-A",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹2,000 • 4-Antenna Dual LAN Commercial 4G Router",
        keywords: ["t18182-a", "router", "dual lan", "4g", "trueview", "lan"]
    },
    {
        title: "Trueview T38241-A Smart Video Door Bell 3MP Wi-Fi 6",
        query: "T38241-A",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹2,000 • 3MP Wi-Fi 6 Smart Video Doorbell with 2-Way Audio",
        keywords: ["t38241-a", "doorbell", "wifi 6", "trueview", "video doorbell", "chime"]
    },
    {
        title: "Trueview T38260-A PoE Switch 4+2 (10/100M 65W)",
        query: "T38260-A",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹1,000 • 4 PoE + 2 Uplink 65W Budget",
        keywords: ["t38260-a", "poe", "switch", "4 port", "trueview", "65w"]
    },
    {
        title: "Trueview T38262-A PoE Switch 8+2 (10/100M 120W)",
        query: "T38262-A",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹1,300 • 8 PoE + 2 Uplink 120W Budget",
        keywords: ["t38262-a", "poe", "switch", "8 port", "trueview", "120w"]
    },
    {
        title: "Trueview T38261-A PoE Switch 4G+2G+1SFP Gigabit 65W",
        query: "T38261-A",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹2,100 • 4 Gigabit PoE + 2 Uplink + 1 SFP Fiber",
        keywords: ["t38261-a", "poe", "switch", "gigabit", "sfp", "trueview"]
    },
    {
        title: "Trueview T38264-A PoE Switch 8G+2G Full Gigabit 120W",
        query: "T38264-A",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹2,400 • 8 Full Gigabit PoE + 2 Uplinks 120W",
        keywords: ["t38264-a", "poe", "switch", "full gigabit", "trueview"]
    },
    {
        title: "Trueview T38267-A PoE Switch 16G+2G+1SFP Full Gigabit 300W",
        query: "T38267-A",
        tag: "model",
        tagLabel: "PRO",
        sub: "₹7,300 • 16 Full Gigabit PoE + 2 Uplinks + SFP 300W",
        keywords: ["t38267-a", "poe", "switch", "16 port", "gigabit", "300w", "trueview"]
    },
    {
        title: "Trueview T38269-A PoE Switch 24G+2G+2SFP 24 Gigabit 300W",
        query: "T38269-A",
        tag: "model",
        tagLabel: "ENTERPRISE",
        sub: "₹11,000 • 24 Gigabit PoE + Dual SFP Fiber 300W",
        keywords: ["t38269-a", "poe", "switch", "24 port", "gigabit", "300w", "enterprise"]
    },
    {
        title: "Trueview T18256-A Dual Light HD 2MP Dome Camera",
        query: "T18256-A",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹800 • 2MP 1080P Dual Light Analog Dome",
        keywords: ["t18256-a", "ahd", "dome", "analog", "dual light", "trueview"]
    },
    {
        title: "Trueview T18257-A Dual Light HD 2MP Bullet Camera IP66",
        query: "T18257-A",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹900 • 2MP 1080P IP66 Outdoor Dual Light Bullet",
        keywords: ["t18257-a", "ahd", "bullet", "analog", "ip66", "trueview"]
    },
    {
        title: "Trueview T18300-A Dual Light HD 2MP Mini Pan Tilt Camera",
        query: "T18300-A",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹1,350 • 2MP Motorized Pan/Tilt Dual Light Analog",
        keywords: ["t18300-a", "ahd", "pt", "mini pan tilt", "analog", "trueview"]
    },
    {
        title: "Trueview T38297-A 4 Channel 4 Audio 5in1 Analog DVR",
        query: "T38297-A",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹3,300 • 4Ch 4 Audio Inputs 5in1 Hybrid DVR",
        keywords: ["t38297-a", "dvr", "4 channel", "audio", "hybrid", "trueview"]
    },
    {
        title: "Trueview T38298-A 8 Channel 8 Audio 5in1 Analog DVR",
        query: "T38298-A",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹4,400 • 8Ch 8 Audio Inputs 5in1 Hybrid DVR",
        keywords: ["t38298-a", "dvr", "8 channel", "audio", "hybrid", "trueview"]
    },
    {
        title: "Trueview T37431-BE 16 Channel 5in1 Analog DVR Cloud",
        query: "T37431-BE",
        tag: "model",
        tagLabel: "MODEL",
        sub: "₹6,000 • 16Ch 5in1 Hybrid Surveillance DVR",
        keywords: ["t37431-be", "dvr", "16 channel", "cloud", "trueview"]
    },
    {
        title: "Trueview T38299-A 16 Channel 16 Audio 5in1 Analog DVR",
        query: "T38299-A",
        tag: "model",
        tagLabel: "PRO",
        sub: "₹6,900 • 16Ch 16 Audio Inputs + 2-Way Talk DVR",
        keywords: ["t38299-a", "dvr", "16 channel", "16 audio", "2-way talk", "trueview"]
    },

    // Brand entries
    {
        title: "Trueview (Warner Electronics)",
        query: "Trueview",
        tag: "brand",
        tagLabel: "BRAND",
        sub: "Official Authorized Partner • 31 Products (Cameras, NVR, PoE, Routers)",
        keywords: ["trueview", "warner", "brand", "official"]
    },
    {
        title: "iDADA Security",
        query: "iDADA",
        tag: "brand",
        tagLabel: "BRAND",
        sub: "#1 Bestselling Wholesale Smart Security Line",
        keywords: ["idada", "brand", "bestseller", "smart"]
    },
    {
        title: "CP PLUS",
        query: "CP PLUS",
        tag: "brand",
        tagLabel: "BRAND",
        sub: "Authorized Wholesale Partner • 9 Ezykam & EzyLiv Systems",
        keywords: ["cp plus", "cpplus", "ezykam", "brand"]
    },

    // Category entries
    {
        title: "Wi-Fi Cameras",
        query: "Wi-Fi Cameras",
        tag: "category",
        tagLabel: "CATEGORY",
        sub: "Robot PT, Dome, Bullet & Outdoor Mini PT (₹1,725 – ₹2,900)",
        keywords: ["wifi", "wi-fi", "wireless", "robot", "camera", "indoor"]
    },
    {
        title: "4G SIM Cellular Cameras",
        query: "4G SIM Cameras",
        tag: "category",
        tagLabel: "CATEGORY",
        sub: "Direct SIM Streaming • Dome, Bullet & PTZ (₹2,500 – ₹3,200)",
        keywords: ["4g", "sim", "cellular", "5g", "remote", "off-grid"]
    },
    {
        title: "PoE Switches (4 to 24 Port)",
        query: "PoE Switches",
        tag: "category",
        tagLabel: "CATEGORY",
        sub: "Fast Ethernet & Full Gigabit PoE Switches with SFP Uplinks",
        keywords: ["poe", "switch", "gigabit", "sfp", "network", "ethernet"]
    },
    {
        title: "NVRs & DVRs (4Ch to 32Ch)",
        query: "NVRs & DVRs",
        tag: "category",
        tagLabel: "CATEGORY",
        sub: "Network IP & 5-in-1 Analog Recorders with Multi-Audio Support",
        keywords: ["nvr", "dvr", "recorder", "channels", "sata", "storage"]
    },
    {
        title: "4G Routers & Video Doorbell",
        query: "4G Routers",
        tag: "category",
        tagLabel: "CATEGORY",
        sub: "High-Gain Cellular Routers & Wi-Fi 6 Intercom Doorbells",
        keywords: ["router", "doorbell", "chime", "intercom", "4g router"]
    },
    {
        title: "Solar Power Hub",
        query: "Solar Power Hub",
        tag: "category",
        tagLabel: "CATEGORY",
        sub: "36W Monocrystalline Panel with 13500mAh BMS for 24/7 Off-Grid",
        keywords: ["solar", "solar hub", "panel", "battery", "off-grid"]
    },

    // Feature entries
    {
        title: "Night Vision / Dual Light",
        query: "color-vision",
        tag: "feature",
        tagLabel: "FEATURE",
        sub: "Dual Smart Illuminators & Full-Color Night Vision",
        keywords: ["night", "vision", "color", "starlight", "ir", "dual light"]
    },
    {
        title: "Motorized Pan & Tilt (360°)",
        query: "pan-tilt",
        tag: "feature",
        tagLabel: "FEATURE",
        sub: "Motorized Rotation with Automatic Humanoid Tracking",
        keywords: ["pan", "tilt", "pt", "ptz", "360", "motorized", "rotation"]
    },
    {
        title: "2-Way Audio Voice Intercom",
        query: "2-way-audio",
        tag: "feature",
        tagLabel: "FEATURE",
        sub: "Built-In High-Fidelity Microphone & Speaker Talkback",
        keywords: ["audio", "2-way", "voice", "intercom", "mic", "talk"]
    },
    {
        title: "4G / 5G SIM Slot",
        query: "sim-slot",
        tag: "feature",
        tagLabel: "FEATURE",
        sub: "Independent Cellular Connectivity Without Broadband Wi-Fi",
        keywords: ["sim", "4g", "5g", "cellular", "slot"]
    },
    {
        title: "Gigabit PoE Networking",
        query: "poe-gigabit",
        tag: "feature",
        tagLabel: "FEATURE",
        sub: "High-Bandwidth 1000Mbps Gigabit Power over Ethernet",
        keywords: ["gigabit", "poe", "sfp", "uplink"]
    }
];

let activeSuggestionIndex = -1;


// =============================================================================
// GLOBAL HEADER QUICK SEARCH BAR ENGINE & INTERACTIVE SUGGESTIONS
// =============================================================================
let headerActiveSuggestionIndex = -1;


// =============================================================================
// PROFESSIONAL E-COMMERCE SEARCH & CATEGORY NAVIGATION
// =============================================================================
function onHeaderSearchSubmit() {
    const input = document.getElementById('header-search-input');
    const q = input ? input.value.trim() : '';
    if (q) {
        completeHeaderSearch(q);
    } else {
        scrollToShowroom('all', null, null);
    }
}

function scrollToShowroom(brandKey, linkEl, event) {
    if (event) {
        event.preventDefault();
    }
    const key = (brandKey || 'all').toLowerCase();

    // 1. Update navigation active styles across desktop header and mobile quick-chips
    document.querySelectorAll('.cat-nav-link').forEach(link => {
        link.classList.remove('active');
        const href = (link.getAttribute('href') || '').toLowerCase();
        const onclickAttr = (link.getAttribute('onclick') || '').toLowerCase();
        if (key === 'all' && (href === '#cameras' || onclickAttr.includes("'all'"))) {
            link.classList.add('active');
        } else if ((key === 'trueview' && (href.includes('trueview') || onclickAttr.includes('trueview'))) ||
                   ((key === 'cpplus' || key === 'cp-plus') && (href.includes('cpplus') || onclickAttr.includes('cpplus'))) ||
                   (key === 'idada' && (href.includes('idada') || onclickAttr.includes('idada'))) ||
                   ((key === 'accessories' || key === 'accessory') && (href.includes('accessories') || onclickAttr.includes('accessories')))) {
            link.classList.add('active');
        }
    });

    document.querySelectorAll('.m-cat-pill').forEach(pill => {
        pill.classList.remove('active');
        const onclickAttr = (pill.getAttribute('onclick') || '').toLowerCase();
        if (key === 'all' && onclickAttr.includes("'all'")) {
            pill.classList.add('active');
        } else if ((key === 'trueview' && onclickAttr.includes('trueview')) ||
                   ((key === 'cpplus' || key === 'cp-plus') && onclickAttr.includes('cpplus')) ||
                   (key === 'idada' && onclickAttr.includes('idada')) ||
                   ((key === 'accessories' || key === 'accessory') && onclickAttr.includes('accessories'))) {
            pill.classList.add('active');
        }
    });

    if (linkEl) {
        linkEl.classList.add('active');
    }

    // 2. Resolve target showroom element
    let targetId = 'cameras';
    if (key === 'trueview') targetId = 'showroom-trueview';
    else if (key === 'cpplus' || key === 'cp-plus') targetId = 'showroom-cpplus';
    else if (key === 'idada') targetId = 'showroom-idada';
    else if (key === 'accessories' || key === 'accessory') targetId = 'showroom-accessories';

    const targetEl = document.getElementById(targetId) || document.getElementById('cameras');
    if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function filterCatalogByNav(cat, linkEl, event) {
    scrollToShowroom(cat, linkEl, event);
}

function onHeaderSearchInput(val) {
    const clearBtn = document.getElementById('header-search-clear-btn');
    if (clearBtn) {
        clearBtn.style.display = val ? 'flex' : 'none';
    }
    const cameraInput = document.getElementById('camera-search-input');
    if (cameraInput && cameraInput.value !== val) {
        cameraInput.value = val;
    }
    const cameraClear = document.getElementById('search-clear-btn');
    if (cameraClear) {
        cameraClear.style.display = val ? 'inline-flex' : 'none';
    }
    onFilterCriteriaChange();
    renderHeaderSearchSuggestions(val);
}

function onHeaderSearchFocus() {
    const input = document.getElementById('header-search-input');
    renderHeaderSearchSuggestions(input ? input.value : '');
}

function renderHeaderSearchSuggestions(query) {
    const dropdown = document.getElementById('header-search-dropdown');
    const input = document.getElementById('header-search-input');
    if (!dropdown || !input) return;

    const q = (query || '').trim().toLowerCase();
    headerActiveSuggestionIndex = -1;

    let matches = [];
    let headerText = 'RECOMMENDED SEARCHES';
    let headerHint = 'Click or press Enter';

    if (!q) {
        headerText = 'POPULAR SEARCHES';
        headerHint = 'Quick filters';
        matches = [
            searchSuggestionsData[0],  // iDADA ID-Q2i35S-TD Bestseller
            searchSuggestionsData[30], // Trueview Brand
            searchSuggestionsData[33], // Wi-Fi Cameras
            searchSuggestionsData[34], // 4G SIM Cameras
            searchSuggestionsData[35], // PoE Switches
            searchSuggestionsData[1],  // CP PLUS CP-E28Q
            searchSuggestionsData[39]  // Night Vision
        ];
    } else {
        headerText = `SUGGESTIONS FOR "${q.toUpperCase()}"`;
        headerHint = 'Navigate with Arrow keys';
        matches = searchSuggestionsData.filter(item => {
            if (item.title.toLowerCase().includes(q)) return true;
            if (item.query.toLowerCase().includes(q)) return true;
            if (item.sub.toLowerCase().includes(q)) return true;
            return item.keywords.some(kw => kw.includes(q));
        });
    }

    if (matches.length === 0) {
        dropdown.innerHTML = `
            <div class="suggestion-header">
                <span>NO DIRECT MATCHES</span>
                <span class="suggestion-header-hint">Press Enter</span>
            </div>
            <div class="suggestion-empty" style="padding: 16px; font-size: 0.82rem; color: #64748b; text-align: center;">
                No products found directly matching "<strong>${escapeHtml(q)}</strong>".<br>
                <div style="margin-top: 10px;">
                    <button type="button" class="slide-buy-btn" style="font-size: 0.72rem; padding: 6px 14px; background: var(--base-dark); color: #ffffff;" onclick="completeHeaderSearch('${escapeHtml(q)}')">
                        <span>SEARCH WHOLE CATALOG</span>
                    </button>
                </div>
            </div>
        `;
        dropdown.classList.add('open');
        input.setAttribute('aria-expanded', 'true');
        return;
    }

    const itemsHtml = matches.slice(0, 7).map((item, index) => {
        const highlightedTitle = highlightSearchQuery(item.title, q);
        return `
            <div class="suggestion-item" role="option" id="header-suggestion-opt-${index}" data-index="${index}" data-query="${escapeHtml(item.query)}" onclick="completeHeaderSearch('${escapeHtml(item.query)}')">
                <div class="suggestion-left">
                    <span class="suggestion-tag tag-${item.tag}">[ ${item.tagLabel} ]</span>
                    <div class="suggestion-text-wrap">
                        <span class="suggestion-title">${highlightedTitle}</span>
                        <span class="suggestion-sub">${escapeHtml(item.sub)}</span>
                    </div>
                </div>
                <span class="suggestion-action-hint">SELECT</span>
            </div>
        `;
    }).join('');

    dropdown.innerHTML = `
        <div class="suggestion-header">
            <span>${headerText}</span>
            <span class="suggestion-header-hint">${headerHint}</span>
        </div>
        <div class="suggestion-list">
            ${itemsHtml}
        </div>
    `;

    dropdown.classList.add('open');
    input.setAttribute('aria-expanded', 'true');
}

function completeHeaderSearch(query) {
    const q = (query || '').trim();
    const qLower = q.toLowerCase();

    const headerInput = document.getElementById('header-search-input');
    if (headerInput) headerInput.value = q;
    const cameraInput = document.getElementById('camera-search-input');
    if (cameraInput) cameraInput.value = q;
    const mobileInput = document.getElementById('mobile-search-input');
    if (mobileInput) mobileInput.value = q;

    const clearBtn = document.getElementById('header-search-clear-btn');
    if (clearBtn) clearBtn.style.display = q ? 'flex' : 'none';
    const cameraClear = document.getElementById('search-clear-btn');
    if (cameraClear) cameraClear.style.display = q ? 'inline-flex' : 'none';

    closeHeaderSearchSuggestions();
    closeSearchSuggestions();

    // Map search query to best showroom
    let targetBrand = 'all';
    if (/trueview|t18291|solar|poe|switch|router|4k nvr|4g mini/.test(qLower)) {
        targetBrand = 'trueview';
    } else if (/cp\s*plus|cpplus|ezykam|cp-e|cp-z|z45q|e21q|e28q|bullet/.test(qLower)) {
        targetBrand = 'cpplus';
    } else if (/idada|q2i35s|1850|3mp smart|smart pt/.test(qLower)) {
        targetBrand = 'idada';
    } else if (/cable|cat6|wire|smps|power|hard drive|hdd|box|junction|accessories|accessory|drum|reel/.test(qLower)) {
        targetBrand = 'accessories';
    }

    scrollToShowroom(targetBrand, null, null);
}

function closeHeaderSearchSuggestions() {
    const dropdown = document.getElementById('header-search-dropdown');
    const input = document.getElementById('header-search-input');
    if (dropdown) dropdown.classList.remove('open');
    if (input) input.setAttribute('aria-expanded', 'false');
    headerActiveSuggestionIndex = -1;
}

function clearHeaderSearch() {
    const headerInput = document.getElementById('header-search-input');
    const cameraInput = document.getElementById('camera-search-input');
    const clearBtn = document.getElementById('header-search-clear-btn');
    const cameraClear = document.getElementById('search-clear-btn');

    if (headerInput) headerInput.value = '';
    if (cameraInput) cameraInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    if (cameraClear) cameraClear.style.display = 'none';

    closeHeaderSearchSuggestions();
    onFilterCriteriaChange();
}

function onHeaderSearchKeyDown(e) {
    const dropdown = document.getElementById('header-search-dropdown');
    if (!dropdown || !dropdown.classList.contains('open')) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const input = document.getElementById('header-search-input');
            const q = input ? input.value.trim() : '';
            if (q) completeHeaderSearch(q);
        }
        return;
    }

    const items = dropdown.querySelectorAll('.suggestion-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        headerActiveSuggestionIndex = (headerActiveSuggestionIndex + 1) % items.length;
        updateHeaderSuggestionFocus(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        headerActiveSuggestionIndex = (headerActiveSuggestionIndex - 1 + items.length) % items.length;
        updateHeaderSuggestionFocus(items);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (headerActiveSuggestionIndex >= 0 && headerActiveSuggestionIndex < items.length) {
            const query = items[headerActiveSuggestionIndex].getAttribute('data-query');
            completeHeaderSearch(query);
        } else {
            const input = document.getElementById('header-search-input');
            const q = input ? input.value.trim() : '';
            if (q) {
                completeHeaderSearch(q);
            } else {
                closeHeaderSearchSuggestions();
            }
        }
    } else if (e.key === 'Escape') {
        closeHeaderSearchSuggestions();
    }
}

function updateHeaderSuggestionFocus(items) {
    items.forEach((item, idx) => {
        if (idx === headerActiveSuggestionIndex) {
            item.classList.add('is-focused');
            item.scrollIntoView({ block: 'nearest' });
            const previewQuery = item.getAttribute('data-query');
            const input = document.getElementById('header-search-input');
            if (input && previewQuery) {
                input.value = previewQuery;
            }
        } else {
            item.classList.remove('is-focused');
        }
    });
}

function onSearchInput(val) {
    const headerInput = document.getElementById('header-search-input');
    if (headerInput && headerInput.value !== val) {
        headerInput.value = val;
    }
    const headerClear = document.getElementById('header-search-clear-btn');
    if (headerClear) headerClear.style.display = val ? 'flex' : 'none';
    onFilterCriteriaChange();
    renderSearchSuggestions(val);
}

function onSearchFocus() {
    const input = document.getElementById('camera-search-input');
    renderSearchSuggestions(input ? input.value : '');
}

function renderSearchSuggestions(query) {
    const dropdown = document.getElementById('search-suggestions-dropdown');
    const input = document.getElementById('camera-search-input');
    if (!dropdown || !input) return;

    const q = (query || '').trim().toLowerCase();
    activeSuggestionIndex = -1;

    let matches = [];
    let headerText = 'RECOMMENDED SEARCHES';
    let headerHint = 'Click or press Enter';

    if (!q) {
        // Default popular suggestions when empty
        headerText = 'POPULAR SEARCHES';
        headerHint = 'Quick filters';
        matches = [
            searchSuggestionsData[0],  // iDADA ID-Q2i35S-TD Bestseller
            searchSuggestionsData[30], // Trueview Brand
            searchSuggestionsData[33], // Wi-Fi Cameras
            searchSuggestionsData[34], // 4G SIM Cameras
            searchSuggestionsData[35], // PoE Switches
            searchSuggestionsData[1],  // CP PLUS CP-E28Q
            searchSuggestionsData[39]  // Night Vision
        ];
    } else {
        headerText = `SUGGESTIONS FOR "${q.toUpperCase()}"`;
        headerHint = 'Navigate with Arrow keys';
        matches = searchSuggestionsData.filter(item => {
            if (item.title.toLowerCase().includes(q)) return true;
            if (item.query.toLowerCase().includes(q)) return true;
            if (item.sub.toLowerCase().includes(q)) return true;
            return item.keywords.some(kw => kw.includes(q));
        });
    }

    if (matches.length === 0) {
        dropdown.innerHTML = `
            <div class="suggestion-header">
                <span>NO DIRECT MATCHES</span>
                <span class="suggestion-header-hint">Press Enter</span>
            </div>
            <div class="suggestion-empty">
                No products found directly matching "<strong>${escapeHtml(q)}</strong>".<br>
                <div style="margin-top: 10px;">
                    <button type="button" class="slide-buy-btn" style="font-size: 0.72rem; padding: 6px 14px; background: var(--base-dark); color: #ffffff;" onclick="completeSearch('${escapeHtml(q)}')">
                        <span>SEARCH WHOLE CATALOG</span>
                    </button>
                </div>
            </div>
        `;
        dropdown.classList.add('open');
        input.setAttribute('aria-expanded', 'true');
        return;
    }

    const itemsHtml = matches.slice(0, 7).map((item, index) => {
        const highlightedTitle = highlightSearchQuery(item.title, q);
        return `
            <div class="suggestion-item" role="option" id="suggestion-opt-${index}" data-index="${index}" data-query="${escapeHtml(item.query)}" onclick="completeSearch('${escapeHtml(item.query)}')">
                <div class="suggestion-left">
                    <span class="suggestion-tag tag-${item.tag}">[ ${item.tagLabel} ]</span>
                    <div class="suggestion-text-wrap">
                        <span class="suggestion-title">${highlightedTitle}</span>
                        <span class="suggestion-sub">${escapeHtml(item.sub)}</span>
                    </div>
                </div>
                <span class="suggestion-action-hint">SELECT</span>
            </div>
        `;
    }).join('');

    dropdown.innerHTML = `
        <div class="suggestion-header">
            <span>${headerText}</span>
            <span class="suggestion-header-hint">${headerHint}</span>
        </div>
        <div class="suggestion-list">
            ${itemsHtml}
        </div>
    `;

    dropdown.classList.add('open');
    input.setAttribute('aria-expanded', 'true');
}

function completeSearch(query) {
    const input = document.getElementById('camera-search-input');
    if (input) input.value = query;
    const headerInput = document.getElementById('header-search-input');
    if (headerInput) headerInput.value = query;
    const clearBtn = document.getElementById('header-search-clear-btn');
    if (clearBtn) clearBtn.style.display = query ? 'flex' : 'none';
    const cameraClear = document.getElementById('search-clear-btn');
    if (cameraClear) cameraClear.style.display = query ? 'inline-flex' : 'none';

    closeSearchSuggestions();
    closeHeaderSearchSuggestions();
    onFilterCriteriaChange();

    const camerasSection = document.getElementById('cameras');
    if (camerasSection) {
        camerasSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function closeSearchSuggestions() {
    const dropdown = document.getElementById('search-suggestions-dropdown');
    const input = document.getElementById('camera-search-input');
    if (dropdown) dropdown.classList.remove('open');
    if (input) input.setAttribute('aria-expanded', 'false');
    activeSuggestionIndex = -1;
}

function onSearchKeyDown(e) {
    const dropdown = document.getElementById('search-suggestions-dropdown');
    if (!dropdown || !dropdown.classList.contains('open')) return;

    const items = dropdown.querySelectorAll('.suggestion-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeSuggestionIndex = (activeSuggestionIndex + 1) % items.length;
        updateSuggestionFocus(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeSuggestionIndex = (activeSuggestionIndex - 1 + items.length) % items.length;
        updateSuggestionFocus(items);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < items.length) {
            const query = items[activeSuggestionIndex].getAttribute('data-query');
            completeSearch(query);
        } else {
            const input = document.getElementById('camera-search-input');
            const q = input ? input.value.trim() : '';
            if (q) {
                completeSearch(q);
            } else {
                closeSearchSuggestions();
            }
        }
    } else if (e.key === 'Tab') {
        if (items.length > 0) {
            e.preventDefault();
            const firstQuery = items[0].getAttribute('data-query');
            const input = document.getElementById('camera-search-input');
            if (input) {
                input.value = firstQuery;
                renderSearchSuggestions(firstQuery);
            }
        }
    } else if (e.key === 'Escape') {
        closeSearchSuggestions();
    }
}

function updateSuggestionFocus(items) {
    items.forEach((item, idx) => {
        if (idx === activeSuggestionIndex) {
            item.classList.add('is-focused');
            item.scrollIntoView({ block: 'nearest' });
            const previewQuery = item.getAttribute('data-query');
            const input = document.getElementById('camera-search-input');
            if (input && previewQuery) {
                input.value = previewQuery;
            }
        } else {
            item.classList.remove('is-focused');
        }
    });
}

function highlightSearchQuery(text, query) {
    if (!query) return escapeHtml(text);
    const escapedQ = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQ})`, 'gi');
    return escapeHtml(text).replace(regex, '<mark class="search-match">$1</mark>');
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Close search suggestions on clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.header-search-field')) {
        closeHeaderSearchSuggestions();
    }
    if (!e.target.closest('.filter-search-field')) {
        closeSearchSuggestions();
    }
});

function clearSearch() {
    const searchInput = document.getElementById('camera-search-input');
    const clearBtn = document.getElementById('search-clear-btn');
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    closeSearchSuggestions();
    onFilterCriteriaChange();
}

function removeFilterTag(type, value) {
    if (type === 'brand') {
        const cb = document.querySelector(`input[name="brand"][value="${value}"]`);
        if (cb) cb.checked = false;
    } else if (type === 'category') {
        const cb = document.querySelector(`input[name="category"][value="${value}"]`);
        if (cb) cb.checked = false;
    } else if (type === 'feature') {
        const cb = document.querySelector(`input[name="feature"][value="${value}"]`);
        if (cb) cb.checked = false;
    } else if (type === 'search') {
        clearSearch();
        return;
    } else if (type === 'price') {
        const slider = document.getElementById('price-range-slider');
        const display = document.getElementById('price-max-display');
        if (slider) slider.value = 12000;
        if (display) display.textContent = 'Up to ₹12,000';
    }
    onFilterCriteriaChange();
}

function onFilterCriteriaChange() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    const cards = initialProductCards.length > 0 ? initialProductCards : Array.from(grid.querySelectorAll('.product-card'));

    const selectedBrands = Array.from(document.querySelectorAll('input[name="brand"]:checked')).map(cb => cb.value.toLowerCase());
    const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value.toLowerCase());
    const selectedFeatures = Array.from(document.querySelectorAll('input[name="feature"]:checked')).map(cb => cb.value.toLowerCase());

    const slider = document.getElementById('price-range-slider');
    const maxPrice = slider ? parseInt(slider.value, 10) : 12000;

    const searchInput = document.getElementById('camera-search-input');
    const clearBtn = document.getElementById('search-clear-btn');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (clearBtn) {
        clearBtn.style.display = query ? 'inline-flex' : 'none';
    }

    const sortSelect = document.getElementById('refine-sort');
    const sortOption = sortSelect ? sortSelect.value : 'featured';

    let matchedCards = [];

    cards.forEach(card => {
        const brand = (card.getAttribute('data-brand') || '').toLowerCase();
        const category = (card.getAttribute('data-category') || '').toLowerCase();
        const features = (card.getAttribute('data-features') || '').toLowerCase();
        const price = parseInt(card.getAttribute('data-price') || '0', 10);
        const name = (card.getAttribute('data-name') || '').toLowerCase();
        const textContent = card.innerText.toLowerCase();

        const matchBrand = (selectedBrands.length === 0 || selectedBrands.includes(brand)) && (typeof currentTextBrand === 'undefined' || currentTextBrand === 'all' || brand === currentTextBrand);
        const matchCategory = (selectedCategories.length === 0 || selectedCategories.includes(category)) && (typeof currentTextCategory === 'undefined' || currentTextCategory === 'all' || category === currentTextCategory);
        const matchFeatures = (selectedFeatures.length === 0 || selectedFeatures.every(f => features.includes(f)));
        const matchPrice = (price <= maxPrice);
        const matchSearch = (!query || name.includes(query) || textContent.includes(query) || brand.includes(query) || category.includes(query));

        if (matchBrand && matchCategory && matchFeatures && matchPrice && matchSearch) {
            card.style.display = 'flex';
            matchedCards.push(card);
        } else {
            card.style.display = 'none';
        }
    });

    if (sortOption === 'price-asc') {
        matchedCards.sort((a, b) => parseInt(a.getAttribute('data-price'), 10) - parseInt(b.getAttribute('data-price'), 10));
    } else if (sortOption === 'price-desc') {
        matchedCards.sort((a, b) => parseInt(b.getAttribute('data-price'), 10) - parseInt(a.getAttribute('data-price'), 10));
    } else if (sortOption === 'rating') {
        matchedCards.sort((a, b) => parseFloat(b.getAttribute('data-rating') || '0') - parseFloat(a.getAttribute('data-rating') || '0'));
    } else if (sortOption === 'name') {
        matchedCards.sort((a, b) => (a.getAttribute('data-name') || '').localeCompare(b.getAttribute('data-name') || ''));
    }

    // Unified Clean Architecture (Desktop & Mobile): Brand Showrooms by Default, Uncrowded Grid when Filtering
    const isSearching = Boolean(query && query.trim().length > 0);
    const hasCategoryFilter = selectedCategories.length > 0 && !selectedCategories.includes('all');
    const hasBrandFilter = selectedBrands.length > 0 && !selectedBrands.includes('all');
    const hasFeatureFilter = selectedFeatures.length > 0;
    const hasPriceFilter = maxPrice < 50000;
    const isFiltering = isSearching || hasCategoryFilter || hasBrandFilter || hasFeatureFilter || hasPriceFilter || Boolean(window.forceFullCatalogGrid);

    const showroomsEl = document.getElementById('mobile-brand-showrooms');
    const statusBar = document.querySelector('.ecom-status-bar');
    const productsHeader = document.querySelector('.products-header');
    const textFilterSuite = document.getElementById('text-filter-suite');
    const sidebarFilters = document.querySelector('.sidebar-filters');

    if (isFiltering) {
        // User is searching or filtering: Show clean uncrowded product grid, hide showrooms
        if (showroomsEl) showroomsEl.style.display = 'none';
        grid.style.display = 'grid';
        grid.classList.add('is-searching');
        if (statusBar) {
            statusBar.style.display = 'flex';
            const countElem = document.getElementById('filtered-count-num');
            if (countElem) countElem.textContent = matchedCards.length;
        }
        matchedCards.forEach(card => {
            card.style.display = 'flex';
            grid.appendChild(card);
        });
        cards.forEach(card => {
            if (!matchedCards.includes(card)) card.style.display = 'none';
        });
        if (typeof gsap !== 'undefined' && matchedCards.length > 0) {
            gsap.killTweensOf(cards);
            gsap.fromTo(matchedCards,
                { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: 0.3, stagger: 0.02, ease: 'power2.out', clearProps: 'transform,opacity' }
            );
        }
    } else {
        // Default Clean View: Show Curated Brand Showrooms, Hide Giant Crowded Listing
        if (showroomsEl) showroomsEl.style.display = 'flex';
        grid.style.display = 'none';
        grid.classList.remove('is-searching');
        if (statusBar) statusBar.style.display = 'none';
        cards.forEach(card => {
            card.style.display = 'none';
        });
    }

    const emptyNotice = document.getElementById('catalog-no-results');
    if (emptyNotice) {
        emptyNotice.style.display = matchedCards.length === 0 ? 'block' : 'none';
    }

    renderActiveFilterChips(selectedBrands, selectedCategories, selectedFeatures, maxPrice, query);
}

function renderActiveFilterChips(selectedBrands, selectedCategories, selectedFeatures, maxPrice, query) {
    const container = document.getElementById('filter-active-tags');
    if (!container) return;

    const brandNames = {
        'trueview': 'Trueview',
        'idada': 'iDADA',
        'cpplus': 'CP PLUS'
    };

    const categoryNames = {
        'wifi-camera': 'Wi-Fi Cameras',
        '4g-camera': '4G SIM Cameras',
        'ahd-camera': 'AHD Cameras',
        'nvr-dvr': 'NVRs & DVRs',
        'poe-switch': 'PoE Switches',
        'router': '4G Routers',
        'solar-hub': 'Solar Power Hub',
        'doorbell': 'Video Doorbell'
    };

    const featureNames = {
        'color-vision': 'Night Vision / Dual Light',
        'pan-tilt': 'Pan & Tilt (360°)',
        '2-way-audio': '2-Way Audio',
        'weatherproof': 'Weatherproof IP65/66',
        'sim-slot': '4G / 5G SIM Slot',
        'poe-gigabit': 'Gigabit PoE'
    };

    let chipsHtml = '';

    selectedBrands.forEach(b => {
        chipsHtml += `
            <span class="active-tag-chip">
                <span>Brand: ${brandNames[b] || b}</span>
                <button type="button" class="remove-chip-btn" onclick="removeFilterTag('brand', '${b}')" title="Remove brand filter">✕</button>
            </span>
        `;
    });

    selectedCategories.forEach(c => {
        chipsHtml += `
            <span class="active-tag-chip">
                <span>Category: ${categoryNames[c] || c}</span>
                <button type="button" class="remove-chip-btn" onclick="removeFilterTag('category', '${c}')" title="Remove category filter">✕</button>
            </span>
        `;
    });

    selectedFeatures.forEach(f => {
        chipsHtml += `
            <span class="active-tag-chip">
                <span>Feature: ${featureNames[f] || f}</span>
                <button type="button" class="remove-chip-btn" onclick="removeFilterTag('feature', '${f}')" title="Remove feature filter">✕</button>
            </span>
        `;
    });

    if (maxPrice < 12000) {
        chipsHtml += `
            <span class="active-tag-chip">
                <span>Max: ₹${maxPrice.toLocaleString('en-IN')}</span>
                <button type="button" class="remove-chip-btn" onclick="removeFilterTag('price', '')" title="Reset price filter">✕</button>
            </span>
        `;
    }

    if (query) {
        chipsHtml += `
            <span class="active-tag-chip">
                <span>Search: "${query}"</span>
                <button type="button" class="remove-chip-btn" onclick="removeFilterTag('search', '')" title="Clear search query">✕</button>
            </span>
        `;
    }

    container.innerHTML = chipsHtml;
}

// ==========================================================================
// 5.5 MULTI-ANGLE HARDWARE IMAGE SWITCHER (CARD LEVEL)
// ==========================================================================
function setProductImage(thumbElem, imgIndex, e) {
    if (e && e.stopPropagation) {
        e.stopPropagation();
    }
    const wrap = thumbElem.closest('.product-visual-wrap');
    if (!wrap) return;
    const imagesStr = wrap.getAttribute('data-images');
    if (!imagesStr) return;
    try {
        const images = JSON.parse(imagesStr);
        if (imgIndex < 0 || imgIndex >= images.length) return;
        const img = wrap.querySelector('.product-card-img');
        if (img) {
            img.src = images[imgIndex];
            wrap.setAttribute('data-current-index', imgIndex);
        }
        const thumbs = wrap.querySelectorAll('.gallery-thumb');
        thumbs.forEach((t, i) => {
            if (i === imgIndex) t.classList.add('active');
            else t.classList.remove('active');
        });
    } catch (err) {}
}

function cycleProductImage(btnElem, delta, e) {
    if (e && e.stopPropagation) {
        e.stopPropagation();
    }
    const wrap = btnElem.closest('.product-visual-wrap');
    if (!wrap) return;
    const imagesStr = wrap.getAttribute('data-images');
    if (!imagesStr) return;
    try {
        const images = JSON.parse(imagesStr);
        const currentIndex = parseInt(wrap.getAttribute('data-current-index') || '0', 10);
        const newIndex = (currentIndex + delta + images.length) % images.length;
        const img = wrap.querySelector('.product-card-img');
        if (img) {
            img.src = images[newIndex];
            wrap.setAttribute('data-current-index', newIndex);
        }
        const thumbs = wrap.querySelectorAll('.gallery-thumb');
        thumbs.forEach((t, i) => {
            if (i === newIndex) t.classList.add('active');
            else t.classList.remove('active');
        });
    } catch (err) {}
}

// ==========================================================================
// 5.6 PRODUCT QUICK-VIEW & MULTI-ANGLE DETAIL MODAL WINDOW
// ==========================================================================
let modalActiveImages = [];
let modalActiveImageIndex = 0;
let modalActiveProductTitle = '';
let modalActiveProductPrice = 0;

function openProductModalFromCard(cardElem) {
    if (!cardElem) return;

    // 1. Extract Details from Card
    const titleElem = cardElem.querySelector('.product-card-title');
    const brandTag = cardElem.querySelector('.product-brand-tag');
    const badgeElem = cardElem.querySelector('.product-badge');
    const ratingVal = cardElem.querySelector('.rating-val');
    const reviewCount = cardElem.querySelector('.review-count');
    const mrpElem = cardElem.querySelector('.mrp-strikethrough');
    const saveElem = cardElem.querySelector('.discount-badge');
    const priceElem = cardElem.querySelector('.price-amount');
    const descElem = cardElem.querySelector('.product-card-desc');
    const chipsElem = cardElem.querySelector('.product-specs-chips');
    const visualWrap = cardElem.querySelector('.product-visual-wrap');
    const primaryImg = cardElem.querySelector('.product-card-img');

    const title = titleElem ? titleElem.textContent.trim() : (cardElem.getAttribute('data-name') || 'Syber Space Hardware');
    const brand = brandTag ? brandTag.textContent.trim() : (cardElem.getAttribute('data-brand') || 'CERTIFIED HARDWARE');
    const badgeText = badgeElem ? badgeElem.textContent.trim() : 'VERIFIED HARDWARE';
    const rating = ratingVal ? ratingVal.textContent.trim() : '4.9';
    const reviews = reviewCount ? reviewCount.textContent.trim() : '(Verified Partner)';
    const mrp = mrpElem ? mrpElem.textContent.trim() : '';
    const save = saveElem ? saveElem.textContent.trim() : '';
    const priceText = priceElem ? priceElem.textContent.trim() : (cardElem.getAttribute('data-price') ? `₹${cardElem.getAttribute('data-price')}` : '₹1,850');
    const priceNum = parseInt(priceText.replace(/[^0-9]/g, ''), 10) || 1850;
    const desc = descElem ? descElem.textContent.trim() : '';

    // 2. Extract Multi-Angle Image Array
    let images = [];
    if (visualWrap) {
        const imagesStr = visualWrap.getAttribute('data-images');
        if (imagesStr) {
            try {
                images = JSON.parse(imagesStr);
            } catch (err) {
                images = [];
            }
        }
    }
    if (!images || images.length === 0) {
        if (primaryImg && primaryImg.src) {
            images = [primaryImg.src];
        } else {
            images = ['assets/idada_q2i35s_1.jpg'];
        }
    }

    // Get currently active index on card if set
    let activeIdx = 0;
    if (visualWrap) {
        activeIdx = parseInt(visualWrap.getAttribute('data-current-index') || '0', 10);
        if (activeIdx < 0 || activeIdx >= images.length) activeIdx = 0;
    }

    modalActiveImages = images;
    modalActiveImageIndex = activeIdx;
    modalActiveProductTitle = title;
    modalActiveProductPrice = priceNum;

    // 3. Populate Modal DOM Fields
    const modalBrand = document.getElementById('modal-p-brand');
    const modalBadge = document.getElementById('modal-p-badge');
    const modalTitle = document.getElementById('modal-p-title');
    const modalRating = document.getElementById('modal-p-rating');
    const modalReviews = document.getElementById('modal-p-reviews');
    const modalMrp = document.getElementById('modal-p-mrp');
    const modalSave = document.getElementById('modal-p-save');
    const modalPrice = document.getElementById('modal-p-price');
    const modalDesc = document.getElementById('modal-p-desc');
    const modalChips = document.getElementById('modal-p-chips');

    if (modalBrand) modalBrand.textContent = brand;
    if (modalBadge) modalBadge.textContent = badgeText;
    if (modalTitle) modalTitle.textContent = title;
    if (modalRating) modalRating.textContent = rating;
    if (modalReviews) modalReviews.textContent = reviews;
    if (modalMrp) {
        modalMrp.textContent = mrp;
        modalMrp.style.display = mrp ? 'inline' : 'none';
    }
    if (modalSave) {
        modalSave.textContent = save;
        modalSave.style.display = save ? 'inline-block' : 'none';
    }
    if (modalPrice) modalPrice.textContent = priceText;
    if (modalDesc) modalDesc.textContent = desc;

    // Populate Specs Chips
    if (modalChips) {
        if (chipsElem) {
            modalChips.innerHTML = chipsElem.innerHTML;
        } else {
            modalChips.innerHTML = '';
        }
    }

    // Configure Slider Controls (Show/Hide Arrows & Thumbnails based on image count)
    const prevArrow = document.querySelector('.modal-slider-arrow.prev');
    const nextArrow = document.querySelector('.modal-slider-arrow.next');
    const counterElem = document.getElementById('modal-angle-counter');
    const thumbsRow = document.getElementById('modal-thumbs-row');

    if (images.length > 1) {
        if (prevArrow) prevArrow.style.display = 'flex';
        if (nextArrow) nextArrow.style.display = 'flex';
        if (counterElem) counterElem.style.display = 'inline-block';
        if (thumbsRow) {
            thumbsRow.style.display = 'flex';
            let thumbsHtml = '';
            images.forEach((imgUrl, i) => {
                const isActive = i === activeIdx ? 'active' : '';
                thumbsHtml += `<button type="button" class="modal-thumb-btn ${isActive}" onclick="setModalProductImage(${i})" aria-label="Angle ${i+1}">
                    <img src="${imgUrl}" alt="${title} Angle ${i+1}">
                </button>`;
            });
            thumbsRow.innerHTML = thumbsHtml;
        }
    } else {
        if (prevArrow) prevArrow.style.display = 'none';
        if (nextArrow) nextArrow.style.display = 'none';
        if (counterElem) counterElem.style.display = 'none';
        if (thumbsRow) thumbsRow.style.display = 'none';
    }

    // Set Initial Active Image
    setModalProductImage(activeIdx);

    // Bind Modal Actions
    const cartBtn = document.getElementById('modal-btn-cart');
    if (cartBtn) {
        cartBtn.onclick = () => {
            addToCart(title, priceNum, modalActiveImages[0]);
        };
    }

    const payBtn = document.getElementById('modal-btn-paynow');
    if (payBtn) {
        payBtn.onclick = () => {
            closeProductModal();
            payNowDirect(title, priceNum, modalActiveImages[0]);
        };
    }

    // Open Modal
    const modal = document.getElementById('product-detail-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function setModalProductImage(index) {
    if (!modalActiveImages || modalActiveImages.length === 0) return;
    if (index < 0 || index >= modalActiveImages.length) return;

    modalActiveImageIndex = index;
    const imgElem = document.getElementById('modal-p-image');
    const counterElem = document.getElementById('modal-angle-counter');

    if (imgElem) {
        imgElem.classList.add('sliding');
        setTimeout(() => {
            imgElem.src = modalActiveImages[index];
            imgElem.classList.remove('sliding');
        }, 120);
    }

    if (counterElem) {
        const curr = String(index + 1).padStart(2, '0');
        const tot = String(modalActiveImages.length).padStart(2, '0');
        counterElem.textContent = `ANGLE ${curr} // ${tot}`;
    }

    const thumbBtns = document.querySelectorAll('.modal-thumb-btn');
    thumbBtns.forEach((btn, i) => {
        if (i === index) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

function cycleModalProductImage(delta) {
    if (!modalActiveImages || modalActiveImages.length <= 1) return;
    const newIdx = (modalActiveImageIndex + delta + modalActiveImages.length) % modalActiveImages.length;
    setModalProductImage(newIdx);
}

function closeProductModal(e) {
    if (e && e.target && e.target !== e.currentTarget && !e.target.classList.contains('product-modal-close')) {
        return;
    }
    const modal = document.getElementById('product-detail-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function openProductInNewTab() {
    if (!modalActiveProductTitle) return;
    const brandEl = document.getElementById('modal-p-brand');
    const badgeEl = document.getElementById('modal-p-badge');
    const mrpEl = document.getElementById('modal-p-mrp');
    const saveEl = document.getElementById('modal-p-save');
    const descEl = document.getElementById('modal-p-desc');
    const chipsEl = document.getElementById('modal-p-chips');

    const params = new URLSearchParams({
        name: modalActiveProductTitle,
        price: modalActiveProductPrice,
        brand: brandEl ? brandEl.textContent.trim() : '',
        badge: badgeEl ? badgeEl.textContent.trim() : '',
        mrp: mrpEl ? mrpEl.textContent.trim() : '',
        save: saveEl ? saveEl.textContent.trim() : '',
        desc: descEl ? descEl.textContent.trim() : '',
        chips: chipsEl ? chipsEl.innerText.replace(/\n+/g, ' • ').trim() : '',
        images: JSON.stringify(modalActiveImages)
    });
    window.open(`product.html?${params.toString()}`, '_blank');
}

// Global click delegation for opening the whole-window product page (Amazon preference)
document.addEventListener('click', (e) => {
    // If click was inside modal, let modal events handle it
    if (e.target.closest('#product-detail-modal')) return;

    const card = e.target.closest('.product-card');
    if (!card) return;

    // Check if the user clicked an action button, thumbnail, or link
    if (e.target.closest('.btn-add-cart') ||
        e.target.closest('.btn-pay-now-card') ||
        e.target.closest('.gallery-nav-btn') ||
        e.target.closest('.gallery-thumb') ||
        e.target.closest('a')) {
        return;
    }

    const titleElem = card.querySelector('.product-card-title');
    const title = titleElem ? titleElem.textContent.trim() : (card.getAttribute('data-name') || '');
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    window.location.href = `product.html?id=${slug}`;
});

// ==========================================================================
// 6. SHOPPING CART & NOTIFICATION TOAST
// ==========================================================================
let toastTimeout = null;

function addToCart(productName, price, imageSrc) {
    try {
        // Sound removed per specification

        const cartStr = localStorage.getItem('syber_cart') || '[]';
        let cart = JSON.parse(cartStr);

        const existing = cart.find(item => item.name === productName);
        if (existing) {
            existing.quantity = (existing.quantity || 1) + 1;
        } else {
            cart.push({
                name: productName,
                price: price,
                img: imageSrc,
                quantity: 1
            });
        }

        localStorage.setItem('syber_cart', JSON.stringify(cart));
        updateCartCountDisplay();
    onFilterCriteriaChange();
        const cartPills = document.querySelectorAll('.cart-pill');
        cartPills.forEach(pill => {
            pill.classList.remove('cart-pill-pulse');
            void pill.offsetWidth;
            pill.classList.add('cart-pill-pulse');
        });
    } catch (e) {
        console.error('Error adding to cart:', e);
    }
}


function payNowDirect(productName, price, imageSrc) {
    try {
        const cartStr = localStorage.getItem('syber_cart') || '[]';
        let cart = JSON.parse(cartStr);

        const priceNum = typeof price === 'number' ? price : parseInt(String(price).replace(/[^0-9]/g, ''), 10) || 0;
        const existing = cart.find(item => item.name === productName);
        if (existing) {
            existing.quantity = (existing.quantity || 1) + 1;
        } else {
            cart.push({
                name: productName,
                price: priceNum,
                img: imageSrc || 'assets/idada_q2i35s_1.jpg',
                quantity: 1
            });
        }

        localStorage.setItem('syber_cart', JSON.stringify(cart));
        updateCartCountDisplay();
    onFilterCriteriaChange();

        // Immediate direct route into HDFC Multi-Rail Checkout Terminal
        window.location.href = 'cart.html?checkout=1';
    } catch (e) {
        console.error('Error in payNowDirect:', e);
        window.location.href = 'cart.html?checkout=1';
    }
}
window.payNowDirect = payNowDirect;

function updateCartCountDisplay() {
    try {
        const cartStr = localStorage.getItem('syber_cart') || '[]';
        const cart = JSON.parse(cartStr);
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

        const mbBadge = document.getElementById('mb-cart-badge');
        if (mbBadge) {
            mbBadge.textContent = String(totalItems);
            mbBadge.style.display = totalItems > 0 ? 'inline-flex' : 'none';
        }

        const headerBadge = document.getElementById('mobile-header-cart-badge');
        if (headerBadge) {
            headerBadge.textContent = String(totalItems);
        }

        const counterLabels = document.querySelectorAll('.cart-counter-label');
        counterLabels.forEach(label => {
            if (label.id === 'mobile-header-cart-badge') return;
            if (label.classList.contains('mobile-link')) {
                label.textContent = `Shopping Cart (${totalItems})`;
            } else {
                label.textContent = `Cart (${totalItems})`;
            }
        });
    } catch (e) {
        console.error('Error updating cart count:', e);
    }
}

function showSyberToast(title, subtitle) {
    // Big popup disabled per specification
}

// ==========================================================================
// 7. INTERACTIVE 10S VIBE CHECK MODAL
// ==========================================================================
const vibeRecommendations = {
    hotel: {
        name: "Trueview T38119-AE 32Ch 4K NVR",
        badge: "COMMERCIAL NVR SYSTEM",
        price: "₹7,500",
        savings: "Save 37% • In Stock",
        desc: "32-channel 4K NVR with dual SATA 16TB capacity for multi-camera commercial setups.",
        searchQuery: "T38119-AE"
    },
    night: {
        name: "iDADA ID-Q2i35S-TD 3MP Smart PT",
        badge: "RECOMMENDED SYSTEM",
        price: "₹1,850",
        savings: "Save 44% • In Stock",
        desc: "3MP motorized pan & tilt Wi-Fi camera with two-way audio, infrared night vision, and humanoid motion detection.",
        searchQuery: "iDADA ID-Q2i35S-TD"
    },
    villa: {
        name: "Trueview T18295S 3MP IP66 Bullet",
        badge: "OUTDOOR PERIMETER",
        price: "₹2,250",
        savings: "Save 39% • In Stock",
        desc: "IP66 weatherproof outdoor bullet camera with dual-light night vision and motion alerts.",
        searchQuery: "T18295S"
    },
    apartment: {
        name: "CP PLUS Ezykam CP-E28Q 2MP PT",
        badge: "INDOOR 360°",
        price: "₹1,980",
        savings: "Save 36% • In Stock",
        desc: "1080p Full HD camera with 360° pan-tilt, two-way audio, and motion tracking.",
        searchQuery: "CP PLUS CP-E28Q"
    },
    farm: {
        name: "Trueview T18291SF 4G Mini PT IP65",
        badge: "4G SIM SOLAR PTZ",
        price: "₹3,200",
        savings: "Save 36% • In Stock",
        desc: "Standalone 4G SIM camera with 360° pan-tilt coverage and full-color night vision without broadband.",
        searchQuery: "T18291SF"
    },
    retail: {
        name: "Trueview T18294S 3MP Smart Dome",
        badge: "RETAIL & CASH COUNTER",
        price: "₹2,150",
        savings: "Save 39% • In Stock",
        desc: "Wide-angle 3MP ceiling dome camera with two-way audio for counters and offices.",
        searchQuery: "T18294S"
    }
};

let currentVibeMatch = null;

function openVibeCheckModal() {
    const modal = document.getElementById('vibe-modal-overlay');
    if (!modal) return;
    modal.classList.add('active');
    resetVibeCheck();

    if (typeof gsap !== 'undefined') {
        const card = modal.querySelector('.vibe-modal-card');
        gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
        if (card) {
            gsap.fromTo(card,
                { opacity: 0, scale: 0.92, y: 20 },
                { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(1.3)', clearProps: 'transform,opacity' }
            );
        }
    }
}

function closeVibeCheckModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('vibe-modal-overlay');
    if (!modal) return;

    if (typeof gsap !== 'undefined') {
        const card = modal.querySelector('.vibe-modal-card');
        if (card) {
            gsap.to(card, {
                opacity: 0,
                scale: 0.94,
                y: 12,
                duration: 0.2,
                ease: 'power2.in'
            });
        }
        gsap.to(modal, {
            opacity: 0,
            duration: 0.22,
            ease: 'power2.in',
            onComplete: () => {
                modal.classList.remove('active');
                if (card) gsap.set(card, { clearProps: 'all' });
                gsap.set(modal, { clearProps: 'all' });
            }
        });
    } else {
        modal.classList.remove('active');
    }
}

function resetVibeCheck() {
    const step1 = document.getElementById('vibe-step-1');
    const resultBox = document.getElementById('vibe-result-box');
    if (step1) {
        step1.style.display = 'block';
        if (typeof gsap !== 'undefined') {
            gsap.set(step1, { opacity: 1, y: 0, x: 0 });
        }
    }
    if (resultBox) resultBox.style.display = 'none';
    currentVibeMatch = null;
}

function selectVibeOption(spaceKey) {
    const match = vibeRecommendations[spaceKey] || vibeRecommendations.night;
    currentVibeMatch = match;

    const step1 = document.getElementById('vibe-step-1');
    const resultBox = document.getElementById('vibe-result-box');
    const badgeEl = document.getElementById('vibe-match-badge');
    const nameEl = document.getElementById('vibe-match-name');
    const descEl = document.getElementById('vibe-match-desc');
    const priceEl = document.getElementById('vibe-match-price');
    const savingsEl = document.getElementById('vibe-match-savings');

    const switchContent = () => {
        if (step1) step1.style.display = 'none';
        if (badgeEl) badgeEl.textContent = match.badge;
        if (nameEl) nameEl.textContent = match.name;
        if (descEl) descEl.textContent = match.desc;
        if (priceEl) priceEl.textContent = match.price;
        if (savingsEl) savingsEl.textContent = match.savings;
        if (resultBox) {
            resultBox.style.display = 'block';
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(resultBox,
                    { opacity: 0, y: 16, scale: 0.97 },
                    { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power2.out', clearProps: 'transform,opacity' }
                );
            }
        }
    };

    if (typeof gsap !== 'undefined' && step1) {
        gsap.to(step1, {
            opacity: 0,
            y: -10,
            duration: 0.18,
            ease: 'power2.in',
            onComplete: switchContent
        });
    } else {
        switchContent();
    }
}

function inquireVibeWhatsApp() {
    if (!currentVibeMatch) return;
    const msg = encodeURIComponent(`Hello Syber Space, I would like to inquire about "${currentVibeMatch.name}" (${currentVibeMatch.price}). Please share pricing and availability.`);
    window.open(`https://wa.me/917511180808?text=${msg}`, '_blank');
}

function applyVibeRecommendation() {
    if (!currentVibeMatch) return;

    closeVibeCheckModal();

    resetSidebarFilters();
    const searchInput = document.getElementById('camera-search-input');
    if (searchInput) {
        searchInput.value = currentVibeMatch.searchQuery || currentVibeMatch.name;
    }
    onFilterCriteriaChange();

    const camerasSection = document.getElementById('cameras');
    if (camerasSection) {
        camerasSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Filter toast disabled
}

// =============================================================================
// AMAZON-STYLE TEXT FILTER ENGINE (CATEGORY & BRAND PILLS)
// =============================================================================
let currentTextCategory = 'all';
let currentTextBrand = 'all';

function selectTextCategory(cat, btn) {
    currentTextCategory = cat.toLowerCase();
    document.querySelectorAll('.text-cat-pill').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    
    // Sync with sidebar category checkboxes if present
    document.querySelectorAll('input[name="category"]').forEach(cb => {
        if (currentTextCategory === 'all') {
            cb.checked = false;
        } else {
            cb.checked = (cb.value.toLowerCase() === currentTextCategory);
        }
    });

    onFilterCriteriaChange();
}

function selectTextBrand(brand, btn) {
    currentTextBrand = brand.toLowerCase();
    document.querySelectorAll('.text-brand-pill').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    // Sync with sidebar brand checkboxes if present
    document.querySelectorAll('input[name="brand"]').forEach(cb => {
        if (currentTextBrand === 'all') {
            cb.checked = false;
        } else {
            cb.checked = (cb.value.toLowerCase() === currentTextBrand);
        }
    });

    onFilterCriteriaChange();
}


// =============================================================================
// AMAZON-STYLE MOBILE SEARCH & FILTER ENGINE
// =============================================================================
function syncMobileSearch(val) {
    const desktopInput = document.getElementById('camera-search-input');
    const headerInput = document.getElementById('header-search-input');
    const clearBtn = document.getElementById('mobile-search-clear');
    if (desktopInput) desktopInput.value = val;
    if (headerInput) headerInput.value = val;
    if (clearBtn) clearBtn.style.display = val ? 'inline-flex' : 'none';

    if (val && val.trim().length >= 2) {
        const qLower = val.trim().toLowerCase();
        let targetBrand = null;
        if (/trueview|t18291|solar|poe|switch|router/.test(qLower)) targetBrand = 'trueview';
        else if (/cp\s*plus|cpplus|ezykam|cp-e|cp-z/.test(qLower)) targetBrand = 'cpplus';
        else if (/idada|q2i35s|1850/.test(qLower)) targetBrand = 'idada';
        else if (/cable|cat6|smps|hdd|hard drive|junction|accessory|accessories/.test(qLower)) targetBrand = 'accessories';

        if (targetBrand) {
            scrollToShowroom(targetBrand, null, null);
        }
    }
}

function clearMobileSearch() {
    const mobileInput = document.getElementById('mobile-search-input');
    const desktopInput = document.getElementById('camera-search-input');
    const headerInput = document.getElementById('header-search-input');
    const clearBtn = document.getElementById('mobile-search-clear');
    if (mobileInput) mobileInput.value = '';
    if (desktopInput) desktopInput.value = '';
    if (headerInput) headerInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    scrollToShowroom('all', null, null);
}

function quickFilterCategory(cat, btn) {
    scrollToShowroom(cat, btn, null);
}

// =============================================================================
// MOBILE BRAND SHOWROOM EXPLORATION & AUTO-TOGGLE
// =============================================================================
function openBrandCatalog(brandKey) {
    scrollToShowroom(brandKey, null, null);
}

window.viewAllProductsInGrid = function() {
    scrollToShowroom('all', null, null);
};

// =============================================================================
// GSAP ANIMATION ENGINE (APPEARANCES & DISAPPEARANCES)
// Native IntersectionObserver Triggers (Zero Scroll Sensitivity / 100% Native Physics)
// =============================================================================
function initGsapMagic() {
    if (typeof gsap === 'undefined') return;

    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    // 1. Hero Section Ambient Entrance on Load
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (document.querySelector('.hero-spec-ticker')) {
        heroTl.from('.hero-spec-ticker', {
            opacity: 0,
            y: -12,
            duration: 0.6,
            delay: 0.1,
            clearProps: 'transform,opacity'
        });
    }
    if (document.querySelector('.hero-title')) {
        heroTl.from('.hero-title', {
            opacity: 0,
            y: 20,
            duration: 0.7,
            clearProps: 'transform,opacity'
        }, '-=0.35');
    }
    if (document.querySelector('.hero-footer-row')) {
        heroTl.from('.hero-footer-row', {
            opacity: 0,
            y: 15,
            duration: 0.6,
            clearProps: 'transform,opacity'
        }, '-=0.35');
    }

    // Helper: Observe element and trigger entrance once without touching window scroll
    const triggerOnScroll = (selector, animateFn, threshold = 0.12) => {
        const elements = typeof selector === 'string' ? document.querySelectorAll(selector) : [selector];
        if (!elements || elements.length === 0) return;

        if (!('IntersectionObserver' in window)) {
            elements.forEach(animateFn);
            return;
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateFn(entry.target);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold });

        elements.forEach(el => {
            if (el) observer.observe(el);
        });
    };

    // 2. Mobile Brand Showrooms (reveal per card)
    triggerOnScroll('.m-brand-showroom-card', (card) => {
        gsap.fromTo(card,
            { opacity: 0, y: 26 },
            { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', clearProps: 'transform,opacity' }
        );
    }, 0.1);

    // 3. About Us Section Split Reveal
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
        triggerOnScroll(aboutSection, () => {
            const textCol = aboutSection.querySelector('.about-text-col');
            const feedCard = aboutSection.querySelector('.about-security-feed');
            if (textCol) {
                gsap.fromTo(textCol,
                    { opacity: 0, x: -24 },
                    { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out', clearProps: 'transform,opacity' }
                );
            }
            if (feedCard) {
                gsap.fromTo(feedCard,
                    { opacity: 0, scale: 0.95, y: 20 },
                    { opacity: 1, scale: 1, y: 0, duration: 0.75, delay: 0.1, ease: 'power3.out', clearProps: 'transform,opacity' }
                );
            }
        }, 0.15);
    }

    // 4. Why Us / Manifesto 4-Card Staggered Entrance
    const manifestoSection = document.getElementById('why-us');
    if (manifestoSection) {
        triggerOnScroll(manifestoSection, () => {
            const header = manifestoSection.querySelector('.manifesto-header');
            const cards = manifestoSection.querySelectorAll('.manifesto-card');
            if (header) {
                gsap.fromTo(header,
                    { opacity: 0, y: 18 },
                    { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', clearProps: 'transform,opacity' }
                );
            }
            if (cards.length > 0) {
                gsap.fromTo(cards,
                    { opacity: 0, y: 28 },
                    { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: 'power2.out', clearProps: 'transform,opacity' }
                );
            }
        }, 0.15);
    }

    // 5. Wholesale Concierge Section Reveal
    const wholesaleSection = document.getElementById('wholesale-concierge');
    if (wholesaleSection) {
        triggerOnScroll(wholesaleSection, (el) => {
            gsap.fromTo(el,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', clearProps: 'transform,opacity' }
            );
        }, 0.12);
    }
}
window.returnToShowrooms = function() {
    const headerInput = document.getElementById('header-search-input');
    if (headerInput) headerInput.value = '';
    const cameraInput = document.getElementById('camera-search-input');
    if (cameraInput) cameraInput.value = '';
    const mobileInput = document.getElementById('mobile-search-input');
    if (mobileInput) mobileInput.value = '';
    scrollToShowroom('all', null, null);
};


// =============================================================================
// HORIZONTAL SHOWROOM SHELF SLIDER CONTROLS
// =============================================================================
function slideShelf(id, direction) {
    const el = document.getElementById(id);
    if (el) {
        const scrollAmount = Math.max(el.clientWidth * 0.75, 260);
        el.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
}
window.slideShelf = slideShelf;
