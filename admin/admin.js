const SUPABASE_URL =
  "https://jvaqtuiyswjybasfumjw.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_GteenSO57Kw0uv1qm6YUiw_-uZ7Uwe0";

const ADMIN_USER_ID =
  "a64b8ffc-bac7-473e-a4be-846f16b94f81";

const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const $ = id => document.getElementById(id);

let categories = [];
let projects = [];
let insights = [];
let currentProject = null;
let currentInsight = null;
let currentProjectPhotos = [];

document.addEventListener("DOMContentLoaded", boot);


/* =========================================================
   BOOT / LOGIN
========================================================= */

async function boot() {
  try {
    const { data, error } = await sb.auth.getSession();

    if (error) {
      showLogin();
      return;
    }

    if (data.session) {
      await showDashboard();
    } else {
      showLogin();
    }
  } catch (error) {
    console.error(error);
    showLogin();
  }
}

function showLogin() {
  if ($("login")) $("login").style.display = "block";
  if ($("dashboard")) $("dashboard").style.display = "none";
}

async function showDashboard() {
  if ($("login")) $("login").style.display = "none";
  if ($("dashboard")) $("dashboard").style.display = "block";

  await loadSettings();
  await loadCategories();
  await loadProjects();
  await loadInsights();
}

function message(id, text, error = false) {
  const el = $(id);
  if (!el) return;

  el.textContent = text;
  el.className =
    "message show " + (error ? "error" : "success");
}

function clearMessage(id) {
  const el = $(id);
  if (!el) return;

  el.textContent = "";
  el.className = "message";
}

function value(id, fallback = "") {
  const el = $(id);
  return el ? el.value.trim() : fallback;
}

function isChecked(id, fallback = false) {
  const el = $(id);
  return el ? el.checked : fallback;
}


/* =========================================================
   LOGIN
========================================================= */

if ($("loginForm")) {
  $("loginForm").addEventListener("submit", async event => {
    event.preventDefault();

    message("loginMessage", "Signing in...");

    const { error } =
      await sb.auth.signInWithPassword({
        email: value("email"),
        password: $("password")
          ? $("password").value
          : ""
      });

    if (error) {
      message(
        "loginMessage",
        error.message,
        true
      );
      return;
    }

    await showDashboard();
  });
}


/* =========================================================
   LOGOUT
========================================================= */

if ($("logoutBtn")) {
  $("logoutBtn").addEventListener(
    "click",
    async () => {
      await sb.auth.signOut();
      location.reload();
    }
  );
}


/* =========================================================
   WEBSITE SETTINGS
========================================================= */

async function loadSettings() {
  const { data, error } =
    await sb
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

  if (error) {
    message(
      "settingsMessage",
      error.message,
      true
    );
    return;
  }

  if (!data) return;

  if ($("companyName"))
    $("companyName").value =
      data.company_name || "";

  if ($("brandSubtitle"))
    $("brandSubtitle").value =
      data.brand_subtitle || "MYANMAR";

  if ($("companyEmail"))
    $("companyEmail").value =
      data.email || "";

  if ($("companyPhone"))
    $("companyPhone").value =
      data.phone || "";

  if ($("companyPhone2"))
    $("companyPhone2").value =
      data.phone2 || "";

  if ($("companyAddress"))
    $("companyAddress").value =
      data.address || "";

  if ($("mapEmbedUrl"))
    $("mapEmbedUrl").value =
      data.map_embed_url ||
      "https://www.google.com/maps?q=16.856993%2C96.1809639&z=17&output=embed";

  if ($("heroTitle"))
    $("heroTitle").value =
      data.hero_title ||
      "From Vision to Reality";

  if ($("heroSubtitle"))
    $("heroSubtitle").value =
      data.hero_subtitle || "";

  if ($("aboutTitle"))
    $("aboutTitle").value =
      data.about_title || "";

  if ($("aboutBody"))
    $("aboutBody").value =
      data.about_body || "";

  if ($("facebookUrl"))
    $("facebookUrl").value =
      data.facebook_url || "";

  if ($("instagramUrl"))
    $("instagramUrl").value =
      data.instagram_url || "";

  if ($("youtubeUrl"))
    $("youtubeUrl").value =
      data.youtube_url || "";

  if ($("pinterestUrl"))
    $("pinterestUrl").value =
      data.pinterest_url || "";

  if ($("tiktokUrl"))
    $("tiktokUrl").value =
      data.tiktok_url || "";
}

