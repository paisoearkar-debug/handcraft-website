/* Handcraft Myanmar — Footer Admin UI
   Uses existing site_settings fields; no database migration required. */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const SUPABASE_URL = "https://jvaqtuiyswjybasfumjw.supabase.co";
  const SUPABASE_KEY = "sb_publishable_GteenSO57Kw0uv1qm6YUiw_-uZ7Uwe0";

  function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
    }[c]));
  }

  function message(text, error) {
    const el = $("footerMessage");
    if (!el) return;
    el.textContent = text;
    el.className = "message show " + (error ? "error" : "success");
  }

  function inject() {
    const dash = $("dashboard");
    const tabs = document.querySelector(".admin-tabs");
    const settings = $("settingsSection");
    if (!dash || !tabs || !settings) return false;

    if (!$('footerSection')) {
      const tab = document.createElement("a");
      tab.href = "#footerSection";
      tab.textContent = "▤ Footer";
      tabs.appendChild(tab);

      const section = document.createElement("section");
      section.className = "card";
      section.id = "footerSection";
      section.innerHTML = `
        <h2>Footer</h2>
        <p class="card-description">Manage the social links shown in the website footer. These use the same site settings as the main Website section.</p>
        <div id="footerMessage" class="message"></div>
        <form id="footerForm">
          <div class="grid-2">
            <label>Facebook URL<input id="footerFacebook" type="url" placeholder="https://facebook.com/..."></label>
            <label>Instagram URL<input id="footerInstagram" type="url" placeholder="https://instagram.com/..."></label>
            <label>TikTok URL<input id="footerTiktok" type="url" placeholder="https://tiktok.com/@..."></label>
            <label>YouTube URL<input id="footerYoutube" type="url" placeholder="https://youtube.com/..."></label>
            <label>Pinterest URL<input id="footerPinterest" type="url" placeholder="https://pinterest.com/..."></label>
          </div>
          <div class="buttons">
            <button type="submit">Save Footer Social Links</button>
          </div>
        </form>
        <div style="margin-top:22px;padding:20px;border:1px solid #e5e5e5;border-radius:14px;background:#121211;color:#fff">
          <div style="font-size:12px;font-weight:800;letter-spacing:.12em">HANDCRAFT MYANMAR COMPANY LIMITED</div>
          <div style="margin-top:5px;font-size:10px;letter-spacing:.12em;color:rgba(255,255,255,.45)">DESIGN • BUILD • FIT-OUT</div>
          <div style="margin-top:16px;font-size:11px;color:rgba(255,255,255,.6)">Footer social icons are automatically shown when a URL is saved.</div>
          <div id="footerPreviewLinks" style="margin-top:12px;font-size:12px;color:#b18a52"></div>
        </div>
      `;
      settings.insertAdjacentElement("afterend", section);
    }

    if (!$('footerForm').dataset.bound) {
      $('footerForm').dataset.bound = "1";
      $('footerForm').addEventListener("submit", save);
    }
    return true;
  }

  async function getClient() {
    if (window.sb && typeof window.sb.from === "function") return window.sb;
    if (window.supabase && window.supabase.createClient) {
      window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      return window.sb;
    }
    throw new Error("Supabase is not available. Please refresh the Admin page.");
  }

  async function load() {
    if (!inject()) return;
    try {
      const sb = await getClient();
      const { data, error } = await sb.from("site_settings").select("company_name,facebook_url,instagram_url,tiktok_url,youtube_url,pinterest_url").eq("id", 1).maybeSingle();
      if (error) throw error;
      const d = data || {};
      $("footerFacebook").value = d.facebook_url || "";
      $("footerInstagram").value = d.instagram_url || "";
      $("footerTiktok").value = d.tiktok_url || "";
      $("footerYoutube").value = d.youtube_url || "";
      $("footerPinterest").value = d.pinterest_url || "";
      preview(d);
    } catch (e) {
      message(e.message || "Unable to load footer settings.", true);
    }
  }

  function preview(d) {
    const links = [
      ["Facebook", d.facebook_url],
      ["Instagram", d.instagram_url],
      ["TikTok", d.tiktok_url],
      ["YouTube", d.youtube_url],
      ["Pinterest", d.pinterest_url]
    ].filter(x => x[1]);
    const el = $("footerPreviewLinks");
    if (el) el.innerHTML = links.length ? links.map(x => esc(x[0])).join("  •  ") : "No social links saved yet.";
  }

  async function save(e) {
    e.preventDefault();
    try {
      const sb = await getClient();
      message("Saving footer settings...", false);
      const payload = {
        facebook_url: $("footerFacebook").value.trim(),
        instagram_url: $("footerInstagram").value.trim(),
        tiktok_url: $("footerTiktok").value.trim(),
        youtube_url: $("footerYoutube").value.trim(),
        pinterest_url: $("footerPinterest").value.trim(),
        updated_at: new Date().toISOString()
      };
      const { error } = await sb.from("site_settings").update(payload).eq("id", 1);
      if (error) throw error;
      preview(payload);
      message("Footer settings saved successfully.", false);
    } catch (e) {
      message(e.message || "Unable to save footer settings.", true);
    }
  }

  function start() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", load, { once: true });
    } else {
      load();
    }
    setTimeout(load, 900);
  }

  start();
})();
