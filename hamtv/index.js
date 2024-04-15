'use strict';

var hlsSource = "/hls";
var hlsSourceUrl = "/hls/sources.json";
var streamName = "hamtv";
var posterPicture = "/images/poster.jpg";
var posterVideo = "/images/poster.mp4";
var statusHtml_connecting = "Connecting to Server...&nbsp;<img src=\""+loadingImage+"\" class=\"loading\"></img>";
var statusText_inactive = "Standing by for HAMTV..";
var statusText_active = "HAMTV is live!";

let mergerData = { 'updated': 0 };

var merger_box = $('#merger_stations_div');
var merger_stations = [];


function updateStations(objdata)
{
  let data = objdata.merger;

  if(data.type == 'merger')
  {
    if(iss != null)
    {
      iss.refresh();
    }

    data.stations.forEach(function(station)
    {
      if(station.enabled==0)
      {
        return;
      }

      if(typeof merger_stations[station.id] == "undefined")
      {
        merger_stations[station.id] = {};
        merger_stations[station.id].callsign = station.callsign;
        
        merger_stations[station.id].latitude = station.latitude;
        merger_stations[station.id].longitude = station.longitude;
        merger_stations[station.id].location = station.location;
      }
      
      merger_stations[station.id].selected = false;

      if(station.received > 0)
      {
        merger_stations[station.id].receiving = true;
        merger_stations[station.id].receiving_rate = (station.received * 188 * 8)/1000; // kbps
        
        if(station.selected > 0)
        {
          merger_stations[station.id].selected = true;
        }
      }
      else
      {
        merger_stations[station.id].receiving = false;
      }
     
      if(iss != null
         && (merger_stations[station.id].latitude != 0.0
         || merger_stations[station.id].longitude != 0.0))
      {
        merger_stations[station.id].elevation = Math.round(relativeElevation(
           [ merger_stations[station.id].latitude,
             merger_stations[station.id].longitude], 0,
           iss.orbit.getPosition(),
           iss.orbit.getAltitude()*1000
        )*10)/10;
      }
      else
      {
        merger_stations[station.id].elevation = -100;
      } 
    });

    merger_box.empty();
    merger_stations.forEach(function(station)
    {
      station['online'] = true;
      if(station.online == false)
      {
        return;
      }

      let station_div = $('<div></div>')
                        .attr('class', 'station-div');
      station_div.append($('<span></span>')
                        .attr('id','station-callsign-'+station.id)
                        .attr('class','station-callsign-label')
                        .html("<b>"+station.callsign+"</b> - "+decodeURIComponent(station.location).replace(/\+/g, ' ')))
                        .append('<br />');
      
      station_div.append($('<span></span>')
                        .attr('id','rx_station-selecting-label-'+station.id)
                        .attr('class','badge badge-success station-tag station-tag-active')
                        .text('Online'));

      if(station.receiving)
      {
        station_div.append($('<span></span>')
                        .attr('id','rx_station-streaming-label-'+station.id)
                        .attr('class','badge badge-info station-tag station-tag-active')
                        .text('RX Datarate: '+padL('        ',station.receiving_rate.toFixed(2))+'kbps'));
      }
      else
      {
        station_div.append($('<span></span>')
                        .attr('id','rx_station-streaming-label-'+station.id)
                        .attr('class','badge badge-light station-tag station-tag-inactive')
                        .text('RX Datarate: '+padL('        ','0.00')+'kbps'));
      }

      if(station.elevation > 5)
      {
        station_div.append($('<span></span>')
                          .attr('class', 'station-elevation-visible')
                          .text('EL: '+station.elevation.toFixed(1)+'°'));
      }
      else if(station.elevation > 0)
      {
        station_div.append($('<span></span>')
                          .attr('class', 'station-elevation-horizon')
                          .text('EL: '+station.elevation.toFixed(1)+'°'));
      }
      else if(station.elevation > -100)
      {
        station_div.append($('<span></span>')
                          .attr('class', 'station-elevation-occluded')
                          .text('EL: '+station.elevation.toFixed(1)+'°'));
      }

      //console.log(station.callsign);
      merger_box.append(station_div);
    });

      
 
    //mx_merger.output_live = data.live;
    //$("#tsmerge_version").text(data.version);
    //$("#tsmerge_built").text(data.built);
    //update_stations(data.stations);
  }
}

let iss = null;
function loadTle() 
{
  $.ajax({
    url:      "/iss.txt",
    type:     'GET',
    cache:      false,
  }).done(function(data)
    {
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
        }
      }
    }
  ).fail(function()
    {
      console.log("Error loading ISS TLE.");
    }
  );
}

function loadMergerStatusData()
{
	$.ajax(
		{
      url:      "/hamtv/merger/httpstats",
      type:     'GET',
      dataType: "json",
      cache:      false,
    }
	).done(function(data)
    {
      //console.log(data);
      mergerData = data;
      updateStations(data);
    }
	).fail(function()
    {
      console.log("Error loading Merger Status Data");
    }
	).always(function()
		{
      if(mergerData.updated > (Date.now() - 10*1000))
      {
      	$("#merger_status_div").text("HAMTV Ground Station Merger is running.");
      }
      else
      {
      	$("#merger_status_div").text("HAMTV Ground Station Merger is offline.");
      }

      setTimeout(loadMergerStatusData, 1000);
		}
	);
}


window.addEventListener('load', () =>
{
  loadTle();
  loadMergerStatusData();
});

function padL(pad, str) {
  if (typeof str === 'undefined') 
    return pad;
  return (pad + str).slice(-pad.length);
}

// Google Analytics (Apr 2018)
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'UA-117280924-1');
/* Send event 1x per minute to count viewers */
var ga_page = 'hamtv';
function ga_realtime()
{
   gtag('event', ga_page+'-page-1m', {'event_category': 'viewers'});
   setTimeout(ga_realtime, 60*1000);
}
ga_realtime();
/* Refresh page every 6 hours to update lurkers */
setTimeout(function() { window.location.href=window.location.href; }, 6*60*60*1000);