if ($("settingsForm")) {
  $("settingsForm").addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      message(
        "settingsMessage",
        "Saving website settings..."
      );

      const payload = {
        id: 1,

        company_name:
          value("companyName"),

        brand_subtitle:
          value("brandSubtitle"),

        email:
          value("companyEmail"),

        phone:
          value("companyPhone"),

        phone2:
          value("companyPhone2"),

        address:
          value("companyAddress"),

        map_embed_url:
          value("mapEmbedUrl"),

        hero_title:
          value("heroTitle"),

        hero_subtitle:
          value("heroSubtitle"),

        about_title:
          value("aboutTitle"),

        about_body:
          value("aboutBody"),

        facebook_url:
          value("facebookUrl"),

        instagram_url:
          value("instagramUrl"),

        youtube_url:
          value("youtubeUrl"),

        pinterest_url:
          value("pinterestUrl")
      };

      if ($("tiktokUrl")) {
        payload.tiktok_url =
          value("tiktokUrl");
      }

      const { error } =
        await sb
          .from("site_settings")
          .update(payload)
          .eq("id", 1);

      if (error) {
        message(
          "settingsMessage",
          error.message,
          true
        );
        return;
      }

      message(
        "settingsMessage",
        "Website settings saved successfully."
      );
    }
  );
}


/* =========================================================
   CATEGORIES
========================================================= */

async function loadCategories() {
  const { data, error } =
    await sb
      .from("project_categories")
      .select("*")
      .order(
        "sort_order",
        { ascending: true }
      );

  if (error) {
    message(
      "categoryMessage",
      error.message,
      true
    );
    return;
  }

  categories = data || [];

  renderCategorySelects();
  renderCategoryList();
}

function renderCategorySelects() {
  const projectSelect =
    $("category");

  const insightSelect =
    $("insightCategory");

  const options =
    categories
      .filter(item => item.active)
      .map(
        item => `
          <option value="${escapeHtml(
            item.name
          )}">
            ${escapeHtml(item.name)}
          </option>
        `
      )
      .join("");

  if (projectSelect) {
    const old =
      projectSelect.value;

    projectSelect.innerHTML =
      `<option value="">Select category</option>` +
      options;

    projectSelect.value = old;
  }

  if (insightSelect) {
    const old =
      insightSelect.value;

    insightSelect.innerHTML =
      `<option value="">Select category</option>` +
      options;

    insightSelect.value = old;
  }
}

function renderCategoryList() {
  const list =
    $("categoryList");

  if (!list) return;

  list.innerHTML =
    categories.length
      ? categories
          .map(
            category => `
              <div class="list-item">

                <div>

                  <strong>
                    ${escapeHtml(
                      category.name
                    )}
                  </strong>

                  <small>
                    ${
                      category.active
                        ? "Visible"
                        : "Hidden"
                    }

                    · Order:
                    ${category.sort_order}
                  </small>

                </div>

                <div class="list-actions">

                  <button
                    type="button"
                    onclick="editCategory('${category.id}')"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    class="secondary"
                    onclick="toggleCategory('${category.id}', ${!category.active})"
                  >
                    ${
                      category.active
                        ? "Hide"
                        : "Show"
                    }
                  </button>

                  <button
                    type="button"
                    class="danger"
                    onclick="deleteCategory('${category.id}')"
                  >
                    Delete
                  </button>

                </div>

              </div>
            `
          )
          .join("")
      : `<p class="muted">
          No categories yet.
        </p>`;
}

