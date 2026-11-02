// Wait for DOM
document.addEventListener("DOMContentLoaded", (event) => {
    // GSAP Plugins
    gsap.registerPlugin(ScrollTrigger);

    // Live Timecode update
    const timecodeEl = document.getElementById('timecode');
    setInterval(() => {
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');
        const ms = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
        timecodeEl.innerText = `${hrs}:${mins}:${secs}:${ms}`;
    }, 40);

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

    // Filtering Logic (Brand, Feature, Price)
    const brandCheckboxes = document.querySelectorAll('.brand-filter');
    const featureCheckboxes = document.querySelectorAll('.feature-filter');
    const priceSlider = document.getElementById('price-slider');
    const priceDisplay = document.getElementById('price-display');
    const productCards = document.querySelectorAll('.product-card');

    function filterProducts() {
        const checkedBrands = Array.from(brandCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        const checkedFeatures = Array.from(featureCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        const maxPrice = parseFloat(priceSlider.value);

        // Update price label with comma formatting
        priceDisplay.innerText = maxPrice.toLocaleString('en-IN');

        productCards.forEach(card => {
            const cardBrand = card.getAttribute('data-brand');
            const cardPrice = parseFloat(card.getAttribute('data-price'));
            const cardFeaturesStr = card.getAttribute('data-features') || "";
            const cardFeaturesArray = cardFeaturesStr.split(',');

            // Check Brand match
            const brandMatch = checkedBrands.length === 0 || checkedBrands.includes(cardBrand);

            // Check Feature match (product must have ALL selected features)
            const featureMatch = checkedFeatures.every(feat => cardFeaturesArray.includes(feat));

            // Check Price match
            const priceMatch = cardPrice <= maxPrice;

            if (brandMatch && featureMatch && priceMatch) {
                if (card.style.display === 'none' || card.style.display === '') {
                    card.style.display = 'flex';
                    gsap.fromTo(card, {opacity: 0, scale: 0.9}, {opacity: 1, scale: 1, duration: 0.3});
                }
            } else {
                card.style.display = 'none';
            }
        });
        
        ScrollTrigger.refresh();
    }

    // Add event listeners to all filters
    brandCheckboxes.forEach(cb => cb.addEventListener('change', filterProducts));
    featureCheckboxes.forEach(cb => cb.addEventListener('change', filterProducts));
    priceSlider.addEventListener('input', filterProducts);

    // Initial filter run
    filterProducts();
});
