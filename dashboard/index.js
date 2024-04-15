
//const ourName = "Goonhilly Earth Station - Cornwall, UK";
const ourName = "Mary Hare School - Newbury, UK";

const ourLocation = [51.4373, -1.332]; // Mary Hare
//var ourLocation = [50.0486, -5.1785]; // Goonhilly
const ourAltitude = 100; // Meters
const aosThreshold = 0; // Degrees

document.getElementById("databox-title").textContent = ourName;

/*** TT Monitor ***/

var tt_monitor = {}
tt_monitor.starting = true;
tt_monitor.online = true;

tt_monitor.rf = {};
tt_monitor.rf.value = 999;
tt_monitor.rf.minimum = -98;
tt_monitor.rf.maximum = -58;
tt_monitor.rf.text = document.getElementById("tt-monitor-rf-value");
tt_monitor.rf.graph = new ProgressBar.Line(document.getElementById("tt-monitor-rf-graph"), {
  strokeWidth: 4,
  easing: 'easeOut',
  duration: 200,
  color: '#FF0000',
  trailColor: '#eee',
  trailWidth: 1,
  svgStyle: {width: '100%', height: '100%'},
  from: {color: '#FF0000'},
  to: {color: '#7CFC00'},
  step: function(state, bar) {
    bar.path.setAttribute('stroke', state.color);
  }
});

tt_monitor.mer = {};
tt_monitor.mer.value = 999;
tt_monitor.mer.text = document.getElementById("tt-monitor-mer-value");
tt_monitor.mer.graph = new ProgressBar.Line(document.getElementById("tt-monitor-mer-graph"), {
  strokeWidth: 4,
  easing: 'easeOut',
  duration: 200,
  color: '#FF0000',
  trailColor: '#eee',
  trailWidth: 1,
  svgStyle: {width: '100%', height: '100%'},
  from: {color: '#FFA500'},
  to: {color: '#7CFC00'},
  step: function(state, bar) {
    bar.path.setAttribute('stroke', state.color);
  }
});

tt_monitor.vber = {};
tt_monitor.vber.value = 999;
tt_monitor.vber.text = document.getElementById("tt-monitor-vber-value");
tt_monitor.vber.graph = new ProgressBar.Line(document.getElementById("tt-monitor-vber-graph"), {
  strokeWidth: 4,
  easing: 'easeOut',
  duration: 200,
  color: '#FF0000',
  trailColor: '#eee',
  trailWidth: 1,
  svgStyle: {width: '100%', height: '100%'},
  from: {color: '#7CFC00'},
  to: {color: '#FF0000'},
  step: function(state, bar) {
    bar.path.setAttribute('stroke', state.color);
  }
});

tt_monitor.statusText = document.getElementById("tt-status-text");
tt_monitor.sr_lock = {};
tt_monitor.sr_lock.value = 999;
tt_monitor.rf_lock = {};
tt_monitor.rf_lock.value = 999;

