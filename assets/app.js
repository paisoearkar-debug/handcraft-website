const SUPABASE_URL =
  "https://jvaqtuiyswjybasfumjw.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_GteenSO57Kw0uv1qm6YUiw_-uZ7Uwe0";

const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const grid = document.getElementById("project-grid");
const filters = document.getElementById("filters");

let allProjects = [];
let currentProject = null;


/* =========================
   HELPERS
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
   LOAD WEBSITE SETTINGS
========================= */

async function loadSettings() {

  const { data, error } = await sb
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();


  if (error) {

    console.warn(
      "Could not load website settings:",
      error.message
    );

    return;
  }


  if (!data) return;


  /* Company name */

  document
    .querySelectorAll("[data-setting='company_name']")
    .forEach(el => {

      el.textContent =
        data.company_name ||
        "Handcraft Myanmar Company Limited";

    });


  /* Email */

  document
    .querySelectorAll("[data-setting='email']")
    .forEach(el => {

      el.textContent =
        data.email || "";

      if (el.tagName === "A") {

        el.href =
          data.email
            ? `mailto:${data.email}`
            : "#";

      }

    });


  /* Phone */

  document
    .querySelectorAll("[data-setting='phone']")
    .forEach(el => {

      el.textContent =
        data.phone || "";

      if (el.tagName === "A") {

        el.href =
          data.phone
            ? `tel:${data.phone.replace(/\s+/g, "")}`
            : "#";

      }

    });


  /* Address */

  document
    .querySelectorAll("[data-setting='address']")
    .forEach(el => {

      el.textContent =
        data.address || "";

    });


  /* Hero title */

  document
    .querySelectorAll("[data-setting='hero_title']")
    .forEach(el => {

      el.textContent =
        data.hero_title ||
        el.textContent;

    });


  /* Hero subtitle */

  document
    .querySelectorAll("[data-setting='hero_subtitle']")
    .forEach(el => {

      el.textContent =
        data.hero_subtitle ||
        el.textContent;

    });


  /* About title */

  document
    .querySelectorAll("[data-setting='about_title']")
    .forEach(el => {

      el.textContent =
        data.about_title ||
        el.textContent;

    });


  /* About body */

  document
    .querySelectorAll("[data-setting='about_body']")
    .forEach(el => {

      el.textContent =
        data.about_body ||
        el.textContent;

    });


  /* Google Maps */

  if (data.map_embed_url) {

    document
      .querySelectorAll(
        "[data-setting='map_embed_url']"
      )
      .forEach(el => {

        if (
          el.tagName === "IFRAME"
        ) {

          el.src =
            data.map_embed_url;

        }

      });

  }

}


/* =========================
   LOAD PROJECTS
========================= */

async function loadProjects() {

  if (!grid) return;


  grid.innerHTML =
    `
      <div class="loading-projects">
        Loading our projects...
      </div>
    `;


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
    .eq("published", true)
    .order("sort_order", {
      ascending: true
    })
    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(
      "Project loading error:",
      error
    );


    grid.innerHTML =
      `
        <div class="loading-projects">
          Projects are temporarily unavailable.
        </div>
      `;

    return;
  }


  allProjects = data || [];


  allProjects.forEach(project => {

    project.project_images =
      (project.project_images || [])
        .sort(
          (a, b) =>
            (a.sort_order || 0) -
            (b.sort_order || 0)
        );

  });


  makeFilters();

  render(allProjects);

}


/* =========================
   PROJECT FILTERS
========================= */

function makeFilters() {

  if (!filters) return;


  const preferredCategories = [
    "Construction",
    "Condominium Interior Design & Decoration",
    "Renovation",
    "Furniture"
  ];


  const availableCategories =
    preferredCategories.filter(category =>
      allProjects.some(
        project =>
          project.category === category
      )
    );


  const categories = [
    "All",
    ...availableCategories
  ];


  filters.innerHTML =
    categories
      .map(
        category => `

          <button
            class="filter ${category === "All" ? "active" : ""}"
            data-category="${escapeAttribute(category)}"
          >
            ${escapeHtml(category)}
          </button>

        `
      )
      .join("");


  filters
    .querySelectorAll(".filter")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          filters
            .querySelectorAll(".filter")
            .forEach(btn =>
              btn.classList.remove("active")
            );


          button.classList.add("active");


          const category =
            button.dataset.category;


          if (category === "All") {

            render(allProjects);

          } else {

            render(
              allProjects.filter(
                project =>
                  project.category === category
              )
            );

          }

        }
      );

    });

}


/* =========================
   RENDER PROJECTS
========================= */

