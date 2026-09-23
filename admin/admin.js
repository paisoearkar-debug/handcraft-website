/* =========================================================
   HANDCRAFT MYANMAR
   ADMIN PANEL
   Projects + Categories + Hero + Insights + AI
========================================================= */

const SUPABASE_URL =
  "https://jvaqtuiyswjybasfumjw.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_GteenSO57Kw0uv1qm6YUiw_-uZ7Uwe0";

const sb =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


/* =========================================================
   HELPERS
========================================================= */

const $ = (id) =>
  document.getElementById(id);


let editing = null;

let currentSettings = null;

let lastSavedProjectId = null;

let editingInsight = null;

let categories = [];


/* =========================================================
   STARTUP
========================================================= */

async function boot() {

  const {
    data: { session }
  } =
    await sb.auth.getSession();


  if (session) {

    showDashboard();

  } else {

    showLogin();

  }

}


/* =========================================================
   LOGIN / DASHBOARD
========================================================= */

function showLogin() {

  $("login").style.display =
    "block";

  $("dashboard").style.display =
    "none";

  $("logoutBtn").style.display =
    "none";

}


async function showDashboard() {

  $("login").style.display =
    "none";

  $("dashboard").style.display =
    "block";

  $("logoutBtn").style.display =
    "inline-block";


  await Promise.all([

    loadSettings(),

    loadCategories(),

    loadProjects(),

    loadInsights()

  ]);

}


/* =========================================================
   LOGIN
========================================================= */

$("loginForm").addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const email =
      $("email").value.trim();

    const password =
      $("password").value;


    showMessage(
      "loginMessage",
      "Signing in...",
      false
    );


    const {
      error
    } =
      await sb.auth.signInWithPassword({
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


    $("loginMessage")
      .classList
      .remove("show");


    await showDashboard();

  }
);


/* =========================================================
   LOGOUT
========================================================= */

$("logoutBtn").addEventListener(
  "click",
  async () => {

    await sb.auth.signOut();

    location.reload();

  }
);


/* =========================================================
   WEBSITE SETTINGS
========================================================= */

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

    showMessage(
      "settingsMessage",
      error.message,
      true
    );

    return;

  }


  currentSettings =
    data || {};


  $("companyName").value =
    data?.company_name ||
    "Handcraft Myanmar Company Limited";


  $("brandSubtitle").value =
    data?.brand_subtitle ||
    "MYANMAR";


  $("companyEmail").value =
    data?.email ||
    "";


  $("companyPhone").value =
    data?.phone ||
    "";


  $("companyPhone2").value =
    data?.phone2 ||
    "";


  $("companyAddress").value =
    data?.address ||
    "";


  $("mapEmbedUrl").value =
    data?.map_embed_url ||
    "";


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
    data?.about_body ||
    "";


  $("facebookUrl").value =
    data?.facebook_url ||
    "";


  $("instagramUrl").value =
    data?.instagram_url ||
    "";
     $("youtubeUrl").value =
    data?.youtube_url ||
    "";

  $("pinterestUrl").value =
    data?.pinterest_url ||
    "";

}


$("settingsForm").addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    showMessage(
      "settingsMessage",
      "Saving website settings...",
      false
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
        new Date().toISOString()

    };


    const {
      error
    } =
      await sb
        .from("site_settings")
        .update(payload)
        .eq("id", 1);


    if (error) {

      showMessage(
        "settingsMessage",
        "Error: " +
          error.message,
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

  }
);


/* =========================================================
   PROJECT CATEGORIES
========================================================= */

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
      )
      .order(
        "name",
        {
          ascending: true
        }
      );


  if (error) {

    showMessage(
      "categoryMessage",
      error.message,
      true
    );

    return;

  }


  categories =
    data || [];


  renderCategoryDropdowns();

  renderCategoryList();

}


function renderCategoryDropdowns() {

  const projectSelect =
    $("category");

  const insightSelect =
    $("insightCategory");


  if (projectSelect) {

    const currentValue =
      projectSelect.value;


    projectSelect.innerHTML = `

      <option value="">
        Select category
      </option>

      ${
        categories
          .map(
            category => `

              <option
                value="${escapeAttribute(
                  category.name
                )}"
              >
                ${escapeHtml(
                  category.name
                )}
                ${
                  category.active
                    ? ""
                    : " — Hidden"
                }
              </option>

            `
          )
          .join("")
      }

    `;


    if (
      currentValue &&
      categories.some(
        category =>
          category.name ===
          currentValue
      )
    ) {

      projectSelect.value =
        currentValue;

    }

  }


  if (insightSelect) {

    const currentValue =
      insightSelect.value;


    insightSelect.innerHTML = `

      <option value="">
        Select category
      </option>

      <option value="Interior Design">
        Interior Design
      </option>

      ${
        categories
          .filter(
            category =>
              category.active
          )
          .map(
            category => `

              <option
                value="${escapeAttribute(
                  category.name
                )}"
              >
                ${escapeHtml(
                  category.name
                )}
              </option>

            `
          )
          .join("")
      }

    `;


    if (currentValue) {

      insightSelect.value =
        currentValue;

    }

  }

}


