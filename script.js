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

    // Unified Hero Surveillance Stage Logic: Dual Videos + Real Camera Offers (Clean Controls)
    const video1 = document.getElementById('hero-video-1');
    const video2 = document.getElementById('hero-video-2');
    const allStageSlides = document.querySelectorAll('.stage-slide');
    const prevBtn = document.getElementById('prev-slide');
    const nextBtn = document.getElementById('next-slide');
    const indicator = document.getElementById('slide-indicator');
    const stageCamName = document.getElementById('stage-cam-name');
    const stageModeTag = document.getElementById('stage-mode-tag');

    // Index map:
    // 0 = Video 1 (CAM-01 [MAIN ENTRANCE])
    // 1 = Video 2 (CAM-02 [COMMERCIAL AISLE 07])
    // 2..6 = Real Camera Offers 1..5
    let currentSlideIdx = 0;
    let autoRotateTimer = null;
    let initialSequenceDone = false;

    function activateSlide(idx) {
        currentSlideIdx = idx;
        allStageSlides.forEach(s => s.classList.remove('active'));
        allStageSlides[idx].classList.add('active');

        // Pause both videos when not active
        if (video1 && idx !== 0) video1.pause();
        if (video2 && idx !== 1) video2.pause();

        if (idx === 0) {
            // Video 1: CAM-01 [MAIN ENTRANCE]
            if (indicator) indicator.textContent = 'CAM-01';
            if (stageCamName) stageCamName.textContent = 'CAM-01 [MAIN ENTRANCE]';
            if (stageModeTag) stageModeTag.textContent = '[LIVE FEED]';

            if (video1) {
                video1.currentTime = 0;
                video1.play().catch(() => {});
            }

            const txt = allStageSlides[0].querySelector('.hero-text-overlay');
            if (txt) gsap.fromTo(txt, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });

        } else if (idx === 1) {
            // Video 2: CAM-02 [COMMERCIAL AISLE 07]
            if (indicator) indicator.textContent = 'CAM-02';
            if (stageCamName) stageCamName.textContent = 'CAM-02 [COMMERCIAL AISLE 07]';
            if (stageModeTag) stageModeTag.textContent = '[LIVE FEED]';

            if (video2) {
                video2.currentTime = 0;
                video2.play().catch(() => {});
            }

            const txt = allStageSlides[1].querySelector('.hero-text-overlay');
            if (txt) gsap.fromTo(txt, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });

        } else {
            // Offer Slides (idx: 2..6 -> 01 // 05 .. 05 // 05)
            const offerNumber = idx - 1; // 1 to 5
            if (indicator) indicator.textContent = `0${offerNumber} // 05`;
            if (stageCamName) stageCamName.textContent = 'SYBER SPACE // PROMOTIONAL PROTOCOL';
            if (stageModeTag) stageModeTag.textContent = `[OFFER 0${offerNumber}]`;

            const content = allStageSlides[idx].querySelector('.slide-content');
            const camVisual = allStageSlides[idx].querySelector('.offer-camera-visual');

            if (content) {
                gsap.fromTo(content, 
                    { opacity: 0, x: -30 }, 
                    { opacity: 1, x: 0, duration: 0.45, ease: 'power2.out' }
                );
            }
            if (camVisual) {
                gsap.fromTo(camVisual, 
                    { opacity: 0, scale: 0.9, y: 10 }, 
                    { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: 'back.out(1.5)' }
                );
            }
        }
    }

    function startOffersAutoRotate() {
        clearInterval(autoRotateTimer);
        autoRotateTimer = setInterval(() => {
            let nextIdx = currentSlideIdx + 1;
            if (nextIdx >= allStageSlides.length) {
                nextIdx = 2; // loop offers (slide 2..6)
            }
            activateSlide(nextIdx);
        }, 4500);
    }

    // Natural sequence: Video 1 (5.8s) -> Video 2 (5.8s) -> Offers appear at exact same spot
    function runInitialSequence() {
        if (initialSequenceDone) return;

        // When Video 1 ends -> move to Video 2
        let video1Done = false;
        function toVideo2() {
            if (video1Done) return;
            video1Done = true;
            activateSlide(1);

            // When Video 2 ends -> move to Offer 1
            let video2Done = false;
            function toOffers() {
                if (video2Done) return;
                video2Done = true;
                initialSequenceDone = true;
                activateSlide(2);
                startOffersAutoRotate();
            }

            if (video2) {
                video2.addEventListener('ended', toOffers);
            }
            setTimeout(toOffers, 6000);
        }

        if (video1) {
            video1.addEventListener('ended', toVideo2);
        }
        setTimeout(toVideo2, 6000);
    }

    runInitialSequence();

    // User Controls: [ PREV ] and [ NEXT ] only
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            clearInterval(autoRotateTimer);
            let next = (currentSlideIdx + 1) % allStageSlides.length;
            activateSlide(next);
            if (next >= 2) startOffersAutoRotate();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            clearInterval(autoRotateTimer);
            let prev = (currentSlideIdx - 1 + allStageSlides.length) % allStageSlides.length;
            activateSlide(prev);
            if (prev >= 2) startOffersAutoRotate();
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
