/**
 * animations.js — Landing Page Scroll Reveal & Stat Counters
 * Handles: IntersectionObserver scroll reveal, animated number counters
 */

(function initAnimations() {

    // --- Active nav link highlight on scroll ---
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a');

    if (sections.length && navLinks.length) {
        window.addEventListener('scroll', function () {
            let current = '';
            sections.forEach(function (section) {
                if (pageYOffset >= section.offsetTop - 200) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(function (link) {
                link.classList.remove('active');
                if (link.getAttribute('href') && link.getAttribute('href').slice(1) === current) {
                    link.classList.add('active');
                }
            });
        });
    }

    // --- Scroll reveal observer for landing sections ---
    const revealSections = document.querySelectorAll('.landing-section');
    if (revealSections.length) {
        const revealObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        revealSections.forEach(function (section) {
            revealObserver.observe(section);
        });
    }

    // --- Animated stat counters ---
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length) {
        const countObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const target = parseFloat(entry.target.getAttribute('data-target'));
                    const decimals = parseInt(entry.target.getAttribute('data-decimals') || '0');
                    let count = 0;
                    const duration = 2000;  // 2 seconds total
                    const stepTime = 30;    // 30ms per tick
                    const totalSteps = duration / stepTime;
                    const increment = target / totalSteps;

                    const timer = setInterval(function () {
                        count += increment;
                        if (count >= target) {
                            count = target;
                            clearInterval(timer);
                        }

                        // Format the display value
                        if (target >= 1000000) {
                            entry.target.textContent = (count / 1000000).toFixed(decimals) + 'M+';
                        } else if (target >= 1000) {
                            entry.target.textContent = (count / 1000).toFixed(decimals) + 'K+';
                        } else {
                            entry.target.textContent = count.toFixed(decimals) + (decimals > 0 ? '%' : '+');
                        }
                    }, stepTime);

                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(function (num) {
            countObserver.observe(num);
        });
    }

})();
