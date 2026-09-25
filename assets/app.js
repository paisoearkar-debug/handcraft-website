const SUPABASE_URL =
  "https://jvaqtuiyswjybasfumjw.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_GteenSO57Kw0uv1qm6YUiw_-uZ7Uwe0";


const sb =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


const grid =
  document.getElementById(
    "project-grid"
  );


const filters =
  document.getElementById(
    "filters"
  );


const year =
  document.getElementById(
    "year"
  );


let allProjects = [];

let lightboxProject = null;

let lightboxIndex = 0;



document.addEventListener(
  "DOMContentLoaded",
  async () => {

    if (year) {

      year.textContent =
        new Date()
          .getFullYear();

    }


    installStyles();


    await loadSettings();

    await loadCategories();

    await loadProjects();

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

    console.error(
      "Website settings error:",
      error
    );

    return;

  }


  if (!data) {
    return;
  }


  setText(
    "company_name",
    data.company_name
  );


  setText(
    "brand_subtitle",
    data.brand_subtitle ||
    "MYANMAR"
  );


  setText(
    "email",
    data.email
  );


  setText(
    "phone",
    data.phone
  );


  setText(
    "phone2",
    data.phone2
  );


  setText(
    "address",
    data.address
  );


  setText(
    "hero_title",
    data.hero_title
  );


  setText(
    "hero_subtitle",
    data.hero_subtitle
  );


  setText(
    "about_title",
    data.about_title
  );


  setText(
    "about_body",
    data.about_body
  );


  document
    .querySelectorAll(
      '[data-setting="email"]'
    )
    .forEach(
      element => {

        if (data.email) {

          element.href =
            "mailto:" +
            data.email;

          element.textContent =
            data.email;

        }

      }
    );


  document
    .querySelectorAll(
      '[data-setting="phone"]'
    )
    .forEach(
      element => {

        if (data.phone) {

          element.textContent =
            data.phone;

          element.href =
            "tel:" +
            data.phone.replace(
              /\s+/g,
              ""
            );

          element.style.display =
            "";

        } else {

          element.style.display =
            "none";

        }

      }
    );


  document
    .querySelectorAll(
      '[data-setting="phone2"]'
    )
    .forEach(
      element => {

        if (data.phone2) {

          element.textContent =
            data.phone2;

          element.href =
            "tel:" +
            data.phone2.replace(
              /\s+/g,
              ""
            );

          element.style.display =
            "";

        } else {

          element.style.display =
            "none";

        }

      }
    );


  document
    .querySelectorAll(
      '[data-setting="address"]'
    )
    .forEach(
      element => {

        element.textContent =
          data.address ||
          "Myanmar";

        element.href =
          "https://www.google.com/maps?q=16.856993%2C96.1809639&z=17";

        element.target =
          "_blank";

        element.rel =
          "noopener";

      }
    );


  document
    .querySelectorAll(
      '[data-setting="map_embed_url"]'
    )
    .forEach(
      element => {

        if (
          element.tagName ===
          "IFRAME"
        ) {

          element.src =
            data.map_embed_url ||
            "https://www.google.com/maps?q=16.856993%2C96.1809639&z=17&output=embed";

        }

      }
    );


  setSocial(
    "facebook_url",
    data.facebook_url
  );


  setSocial(
    "instagram_url",
    data.instagram_url
  );

setSocial(
  "tiktok_url",
  data.tiktok_url
);
  
  setSocial(
    "youtube_url",
    data.youtube_url
  );


  setSocial(
    "pinterest_url",
    data.pinterest_url
  );

}



function setText(
  key,
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return;

  }


  document
    .querySelectorAll(
      `[data-setting="${key}"]`
    )
    .forEach(
      element => {

        element.textContent =
          value;

      }
    );

}



function setSocial(
  key,
  value
) {

  document
    .querySelectorAll(
      `[data-setting="${key}"]`
    )
    .forEach(
      element => {

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

      }
    );

}



/* CATEGORIES */