if ($("categoryForm")) {
  $("categoryForm").addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      const id =
        value("categoryId");

      const name =
        value("categoryName");

      if (!name) {
        message(
          "categoryMessage",
          "Please enter a category name.",
          true
        );
        return;
      }

      const payload = {
        name,

        slug:
          slugify(name),

        sort_order:
          Number(
            value("categorySortOrder")
          ) || 0,

        active:
          isChecked(
            "categoryActive",
            true
          )
      };

      let result;

      if (id) {
        result =
          await sb
            .from("project_categories")
            .update(payload)
            .eq("id", id);
      } else {
        result =
          await sb
            .from("project_categories")
            .insert(payload);
      }

      if (result.error) {
        message(
          "categoryMessage",
          result.error.message,
          true
        );
        return;
      }

      message(
        "categoryMessage",
        "Category saved."
      );

      resetCategoryForm();

      await loadCategories();
    }
  );
}

window.editCategory =
  function(id) {
    const item =
      categories.find(
        category =>
          category.id === id
      );

    if (!item) return;

    $("categoryId").value =
      item.id;

    $("categoryName").value =
      item.name;

    $("categorySortOrder").value =
      item.sort_order || 0;

    $("categoryActive").checked =
      item.active;

    scrollToElement(
      "categoryForm"
    );
  };

window.toggleCategory =
  async function(id, active) {
    const { error } =
      await sb
        .from("project_categories")
        .update({ active })
        .eq("id", id);

    if (error) {
      message(
        "categoryMessage",
        error.message,
        true
      );
      return;
    }

    await loadCategories();
  };

window.deleteCategory =
  async function(id) {
    if (
      !confirm(
        "Delete this category?"
      )
    ) {
      return;
    }

    const { error } =
      await sb
        .from("project_categories")
        .delete()
        .eq("id", id);

    if (error) {
      message(
        "categoryMessage",
        error.message,
        true
      );
      return;
    }

    await loadCategories();
  };

if ($("cancelCategoryBtn")) {
  $("cancelCategoryBtn").addEventListener(
    "click",
    resetCategoryForm
  );
}

function resetCategoryForm() {
  if ($("categoryForm"))
    $("categoryForm").reset();

  if ($("categoryId"))
    $("categoryId").value = "";

  if ($("categoryActive"))
    $("categoryActive").checked = true;
}


/* =========================================================
   PROJECTS
========================================================= */

async function loadProjects() {
  const { data, error } =
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
      .order(
        "sort_order",
        { ascending: true }
      )
      .order(
        "created_at",
        { ascending: false }
      );

  if (error) {
    message(
      "projectMessage",
      error.message,
      true
    );
    return;
  }

  projects = data || [];

  renderProjectList();
}

function renderProjectList() {
  const list =
    $("projectList");

  if (!list) return;

  list.innerHTML =
    projects.length
      ? projects
          .map(
            project => `
              <div class="list-item">

                <div>

                  <strong>
                    ${escapeHtml(
                      project.title
                    )}
                  </strong>

                  <small>

                    ${escapeHtml(
                      project.category || ""
                    )}

                    ${
                      project.location
                        ? " · " +
                          escapeHtml(
                            project.location
                          )
                        : ""
                    }

                    ·

                    ${
                      project.published
                        ? "Published"
                        : "Hidden"
                    }

                    ${
                      project.hero_enabled
                        ? " · Hero"
                        : ""
                    }

                  </small>

                </div>

                <div class="list-actions">

                  <button
                    type="button"
                    onclick="editProject('${project.id}')"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    class="gold"
                    onclick="generateProjectAI('${project.id}')"
                  >
                    ✨ AI
                  </button>

                  <button
                    type="button"
                    class="danger"
                    onclick="deleteProject('${project.id}')"
                  >
                    Delete
                  </button>

                </div>

              </div>
            `
          )
          .join("")
      : `<p class="muted">
          No projects yet.
        </p>`;
}


