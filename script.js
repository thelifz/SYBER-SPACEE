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

    // Feature Section Parallax & GSAP Surveillance Scanner HUD
    const featureSection = document.querySelector('.feature-section');
    const targetAlpha = document.getElementById('target-alpha');
    const targetBeta = document.getElementById('target-beta');
    const trackerLine = document.getElementById('hud-tracker-line');
    const targetAlphaConf = document.getElementById('target-alpha-conf');
    const laserBeam = document.getElementById('hud-laser-beam');
    const scanner = document.getElementById('surveillance-scanner');
    const reticle = document.getElementById('interactive-reticle');
    const telemetryCoords = document.getElementById('telemetry-coords');
    const telemetryAz = document.getElementById('telemetry-az');
    const scannerClicks = document.getElementById('scanner-clicks');

    // 1. Target Alpha Dynamic Tracking Patrol Timeline
    if (targetAlpha && trackerLine) {
        const alphaTl = gsap.timeline({ repeat: -1, yoyo: true });
        alphaTl.to(targetAlpha, { left: '38%', top: '46%', duration: 4, ease: 'sine.inOut' })
               .to(targetAlpha, { left: '58%', top: '54%', duration: 5, ease: 'power1.inOut' })
               .to(targetAlpha, { left: '26%', top: '60%', duration: 4.5, ease: 'sine.inOut' })
               .to(targetAlpha, { left: '46%', top: '36%', duration: 4, ease: 'power2.inOut' });

        // Update vector tracker line on GSAP ticker
        gsap.ticker.add(() => {
            if (!targetAlpha.isConnected) return;
            const x = targetAlpha.offsetLeft + targetAlpha.offsetWidth / 2;
            const y = targetAlpha.offsetTop + targetAlpha.offsetHeight / 2;
            trackerLine.setAttribute('x2', x);
            trackerLine.setAttribute('y2', y);
        });

        // Corner brackets pulse
        gsap.to('#target-alpha .corner', {
            scale: 1.25,
            repeat: -1,
            yoyo: true,
            duration: 0.75,
            stagger: 0.1,
            ease: 'power1.inOut'
        });

        // Fluctuating AI confidence readout
        const confValues = ['99.2%', '99.4%', '99.7%', '99.9%', '99.3%'];
        let confIdx = 0;
        setInterval(() => {
            if (targetAlphaConf) {
                confIdx = (confIdx + 1) % confValues.length;
                targetAlphaConf.textContent = confValues[confIdx];
            }
        }, 1800);
    }

    // 2. Target Beta Secondary Patrol
    if (targetBeta) {
        gsap.to(targetBeta, {
            left: '64%',
            top: '26%',
            repeat: -1,
            yoyo: true,
            duration: 5.5,
            ease: 'sine.inOut'
        });
        gsap.to('#target-beta .corner', {
            scale: 1.2,
            repeat: -1,
            yoyo: true,
            duration: 1,
            ease: 'power1.inOut'
        });
    }

    // 3. Laser Beam Continuous Scanning
    if (laserBeam) {
        gsap.fromTo(laserBeam, 
            { left: '2%', opacity: 0.9 }, 
            { left: '98%', opacity: 0.35, repeat: -1, yoyo: true, duration: 3.2, ease: 'sine.inOut' }
        );
    }

    // 4. Concentric HUD Radar Rings
    gsap.to('.hud-ring.r1', { scale: 1.08, transformOrigin: '300px 200px', duration: 2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.hud-ring.r3', { scale: 1.04, transformOrigin: '300px 200px', duration: 2.8, repeat: -1, yoyo: true, ease: 'sine.inOut' });

    // 5. Interactive Mouse Aiming Reticle & Telemetry Tracking
    if (scanner && reticle) {
        scanner.addEventListener('mousemove', (e) => {
            const rect = scanner.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            gsap.to(reticle, {
                left: x,
                top: y,
                opacity: 1,
                duration: 0.18,
                ease: 'power2.out',
                overwrite: 'auto'
            });

            if (telemetryCoords) {
                telemetryCoords.textContent = `X: ${x.toFixed(1)} | Y: ${y.toFixed(1)}`;
            }
            if (telemetryAz) {
                const angle = ((Math.atan2(y - rect.height / 2, x - rect.width / 2) * 180 / Math.PI + 360) % 360).toFixed(1);
                telemetryAz.innerHTML = `${angle}&deg;`;
            }
        });

        scanner.addEventListener('mouseleave', () => {
            gsap.to(reticle, { opacity: 0, duration: 0.4 });
            if (telemetryCoords) {
                telemetryCoords.textContent = 'X: 300.0 | Y: 200.0';
            }
            if (telemetryAz) {
                telemetryAz.innerHTML = '042.8&deg;';
            }
        });

        scanner.addEventListener('click', (e) => {
            const rect = scanner.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const pulse = document.createElement('div');
            pulse.className = 'click-pulse-ring';
            pulse.style.left = `${x}px`;
            pulse.style.top = `${y}px`;
            if (scannerClicks) scannerClicks.appendChild(pulse);

            gsap.fromTo(pulse, 
                { scale: 0.2, opacity: 1 }, 
                { scale: 3.2, opacity: 0, duration: 0.65, ease: 'power2.out', onComplete: () => pulse.remove() }
            );
        });
    }

    // 6. ScrollTrigger Section Reveal
    if (featureSection) {
        ScrollTrigger.create({
            trigger: featureSection,
            start: 'top 75%',
            onEnter: () => {
                gsap.fromTo('.scanner-screen', 
                    { scaleY: 0.05, opacity: 0, filter: 'brightness(3)' }, 
                    { scaleY: 1, opacity: 1, filter: 'brightness(1)', duration: 0.65, ease: 'power3.out' }
                );
                gsap.from(['#target-alpha', '#target-beta'], {
                    scale: 2.2,
                    opacity: 0,
                    stagger: 0.25,
                    duration: 0.8,
                    ease: 'back.out(2)'
                });
                gsap.from('.hud-ring, .hud-axis', {
                    opacity: 0,
                    scale: 0.8,
                    transformOrigin: '300px 200px',
                    duration: 0.9,
                    stagger: 0.08,
                    ease: 'power2.out'
                });
            },
            once: true
        });

        gsap.fromTo('.feature-cam-container', 
            { y: 60, rotateX: 6 }, 
            {
                scrollTrigger: {
                    trigger: featureSection,
                    start: 'top center',
                    end: 'bottom center',
                    scrub: 1.2
                },
                y: -40,
                rotateX: -4,
                ease: 'none'
            }
        );
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

    // Offers Slideshow Logic
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.getElementById('prev-slide');
    const nextBtn = document.getElementById('next-slide');
    const indicator = document.getElementById('slide-indicator');
    let currentSlide = 0;
    let slideInterval;

    function updateSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        slides[index].classList.add('active');
        indicator.innerText = `0${index + 1} // 0${slides.length}`;
        
        // Add a small GSAP glitch/fade effect on text
        const content = slides[index].querySelector('.slide-content');
        gsap.fromTo(content, 
            { opacity: 0, x: -50, skewX: 10 }, 
            { opacity: 1, x: 0, skewX: 0, duration: 0.5, ease: 'back.out(1.7)' }
        );
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        updateSlide(currentSlide);
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        updateSlide(currentSlide);
    }

    function startSlideshow() {
        slideInterval = setInterval(nextSlide, 4000);
    }

    function resetInterval() {
        clearInterval(slideInterval);
        startSlideshow();
    }

    if (slides.length > 0) {
        nextBtn.addEventListener('click', () => { nextSlide(); resetInterval(); });
        prevBtn.addEventListener('click', () => { prevSlide(); resetInterval(); });
        startSlideshow();
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
