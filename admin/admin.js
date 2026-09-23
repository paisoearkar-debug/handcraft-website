const SUPABASE_URL =
  "https://jvaqtuiyswjybasfumjw.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_GteenSO57Kw0uv1qm6YUiw_-uZ7Uwe0";

const ADMIN_USER_ID =
  "a64b8ffc-bac7-473e-a4be-846f16b94f81";

const sb =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


const $ = id =>
  document.getElementById(id);


let categories = [];

let projects = [];

let insights = [];

let currentProject = null;

let currentInsight = null;

let currentProjectPhotos = [];


document.addEventListener(
  "DOMContentLoaded",
  boot
);



async function boot() {

  const {
    data: {
      session
    }
  } =
    await sb.auth.getSession();


  if (session) {

    showDashboard();

  } else {

    showLogin();

  }

}



function showLogin() {

  $("login").style.display =
    "block";

  $("dashboard").style.display =
    "none";

}



async function showDashboard() {

  $("login").style.display =
    "none";

  $("dashboard").style.display =
    "block";


  await loadSettings();

  await loadCategories();

  await loadProjects();

  await loadInsights();

}



function message(
  id,
  text,
  error = false
) {

  const el =
    $(id);

  if (!el) {
    return;
  }


  el.textContent =
    text;


  el.className =
    "message show " +
    (error
      ? "error"
      : "success");

}



function clearMessage(id) {

  const el =
    $(id);

  if (el) {

    el.textContent =
      "";

    el.className =
      "message";

  }

}



/* LOGIN */

$("loginForm").addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    message(
      "loginMessage",
      "Signing in..."
    );


    const {
      error
    } =
      await sb.auth.signInWithPassword({

        email:
          $("email")
            .value
            .trim(),

        password:
          $("password")
            .value

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

  }
);



/* LOGOUT */

$("logoutBtn").addEventListener(
  "click",
  async () => {

    await sb.auth.signOut();

    location.reload();

  }
);



/* SETTINGS */

async function loadSettings() {

  const {
    data,
    error
  } =
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


  $("companyName").value =
    data?.company_name || "";

  $("brandSubtitle").value =
    data?.brand_subtitle || "MYANMAR";

  $("companyEmail").value =
    data?.email || "";

  $("companyPhone").value =
    data?.phone || "";

  $("companyPhone2").value =
    data?.phone2 || "";

  $("companyAddress").value =
    data?.address || "";

  $("mapEmbedUrl").value =
    data?.map_embed_url ||
    "https://www.google.com/maps?q=16.856993%2C96.1809639&z=17&output=embed";

  $("heroTitle").value =
    data?.hero_title ||
    "From Vision to Reality";

  $("heroSubtitle").value =
    data?.hero_subtitle || "";

  $("aboutTitle").value =
    data?.about_title || "";

  $("aboutBody").value =
    data?.about_body || "";

  $("facebookUrl").value =
    data?.facebook_url || "";

  $("instagramUrl").value =
    data?.instagram_url || "";

  $("youtubeUrl").value =
    data?.youtube_url || "";

  $("pinterestUrl").value =
    data?.pinterest_url || "";

}



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
        $("companyName")
          .value
          .trim(),

      brand_subtitle:
        $("brandSubtitle")
          .value
          .trim(),

      email:
        $("companyEmail")
          .value
          .trim(),

      phone:
        $("companyPhone")
          .value
          .trim(),

      phone2:
        $("companyPhone2")
          .value
          .trim(),

      address:
        $("companyAddress")
          .value
          .trim(),

      map_embed_url:
        $("mapEmbedUrl")
          .value
          .trim(),

      hero_title:
        $("heroTitle")
          .value
          .trim(),

      hero_subtitle:
        $("heroSubtitle")
          .value
          .trim(),

      about_title:
        $("aboutTitle")
          .value
          .trim(),

      about_body:
        $("aboutBody")
          .value
          .trim(),

      facebook_url:
        $("facebookUrl")
          .value
          .trim(),

      instagram_url:
        $("instagramUrl")
          .value
          .trim(),

      youtube_url:
        $("youtubeUrl")
          .value
          .trim(),

      pinterest_url:
        $("pinterestUrl")
          .value
          .trim(),

      updated_at:
        new Date()
          .toISOString()

    };


    const {
      error
    } =
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



/* CATEGORIES */

async function loadCategories() {

  const {
    data,
    error
  } =
    await sb
      .from("project_categories")
      .select("*")
      .order(
        "sort_order",
        {
          ascending: true
        }
      );


  if (error) {

    message(
      "categoryMessage",
      error.message,
      true
    );

    return;

  }


  categories =
    data || [];


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
      .filter(
        item =>
          item.active
      )
      .map(
        item => `

          <option value="${escapeHtml(
            item.name
          )}">

            ${escapeHtml(
              item.name
            )}

          </option>

        `
      )
      .join("");


  if (projectSelect) {

    const old =
      projectSelect.value;


    projectSelect.innerHTML =
      `<option value="">
        Select category
      </option>` +
      options;


    projectSelect.value =
      old;

  }


  if (insightSelect) {

    const old =
      insightSelect.value;


    insightSelect.innerHTML =
      `<option value="">
        Select category
      </option>` +
      options;


    insightSelect.value =
      old;

  }

}