/* =========================================================
   PROJECT SAVE — FIXED
========================================================= */

if ($("projectForm")) {
  $("projectForm").addEventListener(
    "submit",
    saveProject
  );
}

async function saveProject(event) {
  event.preventDefault();

  clearMessage(
    "projectMessage"
  );

  const existingId =
    value("projectId");

  const title =
    value("projectTitle");

  const category =
    value("category");

  const location =
    value("projectLocation");

  const description =
    value("projectDescription");

  if (!title) {
    message(
      "projectMessage",
      "Please enter a project title.",
      true
    );
    return;
  }

  if (!category) {
    message(
      "projectMessage",
      "Please select a project category.",
      true
    );
    return;
  }

  /*
    KEY FIX:

    If this is a NEW project, create the UUID
    BEFORE inserting the project.

    The old version waited for Supabase to create
    the ID, while another part of the system expected
    projectId to already exist.
  */

  const projectId =
    existingId ||
    (
      window.crypto &&
      crypto.randomUUID
        ? crypto.randomUUID()
        : fallbackUuid()
    );

  $("projectId").value =
    projectId;

  const payload = {
    id: projectId,

    title,

    category,

    location,

    description,

    published:
      isChecked(
        "projectPublished",
        true
      ),

    sort_order:
      Number(
        value("projectSortOrder")
      ) || 0,

    hero_enabled:
      isChecked(
        "heroEnabled",
        false
      ),

    hero_order:
      Number(
        value("heroOrder")
      ) || 0
  };

  try {
    message(
      "projectMessage",
      existingId
        ? "Saving project changes..."
        : "Creating project..."
    );

    let result;

    if (existingId) {

      result =
        await sb
          .from("projects")
          .update(payload)
          .eq("id", projectId)
          .select()
          .single();

    } else {

      result =
        await sb
          .from("projects")
          .insert(payload)
          .select()
          .single();

    }

    if (result.error) {
      console.error(
        "Project save error:",
        result.error
      );

      message(
        "projectMessage",
        result.error.message ||
          "Project could not be saved.",
        true
      );

      return;
    }

    const project =
      result.data;

    if (
      !project ||
      !project.id
    ) {
      message(
        "projectMessage",
        "Project was saved but no project ID was returned.",
        true
      );
      return;
    }

    /*
      Keep the generated ID in the hidden field.
      This is what allows AI generation immediately
      after saving.
    */

    $("projectId").value =
      project.id;

    const files =
      $("projectImages") &&
      $("projectImages").files
        ? Array.from(
            $("projectImages").files
          )
        : [];

    if (files.length) {

      const uploadResult =
        await uploadProjectImages(
          project.id,
          files
        );

      if (
        !uploadResult.success
      ) {

        await loadProjects();

        editProject(
          project.id
        );

        message(
          "projectMessage",
          "Project saved, but photo upload failed: " +
            uploadResult.error,
          true
        );

        return;
      }
    }

    await loadProjects();

    editProject(
      project.id
    );

    message(
      "projectMessage",
      existingId
        ? "Project updated successfully."
        : "Project created successfully. You can now generate AI content."
    );

  } catch (error) {

    console.error(
      "Unexpected project save error:",
      error
    );

    message(
      "projectMessage",
      error.message ||
        "Unexpected error while saving the project.",
      true
    );
  }
}


/* =========================================================
   PROJECT PHOTO UPLOAD
========================================================= */

