/* =========================================================
   HANDCRAFT MYANMAR
   Professional Portfolio / Supabase Project Gallery
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


/* =========================================================
   LEGACY CONCEPT PROJECTS
========================================================= */

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

    installGalleryStyles();

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


  const projects =
    (data || [])
      .filter(project => {

        if (
          project.published === false
        ) {
          return false;
        }

        return !isLegacyConcept(
          project
        );

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
    .querySelectorAll(
      ".filter"
    )
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
            (photo, index) => `

              <button
                class="project-gallery-item ${
                  index === 0
                    ? "project-gallery-featured"
                    : ""
                }"
                type="button"
                data-photo-index="${index}"
                aria-label="View ${
                  escapeHtml(
                    photo.alt ||
                    project.title ||
                    "project photo"
                  )
                }"
              >

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

                <span
                  class="project-gallery-zoom"
                  aria-hidden="true"
                >
                  ⤢
                </span>

              </button>

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
          aria-label="Close project"
        >
          ×
        </button>

      </div>


      <div
        class="project-gallery"
        aria-label="Project photographs"
      >

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


  modal
    .querySelectorAll(
      ".project-gallery-item"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          const index =
            Number(
              button.dataset.photoIndex
            );

          openPhotoLightbox(
            project,
            index
          );

        }
      );

    });


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
   PHOTO LIGHTBOX
========================================================= */

let currentLightboxProject = null;

let currentLightboxIndex = 0;


function openPhotoLightbox(
  project,
  index
) {

  closePhotoLightbox();


  currentLightboxProject =
    project;


  currentLightboxIndex =
    Math.max(
      0,
      Math.min(
        index,
        (project.photos || []).length - 1
      )
    );


  const lightbox =
    document.createElement(
      "div"
    );


  lightbox.id =
    "handcraft-photo-lightbox";


  lightbox.className =
    "handcraft-photo-lightbox";


  lightbox.innerHTML = `

    <div
      class="handcraft-lightbox-backdrop"
    ></div>


    <div
      class="handcraft-lightbox-content"
      role="dialog"
      aria-modal="true"
      aria-label="Project photograph viewer"
    >


      <button
        class="handcraft-lightbox-close"
        type="button"
        aria-label="Close photograph"
      >
        ×
      </button>


      <button
        class="handcraft-lightbox-prev"
        type="button"
        aria-label="Previous photograph"
      >
        ‹
      </button>


      <div
        class="handcraft-lightbox-image-wrap"
      >

        <img
          id="handcraft-lightbox-image"
          src=""
          alt=""
        >

      </div>


      <button
        class="handcraft-lightbox-next"
        type="button"
        aria-label="Next photograph"
      >
        ›
      </button>


      <div
        class="handcraft-lightbox-bottom"
      >

        <div
          id="handcraft-lightbox-caption"
          class="handcraft-lightbox-caption"
        ></div>


        <div
          id="handcraft-lightbox-counter"
          class="handcraft-lightbox-counter"
        ></div>


        <div
          id="handcraft-lightbox-thumbnails"
          class="handcraft-lightbox-thumbnails"
        ></div>

      </div>


    </div>

  `;


  document.body.appendChild(
    lightbox
  );


  updateLightbox();


  lightbox
    .querySelector(
      ".handcraft-lightbox-close"
    )
    .addEventListener(
      "click",
      closePhotoLightbox
    );


  lightbox
    .querySelector(
      ".handcraft-lightbox-prev"
    )
    .addEventListener(
      "click",
      event => {

        event.stopPropagation();

        showPreviousPhoto();

      }
    );


  lightbox
    .querySelector(
      ".handcraft-lightbox-next"
    )
    .addEventListener(
      "click",
      event => {

        event.stopPropagation();

        showNextPhoto();

      }
    );


  lightbox
    .querySelector(
      ".handcraft-lightbox-backdrop"
    )
    .addEventListener(
      "click",
      closePhotoLightbox
    );


  lightbox.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        lightbox
      ) {

        closePhotoLightbox();

      }

    }
  );


  document.addEventListener(
    "keydown",
    handleLightboxKeyboard
  );


  setupLightboxSwipe(
    lightbox
  );

}


function updateLightbox() {

  const lightbox =
    document.getElementById(
      "handcraft-photo-lightbox"
    );


  if (
    !lightbox ||
    !currentLightboxProject
  ) {

    return;
  }


  const photos =
    currentLightboxProject.photos ||
    [];


  if (!photos.length) {
    return;
  }


  const photo =
    photos[
      currentLightboxIndex
    ];


  const image =
    lightbox.querySelector(
      "#handcraft-lightbox-image"
    );


  const caption =
    lightbox.querySelector(
      "#handcraft-lightbox-caption"
    );


  const counter =
    lightbox.querySelector(
      "#handcraft-lightbox-counter"
    );


  const thumbnails =
    lightbox.querySelector(
      "#handcraft-lightbox-thumbnails"
    );


  image.src =
    photo.url;


  image.alt =
    photo.alt ||
    currentLightboxProject.title ||
    "Handcraft Myanmar project";


  caption.textContent =
    photo.alt ||
    currentLightboxProject.title ||
    "Handcraft Myanmar";


  counter.textContent =
    `${currentLightboxIndex + 1} / ${photos.length}`;


  thumbnails.innerHTML =
    photos
      .map(
        (item, index) => `

          <button
            class="
              handcraft-lightbox-thumbnail
              ${
                index ===
                currentLightboxIndex
                  ? "active"
                  : ""
              }
            "
            type="button"
            data-index="${index}"
            aria-label="View photograph ${
              index + 1
            }"
          >

            <img
              src="${escapeHtml(
                item.url
              )}"
              alt=""
            >

          </button>

        `
      )
      .join("");


  thumbnails
    .querySelectorAll(
      ".handcraft-lightbox-thumbnail"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          currentLightboxIndex =
            Number(
              button.dataset.index
            );

          updateLightbox();

        }
      );

    });


  const previousButton =
    lightbox.querySelector(
      ".handcraft-lightbox-prev"
    );


  const nextButton =
    lightbox.querySelector(
      ".handcraft-lightbox-next"
    );


  if (photos.length <= 1) {

    previousButton.style.display =
      "none";

    nextButton.style.display =
      "none";

  } else {

    previousButton.style.display =
      "flex";

    nextButton.style.display =
      "flex";

  }

}


function showPreviousPhoto() {

  if (
    !currentLightboxProject ||
    !currentLightboxProject.photos
  ) {

    return;
  }


  const count =
    currentLightboxProject.photos.length;


  currentLightboxIndex =
    (
      currentLightboxIndex -
      1 +
      count
    ) % count;


  updateLightbox();

}


function showNextPhoto() {

  if (
    !currentLightboxProject ||
    !currentLightboxProject.photos
  ) {

    return;
  }


  const count =
    currentLightboxProject.photos.length;


  currentLightboxIndex =
    (
      currentLightboxIndex +
      1
    ) % count;


  updateLightbox();

}


function handleLightboxKeyboard(
  event
) {

  const lightbox =
    document.getElementById(
      "handcraft-photo-lightbox"
    );


  if (!lightbox) {
    return;
  }


  if (
    event.key ===
    "Escape"
  ) {

    closePhotoLightbox();

    return;

  }


  if (
    event.key ===
    "ArrowLeft"
  ) {

    showPreviousPhoto();

    return;

  }


  if (
    event.key ===
    "ArrowRight"
  ) {

    showNextPhoto();

    return;

  }

}


function closePhotoLightbox() {

  const lightbox =
    document.getElementById(
      "handcraft-photo-lightbox"
    );


  if (lightbox) {
    lightbox.remove();
  }


  currentLightboxProject =
    null;


  currentLightboxIndex =
    0;


  document.removeEventListener(
    "keydown",
    handleLightboxKeyboard
  );

}


function setupLightboxSwipe(
  lightbox
) {

  let startX = 0;

  let startY = 0;


  const image =
    lightbox.querySelector(
      ".handcraft-lightbox-image-wrap"
    );


  if (!image) {
    return;
  }


  image.addEventListener(
    "touchstart",
    event => {

      const touch =
        event.changedTouches[0];

      startX =
        touch.clientX;

      startY =
        touch.clientY;

    },
    {
      passive: true
    }
  );


  image.addEventListener(
    "touchend",
    event => {

      const touch =
        event.changedTouches[0];

      const deltaX =
        touch.clientX -
        startX;

      const deltaY =
        touch.clientY -
        startY;


      if (
        Math.abs(deltaX) < 50 ||
        Math.abs(deltaX) <
          Math.abs(deltaY)
      ) {

        return;

      }


      if (deltaX < 0) {

        showNextPhoto();

      } else {

        showPreviousPhoto();

      }

    },
    {
      passive: true
    }
  );

}


/* =========================================================
   CLOSE PROJECT MODAL
========================================================= */

function closeProjectModal() {

  closePhotoLightbox();


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
   PHOTO VIEWER STYLES
========================================================= */

function installGalleryStyles() {

  if (
    document.getElementById(
      "handcraft-gallery-styles"
    )
  ) {

    return;
  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "handcraft-gallery-styles";


  style.textContent = `

    .project-gallery-item {

      position: relative;

      display: block;

      width: 100%;

      padding: 0;

      margin: 0;

      border: 0;

      background: #eee;

      overflow: hidden;

      cursor: zoom-in;

    }


    .project-gallery-item img {

      width: 100%;

      height: 100%;

      display: block;

      object-fit: cover;

      transition:
        transform .65s cubic-bezier(.2,.7,.2,1),
        filter .4s ease;

    }


    .project-gallery-item:hover img {

      transform: scale(1.035);

      filter: brightness(1.05);

    }


    .project-gallery-featured {

      grid-column: span 2;

    }


    .project-gallery-zoom {

      position: absolute;

      right: 15px;

      bottom: 15px;

      width: 38px;

      height: 38px;

      display: flex;

      align-items: center;

      justify-content: center;

      border-radius: 50%;

      background: rgba(0,0,0,.65);

      color: white;

      font-size: 20px;

      opacity: 0;

      transform: translateY(5px);

      transition:
        opacity .25s ease,
        transform .25s ease;

      pointer-events: none;

    }


    .project-gallery-item:hover
    .project-gallery-zoom {

      opacity: 1;

      transform: translateY(0);

    }


    .handcraft-photo-lightbox {

      position: fixed;

      inset: 0;

      z-index: 5000;

      display: flex;

      align-items: center;

      justify-content: center;

      padding: 25px;

    }


    .handcraft-lightbox-backdrop {

      position: absolute;

      inset: 0;

      background:
        rgba(0,0,0,.96);

      backdrop-filter:
        blur(12px);

    }


    .handcraft-lightbox-content {

      position: relative;

      z-index: 2;

      width: 100%;

      height: 100%;

      display: flex;

      align-items: center;

      justify-content: center;

    }


    .handcraft-lightbox-image-wrap {

      width: min(
        88vw,
        1400px
      );

      height: min(
        78vh,
        850px
      );

      display: flex;

      align-items: center;

      justify-content: center;

      touch-action: pan-y;

    }


    #handcraft-lightbox-image {

      max-width: 100%;

      max-height: 100%;

      width: auto;

      height: auto;

      object-fit: contain;

      border-radius: 4px;

      box-shadow:
        0 25px 100px
        rgba(0,0,0,.55);

      user-select: none;

      -webkit-user-drag: none;

      animation:
        handcraftLightboxImageIn
        .3s ease;

    }


    @keyframes handcraftLightboxImageIn {

      from {

        opacity: 0;

        transform:
          scale(.97);

      }

      to {

        opacity: 1;

        transform:
          scale(1);

      }

    }


    .handcraft-lightbox-close {

      position: absolute;

      top: 12px;

      right: 12px;

      z-index: 5;

      width: 48px;

      height: 48px;

      border: 1px solid
        rgba(255,255,255,.25);

      border-radius: 50%;

      background:
        rgba(0,0,0,.5);

      color: white;

      font-size: 30px;

      line-height: 1;

      cursor: pointer;

    }


    .handcraft-lightbox-close:hover {

      background:
        rgba(255,255,255,.16);

    }


    .handcraft-lightbox-prev,
    .handcraft-lightbox-next {

      position: absolute;

      top: 50%;

      z-index: 5;

      width: 54px;

      height: 54px;

      display: flex;

      align-items: center;

      justify-content: center;

      border: 1px solid
        rgba(255,255,255,.25);

      border-radius: 50%;

      background:
        rgba(0,0,0,.55);

      color: white;

      font-size: 42px;

      line-height: 1;

      cursor: pointer;

      transform:
        translateY(-50%);

    }


    .handcraft-lightbox-prev {

      left: 15px;

    }


    .handcraft-lightbox-next {

      right: 15px;

    }


    .handcraft-lightbox-prev:hover,
    .handcraft-lightbox-next:hover {

      background:
        rgba(255,255,255,.16);

    }


    .handcraft-lightbox-bottom {

      position: absolute;

      left: 50%;

      bottom: 10px;

      z-index: 5;

      width: min(
        900px,
        90vw
      );

      transform:
        translateX(-50%);

      text-align: center;

      color: white;

    }


    .handcraft-lightbox-caption {

      margin-bottom: 5px;

      font-size: 13px;

      color:
        rgba(255,255,255,.82);

    }


    .handcraft-lightbox-counter {

      margin-bottom: 10px;

      font-size: 11px;

      letter-spacing: .12em;

      color:
        rgba(255,255,255,.55);

    }


    .handcraft-lightbox-thumbnails {

      display: flex;

      justify-content: center;

      gap: 6px;

      max-width: 100%;

      overflow-x: auto;

      padding: 3px;

      scrollbar-width: thin;

    }


    .handcraft-lightbox-thumbnail {

      flex: 0 0 auto;

      width: 58px;

      height: 42px;

      padding: 0;

      border: 2px solid transparent;

      background: transparent;

      opacity: .55;

      overflow: hidden;

      cursor: pointer;

      transition:
        opacity .2s ease,
        border-color .2s ease,
        transform .2s ease;

    }


    .handcraft-lightbox-thumbnail img {

      width: 100%;

      height: 100%;

      object-fit: cover;

    }


    .handcraft-lightbox-thumbnail:hover {

      opacity: .9;

      transform:
        translateY(-2px);

    }


    .handcraft-lightbox-thumbnail.active {

      opacity: 1;

      border-color:
        var(--accent, #b18a52);

    }


    @media (max-width: 720px) {

      .project-gallery-featured {

        grid-column: auto;

      }


      .handcraft-photo-lightbox {

        padding: 10px;

      }


      .handcraft-lightbox-image-wrap {

        width: 94vw;

        height: 70vh;

      }


      .handcraft-lightbox-prev,
      .handcraft-lightbox-next {

        width: 42px;

        height: 42px;

        font-size: 32px;

      }


      .handcraft-lightbox-prev {

        left: 5px;

      }


      .handcraft-lightbox-next {

        right: 5px;

      }


      .handcraft-lightbox-close {

        top: 5px;

        right: 5px;

      }


      .handcraft-lightbox-bottom {

        bottom: 4px;

        width: 94vw;

      }


      .handcraft-lightbox-thumbnail {

        width: 50px;

        height: 38px;

      }

    }

  `;


  document.head.appendChild(
    style
  );

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
    /[&<>\"']/g,
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

  const {
    data,
    error
  } = await sb
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();


  if (error) {

    console.error(
      "Handcraft settings error:",
      error
    );

    return;
  }


  if (!data) {
    return;
  }


  /* =========================================
     COMPANY NAME
  ========================================= */

  document
    .querySelectorAll(
      '[data-setting="company_name"]'
    )
    .forEach(element => {

      element.textContent =
        data.company_name ||
        "Handcraft Myanmar Company Limited";

    });


  /* =========================================
     BRAND SUBTITLE
  ========================================= */

  document
    .querySelectorAll(
      '[data-setting="brand_subtitle"]'
    )
    .forEach(element => {

      element.textContent =
        data.brand_subtitle ||
        "MYANMAR";

    });


  /* =========================================
     EMAIL
  ========================================= */

  document
    .querySelectorAll(
      '[data-setting="email"]'
    )
    .forEach(element => {

      element.textContent =
        data.email ||
        "Contact us";

      element.href =
        data.email
          ? "mailto:" + data.email
          : "mailto:";

    });


  /* =========================================
     PHONE 1
  ========================================= */

  document
    .querySelectorAll(
      '[data-setting="phone"]'
    )
    .forEach(element => {

      const value =
        data.phone ||
        "";

      if (value) {

        element.textContent =
          value;

        element.href =
          "tel:" +
          value.replace(/\s+/g, "");

        element.style.display =
          "";

      } else {

        element.style.display =
          "none";

      }

    });


  /* =========================================
     PHONE 2
  ========================================= */

  document
    .querySelectorAll(
      '[data-setting="phone2"]'
    )
    .forEach(element => {

      const value =
        data.phone2 ||
        "";

      if (value) {

        element.textContent =
          value;

        element.href =
          "tel:" +
          value.replace(/\s+/g, "");

        element.style.display =
          "";

      } else {

        element.style.display =
          "none";

      }

    });


  /* =========================================
     ADDRESS
  ========================================= */

  document
    .querySelectorAll(
      '[data-setting="address"]'
    )
    .forEach(element => {

      element.textContent =
        data.address ||
        "Myanmar";

      element.href =
        "https://www.google.com/maps?q=16.856993%2C96.1809639&z=17";

      element.target =
        "_blank";

      element.rel =
        "noopener";

    });


  /* =========================================
     GOOGLE MAP EMBED
  ========================================= */

  document
    .querySelectorAll(
      '[data-setting="map_embed_url"]'
    )
    .forEach(element => {

      if (
        element.tagName ===
        "IFRAME"
      ) {

        element.src =
          data.map_embed_url ||
          "https://www.google.com/maps?q=16.856993%2C96.1809639&z=17&output=embed";

      }

    });


  /* =========================================
     FACEBOOK
  ========================================= */

  document
    .querySelectorAll(
      '[data-setting="facebook_url"]'
    )
    .forEach(element => {

      const value =
        data.facebook_url ||
        "";

      if (value) {

        element.href =
          value;

        element.target =
          "_blank";

        element.rel =
          "noopener";

        element.style.display =
          "";

      } else {

        element.style.display =
          "none";

      }

    });


  /* =========================================
     INSTAGRAM
  ========================================= */

  document
    .querySelectorAll(
      '[data-setting="instagram_url"]'
    )
    .forEach(element => {

      const value =
        data.instagram_url ||
        "";

      if (value) {

        element.href =
          value;

        element.target =
          "_blank";

        element.rel =
          "noopener";

        element.style.display =
          "";

      } else {

        element.style.display =
          "none";

      }

    });


  /* =========================================
     YOUTUBE
  ========================================= */

  document
    .querySelectorAll(
      '[data-setting="youtube_url"]'
    )
    .forEach(element => {

      const value =
        data.youtube_url ||
        "";

      if (value) {

        element.href =
          value;

        element.target =
          "_blank";

        element.rel =
          "noopener";

        element.style.display =
          "";

      } else {

        element.style.display =
          "none";

      }

    });


  /* =========================================
     PINTEREST
  ========================================= */

  document
    .querySelectorAll(
      '[data-setting="pinterest_url"]'
    )
    .forEach(element => {

      const value =
        data.pinterest_url ||
        "";

      if (value) {

        element.href =
          value;

        element.target =
          "_blank";

        element.rel =
          "noopener";

        element.style.display =
          "";

      } else {

        element.style.display =
          "none";

      }

    });


  /* =========================================
     HERO TITLE
  ========================================= */

  document
    .querySelectorAll(
      '[data-setting="hero_title"]'
    )
    .forEach(element => {

      if (data.hero_title) {

        element.textContent =
          data.hero_title;

      }

    });


  /* =========================================
     HERO SUBTITLE
  ========================================= */

  document
    .querySelectorAll(
      '[data-setting="hero_subtitle"]'
    )
    .forEach(element => {

      if (data.hero_subtitle) {

        element.textContent =
          data.hero_subtitle;

      }

    });


  /* =========================================
     ABOUT TITLE
  ========================================= */

  document
    .querySelectorAll(
      '[data-setting="about_title"]'
    )
    .forEach(element => {

      if (data.about_title) {

        element.textContent =
          data.about_title;

      }

    });


  /* =========================================
     ABOUT BODY
  ========================================= */

  document
    .querySelectorAll(
      '[data-setting="about_body"]'
    )
    .forEach(element => {

      if (data.about_body) {

        element.textContent =
          data.about_body;

      }

    });

}


/* =========================================================
   START WEBSITE SETTINGS
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  loadSiteSettings
);

async function loadSiteSettings() {

  const {
    data,
    error
  } = await sb
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();


  if (error) {

    console.error(
      "Handcraft settings error:",
      error
    );

    return;
  }


  if (!data) {
    return;
  }


  document
    .querySelectorAll(
      "[data-setting]"
    )
    .forEach(element => {

      const key =
        element.dataset.setting;

      const value =
        data[key];


      if (
        value === null ||
        value === undefined
      ) {

        return;

      }


      if (
        element.tagName === "INPUT" ||
        element.tagName === "TEXTAREA"
      ) {

        element.value =
          value;

      } else {

        element.textContent =
          value;

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
            ? "tel:" +
              value.replace(
                /\s+/g,
                ""
              )
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


  document
    .querySelectorAll(
      '[data-setting="email"]'
    )
    .forEach(element => {

      element.textContent =
        data.email ||
        "Contact us";

      element.href =
        data.email
          ? "mailto:" +
            data.email
          : "mailto:";

    });


  document
    .querySelectorAll(
      '[data-setting="phone"]'
    )
    .forEach(element => {

      element.textContent =
        data.phone ||
        "Contact us";

      element.href =
        data.phone
          ? "tel:" +
            data.phone.replace(
              /\s+/g,
              ""
            )
          : "tel:";

    });

}


/* =========================================================
   START WEBSITE SETTINGS
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  loadSiteSettings
);
