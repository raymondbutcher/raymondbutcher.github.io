// Generate the ideal Flickr URL based on the dimensions.
function flickrURL(url, width, height) {
    /*
    s	small square 75x75
    q	large square 150x150
    t	thumbnail, 100 on longest side
    m	small, 240 on longest side
    n	small, 320 on longest side
    -	medium, 500 on longest side
    z	medium 640, 640 on longest side
    c	medium 800, 800 on longest side†
    b	large, 1024 on longest side*
    h	large 1600, 1600 on longest side†
    k	large 2048, 2048 on longest side†
    o	original image, either a jpg, gif or png, depending on source format
    */

    var longestSide = Math.max(width, height),
        idealSize = null

    for (var i=0; i<flickrSizes.length-1; i++) {
        var nextSize = flickrSizes[i+1];
        if (longestSide >= nextSize.num) {
            idealSize = flickrSizes[i]
            break
        }
    }
    if (idealSize === null) {
        idealSize = flickrSizes[flickrSizes.length-1]
    }

    return url.replace(/(_.)?\.jpg$/i, idealSize.suffix + '.jpg')
}

var flickrSizes = [
    //{num: 2048, suffix: '_k'},
    //{num: 1600, suffix: '_h'},
    {num: 1024, suffix: '_b'},
    //{num: 800, suffix: '_c'},
    {num: 640, suffix: '_z'},
    {num: 500, suffix: ''},
    {num: 320, suffix: '_n'},
    {num: 240, suffix: '_m'},
    {num: 100, suffix: '_t'},
];
