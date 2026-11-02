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

    // Feature Section Parallax / Pinning
    const featureSection = document.querySelector('.feature-section');
    gsap.from('.feature-cam-container', {
        scrollTrigger: {
            trigger: featureSection,
            start: 'top center',
            end: 'bottom center',
            scrub: true
        },
        y: 100,
        rotation: 2
    });

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

        // Unified Slideshow Logic (Live Feed + 5 Offers)
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.getElementById('prev-slide');
    const nextBtn = document.getElementById('next-slide');
    const indicator = document.getElementById('slide-indicator');
    let currentSlide = 0;
    let slideInterval;

    function updateSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        slides[index].classList.add('active');
        if (indicator) {
            indicator.innerText = `0${index + 1} // 0${slides.length}`;
        }
        
        // Add a smooth GSAP glitch/fade effect on text content
        const content = slides[index].querySelector('.slide-content') || slides[index].querySelector('.hero-feed-content');
        if (content) {
            gsap.fromTo(content, 
                { opacity: 0, y: 15 }, 
                { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }
            );
        }
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
        slideInterval = setInterval(nextSlide, 5000);
    }

    function resetInterval() {
        clearInterval(slideInterval);
        startSlideshow();
    }

    if (slides.length > 0) {
        if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetInterval(); });
        if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); resetInterval(); });
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
