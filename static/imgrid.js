// Todo: improve structure big time.
$.fn.imgrid = function(options) {
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
                    // of the widths up, and then make the last item use up the
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

                    imgWidth += 2; // fix for safari

                    if ($el.is('img')) {
                        $el.attr('width', imgWidth);
                    } else {
                        $el.find('img').each(function() {
                            $(this).attr('width', imgWidth);
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
                        if (lastRow.items.length == 1) {
                            prevRow.push(lastRow.shift());
                        } else {
                            // There are 2 or more items on the last row.
                            // Reducing it to 1 item is a bad idea and
                            // only seems to happen in rare cases, and it
                            // leads to a situation where the loop keeps
                            // moving and image between the 2 rows.
                            // So do nothing.
                        }
                        break;
                    }
                }
            },
            render: function() {
                $gallery.css('width', galleryWidth + 'px');
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
        $(window).on('resize resized', function() {
            $gallery.css('width', galleryWidth + 'px');
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                $gallery.css('width', '100%');
                galleryWidth = $gallery.width();
                gallery.render();
                $gallery.trigger('resize.imgrid');
            }, 500);
        })

        return gallery;

    };

    var gallery = newGallery($gallery.find(selector));
    gallery.render();

    return this;
}