async function uploadProjectImages(
  projectId,
  files
) {
  if (!projectId) {
    return {
      success: false,
      error: "Project ID is missing."
    };
  }

  try {

    for (
      let i = 0;
      i < files.length;
      i++
    ) {

      const file =
        files[i];

      if (
        !file ||
        !file.name
      ) {
        continue;
      }

      const extension =
        file.name.includes(".")
          ? file.name
              .split(".")
              .pop()
              .toLowerCase()
          : "jpg";

      const safeExtension =
        extension.replace(
          /[^a-z0-9]/gi,
          ""
        ) || "jpg";

      const uniquePart =
        Date.now() +
        "-" +
        Math.random()
          .toString(36)
          .slice(2, 10);

      const path =
        `${projectId}/${uniquePart}-${i}.${safeExtension}`;

      const upload =
        await sb.storage
          .from("project-images")
          .upload(
            path,
            file,
            {
              upsert: false
            }
          );

      if (upload.error) {

        console.error(
          "Storage upload error:",
          upload.error
        );

        return {
          success: false,
          error:
            upload.error.message ||
            "Storage upload failed."
        };
      }

      const {
        data: publicData
      } =
        sb.storage
          .from("project-images")
          .getPublicUrl(
            path
          );

      if (
        !publicData ||
        !publicData.publicUrl
      ) {
        return {
          success: false,
          error:
            "Could not create the public image URL."
        };
      }

      const {
        data: existing,
        error: existingError
      } =
        await sb
          .from("project_images")
          .select(
            "sort_order"
          )
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

      if (existingError) {

        console.error(
          "Photo order lookup error:",
          existingError
        );

        return {
          success: false,
          error:
            existingError.message
        };
      }

      const nextOrder =
        existing &&
        existing.length
          ? Number(
              existing[0]
                .sort_order || 0
            ) + 1
          : 0;

      const {
        error:
          imageInsertError
      } =
        await sb
          .from("project_images")
          .insert({
            project_id:
              projectId,

            image_url:
              publicData.publicUrl,

            alt_text:
              "",

            sort_order:
              nextOrder
          });

      if (imageInsertError) {

        console.error(
          "Project image database error:",
          imageInsertError
        );

        return {
          success: false,
          error:
            imageInsertError.message
        };
      }
    }

    return {
      success: true
    };

  } catch (error) {

    console.error(
      "Photo upload exception:",
      error
    );

    return {
      success: false,
      error:
        error.message ||
        "Photo upload failed."
    };
  }
}


/* =========================================================
   EDIT PROJECT
========================================================= */

window.editProject =
  async function(id) {

    const project =
      projects.find(
        item =>
          item.id === id
      );

    if (!project) {
      return;
    }

    currentProject =
      project;

    $("projectId").value =
      project.id;

    $("projectTitle").value =
      project.title || "";

    $("category").value =
      project.category || "";

    $("projectLocation").value =
      project.location || "";

    $("projectDescription").value =
      project.description || "";

    $("projectPublished").checked =
      project.published !== false;

    $("projectSortOrder").value =
      project.sort_order || 0;

    $("heroEnabled").checked =
      project.hero_enabled === true;

    $("heroOrder").value =
      project.hero_order || 0;

    currentProjectPhotos =
      (
        project.project_images ||
        []
      )
      .slice()
      .sort(
        (a, b) =>
          Number(
            a.sort_order || 0
          ) -
          Number(
            b.sort_order || 0
          )
      );

    renderProjectPhotoPreview();

    scrollToElement(
      "projectForm"
    );
  };


/* =========================================================
   RESET PROJECT
========================================================= */

if ($("cancelProjectBtn")) {
  $("cancelProjectBtn").addEventListener(
    "click",
    resetProjectForm
  );
}

function resetProjectForm() {

  if ($("projectForm"))
    $("projectForm").reset();

  if ($("projectId"))
    $("projectId").value = "";

  if ($("projectPublished"))
    $("projectPublished").checked = true;

  if ($("heroEnabled"))
    $("heroEnabled").checked = false;

  if ($("heroOrder"))
    $("heroOrder").value = 0;

  if ($("projectPhotoPreview"))
    $("projectPhotoPreview").innerHTML = "";

  currentProject =
    null;

  currentProjectPhotos =
    [];
}