function renderCategoryList() {

  const list =
    $("categoryList");


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



$("categoryForm").addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const id =
      $("categoryId")
        .value
        .trim();


    const name =
      $("categoryName")
        .value
        .trim();


    const slug =
      slugify(name);


    const payload = {

      name,

      slug,

      sort_order:
        Number(
          $("categorySortOrder")
            .value
        ) || 0,

      active:
        $("categoryActive")
          .checked

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



window.editCategory =
  function(id) {

    const item =
      categories.find(
        category =>
          category.id === id
      );


    if (!item) {
      return;
    }


    $("categoryId").value =
      item.id;

    $("categoryName").value =
      item.name;

    $("categorySortOrder").value =
      item.sort_order;

    $("categoryActive").checked =
      item.active;

    window.scrollTo({
      top:
        $("categoryForm")
          .getBoundingClientRect()
          .top +
        window.scrollY -
        100,
      behavior: "smooth"
    });

  };



window.toggleCategory =
  async function(id, active) {

    const {
      error
    } =
      await sb
        .from("project_categories")
        .update({
          active
        })
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


    const {
      error
    } =
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



$("cancelCategoryBtn")
  .addEventListener(
    "click",
    resetCategoryForm
  );



function resetCategoryForm() {

  $("categoryForm")
    .reset();

  $("categoryId").value =
    "";

  $("categoryActive").checked =
    true;

}



/* PROJECTS */

async function loadProjects() {

  const {
    data,
    error
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
      .order(
        "sort_order",
        {
          ascending: true
        }
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    message(
      "projectMessage",
      error.message,
      true
    );

    return;

  }


  projects =
    data || [];


  renderProjectList();

}



function renderProjectList() {

  const list =
    $("projectList");


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
                      project.category ||
                      ""
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



$("projectForm").addEventListener(
  "submit",
  saveProject
);



async function saveProject(
  event
) {

  event.preventDefault();


  const id =
    $("projectId")
      .value
      .trim();


  const payload = {

    title:
      $("projectTitle")
        .value
        .trim(),

    category:
      $("category")
        .value
        .trim(),

    location:
      $("projectLocation")
        .value
        .trim(),

    description:
      $("projectDescription")
        .value
        .trim(),

    published:
      $("projectPublished")
        .checked,

    sort_order:
      Number(
        $("projectSortOrder")
          .value
      ) || 0,

    hero_enabled:
      $("heroEnabled")
        .checked,

    hero_order:
      Number(
        $("heroOrder")
          .value
      ) || 0,

    updated_at:
      new Date()
        .toISOString()

  };


  if (!payload.title) {

    message(
      "projectMessage",
      "Please enter a project title.",
      true
    );

    return;

  }


  let project;


  if (id) {

    const result =
      await sb
        .from("projects")
        .update(payload)
        .eq("id", id)
        .select()
        .single();


    if (result.error) {

      message(
        "projectMessage",
        result.error.message,
        true
      );

      return;

    }


    project =
      result.data;

  } else {

    const result =
      await sb
        .from("projects")
        .insert(payload)
        .select()
        .single();


    if (result.error) {

      message(
        "projectMessage",
        result.error.message,
        true
      );

      return;

    }


    project =
      result.data;

  }


  const files =
    $("projectImages")
      .files;


  if (files.length) {

    await uploadProjectImages(
      project.id,
      files
    );

  }


  message(
    "projectMessage",
    "Project saved successfully."
  );


  await loadProjects();

  editProject(
    project.id
  );

}



async function uploadProjectImages(
  projectId,
  files
) {

  for (
    let i = 0;
    i < files.length;
    i++
  ) {

    const file =
      files[i];


    const extension =
      file.name
        .split(".")
        .pop()
        .toLowerCase();


    const path =
      `${projectId}/${Date.now()}-${i}.${extension}`;


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
        upload.error
      );

      continue;

    }


    const {
      data: publicData
    } =
      sb.storage
        .from("project-images")
        .getPublicUrl(path);


    const {
      data: existing
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
      existing?.length
        ? Number(
            existing[0].sort_order
          ) + 1
        : 0;


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

  }

}



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
        (a,b) =>
          (a.sort_order || 0) -
          (b.sort_order || 0)
      );


    renderProjectPhotoPreview();


    window.scrollTo({
      top:
        $("projectForm")
          .getBoundingClientRect()
          .top +
        window.scrollY -
        80,
      behavior:
        "smooth"
    });

  };



$("cancelProjectBtn")
  .addEventListener(
    "click",
    resetProjectForm
  );



function resetProjectForm() {

  $("projectForm")
    .reset();

  $("projectId").value =
    "";

  $("projectPublished").checked =
    true;

  $("heroEnabled").checked =
    false;

  $("projectPhotoPreview")
    .innerHTML =
    "";

  currentProject =
    null;

  currentProjectPhotos =
    [];

}



function renderProjectPhotoPreview() {

  const container =
    $("projectPhotoPreview");


  container.innerHTML =
    currentProjectPhotos
      .map(
        (photo, index) => `

          <div class="photo-card">

            <img
              src="${escapeHtml(
                photo.image_url
              )}"
              alt=""
            >

            <span
              class="photo-number"
            >
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



window.deleteProjectPhoto =
  async function(id) {

    if (
      !confirm(
        "Delete this photo?"
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



window.deleteProject =
  async function(id) {

    if (
      !confirm(
        "Delete this project and all its photos?"
      )
    ) {
      return;
    }


    await sb
      .from("project_images")
      .delete()
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
        .eq("id", id);


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

  };



/* AI PROJECT */

$("generateProjectAiBtn")
  .addEventListener(
    "click",
    async () => {

      const id =
        $("projectId")
          .value
          .trim();


      if (!id) {

        message(
          "projectMessage",
          "Save the project first, then generate AI content.",
          true
        );

        return;

      }


      await generateProjectAI(
        id
      );

    }
  );



window.generateProjectAI =
  async function(id) {

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
      "AI is analyzing the project photographs..."
    );


    try {

      const response =
        await fetch(
          `${SUPABASE_URL}/functions/v1/generate-project-content`,
          {
            method: "POST",

            headers: {

              "Content-Type":
                "application/json",

              "Authorization":
                `Bearer ${session.access_token}`

            },

            body:
              JSON.stringify({
                project_id: id
              })

          }
        );


      const result =
        await response.json();


      if (!response.ok) {

        throw new Error(
          result.error ||
          "AI generation failed."
        );

      }


      await loadProjects();

      editProject(id);


      message(
        "projectMessage",
        "AI content generated. Review it and save any changes."
      );

    } catch (error) {

      message(
        "projectMessage",
        error.message,
        true
      );

    }

  };



/* INSIGHTS */

async function loadInsights() {

  const {
    data,
    error
  } =
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



$("insightForm").addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const id =
      $("insightId")
        .value
        .trim();


    const title =
      $("insightTitle")
        .value
        .trim();


    let slug =
      $("insightSlug")
        .value
        .trim();


    if (!slug) {

      slug =
        slugify(title);

    }


    const tags =
      $("insightTags")
        .value
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
        $("insightCategory")
          .value
          .trim(),

      excerpt:
        $("insightExcerpt")
          .value
          .trim(),

      content:
        $("insightContent")
          .value
          .trim(),

      seo_title:
        $("insightSeoTitle")
          .value
          .trim(),

      seo_description:
        $("insightSeoDescription")
          .value
          .trim(),

      tags,

      cover_image_url:
        $("insightCoverImage")
          .value
          .trim(),

      published:
        $("insightPublished")
          .checked,

      published_at:
        $("insightPublished")
          .checked
          ? new Date().toISOString()
          : null,

      updated_at:
        new Date().toISOString()

    };


    let result;


    if (id) {

      result =
        await sb
          .from("insights")
          .update(payload)
          .eq("id", id);

    } else {

      result =
        await sb
          .from("insights")
          .insert(payload);

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



$("cancelInsightBtn")
  .addEventListener(
    "click",
    resetInsightForm
  );



function resetInsightForm() {

  $("insightForm")
    .reset();

  $("insightId").value =
    "";

  $("insightPublished").checked =
    false;

  currentInsight =
    null;

}



window.editInsight =
  function(id) {

    const article =
      insights.find(
        item =>
          item.id === id
      );


    if (!article) {
      return;
    }


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
      Array.isArray(article.tags)
        ? article.tags.join(", ")
        : "";

    $("insightCoverImage").value =
      article.cover_image_url || "";

    $("insightPublished").checked =
      article.published === true;


    window.scrollTo({
      top:
        $("insightForm")
          .getBoundingClientRect()
          .top +
        window.scrollY -
        80,
      behavior:
        "smooth"
    });

  };



window.deleteInsight =
  async function(id) {

    if (
      !confirm(
        "Delete this article?"
      )
    ) {
      return;
    }


    const {
      error
    } =
      await sb
        .from("insights")
        .delete()
        .eq("id", id);


    if (error) {

      message(
        "insightMessage",
        error.message,
        true
      );

      return;

    }


    await loadInsights();

  };



/* AI INSIGHT */

$("generateInsightAiBtn")
  .addEventListener(
    "click",
    generateInsightAI
  );



async function generateInsightAI() {

  const title =
    $("insightTitle")
      .value
      .trim();


  const category =
    $("insightCategory")
      .value
      .trim();


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
          method: "POST",

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


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "AI generation failed."
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

    message(
      "insightMessage",
      error.message,
      true
    );

  }

}



/* HELPERS */

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

        "&": "&amp;",

        "<": "&lt;",

        ">": "&gt;",

        '"': "&quot;",

        "'": "&#039;"

      };


      return (
        map[character] ||
        character
      );

    }
  );

}



function escapeAttribute(value) {

  return escapeHtml(
    value
  );

}
