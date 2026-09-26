/*
 * Handcraft Myanmar — Homepage Random Project Order
 *
 * This file does NOT replace assets/app.js.
 * It watches the homepage project grid, waits for the existing
 * Supabase project cards to render, then shuffles them once.
 *
 * Upload as:
 *   assets/random-projects.js
 *
 * Then add this script AFTER assets/app.js in index.html:
 *   <script src="assets/random-projects.js?v=1"></script>
 */

(function () {
  "use strict";

  function shuffleProjectCards() {
    const grid = document.getElementById("project-grid");

    if (!grid) {
      return false;
    }

    const cards = Array.from(
      grid.querySelectorAll(".project-card")
    );

    if (cards.length < 2) {
      return cards.length === 1;
    }

    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    const fragment = document.createDocumentFragment();

    cards.forEach(function (card) {
      fragment.appendChild(card);
    });

    grid.appendChild(fragment);

    return true;
  }

  function start() {
    const grid = document.getElementById("project-grid");

    if (!grid) {
      return;
    }

    /*
     * app.js loads the projects asynchronously.
     * Observe the grid until the real project cards appear.
     */
    const observer = new MutationObserver(function () {
      if (shuffleProjectCards()) {
        observer.disconnect();
      }
    });

    observer.observe(grid, {
      childList: true,
      subtree: true
    });

    /*
     * Also try immediately in case app.js has already finished.
     */
    if (shuffleProjectCards()) {
      observer.disconnect();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