/* =========================================================
   PROJECT PHOTO PREVIEW
========================================================= */

function renderProjectPhotoPreview() {

  const container =
    $("projectPhotoPreview");

  if (!container)
    return;

  container.innerHTML =
    currentProjectPhotos
      .map(
        (photo, index) => `
          <div class="photo-card">

            <img
              src="${escapeAttribute(
                photo.image_url
              )}"
              alt="${escapeAttribute(
                photo.alt_text || ""
              )}"
            >

            <span class="photo-number">
              ${index + 1}
            </span>

            <button
              type="button"
              onclick="deleteProjectPhoto('${photo.id}')"
            >
              Delete
            </button>

          </div>
        `
      )
      .join("");
}


/* =========================================================
   DELETE PROJECT PHOTO
========================================================= */

window.deleteProjectPhoto =
  async function(id) {

    if (
      !confirm(
        "Delete this photo?"
      )
    ) {
      return;
    }

    const { error } =
      await sb
        .from("project_images")
        .delete()
        .eq("id", id);

    if (error) {

      message(
        "projectMessage",
        error.message,
        true
      );

      return;
    }

    if (currentProject) {

      await loadProjects();

      editProject(
        currentProject.id
      );
    }
  };


/* =========================================================
   DELETE PROJECT
========================================================= */

window.deleteProject =
  async function(id) {

    if (
      !confirm(
        "Delete this project and all its photos?"
      )
    ) {
      return;
    }

    const {
      error: photoError
    } =
      await sb
        .from("project_images")
        .delete()
        .eq(
          "project_id",
          id
        );

    if (photoError) {

      message(
        "projectMessage",
        photoError.message,
        true
      );

      return;
    }

    const { error } =
      await sb
        .from("projects")
        .delete()
        .eq(
          "id",
          id
        );

    if (error) {

      message(
        "projectMessage",
        error.message,
        true
      );

      return;
    }

    resetProjectForm();

    await loadProjects();

    message(
      "projectMessage",
      "Project deleted."
    );
  };


/* =========================================================
   PROJECT AI
========================================================= */

if ($("generateProjectAiBtn")) {

  $("generateProjectAiBtn")
    .addEventListener(
      "click",
      async () => {

        const id =
          value("projectId");

        if (!id) {

          message(
            "projectMessage",
            "Save the project first. The Project ID is created automatically when you save it.",
            true
          );

          return;
        }

        await generateProjectAI(
          id
        );
      }
    );
}

window.generateProjectAI =
  async function(id) {

    if (!id) {

      message(
        "projectMessage",
        "Project ID is required. Save the project first.",
        true
      );

      return;
    }

    const {
      data: {
        session
      }
    } =
      await sb.auth.getSession();

    if (!session) {

      message(
        "projectMessage",
        "Your admin session has expired.",
        true
      );

      return;
    }

    message(
      "projectMessage",
      "Gemini AI is analyzing the project photographs..."
    );

    try {

      const response =
        await fetch(
          `${SUPABASE_URL}/functions/v1/generate-project-content`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              "Authorization":
                `Bearer ${session.access_token}`
            },

            body:
              JSON.stringify({
                project_id:
                  id
              })
          }
        );

      let result = {};

      try {
        result =
          await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {

        throw new Error(
          result.error ||
          result.message ||
          `AI generation failed (${response.status}).`
        );
      }

      await loadProjects();

      editProject(
        id
      );

      message(
        "projectMessage",
        "AI content generated successfully. Review the project before publishing."
      );

    } catch (error) {

      console.error(
        "Project AI error:",
        error
      );

      message(
        "projectMessage",
        error.message ||
          "AI generation failed.",
        true
      );
    }
  };


/* =========================================================
   INSIGHTS
========================================================= */