function renderCategoryList() {

  const list =
    $("categoryList");


  if (!list) {
    return;
  }


  if (!categories.length) {

    list.innerHTML = `
      <p class="muted">
        No categories yet.
      </p>
    `;

    return;

  }


  list.innerHTML =
    categories
      .map(
        category => `

          <div
            class="category-item"
          >

            <div
              class="category-info"
            >

              <div
                class="category-name"
              >

                ${escapeHtml(
                  category.name
                )}

                ${
                  category.active
                    ? `<span class="badge badge-published">Active</span>`
                    : `<span class="badge badge-hidden">Hidden</span>`
                }

              </div>


              <div
                class="category-slug"
              >

                ${escapeHtml(
                  category.slug
                )}

                · Order
                ${Number(
                  category.sort_order || 0
                )}

              </div>

            </div>


            <div
              class="category-actions"
            >

              <button
                type="button"
                class="btn-secondary"
                onclick="editCategory('${category.id}')"
              >
                Edit
              </button>


              <button
                type="button"
                class="btn-secondary"
                onclick="toggleCategory('${category.id}')"
              >

                ${
                  category.active
                    ? "Hide"
                    : "Show"
                }

              </button>


              <button
                type="button"
                class="btn-danger"
                onclick="deleteCategory('${category.id}')"
              >
                Delete
              </button>

            </div>

          </div>

        `
      )
      .join("");

}


$("categoryForm").addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const id =
      $("categoryId")
        .value
        .trim();


    const name =
      $("categoryName")
        .value
        .trim();


    const sortOrder =
      Number(
        $("categorySortOrder")
          .value || 0
      );


    const active =
      $("categoryActive")
        .checked;


    if (!name) {

      showMessage(
        "categoryMessage",
        "Please enter a category name.",
        true
      );

      return;

    }


    const slug =
      slugify(name);


    showMessage(
      "categoryMessage",
      id
        ? "Updating category..."
        : "Adding category...",
      false
    );


    let result;


    if (id) {

      result =
        await sb
          .from(
            "project_categories"
          )
          .update({

            name,

            slug,

            sort_order:
              sortOrder,

            active

          })
          .eq(
            "id",
            id
          );

    } else {

      result =
        await sb
          .from(
            "project_categories"
          )
          .insert({

            name,

            slug,

            sort_order:
              sortOrder,

            active

          });

    }


    if (result.error) {

      showMessage(
        "categoryMessage",
        "Error: " +
          result.error.message,
        true
      );

      return;

    }


    resetCategoryForm();

    await loadCategories();

    await loadProjects();


    showMessage(
      "categoryMessage",
      id
        ? "Category updated successfully."
        : "Category added successfully.",
      false
    );

  }
);


window.editCategory =
  function(id) {

    const category =
      categories.find(
        item =>
          item.id === id
      );


    if (!category) {
      return;
    }


    $("categoryId").value =
      category.id;


    $("categoryName").value =
      category.name;


    $("categorySortOrder").value =
      category.sort_order || 0;


    $("categoryActive").checked =
      category.active;


    $("saveCategoryBtn")
      .textContent =
      "Update Category";


    $("cancelCategoryBtn")
      .style
      .display =
      "inline-block";


    $("categoryName")
      .focus();

  };


$("cancelCategoryBtn")
  .addEventListener(
    "click",
    resetCategoryForm
  );


function resetCategoryForm() {

  $("categoryId").value =
    "";


  $("categoryName").value =
    "";


  $("categorySortOrder").value =
    "0";


  $("categoryActive").checked =
    true;


  $("saveCategoryBtn")
    .textContent =
    "Add Category";


  $("cancelCategoryBtn")
    .style
    .display =
    "none";

}


window.toggleCategory =
  async function(id) {

    const category =
      categories.find(
        item =>
          item.id === id
      );


    if (!category) {
      return;
    }


    const {
      error
    } =
      await sb
        .from(
          "project_categories"
        )
        .update({
          active:
            !category.active
        })
        .eq(
          "id",
          id
        );


    if (error) {

      alert(
        "Could not update category: " +
          error.message
      );

      return;

    }


    await loadCategories();

  };


window.deleteCategory =
  async function(id) {

    const category =
      categories.find(
        item =>
          item.id === id
      );


    if (!category) {
      return;
    }


    const {
      count
    } =
      await sb
        .from("projects")
        .select(
          "id",
          {
            count: "exact",
            head: true
          }
        )
        .eq(
          "category",
          category.name
        );


    if (count > 0) {

      alert(
        `This category is used by ${count} project(s).\n\nHide the category instead of deleting it.`
      );

      return;

    }


    if (
      !confirm(
        `Delete the category "${category.name}"?`
      )
    ) {

      return;

    }


    const {
      error
    } =
      await sb
        .from(
          "project_categories"
        )
        .delete()
        .eq(
          "id",
          id
        );


    if (error) {

      alert(
        "Could not delete category: " +
          error.message
      );

      return;

    }


    await loadCategories();

  };


