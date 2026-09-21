const SUPABASE_URL="https://jvaqtuiyswjybasfumjw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_GteenSO57Kw0uv1qm6YUiw_-uZ7Uwe0";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const FALLBACK_IMG = "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=400&q=70";
const $=id=>document.getElementById(id);
let editing=null;
async function boot(){const {data:{session}}=await sb.auth.getSession(); if(session) showDash(); else $("login").hidden=false}
function showDash(){$("login").hidden=true;$("dashboard").hidden=false;load()}
$("loginBtn").onclick=async()=>{const {error}=await sb.auth.signInWithPassword({email:$("email").value,password:$("password").value});$("loginMsg").textContent=error?error.message:"";if(!error)showDash()}
$("logoutBtn").onclick=async()=>{await sb.auth.signOut();location.reload()}
async function load(){const {data,error}=await sb.from("projects").select("*").order("sort_order",{ascending:true}).order("created_at",{ascending:false});if(error){$("list").textContent=error.message;return}
$("list").innerHTML=(data||[]).map(p=>`<div class="project-row"><img src="${p.image_url||FALLBACK_IMG}" loading="lazy"><div><b>${esc(p.title)}</b><div>${esc(p.category||"")} · ${p.published?"Published":"Hidden"}</div></div><div><button onclick='editProject(${JSON.stringify(p)})'>Edit</button> <button class="danger" onclick="deleteProject('${p.id}')">Delete</button></div></div>`).join("")||"No projects yet."}
window.editProject=p=>{$("id").value=p.id;$("title").value=p.title;$("category").value=p.category||"Other";$("location").value=p.location||"";$("sort").value=p.sort_order||0;$("description").value=p.description||"";$("published").checked=p.published!==false;editing=p}
$("cancelBtn").onclick=()=>{$("projectForm").reset();$("id").value="";editing=null}
$("projectForm").onsubmit=async e=>{e.preventDefault();$("formMsg").textContent="Saving…";let image_url=editing?.image_url||null;const file=$("image").files[0];if(file){const ext=file.name.split(".").pop().toLowerCase();const path=`${crypto.randomUUID()}.${ext}`;const up=await sb.storage.from("project-images").upload(path,file,{upsert:false});if(up.error){$("formMsg").textContent=up.error.message;return}image_url=sb.storage.from("project-images").getPublicUrl(path).data.publicUrl}
const payload={title:$("title").value.trim(),category:$("category").value,location:$("location").value.trim(),description:$("description").value.trim(),sort_order:Number($("sort").value)||0,published:$("published").checked,image_url};
const q=editing?sb.from("projects").update(payload).eq("id",editing.id):sb.from("projects").insert(payload);const {error}=await q;if(error){$("formMsg").textContent=error.message;return}$("formMsg").textContent="Saved.";$("projectForm").reset();$("id").value="";editing=null;load()}
window.deleteProject=async id=>{if(!confirm("Delete this project?"))return;const {error}=await sb.from("projects").delete().eq("id",id);if(error)alert(error.message);else load()}
function esc(s=""){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
boot();
