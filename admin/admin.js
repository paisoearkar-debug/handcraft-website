const SUPABASE_URL = "https://jvaqtuiyswjybasfumjw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_GteenSO57Kw0uv1qm6YUiw_-uZ7Uwe0";

const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const $ = (id) => document.getElementById(id);

let editing = null;
let currentSettings = null;
let lastSavedProjectId = null;

async function boot() {
  const {
    data: { session }
  } = await sb.auth.getSession();

  if (session) {
    showDashboard();
  } else {
    showLogin();
  }
}

function showLogin() {
  $("login").style.display = "block";
  $("dashboard").style.display = "none";
  $("logoutBtn").style.display = "none";
}

function showDashboard() {
  $("login").style.display = "none";
  $("dashboard").style.display = "block";
  $("logoutBtn").style.display = "inline-block";

  loadSettings();
  loadProjects();
}

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = $("email").value.trim();
  const password = $("password").value;

  showMessage(
    "loginMessage",
    "Signing in...",
    false
  );

  const { error } = await sb.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showMessage(
      "loginMessage",
      error.message,
      true
    );

    return;
  }

  $("loginMessage").classList.remove("show");

  showDashboard();
});

$("logoutBtn").addEventListener("click", async () => {
  await sb.auth.signOut();

  location.reload();
});

async function loadSettings() {
  const { data, error } = await sb
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    showMessage(
      "settingsMessage",
      error.message,
      true
    );

    return;
  }

  currentSettings = data || {};

  $("companyName").value =
    data?.company_name ||
    "Handcraft Myanmar Company Limited";

  $("companyEmail").value =
    data?.email || "";

  $("companyPhone").value =
    data?.phone || "";

  $("companyAddress").value =
    data?.address || "";

  $("mapEmbedUrl").value =
    data?.map_embed_url || "";

  $("heroTitle").value =
    data?.hero_title ||
    "Interior Design, Fit-Out & Construction";

  $("heroSubtitle").value =
    data?.hero_subtitle ||
    "Creating beautiful, functional spaces with thoughtful design and quality craftsmanship.";

  $("aboutTitle").value =
    data?.about_title ||
    "About Handcraft Myanmar";

  $("aboutBody").value =
    data?.about_body || "";
}

$("settingsForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  showMessage(
    "settingsMessage",
    "Saving website settings...",
    false
  );

  const payload = {
    id: 1,

    company_name:
      $("companyName").value.trim(),

    email:
      $("companyEmail").value.trim(),

    phone:
      $("companyPhone").value.trim(),

    address:
      $("companyAddress").value.trim(),

    map_embed_url:
      $("mapEmbedUrl").value.trim(),

    hero_title:
      $("heroTitle").value.trim(),

    hero_subtitle:
      $("heroSubtitle").value.trim(),

    about_title:
      $("aboutTitle").value.trim(),

    about_body:
      $("aboutBody").value.trim(),

    updated_at:
      new Date().toISOString()
  };

  const { error } = await sb
    .from("site_settings")
    .update(payload)
    .eq("id", 1);

  if (error) {
    showMessage(
      "settingsMessage",
      "Error: " + error.message,
      true
    );

    return;
  }

  currentSettings = {
    ...currentSettings,
    ...payload
  };

  showMessage(
    "settingsMessage",
    "Website settings saved successfully.",
    false
  );
});

async function loadProjects() {
  $("list").innerHTML =
    "<p class='muted'>Loading projects...</p>";

  const { data, error } = await sb
    .from("projects")
    .select(`
      *,
      project_images (
        id,
        image_url,
        alt_text,
        sort_order
      )
    `)
    .order("sort_order", {
      ascending: true
    })
    .order("created_at", {
      ascending: false
    });

  if (error) {
    $("list").innerHTML =
      `<div class="notice show">${escapeHtml(error.message)}</div>`;

    return;
  }

  const projects = data || [];

  if (!projects.length) {
    $("list").innerHTML =
      "<p class='muted'>No projects yet. Create your first project above.</p>";

    return;
  }

  $("list").innerHTML = projects
    .map(renderProject)
    .join("");
}

