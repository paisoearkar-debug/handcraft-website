/* =========================================================
   HANDCRAFT MYANMAR
   Portfolio / Supabase Project Gallery
========================================================= */

const SUPABASE_URL =
  "https://jvaqtuiyswjybasfumjw.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_GteenSO57Kw0uv1qm6YUiw_-uZ7Uwe0";

const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


/* =========================================================
   ELEMENTS
========================================================= */

const grid =
  document.getElementById("project-grid");

const filters =
  document.getElementById("filters");

const year =
  document.getElementById("year");


/* =========================================================
   SETTINGS
========================================================= */

const CATEGORIES = [
  "All",
  "Construction",
  "Condominium Interior Design & Decoration",
  "Renovation",
  "Furniture"
];


/*
   Old concept projects currently in the database
   are hidden from the public portfolio.

   We are NOT deleting them yet.
   Later we can clean them properly from Admin.
*/

const LEGACY_CONCEPT_WORDS = [
  "ai-generated",
  "ai generated",
  "ai concept",
  "concept portfolio",
  "golden gate office",
  "lakeview villa",
  "emerald corporate hub",
  "shwe taung residence"
];


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    if (year) {
      year.textContent =
        new Date().getFullYear();
    }

    loadProjects();
  }
);


/* =========================================================
   LOAD PROJECTS
========================================================= */

async function loadProjects() {

  if (!grid) {
    console.error(
      "Handcraft: #project-grid was not found."
    );
    return;
  }

  grid.innerHTML = `
    <div class="loading-projects">
      Loading our projects...
    </div>
  `;

  const {
    data,
    error
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
    .order("sort_order", {
      ascending: true
    })
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error(
      "Handcraft Supabase error:",
      error
    );

    grid.innerHTML = `
      <div class="loading-projects">
        Our project portfolio is being updated.
        Please check back shortly.
      </div>
    `;

    return;
  }


  /*
    Only show published projects.

    The database/RLS already controls this for public
    visitors, but this extra check makes the frontend
    safer and clearer.
  */

  const projects =
    (data || [])
      .filter(project => {

        if (
          project.published === false
        ) {
          return false;
        }

        return !isLegacyConcept(project);
      })
      .map(normalizeProject);


  window.handcraftProjects =
    projects;


  createFilters(projects);

  renderProjects(projects);
}


/* =========================================================
   NORMALIZE PROJECT
========================================================= */

function normalizeProject(project) {

  let photos = [];


  /*
    New gallery system
  */

  if (
    Array.isArray(
      project.project_images
    )
  ) {

    photos =
      project.project_images
        .filter(image =>
          image &&
          image.image_url
        )
        .sort(
          (a, b) =>
            (a.sort_order || 0) -
            (b.sort_order || 0)
        )
        .map(image => ({
          id: image.id,
          url: image.image_url,
          alt:
            image.alt_text ||
            project.title ||
            "Handcraft Myanmar project"
        }));
  }


  /*
    Backward compatibility:
    if an old project has image_url,
    use it as the first image.
  */

  if (
    photos.length === 0 &&
    project.image_url
  ) {

    photos.push({
      id: "main",
      url: project.image_url,
      alt:
        project.title ||
        "Handcraft Myanmar project"
    });
  }


  return {
    ...project,

    category:
      project.category ||
      "Construction",

    location:
      project.location ||
      "",

    description:
      project.description ||
      "",

    photos
  };
}


/* =========================================================
   HIDE OLD AI CONCEPT PROJECTS
========================================================= */

function isLegacyConcept(project) {

  const text = [
    project.title || "",
    project.description || "",
    project.location || ""
  ]
    .join(" ")
    .toLowerCase();


  return LEGACY_CONCEPT_WORDS.some(
    word =>
      text.includes(
        word.toLowerCase()
      )
  );
}


/* =========================================================
   FILTER BUTTONS
========================================================= */

