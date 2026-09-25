(() => {
  "use strict";

  const SUPABASE_URL = "https://jvaqtuiyswjybasfumjw.supabase.co";
  const SUPABASE_KEY = "sb_publishable_GteenSO57Kw0uv1qm6YUiw_-uZ7Uwe0";

  const leadershipRoles = new Set([
    "CHIEF EXECUTIVE OFFICER",
    "CHIEF FINANCE OFFICER",
    "CHIEF OPERATION OFFICER",
    "CHIEF OPERATING OFFICER"
  ]);

  const $ = id => document.getElementById(id);

  const esc = value =>
    String(value ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#039;"
    }[c]));

  function isLeader(position) {
    return leadershipRoles.has(
      String(position || "").trim().toUpperCase()
    );
  }

  function photoMarkup(url, name, cls = "") {
    if (url) {
      return `<img class="${esc(cls)}" src="${esc(url)}" alt="${esc(name)}" loading="lazy">`;
    }

    return `<div class="org-avatar ${esc(cls)}">${esc(String(name || "?").slice(0, 1))}</div>`;
  }

  function quoteFor(position) {
    const x = String(position || "").toUpperCase();

    if (x.includes("FINANCE")) {
      return "Strong foundations create room for responsible, sustainable growth.";
    }

    if (x.includes("OPERATION")) {
      return "Great projects come together when people, process and execution move as one.";
    }

    if (x.includes("EXECUTIVE")) {
      return "A clear vision gives every project a meaningful direction.";
    }

    return "Good work is built through care, collaboration and consistency.";
  }

  function leaderCard(person) {
    const isReverse =
      String(person.full_name || "").trim().toUpperCase() === "NAING LIN ZAW";

    return `
      <article class="leader ${isReverse ? "reverse" : ""}">
        <div class="leader-photo">
          ${photoMarkup(person.photo_url, person.full_name)}
        </div>

        <div class="leader-content">
          <div>
            <div class="leader-role">
              ${esc(person.employee_id)} · ${esc(person.department || "MANAGEMENT")}
            </div>

            <h3 class="leader-name">
              ${esc(person.full_name)}
            </h3>

            <div class="leader-position">
              ${esc(person.position)}
            </div>

            <div class="leader-rule"></div>

            ${
              person.bio
                ? `<p class="leader-bio">${esc(person.bio)}</p>`
                : `<p class="leader-bio">
                    Leadership, strategic coordination and professional responsibility
                    supporting Handcraft Myanmar's continued growth.
                  </p>`
            }
          </div>

          <div class="leader-quote">
            ${esc(quoteFor(person.position))}
          </div>
        </div>
      </article>
    `;
  }

  function personCard(person) {
    return `
      <article class="person-card">
        <div class="person-photo">
          ${
            person.photo_url
              ? `<img
                  src="${esc(person.photo_url)}"
                  alt="${esc(person.full_name)} — ${esc(person.position)}"
                  loading="lazy"
                >`
              : `<div class="team-photo-placeholder">
                  Photo coming soon
                </div>`
          }
        </div>

        <div class="person-body">
          <div class="person-id">
            ${esc(person.employee_id)}
          </div>

          <h3 class="person-name">
            ${esc(person.full_name)}
          </h3>

          <div class="person-position">
            ${esc(person.position)}
          </div>

          <div class="person-dept">
            ${esc(person.department || "Handcraft Myanmar")}
          </div>

          ${
            person.bio
              ? `<p class="person-bio">${esc(person.bio)}</p>`
              : ""
          }

          <div class="person-contact">
            Contact details available upon request.
          </div>
        </div>
      </article>
    `;
  }

  function orgCard(person) {
    return `
      <div class="org-card">
        ${photoMarkup(person.photo_url, person.full_name)}

        <div>
          <div class="org-name">
            ${esc(person.full_name)}
          </div>

          <div class="org-position">
            ${esc(person.position)}
          </div>
        </div>
      </div>
    `;
  }

  function orgNode(person, children) {
    return `
      <div class="org-node">
        ${orgCard(person)}

        ${
          children.length
            ? `
              <div class="org-children">
                ${children
                  .map(child =>
                    `<div class="org-child">
                      ${orgNode(child, child._children || [])}
                    </div>`
                  )
                  .join("")}
              </div>
            `
            : ""
        }
      </div>
    `;
  }

  function showError(message) {
    ["leadershipGrid", "peopleGrid", "orgTree"].forEach(id => {
      const el = $(id);

      if (el) {
        el.innerHTML = `
          <div class="team-error">
            <strong>Unable to load team.</strong>
            <br><br>
            ${esc(message)}
          </div>
        `;
      }
    });
  }

  async function loadTeam() {
    const leadership = $("leadershipGrid");
    const peopleGrid = $("peopleGrid");
    const orgTree = $("orgTree");

    if (!leadership || !peopleGrid || !orgTree) {
      console.error("Handcraft Team: required containers are missing.");
      return;
    }

    leadership.innerHTML =
      '<div class="team-empty">Loading management...</div>';

    peopleGrid.innerHTML =
      '<div class="team-empty">Loading team members...</div>';

    orgTree.innerHTML =
      '<div class="team-empty">Loading organization structure...</div>';

    try {
      if (!window.supabase || !window.supabase.createClient) {
        throw new Error(
          "Supabase library did not load. Please refresh the page."
        );
      }

      const client =
        window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_KEY
        );

      const {
        data: people,
        error
      } = await client
        .from("team_members")
        .select(
          "id,employee_id,full_name,position,department,bio,photo_url,manager_id,display_order"
        )
        .eq("active", true)
        .eq("show_public", true)
        .order("display_order", { ascending: true })
        .order("full_name", { ascending: true });

      if (error) {
        throw new Error(
          error.message || "Supabase could not load the team."
        );
      }

      const rows = Array.isArray(people) ? people : [];

      console.log(
        `Handcraft Team: loaded ${rows.length} public team members.`
      );

      if (!rows.length) {
        leadership.innerHTML =
          '<div class="team-empty">No public management members have been added yet.</div>';

        peopleGrid.innerHTML = "";

        orgTree.innerHTML =
          '<div class="team-empty">Organization structure will appear after employees are added.</div>';

        return;
      }

      const leaders =
        rows.filter(person => isLeader(person.position));

      const others =
        rows.filter(person => !isLeader(person.position));

      leadership.innerHTML =
        leaders.length
          ? leaders.map(leaderCard).join("")
          : '<div class="team-empty">Management profiles will appear here.</div>';

      peopleGrid.innerHTML =
        others.length
          ? others.map(personCard).join("")
          : '<div class="team-empty">Additional team members will appear here.</div>';

      const byId =
        new Map(
          rows.map(person => [
            person.id,
            { ...person, _children: [] }
          ])
        );

      const roots = [];

      byId.forEach(person => {
        if (
          person.manager_id &&
          byId.has(person.manager_id)
        ) {
          byId
            .get(person.manager_id)
            ._children
            .push(person);
        } else {
          roots.push(person);
        }
      });

      byId.forEach(person => {
        person._children.sort(
          (a, b) =>
            (Number(a.display_order || 0) -
             Number(b.display_order || 0)) ||
            String(a.full_name || "")
              .localeCompare(String(b.full_name || ""))
        );
      });

      roots.sort(
        (a, b) =>
          (Number(a.display_order || 0) -
           Number(b.display_order || 0)) ||
          String(a.full_name || "")
            .localeCompare(String(b.full_name || ""))
      );

      orgTree.innerHTML =
        roots
          .map(root =>
            `<div class="org-root">
              ${orgNode(root, root._children || [])}
            </div>`
          )
          .join("");

    } catch (error) {
      console.error("Handcraft Team error:", error);

      showError(
        error && error.message
          ? error.message
          : "Unknown error while loading the team."
      );
    }
  }

  function init() {
    const year = $("year");

    if (year) {
      year.textContent =
        new Date().getFullYear();
    }

    loadTeam();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }
})();