async function loadCategories() {

  const {
    data,
    error
  } =
    await sb
      .from("project_categories")
      .select("*")
      .eq(
        "active",
        true
      )
      .order(
        "sort_order",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "Category error:",
      error
    );

    return;

  }


  if (
    !filters
  ) {

    return;

  }


  const names =
    data || [];


  filters.innerHTML =
    `

      <button
        class="filter active"
        data-category="All"
        type="button"
      >
        All
      </button>

    ` +
    names
      .map(
        category => `

          <button
            class="filter"
            data-category="${escapeHtml(
              category.name
            )}"
            type="button"
          >
            ${escapeHtml(
              category.name
            )}
          </button>

        `
      )
      .join("");


  filters
    .querySelectorAll(
      ".filter"
    )
    .forEach(
      button => {

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
              category ===
              "All"
            ) {

              renderProjects(
                allProjects
              );

            } else {

              renderProjects(
                allProjects.filter(
                  project =>
                    project.category ===
                    category
                )
              );

            }

          }
        );

      }
    );

}



/* PROJECTS */

async function loadProjects() {

  if (!grid) {
    return;
  }


  grid.innerHTML =
    `
      <div class="loading-projects">
        Loading our projects...
      </div>
    `;


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
        "published",
        true
      )
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
      "Projects error:",
      error
    );


    grid.innerHTML =
      `
        <div class="loading-projects">
          Our project portfolio is
          being updated.
        </div>
      `;


    return;

  }


  allProjects =
    (data || [])
      .map(
        normalizeProject
      );


  renderProjects(
    allProjects
  );

}



function normalizeProject(
  project
) {

  let photos = [];


  if (
    Array.isArray(
      project.project_images
    )
  ) {

    photos =
      project.project_images
        .filter(
          image =>
            image &&
            image.image_url
        )
        .sort(
          (a,b) =>
            (a.sort_order || 0) -
            (b.sort_order || 0)
        )
        .map(
          image => ({

            id:
              image.id,

            url:
              image.image_url,

            alt:
              image.alt_text ||
              project.title

          })
        );

  }


  if (
    !photos.length &&
    project.image_url
  ) {

    photos.push({

      id:
        "main",

      url:
        project.image_url,

      alt:
        project.title

    });

  }


  return {

    ...project,

    photos

  };

}



/* PROJECT CARDS */

function renderProjects(
  projects
) {

  if (!grid) {
    return;
  }


  if (!projects.length) {

    grid.innerHTML =
      `
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
        (project,index) =>
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
    .forEach(
      card => {

        card.addEventListener(
          "click",
          () => {

            const project =
              projects.find(
                item =>
                  String(item.id) ===
                  String(
                    card.dataset.id
                  )
              );


            if (project) {

              openProject(
                project
              );

            }

          }
        );

      }
    );

}



function projectCard(
  project,
  index
) {

  const image =
    project.photos?.[0]?.url ||
    "";


  const count =
    project.photos?.length ||
    0;


  return `

    <article
      class="project-card"
      data-id="${escapeHtml(
        project.id
      )}"
    >

      ${
        image
          ? `

            <img
              src="${escapeHtml(
                image
              )}"
              alt="${escapeHtml(
                project.photos?.[0]?.alt ||
                project.title
              )}"
              loading="lazy"
            >

          `
          : `

            <div
              style="
                aspect-ratio:16/10;
                background:#ddd;
              "
            ></div>

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
            project.title
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

          ${
            count
              ? count +
                (
                  count === 1
                    ? " photo"
                    : " photos"
                )
              : "View project"
          }

        </p>

      </div>

    </article>

  `;

}



/* PROJECT MODAL */

function openProject(
  project
) {

  closeProject();


  const modal =
    document.createElement(
      "div"
    );


  modal.className =
    "project-modal open";


  modal.id =
    "handcraft-project-modal";


  const photos =
    project.photos ||
    [];


  modal.innerHTML = `

    <div
      class="project-modal-inner"
    >


      <div
        class="project-modal-header"
      >

        <div>

          <div
            style="
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
              project.title
            )}
          </h2>


          ${
            project.location
              ? `
                <div
                  style="
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
        >
          ×
        </button>

      </div>



      <div
        class="project-gallery"
      >

        ${
          photos.length
            ? photos
                .map(
                  (photo,index) => `

                    <button
                      class="
                        project-gallery-item
                        ${
                          index === 0
                            ? "project-gallery-featured"
                            : ""
                        }
                      "
                      type="button"
                      data-photo-index="${index}"
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
                  Project photos will be
                  added soon.
                </div>
              `
        }

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
      closeProject
    );


  modal
    .querySelectorAll(
      ".project-gallery-item"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          event => {

            event.stopPropagation();


            openLightbox(
              project,
              Number(
                button.dataset.photoIndex
              )
            );

          }
        );

      }
    );


  modal.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        modal
      ) {

        closeProject();

      }

    }
  );


  document.addEventListener(
    "keydown",
    modalKeydown
  );

}