/* =========================================================
   PROJECTS
========================================================= */

async function loadProjects() {

  $("list").innerHTML =
    "<p class='muted'>Loading projects...</p>";


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

    $("list").innerHTML =
      `
        <div class="notice show">
          ${escapeHtml(
            error.message
          )}
        </div>
      `;

    return;

  }


  const projects =
    data || [];


  if (!projects.length) {

    $("list").innerHTML =
      `
        <p class="muted">
          No projects yet.
          Create your first project above.
        </p>
      `;

    return;

  }


  $("list").innerHTML =
    projects
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
      ? `
        <span class="badge badge-published">
          Published
        </span>
      `
      : `
        <span class="badge badge-hidden">
          Hidden
        </span>
      `;


  const heroBadge =
    project.hero_enabled
      ? `
        <span class="badge badge-hero">
          ⭐ Homepage Hero #${
            Number(
              project.hero_order || 0
            )
          }
        </span>
      `
      : "";


  const photoCount =
    images.length;


  return `

    <div
      class="project-card"
    >

      <div
        class="project-card-top"
      >

        <div>

          <h3>

            ${escapeHtml(
              project.title ||
              "Untitled Project"
            )}

          </h3>


          <div
            class="project-meta"
          >

            ${publishedBadge}

            ${heroBadge}


            <span class="badge">

              ${escapeHtml(
                project.category ||
                "Uncategorized"
              )}

            </span>


            ${
              project.location
                ? `
                  <br>
                  📍
                  ${escapeHtml(
                    project.location
                  )}
                `
                : ""
            }


            <br>

            📷
            ${photoCount}
            ${
              photoCount === 1
                ? "photo"
                : "photos"
            }

          </div>

        </div>


        <div
          class="actions"
        >

          <button
            class="btn-secondary"
            type="button"
            onclick="editProject('${project.id}')"
          >
            Edit
          </button>


          <button
            class="btn-danger"
            type="button"
            onclick="deleteProject('${project.id}')"
          >
            Delete
          </button>

        </div>

      </div>


      ${
        project.description
          ? `
            <p
              class="muted"
              style="margin:15px 0 0"
            >

              ${escapeHtml(
                project.description
              )}

            </p>
          `
          : ""
      }


      ${
        project.hero_enabled
          ? `
            <div
              class="hero-status"
            >

              ⭐ This project is selected
              for the homepage hero.

              Hero order:
              <strong>
                ${Number(
                  project.hero_order || 0
                )}
              </strong>

            </div>
          `
          : ""
      }


      ${
        images.length
          ? `
            <div
              class="gallery"
            >

              ${
                images
                  .map(
                    image => `

                      <div
                        class="gallery-item"
                      >

                        <img
                          src="${escapeAttribute(
                            image.image_url
                          )}"
                          alt="${escapeAttribute(
                            image.alt_text ||
                            project.title ||
                            ""
                          )}"
                          loading="lazy"
                        >

                        <button
                          type="button"
                          onclick="deleteProjectImage(
                            '${image.id}',
                            '${project.id}',
                            '${escapeAttribute(
                              image.image_url
                            )}'
                          )"
                        >
                          Delete
                        </button>

                      </div>

                    `
                  )
                  .join("")
              }

            </div>
          `
          : `
            <p
              class="muted"
              style="margin-top:15px"
            >
              No photographs uploaded.
            </p>
          `
      }

    </div>

  `;

}


/* =========================================================
   NEW PROJECT
========================================================= */

$("newProjectBtn").addEventListener(
  "click",
  () => {

    resetProjectForm();

    window.scrollTo({
      top: 500,
      behavior: "smooth"
    });

  }
);


$("cancelEditBtn").addEventListener(
  "click",
  resetProjectForm
);


function resetProjectForm() {

  editing = null;

  lastSavedProjectId =
    null;


  $("projectForm")
    .reset();


  $("id").value =
    "";


  $("sortOrder").value =
    "0";


  $("heroOrder").value =
    "0";


  $("heroEnabled").checked =
    false;


  $("published").checked =
    true;


  $("projectEditorTitle")
    .textContent =
    "Add Project";


  $("currentGallerySection")
    .style
    .display =
    "none";


  $("currentGallery")
    .innerHTML =
    "";


  $("projectMessage")
    .classList
    .remove("show");


  if ($("aiMessage")) {

    $("aiMessage")
      .classList
      .remove("show");

  }


  renderCategoryDropdowns();

}


/* =========================================================
   EDIT PROJECT
========================================================= */

