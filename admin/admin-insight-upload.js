/* Handcraft Myanmar Admin — Insight cover image uploader */
(function () {
  "use strict";

  const BUCKET = "insight-images";
  const $ = id => document.getElementById(id);

  function status(text, type) {
    const el = $("coverUploadStatus");
    if (!el) return;
    el.textContent = text || "";
    el.className = "hc-action-status" + (type ? " " + type : "");
  }

  async function uploadInsightCover() {
    const button = $("uploadInsightCoverBtn");
    const fileInput = $("insightCoverImageFile");
    const urlInput = $("insightCoverImage");
    const preview = $("insightCoverPreview");
    const previewImage = $("insightCoverPreviewImage");

    if (!button || !fileInput || !urlInput) return;

    const file = fileInput.files && fileInput.files[0];

    if (!file) {
      status("Choose an image first.", "error");
      if (window.handcraftButtonError) {
        window.handcraftButtonError(button, "Choose Image");
        setTimeout(() => {
          if (button) button.textContent = "Upload Cover Image";
        }, 1200);
      }
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      status("Image is larger than 10 MB.", "error");
      if (window.handcraftButtonError) {
        window.handcraftButtonError(button, "Too Large");
        setTimeout(() => {
          if (button) button.textContent = "Upload Cover Image";
        }, 1200);
      }
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.type)) {
      status("Please choose a JPG, PNG or WebP image.", "error");
      if (window.handcraftButtonError) {
        window.handcraftButtonError(button, "Invalid Image");
        setTimeout(() => {
          if (button) button.textContent = "Upload Cover Image";
        }, 1200);
      }
      return;
    }

    if (typeof sb === "undefined" || !sb || !sb.storage) {
      status("Supabase is not ready. Please refresh the Admin page.", "error");
      return;
    }

    if (window.handcraftButtonWorking) {
      window.handcraftButtonWorking(button, "Uploading");
    } else {
      button.disabled = true;
      button.textContent = "Uploading…";
    }

    status("Uploading cover image…");

    try {
      const sessionResult = await sb.auth.getSession();
      const session = sessionResult?.data?.session;

      if (!session) {
        throw new Error("Your admin session has expired. Please sign in again.");
      }

      const title =
        ($("insightTitle")?.value || "article")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || "article";

      const extension =
        file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
            ? "webp"
            : "jpg";

      const path =
        `${title}-${Date.now()}.${extension}`;

      const upload =
        await sb.storage
          .from(BUCKET)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type
          });

      if (upload.error) {
        console.error("Insight cover upload error:", upload.error);
        throw new Error(
          upload.error.message ||
          upload.error.error ||
          "Storage upload failed."
        );
      }

      const publicUrl =
        sb.storage
          .from(BUCKET)
          .getPublicUrl(path)
          .data
          .publicUrl;

      if (!publicUrl) {
        throw new Error("Upload completed, but no public image URL was returned.");
      }

      urlInput.value = publicUrl;

      if (preview && previewImage) {
        previewImage.src = publicUrl;
        preview.classList.add("show");
      }

      status("✓ Cover image uploaded successfully.", "success");

      if (window.handcraftButtonDone) {
        window.handcraftButtonDone(button, "Uploaded ✓");
        setTimeout(() => {
          if (button) button.textContent = "Upload Cover Image";
        }, 1400);
      } else {
        button.disabled = false;
        button.textContent = "Upload Cover Image";
      }

    } catch (error) {
      console.error("Insight cover upload error:", error);

      status(
        error?.message || "Could not upload the cover image.",
        "error"
      );

      if (window.handcraftButtonError) {
        window.handcraftButtonError(button, "Upload Failed");
        setTimeout(() => {
          if (button) button.textContent = "Upload Cover Image";
        }, 1600);
      } else {
        button.disabled = false;
        button.textContent = "Upload Cover Image";
      }
    }
  }

  function previewSelectedFile() {
    const fileInput = $("insightCoverImageFile");
    const preview = $("insightCoverPreview");
    const previewImage = $("insightCoverPreviewImage");

    if (!fileInput || !preview || !previewImage) return;

    const file = fileInput.files && fileInput.files[0];

    if (!file) {
      preview.classList.remove("show");
      previewImage.removeAttribute("src");
      status("");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      status("Selected file is not JPG, PNG or WebP.", "error");
      preview.classList.remove("show");
      return;
    }

    const reader = new FileReader();

    reader.onload = event => {
      previewImage.src = event.target.result;
      preview.classList.add("show");
      status("Image selected. Click Upload Cover Image.");
    };

    reader.readAsDataURL(file);
  }

  function init() {
    const button = $("uploadInsightCoverBtn");
    const fileInput = $("insightCoverImageFile");

    if (button && !button.dataset.bound) {
      button.dataset.bound = "1";
      button.addEventListener("click", uploadInsightCover);
    }

    if (fileInput && !fileInput.dataset.bound) {
      fileInput.dataset.bound = "1";
      fileInput.addEventListener("change", previewSelectedFile);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