function closeProject() {

  closeLightbox();


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
    modalKeydown
  );

}



function modalKeydown(
  event
) {

  if (
    event.key ===
    "Escape"
  ) {

    closeProject();

  }

}



/* LIGHTBOX */

function openLightbox(
  project,
  index
) {

  closeLightbox();


  lightboxProject =
    project;


  lightboxIndex =
    index;


  const lightbox =
    document.createElement(
      "div"
    );


  lightbox.id =
    "handcraft-lightbox";


  lightbox.className =
    "handcraft-photo-lightbox";


  lightbox.innerHTML = `

    <div
      class="handcraft-lightbox-backdrop"
    ></div>


    <div
      class="handcraft-lightbox-content"
    >

      <button
        class="handcraft-lightbox-close"
        type="button"
      >
        ×
      </button>


      <button
        class="handcraft-lightbox-prev"
        type="button"
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
      >
        ›
      </button>


      <div
        class="handcraft-lightbox-bottom"
      >

        <div
          id="handcraft-lightbox-caption"
        ></div>


        <div
          id="handcraft-lightbox-counter"
        ></div>


        <div
          id="handcraft-lightbox-thumbnails"
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
      closeLightbox
    );


  lightbox
    .querySelector(
      ".handcraft-lightbox-prev"
    )
    .addEventListener(
      "click",
      previousPhoto
    );


  lightbox
    .querySelector(
      ".handcraft-lightbox-next"
    )
    .addEventListener(
      "click",
      nextPhoto
    );


  lightbox
    .querySelector(
      ".handcraft-lightbox-backdrop"
    )
    .addEventListener(
      "click",
      closeLightbox
    );


  document.addEventListener(
    "keydown",
    lightboxKeydown
  );

}



function updateLightbox() {

  const lightbox =
    document.getElementById(
      "handcraft-lightbox"
    );


  if (
    !lightbox ||
    !lightboxProject
  ) {

    return;

  }


  const photos =
    lightboxProject.photos ||
    [];


  if (!photos.length) {
    return;
  }


  const photo =
    photos[
      lightboxIndex
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
    lightboxProject.title;


  caption.textContent =
    photo.alt ||
    lightboxProject.title;


  counter.textContent =
    `${lightboxIndex + 1} / ${photos.length}`;


  thumbnails.innerHTML =
    photos
      .map(
        (item,index) => `

          <button
            type="button"
            class="
              handcraft-lightbox-thumbnail
              ${
                index ===
                lightboxIndex
                  ? "active"
                  : ""
              }
            "
            data-index="${index}"
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
      "button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            lightboxIndex =
              Number(
                button.dataset.index
              );

            updateLightbox();

          }
        );

      }
    );

}



function previousPhoto() {

  if (
    !lightboxProject
  ) {
    return;
  }


  const count =
    lightboxProject.photos.length;


  lightboxIndex =
    (
      lightboxIndex -
      1 +
      count
    ) %
    count;


  updateLightbox();

}



function nextPhoto() {

  if (
    !lightboxProject
  ) {
    return;
  }


  const count =
    lightboxProject.photos.length;


  lightboxIndex =
    (
      lightboxIndex +
      1
    ) %
    count;


  updateLightbox();

}



function lightboxKeydown(
  event
) {

  if (
    event.key ===
    "Escape"
  ) {

    closeLightbox();

  }


  if (
    event.key ===
    "ArrowLeft"
  ) {

    previousPhoto();

  }


  if (
    event.key ===
    "ArrowRight"
  ) {

    nextPhoto();

  }

}



function closeLightbox() {

  const lightbox =
    document.getElementById(
      "handcraft-lightbox"
    );


  if (lightbox) {

    lightbox.remove();

  }


  lightboxProject =
    null;


  lightboxIndex =
    0;


  document.removeEventListener(
    "keydown",
    lightboxKeydown
  );

}



/* STYLES FOR PHOTO VIEWER */

