/* Handcraft Myanmar Admin — button feedback / haptic */
(function () {
  "use strict";

  const style = document.createElement("style");
  style.id = "adminFeedbackStyle";
  style.textContent = `
    button,
    .admin-tabs a {
      -webkit-tap-highlight-color: transparent;
    }

    button.hc-pressed {
      transform: translateY(1px) scale(.985);
      filter: brightness(.92);
      box-shadow: inset 0 0 0 2px rgba(255,255,255,.22);
    }

    button.hc-working {
      position: relative;
      pointer-events: none;
      opacity: .72;
    }

    button.hc-working::after {
      content: "";
      display: inline-block;
      width: 11px;
      height: 11px;
      margin-left: 8px;
      vertical-align: -1px;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: hcSpin .65s linear infinite;
    }

    .hc-action-status {
      margin-top: 9px;
      font-size: 12px;
      font-weight: 700;
      color: #777;
      min-height: 18px;
    }

    .hc-action-status.success { color:#18743a; }
    .hc-action-status.error { color:#b42318; }

    @keyframes hcSpin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  function vibrate(pattern) {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch (_) {}
  }

  document.addEventListener("pointerdown", function (event) {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;

    button.classList.add("hc-pressed");
    vibrate(10);

    window.setTimeout(() => {
      button.classList.remove("hc-pressed");
    }, 140);
  }, true);

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" && event.key !== " ") return;

    const button = event.target.closest("button");
    if (!button || button.disabled) return;

    button.classList.add("hc-pressed");
    vibrate(8);

    window.setTimeout(() => {
      button.classList.remove("hc-pressed");
    }, 140);
  }, true);

  window.handcraftButtonWorking = function (button, label) {
    if (!button) return;
    button.dataset.originalText = button.dataset.originalText || button.textContent;
    button.textContent = label || "Working";
    button.classList.add("hc-working");
    button.disabled = true;
  };

  window.handcraftButtonDone = function (button, label) {
    if (!button) return;
    button.classList.remove("hc-working");
    button.disabled = false;
    button.textContent = label || button.dataset.originalText || "Done";
    vibrate([10, 35, 10]);
  };

  window.handcraftButtonError = function (button, label) {
    if (!button) return;
    button.classList.remove("hc-working");
    button.disabled = false;
    button.textContent = label || button.dataset.originalText || "Try Again";
    vibrate([30, 40, 30]);
  };
})();
