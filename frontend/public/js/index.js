/**
 * index.js — Landing Page Module Orchestrator
 * Loads after DOM is ready. Imports all landing-page module
 * initializations that depend on specific DOM elements being present.
 * navbar.js and animations.js self-initialize via IIFEs.
 */

// This file intentionally left minimal.
// All landing-page logic is split into:
//   navbar.js   → header scroll, mobile drawer
//   animations.js → scroll reveal, stat counters
//   main.js     → future global page setup
