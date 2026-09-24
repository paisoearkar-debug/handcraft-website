(function(){
  "use strict";
  const SUPABASE_URL="https://jvaqtuiyswjybasfumjw.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY="sb_publishable_GteenSO57Kw0uv1qm6YUiw_-uZ7Uwe0";
  const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
  const $=id=>document.getElementById(id);
  document.addEventListener("DOMContentLoaded",init);

  async function init(){
    await loadInsights();
    await syncSocialLinks();
    installStyles();
  }

  async function loadInsights(){
    const grid=$("insights-grid"); if(!grid) return;
    const {data,error}=await client.from("insights")
      .select("id,title,slug,category,excerpt,content,cover_image_url,seo_title,seo_description,tags,published,published_at,created_at")
      .eq("published",true)
      .order("published_at",{ascending:false,nullsFirst:false})
      .order("created_at",{ascending:false});
    if(error){ console.error(error); grid.innerHTML='<div class="insights-empty">Insights will be available soon.</div>'; return; }
    const articles=data||[];
    if(!articles.length){ grid.innerHTML='<div class="insights-empty">Our latest design insights and ideas will appear here soon.</div>'; return; }
    grid.innerHTML=articles.map(articleCard).join("");
    grid.querySelectorAll(".insight-card").forEach(card=>{
      const article=articles.find(x=>String(x.id)===String(card.dataset.id));
      card.addEventListener("click",()=>article&&openArticle(article));
      card.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();article&&openArticle(article);}});
    });
  }

  function articleCard(a){
    const image=a.cover_image_url?`<div class="insight-card-image"><img src="${esc(a.cover_image_url)}" alt="${esc(a.title)}" loading="lazy"></div>`:`<div class="insight-card-image insight-card-image-placeholder"><span>HANDCRAFT<br>INSIGHTS</span></div>`;
    return `<article class="insight-card" data-id="${esc(a.id)}" tabindex="0" role="button" aria-label="Read ${esc(a.title)}">${image}<div class="insight-card-body"><div class="insight-meta"><span>${esc(a.category||"Insights")}</span><span>${esc(date(a.published_at||a.created_at))}</span></div><h3>${esc(a.title)}</h3><p>${esc(a.excerpt||"Discover practical ideas and design knowledge from Handcraft Myanmar.")}</p><span class="insight-read">Read article <span>→</span></span></div></article>`;
  }

  function openArticle(a){
    closeArticle();
    const m=document.createElement("div"); m.id="handcraft-insight-modal"; m.className="handcraft-insight-modal";
    const image=a.cover_image_url?`<img class="insight-modal-cover" src="${esc(a.cover_image_url)}" alt="${esc(a.title)}">`:"";
    m.innerHTML=`<div class="insight-modal-backdrop"></div><div class="insight-modal-dialog" role="dialog" aria-modal="true"><button class="insight-modal-close" type="button" aria-label="Close article">×</button>${image}<div class="insight-modal-inner"><div class="insight-modal-meta">${esc(a.category||"Insights")} · ${esc(date(a.published_at||a.created_at))}</div><h2>${esc(a.title)}</h2>${a.excerpt?`<p class="insight-modal-excerpt">${esc(a.excerpt)}</p>`:""}<div class="insight-modal-content">${articleContent(a.content||"")}</div></div></div>`;
    document.body.appendChild(m); document.body.style.overflow="hidden";
    m.querySelector(".insight-modal-close").addEventListener("click",closeArticle);
    m.querySelector(".insight-modal-backdrop").addEventListener("click",closeArticle);
    document.addEventListener("keydown",keyClose);
  }
  function closeArticle(){const m=$("handcraft-insight-modal");if(m)m.remove();document.body.style.overflow="";document.removeEventListener("keydown",keyClose);}
  function keyClose(e){if(e.key==="Escape")closeArticle();}
  function articleContent(s){return esc(s).split(/\n{2,}/).map(p=>`<p>${p.replace(/\n/g,"<br>")}</p>`).join("");}

  async function syncSocialLinks(){
    const {data}=await client.from("site_settings").select("facebook_url,instagram_url,tiktok_url,youtube_url,pinterest_url").eq("id",1).maybeSingle();
    if(!data)return;
    ["facebook_url","instagram_url","tiktok_url","youtube_url","pinterest_url"].forEach(key=>{
      const link=document.querySelector(`a[data-setting="${key}"]`); if(!link)return;
      const v=String(data[key]||"").trim(); link.style.display=v?"inline-flex":"none"; if(v)link.href=v;
    });
  }
  function date(v){const d=new Date(v); if(!v||Number.isNaN(d.getTime()))return ""; return d.toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"});}
  function esc(v){return String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
  function installStyles(){
    if($("handcraft-insight-styles"))return;
    const s=document.createElement("style"); s.id="handcraft-insight-styles"; s.textContent=`
      .insights-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;margin-top:34px}
      .insight-card{background:#fff;border:1px solid rgba(0,0,0,.09);overflow:hidden;cursor:pointer;transition:transform .3s ease,box-shadow .3s ease,border-color .3s ease;outline:none}
      .insight-card:hover,.insight-card:focus{transform:translateY(-5px);box-shadow:0 18px 45px rgba(0,0,0,.09);border-color:rgba(177,138,82,.35)}
      .insight-card-image{aspect-ratio:16/10;overflow:hidden;background:#e8e5df}.insight-card-image img{width:100%;height:100%;display:block;object-fit:cover;transition:transform .65s ease}.insight-card:hover .insight-card-image img,.insight-card:focus .insight-card-image img{transform:scale(1.04)}
      .insight-card-image-placeholder{display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#242424,#505050);color:#fff;letter-spacing:.16em;font-size:11px;line-height:1.7;text-align:center}
      .insight-card-body{padding:24px 24px 26px}.insight-meta{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px;font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#9a9a9a}.insight-card h3{margin:0 0 12px;font-size:21px;line-height:1.25;color:#171717}.insight-card p{margin:0 0 19px;color:#666;line-height:1.75;font-size:14px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.insight-read{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:#b18a52}.insight-read span{margin-left:7px;font-size:14px}.insights-empty{padding:42px 20px;border:1px dashed #d4d0c9;color:#777;text-align:center;grid-column:1/-1}
      .handcraft-insight-modal{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px}.insight-modal-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.78);backdrop-filter:blur(6px)}.insight-modal-dialog{position:relative;z-index:2;width:min(980px,96vw);max-height:92vh;overflow:auto;background:#fff;box-shadow:0 30px 100px rgba(0,0,0,.28)}.insight-modal-cover{width:100%;aspect-ratio:16/7;object-fit:cover;display:block}.insight-modal-inner{padding:42px 50px 55px}.insight-modal-meta{font-size:10px;text-transform:uppercase;letter-spacing:.15em;color:#a17d4a;margin-bottom:12px}.insight-modal-inner h2{margin:0 0 18px;font-size:38px;line-height:1.15;color:#171717}.insight-modal-excerpt{font-size:16px;line-height:1.8;color:#666;margin:0 0 28px;padding-bottom:25px;border-bottom:1px solid #ececec}.insight-modal-content{font-size:15px;line-height:1.95;color:#333}.insight-modal-content p{margin:0 0 20px}.insight-modal-close{position:absolute;right:17px;top:17px;z-index:4;width:43px;height:43px;border:0;border-radius:50%;background:rgba(0,0,0,.62);color:#fff;font-size:28px;line-height:1;cursor:pointer}
      @media(max-width:900px){.insights-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.insight-modal-inner{padding:32px 28px 40px}.insight-modal-inner h2{font-size:31px}}@media(max-width:640px){.insights-grid{grid-template-columns:1fr}.insight-card-body{padding:20px}.insight-modal-dialog{width:100%;max-height:94vh}.insight-modal-inner{padding:28px 20px 35px}.insight-modal-inner h2{font-size:27px}.insight-modal-cover{aspect-ratio:16/9}}
    `; document.head.appendChild(s);
  }
})();
