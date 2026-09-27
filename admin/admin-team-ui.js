/* Handcraft Myanmar — Team Admin UI */
(function () {
  "use strict";

  const BUCKET = "team-photos";
  let members = [];
  let editing = "";
  let draggedId = "";
  let savingOrder = false;

  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));

  function msg(text, error = false) {
    const x = $("teamMessage");
    if (!x) return;
    x.textContent = text;
    x.className = "message show " + (error ? "error" : "success");
  }

  function inject() {
    const tabs = document.querySelector(".admin-tabs");
    const dash = $("dashboard");
    if (!tabs || !dash) return;

    if (!$("teamSection")) {
      const a = document.createElement("a");
      a.href = "#teamSection";
      a.textContent = "👥 Team";
      tabs.appendChild(a);

      const s = document.createElement("section");
      s.className = "card";
      s.id = "teamSection";
      s.innerHTML = `
        <h2>Team & Organization</h2>
        <p class="card-description">Add employees, upload staff photos, assign reporting managers and control who appears on the public Team page.</p>

        <div id="teamMessage" class="message"></div>

        <form id="teamForm">
          <input id="teamMemberId" type="hidden">

          <div class="grid-3">
            <label>Employee ID<input id="teamEmployeeId" type="text" placeholder="HCM-001" required></label>
            <label>Full Name<input id="teamFullName" type="text" required></label>
            <label>Position<input id="teamPosition" type="text" required></label>
            <label>Department<input id="teamDepartment" type="text" placeholder="Management / Engineering / Production"></label>
            <label>Reports To<select id="teamManagerId"><option value="">No manager / top level</option></select></label>
            <label>Display Order<input id="teamDisplayOrder" type="number" value="0"></label>
          </div>

          <br>
          <label>Biography<textarea id="teamBio" placeholder="Short professional biography..."></textarea></label>
          <br>

          <div class="grid-2">
            <label>Email<input id="teamEmail" type="email"></label>
            <label>Phone<input id="teamPhone" type="text"></label>
            <label>LinkedIn URL<input id="teamLinkedin" type="url"></label>

            <label>Employee Photo
              <input id="teamPhotoFile" type="file" accept="image/jpeg,image/png,image/webp">
              <span class="muted">JPG, PNG or WebP. Maximum 10 MB.</span>
            </label>
          </div>

          <div id="teamPhotoStatus" class="hc-action-status"></div>
          <div id="teamPhotoPreview" style="margin-top:14px"></div>

          <div class="checkbox-row">
            <input id="teamShowPublic" type="checkbox" checked>
            <label for="teamShowPublic" style="font-weight:400">Show this employee on public Team page</label>
          </div>

          <div class="checkbox-row">
            <input id="teamActive" type="checkbox" checked>
            <label for="teamActive" style="font-weight:400">Active employee</label>
          </div>

          <div class="buttons">
            <button id="saveTeamBtn" type="submit">Save Employee</button>
            <button id="cancelTeamBtn" class="secondary" type="button">New / Cancel</button>
          </div>
        </form>

        <br>
        <div id="teamList" class="admin-list"></div>
      `;

      dash.appendChild(s);
    }

    if (!$("teamAdminStyle")) {
      const st = document.createElement("style");
      st.id = "teamAdminStyle";
      st.textContent = `
        .team-admin-photo{
          width:58px;
          height:58px;
          border-radius:12px;
          object-fit:cover;
          background:#eee;
          display:block;
          flex:none
        }
        .team-admin-person{
          display:flex;
          align-items:center;
          gap:13px;
          min-width:0
        }
        .team-admin-badge{
          display:inline-block;
          margin-left:6px;
          padding:3px 7px;
          border-radius:999px;
          font-size:10px;
          font-weight:800;
          background:#eee
        }
        .team-admin-badge.off{
          background:#fff0ef;
          color:#b42318
        }

        /* Safe built-in drag ordering — no separate drag.js required */
        .team-sort-list{
          display:flex;
          flex-direction:column;
          gap:8px
        }
        .team-sort-item{
          position:relative;
          transition:transform .15s ease, opacity .15s ease, box-shadow .15s ease;
        }
        .team-sort-item.dragging{
          opacity:.45;
        }
        .team-sort-item.drag-over{
          box-shadow:0 -3px 0 #111;
        }
        .team-drag-handle{
          width:34px;
          height:34px;
          flex:0 0 34px;
          border:1px solid #ddd;
          border-radius:9px;
          background:#f7f7f5;
          color:#555;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:grab;
          user-select:none;
          -webkit-user-select:none;
          font-size:18px;
          line-height:1;
        }
        .team-drag-handle:active{
          cursor:grabbing;
        }
        .team-sort-item.is-saving .team-drag-handle{
          opacity:.55;
        }
        .team-sort-help{
          margin:0 0 10px;
          color:#777;
          font-size:12px;
        }
        .team-order-number{
          min-width:28px;
          font-size:11px;
          font-weight:800;
          color:#888;
          text-align:center;
        }
        .team-list-main{
          display:flex;
          align-items:center;
          gap:10px;
          min-width:0;
        }
        .team-list-main .team-admin-person{
          flex:1;
        }
      `;
      document.head.appendChild(st);
    }

    if ($("teamForm") && !$("teamForm").dataset.bound) {
      $("teamForm").dataset.bound = "1";
      $("teamForm").addEventListener("submit", save);
      $("cancelTeamBtn").addEventListener("click", reset);
    }
  }

  async function load() {
    const r = await sb
      .from("team_members")
      .select("id,employee_id,full_name,position,department,bio,email,phone,linkedin_url,photo_url,manager_id,display_order,show_public,active")
      .order("display_order", { ascending: true })
      .order("full_name", { ascending: true });

    if (r.error) {
      msg(r.error.message, true);
      return;
    }

    members = r.data || [];
    managers();
    list();
  }

  function managers() {
    const select = $("teamManagerId");
    if (!select) return;

    const current = editing;

    select.innerHTML =
      '<option value="">No manager / top level</option>' +
      members
        .filter(p => p.id !== current)
        .map(p =>
          `<option value="${esc(p.id)}">${esc(p.employee_id)} — ${esc(p.full_name)} (${esc(p.position)})</option>`
        )
        .join("");
  }

  function list() {
    const l = $("teamList");
    if (!l) return;

    if (!members.length) {
      l.innerHTML = '<p class="muted">No team members yet. Add your first employee above.</p>';
      return;
    }

    l.innerHTML = `
      <p class="team-sort-help">↕ Drag the handle on the left to move employees up or down. The new order is saved automatically.</p>
      <div class="team-sort-list">
        ${members.map((p, index) => {
          const manager = members.find(x => x.id === p.manager_id);

          return `
            <div class="list-item team-sort-item"
                 data-team-id="${esc(p.id)}"
                 draggable="false">
              <div class="team-list-main">
                <div class="team-drag-handle"
                     draggable="true"
                     title="Drag to reorder"
                     aria-label="Drag ${esc(p.full_name)} to reorder">↕</div>

                <div class="team-order-number">${index + 1}</div>

                <div class="team-admin-person">
                  ${
                    p.photo_url
                      ? `<img class="team-admin-photo" src="${esc(p.photo_url)}" alt="${esc(p.full_name)}">`
                      : '<div class="team-admin-photo"></div>'
                  }

                  <div>
                    <strong>
                      ${esc(p.employee_id)} — ${esc(p.full_name)}
                      <span class="team-admin-badge ${p.active && p.show_public ? "" : "off"}">
                        ${p.active && p.show_public ? "Public" : p.active ? "Hidden" : "Inactive"}
                      </span>
                    </strong>

                    <small>
                      ${esc(p.position)}
                      ${p.department ? " · " + esc(p.department) : ""}
                      ${manager ? " · Reports to " + esc(manager.full_name) : ""}
                    </small>
                  </div>
                </div>
              </div>

              <div class="list-actions">
                <button type="button" onclick="editTeamMember('${p.id}')">Edit</button>
                <button type="button" class="danger" onclick="deleteTeamMember('${p.id}')">Delete</button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;

    bindDrag();
  }

  function bindDrag() {
    const listEl = $("teamList");
    if (!listEl) return;

    const items = Array.from(listEl.querySelectorAll(".team-sort-item"));
    const handles = Array.from(listEl.querySelectorAll(".team-drag-handle"));

    handles.forEach(handle => {
      handle.addEventListener("dragstart", onDragStart);
      handle.addEventListener("dragend", onDragEnd);

      handle.addEventListener("keydown", event => {
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
          event.preventDefault();
          const item = handle.closest(".team-sort-item");
          if (!item) return;

          const currentIndex = members.findIndex(x => x.id === item.dataset.teamId);
          if (currentIndex < 0) return;

          const nextIndex =
            event.key === "ArrowUp"
              ? currentIndex - 1
              : currentIndex + 1;

          if (nextIndex < 0 || nextIndex >= members.length) return;

          moveMember(currentIndex, nextIndex);
        }
      });

      handle.tabIndex = 0;
      handle.setAttribute("role", "button");
    });

    items.forEach(item => {
      item.addEventListener("dragover", onDragOver);
      item.addEventListener("drop", onDrop);
      item.addEventListener("dragenter", () => item.classList.add("drag-over"));
      item.addEventListener("dragleave", event => {
        if (!item.contains(event.relatedTarget)) {
          item.classList.remove("drag-over");
        }
      });
    });
  }

  function onDragStart(event) {
    const handle = event.currentTarget;
    const item = handle.closest(".team-sort-item");
    if (!item) return;

    draggedId = item.dataset.teamId;
    item.classList.add("dragging");

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedId);
    }
  }

  function onDragEnd() {
    const listEl = $("teamList");
    if (listEl) {
      listEl.querySelectorAll(".team-sort-item").forEach(item => {
        item.classList.remove("dragging", "drag-over");
      });
    }
    draggedId = "";
  }

  function onDragOver(event) {
    if (!draggedId) return;
    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
  }

  async function onDrop(event) {
    event.preventDefault();

    const target = event.currentTarget;
    const targetId = target.dataset.teamId;

    target.classList.remove("drag-over");

    if (!draggedId || !targetId || draggedId === targetId) {
      return;
    }

    const fromIndex = members.findIndex(x => x.id === draggedId);
    const toIndex = members.findIndex(x => x.id === targetId);

    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      return;
    }

    moveMember(fromIndex, toIndex);
  }

  async function moveMember(fromIndex, toIndex) {
    if (savingOrder) return;

    const moved = members.splice(fromIndex, 1)[0];
    members.splice(toIndex, 0, moved);

    list();

    savingOrder = true;
    const listEl = $("teamList");
    if (listEl) listEl.classList.add("is-saving");

    try {
      const updates = members.map((person, index) => ({
        id: person.id,
        display_order: index + 1
      }));

      /*
       * Important:
       * We update only display_order.
       * Employee names, photos, managers, departments, etc. are untouched.
       */
      for (const row of updates) {
        const result = await sb
          .from("team_members")
          .update({ display_order: row.display_order })
          .eq("id", row.id);

        if (result.error) {
          throw result.error;
        }
      }

      members.forEach((person, index) => {
        person.display_order = index + 1;
      });

      msg("✓ Team order saved.");
    } catch (error) {
      console.error("Team reorder error:", error);

      msg(
        error?.message || "Could not save the new team order.",
        true
      );

      await load();
    } finally {
      savingOrder = false;
      const currentList = $("teamList");
      if (currentList) currentList.classList.remove("is-saving");
    }
  }

  async function uploadPhoto(file, employeeId) {
    if (!file) return null;

    if (file.size > 10 * 1024 * 1024) {
      throw new Error("Photo is larger than 10 MB.");
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.type)) {
      throw new Error("Please choose a JPG, PNG or WebP image.");
    }

    if (!sb?.storage) {
      throw new Error("Supabase storage is not available. Please refresh the Admin page.");
    }

    const safe = employeeId
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-");

    const extension =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";

    const path = `${safe}-${Date.now()}.${extension}`;

    const status = $("teamPhotoStatus");
    if (status) {
      status.className = "hc-action-status";
      status.textContent = "Uploading employee photo…";
    }

    const upload = await sb.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      });

    if (upload.error) {
      throw new Error(
        `Photo upload failed: ${upload.error.message || "Storage upload error."}`
      );
    }

    const publicUrl =
      sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

    if (!publicUrl) {
      throw new Error("Photo uploaded, but Supabase did not return a public URL.");
    }

    if (status) {
      status.className = "hc-action-status success";
      status.textContent = "✓ Photo uploaded successfully.";
    }

    return publicUrl;
  }

  async function save(event) {
    event.preventDefault();

    const employeeId = $("teamEmployeeId").value.trim();
    const fullName = $("teamFullName").value.trim();
    const position = $("teamPosition").value.trim();

    if (!employeeId || !fullName || !position) {
      msg("Employee ID, Full Name and Position are required.", true);
      return;
    }

    const button = $("saveTeamBtn");

    if (window.handcraftButtonWorking) {
      window.handcraftButtonWorking(button, "Saving");
    } else {
      button.disabled = true;
      button.textContent = "Saving…";
    }

    try {
      const id = $("teamMemberId").value.trim();
      const old = id ? members.find(x => x.id === id) : null;

      let photoUrl = old?.photo_url || null;
      const file = $("teamPhotoFile").files[0];

      if (file) {
        photoUrl = await uploadPhoto(file, employeeId);
      }

      const managerId = $("teamManagerId").value || null;

      if (managerId === id) {
        throw new Error("An employee cannot report to themselves.");
      }

      const payload = {
        employee_id: employeeId,
        full_name: fullName,
        position,
        department: $("teamDepartment").value.trim() || null,
        bio: $("teamBio").value.trim() || null,
        email: $("teamEmail").value.trim() || null,
        phone: $("teamPhone").value.trim() || null,
        linkedin_url: $("teamLinkedin").value.trim() || null,
        photo_url: photoUrl,
        manager_id: managerId,
        display_order: Number($("teamDisplayOrder").value || 0),
        show_public: $("teamShowPublic").checked,
        active: $("teamActive").checked
      };

      const result = id
        ? await sb.from("team_members").update(payload).eq("id", id)
        : await sb.from("team_members").insert(payload);

      if (result.error) {
        throw result.error;
      }

      reset();
      await load();

      msg(id ? "✓ Employee updated successfully." : "✓ Employee added successfully.");

      if (window.handcraftButtonDone) {
        window.handcraftButtonDone(button, "Saved ✓");
        setTimeout(() => {
          if (button) button.textContent = "Save Employee";
        }, 1200);
      }

    } catch (error) {
      console.error("Team save error:", error);

      msg(
        error?.message || "Could not save employee.",
        true
      );

      if (window.handcraftButtonError) {
        window.handcraftButtonError(button, "Try Again");
        setTimeout(() => {
          if (button) button.textContent = "Save Employee";
        }, 1400);
      } else {
        button.disabled = false;
        button.textContent = "Save Employee";
      }
    }
  }

  window.editTeamMember = function(id) {
    const p = members.find(x => x.id === id);
    if (!p) return;

    editing = id;

    $("teamMemberId").value = p.id;
    $("teamEmployeeId").value = p.employee_id || "";
    $("teamFullName").value = p.full_name || "";
    $("teamPosition").value = p.position || "";
    $("teamDepartment").value = p.department || "";
    $("teamBio").value = p.bio || "";
    $("teamEmail").value = p.email || "";
    $("teamPhone").value = p.phone || "";
    $("teamLinkedin").value = p.linkedin_url || "";
    $("teamDisplayOrder").value = p.display_order || 0;
    $("teamShowPublic").checked = p.show_public !== false;
    $("teamActive").checked = p.active !== false;

    managers();
    $("teamManagerId").value = p.manager_id || "";

    $("teamPhotoStatus").textContent = "";

    $("teamPhotoPreview").innerHTML =
      p.photo_url
        ? `<img class="team-admin-photo" style="width:90px;height:90px" src="${esc(p.photo_url)}" alt="${esc(p.full_name)}">`
        : "";

    $("teamSection").scrollIntoView({ behavior: "smooth" });
  };

  window.deleteTeamMember = async function(id) {
    const p = members.find(x => x.id === id);
    if (!p) return;

    if (!confirm(`Delete ${p.full_name} (${p.employee_id})?`)) return;

    msg("Deleting employee…");

    const result =
      await sb.from("team_members").delete().eq("id", id);

    if (result.error) {
      msg(result.error.message, true);
      return;
    }

    reset();
    await load();
    msg("✓ Employee deleted.");
  };

  function reset() {
    if ($("teamForm")) $("teamForm").reset();

    editing = "";

    $("teamMemberId").value = "";
    $("teamShowPublic").checked = true;
    $("teamActive").checked = true;
    $("teamDisplayOrder").value = 0;
    $("teamPhotoPreview").innerHTML = "";
    $("teamPhotoStatus").textContent = "";

    managers();

    const x = $("teamMessage");
    if (x) {
      x.textContent = "";
      x.className = "message";
    }
  }

  function boot() {
    inject();
    load();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
