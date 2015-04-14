(function() {

    var $window = $(window),
        scrolled = false,
        sort = false,
        interval = 100;

    var events = {
        // Start event handlers for running callbacks on scroll events.
        start: function() {
            $window.on('scroll.scrollo resize.scrollo', function() {
                scrolled = true;
            });
            events.interval = setInterval(function() {
                if (scrolled) {
                    scrolled = false;
                    if (sort) {
                        sort = false;
                        callbacks.sort();
                    }
                    callbacks.run();
                    if (callbacks.items.length == 0) {
                        events.stop();
                    }
                }
            }, interval);
        },
        // Stop event handlers.
        stop: function() {
            $window.off('scroll.scrollo resize.scrollo');
            clearInterval(events.interval);
        },

    }

    var callbacks = {
        items: [],
        // Add a callback item.
        add: function(item) {
            callbacks.items.push(item);
        },
        // Sort callback items by vertical position.
        sort: function() {
            callbacks.items.sort(function(a, b) {
                var aTop = a.el.offset().top - a.padding,
                    bTop = b.el.offset().top - b.padding;
                return aTop - bTop;
            });
        },
        // Run the callbacks of any items above the current scroll position.
        run: function() {
            var windowBottom = $window.scrollTop() + $window.height();
            while (callbacks.items.length) {
                var item = callbacks.items[0],
                    itemTop = item.el.offset().top;
                if (itemTop - item.padding > windowBottom) {
                    // This item is further down the page than the current
                    // scroll position. Stop now, because the remaining items
                    // will only be further down the page, as they are sorted.
                    break
                }
                // Run the callback function.
                item.callback();
                // Remove this callback item from the list.
                callbacks.items.splice(0, 1);
            }
        }
    }

    $.fn.scrollo = function(callback, padding) {
        sort = true;
        scrolled = true;

        if (callback === undefined) {
            return;
        }

        callbacks.add({
            el: $(this),
            callback: callback,
            padding: padding || 0
        });

        if (callbacks.items.length == 1) {
            events.start()
        }

        return this;
    }

})();
