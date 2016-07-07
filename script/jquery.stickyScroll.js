// Jquery plugin HebsScroll

(function ($,window,document,undefined) {
    "use strict";
    var heights = [],
        names = [],
        elements = [],
        overflow = [],
        index = 0,
        MainIndx = 1,
        hasLocation = false,
        timeoutId,
        timeoutId2,
        top = $(window).scrollTop(),
        scrollable = false,
        locked = false,
        scrolled = false,
        manualScroll,
        scrollBar,
        swipeHebs,
        util,
        disabled = false,
        scrollSamples = [],
        scrollTime = new Date().getTime(),
        firstLoad = true,
        settings = {
            section: "section",
            sectionName: "section-name",
            easing: "easeOutExpo",
            scrollSpeed: 1100,
            offset : 0,
            scrollbars: true,
            markSection: "overflow-no",
            axis:"y",
            target:"html,body",
            ScrollElements: false,
            heightToViewport: true,
            beforeHebsScroll:function() {},
            afterHebsScroll:function() {},
            afterResizeHebsScroll:function() {},
            afterRenderHebsScroll:function() {}
        };
    function animateHebsScroll(index,instant,callbacks) {
        if(disabled===true) {
            return true;
        }
        if(names[index]) {
            scrollable = false;
            if(callbacks) {
                settings.beforeHebsScroll(index,elements);
            }
            MainIndx = 1;
            if(settings.sectionName && !(firstLoad===true && index===0)) {
                if(history.pushState) {
                    try {
                        history.replaceState(null, null, names[index]);
                    } catch (e) {
                        if(window.console) {
                            console.warn("HebsScroll warning");
                        }
                    }

                } else {
                    window.location.hash = names[index];
                }
            }
            if(instant) {
                $(settings.target).stop().scrollTop(heights[index]);
                if(callbacks) {
                    settings.afterHebsScroll(index,elements);
                    var s = $(window).scrollTop();
                    if(s == 2404) {
                        scrollBar.overflowVisible();
                    }
                    else {
                        scrollBar.overflowHidden();
                    }
                }
            } else {
                locked = true;
                $(settings.target).stop().animate({
                    scrollTop: heights[index]
                }, settings.scrollSpeed,settings.easing);

                if(window.location.hash.length) {
                    if($(window.location.hash).length && window.console) {
                        console.warn("HebsScroll warning: There are IDs on the page that match the hash value - this will cause the page to anchor.");
                    }
                }
                $(settings.target).promise().done(function(){
                    locked = false;
                    firstLoad = false;
                    if(callbacks) {
                        settings.afterHebsScroll(index,elements);
                        var s = $(window).scrollTop();

                        if(isScrolledIntoView($('.' + settings.markSection), s)) {
                            scrollBar.overflowVisible();
                        }
                        else {
                            scrollBar.overflowHidden();
                        }
                    }
                });
            }
        }
    }

    function isScrolledIntoView(elem, s) {
        var docViewTop = $(window).scrollTop();
        var docViewBottom = docViewTop + $(window).height();
        var elemTop = $(elem).offset().top;
            if((elemTop <= docViewBottom) && (elemTop >= docViewTop) && s == elemTop) {
                return ((elemTop <= docViewBottom) && (elemTop >= docViewTop));
            }
    }

    function isAccelerating(samples) {

        if(samples<4) {
            return false;
        }
        var limit = 20,sum = 0,i = samples.length-1,l;
        if(samples.length<limit*2) {
            limit = Math.floor(samples.length/2);
        }
        l = samples.length-limit;
        for(;i>=l;i--) {
            sum = sum+samples[i];
        }
        var average1 = sum/limit;

        sum = 0;
        i = samples.length-limit - 1;
        l = samples.length-(limit * 2);
        for(;i >= l; i--) {
            sum = sum+samples[i];
        }
        var average2 = sum/limit;

        if(average1 >= average2) {
            return true;
        } else {
            return false;
        }
    }
    $.stickyScroll = function(options) {
        $.easing['easeOutExpo'] = function(x, t, b, c, d) {
            return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
        };

        scrollBar = {
            overflowHidden:function() {
              $('body').css({overflow: 'hidden'});
                console.warn('hidden Scrollbar')
            },
            overflowVisible:function() {
                $('body').css({overflow: 'visible'});
                console.info('visible Scrollbar');
            }
        };

        manualScroll = {
            handleMousedown:function() {
                if(disabled===true) {
                    return true;
                }
                scrollable = false;
                scrolled = false;
            },
            handleMouseup:function() {
                if(disabled===true) {
                    return true;
                }
                scrollable = true;
                if(scrolled) {
                    manualScroll.calculateNearest();
                }
            },
            handleScroll:function() {
                if(disabled===true) {
                    return true;
                }
                if(timeoutId){
                    clearTimeout(timeoutId);
                }
                timeoutId = setTimeout(function(){

                    scrolled = true;
                    if(scrollable===false) {
                        return false;
                    }
                    scrollable = false;
                    manualScroll.calculateNearest();

                }, 200);
            },
            calculateNearest:function() {
                top = $(window).scrollTop();
                var i =1,
                    max = heights.length,
                    closest = 0,
                    prev = Math.abs(heights[0] - top),
                    diff;
                for(;i<max;i++) {
                    diff = Math.abs(heights[i] - top);

                    if(diff < prev) {
                        prev = diff;
                        closest = i;
                    }
                }
                if(atBottomPage() || atTopPage()) {
                    index = closest;
                    animateHebsScroll(closest,false,true);
                }
            },
            wheelHandler:function(e,delta) {
                if(disabled===true) {
                    return true;
                } else if(settings.ScrollElements) {
                    if($(e.target).is(settings.ScrollElements) || $(e.target).closest(settings.ScrollElements).length) {
                        return true;
                    }
                }
                if(!overflow[index]) {
                    e.preventDefault();
                }
                var currentScrollTime = new Date().getTime();
                delta = delta || -e.originalEvent.detail / 3 || e.originalEvent.wheelDelta / 120;


                if((currentScrollTime-scrollTime) > 1300){
                    scrollSamples = [];
                }
                scrollTime = currentScrollTime;

                if(scrollSamples.length >= 35){
                    scrollSamples.shift();
                }
                scrollSamples.push(Math.abs(delta*10));

                if(locked) {
                    return false;
                }

                if(delta<0) {
                    if(index<heights.length-1) {
                        if(atBottomPage()) {
                            if(isAccelerating(scrollSamples)) {
                                e.preventDefault();
                                index++;
                                locked = true;
                                animateHebsScroll(index,false,true);
                            } else {
                                return false;
                            }
                        }
                    }
                } else if(delta>0) {
                    if(index>0) {
                        if(atTopPage()) {
                            if(isAccelerating(scrollSamples)) {
                                e.preventDefault();
                                index--;
                                locked = true;
                                animateHebsScroll(index,false,true);
                            } else {
                                return false
                            }
                        }
                    }
                }

            },
            // if use keys
            keyHandler:function(e) {
                if(disabled===true) {
                    return true;
                }
                if(e.keyCode==38 || e.keyCode==37) {
                    if(index>0) {
                        if(atTopPage()) {
                            index--;
                            animateHebsScroll(index,false,true);
                        }
                    }
                } else if(e.keyCode==40 || e.keyCode==39) {
                    if(index<heights.length-1) {
                        if(atBottomPage()) {
                            index++;
                            animateHebsScroll(index,false,true);
                        }
                    }
                }
            },
            init:function() {
                if(settings.scrollbars) {
                    $(window).bind('mousedown', manualScroll.handleMousedown);
                    $(window).bind('mouseup', manualScroll.handleMouseup);
                    $(window).bind('scroll', manualScroll.handleScroll);
                    console.info('visible Scrollbar')
                } else {
                    scrollBar.overflowHidden();
                    var viewportHeight = $(window).height();
                    $(settings.section).each(function(i) {
                        if (viewportHeight < $(this).height()) {
                            $(this).addClass(settings.markSection);
                            var distanceToTop = $(this).offset().top;
                            $(this).attr('data-distance', distanceToTop)
                        }
                    });
                }

                $(document).bind('DOMMouseScroll mousewheel',manualScroll.wheelHandler);
                $(document).bind('keydown', manualScroll.keyHandler);
            }
        };

        // for gadgets

        swipeHebs = {
            touches : {
                "touchstart": {"y":-1,"x":-1},
                "touchmove" : {"y":-1,"x":-1},
                "touchend"  : false,
                "direction" : "undetermined"
            },
            options:{
                "distance" : 30,
                "timeGap" : 800,
                "timeStamp" : new Date().getTime()
            },
            touchHandler: function(event) {
                if(disabled===true) {
                    return true;
                } else if(settings.ScrollElements) {
                    if($(event.target).is(settings.ScrollElements) || $(event.target).closest(settings.ScrollElements).length) {
                        return true;
                    }
                }
                var touch;
                if (typeof event !== 'undefined'){
                    if (typeof event.touches !== 'undefined') {
                        touch = event.touches[0];
                        switch (event.type) {
                            case 'touchstart':
                                swipeHebs.touches.touchstart.y = touch.pageY;
                                swipeHebs.touches.touchmove.y = -1;

                                swipeHebs.touches.touchstart.x = touch.pageX;
                                swipeHebs.touches.touchmove.x = -1;

                                swipeHebs.options.timeStamp = new Date().getTime();
                                swipeHebs.touches.touchend = false;
                            case 'touchmove':
                                swipeHebs.touches.touchmove.y = touch.pageY;
                                swipeHebs.touches.touchmove.x = touch.pageX;
                                if(swipeHebs.touches.touchstart.y!==swipeHebs.touches.touchmove.y && (Math.abs(swipeHebs.touches.touchstart.y-swipeHebs.touches.touchmove.y)>Math.abs(swipeHebs.touches.touchstart.x-swipeHebs.touches.touchmove.x))) {
                                    //if(!overflow[index]) {
                                    event.preventDefault();
                                    //}
                                    swipeHebs.touches.direction = "y";
                                    if((swipeHebs.options.timeStamp+swipeHebs.options.timeGap)<(new Date().getTime()) && swipeHebs.touches.touchend == false) {

                                        swipeHebs.touches.touchend = true;
                                        if (swipeHebs.touches.touchstart.y > -1) {

                                            if(Math.abs(swipeHebs.touches.touchmove.y-swipeHebs.touches.touchstart.y)>swipeHebs.options.distance) {
                                                if(swipeHebs.touches.touchstart.y < swipeHebs.touches.touchmove.y) {

                                                    swipeHebs.up();

                                                } else {
                                                    swipeHebs.down();

                                                }
                                            }
                                        }
                                    }
                                }
                                break;
                            case 'touchend':
                                if(swipeHebs.touches[event.type]===false) {
                                    swipeHebs.touches[event.type] = true;
                                    if (swipeHebs.touches.touchstart.y > -1 && swipeHebs.touches.touchmove.y > -1 && swipeHebs.touches.direction==="y") {

                                        if(Math.abs(swipeHebs.touches.touchmove.y-swipeHebs.touches.touchstart.y)>swipeHebs.options.distance) {
                                            if(swipeHebs.touches.touchstart.y < swipeHebs.touches.touchmove.y) {
                                                swipeHebs.up();

                                            } else {
                                                swipeHebs.down();

                                            }
                                        }
                                        swipeHebs.touches.touchstart.y = -1;
                                        swipeHebs.touches.touchstart.x = -1;
                                        swipeHebs.touches.direction = "undetermined";
                                    }
                                }
                            default:
                                break;
                        }
                    }
                }
            },
            down: function() {
                if(index<=heights.length-1) {
                    if(atBottomPage() && index<heights.length-1) {

                        index++;
                        animateHebsScroll(index,false,true);
                    } else {
                        if(Math.floor(elements[index].height()/$(window).height())>MainIndx) {

                            interHebsScroll(parseInt(heights[index])+($(window).height()*MainIndx));
                            MainIndx += 1;

                        } else {
                            interHebsScroll(parseInt(heights[index])+(elements[index].height()-$(window).height()));
                        }

                    }
                }
            },
            up: function() {
                if(index>=0) {
                    if(atTopPage() && index>0) {

                        index--;
                        animateHebsScroll(index,false,true);
                    } else {

                        if(MainIndx>2) {

                            MainIndx -= 1;
                            interHebsScroll(parseInt(heights[index])+($(window).height()*MainIndx));

                        } else {

                            MainIndx = 1;
                            interHebsScroll(parseInt(heights[index]));
                        }
                    }

                }
            },
            init: function() {
                if (document.addEventListener) {
                    document.addEventListener('touchstart', swipeHebs.touchHandler, false);
                    document.addEventListener('touchmove', swipeHebs.touchHandler, false);
                    document.addEventListener('touchend', swipeHebs.touchHandler, false);
                }
            }
        };

        util = {
            handleResize:function() {
                clearTimeout(timeoutId2);
                timeoutId2 = setTimeout(function() {
                    sizePanels();
                    calculatePositions(true);
                    settings.afterResizeHebsScroll();
                },400);
            }
        };
        settings = $.extend(settings, options);

        sizePanels();

        calculatePositions(false);

        if(true===hasLocation) {
            animateHebsScroll(index,false,true);
        } else {
            animateHebsScroll(0,true,true);
        }

        manualScroll.init();
        swipeHebs.init();

        $(window).bind("resize",util.handleResize);
        if (document.addEventListener) {
            window.addEventListener("orientationchange", util.handleResize, false);
        }

        function interHebsScroll(pos) {
            $(settings.target).stop().animate({
                scrollTop: pos
            }, settings.scrollSpeed,settings.easing);
        }

        function sizePanels() {
            $(settings.section).each(function(i) {
                if($(this).css("height","auto").outerHeight()<$(window).height()) {
                    if(settings.heightToViewport) {
                        $(this).css({"height":$(window).height()});
                    }
                    overflow[i] = false;
                } else {
                    if(settings.heightToViewport) {
                        $(this).css({"height":$(this).height()});
                    }
                    overflow[i] = true;
                }
            });
        }
        function calculatePositions(resize) {
            $(settings.section).each(function(i){
                if(i>0) {
                    heights[i] = parseInt($(this).offset().top) + settings.offset;
                } else {
                    heights[i] = parseInt($(this).offset().top);
                }
                if(settings.sectionName && $(this).data(settings.sectionName)) {
                    names[i] = "#" + $(this).data(settings.sectionName).replace(/ /g,"-");
                } else {
                    names[i] = "#" + (i + 1);
                }

                elements[i] = $(this);

                if($(names[i]).length && window.console) {
                    console.warn("HebsScroll warning - ID!!!");
                }
                if(window.location.hash===names[i]) {
                    index = i;
                    hasLocation = true;

                }
            });

            if(true===resize) {
                animateHebsScroll(index,false,false);
            } else {
                settings.afterRenderHebsScroll();
            }
        }

        function atTopPage() {
            top = $(window).scrollTop();
            if(top>parseInt(heights[index])) {
                return false;
            } else {
                return true;
            }
        }
        function atBottomPage() {
            top = $(window).scrollTop();
            if(top<parseInt(heights[index])+(elements[index].height()-$(window).height())) {
                return false;
            } else {
                return true;
            }
        }
    };

    function move(panel,instant) {
        var z = names.length;
        for(;z>=0;z--) {
            if(typeof panel === 'string') {
                if (names[z]===panel) {
                    index = z;
                    animateHebsScroll(z,instant,true);
                }
            } else {
                if(z===panel) {
                    index = z;
                    animateHebsScroll(z,instant,true);
                }
            }
        }
    }
    $.stickyScroll.move = function(panel) {
        if(panel===undefined) {
            return false;
        }
        move(panel,false);
    };
    $.stickyScroll.instantMove = function(panel) {
        if(panel===undefined) {
            return false;
        }
        move(panel,true);
    };
    $.stickyScroll.next = function() {
        if(index<names.length) {
            index += 1;
            animateHebsScroll(index,false,true);
        }
    };
    $.stickyScroll.previous = function() {
        if(index>0) {
            index -= 1;
            animateHebsScroll(index,false,true);
        }
    };
    $.stickyScroll.instantNext = function() {
        if(index<names.length) {
            index += 1;
            animateHebsScroll(index,true,true);
        }
    };
    $.stickyScroll.instantPrevious = function() {
        if(index>0) {
            index -= 1;
            animateHebsScroll(index,true,true);
        }
    };
    $.stickyScroll.destroy = function() {
        $(settings.section).each(function() {
            $(this).css("height","auto");
        });
        $(window).unbind("resize",util.handleResize);
        if(settings.scrollbars) {
            $(window).unbind('mousedown', manualScroll.handleMousedown);
            $(window).unbind('mouseup', manualScroll.handleMouseup);
            $(window).unbind('scroll', manualScroll.handleScroll);
        }
        $(document).unbind('DOMMouseScroll mousewheel',manualScroll.wheelHandler);
        $(document).unbind('keydown', manualScroll.keyHandler);

        if (document.addEventListener) {
            document.removeEventListener('touchstart', swipeHebs.touchHandler, false);
            document.removeEventListener('touchmove', swipeHebs.touchHandler, false);
            document.removeEventListener('touchend', swipeHebs.touchHandler, false);
        }
        heights = [];
        names = [];
        elements = [];
        overflow = [];
    };
    $.stickyScroll.update = function() {
        util.handleResize();
    };
    $.stickyScroll.current = function() {
        return elements[index];
    };
    $.stickyScroll.disable = function() {
        disabled = true;
    };
    $.stickyScroll.enable = function() {
        disabled = false;
    };
    $.stickyScroll.isDisabled = function() {
        return disabled;
    };
    $.stickyScroll.setOptions = function(updatedOptions) {
        if(typeof updatedOptions === "object") {
            settings = $.extend(settings, updatedOptions);
            util.handleResize();
        } else if(window.console) {
            console.warn("HebsScroll warning: Options need to be in an object.");
        }
    };
}(jQuery,this,document));