/* BATC Player JS */
/* Requires jquery and clappr */

var loadingImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3wwHDjgGg/nlJgAAAfpJREFUSMet1jtrFFEcBfDfzu4m61sRsVAUUWy01MpXLTaChbV+BEtBLOz8An4LERsLQSSVIKigoqiNr6AWJibGvCY7NmdgiIkh2f3Dcrl3hv+559yz5w6r12jGy7iDZ5jAS0OoIuM1VGk8gSlMZ21d1Vk272XtDfr4GdCdeICneJR3yo0w6GFvdvsVH/EJlxrvjKA9iERbsvPPmMH1POsOIPk/9RrvMInTK0i5HoB2c3OdSHAV81jCLTzZqOZoBaioz66VB1/ioHmcGIJDRxtAMwXO4zsWcWMAmZq1FMkKdAucxBz2xKblEEDKbLZAt4Oj+U/cM9xayuG3ijCYxfsN2nW1qmqX1Q5YDJthVatp5Q5+Z7EcslztOh0KjIfa/jAallS9Wv4Cb7GAs0NmsitMygLPgzyOU4MEYOM8dqRnF7MFxrA1Z3Il1htUqgMxVA9TdZD9wqE4bCRBWW2QxT5sz/wb/hQ57PtpWuEijvwvrteQ6XBYdBJXVbvxwsMATONMzPAhYNUa0V5lY8cieze3aFU317icNuN25JsPy7t41fB+MzbE+scz76fnWMD6y0FqoAI3w6QI2Ca8wI80K7EtAFOZz6Xp44z9po4raVvhHC7knlkIq3os81tsxPqzyNtaLm9rjS+ZMjofxO7IKYE6GWbj+eAoVsu/v6z9iFbD0iHxAAAAAElFTkSuQmCC";

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
             swfPath: '/lib/clappr-rtmp-0.0.20/assets/RTMP.swf',
             playbackType: 'live',
             scaling:'stretch',
             bufferTime: 0.5,
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
}
