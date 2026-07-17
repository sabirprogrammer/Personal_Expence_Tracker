/**
 * navbar.js — Landing Page Navbar Interactions
 * Handles: scroll class toggle, mobile hamburger open/close, mobile link auto-close
 */

(function initNavbar() {
    const header = document.getElementById('landingHeader');
    const mobileToggle = document.getElementById('mobileToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    // --- Header scroll shadow & bg ---
    if (header) {
        window.addEventListener('scroll', function () {
            header.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    // --- Mobile hamburger toggle ---
    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', function () {
            mobileToggle.classList.toggle('active');
            mobileMenu.classList.toggle('open');
        });

        // Close mobile drawer when any link inside it is clicked
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                mobileToggle.classList.remove('active');
                mobileMenu.classList.remove('open');
            });
        });
    }
})();
