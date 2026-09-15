const SUPABASE_URL = "https://jvaqtuiyswjybasfumjw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_GteenSO57Kw0uv1qm6YUiw_-uZ7Uwe0";
let sb = null;
if (window.supabase && !SUPABASE_URL.startsWith("YOUR_")) {
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
const grid = document.getElementById("project-grid");
const filters = document.getElementById("filters");
let allProjects = [];
document.getElementById("year").textContent = new Date().getFullYear();

function card(p){
  const img = p.image_url || "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80";
  return `<article class="project-card"><img src="${img}" alt="${escapeHtml(p.title)}" loading="lazy"><div class="copy"><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.category || "Project")}${p.location ? " · "+escapeHtml(p.location) : ""}</p></div></article>`;
}
function escapeHtml(s=""){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function render(list){grid.innerHTML=list.length?list.map(card).join(""):"<div class='loading'>No projects yet.</div>"}
function makeFilters(){
  const cats=["All",...new Set(allProjects.map(p=>p.category).filter(Boolean))];
  filters.innerHTML=cats.map((c,i)=>`<button class="filter ${i===0?"active":""}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("");
  filters.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{
    filters.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");
    render(b.dataset.cat==="All"?allProjects:allProjects.filter(p=>p.category===b.dataset.cat));
  });
}
async function loadProjects(){
  if(!sb){grid.innerHTML="<div class='loading'>Add your Supabase settings in assets/app.js to enable the project portfolio.</div>";return}
  const {data,error}=await sb.from("projects").select("*").eq("published",true).order("sort_order",{ascending:true}).order("created_at",{ascending:false});
  if(error){console.error(error);grid.innerHTML="<div class='loading'>Projects are temporarily unavailable.</div>";return}
  allProjects=data||[];makeFilters();render(allProjects);
}
loadProjects();