window.editProject =
  async function(id) {

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
        .eq(
          "id",
          id
        )
        .single();


    if (error) {

      alert(
        error.message
      );

      return;

    }


    editing =
      data;


    lastSavedProjectId =
      data.id;


    $("id").value =
      data.id;


    $("title").value =
      data.title || "";


    renderCategoryDropdowns();


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


    $("heroEnabled").checked =
      data.hero_enabled === true;


    $("heroOrder").value =
      data.hero_order || 0;


    $("projectEditorTitle")
      .textContent =
      "Edit Project";


    renderCurrentGallery(
      data.project_images || []
    );


    if ($("aiMessage")) {

      $("aiMessage")
        .classList
        .remove("show");

    }


    window.scrollTo({
      top: 500,
      behavior: "smooth"
    });

  };


/* =========================================================
   PHOTO GALLERY / DRAG ORDER
========================================================= */

function renderCurrentGallery(
  images
) {

  const section =
    $("currentGallerySection");


  const gallery =
    $("currentGallery");


  section.style.display =
    images.length
      ? "block"
      : "none";


  const sortedImages =
    [...images].sort(
      (a, b) =>
        (a.sort_order || 0) -
        (b.sort_order || 0)
    );


  gallery.innerHTML =
    sortedImages
      .map(
        (image, index) => `

          <div
            class="gallery-item"
            draggable="true"
            data-image-id="${escapeAttribute(
              image.id
            )}"
            title="Drag this photo to change its order"
            style="
              cursor:grab;
              position:relative;
            "
          >

            ${
              index === 0
                ? `
                  <div
                    style="
                      position:absolute;
                      top:8px;
                      left:8px;
                      z-index:2;
                      background:#111;
                      color:#fff;
                      padding:5px 8px;
                      border-radius:999px;
                      font-size:11px;
                      font-weight:700;
                      letter-spacing:.08em;
                    "
                  >
                    COVER
                  </div>
                `
                : ""
            }


            <div
              style="
                position:absolute;
                right:8px;
                top:8px;
                z-index:2;
                background:rgba(255,255,255,.92);
                color:#111;
                padding:5px 8px;
                border-radius:999px;
                font-size:11px;
                font-weight:600;
              "
            >
              ↕ Drag
            </div>


            <img
              src="${escapeAttribute(
                image.image_url
              )}"
              alt="${escapeAttribute(
                image.alt_text || ""
              )}"
              draggable="false"
            >


            <button
              type="button"
              onclick="deleteProjectImage(
                '${image.id}',
                '${editing.id}',
                '${escapeAttribute(
                  image.image_url
                )}'
              )"
            >
              Delete
            </button>

          </div>

        `
      )
      .join("");


  let draggedItem =
    null;


  gallery
    .querySelectorAll(
      ".gallery-item"
    )
    .forEach(item => {


      item.addEventListener(
        "dragstart",
        event => {

          draggedItem =
            item;


          item.style.opacity =
            "0.55";


          item.style.cursor =
            "grabbing";


          event.dataTransfer
            .effectAllowed =
            "move";


          event.dataTransfer
            .setData(
              "text/plain",
              item.dataset.imageId
            );

        }
      );


      item.addEventListener(
        "dragover",
        event => {

          event.preventDefault();


          if (
            !draggedItem ||
            draggedItem === item
          ) {

            return;

          }


          const rect =
            item.getBoundingClientRect();


          const insertAfter =
            event.clientY >
            rect.top +
              rect.height / 2;


          if (insertAfter) {

            item.parentNode
              .insertBefore(
                draggedItem,
                item.nextSibling
              );

          } else {

            item.parentNode
              .insertBefore(
                draggedItem,
                item
              );

          }

        }
      );


      item.addEventListener(
        "dragend",
        async () => {

          if (!draggedItem) {
            return;
          }


          draggedItem.style.opacity =
            "1";


          draggedItem.style.cursor =
            "grab";


          draggedItem =
            null;


          await saveGalleryOrder();

        }
      );

    });

}


/* =========================================================
   SAVE PHOTO ORDER
========================================================= */

