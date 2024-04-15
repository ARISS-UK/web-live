let hlsSource = "/hls/";
const hlsSourceUrl = "/hls/sources.json";
let streamName = "event";

const posterPicture = "/images/webcast-poster.jpg";
const posterVideo = "/images/webcast-poster.mp4";

let statusHtml_connecting = "Connecting to Server...&nbsp;<img src=\""+loadingImage+"\" class=\"loading\"></img>";
let statusText_inactive = "Standing by.";
let statusText_active = "Stream running.";

// Stream Countdown
//var streamStartDate = new Date("Sept 1, 2018 08:00 UTC").getTime();
const streamStartDate = new Date("April 18, 2024 10:00 UTC").getTime();

// ISS Location and Angles
let iss;
let iss_update_timer = null;
let next_aos = null;
let next_los = null;

const venue_lat = 50.78;
const venue_lon = -3.0;
const venue_alt = 20;

$(function()
{
  const queryObj = parse_query_string(window.location.search.substring(1));
  if('test' in queryObj)
  {
    if(typeof queryObj.test != 'undefined')
    {
      streamName = "event-test-" + queryObj.test;
    }
    else
    {
      streamName = "event-test";
    }
  }

  // Stream countdown
  updateCountdown();

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

function updateCountdown()
{
  var distance = streamStartDate - (new Date().getTime());
  
  if(distance > 0)
  {
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

  // Display the result in the element with id="demo"

    $("#lowerbox-countdown").show(); 
    $("#lowerbox-countdown-value").text(pad(days,2) + "d " + pad(hours,2) + "h " + pad(minutes,2) + "m " + pad(seconds,2) + "s ");
  }
  else
  {
    $("#lowerbox-countdown").hide();
  }

  setTimeout(updateCountdown, 1000);
}


function updateISSData()
{
    var utc_now = new Date();
    iss.refresh();
    $("#utc-time-display").text(pad(utc_now.getUTCHours(),2)+":"+pad(utc_now.getUTCMinutes(),2)+":"+pad(utc_now.getUTCSeconds(),2)+" UTC");
    var venue_iss_range = Math.round((latlonRange([venue_lat, venue_lon],venue_alt,iss.orbit.getPosition(),iss.orbit.getAltitude()*1000))/1000);
    var venue_iss_azimuth = Math.round(relativeAzimuth(
      [ venue_lat, venue_lon], venue_alt,
      iss.orbit.getPosition(), iss.orbit.getAltitude()*1000
      )*10)/10;
    var venue_iss_elevation = Math.round(relativeElevation(
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
    iss_update_timer = setTimeout(updateISSData,1000);
}

function loadTLE()
{
    $.ajax({
        url:      "/iss.txt",
        type:     'GET',
        cache:    false
    }).done(function(data, status, xhr) {
       var stations = orbits.util.parseTLE(data);
       for(var i = 0; i < stations.length; i++)
       {
           if(stations[i].name == "ISS (ZARYA)")
           {
               var satOpts = {
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
  var vars = query.split("&");
  var query_string = {};
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
      query_string[pair[0]] = arr;
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  }
  return query_string;
}
function compass(angle)
{
  var degree = 360 / 16;
  angle = angle + degree/2;
        
  if(angle >= 0 * degree && angle < 1 * degree)
    return "N";
  if(angle >= 1 * degree && angle < 2 * degree)
    return "NNE";
  if(angle >= 2 * degree && angle < 3 * degree)
    return "NE";
  if(angle >= 3 * degree && angle < 4 * degree)
    return "ENE";
  if(angle >= 4 * degree && angle < 5 * degree)
    return "E";
  if(angle >= 5 * degree && angle < 6 * degree)
    return "ESE";
  if(angle >= 6 * degree && angle < 7 * degree)
    return "SE";
  if(angle >= 7 * degree && angle < 8 * degree)
    return "SSE";
  if(angle >= 8 * degree && angle < 9 * degree)
    return "S";
  if(angle >= 9 * degree && angle < 10 * degree)
    return "SSW";
  if(angle >= 10 * degree && angle < 11 * degree)
    return "SW";
  if(angle >= 11 * degree && angle < 12 * degree)
    return "WSW";
  if(angle >= 12 * degree && angle < 13 * degree)
    return "W";
  if(angle >= 13 * degree && angle < 14 * degree)
    return "WNW";
  if(angle >= 14 * degree && angle < 15 * degree)
    return "NW";
  if(angle >= 15 * degree && angle < 16 * degree)
    return "NNW";
  return "N";
}

function countdownTimeString(aosTime) {
    var now = new Date();
    var d = new Date(now.getTime());
    var diff = aosTime.getTime() - d.getTime();
    var diff_as_date = new Date(diff);
    return pad(diff_as_date.getUTCHours(),2) + ":" + pad(diff_as_date.getUTCMinutes(),2) + ":" + pad(diff_as_date.getUTCSeconds(),2);
}
function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}
