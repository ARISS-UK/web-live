/* BATC Player JS */
/* Requires jquery and clappr */
var streamUrl;
var streamSuffix = "";
var plUrl;
var plUrlCheckTimer;
var pState = 0;
var player;
var loadingImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3wwHDjgGg/nlJgAAAfpJREFUSMet1jtrFFEcBfDfzu4m61sRsVAUUWy01MpXLTaChbV+BEtBLOz8An4LERsLQSSVIKigoqiNr6AWJibGvCY7NmdgiIkh2f3Dcrl3hv+559yz5w6r12jGy7iDZ5jAS0OoIuM1VGk8gSlMZ21d1Vk272XtDfr4GdCdeICneJR3yo0w6GFvdvsVH/EJlxrvjKA9iERbsvPPmMH1POsOIPk/9RrvMInTK0i5HoB2c3OdSHAV81jCLTzZqOZoBaioz66VB1/ioHmcGIJDRxtAMwXO4zsWcWMAmZq1FMkKdAucxBz2xKblEEDKbLZAt4Oj+U/cM9xayuG3ijCYxfsN2nW1qmqX1Q5YDJthVatp5Q5+Z7EcslztOh0KjIfa/jAallS9Wv4Cb7GAs0NmsitMygLPgzyOU4MEYOM8dqRnF7MFxrA1Z3Il1htUqgMxVA9TdZD9wqE4bCRBWW2QxT5sz/wb/hQ57PtpWuEijvwvrteQ6XBYdBJXVbvxwsMATONMzPAhYNUa0V5lY8cieze3aFU317icNuN25JsPy7t41fB+MzbE+scz76fnWMD6y0FqoAI3w6QI2Ca8wI80K7EtAFOZz6Xp44z9po4raVvhHC7knlkIq3os81tsxPqzyNtaLm9rjS+ZMjofxO7IKYE6GWbj+eAoVsu/v6z9iFbD0iHxAAAAAElFTkSuQmCC";

var clientPhone;
var clientMobile;
var lowQuality = false;

var bandwidthHtml_higher = "Buffering a lot? Try <a id=\"stream-bandwidth-lower\" class=\"false-link\">Lower Bandwidth</a>";
var bandwidthHtml_lower = "Lower Bandwidth selected, <a id=\"stream-bandwidth-higher\" class=\"false-link\">back to Higher Bandwidth</a>";

$(function() {
    clientPhone = isPhone();
    clientMobile = isMobile();
    
    if(clientPhone)
    {
        statusHtml_connecting = "Connecting..&nbsp;<img src=\""+loadingImage+"\" class=\"loading\"></img>";
        statusText_inactive = "Stream Inactive";
        statusText_active = "Stream Active";
    }
    if(clientMobile)
    {
        statusText_inactive = "Stream Inactive - Please wait.";
        statusText_active = "Stream Active.";
    }
    //$("<style> svg.poster-icon { display: none !important;} </style>").appendTo("head");
    
    $("#stream-stats-status").html(statusHtml_connecting);
    $.ajax({
        url:      hlsSourceUrl,
        dataType: "json",
        type:     'GET',
        cache:      false,
        success: function(data, status)
        {
            /* HLS Source Select */
            if(data.length==1)
            {
                hlsSource = data[0];
            }
            else if(data.length>1)
            {
                hlsSource = data[getRandomInt(0, data.length)];
            }
        },
        complete: function()
        {
            /* Check for source url parameter override */
            if(selectSource())
            {
                hlsSource = (location.search.split('source=')[1]||'').split('&')[0];
            }
    
            // Create Player
            createLogoPlayer()
            checkPlUrl();
            plUrlCheckTimer = setInterval(checkPlUrl, 2000);
        }
    });
    
    $( "#stream-bandwidth" ).on( "click", "#stream-bandwidth-higher", higherBandwidth);
    $( "#stream-bandwidth" ).on( "click", "#stream-bandwidth-lower", lowerBandwidth);
});

function higherBandwidth() {
    lowQuality = false;
    if(pState==1)
    {
        createStreamPlayer();
        pState = 1;
    }
    else
    {
        createLogoPlayer();
        pState = 2;
    }
}

function lowerBandwidth() {
    lowQuality = true;
    if(pState==1)
    {
        createStreamPlayer();
        pState = 1;
    }
    else
    {
        createLogoPlayer();
        pState = 2;
    }
}

