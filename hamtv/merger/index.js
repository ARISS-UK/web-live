var rtmpUrl = "rtmp://beta.batc.tv:1935/event/goonhilly";

var last_server_data = 0;
var mx_merger = null;
var thread_stats = [];
var rx_stations = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
var mx_merger = {
  "data_received": 0,
  "gui_updated": 0,
  "output_live": 0
};
rx_stations.forEach(function(station, station_index)
{
  rx_stations[station_index] = {
    /* Cached Div Selector */
    "div": null,
    
    /* Callsign of station */
    "callsign": "[Station Slot Free]",
    
    "received": 0,
    "received_sum": 0,
    
    "selected": 0,
    "selected_percent": 0,
    "selected_sum": 0,
    
    "lost_sum": 0
  };
  
  /* Set up contribution graph data */
});

var status_output = false;
var status_counter = 0;
var player_overlay = true;
function checkStatus()
{
  if(mx_merger.output_live && !status_output)
  {
    status_counter++;
    if(status_counter > 10)
    {
      status_output = true;
      status_counter = 0;
    }
  }

  if(!mx_merger.output_live && status_output)
  {
    status_counter--;
    if(status_counter < -20)
    {
      status_output = false;
      status_counter = 0;
    }
  }

  if(!status_output && !player_overlay)
  {
    $("#stream-player-overlay").show();
    player_overlay = true;
  }
  else if(status_output && player_overlay)
  {
    $("#stream-player-overlay").hide();
    player_overlay = false;
  }
  
  setTimeout(checkStatus,50);
}
checkStatus();

function create_stations()
{
  rx_stations.forEach(function(station, station_id)
  {
    station.div = $('<div></div>')
      .attr('id', 'panel-rx_station-'+station_id)
      .attr('class', 'station-div');
    
    
    station.div.append($('<span></span>')
                            .attr('id','title-rx_station-'+station_id)
                            .attr('class', 'station-title')
                         );
    
    station.div.append($('<span></span>')
                        .attr('id','rx_station-selecting-label-'+station_id)
                        .attr('class','station-label label label-success')
                        .text('Prime Receiver'));

    station.div.append($('<span></span>')
                        .attr('id','rx_station-streaming-label-'+station_id)
                        .attr('class','station-label label label-info')
                        .text('Receiving Data'));

    station.div.append($('<span></span>')
                        .attr('id','rx_station-netloss-label-'+station_id)
                        .attr('class','station-label label label-warning')
                        .text('Upload Network Loss'));

    station.div.append($('</br>'));
                        
    station.div.append($('<span></span>')
                        .attr('class', 'rx_station-stat-label')
                        .text('Last Active: '));

    station.div.append($('<span></span>')
                        .attr('id','rx_station-last_updated-'+station_id)
                        .attr('class', 'rx_station-stat'));
    
    station.div.append($('<span></span>')
                        .attr('class', 'rx_station-stat-label')
                        .text('TS Packets: '));
    station.div.append($('<span></span>')
                        .attr('id','rx_station-total-'+station_id)
                        .attr('class', 'rx_station-stat'));
    
    station.div.append($('<span></span>')
                        .attr('class', 'rx_station-stat-label')
                        .text('Upload Loss: '));
    station.div.append($('<span></span>')
                        .attr('id','rx_station-netloss-'+station_id)
                        .attr('class', 'rx_station-stat'));
    
    station.div.append($('<span></span>')
                        .attr('class', 'rx_station-stat-label')
                        .text('PCRs Used: '));
    station.div.append($('<span></span>')
                        .attr('id','rx_station-selected-'+station_id)
                        .attr('class', 'rx_station-stat'));
    
    $("#rx_stations_row").append(station.div);
  });
}

