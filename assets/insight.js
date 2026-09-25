(() => {
  "use strict";

  const SUPABASE_URL = "https://jvaqtuiyswjybasfumjw.supabase.co";
  const SUPABASE_KEY = "sb_publishable_GteenSO57Kw0uv1qm6YUiw_-uZ7Uwe0";

  const $ = (id) => document.getElementById(id);

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[c]));
  }

  function formatDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function renderArticleText(value) {
    const text = String(value ?? "").trim();
    if (!text) return "<p>No article content is available yet.</p>";

    // The admin content is trusted HTML when it contains HTML tags.
    if (/<[a-z][\s\S]*>/i.test(text)) return text;

    return text
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  async function loadArticle() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug") || params.get("insight");

    const titleEl = $("articleTitle");
    const metaEl = $("articleMeta");
    const contentEl = $("articleContent");

    if (!slug) {
      titleEl.textContent = "Insight not found";
      contentEl.innerHTML =
        '<div class="article-error">No article was specified.<br><br><a href="insights.html">← Back to Insights</a></div>';
      return;
    }

    try {
      const query = new URLSearchParams({
        select: "id,title,slug,category,excerpt,content,cover_image_url,seo_title,seo_description,published,published_at,created_at",
        slug: `eq.${slug}`,
        published: "eq.true",
        limit: "1"
      });

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/insights?${query.toString()}`,
        {
          method: "GET",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Accept: "application/json"
          },
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error(`Unable to load article (HTTP ${response.status})`);
      }

      const rows = await response.json();
      const article = rows[0];

      if (!article) {
        titleEl.textContent = "Insight not found";
        contentEl.innerHTML =
          '<div class="article-error">This article could not be found.<br><br><a href="insights.html">← Back to Insights</a></div>';
        return;
      }

      titleEl.textContent = article.title || "Insight";

      metaEl.textContent = [
        article.category || "Insights",
        formatDate(article.published_at || article.created_at)
      ].filter(Boolean).join(" • ");

      if (article.seo_description) {
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute("content", article.seo_description);
      }

      document.title =
        `${article.seo_title || article.title || "Insight"} | Handcraft Myanmar`;

      contentEl.innerHTML = `
        ${article.cover_image_url ? `
          <img
            class="article-cover"
            src="${escapeHtml(article.cover_image_url)}"
            alt="${escapeHtml(article.title)}"
          >
        ` : ""}

        <div class="article-body">
          ${article.excerpt ? `
            <p class="article-lead">${escapeHtml(article.excerpt)}</p>
          ` : ""}

          ${renderArticleText(article.content)}
        </div>

        <div class="article-actions">
          <a href="insights.html">← Back to Insights</a>
          <button type="button" id="shareArticle">Share</button>
          <button type="button" id="copyArticle">Copy Link</button>
        </div>
      `;

      $("shareArticle").addEventListener("click", async () => {
        if (navigator.share) {
          try {
            await navigator.share({
              title: article.title,
              text: article.excerpt || "Handcraft Myanmar Insight",
              url: window.location.href
            });
            return;
          } catch (error) {
            if (error?.name === "AbortError") return;
          }
        }

        await copyLink($("shareArticle"), "Share");
      });

      $("copyArticle").addEventListener("click", () =>
        copyLink($("copyArticle"), "Copy Link")
      );

    } catch (error) {
      console.error("Insight article error:", error);
      titleEl.textContent = "Unable to load insight";
      contentEl.innerHTML = `
        <div class="article-error">
          ${escapeHtml(error.message || "Unable to load this article.")}
          <br><br>
          <a href="insights.html">← Back to Insights</a>
        </div>
      `;
    }
  }

  async function copyLink(button, originalText) {
    try {
      await navigator.clipboard.writeText(window.location.href);
      button.textContent = "Copied";
      setTimeout(() => {
        button.textContent = originalText;
      }, 1600);
    } catch (error) {
      window.prompt("Copy this article link:", window.location.href);
    }
  }

  async function loadSocialLinks() {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/site_settings?select=facebook_url,instagram_url,tiktok_url,youtube_url,pinterest_url&id=eq.1`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Accept: "application/json"
          },
          cache: "no-store"
        }
      );

      if (!response.ok) return;

      const rows = await response.json();
      const settings = rows[0];
      if (!settings) return;

      ["facebook_url", "instagram_url", "tiktok_url", "youtube_url", "pinterest_url"]
        .forEach((key) => {
          document.querySelectorAll(`[data-setting="${key}"]`).forEach((link) => {
            const value = String(settings[key] || "").trim();
            if (value) {
              link.href = value;
              link.style.display = "inline-flex";
            } else {
              link.style.display = "none";
            }
          });
        });

      document.querySelectorAll('[data-setting="company_name"]').forEach((el) => {
        if (settings.company_name) el.textContent = settings.company_name;
      });

    } catch (error) {
      console.warn("Social links could not be loaded:", error);
    }
  }

  function initMenu() {
    const toggle = $("menuToggle");
    const nav = $("mainNav");

    if (!toggle || !nav) return;

    toggle.addEventListener("click", () => {
      nav.classList.toggle("open");
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => nav.classList.remove("open"));
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const year = $("year");
    if (year) year.textContent = new Date().getFullYear();

    initMenu();
    loadArticle();
    loadSocialLinks();
  });
})();