function render(projects) {

  if (!grid) return;


  if (!projects.length) {

    grid.innerHTML =
      `
        <div class="loading-projects">
          No projects in this category yet.
        </div>
      `;

    return;
  }


  grid.innerHTML =
    projects
      .map(projectCard)
      .join("");


  grid
    .querySelectorAll(".project-card")
    .forEach(card => {

      card.addEventListener(
        "click",
        () => {

          const id =
            card.dataset.id;

          const project =
            allProjects.find(
              item =>
                item.id === id
            );


          if (project) {

            openProject(project);

          }

        }
      );

    });

}


/* =========================
   PROJECT CARD
========================= */

function projectCard(project) {

  const images =
    project.project_images || [];


  const firstImage =
    images.length
      ? images[0].image_url
      : project.image_url;


  const photoCount =
    images.length;


  return `

    <article
      class="project-card"
      data-id="${escapeAttribute(project.id)}"
    >

      <div class="project-image">

        ${
          firstImage
            ? `
              <img
                src="${escapeAttribute(firstImage)}"
                alt="${escapeAttribute(
                  images[0]?.alt_text ||
                  project.title ||
                  "Handcraft Myanmar project"
                )}"
                loading="lazy"
              >
            `
            : `
              <div class="project-no-image">
                Handcraft Myanmar
              </div>
            `
        }


        ${
          photoCount > 1
            ? `
              <span class="photo-count">
                ${photoCount} Photos
              </span>
            `
            : ""
        }

      </div>


      <div class="project-info">

        <div class="project-category">
          ${escapeHtml(
            project.category || ""
          )}
        </div>


        <h3>
          ${escapeHtml(
            project.title || "Project"
          )}
        </h3>


        ${
          project.location
            ? `
              <p class="project-location">
                ${escapeHtml(
                  project.location
                )}
              </p>
            `
            : ""
        }


        ${
          project.description
            ? `
              <p class="project-description">
                ${escapeHtml(
                  project.description
                )}
              </p>
            `
            : ""
        }

      </div>

    </article>

  `;

}


/* =========================
   PROJECT GALLERY MODAL
========================= */

function openProject(project) {

  currentProject = project;


  let modal =
    document.getElementById(
      "project-modal"
    );


  if (!modal) {

    modal =
      document.createElement("div");

    modal.id =
      "project-modal";

    modal.className =
      "project-modal";

    document.body.appendChild(
      modal
    );

  }


  const images =
    project.project_images || [];


  modal.innerHTML = `

    <div class="project-modal-backdrop"></div>


    <div class="project-modal-content">

      <button
        class="project-modal-close"
        aria-label="Close"
      >
        ×
      </button>


      <div class="project-modal-header">

        <div>

          <div class="project-category">
            ${escapeHtml(
              project.category || ""
            )}
          </div>

          <h2>
            ${escapeHtml(
              project.title || "Project"
            )}
          </h2>

          ${
            project.location
              ? `
                <p>
                  ${escapeHtml(
                    project.location
                  )}
                </p>
              `
              : ""
          }

        </div>

      </div>


      ${
        project.description
          ? `
            <div class="project-modal-description">
              ${escapeHtml(
                project.description
              )}
            </div>
          `
          : ""
      }


      <div class="project-gallery">

        ${
          images.length
            ? images
                .map(
                  image => `

                    <div class="gallery-image">

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

                    </div>

                  `
                )
                .join("")
            : `
                ${
                  project.image_url
                    ? `
                      <div class="gallery-image">

                        <img
                          src="${escapeAttribute(
                            project.image_url
                          )}"
                          alt="${escapeAttribute(
                            project.title || ""
                          )}"
                        >

                      </div>
                    `
                    : `
                      <p>No project photographs available.</p>
                    `
                }
              `
        }

      </div>

    </div>

  `;


  modal.classList.add("open");


  const close =
    () => {

      modal.classList.remove(
        "open"
      );

    };


  modal
    .querySelector(
      ".project-modal-close"
    )
    .onclick = close;


  modal
    .querySelector(
      ".project-modal-backdrop"
    )
    .onclick = close;


  document.addEventListener(
    "keydown",
    function escapeHandler(e) {

      if (
        e.key === "Escape"
      ) {

        close();

        document.removeEventListener(
          "keydown",
          escapeHandler
        );

      }

    }
  );

}


/* =========================
   YEAR
========================= */

document
  .querySelectorAll(
    "[data-current-year]"
  )
  .forEach(el => {

    el.textContent =
      new Date().getFullYear();

  });


const year =
  document.getElementById(
    "year"
  );

if (year) {

  year.textContent =
    new Date().getFullYear();

}


/* =========================
   START WEBSITE
========================= */

async function start() {

  await loadSettings();

  await loadProjects();

}


start();