function render_stations()
{
  var graphTime = new Date().getTime();

  var merger_status_indicator = $("#merger_status_indicator");
  if(mx_merger.output_live == 0)
  {
    if(!merger_status_indicator.hasClass('label-default'))
    {
      merger_status_indicator
        .removeClass('label-success')
        .addClass('label-default')
        .text('Standing by');
    }
  }
  else if(mx_merger.output_live == 1)
  {
    if(!merger_status_indicator.hasClass('label-success'))
    {
      merger_status_indicator
        .removeClass('label-default')
        .addClass('label-success')
        .text('Active!');
    }
  }

  rx_stations.forEach(function(station, station_id)
  {
    /* Set panel colour based on station status */
    if(station.received != 0)
    {
      if(station.selected != 0)
      {
        /* Station is streaming and selected for output */
        /* Green panel - set if not already set */
        if(!station.div.hasClass('panel-success'))
        {
          station.div
            .removeClass('panel-default')
            .removeClass('panel-info')
            .addClass('panel-success');
        }
      }
      else
      {
        /* Station is streaming, but not selected */
        /* Blue panel - set if not already set */
        if(!station.div.hasClass('panel-info'))
        {
          station.div
            .removeClass('panel-default')
            .removeClass('panel-success')
            .addClass('panel-info');
        }
      }
    }
    else
    {
      /* Station is not streaming */
      /* Grey panel - set if not already set */
      if(!station.div.hasClass('panel-default'))
      {
        station.div
          .removeClass('panel-info')
          .removeClass('panel-success')
          .addClass('panel-default');
      }
    }
    
    /* Set panel title */
    $('#title-rx_station-'+station_id)
      .text(station.callsign);

    /* Set graph legend */
    if(station.callsign=="[Station Slot Free]")
    {
      $('#graph-legend-'+station_id)
        .text("");
    }
    else
    {
      $('#graph-legend-'+station_id)
        .text(station.callsign);
    }
    
    /* Set Labels */
    if(station.selected != 0)
    {
      $('#rx_station-selecting-label-'+station_id).css("opacity", 1);
    }
    else
    {
      $('#rx_station-selecting-label-'+station_id).css("opacity", 0.1);
    }
    if(station.received != 0)
    {
      $('#rx_station-streaming-label-'+station_id).css("opacity", 1);
    }
    else
    {
      $('#rx_station-streaming-label-'+station_id).css("opacity", 0.1);
    }
    if(station.lost_sum != 0)
    {
      $('#rx_station-netloss-label-'+station_id).css("opacity", 1);
    }
    else
    {
      $('#rx_station-netloss-label-'+station_id).css("opacity", 0.1);
    }

      
    /* Set text stats */
    $('#rx_station-last_updated-'+station_id)
      .text(shortSince(station.last_updated));
    $('#rx_station-total-'+station_id)
      .text(station.received_sum);
    $('#rx_station-selected-'+station_id)
      .text(station.selected_sum);
    $('#rx_station-netloss-'+station_id)
      .text(station.lost_sum);
  });
  
  setTimeout(render_stations,200);
}
create_stations();
render_stations();

function update_stations(stations)
{
  rx_stations.forEach(function(station,station_index)
  {
    rx_stations[station_index].connected = false;
  });

  stations.forEach(function(station,station_index)
  {
    rx_stations[station.id].connected = true;
    rx_stations[station.id].callsign = urlDecode(station.callsign);
    rx_stations[station.id].last_updated = station.last_updated;
    rx_stations[station.id].received = station.received;
    rx_stations[station.id].received_sum = station.received_sum;
    rx_stations[station.id].selected = station.selected;
    rx_stations[station.id].selected_percent = station.selected_percent;
    rx_stations[station.id].selected_sum = station.selected_sum;
    rx_stations[station.id].lost_sum = Math.max(0,station.lost_sum);
  });
}

const websocket_connection = function() {

  var web_socket = null;
  var flag_connected = false;
  var server_side_buffer_obj = {};

    var MAX_CONN_RETRY = 1000;
    var counter_retry_connection = 0;

    var retry_delay_time = 5;

    var flag_connection_active = true; // start OK if closed then becomes false

    if (! ("WebSocket" in self))
    {
      console.log("websockets is not available on this browser - please use firefox");
      return;
    }

    if (flag_connected) {

      // throw new Error("ERROR - socket already connected ... zap this error msg");
      return; // already connected
    }

    let wshostname = location.hostname;

    let wsProtocol = 'ws://';
    if (location.protocol === 'https:')
    {
      wsProtocol = 'wss://';
    }


    wsUrl = `${wsProtocol}${wshostname}/hamtv/merger/stats`

    if (typeof MozWebSocket != "undefined")
    {
      web_socket = new MozWebSocket(ws_url);
    }
    else
    {
      web_socket = new WebSocket(ws_url);
    }
    
    console.log('run');

    web_socket.binaryType = null;

    web_socket.onconnection = function(stream) {
        console.log('WebSocket connect');
    };

    web_socket.onconnected = function(stream) {
        console.log('someone connected!');
    };

    web_socket.onmessage = function(event) {        //      receive message from server side

        console.log("top of onmessage");

        if (typeof event.data === "string") {

            let received_jsonobj = null;
            try {
              updateData(event.data);
              received_jsonobj = JSON.parse(event.data);
            }
            catch {
                console.log("ERROR - failed to parse JSON received on websocket");
            }

            if(received_jsonobj !== null)
            {
                self.postMessage(received_jsonobj);
            }

        } else if (event.data instanceof ArrayBuffer) {

            server_side_buffer_obj.buffer = new Float32Array(event.data);

            const float_array = new Float32Array(server_side_buffer_obj.buffer);

            self.postMessage(float_array.buffer, [float_array.buffer]); // sending array back to browser

        }
    };

    web_socket.onerror = function(error_stream) {

        console.log('ERROR - fault on socket');

        for (var curr_property in error_stream) {

            if (error_stream.hasOwnProperty(curr_property)) {

                console.log("error property " + 
                                curr_property + " -->" + error_stream[curr_property] +
                                                "<-- ");
            }
        }
    };

    // ---

    // flag_connected = true; // stens TODO put this in correct callback above

    web_socket.onclose = function(close_event) {

        console.log("NOTICE - onclose with message");

        flag_connection_active = false;

        // console.log(close_event);

        // shared_utils.show_object(close_event, "ceoeoeoeoeoe   close_event  ", "total", 3);

        // DEBUG
        for (var curr_property in close_event) {

            if (close_event.hasOwnProperty(curr_property)) {

                console.log("curr_property " + 
                                        curr_property + " -->" + close_event[curr_property] +
                                                        "<-- ");
            }
        }

    };

    web_socket.onopen = function(){

        console.log("/audio websocket open..");

        flag_connected = true; // stens TODO put this in correct callback above
    };


  return {

    init : function() {

    },
      close_socket : function() {

          console.log("NOTICE - about to close socket intentionally");

          web_socket.close();

      }
  };
};

