/* BATC Player JS */
/* Requires jquery and clappr */

var ws_url = "wss://hamtv.batc.tv/tsmerger-ws/";
var ws_sock = null;
var ws_reconnect = null;

ws_connect();
function ws_connect()
{
  if("WebSocket" in window)
  {
    if(ws_sock != null)
    {
      return;
    }

    if (typeof MozWebSocket != "undefined")
    {
      ws_sock = new MozWebSocket(ws_url);
    }
    else
    {
      ws_sock = new WebSocket(ws_url);
    }

    try
    {
      ws_sock.onopen = function()
      {
        window.clearInterval(ws_reconnect);
        ws_reconnect = null;
        //console.log("Websocket Connection Opened");
      };

      ws_sock.onmessage = function got_packet(msg)
      {
        //console.log("Websocket Data: "+msg.data);
        updateStatus(msg.data);
      };

      ws_sock.onclose = function()
      {
        ws_sock.close();
        ws_sock = null;

        if(!ws_reconnect)
        {
          ws_reconnect = setInterval(function()
          {
            ws_connect();
          },500);
        }
      };
    }
    catch(exception)
    {
      console.log("Websocket Error" + exception);  
    }
  }
  else
  {
    console.log("Websockets not supported in your browser!");
  }
}

function updateStatus(jdata)
{
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
  
  if(data.type == 'merger')
  {
    if(data.live == 1)
    {
      $("#stream-stats-status").html('<font color="green">HamTV is LIVE!</font>');
    }
    else
    {
      $("#stream-stats-status").html('<font color="red">Standing by for HamTV..</font>');
    }
  }
};

var player;

$(function() {  
    $("#stream-stats-status").html("Connecting..");
    createPlayer();
});


function createPlayer()
{
    player = new Clappr.Player({
         source: rtmpUrl,
         plugins: {'playback': [RTMP]},
         playbackNotSupportedMessage: 'Video stream playback not supported.<br>Please install Adobe Flash Player or try a different browser.',
         rtmpConfig: {
             swfPath: 'libs/clappr/rtmp/assets/RTMP.swf',
             playbackType: 'live',
             scaling:'stretch',
             bufferTime: 0.5,
             //startLevel: 0,
            width: '100%',
            height: '100%',
         },
         autoPlay: true,
     });
     $("#stream-player").height("360");
     $("#stream-player").width("640");
     
     var playerElement = document.getElementById("stream-player");
    player.attachTo(playerElement);
     
     $("#stream-stats").width("634");

    player.on(Clappr.Events.PLAYER_PLAY, function() {
      console.log("Play2");
    });
    player.on(Clappr.Events.PLAYBACK_TIMEUPDATE, function() {
      console.log("Stop");
    });
}
