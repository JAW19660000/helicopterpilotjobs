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