async function saveGalleryOrder() {

  const gallery =
    $("currentGallery");


  if (
    !gallery ||
    !editing?.id
  ) {

    return;

  }


  const items =
    Array.from(
      gallery.querySelectorAll(
        ".gallery-item"
      )
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
    items.map(
      (item, index) =>
        sb
          .from(
            "project_images"
          )
          .update({
            sort_order:
              index
          })
          .eq(
            "id",
            item.dataset.imageId
          )
    );


  const results =
    await Promise.all(
      updates
    );


  const failed =
    results.find(
      result =>
        result.error
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
    editing
      .project_images
      ?.find(
        image =>
          image.id ===
          firstItem.dataset.imageId
      );


  if (firstImage) {

    const {
      error: coverError
    } =
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


  if (
    editing.project_images
  ) {

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
        .map(
          (
            item,
            index
          ) => {

            const image =
              imageMap.get(
                item.dataset.imageId
              );


            return image
              ? {
                  ...image,
                  sort_order:
                    index
                }
              : null;

          }
        )
        .filter(Boolean);

  }


  renderCurrentGallery(
    editing.project_images ||
      []
  );


  showMessage(
    "projectMessage",
    "Photo order saved successfully. The first photo is now the project cover.",
    false
  );


  await loadProjects();

}


/* =========================================================
   SAVE PROJECT
========================================================= */

$("projectForm").addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    showMessage(
      "projectMessage",
      "Saving project...",
      false
    );


    const payload = {

      title:
        $("title")
          .value
          .trim(),

      category:
        $("category")
          .value,

      location:
        $("location")
          .value
          .trim(),

      sort_order:
        Number(
          $("sortOrder")
            .value || 0
        ),

      description:
        $("description")
          .value
          .trim(),

      published:
        $("published")
          .checked,

      hero_enabled:
        $("heroEnabled")
          .checked,

      hero_order:
        Number(
          $("heroOrder")
            .value || 0
        )

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

      const {
        error
      } =
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
          "Error: " +
            error.message,
          true
        );

        return;

      }


      projectId =
        editing.id;

    } else {

      const {
        data,
        error
      } =
        await sb
          .from("projects")
          .insert(
            payload
          )
          .select()
          .single();


      if (error) {

        showMessage(
          "projectMessage",
          "Error: " +
            error.message,
          true
        );

        return;

      }


      projectId =
        data.id;

    }


    const files =
      Array.from(
        $("images")
          .files || []
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


      if (
        !uploadResult.success
      ) {

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


    showMessage(
      "projectMessage",
      "Project saved successfully.",
      false
    );


    await loadProjects();


    const {
      data:
        refreshedProject
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


    if (
      refreshedProject
    ) {

      editing =
        refreshedProject;


      renderCurrentGallery(
        refreshedProject.project_images ||
          []
      );

    }

  }
);


/* =========================================================
   UPLOAD PROJECT PHOTOS
========================================================= */

async function uploadProjectImages(
  projectId,
  files
) {

  let uploaded =
    0;


  for (
    const file of files
  ) {


    if (
      !file.type.startsWith(
        "image/"
      )
    ) {

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
      error:
        uploadError
    } =
      await sb
        .storage
        .from(
          "project-images"
        )
        .upload(
          storagePath,
          file,
          {
            cacheControl:
              "3600",

            upsert:
              false,

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
      data:
        publicData
    } =
      sb
        .storage
        .from(
          "project-images"
        )
        .getPublicUrl(
          storagePath
        );


    const imageUrl =
      publicData.publicUrl;


    const {
      data:
        existingImages
    } =
      await sb
        .from(
          "project_images"
        )
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
            ascending:
              false
          }
        )
        .limit(1);


    const nextOrder =
      existingImages &&
      existingImages.length
        ? Number(
            existingImages[0]
              .sort_order ||
              0
          ) + 1
        : 0;


    const {
      error:
        imageError
    } =
      await sb
        .from(
          "project_images"
        )
        .insert({

          project_id:
            projectId,

          image_url:
            imageUrl,

          alt_text:
            $("title")
              .value
              .trim(),

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
    data:
      firstImage
  } =
    await sb
      .from(
        "project_images"
      )
      .select(
        "image_url"
      )
      .eq(
        "project_id",
        projectId
      )
      .order(
        "sort_order",
        {
          ascending:
            true
        }
      )
      .limit(1)
      .maybeSingle();


  if (
    firstImage?.image_url
  ) {

    await sb
      .from(
        "projects"
      )
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


/* =========================================================
   PROJECT AI
========================================================= */

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


    button.disabled =
      true;


    button.textContent =
      "✨ AI is analyzing your project photos...";


    showMessage(
      "aiMessage",
      "AI is analyzing the photographs and writing professional project content. Please wait...",
      false
    );


    try {

      const {
        data: {
          session
        }
      } =
        await sb.auth.getSession();


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
              projectId
            }
          }
        );


      if (error) {

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


      if (
        data.description
      ) {

        $("description")
          .value =
          data.description;

      }


      const {
        data:
          refreshedProject
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


      if (
        refreshedProject
      ) {

        editing =
          refreshedProject;


        lastSavedProjectId =
          refreshedProject.id;


        $("id").value =
          refreshedProject.id;


        renderCurrentGallery(
          refreshedProject.project_images ||
            []
        );

      }


      let message =
        "✨ AI content generated successfully!";


      if (
        data.description
      ) {

        message +=
          "\n\nProfessional project description generated.";

      }


      if (
        data.short_description
      ) {

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


    button.disabled =
      false;


    button.textContent =
      "✨ Generate Description & Captions with AI";

  }
);


/* =========================================================
   DELETE PROJECT PHOTO
========================================================= */

window.deleteProjectImage =
  async function(
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
        .from(
          "project_images"
        )
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


      if (
        position !== -1
      ) {

        const storagePath =
          decodeURIComponent(
            imageUrl.substring(
              position +
                marker.length
            )
          );


        await sb
          .storage
          .from(
            "project-images"
          )
          .remove([
            storagePath
          ]);

      }

    } catch (
      storageError
    ) {

      console.warn(
        "Storage cleanup warning:",
        storageError
      );

    }


    const {
      data:
        remaining
    } =
      await sb
        .from(
          "project_images"
        )
        .select("*")
        .eq(
          "project_id",
          projectId
        )
        .order(
          "sort_order",
          {
            ascending:
              true
          }
        );


    if (
      remaining &&
      remaining.length
    ) {

      await sb
        .from(
          "projects"
        )
        .update({
          image_url:
            remaining[0]
              .image_url
        })
        .eq(
          "id",
          projectId
        );

    } else {

      await sb
        .from(
          "projects"
        )
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


/* =========================================================
   DELETE PROJECT
========================================================= */

window.deleteProject =
  async function(id) {

    if (
      !confirm(
        "Delete this entire project and all of its photographs?"
      )
    ) {

      return;

    }


    const {
      data:
        images
    } =
      await sb
        .from(
          "project_images"
        )
        .select(
          "image_url"
        )
        .eq(
          "project_id",
          id
        );


    const {
      error
    } =
      await sb
        .from(
          "projects"
        )
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
          .map(
            image => {

              const position =
                image.image_url.indexOf(
                  marker
                );


              if (
                position === -1
              ) {

                return null;

              }


              return decodeURIComponent(
                image.image_url.substring(
                  position +
                    marker.length
                )
              );

            }
          )
          .filter(Boolean);


      if (paths.length) {

        await sb
          .storage
          .from(
            "project-images"
          )
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

      lastSavedProjectId =
        null;

    }


    await loadProjects();

  };


$("refreshProjectsBtn")
  .addEventListener(
    "click",
    loadProjects
  );


/* =========================================================
   INSIGHTS / BLOG
========================================================= */

async function loadInsights() {

  const list =
    $("insightList");


  if (!list) {
    return;
  }


  list.innerHTML =
    `
      <p class="muted">
        Loading articles...
      </p>
    `;


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
          ascending:
            false
        }
      );


  if (error) {

    list.innerHTML =
      `
        <div class="notice show">
          ${escapeHtml(
            error.message
          )}
        </div>
      `;

    return;

  }


  const insights =
    data || [];


  if (!insights.length) {

    list.innerHTML =
      `
        <p class="muted">
          No Insights yet.
          Create your first article above.
        </p>
      `;

    return;

  }


  list.innerHTML =
    insights
      .map(
        renderInsight
      )
      .join("");

}


function renderInsight(
  insight
) {

  const tags =
    Array.isArray(
      insight.tags
    )
      ? insight.tags
      : [];


  return `

    <div
      class="insight-card"
    >

      <div
        class="insight-card-top"
      >

        <div
          style="min-width:0;flex:1"
        >

          <h3>

            ${escapeHtml(
              insight.title ||
              "Untitled Article"
            )}

          </h3>


          <div
            class="insight-meta"
          >

            ${
              insight.published
                ? `<span class="badge badge-published">Published</span>`
                : `<span class="badge badge-hidden">Draft</span>`
            }


            <span class="badge">

              ${escapeHtml(
                insight.category ||
                "Interior Design"
              )}

            </span>


            ${
              insight.published_at
                ? `
                  <br>
                  Published:
                  ${formatDate(
                    insight.published_at
                  )}
                `
                : `
                  <br>
                  Created:
                  ${formatDate(
                    insight.created_at
                  )}
                `
            }

          </div>


          ${
            insight.excerpt
              ? `
                <p
                  class="muted"
                  style="
                    margin:12px 0 0;
                    line-height:1.6;
                  "
                >

                  ${escapeHtml(
                    insight.excerpt
                  )}

                </p>
              `
              : ""
          }


          ${
            tags.length
              ? `
                <div
                  class="tag-list"
                >

                  ${
                    tags
                      .map(
                        tag =>
                          `
                            <span
                              class="tag"
                            >
                              ${escapeHtml(
                                tag
                              )}
                            </span>
                          `
                      )
                      .join("")
                  }

                </div>
              `
              : ""
          }

        </div>


        ${
          insight.cover_image_url
            ? `
              <img
                class="insight-cover"
                src="${escapeAttribute(
                  insight.cover_image_url
                )}"
                alt=""
              >
            `
            : ""
        }

      </div>


      <div
        class="actions"
        style="margin-top:15px"
      >

        <button
          class="btn-secondary"
          type="button"
          onclick="editInsight('${insight.id}')"
        >
          Edit
        </button>


        <button
          class="btn-danger"
          type="button"
          onclick="deleteInsight('${insight.id}')"
        >
          Delete
        </button>

      </div>

    </div>

  `;

}


/* =========================================================
   INSIGHT SAVE
========================================================= */

$("insightForm").addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const title =
      $("insightTitle")
        .value
        .trim();


    if (!title) {

      showMessage(
        "insightMessage",
        "Please enter an article title.",
        true
      );

      return;

    }


    let slug =
      $("insightSlug")
        .value
        .trim();


    if (!slug) {

      slug =
        slugify(title);

    } else {

      slug =
        slugify(slug);

    }


    const category =
      $("insightCategory")
        .value
        .trim() ||
      "Interior Design";


    const published =
      $("insightPublished")
        .checked;


    let publishedAt =
      null;


    if (
      published
    ) {

      publishedAt =
        editingInsight?.published_at ||
        new Date().toISOString();

    }


    let coverImageUrl =
      editingInsight
        ?.cover_image_url ||
      null;


    const coverFile =
      $("insightCoverImage")
        .files?.[0];


    showMessage(
      "insightMessage",
      "Saving article...",
      false
    );


    if (coverFile) {

      if (
        !coverFile.type.startsWith(
          "image/"
        )
      ) {

        showMessage(
          "insightMessage",
          "The cover file must be an image.",
          true
        );

        return;

      }


      if (
        coverFile.size >
        8 * 1024 * 1024
      ) {

        showMessage(
          "insightMessage",
          "The cover image must be 8MB or smaller.",
          true
        );

        return;

      }


      const extension =
        coverFile.name
          .split(".")
          .pop()
          .toLowerCase();


      const storagePath =
        `insights/${crypto.randomUUID()}.${extension}`;


      const {
        error:
          uploadError
      } =
        await sb
          .storage
          .from(
            "project-images"
          )
          .upload(
            storagePath,
            coverFile,
            {
              cacheControl:
                "3600",

              upsert:
                false,

              contentType:
                coverFile.type
            }
          );


      if (uploadError) {

        showMessage(
          "insightMessage",
          "Cover image upload failed: " +
            uploadError.message,
          true
        );

        return;

      }


      const {
        data:
          publicData
      } =
        sb
          .storage
          .from(
            "project-images"
          )
          .getPublicUrl(
            storagePath
          );


      coverImageUrl =
        publicData.publicUrl;

    }


    const payload = {

      title,

      slug,

      category,

      excerpt:
        $("insightExcerpt")
          .value
          .trim(),

      content:
        $("insightContent")
          .value
          .trim(),

      cover_image_url:
        coverImageUrl,

      seo_title:
        $("insightSeoTitle")
          .value
          .trim(),

      seo_description:
        $("insightSeoDescription")
          .value
          .trim(),

      tags:
        $("insightTags")
          .value
          .split(",")
          .map(
            tag =>
              tag.trim()
          )
          .filter(Boolean),

      published,

      published_at:
        publishedAt,

      updated_at:
        new Date().toISOString()

    };


    let result;


    if (
      editingInsight
    ) {

      result =
        await sb
          .from(
            "insights"
          )
          .update(
            payload
          )
          .eq(
            "id",
            editingInsight.id
          );

    } else {

      result =
        await sb
          .from(
            "insights"
          )
          .insert(
            payload
          );

    }


    if (result.error) {

      showMessage(
        "insightMessage",
        "Error: " +
          result.error.message,
        true
      );

      return;

    }


    resetInsightForm();

    await loadInsights();


    showMessage(
      "insightMessage",
      "Article saved successfully.",
      false
    );

  }
);