function installStyles() {

  if (
    document.getElementById(
      "handcraft-app-styles"
    )
  ) {

    return;

  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "handcraft-app-styles";


  style.textContent = `

    .phone-list {
      display:flex;
      flex-direction:column;
      gap:7px;
    }


    .footer-socials {
      display:flex;
      flex-wrap:wrap;
      gap:14px;
    }


    .footer-socials a {
      text-decoration:none;
    }


    .project-gallery-item {
      position:relative;
      display:block;
      width:100%;
      padding:0;
      border:0;
      background:#eee;
      overflow:hidden;
      cursor:zoom-in;
    }


    .project-gallery-item img {
      width:100%;
      height:100%;
      display:block;
      object-fit:cover;
      transition:
        transform .6s ease,
        filter .4s ease;
    }


    .project-gallery-item:hover img {
      transform:scale(1.04);
      filter:brightness(1.05);
    }


    .project-gallery-featured {
      grid-column:span 2;
    }


    .project-gallery-zoom {
      position:absolute;
      right:15px;
      bottom:15px;
      width:38px;
      height:38px;
      display:flex;
      align-items:center;
      justify-content:center;
      border-radius:50%;
      background:rgba(0,0,0,.65);
      color:white;
      font-size:20px;
      opacity:0;
      transition:opacity .25s ease;
      pointer-events:none;
    }


    .project-gallery-item:hover
    .project-gallery-zoom {
      opacity:1;
    }


    .handcraft-photo-lightbox {
      position:fixed;
      inset:0;
      z-index:9999;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:20px;
    }


    .handcraft-lightbox-backdrop {
      position:absolute;
      inset:0;
      background:rgba(0,0,0,.96);
      backdrop-filter:blur(10px);
    }


    .handcraft-lightbox-content {
      position:relative;
      z-index:2;
      width:100%;
      height:100%;
      display:flex;
      align-items:center;
      justify-content:center;
    }


    .handcraft-lightbox-image-wrap {
      width:min(88vw,1400px);
      height:min(78vh,850px);
      display:flex;
      align-items:center;
      justify-content:center;
    }


    #handcraft-lightbox-image {
      max-width:100%;
      max-height:100%;
      object-fit:contain;
      border-radius:4px;
      box-shadow:
        0 25px 100px rgba(0,0,0,.55);
    }


    .handcraft-lightbox-close,
    .handcraft-lightbox-prev,
    .handcraft-lightbox-next {
      position:absolute;
      z-index:5;
      width:52px;
      height:52px;
      display:flex;
      align-items:center;
      justify-content:center;
      border:1px solid rgba(255,255,255,.25);
      border-radius:50%;
      background:rgba(0,0,0,.55);
      color:white;
      cursor:pointer;
    }


    .handcraft-lightbox-close {
      top:15px;
      right:15px;
      font-size:30px;
    }


    .handcraft-lightbox-prev {
      left:15px;
      top:50%;
      transform:translateY(-50%);
      font-size:40px;
    }


    .handcraft-lightbox-next {
      right:15px;
      top:50%;
      transform:translateY(-50%);
      font-size:40px;
    }


    .handcraft-lightbox-bottom {
      position:absolute;
      z-index:5;
      bottom:10px;
      left:50%;
      transform:translateX(-50%);
      width:min(900px,90vw);
      text-align:center;
      color:white;
    }


    #handcraft-lightbox-caption {
      margin-bottom:5px;
      font-size:13px;
    }


    #handcraft-lightbox-counter {
      margin-bottom:10px;
      font-size:11px;
      opacity:.6;
    }


    #handcraft-lightbox-thumbnails {
      display:flex;
      justify-content:center;
      gap:6px;
      overflow-x:auto;
    }


    .handcraft-lightbox-thumbnail {
      flex:0 0 auto;
      width:58px;
      height:42px;
      padding:0;
      border:2px solid transparent;
      background:none;
      opacity:.55;
      overflow:hidden;
      cursor:pointer;
    }


    .handcraft-lightbox-thumbnail img {
      width:100%;
      height:100%;
      object-fit:cover;
    }


    .handcraft-lightbox-thumbnail.active {
      opacity:1;
      border-color:#b18a52;
    }


    @media(max-width:720px) {

      .project-gallery-featured {
        grid-column:auto;
      }


      .handcraft-lightbox-image-wrap {
        width:94vw;
        height:70vh;
      }


      .handcraft-lightbox-prev,
      .handcraft-lightbox-next {
        width:42px;
        height:42px;
      }

    }

  `;


  document.head.appendChild(
    style
  );

}



/* ESCAPE HTML */

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