function createFilters(projects) {

  if (!filters) {
    return;
  }


  const categories = [
    "All",
    ...CATEGORIES.filter(
      category =>
        category !== "All" &&
        projects.some(
          project =>
            project.category ===
            category
        )
    )
  ];


  filters.innerHTML =
    categories
      .map(
        (category, index) => `
          <button
            class="filter ${
              index === 0
                ? "active"
                : ""
            }"
            type="button"
            data-category="${escapeHtml(
              category
            )}"
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
            .querySelectorAll(
              ".filter"
            )
            .forEach(
              item =>
                item.classList.remove(
                  "active"
                )
            );


          button.classList.add(
            "active"
          );


          const category =
            button.dataset.category;


          if (
            category === "All"
          ) {

            renderProjects(
              projects
            );

          } else {

            renderProjects(
              projects.filter(
                project =>
                  project.category ===
                  category
              )
            );
          }
        }
      );
    });
}


/* =========================================================
   RENDER PROJECTS
========================================================= */

function renderProjects(
  projects
) {

  if (!grid) {
    return;
  }


  if (
    !projects ||
    projects.length === 0
  ) {

    grid.innerHTML = `
      <div class="loading-projects">
        New Handcraft Myanmar projects
        will be added here soon.
      </div>
    `;

    return;
  }


  grid.innerHTML =
    projects
      .map(
        (project, index) =>
          projectCard(
            project,
            index
          )
      )
      .join("");


  grid
    .querySelectorAll(
      ".project-card"
    )
    .forEach(card => {

      card.addEventListener(
        "click",
        () => {

          const project =
            projects.find(
              item =>
                item.id ===
                card.dataset.id
            );


          if (project) {
            openProjectModal(
              project
            );
          }
        }
      );
    });
}


/* =========================================================
   PROJECT CARD
========================================================= */

function projectCard(
  project,
  index
) {

  const firstPhoto =
    project.photos &&
    project.photos.length
      ? project.photos[0].url
      : "";


  const photoCount =
    project.photos
      ? project.photos.length
      : 0;


  const photoLabel =
    photoCount > 1
      ? `${photoCount} photos`
      : photoCount === 1
        ? "1 photo"
        : "Project details";


  return `
    <article
      class="project-card"
      data-id="${escapeHtml(
        String(project.id)
      )}"
    >

      ${
        firstPhoto
          ? `
            <img
              src="${escapeHtml(
                firstPhoto
              )}"
              alt="${escapeHtml(
                project.title ||
                "Handcraft Myanmar project"
              )}"
              loading="lazy"
            >
          `
          : `
            <div
              style="
                aspect-ratio:16/10;
                background:#ddd;
                display:flex;
                align-items:center;
                justify-content:center;
                color:#777;
                font-size:12px;
                letter-spacing:.08em;
                text-transform:uppercase;
              "
            >
              Project image coming soon
            </div>
          `
      }


      <div class="project-info">

        <div
          style="
            font-size:10px;
            letter-spacing:.12em;
            text-transform:uppercase;
            margin-bottom:7px;
            color:rgba(255,255,255,.75);
          "
        >
          ${escapeHtml(
            project.category ||
            "Project"
          )}
        </div>


        <h3>
          ${escapeHtml(
            project.title ||
            "Handcraft Myanmar Project"
          )}
        </h3>


        <p>
          ${
            project.location
              ? escapeHtml(
                  project.location
                ) +
                " · "
              : ""
          }
          ${escapeHtml(
            photoLabel
          )}
        </p>

      </div>

    </article>
  `;
}


/* =========================================================
   PROJECT MODAL
========================================================= */

function openProjectModal(
  project
) {

  closeProjectModal();


  const modal =
    document.createElement(
      "div"
    );

  modal.className =
    "project-modal open";


  modal.id =
    "handcraft-project-modal";


  const photos =
    project.photos || [];


  const gallery =
    photos.length
      ? photos
          .map(
            photo => `
              <img
                src="${escapeHtml(
                  photo.url
                )}"
                alt="${escapeHtml(
                  photo.alt ||
                  project.title
                )}"
                loading="lazy"
              >
            `
          )
          .join("")
      : `
          <div
            style="
              padding:80px;
              text-align:center;
              color:#777;
              grid-column:1/-1;
            "
          >
            Project photos will be added soon.
          </div>
        `;


  modal.innerHTML = `

    <div class="project-modal-inner">

      <div class="project-modal-header">

        <div>

          <div
            style="
              margin-bottom:8px;
              color:#b18a52;
              font-size:10px;
              font-weight:700;
              letter-spacing:.18em;
              text-transform:uppercase;
            "
          >
            ${escapeHtml(
              project.category ||
              "Project"
            )}
          </div>

          <h2>
            ${escapeHtml(
              project.title ||
              "Handcraft Myanmar Project"
            )}
          </h2>

          ${
            project.location
              ? `
                <div
                  style="
                    margin-top:6px;
                    color:#777;
                    font-size:12px;
                  "
                >
                  ${escapeHtml(
                    project.location
                  )}
                </div>
              `
              : ""
          }

        </div>


        <button
          class="project-modal-close"
          type="button"
          aria-label="Close"
        >
          ×
        </button>

      </div>


      <div class="project-gallery">

        ${gallery}

      </div>


      ${
        project.description
          ? `
            <div
              class="project-modal-description"
            >
              ${escapeHtml(
                project.description
              )}
            </div>
          `
          : ""
      }

    </div>
  `;


  document.body.appendChild(
    modal
  );


  document.body.style.overflow =
    "hidden";


  modal
    .querySelector(
      ".project-modal-close"
    )
    .addEventListener(
      "click",
      closeProjectModal
    );


  modal.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        modal
      ) {
        closeProjectModal();
      }
    }
  );


  document.addEventListener(
    "keydown",
    handleModalEscape
  );
}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeProjectModal() {

  const modal =
    document.getElementById(
      "handcraft-project-modal"
    );


  if (modal) {
    modal.remove();
  }


  document.body.style.overflow =
    "";


  document.removeEventListener(
    "keydown",
    handleModalEscape
  );
}


function handleModalEscape(
  event
) {

  if (
    event.key ===
    "Escape"
  ) {
    closeProjectModal();
  }
}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  ).replace(
    /[&<>"']/g,
    character => {

      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      };

      return (
        entities[character] ||
        character
      );
    }
  );
}

/* =========================================================
   LOAD WEBSITE SETTINGS
========================================================= */

async function loadSiteSettings() {

  const { data, error } = await sb
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("Handcraft settings error:", error);
    return;
  }

  if (!data) {
    return;
  }

  document
    .querySelectorAll("[data-setting]")
    .forEach(element => {

      const key = element.dataset.setting;
      const value = data[key];

      if (value === null || value === undefined) {
        return;
      }

      if (
        element.tagName === "INPUT" ||
        element.tagName === "TEXTAREA"
      ) {
        element.value = value;
      } else {
        element.textContent = value;
      }

      if (
        key === "email" &&
        element.tagName === "A"
      ) {
        element.href =
          value
            ? "mailto:" + value
            : "mailto:";
      }

      if (
        key === "phone" &&
        element.tagName === "A"
      ) {
        element.href =
          value
            ? "tel:" + value.replace(/\s+/g, "")
            : "tel:";
      }

      if (
        key === "map_embed_url" &&
        element.tagName === "IFRAME"
      ) {
        element.src =
          value ||
          "https://www.google.com/maps?q=Yangon%20Myanmar&output=embed";
      }

    });


  /* Email */

  document
    .querySelectorAll('[data-setting="email"]')
    .forEach(element => {

      element.textContent =
        data.email || "Contact us";

      element.href =
        data.email
          ? "mailto:" + data.email
          : "mailto:";

    });


  /* Phone */

  document
    .querySelectorAll('[data-setting="phone"]')
    .forEach(element => {

      element.textContent =
        data.phone || "Contact us";

      element.href =
        data.phone
          ? "tel:" + data.phone.replace(/\s+/g, "")
          : "tel:";

    });

}


/* =========================================================
   START SITE SETTINGS
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  loadSiteSettings
);