/* =========================================================
   EDIT INSIGHT
========================================================= */

window.editInsight =
  async function(id) {

    const {
      data,
      error
    } =
      await sb
        .from(
          "insights"
        )
        .select("*")
        .eq(
          "id",
          id
        )
        .single();


    if (error) {

      alert(
        error.message
      );

      return;

    }


    editingInsight =
      data;


    $("insightId").value =
      data.id;


    $("insightTitle").value =
      data.title || "";


    renderCategoryDropdowns();


    $("insightCategory").value =
      data.category ||
      "Interior Design";


    $("insightSlug").value =
      data.slug || "";


    $("insightExcerpt").value =
      data.excerpt || "";


    $("insightContent").value =
      data.content || "";


    $("insightSeoTitle").value =
      data.seo_title || "";


    $("insightSeoDescription").value =
      data.seo_description || "";


    $("insightTags").value =
      Array.isArray(data.tags)
        ? data.tags.join(", ")
        : "";


    $("insightPublished").checked =
      data.published === true;


    $("insightCoverImage").value =
      "";


    $("saveInsightBtn")
      .textContent =
      "Update Article";


    $("cancelInsightBtn")
      .style
      .display =
      "inline-block";


    window.scrollTo({
      top:
        document
          .getElementById(
            "insightForm"
          )
          .offsetTop -
        30,

      behavior:
        "smooth"
    });

  };