async function loadInsights() {

  const { data, error } =
    await sb
      .from("insights")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );

  if (error) {

    message(
      "insightMessage",
      error.message,
      true
    );

    return;
  }

  insights =
    data || [];

  renderInsightList();
}

function renderInsightList() {

  const list =
    $("insightList");

  if (!list) return;

  list.innerHTML =
    insights.length
      ? insights
          .map(
            article => `
              <div class="list-item">

                <div>

                  <strong>
                    ${escapeHtml(
                      article.title
                    )}
                  </strong>

                  <small>

                    ${escapeHtml(
                      article.category ||
                      ""
                    )}

                    ·

                    ${
                      article.published
                        ? "Published"
                        : "Draft"
                    }

                  </small>

                </div>

                <div class="list-actions">

                  <button
                    type="button"
                    onclick="editInsight('${article.id}')"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    class="danger"
                    onclick="deleteInsight('${article.id}')"
                  >
                    Delete
                  </button>

                </div>

              </div>
            `
          )
          .join("")
      : `<p class="muted">
          No articles yet.
        </p>`;
}


/* =========================================================
   INSIGHT SAVE
========================================================= */

if ($("insightForm")) {

  $("insightForm")
    .addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        const id =
          value("insightId");

        const title =
          value("insightTitle");

        if (!title) {

          message(
            "insightMessage",
            "Please enter an article title.",
            true
          );

          return;
        }

        let slug =
          value("insightSlug");

        if (!slug) {
          slug =
            slugify(title);
        }

        const tags =
          value("insightTags")
            .split(",")
            .map(
              item =>
                item.trim()
            )
            .filter(Boolean);

        const payload = {

          title,

          slug,

          category:
            value("insightCategory"),

          excerpt:
            value("insightExcerpt"),

          content:
            value("insightContent"),

          seo_title:
            value("insightSeoTitle"),

          seo_description:
            value(
              "insightSeoDescription"
            ),

          tags,

          cover_image_url:
            value(
              "insightCoverImage"
            ),

          published:
            isChecked(
              "insightPublished",
              false
            ),

          published_at:
            isChecked(
              "insightPublished",
              false
            )
              ? new Date()
                  .toISOString()
              : null
        };

        let result;

        if (id) {

          result =
            await sb
              .from("insights")
              .update(payload)
              .eq(
                "id",
                id
              );

        } else {

          result =
            await sb
              .from("insights")
              .insert(
                payload
              );
        }

        if (result.error) {

          message(
            "insightMessage",
            result.error.message,
            true
          );

          return;
        }

        message(
          "insightMessage",
          "Article saved successfully."
        );

        resetInsightForm();

        await loadInsights();
      }
    );
}


/* =========================================================
   RESET INSIGHT
========================================================= */

if ($("cancelInsightBtn")) {

  $("cancelInsightBtn")
    .addEventListener(
      "click",
      resetInsightForm
    );
}

function resetInsightForm() {

  if ($("insightForm"))
    $("insightForm").reset();

  if ($("insightId"))
    $("insightId").value = "";

  if ($("insightPublished"))
    $("insightPublished").checked =
      false;

  currentInsight =
    null;
}


/* =========================================================
   EDIT INSIGHT
========================================================= */

window.editInsight =
  function(id) {

    const article =
      insights.find(
        item =>
          item.id === id
      );

    if (!article)
      return;

    currentInsight =
      article;

    $("insightId").value =
      article.id;

    $("insightTitle").value =
      article.title || "";

    $("insightCategory").value =
      article.category || "";

    $("insightSlug").value =
      article.slug || "";

    $("insightExcerpt").value =
      article.excerpt || "";

    $("insightContent").value =
      article.content || "";

    $("insightSeoTitle").value =
      article.seo_title || "";

    $("insightSeoDescription").value =
      article.seo_description || "";

    $("insightTags").value =
      Array.isArray(
        article.tags
      )
        ? article.tags.join(", ")
        : "";

    $("insightCoverImage").value =
      article.cover_image_url ||
      "";

    $("insightPublished").checked =
      article.published === true;

    scrollToElement(
      "insightForm"
    );
  };