var socket = io('/', {
  path: "/dashboard/socket",
  query: "room=G8GTZ|1"
});
socket.on('data', function (jdata) {
    var data = JSON.parse(jdata);
    if(typeof data.iq == "undefined" && tt_monitor.online == true)
    {
        tt_monitor.online = false;
        document.getElementById("tt-container").style.opacity = 0.2;
        document.getElementById("tt-offline").style.display = "inline";
        return;
    }
    else if(typeof data.iq != "undefined" && tt_monitor.online == false)
    {
        tt_monitor.online = true;
        document.getElementById("tt-offline").style.display = "none";
        document.getElementById("tt-container").style.opacity = 1;
    }

    tt_monitor.rf.newValue = Number(data.station.levels.rf);
    tt_monitor.mer.newValue = Number(data.station.er.m.split(" ")[0]);
    tt_monitor.vber.newValue = Number(data.station.er.vb);
    tt_monitor.rf_lock.newValue = Number(data.station.status.rf_lock);
    tt_monitor.sr_lock.newValue = Number(data.station.status.sr_lock);

    if(tt_monitor.rf.value != tt_monitor.rf.newValue)
    {
        tt_monitor.rf.value = tt_monitor.rf.newValue;
        
        tt_monitor.rf.graphValue = Math.max(0.02,Math.min(0.99,(tt_monitor.rf.value - tt_monitor.rf.minimum)/(-tt_monitor.rf.maximum)));
        tt_monitor.rf.text.textContent = tt_monitor.rf.value;

        if(tt_monitor.starting)
        {
            tt_monitor.rf.graph.set(tt_monitor.rf.graphValue);
        }
        else
        {
            tt_monitor.rf.graph.animate(tt_monitor.rf.graphValue);
        }
    }
    
    if(tt_monitor.mer.value != tt_monitor.mer.newValue)
    {
        tt_monitor.mer.value = tt_monitor.mer.newValue;
        tt_monitor.mer.graphValue = tt_monitor.mer.value/31;
        tt_monitor.mer.text.textContent = tt_monitor.mer.value;
        
        if(tt_monitor.starting)
        {
            tt_monitor.mer.graph.set(tt_monitor.mer.graphValue);
        }
        else
        {
            tt_monitor.mer.graph.animate(tt_monitor.mer.graphValue);
        }
    }
    
    if(tt_monitor.vber.value != tt_monitor.vber.newValue)
    {
        tt_monitor.vber.value = tt_monitor.vber.newValue;
        tt_monitor.vber.graphValue = tt_monitor.vber.value/100;
        tt_monitor.vber.text.textContent = tt_monitor.vber.value;
        if(tt_monitor.starting)
        {
            tt_monitor.vber.graph.set(tt_monitor.vber.graphValue);
        }
        else
        {
            tt_monitor.vber.graph.animate(tt_monitor.vber.graphValue);
        }
    }    

    if(tt_monitor.sr_lock.value != tt_monitor.sr_lock.newValue ||
        tt_monitor.rf_lock.value != tt_monitor.rf_lock.newValue)
    {
        tt_monitor.sr_lock.value = tt_monitor.sr_lock.newValue;
        tt_monitor.rf_lock.value = tt_monitor.rf_lock.newValue;

        if(!tt_monitor.sr_lock.value)
        {
            tt_monitor.statusText.textContent = "NO LOCK";
            tt_monitor.statusText.style.color = "#FF0000";
        }
        else
        {
            if(!tt_monitor.rf_lock.value)
            {
                tt_monitor.statusText.textContent = "SYM OK";
                tt_monitor.statusText.style.color = "#FF8C00";
            }
            else
            {
                tt_monitor.statusText.textContent = "TS OK";
                tt_monitor.statusText.style.color = "#008000";
            }
        }
    }
    
    updateIQ(data.iq);

    if(tt_monitor.starting)
        tt_monitor.starting = false;
});
var tt_image_el =document.getElementById('tt-image');
var tt_image_ctx = tt_image_el.getContext('2d');
tt_image_ctx.scale(0.78125,0.78125);

socket.on('image', function (image_data) {
  var tt_image_el =document.getElementById('tt-image');
  var tt_image_ctx = tt_image_el.getContext('2d');

  var img = new Image;
  img.onload = function(){
    tt_image_ctx.drawImage(img,0,0);
  };
  img.src = "data:image/jpeg;base64,"+image_data;

});
/*** Datetime Bar ***/
function showDate()
{
	var now = new Date();
	var days = new Array('Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday');
	var months = new Array('January','February','March','April','May','June','July','August','September','October','November','December');
	var date = ((now.getDate()<10) ? "0" : "")+ now.getDate();
	function fourdigits(number)
	{
		return (number < 1000) ? number + 1900 : number;
	}
	
	tnow=new Date();
	thour=now.getHours();
	tmin=now.getMinutes();
	tsec=now.getSeconds();
	
	if (tmin<=9) { tmin="0"+tmin; }
	if (tsec<=9) { tsec="0"+tsec; }
	if (thour<10) { thour="0"+thour; }
	
	today = date + " " + months[now.getMonth()] + ", " + (fourdigits(now.getYear())) + "&nbsp;&nbsp;-&nbsp;&nbsp;" + thour + ":" + tmin +":"+ tsec;
	//today = days[now.getDay()] + ", " + date + " " + months[now.getMonth()] + ", " + (fourdigits(now.getYear())) + " - " + thour + ":" + tmin +":"+ tsec;
	document.getElementById("dateDiv").innerHTML = today;
}
showDate();
setInterval("showDate()", 1000);
/*** Phil's Webcam Refresh Code ***/
var GhCamStatus = true;
function refreshGhCam()
{
    if(GhCamStatus)
    {
        document.getElementById("webcam-image").src="/dashboard/webcam/webcam.jpg?t="+Math.floor((Math.random()*100000)+1);
    }
}
function checkGhCam()
{
    $.ajax({
        url:      "/dashboard/webcam/webcam.jpg",
        type:     'GET',
        cache:      false,
        success: function(data, status, xhr)
        {
            //if(!GhCamStatus && ((new Date) - (new Date(xhr.getResponseHeader('Last-Modified'))))<(10*1000))
            if(!GhCamStatus)
            {
                GhCamStatus = true;
                var camElement = $("#webcam-image");
                camElement[0].src="";
                camElement[0].src="/dashboard/webcam/webcam.jpg?t="+Math.floor((Math.random()*100000)+1);
                camElement.removeClass("webcam-offline");
                camElement.addClass("webcam-online");
            }
            else if(0)
            //else if(GhCamStatus && ((new Date) - (new Date(xhr.getResponseHeader('Last-Modified'))))>=(10*1000))
            {
                GhCamStatus = false;
                var camElement = $("#webcam-image");
                camElement[0].src="";
                camElement[0].src="/images/webcam-offline.png";
                camElement.removeClass("webcam-online");
                camElement.addClass("webcam-offline");
            }
        },
        error: function()
        {
            if(GhCamStatus)
            {
                GhCamStatus = false;
                var camElement = $("#webcam-image");
                camElement[0].src="";
                camElement[0].src="/images/webcam-offline.png";
                camElement.removeClass("webcam-online");
                camElement.addClass("webcam-offline");
            }
        }
    });
}
$(function() {
    checkGhCam();
    setInterval(checkGhCam,5*1000);
    setInterval(refreshGhCam,1.5*1000);
});
/*** Phil's Satellite Code ***/
var iss;
var future_iss;