function renderProject(project) {
  const images =
    (project.project_images || [])
      .sort(
        (a, b) =>
          (a.sort_order || 0) -
          (b.sort_order || 0)
      );

  const publishedBadge =
    project.published
      ? `<span class="badge badge-published">Published</span>`
      : `<span class="badge badge-hidden">Hidden</span>`;

  const photoCount =
    images.length;

  return `

    <div class="project-card">

      <div class="project-card-top">

        <div>

          <h3>
            ${escapeHtml(project.title || "Untitled Project")}
          </h3>

          <div class="project-meta">

            ${publishedBadge}

            <span class="badge">
              ${escapeHtml(project.category || "Uncategorized")}
            </span>

            ${
              project.location
                ? `<br>📍 ${escapeHtml(project.location)}`
                : ""
            }

            <br>

            📷 ${photoCount}
            ${photoCount === 1 ? "photo" : "photos"}

          </div>

        </div>

        <div class="actions">

          <button
            class="btn-secondary"
            onclick="editProject('${project.id}')"
          >
            Edit
          </button>

          <button
            class="btn-danger"
            onclick="deleteProject('${project.id}')"
          >
            Delete
          </button>

        </div>

      </div>

      ${
        project.description
          ? `
            <p class="muted" style="margin:15px 0 0">
              ${escapeHtml(project.description)}
            </p>
          `
          : ""
      }

      ${
        images.length
          ? `
            <div class="gallery">

              ${images.map(image => `

                <div class="gallery-item">

                  <img
                    src="${escapeAttribute(image.image_url)}"
                    alt="${escapeAttribute(image.alt_text || project.title || "")}"
                    loading="lazy"
                  >

                  <button
                    onclick="deleteProjectImage(
                      '${image.id}',
                      '${project.id}',
                      '${escapeAttribute(image.image_url)}'
                    )"
                  >
                    Delete
                  </button>

                </div>

              `).join("")}

            </div>
          `
          : `
            <p class="muted" style="margin-top:15px">
              No photographs uploaded.
            </p>
          `
      }

    </div>

  `;
}

$("newProjectBtn").addEventListener("click", () => {
  resetProjectForm();

  window.scrollTo({
    top: 500,
    behavior: "smooth"
  });
});

$("cancelEditBtn").addEventListener("click", () => {
  resetProjectForm();
});

function resetProjectForm() {
  editing = null;
  lastSavedProjectId = null;

  $("projectForm").reset();

  $("id").value = "";

  $("sortOrder").value = "0";

  $("published").checked = true;

  $("projectEditorTitle").textContent =
    "Add Project";

  $("currentGallerySection").style.display =
    "none";

  $("currentGallery").innerHTML = "";

  $("projectMessage").classList.remove("show");

  if ($("aiMessage")) {
    $("aiMessage").classList.remove("show");
  }
}

