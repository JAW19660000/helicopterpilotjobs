(function(){
  var gaScript = document.createElement("script");
  gaScript.async = true;
  gaScript.src = "https://www.googletagmanager.com/gtag/js?id=G-XX2ZMC2GDM";
  document.head.appendChild(gaScript);
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", "G-XX2ZMC2GDM");
})();

(function(){
  var NS = "jaw19660000-helicopterpilotjobs";
  var API = "https://abacus.jasoncameron.dev";

  document.querySelectorAll(".job-card").forEach(function(card){
    var slug = card.id;
    var numEl = card.querySelector(".view-count-num");
    if (!slug || !numEl) return;
    fetch(API + "/get/" + NS + "/" + encodeURIComponent(slug))
      .then(function(r){ return r.json(); })
      .then(function(d){ numEl.textContent = d.value; })
      .catch(function(){ numEl.textContent = "-"; });
  });

  window.jobCounterHit = function(slug, numEl){
    if (!slug) return;
    fetch(API + "/hit/" + NS + "/" + encodeURIComponent(slug))
      .then(function(r){ return r.json(); })
      .then(function(d){ if (numEl) numEl.textContent = d.value; })
      .catch(function(){});
  };
})();

(function(){
  function daysBetween(a, b){
    var msPerDay = 24 * 60 * 60 * 1000;
    var utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    var utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((utcB - utcA) / msPerDay);
  }

  function relativePosted(dateStr){
    var parts = dateStr.split("-");
    var posted = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    var today = new Date();
    var diff = daysBetween(posted, today);
    if (diff <= 0) return { text: "Posted today", isNew: true };
    if (diff === 1) return { text: "Posted yesterday", isNew: true };
    if (diff < 7) return { text: "Posted " + diff + " days ago", isNew: false };
    if (diff < 14) return { text: "Posted 1 week ago", isNew: false };
    if (diff < 30) return { text: "Posted " + Math.floor(diff / 7) + " weeks ago", isNew: false };
    if (diff < 60) return { text: "Posted 1 month ago", isNew: false };
    return { text: "Posted " + Math.floor(diff / 30) + " months ago", isNew: false };
  }

  document.querySelectorAll(".job-meta").forEach(function(meta){
    var match = meta.innerHTML.match(/Posted (\d{4}-\d{2}-\d{2})/);
    if (!match) return;
    var info = relativePosted(match[1]);
    var replacement = info.text;
    if (info.isNew) {
      replacement += ' <span class="badge-new">New</span>';
    }
    meta.innerHTML = meta.innerHTML.replace(match[0], replacement);
  });

  document.querySelectorAll(".job-card[data-closing]").forEach(function(card){
    var closing = card.getAttribute("data-closing");
    if (!closing) return;
    var parts = closing.split("-");
    var closeDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    var today = new Date();
    var diff = daysBetween(today, closeDate);
    if (diff >= 0 && diff <= 7) {
      var meta = card.querySelector(".job-meta");
      if (meta) {
        meta.innerHTML += ' <span class="badge-closing">Closing soon</span>';
      }
    }
  });
})();

(function(){
  var STORAGE_KEY = "hpj_saved_jobs";

  function getSaved(){
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function setSaved(list){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function isSaved(slug){ return getSaved().indexOf(slug) !== -1; }

  function toggleSaved(slug){
    var list = getSaved();
    var idx = list.indexOf(slug);
    if (idx === -1) { list.push(slug); } else { list.splice(idx, 1); }
    setSaved(list);
    return list.indexOf(slug) !== -1;
  }

  function updateAllBadges(){
    var count = getSaved().length;
    document.querySelectorAll(".saved-jobs-badge").forEach(function(b){
      b.textContent = count;
    });
  }

  function buttonLabel(saved){
    return saved ? "★ Saved" : "☆ Save";
  }

  document.querySelectorAll(".job-card").forEach(function(card){
    var slug = card.id;
    if (!slug) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "save-btn" + (isSaved(slug) ? " saved" : "");
    btn.setAttribute("aria-label", "Save this job to view later");
    btn.innerHTML = buttonLabel(isSaved(slug));
    btn.addEventListener("click", function(){
      var nowSaved = toggleSaved(slug);
      btn.className = "save-btn" + (nowSaved ? " saved" : "");
      btn.innerHTML = buttonLabel(nowSaved);
      updateAllBadges();
    });
    card.appendChild(btn);
  });

  var navInner = document.querySelector(".site-nav .nav-inner");
  if (navInner) {
    var link = document.createElement("a");
    link.href = "#saved-jobs";
    link.id = "saved-jobs-nav-link";
    var savedLabel = 'Saved Jobs <span class="saved-jobs-badge">' + getSaved().length + '</span>';
    var allLabel = 'Show All Jobs <span class="saved-jobs-badge">' + getSaved().length + '</span>';
    link.innerHTML = savedLabel;

    link.addEventListener("click", function(e){
      e.preventDefault();
      var showingSaved = document.body.classList.toggle("showing-saved-only");
      var cards = document.querySelectorAll(".job-card");
      var msg = document.getElementById("saved-jobs-empty-msg");

      if (showingSaved) {
        var anySaved = false;
        cards.forEach(function(c){
          if (isSaved(c.id)) { c.style.display = ""; anySaved = true; }
          else { c.style.display = "none"; }
        });
        link.innerHTML = allLabel;
        if (!anySaved) {
          if (!msg) {
            msg = document.createElement("p");
            msg.id = "saved-jobs-empty-msg";
            msg.className = "saved-jobs-empty";
            msg.textContent = "No saved jobs on this page yet. Look for the ☆ Save button on any listing.";
            var grid = document.querySelector(".job-grid");
            if (grid) grid.insertAdjacentElement("beforebegin", msg);
          }
        }
      } else {
        cards.forEach(function(c){ c.style.display = ""; });
        link.innerHTML = savedLabel;
        if (msg) msg.remove();
      }
      updateAllBadges();
    });

    navInner.appendChild(link);
  }
})();

(function(){
  if (document.getElementById("aircraft-nav-link")) return;
  var navInner = document.querySelector(".site-nav .nav-inner");
  if (!navInner) return;
  var path = window.location.pathname.replace(/^\/helicopterpilotjobs\//, "");
  var depth = (path.match(/\//g) || []).length;
  var prefix = "../".repeat(depth);
  var link = document.createElement("a");
  link.id = "aircraft-nav-link";
  link.href = prefix + "aircraft/index.html";
  link.textContent = "Browse by Aircraft";
  var locLink = null;
  navInner.querySelectorAll("a").forEach(function(a){
    if (a.textContent.trim() === "Browse by Location") locLink = a;
  });
  if (locLink) {
    locLink.insertAdjacentElement("afterend", link);
  } else {
    navInner.appendChild(link);
  }
})();
