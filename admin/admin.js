const SUPABASE_URL = "https://jvaqtuiyswjybasfumjw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_GteenSO57Kw0uv1qm6YUiw_-uZ7Uwe0";

const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const $ = (id) => document.getElementById(id);

let editing = null;
let currentSettings = null;


/* =========================
   STARTUP
========================= */

async function boot() {

  const { data: { session } } = await sb.auth.getSession();

  if (session) {
    showDashboard();
  } else {
    showLogin();
  }

}


/* =========================
   LOGIN / LOGOUT
========================= */

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


/* LOGIN */

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


/* LOGOUT */

$("logoutBtn").addEventListener("click", async () => {

  await sb.auth.signOut();

  location.reload();

});


/* =========================
   WEBSITE SETTINGS
========================= */

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
    data?.company_name || "Handcraft Myanmar Company Limited";

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


/* SAVE SETTINGS */

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


  /*
    IMPORTANT:
    Use UPDATE instead of UPSERT because
    the site_settings row with id=1 already exists.
  */

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


/* =========================
   PROJECTS
========================= */

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


/* =========================
   PROJECT CARD
========================= */

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
                    onclick="deleteProjectImage('${image.id}', '${project.id}', '${escapeAttribute(image.image_url)}')"
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


/* =========================
   NEW PROJECT
========================= */

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

}


/* =========================
   EDIT PROJECT
========================= */

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


  window.scrollTo({
    top: 500,
    behavior: "smooth"
  });

};


/* =========================
   CURRENT GALLERY
========================= */

function renderCurrentGallery(images) {

  $("currentGallerySection").style.display =
    images.length
      ? "block"
      : "none";


  $("currentGallery").innerHTML =
    images
      .sort(
        (a, b) =>
          (a.sort_order || 0) -
          (b.sort_order || 0)
      )
      .map(image => `

        <div class="gallery-item">

          <img
            src="${escapeAttribute(image.image_url)}"
            alt="${escapeAttribute(image.alt_text || "")}"
          >

          <button
            onclick="deleteProjectImage('${image.id}', '${editing.id}', '${escapeAttribute(image.image_url)}')"
          >
            Delete
          </button>

        </div>

      `)
      .join("");

}


/* =========================
   SAVE PROJECT
========================= */

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


  /* UPDATE */

  if (editing) {

    const { error } = await sb
      .from("projects")
      .update(payload)
      .eq("id", editing.id);


    if (error) {

      showMessage(
        "projectMessage",
        "Error: " + error.message,
        true
      );

      return;
    }


    projectId = editing.id;

  }


  /* CREATE */

  else {

    const { data, error } = await sb
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


    projectId = data.id;

  }


  /* UPLOAD PHOTOS */

  const files =
    Array.from(
      $("images").files || []
    );


  if (files.length) {

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


  showMessage(
    "projectMessage",
    "Project saved successfully.",
    false
  );


  await loadProjects();


  setTimeout(() => {
    resetProjectForm();
  }, 700);

});


/* =========================
   UPLOAD PROJECT IMAGES
========================= */

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


    if (file.size > 8 * 1024 * 1024) {

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


    const { error: uploadError } =
      await sb
        .storage
        .from("project-images")
        .upload(
          storagePath,
          file,
          {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type
          }
        );


    if (uploadError) {

      return {
        success: false,
        message:
          `Upload failed for ${file.name}: ${uploadError.message}`
      };

    }


    const { data: publicData } =
      sb
        .storage
        .from("project-images")
        .getPublicUrl(storagePath);


    const imageUrl =
      publicData.publicUrl;


    const { data: existingImages } =
      await sb
        .from("project_images")
        .select("sort_order")
        .eq("project_id", projectId)
        .order("sort_order", {
          ascending: false
        })
        .limit(1);


    const nextOrder =
      existingImages &&
      existingImages.length
        ? Number(existingImages[0].sort_order || 0) + 1
        : 0;


    const { error: imageError } =
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


    /*
      Keep the first image as the main
      projects.image_url value for compatibility
      with the existing website.
    */

    if (uploaded === 0) {

      await sb
        .from("projects")
        .update({
          image_url: imageUrl
        })
        .eq("id", projectId);

    }


    uploaded++;

  }


  return {
    success: true,
    message:
      `${uploaded} photo(s) uploaded successfully.`
  };

}


/* =========================
   DELETE PROJECT IMAGE
========================= */

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


  const { error } =
    await sb
      .from("project_images")
      .delete()
      .eq("id", imageId);


  if (error) {

    alert(
      "Could not delete photo: " +
      error.message
    );

    return;
  }


  /*
    Try to remove the physical file
    from Supabase Storage as well.
  */

  try {

    const marker =
      "/storage/v1/object/public/project-images/";

    const position =
      imageUrl.indexOf(marker);


    if (position !== -1) {

      const storagePath =
        decodeURIComponent(
          imageUrl.substring(
            position + marker.length
          )
        );


      await sb
        .storage
        .from("project-images")
        .remove([storagePath]);

    }

  } catch (storageError) {

    console.warn(
      "Storage cleanup warning:",
      storageError
    );

  }


  /*
    If this was the main image,
    select another remaining image.
  */

  const { data: remaining } =
    await sb
      .from("project_images")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", {
        ascending: true
      });


  if (remaining && remaining.length) {

    await sb
      .from("projects")
      .update({
        image_url:
          remaining[0].image_url
      })
      .eq("id", projectId);

  } else {

    await sb
      .from("projects")
      .update({
        image_url: null
      })
      .eq("id", projectId);

  }


  if (editing && editing.id === projectId) {

    renderCurrentGallery(
      remaining || []
    );

  }


  await loadProjects();

};


/* =========================
   DELETE PROJECT
========================= */

window.deleteProject = async function(id) {

  if (
    !confirm(
      "Delete this entire project and all of its photographs?"
    )
  ) {

    return;
  }


  /*
    Get all images first so we can
    clean the Storage files.
  */

  const { data: images } =
    await sb
      .from("project_images")
      .select("image_url")
      .eq("project_id", id);


  /* Delete database project */

  const { error } =
    await sb
      .from("projects")
      .delete()
      .eq("id", id);


  if (error) {

    alert(
      "Could not delete project: " +
      error.message
    );

    return;
  }


  /*
    Clean Storage
  */

  if (images && images.length) {

    const marker =
      "/storage/v1/object/public/project-images/";

    const paths =
      images
        .map(image => {

          const position =
            image.image_url.indexOf(marker);

          if (position === -1) {
            return null;
          }

          return decodeURIComponent(
            image.image_url.substring(
              position + marker.length
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


  await loadProjects();

};


/* =========================
   REFRESH
========================= */

$("refreshProjectsBtn").addEventListener(
  "click",
  loadProjects
);


/* =========================
   MESSAGES
========================= */

function showMessage(
  id,
  message,
  error = false
) {

  const el = $(id);

  el.textContent = message;

  el.classList.add("show");

  if (error) {

    el.style.background = "#fbeaea";
    el.style.color = "#9b2226";

  } else {

    el.style.background = "#edf7ef";
    el.style.color = "#176b35";

  }

}


/* =========================
   SECURITY / HTML ESCAPING
========================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

  return escapeHtml(value);

}


/* =========================
   AUTH STATE
========================= */

sb.auth.onAuthStateChange(
  (event, session) => {

    if (session) {

      showDashboard();

    } else {

      showLogin();

    }

  }
);


/* =========================
   START
========================= */

boot();