window.editProject = async function(id) {

  const { data, error } = await sb
    .from("projects")
    .select(`
      *,
      project_images (
        id,
        image_url,
        alt_text,
        sort_order
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    alert(error.message);

    return;
  }

  editing = data;
  lastSavedProjectId = data.id;

  $("id").value =
    data.id;

  $("title").value =
    data.title || "";

  $("category").value =
    data.category || "";

  $("location").value =
    data.location || "";

  $("sortOrder").value =
    data.sort_order || 0;

  $("description").value =
    data.description || "";

  $("published").checked =
    data.published !== false;

  $("projectEditorTitle").textContent =
    "Edit Project";

  renderCurrentGallery(
    data.project_images || []
  );

  if ($("aiMessage")) {
    $("aiMessage").classList.remove("show");
  }

  window.scrollTo({
    top: 500,
    behavior: "smooth"
  });
};

function renderCurrentGallery(images) {

  const section = $("currentGallerySection");
  const gallery = $("currentGallery");

  section.style.display =
    images.length
      ? "block"
      : "none";

  const sortedImages = [...images].sort(
    (a, b) =>
      (a.sort_order || 0) -
      (b.sort_order || 0)
  );

  gallery.innerHTML =
    sortedImages
      .map((image, index) => `

        <div
          class="gallery-item"
          draggable="true"
          data-image-id="${escapeAttribute(image.id)}"
          title="Drag this photo to change its order"
          style="cursor:grab; position:relative;"
        >

          ${
            index === 0
              ? `<div style="position:absolute;top:8px;left:8px;z-index:2;background:#111;color:#fff;padding:5px 8px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.08em;">COVER</div>`
              : ""
          }

          <div style="position:absolute;right:8px;top:8px;z-index:2;background:rgba(255,255,255,.92);color:#111;padding:5px 8px;border-radius:999px;font-size:11px;font-weight:600;">
            ↕ Drag
          </div>

          <img
            src="${escapeAttribute(image.image_url)}"
            alt="${escapeAttribute(image.alt_text || "")}"
            draggable="false"
          >

          <button
            type="button"
            onclick="deleteProjectImage(
              '${image.id}',
              '${editing.id}',
              '${escapeAttribute(image.image_url)}'
            )"
          >
            Delete
          </button>

        </div>

      `)
      .join("");

  let draggedItem = null;

  gallery
    .querySelectorAll(".gallery-item")
    .forEach(item => {

      item.addEventListener("dragstart", (event) => {

        draggedItem = item;

        item.style.opacity = "0.55";
        item.style.cursor = "grabbing";

        event.dataTransfer.effectAllowed = "move";

        event.dataTransfer.setData(
          "text/plain",
          item.dataset.imageId
        );

      });

      item.addEventListener("dragover", (event) => {

        event.preventDefault();

        if (!draggedItem || draggedItem === item) {
          return;
        }

        const rect =
          item.getBoundingClientRect();

        const insertAfter =
          event.clientY >
          rect.top + rect.height / 2;

        if (insertAfter) {

          item.parentNode.insertBefore(
            draggedItem,
            item.nextSibling
          );

        } else {

          item.parentNode.insertBefore(
            draggedItem,
            item
          );

        }

      });

      item.addEventListener("dragend", async () => {

        if (!draggedItem) {
          return;
        }

        draggedItem.style.opacity = "1";
        draggedItem.style.cursor = "grab";

        draggedItem = null;

        await saveGalleryOrder();

      });

    });

}

async function saveGalleryOrder() {

  const gallery =
    $("currentGallery");

  if (!gallery || !editing?.id) {
    return;
  }

  const items =
    Array.from(
      gallery.querySelectorAll(".gallery-item")
    );

  if (!items.length) {
    return;
  }

  showMessage(
    "projectMessage",
    "Saving photo order...",
    false
  );

  const updates =
    items.map((item, index) =>
      sb
        .from("project_images")
        .update({
          sort_order: index
        })
        .eq(
          "id",
          item.dataset.imageId
        )
    );

  const results =
    await Promise.all(updates);

  const failed =
    results.find(
      result => result.error
    );

  if (failed) {

    showMessage(
      "projectMessage",
      "Could not save photo order: " +
        failed.error.message,
      true
    );

    return;
  }

  const firstItem =
    items[0];

  const firstImage =
    editing.project_images?.find(
      image =>
        image.id ===
        firstItem.dataset.imageId
    );

  if (firstImage) {

    const { error: coverError } =
      await sb
        .from("projects")
        .update({
          image_url:
            firstImage.image_url
        })
        .eq(
          "id",
          editing.id
        );

    if (coverError) {

      showMessage(
        "projectMessage",
        "Photo order saved, but the cover image could not be updated: " +
          coverError.message,
        true
      );

      return;
    }

  }

  if (editing.project_images) {

    const imageMap =
      new Map(
        editing.project_images.map(
          image => [
            image.id,
            image
          ]
        )
      );

    editing.project_images =
      items
        .map((item, index) => {

          const image =
            imageMap.get(
              item.dataset.imageId
            );

          return image
            ? {
                ...image,
                sort_order: index
              }
            : null;

        })
        .filter(Boolean);

  }

  renderCurrentGallery(
    editing.project_images || []
  );

  showMessage(
    "projectMessage",
    "Photo order saved successfully. The first photo is now the project cover.",
    false
  );

  await loadProjects();
}

$("projectForm").addEventListener("submit", async (e) => {

  e.preventDefault();

  showMessage(
    "projectMessage",
    "Saving project...",
    false
  );

  const payload = {

    title:
      $("title").value.trim(),

    category:
      $("category").value,

    location:
      $("location").value.trim(),

    sort_order:
      Number($("sortOrder").value || 0),

    description:
      $("description").value.trim(),

    published:
      $("published").checked

  };

  if (!payload.title) {

    showMessage(
      "projectMessage",
      "Please enter a project title.",
      true
    );

    return;
  }

  if (!payload.category) {

    showMessage(
      "projectMessage",
      "Please select a category.",
      true
    );

    return;
  }

  let projectId;

  if (editing) {

    const { error } =
      await sb
        .from("projects")
        .update(payload)
        .eq(
          "id",
          editing.id
        );

    if (error) {

      showMessage(
        "projectMessage",
        "Error: " + error.message,
        true
      );

      return;
    }

    projectId =
      editing.id;

  }

  else {

    const { data, error } =
      await sb
        .from("projects")
        .insert(payload)
        .select()
        .single();

    if (error) {

      showMessage(
        "projectMessage",
        "Error: " + error.message,
        true
      );

      return;
    }

    projectId =
      data.id;

  }

  const files =
    Array.from(
      $("images").files || []
    );

  if (files.length) {

    showMessage(
      "projectMessage",
      "Uploading project photographs...",
      false
    );

    const uploadResult =
      await uploadProjectImages(
        projectId,
        files
      );

    if (!uploadResult.success) {

      showMessage(
        "projectMessage",
        uploadResult.message,
        true
      );

      await loadProjects();

      return;
    }

  }

  lastSavedProjectId =
    projectId;

  $("id").value =
    projectId;

  editing = {
    id: projectId
  };

  showMessage(
    "projectMessage",
    "Project saved successfully. You can now generate the AI description and photo captions.",
    false
  );

  await loadProjects();

  const {
    data: refreshedProject
  } = await sb
    .from("projects")
    .select(`
      *,
      project_images (
        id,
        image_url,
        alt_text,
        sort_order
      )
    `)
    .eq(
      "id",
      projectId
    )
    .single();

  if (refreshedProject) {

    editing =
      refreshedProject;

    renderCurrentGallery(
      refreshedProject.project_images || []
    );

  }

});

async function uploadProjectImages(
  projectId,
  files
) {

  let uploaded = 0;

  for (const file of files) {

    if (!file.type.startsWith("image/")) {

      return {
        success: false,
        message:
          `${file.name} is not an image file.`
      };

    }

    if (
      file.size >
      8 * 1024 * 1024
    ) {

      return {
        success: false,
        message:
          `${file.name} is larger than 8MB. Please resize it before uploading.`
      };

    }

    const extension =
      file.name
        .split(".")
        .pop()
        .toLowerCase();

    const filename =
      `${crypto.randomUUID()}.${extension}`;

    const storagePath =
      `projects/${projectId}/${filename}`;

    const {
      error: uploadError
    } =
      await sb
        .storage
        .from("project-images")
        .upload(
          storagePath,
          file,
          {
            cacheControl: "3600",
            upsert: false,
            contentType:
              file.type
          }
        );

    if (uploadError) {

      return {
        success: false,
        message:
          `Upload failed for ${file.name}: ${uploadError.message}`
      };

    }

    const {
      data: publicData
    } =
      sb
        .storage
        .from("project-images")
        .getPublicUrl(
          storagePath
        );

    const imageUrl =
      publicData.publicUrl;

    const {
      data: existingImages
    } =
      await sb
        .from("project_images")
        .select("sort_order")
        .eq(
          "project_id",
          projectId
        )
        .order(
          "sort_order",
          {
            ascending: false
          }
        )
        .limit(1);

    const nextOrder =
      existingImages &&
      existingImages.length
        ? Number(
            existingImages[0].sort_order || 0
          ) + 1
        : 0;

    const {
      error: imageError
    } =
      await sb
        .from("project_images")
        .insert({

          project_id:
            projectId,

          image_url:
            imageUrl,

          alt_text:
            $("title").value.trim(),

          sort_order:
            nextOrder

        });

    if (imageError) {

      return {
        success: false,
        message:
          `Image database error: ${imageError.message}`
      };

    }

    uploaded++;

  }

  const {
    data: firstImage
  } =
    await sb
      .from("project_images")
      .select("image_url")
      .eq(
        "project_id",
        projectId
      )
      .order(
        "sort_order",
        {
          ascending: true
        }
      )
      .limit(1)
      .maybeSingle();

  if (firstImage?.image_url) {

    await sb
      .from("projects")
      .update({
        image_url:
          firstImage.image_url
      })
      .eq(
        "id",
        projectId
      );

  }

  return {
    success: true,
    message:
      `${uploaded} photo(s) uploaded successfully.`
  };

}

$("generateAiBtn").addEventListener(
  "click",
  async () => {

    const projectId =
      $("id").value ||
      editing?.id ||
      lastSavedProjectId;

    if (!projectId) {

      showMessage(
        "aiMessage",
        "Please save the project and upload its photographs first.",
        true
      );

      return;
    }

    const button =
      $("generateAiBtn");

    button.disabled = true;

    button.textContent =
      "✨ AI is analyzing your project photos...";

    showMessage(
      "aiMessage",
      "AI is analyzing the photographs and writing professional project content. Please wait...",
      false
    );

    try {

      const {
        data: { session }
      } = await sb.auth.getSession();

      if (!session) {

        throw new Error(
          "Your admin session has expired. Please log in again."
        );

      }

      const {
        data,
        error
      } =
        await sb.functions.invoke(
          "generate-project-content",
          {
            body: {
              projectId:
                projectId
            }
          }
        );

      if (error) {

        console.error(
          "AI function error:",
          error
        );

        throw new Error(
          error.message ||
          "AI generation failed."
        );

      }

      if (!data) {

        throw new Error(
          "The AI function returned no data."
        );

      }

      if (data.description) {

        $("description").value =
          data.description;

      }

      const {
        data: refreshedProject
      } =
        await sb
          .from("projects")
          .select(`
            *,
            project_images (
              id,
              image_url,
              alt_text,
              sort_order
            )
          `)
          .eq(
            "id",
            projectId
          )
          .single();

      if (refreshedProject) {

        editing =
          refreshedProject;

        lastSavedProjectId =
          refreshedProject.id;

        $("id").value =
          refreshedProject.id;

        renderCurrentGallery(
          refreshedProject.project_images || []
        );

      }

      let message =
        "✨ AI content generated successfully!";

      if (data.description) {

        message +=
          "\n\nProfessional project description generated.";

      }

      if (data.short_description) {

        message +=
          "\nShort description generated.";

      }

      if (
        data.captions &&
        data.captions.length
      ) {

        message +=
          `\n${data.captions.length} photo caption(s) generated.`;

      }

      showMessage(
        "aiMessage",
        message,
        false
      );

      await loadProjects();

    } catch (error) {

      console.error(
        "AI generation failed:",
        error
      );

      showMessage(
        "aiMessage",
        "AI error: " +
        error.message,
        true
      );

    }

    button.disabled = false;

    button.textContent =
      "✨ Generate Description & Captions with AI";

  }
);

window.deleteProjectImage = async function(
  imageId,
  projectId,
  imageUrl
) {

  if (
    !confirm(
      "Delete this project photo?"
    )
  ) {

    return;
  }

  const {
    error
  } =
    await sb
      .from("project_images")
      .delete()
      .eq(
        "id",
        imageId
      );

  if (error) {

    alert(
      "Could not delete photo: " +
      error.message
    );

    return;
  }

  try {

    const marker =
      "/storage/v1/object/public/project-images/";

    const position =
      imageUrl.indexOf(
        marker
      );

    if (position !== -1) {

      const storagePath =
        decodeURIComponent(
          imageUrl.substring(
            position +
            marker.length
          )
        );

      await sb
        .storage
        .from("project-images")
        .remove([
          storagePath
        ]);

    }

  } catch (storageError) {

    console.warn(
      "Storage cleanup warning:",
      storageError
    );

  }

  const {
    data: remaining
  } =
    await sb
      .from("project_images")
      .select("*")
      .eq(
        "project_id",
        projectId
      )
      .order(
        "sort_order",
        {
          ascending: true
        }
      );

  if (
    remaining &&
    remaining.length
  ) {

    await sb
      .from("projects")
      .update({
        image_url:
          remaining[0].image_url
      })
      .eq(
        "id",
        projectId
      );

  } else {

    await sb
      .from("projects")
      .update({
        image_url:
          null
      })
      .eq(
        "id",
        projectId
      );

  }

  if (
    editing &&
    editing.id === projectId
  ) {

    editing.project_images =
      remaining || [];

    renderCurrentGallery(
      remaining || []
    );

  }

  await loadProjects();

};

window.deleteProject = async function(id) {

  if (
    !confirm(
      "Delete this entire project and all of its photographs?"
    )
  ) {

    return;
  }

  const {
    data: images
  } =
    await sb
      .from("project_images")
      .select("image_url")
      .eq(
        "project_id",
        id
      );

  const {
    error
  } =
    await sb
      .from("projects")
      .delete()
      .eq(
        "id",
        id
      );

  if (error) {

    alert(
      "Could not delete project: " +
      error.message
    );

    return;
  }

  if (
    images &&
    images.length
  ) {

    const marker =
      "/storage/v1/object/public/project-images/";

    const paths =
      images
        .map(image => {

          const position =
            image.image_url.indexOf(
              marker
            );

          if (position === -1) {
            return null;
          }

          return decodeURIComponent(
            image.image_url.substring(
              position +
              marker.length
            )
          );

        })
        .filter(Boolean);

    if (paths.length) {

      await sb
        .storage
        .from("project-images")
        .remove(paths);

    }

  }

  if (
    editing &&
    editing.id === id
  ) {

    resetProjectForm();

  }

  if (
    lastSavedProjectId === id
  ) {

    lastSavedProjectId = null;

  }

  await loadProjects();

};

$("refreshProjectsBtn").addEventListener(
  "click",
  loadProjects
);

function showMessage(
  id,
  message,
  error = false
) {

  const el = $(id);

  if (!el) {
    return;
  }

  el.textContent =
    message;

  el.classList.add("show");

  if (error) {

    el.style.background =
      "#fbeaea";

    el.style.color =
      "#9b2226";

  } else {

    el.style.background =
      "#edf7ef";

    el.style.color =
      "#176b35";

  }

}

function escapeHtml(value) {

  return String(value ?? "")
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}

function escapeAttribute(value) {

  return escapeHtml(value);

}

sb.auth.onAuthStateChange(
  (event, session) => {

    if (session) {

      showDashboard();

    } else {

      showLogin();

    }

  }
);

boot();
