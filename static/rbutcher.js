/*
The image tags are being placed inside a noscript tag, making
this page work with crawlers and browsers without JavaScript support.

For browsers with JavaScript support, the noscript tag prevents the images
from being rendered and downloaded. This script moves the images into the DOM,
but changes the image URL to a tiny transparent image. When the user scrolls
down the page, the image URLs are swapped to the real ones, and the images
are displayed as normal.
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

// Fetch the DOM elements from a <noscript> tag, which is treated as raw text
// by the browser. Optionally, provide a transform function for the raw text,
// allowing it to be changed before being turned into DOM elements.
$.fn.noscript = function(transform) {
    var html = this.find('noscript').text();
    if (transform) {
        html = transform(html);
    }
    return $('<div>' + html + '</div>').children();
}

// Run when the document is ready.
$(function() {
    var $gallery = $('#gallery');

    // Move the <noscript> photos into the DOM.
    var $photos = $gallery.noscript(function(html) {
        // Enable lazy loading.
        return html.replace(/ src=/g, ' src="./static/transparent.gif" class="lazy" data-src=');
    });
    while ($photos.length) {
        $gallery.append($photos.popRandom());
    }

    var rowHeight = 300;

    // Initialize the gallery, even though there are no photos in it yet.
    $gallery.justifiedGallery({
        lastRow: 'hide',
        margins: 0,
        rowHeight: 300,
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

    var $window = $(window);

    // Add photos to the gallery when scrolled near to the bottom of the page.
    $window.on('scroll.rb', function(){
        var loadLine = $window.scrollTop() + $window.height() + rowHeight/2,
            loaded = false;
        while (true) {
            var $img = $gallery.find('img.lazy').first();

            if ($img.length == 0) {
                // All images have been loaded.
                $(window).off('scroll.rb');
                break;
            }

            if ($img.offset().top > loadLine) {
                // Still hidden, stop checking.
                break;
            }

            // Load the real image.
            $img.attr('src', $img.data('src'));
            $img.data('jg.loaded', false);
            $img.removeClass('lazy');
            loaded = true;
        }
        if (loaded) {
            $gallery.justifiedGallery();
        }
    }).scroll();
});
