/* Handcraft Myanmar — drag-and-drop employee ordering overlay */
(function () {
  "use strict";

  let dragged = null;

  const style = document.createElement("style");
  style.textContent = `
    #teamList .hc-team-drag-item{
      position:relative;
      transition:transform .15s ease,opacity .15s ease,border-color .15s ease;
    }
    #teamList .hc-team-drag-item.hc-dragging{opacity:.4}
    #teamList .hc-team-drag-item.hc-drag-over{
      border-color:#111;
      box-shadow:0 0 0 2px rgba(0,0,0,.08);
    }
    .hc-team-drag-row{
      display:flex;
      align-items:center;
      gap:12px;
      min-width:0;
      flex:1;
    }
    .hc-team-drag-handle{
      width:38px;
      min-width:38px;
      height:48px;
      display:flex;
      align-items:center;
      justify-content:center;
      border-radius:10px;
      background:#f0efec;
      color:#666;
      font-size:20px;
      letter-spacing:-4px;
      cursor:grab;
      user-select:none;
      touch-action:none;
    }
    .hc-team-drag-handle:active{cursor:grabbing}
    .hc-team-order-number{
      width:28px;
      min-width:28px;
      text-align:center;
      color:#777;
      font-size:11px;
      font-weight:900;
    }
    #teamDisplayOrder{display:none!important}
    @media(max-width:760px){
      .hc-team-drag-row{gap:8px}
      .hc-team-drag-handle{width:34px;min-width:34px}
    }
  `;
  document.head.appendChild(style);

  function getId(item) {
    const edit = item.querySelector("button[onclick*='editTeamMember']");
    if (!edit) return "";
    const match = edit.getAttribute("onclick").match(/editTeamMember\('([^']+)'\)/);
    return match ? match[1] : "";
  }

  function decorate() {
    const list = document.getElementById("teamList");
    if (!list) return;

    const items = Array.from(list.querySelectorAll(":scope > .list-item"));
    if (!items.length) return;

    items.forEach((item, index) => {
      if (item.classList.contains("hc-team-drag-item")) {
        const num = item.querySelector(".hc-team-order-number");
        if (num) num.textContent = String(index + 1);
        return;
      }

      const id = getId(item);
      if (!id) return;

      item.classList.add("hc-team-drag-item");
      item.draggable = true;
      item.dataset.teamId = id;

      const person = item.firstElementChild;
      if (!person) return;

      const row = document.createElement("div");
      row.className = "hc-team-drag-row";

      const handle = document.createElement("div");
      handle.className = "hc-team-drag-handle";
      handle.title = "Drag up or down to reorder";
      handle.textContent = "⋮⋮";

      const number = document.createElement("div");
      number.className = "hc-team-order-number";
      number.textContent = String(index + 1);

      item.insertBefore(row, person);
      row.appendChild(handle);
      row.appendChild(number);
      row.appendChild(person);

      item.addEventListener("dragstart", onStart);
      item.addEventListener("dragover", onOver);
      item.addEventListener("dragleave", onLeave);
      item.addEventListener("drop", onDrop);
      item.addEventListener("dragend", onEnd);
    });
  }

  function refreshNumbers() {
    document
      .querySelectorAll("#teamList .hc-team-drag-item")
      .forEach((item, index) => {
        const n = item.querySelector(".hc-team-order-number");
        if (n) n.textContent = String(index + 1);
      });
  }

  function onStart(event) {
    dragged = event.currentTarget;
    dragged.classList.add("hc-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", dragged.dataset.teamId);
  }

  function onOver(event) {
    event.preventDefault();
    if (!dragged || event.currentTarget === dragged) return;
    event.currentTarget.classList.add("hc-drag-over");
  }

  function onLeave(event) {
    event.currentTarget.classList.remove("hc-drag-over");
  }

  async function onDrop(event) {
    event.preventDefault();

    const target = event.currentTarget;
    target.classList.remove("hc-drag-over");

    if (!dragged || target === dragged) return;

    const list = document.getElementById("teamList");
    const rect = target.getBoundingClientRect();
    const after = event.clientY > rect.top + rect.height / 2;

    if (after) {
      target.after(dragged);
    } else {
      target.before(dragged);
    }

    refreshNumbers();
    await saveOrder();
  }

  function onEnd(event) {
    event.currentTarget.classList.remove("hc-dragging");
    document.querySelectorAll(".hc-drag-over")
      .forEach(el => el.classList.remove("hc-drag-over"));
    dragged = null;
  }

  async function saveOrder() {
    const list = document.getElementById("teamList");
    const items = Array.from(
      list.querySelectorAll(":scope > .hc-team-drag-item")
    );

    const status = document.getElementById("teamMessage");
    if (status) {
      status.textContent = "Saving new employee order…";
      status.className = "message show";
    }

    try {
      const results = await Promise.all(
        items.map((item, index) =>
          sb
            .from("team_members")
            .update({ display_order: index + 1 })
            .eq("id", item.dataset.teamId)
        )
      );

      const failed = results.find(r => r.error);
      if (failed) throw failed.error;

      if (status) {
        status.textContent = "✓ Employee order saved automatically.";
        status.className = "message show success";
      }
    } catch (error) {
      console.error("Employee reorder failed:", error);

      if (status) {
        status.textContent =
          error?.message || "Could not save employee order.";
        status.className = "message show error";
      }
    }
  }

  function start() {
    decorate();

    const list = document.getElementById("teamList");
    if (!list) return;

    const observer = new MutationObserver(() => {
      decorate();
      refreshNumbers();
    });

    observer.observe(list, { childList:true, subtree:true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
