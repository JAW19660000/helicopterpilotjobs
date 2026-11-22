(function(){
  var el = document.getElementById("weather-content");
  if (!el) return;

  var DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var KEY_LOC = "hpj_wx_loc", KEY_WX = "hpj_wx_data";
  var LOC_TTL = 24*3600*1000, WX_TTL = 30*60*1000;
  var shown = false, busy = false;

  function store(k, v){ try { localStorage.setItem(k, JSON.stringify({t: Date.now(), v: v})); } catch(e){} }
  function load(k){ try { var o = JSON.parse(localStorage.getItem(k)); return o && o.t ? o : null; } catch(e){ return null; } }

  function weatherIcon(code){
    if (code === 0) return "☀️";
    if (code === 1 || code === 2) return "⛅";
    if (code === 3) return "☁️";
    if (code === 45 || code === 48) return "🌫️";
    if ([51,53,55,56,57,80,81,82].indexOf(code) !== -1) return "🌦️";
    if ([61,63,65,66,67].indexOf(code) !== -1) return "🌧️";
    if ([71,73,75,77,85,86].indexOf(code) !== -1) return "❄️";
    if ([95,96,99].indexOf(code) !== -1) return "⛈️";
    return "🌡️";
  }

  function render(place, daily){
    var days = daily.time, codes = daily.weathercode,
        max = daily.temperature_2m_max, min = daily.temperature_2m_min,
        rain = daily.precipitation_probability_max;
    var rows = "";
    for (var i = 0; i < days.length; i++){
      var d = new Date(days[i] + "T00:00:00");
      var label = i === 0 ? "Today" : (i === 1 ? "Tomorrow" : DAY_NAMES[d.getDay()]);
      var rainTxt = (rain && rain[i] != null) ? rain[i] + "% rain" : "";
      rows += '<div class="weather-day-row">' +
        '<span class="weather-day-label">' + label + '</span>' +
        '<span class="weather-day-icon">' + weatherIcon(codes[i]) + '</span>' +
        '<span class="weather-day-temp">' + Math.round(min[i]) + '&deg; / ' + Math.round(max[i]) + '&deg;</span>' +
        '<span class="weather-day-rain">' + rainTxt + '</span>' +
      '</div>';
    }
    el.className = "";
    el.innerHTML = '<p class="weather-location">' + place + '</p>' + rows +
      '<p class="weather-source">Forecast: Open-Meteo</p>';
    shown = true;
  }

  function getJSON(url, ms){
    return new Promise(function(resolve, reject){
      var done = false;
      var t = setTimeout(function(){ if (!done){ done = true; reject(new Error("timeout")); } }, ms || 8000);
      fetch(url, {cache: "no-store"}).then(function(r){
        if (!r.ok) throw new Error("http " + r.status);
        return r.json();
      }).then(function(j){
        if (!done){ done = true; clearTimeout(t); resolve(j); }
      }).catch(function(e){
        if (!done){ done = true; clearTimeout(t); reject(e); }
      });
    });
  }

  // Several free IP-location services; the first that answers wins.
  var GEO = [
    function(){ return getJSON("https://get.geojs.io/v1/ip/geo.json").then(function(g){
      return {lat: parseFloat(g.latitude), lon: parseFloat(g.longitude), place: [g.city, g.region].filter(Boolean).join(", ") || g.country || "Your location"}; }); },
    function(){ return getJSON("https://ipwho.is/").then(function(g){
      if (g.success === false) throw new Error("ipwho");
      return {lat: g.latitude, lon: g.longitude, place: [g.city, g.region].filter(Boolean).join(", ") || g.country || "Your location"}; }); },
    function(){ return getJSON("https://ipapi.co/json/").then(function(g){
      if (g.error) throw new Error("ipapi");
      return {lat: g.latitude, lon: g.longitude, place: [g.city, g.region].filter(Boolean).join(", ") || g.country_name || "Your location"}; }); }
  ];

  function locate(){
    var c = load(KEY_LOC);
    if (c && Date.now() - c.t < LOC_TTL && c.v && isFinite(c.v.lat)) return Promise.resolve(c.v);
    var i = 0;
    function next(){
      if (i >= GEO.length) return Promise.reject(new Error("no geo"));
      return GEO[i++]().then(function(p){
        if (!isFinite(p.lat) || !isFinite(p.lon)) throw new Error("bad geo");
        store(KEY_LOC, p); return p;
      }).catch(next);
    }
    return next();
  }

  function forecast(p){
    return getJSON("https://api.open-meteo.com/v1/forecast?latitude=" + p.lat + "&longitude=" + p.lon +
      "&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7", 10000)
      .then(function(d){ if (!d || !d.daily) throw new Error("no daily"); return d.daily; });
  }

  function showError(){
    el.className = "weather-error";
    el.innerHTML = 'Weather forecast unavailable right now. <a href="#" id="wx-retry">Tap to retry</a>';
    var a = document.getElementById("wx-retry");
    if (a) a.onclick = function(e){ e.preventDefault(); el.className = "weather-loading"; el.textContent = "Detecting your location…"; attempt(0); };
  }

  function attempt(n){
    if (busy) return; busy = true;
    locate().then(function(p){
      return forecast(p).then(function(daily){ store(KEY_WX, {place: p.place, daily: daily}); render(p.place, daily); });
    }).then(function(){ busy = false; }).catch(function(){
      busy = false;
      if (n < 3){ setTimeout(function(){ attempt(n + 1); }, 1500 * (n + 1)); }
      else if (!shown){ showError(); }
    });
  }

  // 1) Show the last forecast instantly if we have one (today's date must still match).
  var c = load(KEY_WX);
  if (c && c.v && c.v.daily && c.v.daily.time && c.v.daily.time[0]){
    try { render(c.v.place, c.v.daily); } catch(e){}
  }
  // 2) Refresh in the background unless the cached forecast is under 30 minutes old.
  if (!(c && Date.now() - c.t < WX_TTL)) attempt(0);

  // 3) If it still hasn't appeared (e.g. phone woke up offline), try again when the connection or tab returns.
  window.addEventListener("online", function(){ if (!shown) attempt(0); });
  document.addEventListener("visibilitychange", function(){ if (!document.hidden && !shown) attempt(0); });
  window.addEventListener("pageshow", function(e){ if (e.persisted && !shown) attempt(0); });
})();