/* =========================================================
   RESET INSIGHT
========================================================= */

$("cancelInsightBtn").addEventListener(
  "click",
  resetInsightForm
);


function resetInsightForm() {

  editingInsight =
    null;


  $("insightForm")
    .reset();


  $("insightId").value =
    "";


  $("saveInsightBtn")
    .textContent =
    "Save Article";


  $("cancelInsightBtn")
    .style
    .display =
    "none";


  renderCategoryDropdowns();

}


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


    const {
      data:
        insight
    } =
      await sb
        .from(
          "insights"
        )
        .select(
          "cover_image_url"
        )
        .eq(
          "id",
          id
        )
        .single();


    const {
      error
    } =
      await sb
        .from(
          "insights"
        )
        .delete()
        .eq(
          "id",
          id
        );


    if (error) {

      alert(
        "Could not delete article: " +
          error.message
      );

      return;

    }


    if (
      insight?.cover_image_url
    ) {

      await removePublicStorageFile(
        insight.cover_image_url
      );

    }


    if (
      editingInsight?.id === id
    ) {

      resetInsightForm();

    }


    await loadInsights();

  };


/* =========================================================
   AI INSIGHT GENERATOR
========================================================= */

$("generateInsightAiBtn")
  .addEventListener(
    "click",
    async () => {

      const title =
        $("insightTitle")
          .value
          .trim();


      const category =
        $("insightCategory")
          .value
          .trim() ||
        "Interior Design";


      if (!title) {

        showMessage(
          "insightMessage",
          "Enter an article title first, then click Generate Article with AI.",
          true
        );

        return;

      }


      const button =
        $("generateInsightAiBtn");


      button.disabled =
        true;


      button.textContent =
        "✨ AI is writing the article...";


      showMessage(
        "insightMessage",
        "AI is creating the article, excerpt and SEO content. Please wait...",
        false
      );


      try {

        const {
          data: {
            session
          }
        } =
          await sb.auth.getSession();


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
            "generate-insight-content",
            {
              body: {

                title,

                category

              }
            }
          );


        if (error) {

          throw new Error(
            error.message ||
            "AI article generation failed."
          );

        }


        if (
          data?.excerpt
        ) {

          $("insightExcerpt")
            .value =
            data.excerpt;

        }


        if (
          data?.content
        ) {

          $("insightContent")
            .value =
            data.content;

        }


        if (
          data?.seo_title
        ) {

          $("insightSeoTitle")
            .value =
            data.seo_title;

        }


        if (
          data?.seo_description
        ) {

          $("insightSeoDescription")
            .value =
            data.seo_description;

        }


        if (
          Array.isArray(
            data?.tags
          )
        ) {

          $("insightTags")
            .value =
            data.tags.join(
              ", "
            );

        }


        showMessage(
          "insightMessage",
          "✨ AI article generated. Review and edit it before publishing.",
          false
        );

      } catch (error) {

        console.error(
          "Insight AI error:",
          error
        );


        showMessage(
          "insightMessage",
          "AI error: " +
            error.message,
          true
        );

      }


      button.disabled =
        false;


      button.textContent =
        "✨ Generate Article with AI";

    }
  );


