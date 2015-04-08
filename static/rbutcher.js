/*
The image tags are being placed inside a noscript tag, making
this page work with crawlers and browsers with JavaScript disabled.

For browsers with JavaScript enabled, the noscript tag prevents
the images from being downloaded, at least until they're added
to the DOM via JavaScript.

This script will append the images to the DOM lazily when the user
scrolls down. This avoids downloading megabytes of images until
required, while still degrading nicely when there is no JavaScript
support.
*/

// Remove and return an element from a jQuery object.
$.fn.pop = function(index) {
    if (index == null) index = this.length;
    var el = this.get(index);
    this.splice(index, 1);
    return $(el);
}
$.fn.popRandom = function() {
    return this.pop(
        Math.floor(Math.random() * this.length)
    );
}

// Run when the document is ready.
$(function() {

    var $photos = $('#photos');

    // Extract the noscript text (it is text, not DOM elements).
    var html = $photos.find('noscript').text();

    // Swap out the src attributes to avoid downloading the images.
    var htmlNoDownload = html.replace(/ src=/g, ' data-src=');

    // Create a queue of DOM elements, each a photo.
    var $queue = $('<div>' + htmlNoDownload + '</div>').children();

    // Find the smallest height value from all of the photos
    // and use that as the minimum height in the gallery.
    var minHeight = (function() {
        var min = null;
        $queue.find('img').each(function() {
            var height = parseInt($(this).attr('height'));
            if (min == null || height < min) {
                min = height;
            }
        });
        return min;
    })();

    // Initialize the gallery, even though there are no photos yet.
    $photos.justifiedGallery({
        lastRow: 'hide',
        margins: 0,
        rowHeight: minHeight,
        sizeRangeSuffixes: {
            'lt100':'_t',
            'lt240':'_m',
            'lt320':'_n',
            'lt500':'',
            'lt640':'_z',
            'lt1024':'_b'
        },
        waitThumbnailsLoad: false
    });

    // This adds one random photo from the queue.
    // Returns true if successful, else false.
    function addPhoto() {
        var $photo = $queue.popRandom();

        if ($photo.length == 0) {
            return false;
        }

        // Restore the src attribute so it downloads and displays.
        var $img = $photo.find('img');
        $img.attr('src', $img.data('src'));

        $photos.append($photo);

        return true;
    }

    // Add photos when scrolled near to the bottom of the window.
    $(window).on('scroll.rb', function(){
        while ($(window).height() + $(window).scrollTop()
                >= $(document).height() - minHeight*1.5) {
            // Add a photo.
            if (addPhoto()) {
                // It returned true, there are more photos left. so update the gallery positions.
                $photos.justifiedGallery('norewind');
            } else {
                // Out of photos, so stop it.
                $(window).off('scroll.rb');
                break;
            }
        }
    }).scroll();
});
