/**
 * SYBER SPACE — Precision Surveillance Systems
 * New GSAP Integrated Architecture
 */

document.addEventListener('DOMContentLoaded', () => {
    // Register GSAP plugins
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }
    console.log('Syber Space: GSAP Canvas Ready.');
});
