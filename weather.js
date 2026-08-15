(function(){
  var el = document.getElementById("weather-content");
  if (!el) return;

  var DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  function weatherIcon(code){
    if (code === 0) return "\u2600\uFE0F";
    if (code === 1 || code === 2) return "\u26C5";
    if (code === 3) return "\u2601\uFE0F";
    if (code === 45 || code === 48) return "\uD83C\uDF2B\uFE0F";
    if ([51,53,55,56,57,80,81,82].indexOf(code) !== -1) return "\uD83C\uDF26\uFE0F";
    if ([61,63,65,66,67].indexOf(code) !== -1) return "\uD83C\uDF27\uFE0F";
    if ([71,73,75,77,85,86].indexOf(code) !== -1) return "\u2744\uFE0F";
    if ([95,96,99].indexOf(code) !== -1) return "\u26C8\uFE0F";
    return "\uD83C\uDF21\uFE0F";
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
  }

  fetch("https://get.geojs.io/v1/ip/geo.json")
    .then(function(r){ return r.json(); })
    .then(function(geo){
      var lat = geo.latitude, lon = geo.longitude;
      var place = [geo.city, geo.region].filter(function(x){ return x; }).join(", ") || geo.country || "Your location";
      return fetch("https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon +
        "&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7")
        .then(function(r2){ return r2.json(); })
        .then(function(data){ render(place, data.daily); });
    })
    .catch(function(){
      el.className = "weather-error";
      el.textContent = "Weather forecast unavailable right now.";
    });
})();
