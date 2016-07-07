$(function() {
    $.stickyScroll({
        // anchor, can be div with class, section and etc.
        section:".inner",
        //section:"section",
        // disable hash argument in url bar - disable anchor view
        sectionName: false,
        // if jquery-ui with core effect is not missed , easing can be customized, otherwise easeOutExpo easing by default
        easing: "easeInOutCirc",
        // scrolling speed
        scrollSpeed: 800,
        // offest in pixels
        offset : 0,
        // scrollbar overflow body true or false
        scrollbars: false,
        // Mark Section as class which is longer than viewport to enable scrolling, otherwise ".overflow-no" by default
        markSection: "mark",
        // Enable scroll only for below elements
        ScrollElements: "",
        // If is true, section scaled per viewport
        heightToViewport: true,
        // before starting scroll
        beforeHebsScroll:function() {
            console.log('before');
        },
        // after starting scroll
        afterHebsScroll:function() {
            console.log('after');
        },
        // after resize window
        afterResizeHebsScroll:function() {
            console.log('after resize');
        },
        // after loading document
        afterRenderHebsScroll:function() {
            console.log('after render');
        }
    });

    $(".scroll").click(function(e) {
        e.preventDefault();
        $.stickyScroll.next();
    });
});