$("refreshInsightsBtn")
  .addEventListener(
    "click",
    loadInsights
  );


/* =========================================================
   UTILITY — REMOVE STORAGE FILE
========================================================= */

async function removePublicStorageFile(
  imageUrl
) {

  try {

    const marker =
      "/storage/v1/object/public/project-images/";


    const position =
      imageUrl.indexOf(
        marker
      );


    if (
      position === -1
    ) {

      return;

    }


    const path =
      decodeURIComponent(
        imageUrl.substring(
          position +
            marker.length
        )
      );


    await sb
      .storage
      .from(
        "project-images"
      )
      .remove([
        path
      ]);

  } catch (error) {

    console.warn(
      "Storage cleanup warning:",
      error
    );

  }

}


/* =========================================================
   UTILITY — SLUG
========================================================= */

function slugify(
  value
) {

  return String(
    value || ""
  )
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9\s-]/g,
      ""
    )
    .replace(
      /\s+/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );

}


/* =========================================================
   UTILITY — DATE
========================================================= */

function formatDate(
  value
) {

  if (!value) {
    return "";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  return date.toLocaleDateString(
    "en-US",
    {
      year:
        "numeric",

      month:
        "short",

      day:
        "numeric"
    }
  );

}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
  id,
  message,
  error = false
) {

  const element =
    $(id);


  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.classList.add(
    "show"
  );


  if (error) {

    element.style.background =
      "#fbeaea";


    element.style.color =
      "#9b2226";

  } else {

    element.style.background =
      "#edf7ef";


    element.style.color =
      "#176b35";

  }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
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


function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}


/* =========================================================
   AUTH STATE
========================================================= */

sb.auth.onAuthStateChange(
  (
    event,
    session
  ) => {

    if (session) {

      showDashboard();

    } else {

      showLogin();

    }

  }
);


/* =========================================================
   START
========================================================= */

boot();
