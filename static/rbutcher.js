// Renders the contents of <noscript> tags, which are treated as raw text by
// browsers with JavaScript support. Optionally, provide a transform function
// for the raw HTML, allowing it to be changed before being added to the DOM.
$.fn.noscript = function(transform) {
    if (transform === undefined) {
        transform = function(html) {
            return html;
        }
    }
    this.find('noscript').each(function() {
        var $noscript = $(this),
            html = transform($noscript.text()),
            $contents = $('<div>' + html + '</div>').contents();
        $contents.insertAfter($noscript);
        $noscript.remove()
    })
    return this;
};


// Handles lazy loading of images within the gallery.
$.fn.lazyImage = function() {
    var $a = $(this),
        $img = $a.children('img');

    if ($img.attr('src') === undefined) {
        if ($img.length) {
            // There is an image with a data-src attribute. Copy its
            // information into the <a> element and then remove it.
            // The image will be recreated later on, when the user
            // needs to view it.
            var alt = $img.attr('alt'),
                src = $img.attr('data-src'),
                width = $img.attr('width'),
                height = $img.attr('height');

            $a.attr({
                'title': alt,
                'data-img-src': src,
                'data-img-ratio': parseInt(width) / parseInt(height)
            }).css({
                width: width + 'px',
                height: height + 'px'
            })

            $img.remove()
        } else {
            // Display the image.
            var src = $a.attr('data-img-src'),
                width = $a.width(),
                height = $a.height(),
                idealSrc = flickrURL(src, width, height)
            $a.append(
                $('<img>').attr({
                    alt: $a.attr('title'),
                    src: idealSrc,
                    width: width + 2 // fix for safari
                })
            )
        }
    }
    return this;
}


$.fn.resizeImage = function() {
    var $this = $(this)
    if ($this.is('a')) {
        var $a = $this
        $a.find('img').each(function() {
            var $img = $(this),
                src = $img.attr('src'),
                width = $a.width(),
                height = $a.height(),
                idealSrc = flickrURL(src, width, height)
            if (src != idealSrc) {
                $img.attr('src', idealSrc)
            }
        })
    } else if ($this.is('img')) {
        var src = $this.attr('src'),
            idealSrc = flickrURL(src, $this.width(), $this.height())
        if (src != idealSrc) {
            $this.attr('src', idealSrc)
        }
    } else if (this.length) {
        console.log("unexpected element for resizeImage", this)
        throw "unexpected element for resizeImage"
    }
    return this
}


// Run when the document is ready.
$(function() {

    var $window = $(window);

    $('#gallery')
        // Remove the CSS for browsers without JS support.
        .removeClass('noscript')

        // Render the HTML in the noscript tag, but swap out the
        // image src attributes to avoid downloading the images.
        // This data-src attribute is used by lazyImage().
        .noscript(function(html) {
            return html.replace(/ src=/g, ' data-src=')
        })

        // Process each link and associated image.
        .find('a')
            .each(function() {
                $(this)
                    // Enable lazy loading of this link's image.
                    .lazyImage()
                    // Add a callback for when the page
                    // is scrolled down near this link.
                    .scrollo(function() {
                        // Force this link's image to load.
                        this.el.lazyImage()
                    }, 100)
            })
        .end()

        // Enable the image grid, to display all photos in a grid layout.
        .imgrid({
            selector: 'a',
            rowHeight: 400
        })
        .find('a')
            .each(function() {
                $(this).resizeImage()
            })
        .end()
        .on('resize.imgrid', function() {
            $(this).find('a').each(function() {
                $(this).resizeImage()
            })
            $window.scrollo()
        })

        // Enable lightbox functionality for the photos.
        .magnificPopup({
            delegate: 'a',
            type: 'image',
            closeOnContentClick: true,
            closeBtnInside: false,
            preloader: false,
            callbacks: {
                elementParse: function(item) {
                    var src = item.el.attr('data-img-src'),
                        ratio = parseFloat(item.el.attr('data-img-ratio')),
                        height = $window.height(),
                        width = height * ratio
                    item.src = flickrURL(src, width, height)
                }
            },
            image: {
                verticalFit: true
            },
            gallery: {
                enabled: true,
                navigateByImgClick: false,
                preload: [1, 2]
            },
            zoom: {
                enabled: true
            }
        })
        .on('mfpAfterChange mfpResize', function(event) {
            // Update the lightbox images to use the best URLs for their sizes.
            $.each($.magnificPopup.instance.items, function(index, item) {
                if (item.el && this.src) {
                    $.magnificPopup.instance.st.callbacks.elementParse(item)
                }
            })
            // Update the currently visible image.
            $('img.mfp-img').each(function() {
                $(this).attr('src', $.magnificPopup.instance.currItem.src)
            })
        })
});
