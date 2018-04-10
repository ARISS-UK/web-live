var canvasWidth=150;
var canvasHeight=canvasWidth;
var iq_scaling = 2*(100/canvasHeight);
var iq_margin = 0.2;
var iq_el = document.getElementById('tt-monitor-constellation');
var iq_ctx = iq_el.getContext('2d');

devicePixelRatio = window.devicePixelRatio || 1,
backingStoreRatio = iq_ctx.webkitBackingStorePixelRatio ||
                    iq_ctx.mozBackingStorePixelRatio ||
                    iq_ctx.msBackingStorePixelRatio ||
                    iq_ctx.oBackingStorePixelRatio ||
                    iq_ctx.backingStorePixelRatio || 1,
iq_ratio = devicePixelRatio / backingStoreRatio;

if (devicePixelRatio !== backingStoreRatio)
{
    var oldWidth = iq_el.width;
    var oldHeight = iq_el.height;

    iq_el.width = oldWidth * iq_ratio;
    iq_el.height = oldHeight * iq_ratio;

    iq_el.style.width = oldWidth + 'px';
    iq_el.style.height = oldHeight + 'px';

    iq_ctx.scale(iq_ratio, iq_ratio);
}

function quickRound(f)
{
    return (0.5 + f) | 0;
}

function normaliseIQ(d)
{
    return ((d/(iq_scaling+(iq_margin)))+(100/iq_scaling));
}


function drawIQGrid(ctx)
{
    /* Cross */
    ctx.strokeStyle = 'grey';
    ctx.lineWidth = 1;
    
    ctx.beginPath();

    ctx.moveTo(0,           quickRound(canvasHeight/2));
    ctx.lineTo(canvasWidth, quickRound(canvasHeight/2));
    
    ctx.moveTo(quickRound(canvasWidth/2), 0);
    ctx.lineTo(quickRound(canvasWidth/2), canvasHeight);
    
    ctx.stroke();
    
    /* Box */
    ctx.strokeStyle = 'grey';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    
    ctx.moveTo(2, 2);
    ctx.lineTo(2, canvasHeight - 2);
    
    ctx.moveTo(2,               canvasHeight - 2);
    ctx.lineTo(canvasWidth - 2, canvasHeight - 2);
    
    ctx.moveTo(2,               2);
    ctx.lineTo(canvasWidth - 2, 2);
    
    ctx.moveTo(canvasWidth - 2, 2);
    ctx.lineTo(canvasWidth - 2, canvasHeight - 2);
    
    ctx.stroke();
}

function updateIQ(data)
{
    var new_canvas = document.createElement('canvas');
    new_canvas.width = canvasWidth;
    new_canvas.height = canvasHeight;
    var new_ctx = new_canvas.getContext('2d');

    /* Draw Grid Lines */
    drawIQGrid(new_ctx);

    /* Draw IQ */
    new_ctx.fillStyle='#009A00';
    new_ctx.beginPath();
    data.forEach(function(point)
    {
        new_ctx.fillRect(
            quickRound(normaliseIQ(point[0])),
            quickRound(normaliseIQ(point[1])),
            quickRound(3/iq_scaling),
            quickRound(3/iq_scaling)
        );
    });
    new_ctx.stroke();

    iq_ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    iq_ctx.drawImage(new_canvas, 0, 0);
}
