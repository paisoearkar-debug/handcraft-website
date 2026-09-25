(function(){
  "use strict";

  const SUPABASE_URL =
    "https://jvaqtuiyswjybasfumjw.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_GteenSO57Kw0uv1qm6YUiw_-uZ7Uwe0";

  const client =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );

  const $ =
    id => document.getElementById(id);

  document.addEventListener(
    "DOMContentLoaded",
    init
  );


  /* =========================================================
     INIT
  ========================================================= */

  async function init(){
    const articleRoot = $("articleContent");

    if(articleRoot){
      await loadStandaloneArticle(articleRoot);
      await syncSocialLinks();
      installStyles();
      return;
    }

    await loadInsights();
    await syncSocialLinks();
    installStyles();
  }


  /* =========================================================
     STANDALONE ARTICLE PAGE
  ========================================================= */

  async function loadStandaloneArticle(root){

    const params =
      new URLSearchParams(
        window.location.search
      );

    const slug =
      params.get("slug") ||
      params.get("insight");

    const titleEl =
      $("articleTitle");

    const metaEl =
      $("articleMeta");

    if(!slug){

      if(titleEl)
        titleEl.textContent =
          "Insight not found";

      root.innerHTML =
        '<div class="article-error">No insight was specified.<br><br><a href="insights.html">← Back to Insights</a></div>';

      return;
    }

    try{

      const {
        data: article,
        error
      } =
        await client
          .from("insights")
          .select(
            "id,title,slug,category,excerpt,content,cover_image_url,seo_title,seo_description,tags,published,published_at,created_at"
          )
          .eq(
            "slug",
            slug
          )
          .eq(
            "published",
            true
          )
          .maybeSingle();

      if(error)
        throw error;

      if(!article){

        if(titleEl)
          titleEl.textContent =
            "Insight not found";

        root.innerHTML =
          '<div class="article-error">This insight is unavailable.<br><br><a href="insights.html">← Back to Insights</a></div>';

        return;
      }

      if(titleEl)
        titleEl.textContent =
          article.title ||
          "Insight";

      if(metaEl)
        metaEl.textContent =
          [
            article.category ||
              "Insights",
            date(
              article.published_at ||
              article.created_at
            )
          ]
          .filter(Boolean)
          .join(" • ");

      if(article.seo_description){

        let meta =
          document.querySelector(
            'meta[name="description"]'
          );

        if(!meta){

          meta =
            document.createElement(
              "meta"
            );

          meta.name =
            "description";

          document.head.appendChild(
            meta
          );

        }

        meta.content =
          article.seo_description;
      }

      document.title =
        `${
          article.seo_title ||
          article.title ||
          "Insight"
        } | Handcraft Myanmar`;

      root.innerHTML = `
        ${
          article.cover_image_url
            ? `
              <img
                class="article-cover"
                src="${esc(article.cover_image_url)}"
                alt="${esc(article.title)}"
              >
            `
            : ""
        }

        <div class="article-body">

          ${
            article.excerpt
              ? `
                <p class="article-lead">
                  ${esc(article.excerpt)}
                </p>
              `
              : ""
          }

          ${articleContent(article.content || "")}

        </div>

        <div class="article-actions">

          <a href="insights.html">
            ← Back to Insights
          </a>

          <button
            type="button"
            id="standaloneShareBtn"
          >
            Share
          </button>

          <button
            type="button"
            id="standaloneCopyBtn"
          >
            Copy Link
          </button>

        </div>
      `;

      const shareBtn =
        $("standaloneShareBtn");

      const copyBtn =
        $("standaloneCopyBtn");

      if(shareBtn){

        shareBtn.addEventListener(
          "click",
          async () => {

            if(navigator.share){

              try{

                await navigator.share({
                  title:
                    article.title,
                  text:
                    article.excerpt ||
                    "Handcraft Myanmar Insights",
                  url:
                    window.location.href
                });

              }catch(error){

                if(
                  error &&
                  error.name !==
                    "AbortError"
                ){
                  await copyStandaloneLink(
                    copyBtn
                  );
                }

              }

            }else{

              await copyStandaloneLink(
                copyBtn
              );

            }

          }
        );

      }

      if(copyBtn){

        copyBtn.addEventListener(
          "click",
          () =>
            copyStandaloneLink(
              copyBtn
            )
        );

      }

    }catch(error){

      console.error(error);

      if(titleEl)
        titleEl.textContent =
          "Unable to load insight";

      root.innerHTML =
        `<div class="article-error">${
          esc(
            error.message ||
            "Unable to load this insight."
          )
        }<br><br><a href="insights.html">← Back to Insights</a></div>`;
    }

  }


  async function copyStandaloneLink(
    button
  ){

    try{

      await navigator.clipboard.writeText(
        window.location.href
      );

      if(button){

        const original =
          button.textContent;

        button.textContent =
          "Copied";

        setTimeout(
          () =>
            button.textContent =
              original,
          1600
        );

      }

    }catch(error){

      window.prompt(
        "Copy this link:",
        window.location.href
      );

    }

  }


  /* =========================================================
     LOAD INSIGHTS
  ========================================================= */

  async function loadInsights(){

    const grid =
      $("insights-grid");

    if(!grid) return;

    const {
      data,
      error
    } =
      await client
        .from("insights")
        .select(
          "id,title,slug,category,excerpt,content,cover_image_url,seo_title,seo_description,tags,published,published_at,created_at"
        )
        .eq(
          "published",
          true
        )
        .order(
          "published_at",
          {
            ascending:false,
            nullsFirst:false
          }
        )
        .order(
          "created_at",
          {
            ascending:false
          }
        );

    if(error){

      console.error(error);

      grid.innerHTML =
        '<div class="insights-empty">Insights will be available soon.</div>';

      return;
    }

    const articles =
      data || [];

    if(!articles.length){

      grid.innerHTML =
        '<div class="insights-empty">Our latest design insights and ideas will appear here soon.</div>';

      return;
    }

    grid.innerHTML =
      articles
        .map(articleCard)
        .join("");


    /*
      Make every article card clickable.
    */

    grid
      .querySelectorAll(
        ".insight-card"
      )
      .forEach(card => {

        const article =
          articles.find(
            item =>
              String(item.id) ===
              String(card.dataset.id)
          );

        card.addEventListener(
          "click",
          () => {

            if(article)
              window.location.href =
                "insight.html?slug=" +
                encodeURIComponent(article.slug || article.id);

          }
        );

        card.addEventListener(
          "keydown",
          event => {

            if(
              event.key === "Enter" ||
              event.key === " "
            ){

              event.preventDefault();

              if(article)
                window.location.href =
                  "insight.html?slug=" +
                  encodeURIComponent(article.slug || article.id);

            }

          }
        );

      });


    /*
      IMPORTANT:
      If the URL contains ?insight=SLUG,
      automatically open that article.
    */

    const requestedSlug =
      new URLSearchParams(
        window.location.search
      ).get("insight");

    if(requestedSlug){

      const requestedArticle =
        articles.find(
          article =>
            String(article.slug || "") ===
            String(requestedSlug)
        );

      if(requestedArticle){

        setTimeout(
          () =>
            openArticle(
              requestedArticle,
              true
            ),
          100
        );

      }

    }

  }


  /* =========================================================
     ARTICLE CARD
  ========================================================= */

  function articleCard(a){

    const image =
      a.cover_image_url

        ? `
          <div class="insight-card-image">

            <img
              src="${esc(a.cover_image_url)}"
              alt="${esc(a.title)}"
              loading="lazy"
            >

          </div>
        `

        : `
          <div class="insight-card-image insight-card-image-placeholder">

            <span>
              HANDCRAFT<br>
              INSIGHTS
            </span>

          </div>
        `;


    return `
      <article
        class="insight-card"
        data-id="${esc(a.id)}"
        tabindex="0"
        role="button"
        aria-label="Read ${esc(a.title)}"
      >

        ${image}

        <div class="insight-card-body">

          <div class="insight-meta">

            <span>
              ${esc(
                a.category ||
                "Insights"
              )}
            </span>

            <span>
              ${esc(
                date(
                  a.published_at ||
                  a.created_at
                )
              )}
            </span>

          </div>


          <h3>
            ${esc(a.title)}
          </h3>


          <p>
            ${esc(
              a.excerpt ||
              "Discover practical ideas and design knowledge from Handcraft Myanmar."
            )}
          </p>


          <span class="insight-read">

            Read article

            <span>
              →
            </span>

          </span>

        </div>

      </article>
    `;

  }


  /* =========================================================
     OPEN ARTICLE
  ========================================================= */

  function openArticle(
    a,
    fromSharedUrl = false
  ){

    closeArticle(
      true
    );


    /*
      Create the unique URL for this article.
    */

    const articleUrl =
      getArticleUrl(a);


    /*
      Change browser URL.

      This makes the article shareable.
    */

    if(!fromSharedUrl){

      window.history.pushState(
        {
          insight:
            a.slug
        },
        "",
        articleUrl
      );

    }


    const m =
      document.createElement(
        "div"
      );


    m.id =
      "handcraft-insight-modal";


    m.className =
      "handcraft-insight-modal";


    const image =
      a.cover_image_url

        ? `
          <img
            class="insight-modal-cover"
            src="${esc(
              a.cover_image_url
            )}"
            alt="${esc(
              a.title
            )}"
          >
        `

        : "";


    m.innerHTML = `

      <div
        class="insight-modal-backdrop"
      ></div>


      <div
        class="insight-modal-dialog"
        role="dialog"
        aria-modal="true"
      >

        <button
          class="insight-modal-close"
          type="button"
          aria-label="Close article"
        >
          ×
        </button>


        ${image}


        <div
          class="insight-modal-inner"
        >

          <div
            class="insight-modal-meta"
          >

            ${esc(
              a.category ||
              "Insights"
            )}

            ·

            ${esc(
              date(
                a.published_at ||
                a.created_at
              )
            )}

          </div>


          <h2>
            ${esc(a.title)}
          </h2>


          ${
            a.excerpt
              ? `
                <p
                  class="insight-modal-excerpt"
                >
                  ${esc(
                    a.excerpt
                  )}
                </p>
              `
              : ""
          }


          <!-- SHARE BAR -->

          <div
            class="insight-share"
          >

            <div
              class="insight-share-title"
            >
              Share this insight
            </div>


            <div
              class="insight-share-buttons"
            >

              <button
                type="button"
                class="insight-share-btn insight-facebook"
              >
                Facebook
              </button>


              <button
                type="button"
                class="insight-share-btn insight-copy"
              >
                Copy Link
              </button>


              <button
                type="button"
                class="insight-share-btn insight-native"
              >
                Share
              </button>

            </div>


            <div
              class="insight-share-status"
              aria-live="polite"
            ></div>

          </div>


          <div
            class="insight-modal-content"
          >

            ${articleContent(
              a.content ||
              ""
            )}

          </div>

        </div>

      </div>

    `;


    document.body.appendChild(
      m
    );


    document.body.style.overflow =
      "hidden";


    /*
      CLOSE
    */

    m
      .querySelector(
        ".insight-modal-close"
      )
      .addEventListener(
        "click",
        closeArticle
      );


    /*
      BACKGROUND
    */

    m
      .querySelector(
        ".insight-modal-backdrop"
      )
      .addEventListener(
        "click",
        closeArticle
      );


    /*
      FACEBOOK
    */

    m
      .querySelector(
        ".insight-facebook"
      )
      .addEventListener(
        "click",
        () =>
          shareFacebook(
            articleUrl
          )
      );


    /*
      COPY LINK
    */

    m
      .querySelector(
        ".insight-copy"
      )
      .addEventListener(
        "click",
        () =>
          copyArticleLink(
            articleUrl,
            m
          )
      );


    /*
      NATIVE SHARE
    */

    m
      .querySelector(
        ".insight-native"
      )
      .addEventListener(
        "click",
        () =>
          shareNative(
            a,
            articleUrl,
            m
          )
      );


    document.addEventListener(
      "keydown",
      keyClose
    );

  }


  /* =========================================================
     CLOSE ARTICLE
  ========================================================= */

  function closeArticle(
    keepUrl = false
  ){

    const m =
      $("handcraft-insight-modal");


    if(m)
      m.remove();


    document.body.style.overflow =
      "";


    document.removeEventListener(
      "keydown",
      keyClose
    );


    /*
      If closing normally,
      remove ?insight=... from URL.
    */

    if(!keepUrl){

      const url =
        new URL(
          window.location.href
        );


      if(
        url.searchParams.has(
          "insight"
        )
      ){

        url.searchParams.delete(
          "insight"
        );


        window.history.replaceState(
          {},
          "",
          url.pathname +
          url.search +
          url.hash
        );

      }

    }

  }


  /* =========================================================
     ESC KEY
  ========================================================= */

  function keyClose(event){

    if(
      event.key === "Escape"
    ){

      closeArticle();

    }

  }


  /* =========================================================
     ARTICLE URL
  ========================================================= */

  function getArticleUrl(a){

    const url =
      new URL(
        window.location.href
      );


    /*
      Remove any previous article parameter.
    */

    url.searchParams.delete("insight");
    url.searchParams.delete("slug");


    /*
      Add this article's slug.
    */

    url.pathname =
      url.pathname.replace(
        /\/insights\.html$/i,
        "/insight.html"
      );

    url.searchParams.set(
      "slug",
      String(
        a.slug ||
        a.id
      )
    );


    /*
      Remove hash.
    */

    url.hash =
      "";


    return url.toString();

  }


  /* =========================================================
     FACEBOOK SHARE
  ========================================================= */

  function shareFacebook(
    url
  ){

    const shareUrl =
      "https://www.facebook.com/sharer/sharer.php?u=" +
      encodeURIComponent(
        url
      );


    window.open(
      shareUrl,
      "_blank",
      "noopener,noreferrer,width=760,height=650"
    );

  }


  /* =========================================================
     COPY LINK
  ========================================================= */

  async function copyArticleLink(
    url,
    modal
  ){

    const status =
      modal.querySelector(
        ".insight-share-status"
      );


    try{

      await navigator.clipboard.writeText(
        url
      );


      if(status){

        status.textContent =
          "Link copied!";

      }

    }catch(error){

      /*
        Older browser fallback.
      */

      const input =
        document.createElement(
          "input"
        );


      input.value =
        url;


      document.body.appendChild(
        input
      );


      input.select();


      document.execCommand(
        "copy"
      );


      input.remove();


      if(status){

        status.textContent =
          "Link copied!";

      }

    }


    setTimeout(
      () => {

        if(status)
          status.textContent =
            "";

      },
      2500
    );

  }


  /* =========================================================
     NATIVE SHARE
  ========================================================= */

  async function shareNative(
    article,
    url,
    modal
  ){

    const status =
      modal.querySelector(
        ".insight-share-status"
      );


    /*
      iPhone / Android
    */

    if(
      navigator.share
    ){

      try{

        await navigator.share({

          title:
            article.title,

          text:
            article.excerpt ||
            "Handcraft Myanmar Insights",

          url:
            url

        });


        return;

      }catch(error){

        /*
          User cancelled sharing.
        */

        if(
          error &&
          error.name ===
            "AbortError"
        ){

          return;

        }

      }

    }


    /*
      Desktop / unsupported browser:
      copy link instead.
    */

    await copyArticleLink(
      url,
      modal
    );

  }


  /* =========================================================
     ARTICLE CONTENT
  ========================================================= */

  function articleContent(
    s
  ){

    return esc(
      s
    )
      .split(
        /\n{2,}/
      )
      .map(
        p =>
          `<p>${p.replace(
            /\n/g,
            "<br>"
          )}</p>`
      )
      .join("");

  }


  /* =========================================================
     SOCIAL LINKS
  ========================================================= */

  async function syncSocialLinks(){

    const {
      data
    } =
      await client
        .from("site_settings")
        .select(
          "facebook_url,instagram_url,tiktok_url,youtube_url,pinterest_url"
        )
        .eq(
          "id",
          1
        )
        .maybeSingle();


    if(!data)
      return;


    [
      "facebook_url",
      "instagram_url",
      "tiktok_url",
      "youtube_url",
      "pinterest_url"
    ]
      .forEach(
        key => {

          const link =
            document.querySelector(
              `a[data-setting="${key}"]`
            );


          if(!link)
            return;


          const v =
            String(
              data[key] ||
              ""
            ).trim();


          link.style.display =
            v
              ? "inline-flex"
              : "none";


          if(v)
            link.href =
              v;

        }
      );

  }


  /* =========================================================
     DATE
  ========================================================= */

  function date(
    v
  ){

    const d =
      new Date(v);


    if(
      !v ||
      Number.isNaN(
        d.getTime()
      )
    )
      return "";


    return d.toLocaleDateString(
      "en-US",
      {
        year:"numeric",
        month:"short",
        day:"numeric"
      }
    );

  }


  /* =========================================================
     ESCAPE
  ========================================================= */

  function esc(
    v
  ){

    return String(
      v ?? ""
    )
      .replace(
        /[&<>\"']/g,
        c =>
          ({
            "&":
              "&amp;",
            "<":
              "&lt;",
            ">":
              "&gt;",
            '"':
              "&quot;",
            "'":
              "&#039;"
          }[c])
      );

  }


  /* =========================================================
     STYLES
  ========================================================= */

  function installStyles(){

    if(
      $("handcraft-insight-styles")
    )
      return;


    const s =
      document.createElement(
        "style"
      );


    s.id =
      "handcraft-insight-styles";


    s.textContent = `

      .insights-grid{
        display:grid;
        grid-template-columns:
          repeat(
            3,
            minmax(0,1fr)
          );
        gap:24px;
        margin-top:34px;
      }


      .insight-card{
        background:#fff;
        border:
          1px solid
          rgba(0,0,0,.09);
        overflow:hidden;
        cursor:pointer;
        transition:
          transform .3s ease,
          box-shadow .3s ease,
          border-color .3s ease;
        outline:none;
      }


      .insight-card:hover,
      .insight-card:focus{
        transform:
          translateY(-5px);
        box-shadow:
          0 18px 45px
          rgba(0,0,0,.09);
        border-color:
          rgba(177,138,82,.35);
      }


      .insight-card-image{
        aspect-ratio:16/10;
        overflow:hidden;
        background:#e8e5df;
      }


      .insight-card-image img{
        width:100%;
        height:100%;
        display:block;
        object-fit:cover;
        transition:
          transform .65s ease;
      }


      .insight-card:hover
      .insight-card-image img,
      .insight-card:focus
      .insight-card-image img{
        transform:
          scale(1.04);
      }


      .insight-card-image-placeholder{
        display:flex;
        align-items:center;
        justify-content:center;
        background:
          linear-gradient(
            135deg,
            #242424,
            #505050
          );
        color:#fff;
        letter-spacing:.16em;
        font-size:11px;
        line-height:1.7;
        text-align:center;
      }


      .insight-card-body{
        padding:
          24px
          24px
          26px;
      }


      .insight-meta{
        display:flex;
        justify-content:space-between;
        gap:12px;
        margin-bottom:12px;
        font-size:10px;
        text-transform:uppercase;
        letter-spacing:.12em;
        color:#9a9a9a;
      }


      .insight-card h3{
        margin:
          0 0 12px;
        font-size:21px;
        line-height:1.25;
        color:#171717;
      }


      .insight-card p{
        margin:
          0 0 19px;
        color:#666;
        line-height:1.75;
        font-size:14px;
        display:-webkit-box;
        -webkit-line-clamp:3;
        -webkit-box-orient:vertical;
        overflow:hidden;
      }


      .insight-read{
        font-size:11px;
        font-weight:800;
        text-transform:uppercase;
        letter-spacing:.12em;
        color:#b18a52;
      }


      .insight-read span{
        margin-left:7px;
        font-size:14px;
      }


      .insights-empty{
        padding:
          42px 20px;
        border:
          1px dashed
          #d4d0c9;
        color:#777;
        text-align:center;
        grid-column:
          1/-1;
      }


      /* =====================================================
         MODAL
      ===================================================== */

      .handcraft-insight-modal{
        position:fixed;
        inset:0;
        z-index:10000;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
      }


      .insight-modal-backdrop{
        position:absolute;
        inset:0;
        background:
          rgba(0,0,0,.78);
        backdrop-filter:
          blur(6px);
      }


      .insight-modal-dialog{
        position:relative;
        z-index:2;
        width:
          min(
            980px,
            96vw
          );
        max-height:92vh;
        overflow:auto;
        background:#fff;
        box-shadow:
          0 30px 100px
          rgba(0,0,0,.28);
      }


      .insight-modal-cover{
        width:100%;
        aspect-ratio:16/7;
        object-fit:cover;
        display:block;
      }


      .insight-modal-inner{
        padding:
          42px
          50px
          55px;
      }


      .insight-modal-meta{
        font-size:10px;
        text-transform:uppercase;
        letter-spacing:.15em;
        color:#a17d4a;
        margin-bottom:12px;
      }


      .insight-modal-inner h2{
        margin:
          0 0 18px;
        font-size:38px;
        line-height:1.15;
        color:#171717;
      }


      .insight-modal-excerpt{
        font-size:16px;
        line-height:1.8;
        color:#666;
        margin:
          0 0 28px;
        padding-bottom:25px;
        border-bottom:
          1px solid
          #ececec;
      }


      /* =====================================================
         SHARE
      ===================================================== */

      .insight-share{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:16px;
        flex-wrap:wrap;

        margin:
          0 0 30px;

        padding:
          18px 0;

        border-top:
          1px solid
          #ececec;

        border-bottom:
          1px solid
          #ececec;
      }


      .insight-share-title{
        font-size:10px;
        text-transform:uppercase;
        letter-spacing:.14em;
        font-weight:800;
        color:#777;
      }


      .insight-share-buttons{
        display:flex;
        gap:8px;
        flex-wrap:wrap;
      }


      .insight-share-btn{
        border:
          1px solid
          #d5d5d5;

        background:#fff;

        color:#333;

        padding:
          10px 15px;

        border-radius:4px;

        font-size:10px;

        font-weight:800;

        text-transform:uppercase;

        letter-spacing:.08em;

        cursor:pointer;

        transition:
          all .2s ease;
      }


      .insight-share-btn:hover{
        background:#171717;
        color:#fff;
        border-color:#171717;
      }


      .insight-facebook{
        background:#1877f2;
        color:#fff;
        border-color:#1877f2;
      }


      .insight-facebook:hover{
        background:#0d65d9;
        border-color:#0d65d9;
      }


      .insight-share-status{
        width:100%;
        min-height:16px;
        font-size:11px;
        color:#a17d4a;
      }


      .insight-modal-content{
        font-size:15px;
        line-height:1.95;
        color:#333;
      }


      .insight-modal-content p{
        margin:
          0 0 20px;
      }


      .insight-modal-close{
        position:absolute;
        right:17px;
        top:17px;
        z-index:4;
        width:43px;
        height:43px;
        border:0;
        border-radius:50%;
        background:
          rgba(0,0,0,.62);
        color:#fff;
        font-size:28px;
        line-height:1;
        cursor:pointer;
      }


      /* =====================================================
         STANDALONE ARTICLE PAGE
      ===================================================== */

      .article-body{
        font-size:16px;
        line-height:1.9;
        color:#333;
      }

      .article-lead{
        font-size:18px;
        line-height:1.8;
        color:#666;
        margin:0 0 30px;
        padding-bottom:28px;
        border-bottom:1px solid #ececec;
      }

      .article-body p{
        margin:0 0 20px;
      }

      .article-body h2,
      .article-body h3{
        color:#171717;
        line-height:1.25;
        margin:38px 0 14px;
      }

      .article-body img{
        max-width:100%;
        height:auto;
        display:block;
        margin:28px auto;
      }

      .article-cover{
        width:100%;
        max-height:560px;
        object-fit:cover;
        display:block;
        margin:0 0 42px;
      }

      .article-actions{
        display:flex;
        gap:10px;
        flex-wrap:wrap;
        margin-top:40px;
        padding-top:24px;
        border-top:1px solid #ececec;
      }

      .article-actions a,
      .article-actions button{
        border:1px solid #d5d5d5;
        background:#fff;
        color:#333;
        padding:10px 15px;
        border-radius:4px;
        font-size:10px;
        font-weight:800;
        text-transform:uppercase;
        letter-spacing:.08em;
        text-decoration:none;
        cursor:pointer;
      }

      .article-actions a:hover,
      .article-actions button:hover{
        background:#171717;
        color:#fff;
        border-color:#171717;
      }

      .article-error{
        padding:60px 20px;
        text-align:center;
        color:#777;
      }

      /* =====================================================
         TABLET
      ===================================================== */

      @media(max-width:900px){

        .insights-grid{
          grid-template-columns:
            repeat(
              2,
              minmax(0,1fr)
            );
        }


        .insight-modal-inner{
          padding:
            32px
            28px
            40px;
        }


        .insight-modal-inner h2{
          font-size:31px;
        }

      }


      /* =====================================================
         MOBILE
      ===================================================== */

      @media(max-width:640px){

        .insights-grid{
          grid-template-columns:1fr;
        }


        .insight-card-body{
          padding:20px;
        }


        .insight-modal-dialog{
          width:100%;
          max-height:94vh;
        }


        .insight-modal-inner{
          padding:
            28px
            20px
            35px;
        }


        .insight-modal-inner h2{
          font-size:27px;
        }


        .insight-modal-cover{
          aspect-ratio:16/9;
        }


        .insight-share{
          flex-direction:column;
          align-items:flex-start;
        }


        .insight-share-buttons{
          width:100%;
        }


        .insight-share-btn{
          flex:1;
        }

      }

    `;


    document.head.appendChild(
      s
    );

  }

})();