/* Data update function */
function updateISSData()
{
    document.getElementById("iss-data-altitude").textContent = decimalFix(iss.orbit.getAltitude(),1) + " km";
    document.getElementById("iss-data-range").textContent = decimalFix((latlonRange(ourLocation,ourAltitude,iss.orbit.getPosition(),iss.orbit.getAltitude()*1000))/1000,1) + " km";
    var issElevation = relativeElevation(ourLocation,ourAltitude,iss.orbit.getPosition(),iss.orbit.getAltitude()*1000);
    document.getElementById("iss-data-elevation").textContent = decimalFix(issElevation,1) + "°";
    if(issElevation>aosThreshold)
    {
        /* We're in a pass */
        document.getElementById("iss-data-nextaos-name").innerHTML = "LOS in:&nbsp;&nbsp;";
        var los = findLos(ourLocation,ourAltitude,aosThreshold);
        if(los !== null)
        {
            document.getElementById("iss-data-nextaos").textContent = aosTimeString(los);
        }
    }
    else
    {
        /* We're waiting for the next pass */
        document.getElementById("iss-data-nextaos-name").innerHTML = "AOS in:&nbsp;&nbsp;";
        var aos = findAos(ourLocation,ourAltitude,aosThreshold);
        if(aos !== null)
        {
            document.getElementById("iss-data-nextaos").textContent = aosTimeString(aos);
        }
    }
}

$(function() {
    $.ajax({
        url:      "/iss.txt",
        type:     'GET',
        cache:      false,
        success: function(data, status)
        {
            var stations = orbits.util.parseTLE(data);
            var i = 0;
            for(;i < stations.length; i++)
            {
                if(stations[i].name == "ISS (ZARYA)") {
                    var satOpts = {
                        tle: stations[i],
                        pathLength: 1,
                      };
                     
                    iss = new orbits.Satellite(satOpts);  
                    future_iss = new orbits.Satellite(satOpts);  
                    iss.refresh();
                    
                    setInterval(function() {
                        iss.refresh();
                        updateISSData();
                    }, 1000);
                }
            }
        },
        error: function()
        {
            console.log("TLE Error.");
        }
    });
});
/* Hours, minutes, seconds string construction function */
function aosTimeString(aosTime) {
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

// Google Analytics (Apr 2018)
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'UA-117280924-1');
/* Send event 1x per minute to count viewers */
var ga_page = 'dashboard';
function ga_realtime()
{
   gtag('event', ga_page+'-page-1m', {'event_category': 'viewers'});
   setTimeout(ga_realtime, 60*1000);
}
ga_realtime();
/* Refresh page every 6 hours to update lurkers */
setTimeout(function() { window.location.href=window.location.href; }, 6*60*60*1000);

/********** ********/

function decimalFix(num, decimals, leading=0, leadingChar='0')
{
  const t = Math.pow(10, decimals);
  return ((Math.round((num * t) + (decimals>0?1:0)*(Math.sign(num) * (10 / Math.pow(100, decimals)))) / t).toFixed(decimals)).toString().padStart(leading+1+decimals, leadingChar);
}