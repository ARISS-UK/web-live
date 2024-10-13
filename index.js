'use strict';

let player_enabled = false;
let visibility_enabled = false;

// ISS Location and Angles
let iss;
let iss_update_timer = null;
let next_aos = null;
let next_los = null;

let venue_lat = null;
let venue_lon = null;
const venue_alt = 100;

const DateTime = luxon.DateTime;
const Interval = luxon.Interval;

$(function()
{
  // Load JSON config -> Update countdown
  loadConfigData();

  // Load TLE -> Trigger ISS Location and Angles
  loadTLE();

  // Google Analytics GA4 - April 2024
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-VK2BGVWYS1');
  /* Send event 1x per minute to count viewers */
  var ga_page = 'webcast';
  function ga_realtime()
  {
     gtag('event', ga_page+'-page-1m', {'event_category': 'viewers'});
     setTimeout(ga_realtime, 60*1000);
  }
  ga_realtime();
});

/* Refresh page every 6 hours to update lurkers */
setTimeout(function() { window.location.href=window.location.href; }, 6*60*60*1000);

function updateISSData()
{
  if(visibility_enabled == false || venue_lat == null || venue_lon == null)
  {
    $("#iss-relative-paragraph").hide();
    iss_update_timer = setTimeout(updateISSData,1000);
    return;
  }

  const utc_now = new Date();
  iss.refresh();

  $("#utc-time-display").text(pad(utc_now.getUTCHours(),2)+":"+pad(utc_now.getUTCMinutes(),2)+":"+pad(utc_now.getUTCSeconds(),2)+" UTC");
  const venue_iss_range = Math.round((latlonRange([venue_lat, venue_lon],venue_alt,iss.orbit.getPosition(),iss.orbit.getAltitude()*1000))/1000);
  const venue_iss_azimuth = Math.round(relativeAzimuth(
    [ venue_lat, venue_lon], venue_alt,
    iss.orbit.getPosition(), iss.orbit.getAltitude()*1000
    )*10)/10;
  const venue_iss_elevation = Math.round(relativeElevation(
    [ venue_lat, venue_lon], venue_alt,
    iss.orbit.getPosition(), iss.orbit.getAltitude()*1000
    )*10)/10;
  $("#iss-data-position").text(
    (Math.round(iss.orbit.getPosition()[0]*10000)/10000).toFixed(4) + "°, "
    +(Math.round(iss.orbit.getPosition()[1]*10000)/10000).toFixed(4) + "°"
  );
  $("#iss-data-altitude").text(
      (Math.round(iss.orbit.getAltitude()*10)/10).toFixed(1) + " km"
  );
  $("#venue-iss-range").text(venue_iss_range.toFixed(0)+'km');
  $("#venue-iss-azimuth").text(venue_iss_azimuth.toFixed(1)+'° ('+compass(venue_iss_azimuth)+')');
  if(venue_iss_elevation >= 10)
  {
    $("#venue-iss-elevation")
      .removeClass("station-elevation-horizon")
      .removeClass("station-elevation-occluded")
      .addClass("station-elevation-visible")
      .text(venue_iss_elevation.toFixed(1)+'°');
    /*if(next_los == null)
    {
        next_los = findLos([venue_lat, venue_lon],venue_alt,0);
        $("#venue-iss-nextpass-label").text("End of pass");
    }
    $("#venue-iss-nextpass").text("-" + countdownTimeString(next_los));
    next_aos = null;
    */
  }
  else if(venue_iss_elevation > 0)
  {
    $("#venue-iss-elevation")
      .removeClass("station-elevation-occluded")
      .removeClass("station-elevation-visible")
      .addClass("station-elevation-horizon")
      .text(venue_iss_elevation.toFixed(1)+'°');
    /*if(next_los == null)
    {
        next_los = findLos([venue_lat, venue_lon],venue_alt,0);
        $("#venue-iss-nextpass-label").text("End of pass");
    }
    $("#venue-iss-nextpass").text("-" + countdownTimeString(next_los));
    next_aos = null;*/
  }
  else
  {
    $("#venue-iss-elevation")
      .removeClass("station-elevation-visible")
      .removeClass("station-elevation-horizon")
      .addClass("station-elevation-occluded")
      .text(venue_iss_elevation.toFixed(1)+'° (below horizon)');
    /*if(next_aos == null)
    {
        next_aos = findAos([venue_lat, venue_lon],venue_alt,0);
        $("#venue-iss-nextpass-label").text("Next pass");
    }
    $("#venue-iss-nextpass").text("-" + countdownTimeString(next_aos));
    next_los = null;*/
  }
  $("#iss-relative-paragraph").show();

  iss_update_timer = setTimeout(updateISSData,1000);
}

