(function() {

    var $window = $(window),
        callbacks = [],
        resort = false,
        timer = null;

    function sortCallbacks() {
        callbacks.sort(function(a, b) {
            var aTop = a.$el.offset().top - a.padding,
                bTop = b.$el.offset().top - b.padding;
            return aTop - bTop;
        });
        resort = false;
    }

    function onScroll() {
        var windowBottom = $window.scrollTop() + $window.height();

        if (resort) {
            sortCallbacks();
        }

        while (callbacks.length) {
            var item = callbacks[0],
                itemTop = item.$el.offset().top;
            if (itemTop - item.padding > windowBottom) {
                break
            }
            item.callback();
            callbacks.splice(0, 1);
        }

        if (callbacks.length == 0) {
            $window.off('scroll.onScroll');
        }
    }

    $.fn.onScroll = function(callback, padding) {

        resort = true;

        if (callback != 'resort') {

            callbacks.push({
                $el: $(this),
                callback: callback,
                padding: padding || 0
            });

            if (callbacks.length == 1) {
                $window.on('scroll.onScroll', onScroll);
            }

        }

        clearTimeout(timer);
        timer = setTimeout(onScroll, 1);

        return this;
    }

})();
