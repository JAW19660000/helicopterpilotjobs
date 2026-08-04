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
