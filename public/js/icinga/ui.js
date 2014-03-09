/**
 * Icinga.UI
 *
 * Our user interface
 */
(function(Icinga, $) {

    'use strict';

    Icinga.UI = function (icinga) {

        this.icinga = icinga;

        this.currentLayout = 'default';

        this.debug = false;

        this.debugTimer = null;

        this.timeCounterTimer = null;
    };

    Icinga.UI.prototype = {

        initialize: function () {
            $('html').removeClass('no-js').addClass('js');
            this.enableTimeCounters();
            this.triggerWindowResize();
            this.fadeNotificationsAway();
        },

        fadeNotificationsAway: function()
        {
            var icinga = this.icinga;
            $('#notifications li')
                .not('.fading-out')
                .not('.persist')
                .addClass('fading-out')
                .delay(7000)
                .fadeOut('slow',
            function() {
                icinga.ui.fixControls();
                this.remove();
            });

        },

        enableDebug: function () {
            this.debug = true;
            this.debugTimer = this.icinga.timer.register(
                this.refreshDebug,
                this,
                1000
            );
            this.fixDebugVisibility();

            return this;
        },

        fixDebugVisibility: function () {
            if (this.debug) {
                $('#responsive-debug').css({display: 'block'});
            } else {
                $('#responsive-debug').css({display: 'none'});
            }
            return this;
        },

        disableDebug: function () {
            if (this.debug === false) { return; }

            this.debug = false;
            this.icinga.timer.unregister(this.debugTimer);
            this.debugTimer = null;
            this.fixDebugVisibility();
            return this;
        },

        enableTimeCounters: function () {
            this.timeCounterTimer = this.icinga.timer.register(
                this.refreshTimeSince,
                this,
                1000
            );
            return this;
        },

        disableTimeCounters: function () {
            this.icinga.timer.unregister(this.timeCounterTimer);
            this.timeCounterTimer = null;
            return this;
        },

        flipContent: function () {
            var col1 = $('#col1 > div').detach();
            var col2 = $('#col2 > div').detach();
            $('#col2').html('');
            $('#col1').html('');

            col1.appendTo('#col2');
            col2.appendTo('#col1');
            this.fixControls();
        },

        triggerWindowResize: function () {
            this.onWindowResize({data: {self: this}});
        },

        /**
         * Our window got resized, let's fix our UI
         */
        onWindowResize: function (event) {
            var self = event.data.self;
            self.fixControls();

            if (self.layoutHasBeenChanged()) {
                self.icinga.logger.info(
                    'Layout change detected, switching to',
                    self.currentLayout
                );
            }
            self.refreshDebug();
        },

        layoutHasBeenChanged: function () {

            var layout = $('html').css('fontFamily').replace(/['",]/g, '');
            var matched;

            if (null !== (matched = layout.match(/^([a-z]+)-layout$/))) {
                if (matched[1] === this.currentLayout &&
                    $('#layout').hasClass(layout)
                ) {
                    return false;
                } else {
                    $('#layout').removeClass(this.currentLayout + '-layout').addClass(layout);
                    this.currentLayout = matched[1];
                    if (this.currentLayout === 'poor' || this.currentLayout === 'minimal') {
                        this.icinga.events.layout1col();
                    }
                    return true;
                }
            }

            this.icinga.logger.error(
                'Someone messed up our responsiveness hacks, html font-family is',
                layout
            );

            return false;
        },

        layout1col: function () {
            if (! $('#layout').hasClass('twocols')) { return; }
            var $col2 = $('#col2');
            icinga.logger.debug('Switching to single col');
            $('#layout').removeClass('twocols');
            $col2.removeAttr('data-icinga-url');
            $col2.removeAttr('data-icinga-refresh');
            $col2.removeData('icingaUrl');
            $col2.removeData('icingaRefresh');
            this.icinga.loader.stopPendingRequestsFor($col2);
            $col2.html('');
            this.fixControls();
        },

        layout2col: function () {
            if ($('#layout').hasClass('twocols')) { return; }
            icinga.logger.debug('Switching to double col');
            $('#layout').addClass('twocols');
            this.fixControls();
        },

        getAvailableColumnSpace: function () {
            return $('#main').width() / this.getDefaultFontSize();
        },

        setColumnCount: function (count) {
            if (count === 3) {
                $('#main > .container').css({
                    width: '33.33333%'
                });
            } else if (count === 2) {
                $('#main > .container').css({
                    width: '50%'
                });
            } else {
                $('#main > .container').css({
                    width: '100%'
                });
            }
        },

        setTitle: function (title) {
            document.title = title;
            return this;
        },

        getColumnCount: function () {
            return $('#main > .container').length;
        },

        prepareContainers: function () {
            var icinga = this.icinga;
            $('.container').each(function(idx, el) {
                icinga.events.applyHandlers($(el));
                icinga.ui.initializeControls($(el));
            });
            /*
            $('#icinga-main').attr(
                'icingaurl',
                window.location.pathname + window.location.search
            );
            */
        },

        refreshDebug: function () {

            var size = this.getDefaultFontSize().toString();
            var winWidth = $( window ).width();
            var winHeight = $( window ).height();
            var loading = '';

            $.each(this.icinga.loader.requests, function (el, req) {
                if (loading === '') {
                    loading = '<br />Loading:<br />';
                }
                loading += el + ' => ' + req.url;
            });

            $('#responsive-debug').html(
                '   Time: ' +
                this.icinga.utils.formatHHiiss(new Date()) +
                '<br />    1em: ' +
                size +
                'px<br />    Win: ' +
                winWidth +
                'x'+
                winHeight +
                'px<br />' +
                ' Layout: ' +
                this.currentLayout +
                loading
            );
        },

        refreshTimeSince: function () {

            $('.timesince').each(function (idx, el) {
                var m = el.innerHTML.match(/^(-?\d+)m\s(-?\d+)s/);
                if (m !== null) {
                    var nm = parseInt(m[1]);
                    var ns = parseInt(m[2]);
                    if (ns < 59) {
                        ns++;
                    } else {
                        ns = 0;
                        nm++;
                    }
                    $(el).html(nm + 'm ' + ns + 's');
                }
            });

            $('.timeunless').each(function (idx, el) {
                var m = el.innerHTML.match(/^(-?\d+)m\s(-?\d+)s/);
                if (m !== null) {
                    var nm = parseInt(m[1]);
                    var ns = parseInt(m[2]);
                    var signed = '';
                    var sec = 0;

                    if (nm < 0) {
                        signed = '-';    
                        nm = nm * -1;
                        sec = nm * 60 + ns;
                        sec++;
                    } else if (nm == 0 && ns == 0) {
                        signed = '-';    
                        sec = 1;
                    } else if (nm == 0) {
                        signed = '-';    
                        sec = ns;
                        sec++;
                    } else {
                        signed = '';    
                        sec = nm * 60 + ns;
                        sec--;
                    }    

                    nm = Math.floor(sec/60);
                    ns = sec - nm * 60;

                    $(el).html(signed + nm + 'm ' + ns + 's');
                }
            });
        },

        createFontSizeCalculator: function () {
            var $el = $('<div id="fontsize-calc">&nbsp;</div>');
            $('#layout').append($el);
            return $el;
        },

        getDefaultFontSize: function () {
            var $calc = $('#fontsize-calc');
            if (! $calc.length) {
                $calc = this.createFontSizeCalculator();
            }
            return $calc.width() / 1000;
        },

        initializeControls: function (parent) {

            var self = this;

            $('.controls', parent).each(function (idx, el) {
                var $el = $(el);

                if (! $el.next('.fake-controls').length) {

                    var newdiv = $('<div class="fake-controls"></div>');
                    newdiv.css({
                        height: $el.css('height')
                    });
                    $el.after(newdiv);
                }
            });

            this.fixControls(parent);
        },

        fixControls: function ($parent) {

            var self = this;

            if ('undefined' === typeof $parent) {

                $('#header').css({height: 'auto'});
                $('#main').css({top: $('#header').css('height')});
                $('#sidebar').css({top: $('#header').height() + 'px'});
                $('#header').css({height: $('#header').height() + 'px'});
                $('#inner-layout').css({top: $('#header').css('height')});
                $('.container').each(function (idx, container) {
                    self.fixControls($(container));
                });

                return;
            }

            // Enable this only in case you want to track down UI problems
            // self.icinga.logger.debug('Fixing controls for ', $parent);

            $('.controls', $parent).each(function (idx, el) {
                var $el = $(el);
                var $fake = $el.next('.fake-controls');
                var y = $parent.scrollTop();

                $el.css({
                    position : 'fixed',
                    top      : $parent.offset().top,
                    // Firefox gives 1px too much depending on total width.
                    // TODO: find a better solution for -1
                    width    : ($fake.width() - 1) + 'px'
                });

                $fake.css({
                    height  : $el.css('height'),
                    display : 'block'
                });
            });
        },

        toggleFullscreen: function () {
            $('#layout').toggleClass('fullscreen-layout');
            this.fixControls();
        },

        getWindowId: function () {
            var res = window.name.match(/^Icinga_([a-zA-Z0-9])$/);
            if (res) {
                return res[1];
            }
            return null;
        },

        hasWindowId: function () {
            var res = window.name.match(/^Icinga_([a-zA-Z0-9])$/);
            return typeof res === 'object';
        },

        setWindowId: function (id) {
            window.name = 'Icinga_' + id;
        },

        destroy: function () {
            // This is gonna be hard, clean up the mess
            this.icinga = null;
            this.debugTimer = null;
            this.timeCounterTimer = null;
        }

    };

}(Icinga, jQuery));