window.addEventListener('load', () =>
{
  console.log('load');
  websocket_connection();
});


function updateData(jdata)
{
  //console.log(jdata);
  var data;
  try
  {
    data = JSON.parse(jdata);
  }
  catch(e)
  {
    console.log("Error parsing JSON: "+jdata);
    return;
  }
  //console.log(data);
  mx_merger.data_received = new Date();
    
  switch(data.type)
  {
    case 'udprxbuffer':
      $("#rx_buffer_queue").text(data.queue);
      $("#rx_buffer_loss").text(data.loss);
      break;
      
    case 'merger':
      mx_merger.output_live = data.live;
      $("#tsmerge_version").text(data.version);
      $("#tsmerge_built").text(data.built);
      update_stations(data.stations);
      break;
      
    case 'threads':
      var threads_list = $("<ul></ul>");
      for(var i=0; i<data.threads.length; i++)
      {
        if(typeof thread_stats[data.threads[i].id] == "undefined")
        {
          $("#server_threads_list")
            .append($("<li></li>")
              .text(data.threads[i].name+": ")
              .append($("<span></span>")
                .attr('id',"thread-stat-"+data.threads[i].id)
                .attr('class',"align-right")
              )
            );
                
          thread_stats[data.threads[i].id] = $("#thread-stat-"+data.threads[i].id);
        }
        thread_stats[data.threads[i].id].text(`${decimalFix(data.threads[i].cpu_percent,1)}%`);
        if(data.threads[i].cpu_percent >= 50)
        {
          thread_stats[data.threads[i].id].addClass('thread-critical');
        }
        else if(data.threads[i].cpu_percent >= 10)
        {
          thread_stats[data.threads[i].id].addClass('thread-warning');
        }
      }
      break;
      
    default:
      console.log("Unknown data type: "+data.type);
      break;
  }
};

function checkServer()
{
  if(mx_merger.data_received > (new Date() - 2000))
  {
    $("#tsmerge_server").text("Running");
  }
  else if(mx_merger.data_received > 0)
  {
    $("#tsmerge_server").text("Stopped");
  }
  setTimeout(checkServer, 100);
}
checkServer();

function dateStringFromEpoch(epoch)
{
  var date = new Date(epoch);
  return date.toDateString() + " " + date.toLocaleTimeString();
}

function shortSince(timestamp)
{
  if(typeof timestamp == "undefined")
  {
    return "never";
  }

  var seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);

  if(seconds > 500000)
  {
    return "never";
  }

  var interval = Math.floor(seconds / 86400);
  if(interval > 1)
  {
    return interval + "d ago";
  }
  interval = Math.floor(seconds / 3600);
  if(interval > 1)
  {
    return interval + "h ago";
  }
  interval = Math.floor(seconds / 60);
  if(interval > 1)
  {
    return interval + "m ago";
  }
  if(seconds > 1)
  {
    return Math.floor(seconds) + "s ago";
  }
  return "just now";
}
function urlDecode(str) {
   return decodeURIComponent((str+'').replace(/\+/g, '%20'));
}

function decimalFix(num, decimals, leading=0, leadingChar='0')
{
  const t = Math.pow(10, decimals);
  return ((Math.round((num * t) + (decimals>0?1:0)*(Math.sign(num) * (10 / Math.pow(100, decimals)))) / t).toFixed(decimals)).toString().padStart(leading+1+decimals, leadingChar);
}
