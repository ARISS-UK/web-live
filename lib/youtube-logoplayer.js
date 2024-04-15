let player = null;

const posterPicture = "/images/webcast-poster.jpg";
const posterVideo = "/images/webcast-poster.mp4";

function createLogoPlayer(el)
{
    if (player != null)
    {
        player.destroy();
    }
 
    player = new Clappr.Player({
        source: posterVideo,
        loop: true,
        poster: posterPicture,
        width: '100%',
        height: '100%',
        playbackNotSupportedMessage: 'Your browser does not support this video stream.<br>Please try a different browser.',
    });

    let playerElement = el;

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

function destroyLogoPlayer()
{
    if(player != null)
    {
        player.destroy();
    }
}