function loadConfigData()
{
  $.ajax({
      url:      "/live-config.json",
      dataType: "json",
      type:     'GET',
      cache:    false
  }).done(function(data, status, xhr)
  {
    //console.log(data);

    player_enabled = data.player_enabled;
    visibility_enabled = data.visibility_enabled;

    if(player_enabled == true && data.player_youtube_url != null && data.player_youtube_url.length > 0)
    {
      $('#logoplayer').hide();
      $('#stream-player').show();
      $('#stream-iframe').attr('src', `${data.player_youtube_url}?autoplay=1&rel=0`);
      destroyLogoPlayer();
    }
    else
    {
      $('#stream-player').hide();
      $('#logoplayer').show();
      createLogoPlayer($('#logoplayer')[0]);
    }

    $('#top-info-pane').html(strunescape(data.info_html));

    if(data.visibility_enabled)
    {
      venue_lat = data.visibility_location.latitude;
      venue_lon = data.visibility_location.longitude;
    }
  });
}


function loadTLE()
{
  $.ajax({
    url:      "/iss.txt",
    type:     'GET',
    cache:    false
  }).done(function(data, status, xhr) {
    let stations = orbits.util.parseTLE(data);
    for(let i = 0; i < stations.length; i++)
    {
      if(stations[i].name == "ISS (ZARYA)")
      {
        let satOpts = {
          tle: stations[i],
          pathLength: 1,
        };
        iss = new orbits.Satellite(satOpts);  

        if(iss_update_timer == null)
        {
          // Start ISS Data Update timer
          updateISSData();
        }
      }
    }
  }).fail(function() {
    console.log("TLE Error.");
  }).always(function() {
    // Reload TLE every 600s (10 minutes)
    setTimeout(loadTLE, 600*1000);
  });
}

function parse_query_string(query) {
  let vars = query.split("&");
  let query_string = {};
  for (let i = 0; i < vars.length; i++) {
    let pair = vars[i].split("=");
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
    } else if (typeof query_string[pair[0]] === "string") {
      let arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
      query_string[pair[0]] = arr;
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  }
  return query_string;
}
function compass(angle)
{
  let degree = 360 / 8;
  angle = angle + degree/2;
        
  if(angle >= 0 * degree && angle < 1 * degree)
    return "North";
  if(angle >= 1 * degree && angle < 2 * degree)
    return "North-East";
  if(angle >= 2 * degree && angle < 3 * degree)
    return "East";
  if(angle >= 3 * degree && angle < 4 * degree)
    return "South-East";
  if(angle >= 4 * degree && angle < 5 * degree)
    return "South";
  if(angle >= 5 * degree && angle < 6 * degree)
    return "South-West";
  if(angle >= 6 * degree && angle < 7 * degree)
    return "West";
  if(angle >= 7 * degree && angle < 8 * degree)
    return "North-West";
  return "North";
}

function countdownTimeString(aosTime) {
    let now = new Date();
    let d = new Date(now.getTime());
    let diff = aosTime.getTime() - d.getTime();
    let diff_as_date = new Date(diff);
    return pad(diff_as_date.getUTCHours(),2) + ":" + pad(diff_as_date.getUTCMinutes(),2) + ":" + pad(diff_as_date.getUTCSeconds(),2);
}
function pad(num, size) {
    let s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}
function numordstr(n)
{
  const s = ["th", "st", "nd", "rd"];
  const v = n%100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

function strunescape(s)
{
  return s = ('' + s)
    .replace(/\\x3E/g, '>')
    .replace(/\\x3C/g, '<')
    .replace(/\\x22/g, '"')
    .replace(/\\x27/g, "'")
    .replace(/\\x26/g, '&')
    .replace(/\\u00A0/g, '\u00A0')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\');
}
