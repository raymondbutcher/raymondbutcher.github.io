/*
The image tags are being placed inside a noscript tag, making
this page work with crawlers and browsers without JavaScript support.

For browsers with JavaScript support, the noscript tag prevents the images
from being rendered and downloaded. This script moves the images into the DOM,
but changes the image URL to a tiny transparent image. When the user scrolls
down the page, the image URLs are swapped to the real ones, and the images
are displayed as normal.
*/


$.fn.pop = function(index) {
    if (index == null) index = this.length;
    var el = this.get(index);
    this.splice(index, 1);
    return $(el);
};
$.fn.popRandom = function() {
    return this.pop(
        Math.floor(Math.random() * this.length)
    );
};
$.fn.shuffled = function() {
    var $new = $('<div>');
    while (this.length) {
        $new.append(this.popRandom());
    }
    return $new.children();
}


// Loads a <noscript> tag, which is treated as raw text by the browser,
// into a new <div> element. Optionally, provide a transform function
// for the raw text, allowing it to be changed before being turned into
// DOM elements.
$.fn.noscript = function(transform) {
    var html = this.find('noscript').text();
    if (transform) {
        html = transform(html);
    }
    return $('<div>' + html + '</div>');
};


// Renders an element as a gallery.
// Todo: split into separate file and improve structure big time.
$.fn.renderGallery = function(options) {
    var $gallery = $(this),
        galleryWidth = $gallery.width(),
        rowHeight = options['rowHeight'],
        selector = options['selector'];

    if (isNaN(rowHeight)) {
        throw 'Invalid number for rowHeight';
    }

    var newRow = function() {
        return {
            items: [],
            width: 0,
            // Add to end of items.
            push: function($el) {
                var width = parseFloat($el.attr('data-img-width')),
                    ratio = parseFloat($el.attr('data-img-ratio')),
                    newWidth = rowHeight * ratio;
                this.width += newWidth;
                this.items.push($el);
            },
            // Remove last item.
            pop: function() {
                var $el = this.items.pop(),
                    width = parseFloat($el.attr('data-img-width')),
                    ratio = parseFloat($el.attr('data-img-ratio')),
                    newWidth = rowHeight * ratio;
                this.width -= newWidth;
                return $el;
            },
            // Remove first item.
            shift: function() {
                var $el = this.items.shift(),
                    width = parseFloat($el.attr('data-img-width')),
                    ratio = parseFloat($el.attr('data-img-ratio')),
                    newWidth = rowHeight * ratio;
                this.width -= newWidth;
                return $el;
            },
            // Add to start of items.
            unshift: function($el) {
                var width = parseFloat($el.attr('data-img-width')),
                    ratio = parseFloat($el.attr('data-img-ratio')),
                    newWidth = rowHeight * ratio;
                this.width += newWidth;
                this.items.unshift($el);
            },
            ratio: function() {
                return galleryWidth / this.width;
            },
            render: function() {
                var imgHeight = rowHeight * this.ratio(galleryWidth),
                    widthRemaining = galleryWidth;
                for (var i=0; i<this.items.length; i++) {
                    var $el = $(this.items[i]);

                    // Safari has issues with non-integer sizes, so round all
                    // of the widths up, and then make te last item use up the
                    // remaining available space.
                    if (i == this.items.length - 1) {
                        // Last item in the row.
                        imgWidth = widthRemaining;
                    } else {
                        imgRatio = parseFloat($el.attr('data-img-ratio'));
                        imgWidth = Math.ceil(imgHeight * imgRatio);
                        widthRemaining -= imgWidth;
                    }

                    $el.css('width', imgWidth).css('height', parseInt(imgHeight));
                    if ($el.is('img')) {
                        $el.attr('width', imgWidth).attr('height', imgHeight);
                    } else {
                        $el.find('img').each(function() {
                            $(this).attr('width', imgWidth).attr('height', imgHeight);
                        });
                    }
                }
            }
        }
    }

    var newGallery = function($items) {

        var gallery = {
            push: function($el) {
                // Add an image to the gallery.
                this.row.push($el);
                if (this.row.width > galleryWidth) {
                    this.flush();
                }
            },
            flush: function() {
                // Move onto the next row.
                this.rows.push(this.row);
                this.row = newRow();
            },
            balance: function() {
                // Ensure that the last row looks OK.
                var lastRow = this.rows[this.rows.length - 1],
                    prevRow = this.rows[this.rows.length - 2];
                for (var i=0; i<5; i++) {
                    if (lastRow.items.length == prevRow.items.length) {
                        // The same number of images per row is fine,
                        // even if the image sizes are quite different.
                        break;
                    }
                    var ratio = lastRow.width / prevRow.width;
                    if (i > 2) {
                        // Log unexpected behaviour. I have not seen
                        // this get logged since changing this logic.
                        console.log(
                            'Unexpected row sizes',
                            prevRow.items.length,
                            lastRow.items.length,
                            ratio
                        );
                    }
                    if (ratio > 0.6) {
                        // The last row is easily more than half of the
                        // size of the row before it. It's fine.
                        break;
                    } else if (ratio < 0.45) {
                        // The last row is quite small compared to the row
                        // before it. Move an image down into the last row.
                        lastRow.push(prevRow.pop());
                    } else {
                        // The last row is roughly half of the size of the
                        // row before it. Move an image up into the previous
                        // row. This probably leaves the last row empty.
                        prevRow.push(lastRow.shift());
                        if (lastRow.items.length == 0) {
                            break;
                        }
                    }
                }
            },
            render: function() {
                this.rows = []
                this.row = newRow()
                $items.each(function() {
                    gallery.push($(this));
                });
                if (this.row.items.length) {
                    this.flush();
                }
                this.balance();
                $.each(this.rows, function() {
                    this.render(this.width, rowHeight);
                });
            }
        };

        var resizeTimer = null;
        $(window).on('resize', function() {
            $gallery.css('width', galleryWidth + 'px');
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                $gallery.css('width', '');
                galleryWidth = $gallery.width();
                gallery.render();
                $gallery.trigger('resize.gallery');
            }, 500);
        })

        return gallery;

    };

    var gallery = newGallery($gallery.find(selector));
    gallery.render();

    return this;
}


// Run when the document is ready.
$(function() {

    var $gallery = $('#gallery');

    $gallery
        .noscript(function(html) {
            return html.replace(/ src=/g, ' data-src=');
        })
        .find('a')
        .shuffled()
        .each(function() {
            var $a = $(this),
                $img = $a.find('img'),
                alt = $img.attr('alt'),
                src = $img.attr('data-src'),
                width = parseInt($img.attr('width')),
                height = parseInt($img.attr('height')),
                ratio = width / height;

            $a.css('width', width + 'px');
            $a.css('height', height + 'px');
            $a.attr('data-img-width', width);
            $a.attr('data-img-ratio', ratio);
            $a.attr('title', alt);

            $img.remove();

            $a.onScroll(function() {
                $('<img>').attr({
                    alt: alt,
                    src: src,
                    width: $a.width(),
                    height: $a.height()
                }).appendTo($a);
            }, 100);

            $gallery.append($a);
        });

    $gallery.renderGallery({
        selector: 'a',
        rowHeight: 400
    });

    $gallery.on('resize.gallery', function() {
        $gallery.onScroll('resort');
    });

});
