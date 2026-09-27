/* Handcraft Myanmar Admin — button feedback + password recovery */
(function () {
  "use strict";

  const SUPABASE_URL = "https://jvaqtuiyswjybasfumjw.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_GteenSO57Kw0uv1qm6YUiw_-uZ7Uwe0";

  let sbPassword = null;

  function getClient() {
    if (!sbPassword && window.supabase) {
      sbPassword = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
      );
    }
    return sbPassword;
  }

  /* ---------------------------------------------------------
     Existing Handcraft button feedback / haptic
  --------------------------------------------------------- */

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

    .hc-password-card {
      margin-bottom: 22px;
      border: 1px solid #e5e5e5;
      border-radius: 18px;
      padding: 24px;
      background: #fff;
      box-shadow: 0 10px 35px rgba(0,0,0,.05);
    }

    .hc-password-card h2 {
      margin: 0 0 7px;
      font-size: 22px;
    }

    .hc-password-card p {
      color: #737373;
      margin: 0 0 18px;
      line-height: 1.6;
    }

    .hc-password-grid {
      display: grid;
      grid-template-columns: repeat(2,minmax(0,1fr));
      gap: 16px;
    }

    .hc-password-grid label {
      display: block;
      font-size: 13px;
      font-weight: 800;
    }

    .hc-password-grid input {
      width: 100%;
      margin-top: 7px;
      padding: 13px 14px;
      border: 1px solid #d8d8d8;
      border-radius: 10px;
      background: #fff;
      color: #111;
      font: inherit;
      box-sizing: border-box;
    }

    .hc-password-grid input:focus {
      outline: none;
      border-color: #111;
      box-shadow: 0 0 0 3px rgba(0,0,0,.05);
    }

    .hc-forgot {
      display: inline-block;
      margin-top: 10px;
      padding: 0;
      background: transparent !important;
      color: #555 !important;
      font-size: 13px;
      font-weight: 700;
      text-decoration: underline;
    }

    .hc-forgot:hover {
      color: #111 !important;
      opacity: 1;
    }

    @media(max-width:760px){
      .hc-password-grid{grid-template-columns:1fr}
    }

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
    button.dataset.originalText =
      button.dataset.originalText || button.textContent;
    button.textContent = label || "Working";
    button.classList.add("hc-working");
    button.disabled = true;
  };

  window.handcraftButtonDone = function (button, label) {
    if (!button) return;
    button.classList.remove("hc-working");
    button.disabled = false;
    button.textContent =
      label || button.dataset.originalText || "Done";
    vibrate([10, 35, 10]);
  };

  window.handcraftButtonError = function (button, label) {
    if (!button) return;
    button.classList.remove("hc-working");
    button.disabled = false;
    button.textContent =
      label || button.dataset.originalText || "Try Again";
    vibrate([30, 40, 30]);
  };

  /* ---------------------------------------------------------
     Password recovery
  --------------------------------------------------------- */

  function adminRedirectUrl() {
    return window.location.origin + "/admin/";
  }

  function loginMessage(text, error) {
    const el = document.getElementById("loginMessage");
    if (!el) return;

    el.textContent = text;
    el.className =
      "message show " + (error ? "error" : "success");
  }

  function addForgotPasswordLink() {
    const form = document.getElementById("loginForm");
    if (!form || document.getElementById("forgotPasswordBtn")) {
      return;
    }

    const button = document.createElement("button");
    button.id = "forgotPasswordBtn";
    button.type = "button";
    button.className = "hc-forgot";
    button.textContent = "Forgot password?";

    const signInButtons = form.querySelector(".buttons");
    if (signInButtons) {
      signInButtons.insertAdjacentElement("beforebegin", button);
    } else {
      form.appendChild(button);
    }

    button.addEventListener("click", sendPasswordRecovery);
  }

  async function sendPasswordRecovery() {
    const emailEl = document.getElementById("email");
    const email = emailEl ? emailEl.value.trim() : "";

    if (!email) {
      loginMessage(
        "Enter your admin email address first, then click Forgot password.",
        true
      );
      if (emailEl) emailEl.focus();
      return;
    }

    const client = getClient();

    if (!client) {
      loginMessage(
        "Supabase is still loading. Please try again.",
        true
      );
      return;
    }

    loginMessage("Sending password reset email...");

    try {
      const { error } =
        await client.auth.resetPasswordForEmail(email, {
          redirectTo: adminRedirectUrl()
        });

      if (error) {
        loginMessage(error.message, true);
        return;
      }

      loginMessage(
        "Password reset email sent. Check your inbox and open the newest email."
      );
    } catch (error) {
      loginMessage(
        error.message || "Could not send password reset email.",
        true
      );
    }
  }

  function createPasswordCard() {
    if (document.getElementById("hcPasswordCard")) {
      return document.getElementById("hcPasswordCard");
    }

    const dashboard = document.getElementById("dashboard");
    if (!dashboard) return null;

    const card = document.createElement("section");
    card.id = "hcPasswordCard";
    card.className = "hc-password-card";
    card.innerHTML = `
      <h2>Account Security</h2>
      <p>
        You are resetting your administrator password.
        Enter a new password below.
      </p>

      <div id="hcPasswordMessage" class="message"></div>

      <div class="hc-password-grid">
        <label>
          New Password
          <input id="hcNewPassword" type="password"
                 autocomplete="new-password"
                 minlength="8"
                 placeholder="At least 8 characters">
        </label>

        <label>
          Confirm New Password
          <input id="hcConfirmPassword" type="password"
                 autocomplete="new-password"
                 minlength="8"
                 placeholder="Repeat your new password">
        </label>
      </div>

      <div class="buttons">
        <button id="hcChangePasswordBtn" type="button">
          Change Password
        </button>
      </div>
    `;

    const header = dashboard.querySelector(".admin-header");
    if (header) {
      header.insertAdjacentElement("afterend", card);
    } else {
      dashboard.insertAdjacentElement("afterbegin", card);
    }

    document
      .getElementById("hcChangePasswordBtn")
      .addEventListener("click", updatePassword);

    return card;
  }

  function passwordMessage(text, error) {
    const el = document.getElementById("hcPasswordMessage");
    if (!el) return;

    el.textContent = text;
    el.className =
      "message show " + (error ? "error" : "success");
  }

  async function updatePassword() {
    const newPassword =
      document.getElementById("hcNewPassword")?.value || "";
    const confirmPassword =
      document.getElementById("hcConfirmPassword")?.value || "";

    if (newPassword.length < 8) {
      passwordMessage(
        "Password must be at least 8 characters.",
        true
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      passwordMessage(
        "The two passwords do not match.",
        true
      );
      return;
    }

    const client = getClient();

    if (!client) {
      passwordMessage(
        "Supabase is still loading. Please try again.",
        true
      );
      return;
    }

    const button =
      document.getElementById("hcChangePasswordBtn");

    window.handcraftButtonWorking(
      button,
      "Changing Password"
    );

    try {
      const { data, error } =
        await client.auth.updateUser({
          password: newPassword
        });

      if (error) {
        passwordMessage(error.message, true);
        window.handcraftButtonError(
          button,
          "Try Again"
        );
        return;
      }

      passwordMessage(
        "Password changed successfully.",
        false
      );

      document.getElementById("hcNewPassword").value = "";
      document.getElementById("hcConfirmPassword").value = "";

      window.handcraftButtonDone(
        button,
        "Password Changed"
      );

      /*
       * Remove recovery parameters from the browser URL
       * after a successful password change.
       */
      try {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      } catch (_) {}

      window.setTimeout(() => {
        const card = document.getElementById("hcPasswordCard");
        if (card) card.remove();
      }, 3500);

      return data;
    } catch (error) {
      passwordMessage(
        error.message || "Could not change password.",
        true
      );
      window.handcraftButtonError(
        button,
        "Try Again"
      );
    }
  }

  async function checkForRecoverySession() {
    const client = getClient();
    if (!client) return;

    const hasRecoverySignal =
      /type=recovery/i.test(window.location.hash) ||
      /type=recovery/i.test(window.location.search) ||
      /access_token=/i.test(window.location.hash);

    if (!hasRecoverySignal) {
      return;
    }

    /*
     * Supabase processes the recovery hash automatically.
     * Wait briefly for the auth session to become available.
     */
    for (let attempt = 0; attempt < 12; attempt++) {
      try {
        const { data } = await client.auth.getSession();

        if (data && data.session) {
          const dashboard =
            document.getElementById("dashboard");

          if (dashboard) {
            dashboard.style.display = "block";
            const login =
              document.getElementById("login");
            if (login) login.style.display = "none";

            const card = createPasswordCard();
            if (card) {
              window.scrollTo({
                top: 0,
                behavior: "smooth"
              });
            }
          }

          return;
        }
      } catch (_) {}

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    loginMessage(
      "This password reset link has expired. Please request a new password reset email.",
      true
    );
  }

  function initPasswordRecovery() {
    addForgotPasswordLink();
    checkForRecoverySession();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initPasswordRecovery
    );
  } else {
    initPasswordRecovery();
  }
})();