/* =========================================================
   DELETE INSIGHT
========================================================= */

window.deleteInsight =
  async function(id) {

    if (
      !confirm(
        "Delete this article?"
      )
    ) {
      return;
    }

    const { error } =
      await sb
        .from("insights")
        .delete()
        .eq(
          "id",
          id
        );

    if (error) {

      message(
        "insightMessage",
        error.message,
        true
      );

      return;
    }

    await loadInsights();

    message(
      "insightMessage",
      "Article deleted."
    );
  };


/* =========================================================
   INSIGHT AI
========================================================= */

if ($("generateInsightAiBtn")) {

  $("generateInsightAiBtn")
    .addEventListener(
      "click",
      generateInsightAI
    );
}

async function generateInsightAI() {

  const title =
    value("insightTitle");

  const category =
    value("insightCategory");

  if (!title) {

    message(
      "insightMessage",
      "Enter an article title first.",
      true
    );

    return;
  }

  if (!category) {

    message(
      "insightMessage",
      "Select an article category first.",
      true
    );

    return;
  }

  const {
    data: {
      session
    }
  } =
    await sb.auth.getSession();

  if (!session) {

    message(
      "insightMessage",
      "Your admin session has expired.",
      true
    );

    return;
  }

  message(
    "insightMessage",
    "Gemini AI is writing your article..."
  );

  try {

    const response =
      await fetch(
        `${SUPABASE_URL}/functions/v1/generate-insight-content`,
        {
          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${session.access_token}`
          },

          body:
            JSON.stringify({

              title,

              category

            })
        }
      );

    let result = {};

    try {
      result =
        await response.json();
    } catch {
      result = {};
    }

    if (!response.ok) {

      throw new Error(
        result.error ||
        result.message ||
        `AI generation failed (${response.status}).`
      );
    }

    const article =
      result.data ||
      result;

    $("insightExcerpt").value =
      article.excerpt || "";

    $("insightContent").value =
      article.content || "";

    $("insightSeoTitle").value =
      article.seo_title || "";

    $("insightSeoDescription").value =
      article.seo_description || "";

    $("insightTags").value =
      Array.isArray(
        article.tags
      )
        ? article.tags.join(", ")
        : "";

    if (
      article.slug
    ) {

      $("insightSlug").value =
        article.slug;
    }

    message(
      "insightMessage",
      "AI article generated. Review and edit it before publishing."
    );

  } catch (error) {

    console.error(
      "Insight AI error:",
      error
    );

    message(
      "insightMessage",
      error.message ||
        "AI generation failed.",
      true
    );
  }
}


/* =========================================================
   HELPERS
========================================================= */

function slugify(value) {

  return String(
    value || ""
  )
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

function escapeHtml(value) {

  return String(
    value ?? ""
  ).replace(
    /[&<>\"']/g,
    character => {

      const map = {

        "&":
          "&amp;",

        "<":
          "&lt;",

        ">":
          "&gt;",

        '"':
          "&quot;",

        "'":
          "&#039;"
      };

      return (
        map[character] ||
        character
      );
    }
  );
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function scrollToElement(id) {

  const el =
    $(id);

  if (!el)
    return;

  window.scrollTo({

    top:
      el.getBoundingClientRect()
        .top +
      window.scrollY -
      80,

    behavior:
      "smooth"
  });
}

function fallbackUuid() {

  return (
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
  ).replace(
    /[xy]/g,
    character => {

      const random =
        Math.random() *
        16 |
        0;

      const value =
        character === "x"
          ? random
          : (random & 0x3) |
            0x8;

      return value.toString(
        16
      );
    }
  );
}
