(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const uploadButton = $("uploadInsightCoverBtn");
    const fileInput = $("insightCoverImageFile");
    const urlInput = $("insightCoverImage");
    const preview = $("insightCoverPreview");
    const previewImage = $("insightCoverPreviewImage");
    const insightForm = $("insightForm");
    const settingsForm = $("settingsForm");

    if (uploadButton && fileInput) {
      uploadButton.addEventListener("click", uploadCoverImage);
    }

    if (fileInput) {
      fileInput.addEventListener("change", () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
          setMessage("Please choose an image file.", true);
          fileInput.value = "";
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          setMessage("Image is larger than 10 MB.", true);
          fileInput.value = "";
          return;
        }
        const reader = new FileReader();
        reader.onload = () => showPreview(String(reader.result || ""));
        reader.readAsDataURL(file);
      });
    }

    if (urlInput) {
      urlInput.addEventListener("change", () => {
        if (urlInput.value.trim()) showPreview(urlInput.value.trim());
      });
    }

    if (insightForm) {
      insightForm.addEventListener("submit", () => {
        setTimeout(() => {
          if (!urlInput) return;
          if (urlInput.value.trim()) showPreview(urlInput.value.trim());
        }, 150);
      });
    }

    const cancelButton = $("cancelInsightBtn");
    if (cancelButton) {
      cancelButton.addEventListener("click", () => {
        if (fileInput) fileInput.value = "";
        if (urlInput) urlInput.value = "";
        clearPreview();
      });
    }

    if (settingsForm) {
      settingsForm.addEventListener("submit", () => {
        setTimeout(saveTikTokUrl, 250);
      });
    }

    wrapEditInsight();
  }

  function wrapEditInsight() {
    if (typeof window.editInsight !== "function") return;
    const original = window.editInsight;
    if (original.__handcraftWrapped) return;

    const wrapped = function (id) {
      original(id);
      setTimeout(() => {
        const urlInput = $("insightCoverImage");
        if (urlInput && urlInput.value.trim()) showPreview(urlInput.value.trim());
      }, 100);
    };

    wrapped.__handcraftWrapped = true;
    window.editInsight = wrapped;
  }

  async function uploadCoverImage() {
    const fileInput = $("insightCoverImageFile");
    const button = $("uploadInsightCoverBtn");
    const file = fileInput && fileInput.files ? fileInput.files[0] : null;

    if (!file) {
      setMessage("Choose an article cover image first.", true);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image file.", true);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage("Image is larger than 10 MB.", true);
      return;
    }

    if (typeof sb === "undefined") {
      setMessage("Supabase is not ready. Please refresh the page.", true);
      return;
    }

    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = "Uploading...";

    try {
      const articleId = ($("insightId") && $("insightId").value.trim()) ||
        `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const extension = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `insights/${articleId}-${Date.now()}.${extension}`;

      const upload = await sb.storage
        .from("project-images")
        .upload(path, file, { upsert: false });

      if (upload.error) throw upload.error;

      const { data } = sb.storage.from("project-images").getPublicUrl(path);
      const url = data && data.publicUrl;
      if (!url) throw new Error("Could not create a public image URL.");

      $("insightCoverImage").value = url;
      showPreview(url);
      setMessage("Cover image uploaded. Click Save Article to save it with the article.");
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Cover upload failed.", true);
    } finally {
      button.disabled = false;
      button.textContent = oldText;
    }
  }

  async function saveTikTokUrl() {
    const input = $("tiktokUrl");
    if (!input || typeof sb === "undefined") return;

    const value = input.value.trim();
    const { error } = await sb
      .from("site_settings")
      .update({ tiktok_url: value, updated_at: new Date().toISOString() })
      .eq("id", 1);

    if (error) {
      console.error("TikTok URL save failed:", error);
      setMessage("TikTok URL could not be saved: " + error.message, true);
    }
  }

  function showPreview(url) {
    const preview = $("insightCoverPreview");
    const image = $("insightCoverPreviewImage");
    if (!preview || !image || !url) return;
    image.src = url;
    preview.classList.add("show");
  }

  function clearPreview() {
    const preview = $("insightCoverPreview");
    const image = $("insightCoverPreviewImage");
    if (preview) preview.classList.remove("show");
    if (image) image.removeAttribute("src");
  }

  function setMessage(text, error) {
    const box = $("insightMessage") || $("settingsMessage");
    if (!box) return;
    box.textContent = text;
    box.className = "message show " + (error ? "error" : "success");
  }
})();
