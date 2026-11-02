// Wait for DOM
document.addEventListener("DOMContentLoaded", (event) => {
    // GSAP Plugins
    gsap.registerPlugin(ScrollTrigger);

    // Timecode removed per design update

    // GSAP Hero Animations
    gsap.from('.hero-video-wrapper', {
        scale: 0.95,
        duration: 1.2,
        ease: 'power3.out'
    });

    gsap.from('.hero-content', {
        y: 30,
        duration: 1,
        ease: 'power3.out'
    });

    // GSAP Scroll Animations - Products (Improved with batching)
    ScrollTrigger.batch('.product-card', {
        interval: 0.1,
        batchMax: 3,
        onEnter: batch => gsap.fromTo(batch, 
            {opacity: 0, y: 100}, 
            {opacity: 1, y: 0, stagger: 0.1, duration: 0.8, ease: 'power2.out', overwrite: true}
        ),
        start: 'top bottom-=100'
    });

    // GSAP Scroll Animations - About Us & Features
    gsap.from('.about-us-block', {
        scrollTrigger: {
            trigger: '.about-us-block',
            start: 'top bottom-=100'
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
    });

    gsap.from('.feature-text h2', {
        scrollTrigger: {
            trigger: '.feature-text h2',
            start: 'top bottom-=50'
        },
        scale: 0.8,
        opacity: 0,
        duration: 0.8,
        ease: 'back.out(1.7)'
    });

    // About Us Section GSAP Scroll Reveal
    const aboutBlock = document.querySelector('.about-us-block');
    if (aboutBlock) {
        gsap.from(aboutBlock, {
            scrollTrigger: {
                trigger: aboutBlock,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            y: 35,
            opacity: 0,
            duration: 0.9,
            ease: 'power3.out'
        });
    }

    // Marquee Scroll direction
    let mm = gsap.matchMedia();
    
    // Glitch effect on scroll
    gsap.to('h1.glitch', {
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true
        },
        y: -100,
        opacity: 0.5
    });

    // Unified Hero Surveillance Stage Logic (Video plays first -> Offers appear on the exact same spot)
    const videoSlide = document.getElementById('slide-video');
    const heroVideo = document.getElementById('hero-surveillance-video');
    const offerSlides = document.querySelectorAll('.stage-slide.offer-slide');
    const allStageSlides = document.querySelectorAll('.stage-slide');
    const prevBtn = document.getElementById('prev-slide');
    const nextBtn = document.getElementById('next-slide');
    const indicator = document.getElementById('slide-indicator');
    const btnReplayLive = document.getElementById('btn-replay-live');
    const stageModeTag = document.getElementById('stage-mode-tag');

    let currentSlideIdx = 0; // 0 = video, 1..5 = offers
    let slideshowTimer = null;
    let videoHasEnded = false;

    function activateSlide(idx) {
        currentSlideIdx = idx;
        allStageSlides.forEach(s => s.classList.remove('active'));
        allStageSlides[idx].classList.add('active');

        if (idx === 0) {
            // Live Video Active
            if (indicator) indicator.textContent = 'LIVE FEED';
            if (stageModeTag) stageModeTag.textContent = '[LIVE FEED]';
            if (btnReplayLive) btnReplayLive.classList.add('active-pill');

            if (heroVideo) {
                heroVideo.currentTime = 0;
                heroVideo.play().catch(() => {});
            }

            const videoText = allStageSlides[0].querySelector('.hero-text-overlay');
            if (videoText) {
                gsap.fromTo(videoText, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
            }
        } else {
            // Offer Slide Active (1..5 corresponds to offer 0..4)
            const offerNum = idx; // 1 to 5
            if (indicator) indicator.textContent = `0${offerNum} // 0${offerSlides.length}`;
            if (stageModeTag) stageModeTag.textContent = `[OFFER PROTOCOL 0${offerNum}]`;
            if (btnReplayLive) btnReplayLive.classList.remove('active-pill');

            const content = allStageSlides[idx].querySelector('.slide-content');
            if (content) {
                gsap.fromTo(content, 
                    { opacity: 0, x: -40, skewX: 8 }, 
                    { opacity: 1, x: 0, skewX: 0, duration: 0.45, ease: 'power2.out' }
                );
            }
        }
    }

    function advanceToNextOffer() {
        // Rotate among offers (1 to 5)
        let nextIdx = currentSlideIdx + 1;
        if (nextIdx > offerSlides.length) {
            nextIdx = 1; // loop back to first offer
        }
        activateSlide(nextIdx);
    }

    function startOffersAutoRotate() {
        clearInterval(slideshowTimer);
        slideshowTimer = setInterval(advanceToNextOffer, 4500);
    }

    function transitionFromVideoToOffers() {
        if (videoHasEnded) return;
        videoHasEnded = true;
        // Smooth transition to Offer 1 at the exact same spot
        activateSlide(1);
        startOffersAutoRotate();
    }

    // Video Lifecycle: "this video part will only play, then we need the offer at the same spot of the video"
    if (heroVideo) {
        // When video finishes playing naturally
        heroVideo.addEventListener('ended', () => {
            transitionFromVideoToOffers();
        });

        // Fail-safe: transition after 7.5 seconds if video duration is long or ended doesn't fire
        setTimeout(() => {
            if (currentSlideIdx === 0 && !videoHasEnded) {
                transitionFromVideoToOffers();
            }
        }, 7500);
    }

    // User controls
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            clearInterval(slideshowTimer);
            let nextIdx = (currentSlideIdx + 1) % allStageSlides.length;
            if (nextIdx === 0) nextIdx = 1; // skip video in quick next click, or cycle
            activateSlide(nextIdx);
            startOffersAutoRotate();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            clearInterval(slideshowTimer);
            let prevIdx = currentSlideIdx - 1;
            if (prevIdx < 1) prevIdx = offerSlides.length; // cycle offers
            activateSlide(prevIdx);
            startOffersAutoRotate();
        });
    }

    if (btnReplayLive) {
        btnReplayLive.addEventListener('click', () => {
            clearInterval(slideshowTimer);
            videoHasEnded = false;
            activateSlide(0);
        });
    }

    // Filtering Logic (Brand, Feature, Price, Search)
    const brandCheckboxes = document.querySelectorAll('.brand-filter');
    const featureCheckboxes = document.querySelectorAll('.feature-filter');
    const priceSlider = document.getElementById('price-slider');
    const priceDisplay = document.getElementById('price-display');
    const productCards = document.querySelectorAll('.product-card');
    const navSearchInput = document.getElementById('nav-search-input');

    function filterProducts() {
        const checkedBrands = Array.from(brandCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        const checkedFeatures = Array.from(featureCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        const maxPrice = parseFloat(priceSlider.value);
        const searchTerm = (navSearchInput ? navSearchInput.value : '').toLowerCase().trim();

        // Update price label with comma formatting
        if (priceDisplay) priceDisplay.innerText = maxPrice.toLocaleString('en-US');

        productCards.forEach(card => {
            const cardBrand = card.getAttribute('data-brand') || '';
            const cardPrice = parseFloat(card.getAttribute('data-price') || 0);
            const cardFeaturesStr = card.getAttribute('data-features') || '';
            const cardFeaturesArray = cardFeaturesStr.split(',');

            const titleText = (card.querySelector('h3')?.innerText || '').toLowerCase();
            const descText = (card.querySelector('p')?.innerText || '').toLowerCase();

            // Check Brand match
            const brandMatch = checkedBrands.length === 0 || checkedBrands.includes(cardBrand);

            // Check Feature match
            const featureMatch = checkedFeatures.every(feat => cardFeaturesArray.includes(feat));

            // Check Price match
            const priceMatch = cardPrice <= maxPrice;

            // Check Search match
            const searchMatch = !searchTerm || titleText.includes(searchTerm) || descText.includes(searchTerm) || cardBrand.toLowerCase().includes(searchTerm);

            if (brandMatch && featureMatch && priceMatch && searchMatch) {
                if (card.style.display === 'none' || card.style.display === '') {
                    card.style.display = 'flex';
                    gsap.fromTo(card, {opacity: 0, scale: 0.95}, {opacity: 1, scale: 1, duration: 0.25});
                }
            } else {
                card.style.display = 'none';
            }
        });
        
        ScrollTrigger.refresh();
    }

    window.triggerSearchScroll = function() {
        filterProducts();
        const target = document.getElementById('cameras');
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    };

    if (navSearchInput) {
        navSearchInput.addEventListener('input', () => {
            filterProducts();
        });
        navSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                triggerSearchScroll();
            }
        });

        // Check if query string has ?q=
        const urlParams = new URLSearchParams(window.location.search);
        const initialQuery = urlParams.get('q');
        if (initialQuery) {
            navSearchInput.value = initialQuery;
            setTimeout(() => {
                filterProducts();
                triggerSearchScroll();
            }, 300);
        }
    }

    // Add event listeners to all filters
    brandCheckboxes.forEach(cb => cb.addEventListener('change', filterProducts));
    featureCheckboxes.forEach(cb => cb.addEventListener('change', filterProducts));
    if (priceSlider) priceSlider.addEventListener('input', filterProducts);

    // Initial filter run
    filterProducts();
});