function createStreamPlayer()
{
    if (typeof player != "undefined")
    {
        player.destroy();
        pState = 0;
    }
    if(clientPhone)
    {
        streamSuffix = "-low";
    }
    else if(lowQuality)
    {
        streamSuffix = "-low";
        $("#stream-bandwidth").html(bandwidthHtml_lower);
        $("#stream-bandwidth").show();
    }
    else
    {
        streamSuffix = "";
        $("#stream-bandwidth").html(bandwidthHtml_higher);
        $("#stream-bandwidth").show();
    }
    
    plUrl = hlsSource + "/" + streamName + streamSuffix + "/index.m3u8";

    player = new Clappr.Player({
        source: plUrl,
        poster: posterPicture,
        width: '100%',
        height: '100%',
        playbackNotSupportedMessage: 'Your browser does not support this video stream.<br>Please try a different browser.',
    });
    var playerElement = $('#stream-player')[0];
    player.attachTo(playerElement);
    Clappr.Utils.canAutoPlayMedia(function(r, e)
    {
        if(r)
        {
            player.play();
        }
        else
        {
            console.log(e);
            player.mute();
            $('#stream-player').append(
                $('<div></div>')
                    .attr('id','muted-overlay')
                    .text('Click here to un-mute')
                    .click(function()
                    {
                        player.setVolume(100);
                        $('#muted-overlay').hide();
                    })
            );
            player.play();
        }
    });
}

function createLogoPlayer()
{
    if (typeof player != "undefined")
    {
        player.destroy();
        pState = 0;
    }
   
    if(clientPhone)
    {
        //$("#stream-bandwidth").hide();
    }
    else if(lowQuality)
    {
        $("#stream-bandwidth").html(bandwidthHtml_lower);
        $("#stream-bandwidth").show();
    }
    else
    {
        $("#stream-bandwidth").html(bandwidthHtml_higher);
        $("#stream-bandwidth").show();
    }
 
    player = new Clappr.Player({
        source: posterVideo,
        loop: true,
        poster: posterPicture,
        width: '100%',
        height: '100%',
        playbackNotSupportedMessage: 'Your browser does not support this video stream.<br>Please try a different browser.',
    });
    var playerElement = $('#stream-player')[0];
    player.attachTo(playerElement);
    Clappr.Utils.canAutoPlayMedia(function(r, e)
    {
        if(r)
        {
            player.play();
        }
        else
        {
            console.log(e);
            player.mute();
            player.play();
        }
    });
}

function checkPlUrl() {
    if(clientPhone)
    {
        streamSuffix = "-low";
    }
    else if(lowQuality)
    {
        streamSuffix = "-low";
    }
    else
    {
        streamSuffix = "";
    }
    plUrl = hlsSource + "/" + streamName + streamSuffix + "/index.m3u8";
    $.ajax({
        url:      plUrl,
        type:     'HEAD',
        cache:      false,
        complete:  function(xhr){
            if (xhr.status >= 200 && xhr.status < 400)
            {
                /* Playlist file exists, stream is running! */
                $("#stream-stats-status").text(statusText_active);
                
                if(pState==0 || pState == 2)
                {
                    createStreamPlayer();
                    pState = 1;
                }
                if(clientMobile)
                {
                    $("<style> svg.poster-icon { display: inline !important;} </style>").appendTo("head");
                }
            }
            else if (xhr.status == 0)
            {
                /* Request Failed - problem with server/connection */
                if(pState != 2)
                {
                    $("#stream-stats-status").html(statusHtml_connecting);
                    createLogoPlayer();
                    pState = 2;
                    if(clientMobile)
                    {
                        $("<style> svg.poster-icon { display: none !important;} </style>").appendTo("head");
                    }
                }
            }
            else
            {
                /* 404 or some other error - server is up but stream not active */
                if(pState != 2)
                {
                    $("#stream-stats-status").text(statusText_inactive);
                    createLogoPlayer();
                    pState = 2;
                    if(clientMobile)
                    {
                        $("<style> svg.poster-icon { display: none !important;} </style>").appendTo("head");
                    }
                }
            }
        }
    });
}

function isMobile()
{
    var check = false;
    (function(a,b){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
}
function isPhone()
{
    var check = false;
    (function(a,b){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
}

function selectSource()
{
    try
    {
        var param = (location.search.split('source=')[1]||'').split('&')[0];
        if (param.length>1)
            return true;
        else
            return false;
    }
    catch(err)
    {
        return false;
    }
}

function getRandomInt(min, max)
{
    return Math.floor(Math.random() * (max - min)) + min;
}
