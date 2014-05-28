/**
 * @summary Mathex Library namespace
 * @description This is a library which provides a set of classes which work together with mathjax (http://www.mathjax.org) in order to reproduce interactive math exercises
 * @license MIT-style license
 * @copyright 2014 Otto srl
 * @author abidibo <dev@abidibo.net> (http://www.abidibo.net)
 * @requires mathjax
 * @requires mootools-core>=1.4
 * @requires mootools-more>=1.4
 * @namespace
 */
var mathex;
if (!mathex) mathex = {};
else if( typeof mathex != 'object') {
    throw new Error('mathex already exists and is not an object');
}

/**
 * @summary Mootools Drag class extension to support mobile devices
 * @description Touch compatible drag functionality
 */
Class.refactor(Drag, {
        attach: function() {
                this.handles.addEvent('touchstart', this.bound.start);
                return this.previous.apply(this, arguments);
        },
        detach: function() {
                this.handles.removeEvent('touchstart', this.bound.start);
                return this.previous.apply(this, arguments);
        },
        start: function(event) {
                document.body.addEvents({
                        touchmove: this.touchmove = function(event) {event.preventDefault(); this.bound.check(event); }.bind(this),
                        touchend: this.bound.cancel
                });
                this.previous.apply(this, arguments);
        },
        check: function(event) {
                if (this.options.preventDefault) event.preventDefault();
                var distance = Math.round(Math.sqrt(Math.pow(event.page.x - this.mouse.start.x, 2) + Math.pow(event.page.y - this.mouse.start.y, 2)));
                if (distance > this.options.snap) {
                        this.cancel();
                        this.document.addEvents({
                                mousemove: this.bound.drag,
                                mouseup: this.bound.stop
                        });
                        document.body.addEvents({
                                touchmove: this.bound.drag,
                                touchend: this.bound.stop
                        });
                        this.fireEvent('start', [this.element, event]).fireEvent('snap', this.element);
                }
        },
        cancel: function(event) {
                document.body.removeEvents({
                        touchmove: this.touchmove,
                        touchend: this.bound.cancel
                });
                return this.previous.apply(this, arguments);
        },
        stop: function(event) {
                document.body.removeEvents({
                        touchmove: this.bound.drag,
                        touchend: this.bound.stop
                });
                return this.previous.apply(this, arguments);
        }
});

/**
 * @summary Library configuration object
 * @memberof mathex
 * @property {Boolean} font_ctrl Whether or not to activate the font size widget
 */
mathex.config = {
    font_ctrl: true
};

/**
 * @namespace
 * @description Common operations object, this is not a class, rather an object which stores common used methods.
 * @memberof mathex
 */
mathex.Shared = {
    /**
     * @summary Renders the page template inside body
     * @description Given the title, subtitle, etc... inserts the right template structure inside the body
     * @memberof mathex.Shared
     * @method
     * @param {Object} [options] The options object
     * @param {String} [options.title] The page title
     * @param {String} [options.subtitle] The page subtitle
     * @param {String} [options.meaning] The exercise meaning
     * @param {String} [options.instructions] The exercise instructions
     * @param {String} [options.duty] The exercise duty
     * @param {String} [options.pre_container] Html text to insert between the duty and the container
     * @return void
     */
    renderTemplate: function(options) {
        var opts = {
            title: '',
            subtitle: '',
            meaning: '',
            instructions: '',
            duty: '',
            pre_container: '',
        };
        var options = Object.merge(opts, options);

        // header
        var header = new Element('header');
        var title = new Element('h1.left').set('html', options.title);
        var widgets = new Element('p#widgets.right');
        var clear = new Element('div.clear');

        header.adopt(title, widgets, clear);

        // subtitle, meaning, instructions, duty, pre_container
        var subtitle = new Element('p.subtitle').set('html', options.subtitle);
        var meaning = options.meaning
            ? new Element('p.meaning').set('html', options.meaning)
            : null;
        var instructions = options.instructions
            ? new Element('p.instructions').set('html', options.instructions)
            : null;
        var duty = options.duty
            ? new Element('h2.duty').set('html', options.duty)
            : null;
        var pre_container = new Element('div.pre_container').set('html', options.pre_container);

        // container
        var container = new Element('div#container');

        // navigation
        var navigation = new Element('div#navigation');

        // footer
        var footer = new Element('footer')
            .adopt(new Element('p').set('text', '© SEI - Società Editrice Internazionale p.a. - Torino'));

        document.body.adopt(
            header,
            subtitle,
            meaning,
            duty,
            instructions,
            pre_container,
            container,
            navigation,
            footer
        );

    },
    /**
     * @summary Updates the content of the navigation container
     * @memberof mathex.Shared
     * @method setNavigation
     * @param {Mixed} content the content html text or the html element
     * @return void
     */
    setNavigation: function(content) {
        if(typeof $('navigation') == 'undefined') {
            console.log('navigation container doesn\' exists');
            throw new Error('navigation container doesn\' exists');
        }
        var navigation = $('navigation');
        navigation.empty();
        if(typeof content == 'string') {
            navigation.set('html', content);
        }
        else {
            navigation.adopt(content);
        }
    },
    /**
     * @summary Clears all navigation contents
     * @memberof mathex.Shared
     * @method clearNavigation
     * @return void
     */
    clearNavigation: function() {
        if(typeof $('navigation') == 'undefined') {
            console.log('navigation container doesn\' exists');
            throw new Error('navigation container doesn\' exists');
        }
        $('navigation').empty();
    },
    /**
     * @summary Parses a mathex template
     * @description Parses mathjax tags converting them to mathjax syntax, replaces input fields inside mathjax tags and activates toggling images
     * @memberof mathex.Shared
     * @method
     * @param {String} tpl The mathex template
     * @param {Object} [inputs] Object describing the field inputs
     * @return {String} The parsed template
     */
    parseTpl: function(tpl, inputs) {
        // get mathjax blocks
        var math_rexp = new RegExp("{%(.*?)%}", "gim");
        // substitute with script delimiters
        var final = tpl.replace(math_rexp, "<script type=\"math/tex\">$1</script>");
        // get inputs
        var inputs_rexp = new RegExp("\\FormInput([0-9]*)", "gm");
        var m_index = 0;
        while(inputs_rexp.test(final)) {
            inputs_rexp.lastIndex = m_index; // return to previous match since the test function change lastIndex property
            var matches = inputs_rexp.exec(final);
            m_index = inputs_rexp.lastIndex // save lastIndex
            var input_index = matches[1];
            var input_replace_rexp = new RegExp("\\FormInput" + input_index, "");
            try{
                var rstring = "\FormInput[" + inputs[input_index.toInt()].size + "][input][]{field_" + input_index + "}";
            }
            catch(err) {
                console.log(err);
                console.log('undefined input object');
                var rstring = '';
            }
            final = final.replace(input_replace_rexp, rstring);
        }

        // toggle images
        var img_rexp = new RegExp("<img class=\"toggle\" src=\"(.*?)\"(.*?)>", 'g');
        final = final.replace(img_rexp, "<img class=\"toggle\" src=\"$1\" onclick=\"mathex.Shared.toggleImage(this)\"$2>");

        return final;
    },
    /**
     * @summary Toggles an image (toggles the '_toggle' suffix of the src attribute)
     * @memberof mathex.Shared
     * @method
     * @param {Object} img The mootools img element
     * @return void
     */
    toggleImage: function(img) {
        var src = img.get('src');
        var rexp = new RegExp("([a-zA-Z0-9-_./]*)\\.([a-zA-Z]*)");
        var matches = rexp.exec(src);
        var path = matches[1];
        var extension = matches[2];
        var toggle_rexp = new RegExp("(.*?)_toggle");
        if(toggle_rexp.test(path)) {
            var nsrc = path.replace(toggle_rexp, "$1") + '.' + extension;
        }
        else {
            var nsrc = path + '_toggle.' + extension;
        }
        img.src = nsrc;
    },
    /**
     * @summary Shows a message in a layer above the document
     * @description The layer can be centered in the viewport or placed near to a target element
     * @memberof mathex.Shared
     * @method
     * @param {String} msg The text message
     * @param {String} css A style class to apply to the message container
     * @param {Function} [callback] A function to call when the layer is closed (click over the layer or the overlay)
     * @param {Object} [options] Some options:
     *          - target: if given the window is rendered below the target, 
     *                    otherwise is centered in the screen
     * @return void
     */
    showMessage: function(msg, css, callback, options) {

        var target = null;
        if(typeof options != 'undefined' && typeof options.target != 'undefined') {
            target = options.target;
        }
        var doc_dim = document.getScrollSize();

        this.overlay = new Element('div');
        this.overlay.setStyles({
            position: 'absolute',
            top: 0,
            left: 0,
            background: '#fff',
            'z-index': 1,
            width: doc_dim.x,
            height: doc_dim.y,
            opacity: 0.1
        });
        this.overlay.inject(document.body);

        var vp = this.getViewport();
        if(target === null) {
            this.message_container = new Element('div#message.' + css);
            this.message_container.setStyles({
                position: 'absolute',
                top: (vp.cY - 20) + 'px',
                left: (vp.cX - 110) + 'px',
                background: '#fff',
                'z-index': 2,
                width: 220 + 'px',
                padding: '10px'
            });
        }
        else {
            var tc = target.getCoordinates(document.body);
            this.message_container = new Element('div#message.' + css);
            this.message_container.setStyles({
                position: 'absolute',
                top: (tc.top + tc.height + 20) + 'px', // 10 is the height of the arrow
                background: '#fff',
                'z-index': 10000,
                width: 220 + 'px',
                padding: '10px'
            });
            if(tc.left < vp.cX) {
                this.message_container.setStyle('left', tc.left + 'px').addClass('layer-target layer-left');
            }
            else {
                this.message_container.setStyle('left', (tc.right - 252) + 'px').addClass('layer-target layer-right'); // 252 is the total width of the window
            }
        }
        this.message_container.inject(document.body);
        this.message_container.set('html', '<p>' + msg + '</p>');
        this.message_container.adopt(
            new Element('span.layer-close')
                .set('text', '×')
                .addEvent('click', function(evt) {
                    this.message_container.dispose();
                    this.overlay.dispose();
                    if(callback) callback();
                }.bind(this))
        );

        var drag_instance = new Drag(this.message_container, {
            'limit':{'x':[0, (doc_dim.width-this.message_container.getCoordinates().width)], 'y':[0, ]}
        });

    },
    /**
     * @summary Gets the viewport coordinates of the current window (width, height, left offest, top offset, coordinates of the center point).
     * @memberof mathex.Shared
     * @method
     * @return {Object} Viewport coordinates
     * @example
     *            // returned object
     *            {'width':width, 'height':height, 'left':left, 'top':top, 'cX':cX, 'cY':cY}
     */
    getViewport: function() {

        var document_coords = document.getCoordinates();
        var document_scroll = document.getScroll();
        var width = document_coords.width;
        var height = document_coords.height;
        var left = document_scroll.x;
        var top = document_scroll.y;
        var cX = document_coords.width / 2 + document_scroll.x;
        var cY = document_coords.height / 2 + document_scroll.y;

        return {'width': width, 'height': height, 'left': left, 'top': top, 'cX': cX, 'cY': cY};

    },
    /**
     * @summary Add a widget in the widget container
     * @memberof mathex.Shared
     * @method
     * @param {widget} widget The widget mootools element
     * @param {String} position Position respect to the container (top, bottom)
     * @return void
     */
    addWidget: function(widget, position) {
        widget.inject($('widgets'), position);
    },
    /**
     * @summary Removes a widget
     * @memberof mathex.Shared
     * @method
     * @param {widget} widget The widget mootools element
     * @return void
     */
    removeWidget: function(widget) {
        widget.dispose();
    },
    /**
     * @summary Creates a player widget in the top of the #container div, given a not null audio object. Removes a previous inserted audio element.
     * @memberof mathex.Shared
     * @method
     * @param {Object} audio_obj The audio object
     * @param {String} [audio_obj.mp3] Path to the mp3 file
     * @param {String} [audio_obj.ogg] Path to the ogg file
     * @return void
     */
    playerWidget: function(audio_obj) {
        if($('audio-container') != null) {
            $('audio-container').dispose();
        }
        if(audio_obj === null) {
            return true;
        }
        var audio = new Element('audio');
        if(typeof audio_obj.mp3 != 'undefined') {
            var mp3_source = new Element('source[src=' + audio_obj.mp3 + '][type=audio/mp3]').inject(audio);
        }
        if(typeof audio_obj.ogg != 'undefined') {
            var ogg_source = new Element('source[src=' + audio_obj.ogg + '][type=audio/ogg]').inject(audio);
        }
        var audio_container = new Element('div#audio-container').adopt(audio);
        if(audio_obj.instructions) {
            audio_container.adopt(new Element('p.instructions').set('html', audio_obj.instructions));
        }
        audio_container.inject($('container'), 'top');
        var player = new mathex.Shared.Player(audio);
        player.init();
    },
    Player: function(audio_element, options) {

        this.audio_obj = document.id(audio_element);
        this.options = options;

        this.init = function() {
            this.status = 'pause';
            //this.duration = this.audio_obj.duration;
            this.time = '00';
            this.render();
            this.addEvents();
        };

        this.render = function() {

            // source controller
            this.source_ctrl_el = new Element('div.source-ctrl.fa.fa-play');
            this.source_ctrl_button = new Element('div.source-ctrl-container')
                .adopt(this.source_ctrl_el);

            // time info
            this.time_current_el = new Element('span.time-current');
            this.time_duration_el = new Element('span.time-duration');
            var time_info = new Element('div.time-info')
                .adopt(
                    this.time_current_el,
                    new Element('span.time-current-duration-separator').set('text', ' / '),
                    this.time_duration_el
                );

            // volume ctrl
            this.volume_slider_el = new Element('div.volume-slider');
            this.volume_off = new Element('span.fa.fa-2x.fa-volume-off');
            this.volume_up = new Element('span.fa.fa-2x.fa-volume-up');
            this.volume_ctrl = new Element('div.volume-ctrl')
                .adopt(
                    this.volume_off,
                    this.volume_slider_el.adopt( new Element('div.volume-knob')),
                    this.volume_up
                );

            var container = new Element('div.player')
                .adopt(
                    this.source_ctrl_button,
                    new Element('div.volume-ctrl-container').adopt(this.volume_ctrl),
                    time_info
                )
                .inject(this.audio_obj, 'after');
        };

        this.addEvents = function() {
            this.audio_obj.addEventListener('loadeddata', function() { 
                this.time_duration_el.set('text', this.toHHMMSS(this.audio_obj.duration));
                this.time_current_el.set('text', this.toHHMMSS(this.audio_obj.currentTime));
            }.bind(this));
            this.source_ctrl_button.addEvent('click', this.sourceCtrlAction.bind(this));

            this.volume_off.addEvent('click', function() {
                this.audio_obj.volume = Math.max(this.audio_obj.volume - 0.1, 0);
                this.volume_slider.set(Math.max((this.audio_obj.volume - 0.1) * 100, 0));
            }.bind(this));

            this.volume_up.addEvent('click', function() {
                this.audio_obj.volume = Math.min(this.audio_obj.volume + 0.1, 1);
                this.volume_slider.set(Math.min((this.audio_obj.volume + 0.1) * 100, 100));
            }.bind(this));

            this.volume_slider = new Slider(this.volume_slider_el, this.volume_slider_el.getElement('.volume-knob'), {
                range: [0, 100],
                initialStep: this.audio_obj.volume * 100,
                onChange: function(value){
                    this.audio_obj.volume = value/100;
                }.bind(this)
            });
        };

        this.sourceCtrlAction = function() {
            if(this.status == 'pause') {
                this.play();
            }
            else {
                this.pause();
            }
        };

        this.toHHMMSS = function(s) {
            var sec_num = parseInt(s, 10);
            var hours   = Math.floor(sec_num / 3600);
            var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
            var seconds = sec_num - (hours * 3600) - (minutes * 60);

            if(hours   < 10) { hours   = "0" + hours; }
            if(minutes < 10) { minutes = "0" + minutes; }
            if(seconds < 10) { seconds = "0" + seconds; }

            var time = (hours == '00' ? '' : hours + ':') + minutes + ':' + seconds;

            return time;
        }

        this.play = function() {
            this.time_current_el.set('text', this.toHHMMSS(this.audio_obj.currentTime));
            this.time_ti = setInterval(function() {
                this.time_current_el.set('text', this.toHHMMSS(this.audio_obj.currentTime));
            }.bind(this), 1000);
            this.source_ctrl_el.removeClass('fa-play').addClass('fa-pause');
            this.audio_obj.play();
            this.status = 'play';
        };

        this.pause = function() {
            clearInterval(this.time_ti);
            this.source_ctrl_el.removeClass('fa-pause').addClass('fa-play');
            this.audio_obj.pause();
            this.status = 'pause';
        };

    },
    /**
     * @summary Creates a index controller widget, just a button with configurable click action
     * @memberof mathex.Shared
     * @method
     * @return void
     */
    indexWidget: function(callback) {
        if(!document.id('index_controller')) {
            var ctrl = new Element('span#index_controller').set('text', 'indice');
        }
        else {
            var ctrl = $('index_controller');
        }
        ctrl.removeEvents('click');
        ctrl.addEvent('click', callback)
            .inject($('widgets'));
    },
    /**
     * @summary Creates a font-size controller widget and places it inside the widget container
     * @memberof mathex.Shared
     * @method
     * @return void
     */
    fontWidget: function() {
        var regular = parseFloat($(document.body).getStyle('font-size'));
        var fm = new Element('span#font_minus.font_controller')
            .set('html', 'A-')
            .addEvent('click', function() {
                size = $(document.body).getStyle('font-size').toInt();
                size = size > 12 ? size - 1 : size;
                $(document.body).setStyle('font-size', size);
            })
            .inject($('widgets'));
        var f = new Element('span#font_regular.font_controller')
            .set('html', 'A')
            .addEvent('click', function() {
                $(document.body).setStyle('font-size', regular);
            })
            .inject($('widgets'));
        var fp = new Element('span#font_plus.font_controller')
            .set('html', 'A+')
            .addEvent('click', function() {
                size = $(document.body).getStyle('font-size').toInt();
                size = size < 26 ? size + 1 : size;
                $(document.body).setStyle('font-size', size);
            })
            .inject($('widgets'));
    },
    /**
     * @summary Creates a calculator widget and places it inside the widget container
     * @memberof mathex.Shared
     * @method
     * @return void
     */
    calculatorWidget: function() {
        var c;
        var Calculator = new Class({
            initialize: function() {
                this.render();
                this.addEvents();
                this.first_term = null;
                this.new_term = true;
                this.operation = null;
            },
            render: function() {
                var table = new Element('table')
                    .adopt(
                        new Element('tr').adopt(
                            new Element('td.operation').set('text', '√'),
                            new Element('td.operation').set('html', 'x<sup>y</sup>'),
                            new Element('td.operation').set('text', '%'),
                            new Element('td.clear').set('text', 'CE')
                        ),
                        new Element('tr').adopt(
                            new Element('td.number').set('text', '7'),
                            new Element('td.number').set('text', '8'),
                            new Element('td.number').set('text', '9'),
                            new Element('td.operation').set('text', '÷')
                        ),
                        new Element('tr').adopt(
                            new Element('td.number').set('text', '4'),
                            new Element('td.number').set('text', '5'),
                            new Element('td.number').set('text', '6'),
                            new Element('td.operation').set('text', '×')
                        ),
                        new Element('tr').adopt(
                            new Element('td.number').set('text', '1'),
                            new Element('td.number').set('text', '2'),
                            new Element('td.number').set('text', '3'),
                            new Element('td.operation').set('text', '-')
                        ),
                        new Element('tr').adopt(
                            new Element('td.number').set('text', '0'),
                            new Element('td.dot').set('text', '.'),
                            new Element('td.equal').set('text', '='),
                            new Element('td.operation').set('text', '+')
                        )
                    );
                var vp = mathex.Shared.getViewport();
                this.container = new Element('div#calculator')
                    .inject(document.body)
                    .setStyles({
                        position: 'fixed',
                        top: vp.cY - 150,
                        left: vp.cX - 106
                    })
                    .adopt(new Element('span.close').set('text', '×').addEvent('click', function() { this.hide(); }.bind(this)))
                    .adopt(this.display = new Element('div#display').set('text', 0), table);

                    var doc_dimensions = document.getCoordinates();

                    var drag_instance = new Drag(this.container, {
                        'limit':{'x':[0, (doc_dimensions.width-this.container.getCoordinates().width)], 'y':[0, ]}
                    });
            },
            addEvents: function() {
                this.container.addEvent('click', this.click.bind(this));
            },
            click: function(evt) {
                var target = evt.target;
                // calculate
                if(target.get('class') == 'equal') {
                    var result = this.calculate();
                    if(result !== null) {
                        this.display.set('text', result);
                    }
                }
                // clear
                else if(target.get('class') == 'clear') {
                    this.clear();
                }
                // operation
                else if(target.get('class') == 'operation') {

                    var text = target.get('text');

                    // minus can be used for negative numbers
                    if(text == '-' && (this.new_term && (this.operation || this.first_term == null))) {
                        this.display.set('text', '-');
                        this.new_term = false;
                        return null;
                    }

                    // sqrt and % are calculated over only the first term
                    if(text == '√' || text == '%') {
                        if(this.operation) {
                            this.display.set('text', this.first_term = this.calculate());
                        }
                        else {
                            this.first_term = parseFloat(this.display.get('text'));
                        }
                        this.operation = text;
                        this.display.set('text', this.calculate());
                        return null;
                    }

                    if(this.first_term == null) {
                        this.first_term = parseFloat(this.display.get('text'));
                    }
                    else {
                        this.display.set('text', this.first_term = this.calculate());
                    }

                    this.operation = text;
                    this.new_term = true;

                }
                else if(target.get('class') == 'number' || target.get('class') == 'dot')    {
                    if(this.new_term) {
                        this.display.set('text', target.get('text'));
                        this.new_term = false;
                    }
                    else {
                        // only 0 or 1 dot character
                        if(this.display.get('text').length < 14 && (target.get('class') != 'dot' || !/\./.test(this.display.get('text')))) {
                            this.display.appendText(target.get('text'));
                        }
                    }
                }
            },
            clear: function() {
                this.first_term = null;
                this.operation = null;
                this.display.set('text', 0);
                this.new_term = true;
            },
            calculate: function() {
                if(this.first_term == null || this.operation == null) return null;
                this.second_term = parseFloat(this.display.get('text'));

                var result;

                if(this.operation == '√') {
                    result = Math.sqrt(this.first_term);
                }
                else if(this.operation == '%') {
                    result = this.first_term / 100;
                }
                else if(this.operation == '+') {
                    result = this.first_term + this.second_term;
                }
                else if(this.operation == '-') {
                    result = this.first_term - this.second_term;
                }
                else if(this.operation == '×') {
                    result = this.first_term * this.second_term;
                }
                else if(this.operation == '÷') {
                    result = this.first_term / this.second_term;
                }
                else if(this.operation == 'xy') {
                    result = Math.pow(this.first_term, this.second_term);
                }

                this.first_term = null;
                this.operation = null;
                return this.format(result);
            },
            format: function(result) {
                var s = result.toString();
                var parts = s.split('.');
                var integer = parts[0];
                var decimal = parts.length == 2 ? parts[1] : null;
                if(integer && integer.length > 14) {
                        return result.toExponential(8);
                }
                else if(integer && decimal) {
                    if(integer.length + decimal.length < 14) {
                        return s;
                    }
                    else if(integer.length < 14) {
                        if(/e/.test(decimal)) {
                            return result.toExponential(9 - integer.length);
                        }
                        else {
                            var factor = Math.pow(10, (13 - integer.length));
                            return Math.round(result * factor) / factor;
                        }
                    }
                    else if(integer.length = 14) {
                        return Math.round(result);
                    }
                }
                else {
                    return s;
                }
            },
            remove: function() {
                this.container.destroy();
            },
            hide: function() {
                this.container.style.display = 'none';
            },
            show: function() {
                this.container.style.display = 'block';
            }
        });
        var calc = new Element('span#calc')
            .set('html', 'calc')
            .addEvent('click', function() {
                if(typeof c != 'undefined') {
                    if(c.container.style.display == 'none') c.show();
                    else c.hide();
                }
                else {
                    c = new Calculator();
                }
            })
            .inject($('widgets'));
    },
    /**
     * @summary Checks if the given value is correct agains the result considering the type cast
     * @memberof mathex.Shared
     * @method
     * @param {String} type The type cast ('float', 'int', 'string_case')
     * @param {Mixed} result The right result
     * @param {Mixed} value The value to check
     * @return {Boolean} The check result
     */
    checkResult: function(type, result, value) {
        if(type == 'float') {
            return parseFloat(result.replace(',', '.')) === parseFloat(value.replace(',', '.'));
        }
        else if(type == 'int') {
            return parseInt(result) === parseInt(value);
        } 
        else if(type == 'string_case') {
            return result === value;
        }
        else {
            return result.toLowerCase() === value.toLowerCase();
        }
    }
}

/***********************************************************************
 *
 *    NAVIGATION
 *
 ***********************************************************************/
/**
 * @summary Navigator Class
 * @classdesc Renders navigation links in the info bar and at the bottom of the container.
 * @memberof mathex
 * @constructs mathex.Navigator
 * @param {Object} [options] Navigator options
 * @param {String} [options.index=null] index button url
 * @param {String} [options.next=null] next button url
 * @param {String} [options.prev=null] prev button url
 * @param {Number} [options.items=0] number of pages
 * @param {Array} [options.urls=[]] array of pages urls, given urls make the relative controller become active
 * @param {Number} [options.current=null] current selected page
 * @param {String} [options.next_label] label next to the next button
 * @param {String} [options.prev_label] label next to the prev button
 * @return {Object} A Navigator instance
 */
mathex.Navigator = function(options) {
    var opts = {
        index: null,
        next: null,
        prev: null,
        next2: null,
        prev2: null,
        items: 0,
        urls: [],
        current: 0,
    };
    this.options = Object.merge(opts, options);

    // index
    if(this.options.index) {
        mathex.Shared.indexWidget(function() { location.href = this.options.index; }.bind(this));
    }

    // pages
    if(this.options.items) {
        var container = new Element('div.navigation');
        var prev_2 = new Element('a.prev2').set('text', '<<').inject(container);
        if(this.options.prev2) {
            prev_2.set('href', this.options.prev2);
        }
        var prev = new Element('a.prev').set('text', '<').inject(container);
        if(this.options.prev) {
            prev.set('href', this.options.prev);
        }
        if(this.options.items) {
            for(var i = 1; i < this.options.items + 1; i++) {
                if(typeof this.options.urls[i - 1] != 'undefined' && this.options.urls[i - 1] && i != this.options.current) {
                    var el = 'a.item.active[href=' + this.options.urls[i - 1] + ']';
                }
                else {
                    var el = 'span.item';
                }
                var item_el = new Element(el)
                    .set('text', i)
                    .inject(container);
                if(i == this.options.current) {
                    item_el.addClass('selected');
                }
            }
        }
        var next = new Element('a.next').set('text', '>').inject(container);
        if(this.options.next) {
            next.set('href', this.options.next);
        }
        var next_2 = new Element('a.next2').set('text', '>>').inject(container);
        if(this.options.next2) {
            next_2.set('href', this.options.next2);
        }
        if(this.options.index) {
            var index_el = new Element('a.index')
                .set('href', this.options.index)
                .set('text', 'indice')
                .inject(container);
        }

        mathex.Shared.setNavigation(container);
    }
}

/***********************************************************************
 *
 *    EXERCISES
 *
 ***********************************************************************/

/**
 * @summary Exercises Router Class
 * @classdesc Given some steps the Router manages the navigation through the steps till the end of the exercise.
 * @memberof mathex
 * @constructs mathex.Router
 * @param {Object} [options] Router options
 * @param {Boolean} [options.widgets=true] Whether or not to create the font and calculator widgets
 * @return {Object} A Router instance
 */
mathex.Router = function(options) {
    this.steps = [];
    this.current = null;
    this.options = typeof options != 'undefined' ? options : { widgets: true };

    /**
     * @summary Initializes a Router instance
     * @memberof mathex.Router.prototype
     * @method init
     * @param {Array} s The exercise's steps
     * @return void
     */
    this.init = function(s) {
        if(this.options.widgets) {
            // widgets
            if(mathex.config.font_ctrl) {
                mathex.Shared.fontWidget();
            }
            mathex.Shared.calculatorWidget();
        }
        this.steps = s;
    };
    /**
     * @summary Adds steps
     * @memberof mathex.Router.prototype
     * @method addSteps
     * @param {Array} s steps
     * @return void
     */
    this.addSteps = function(s) {
        this.steps = this.steps.append(s);
    };
    /**
     * @summary Gets the steps
     * @memberof mathex.Router.prototype
     * @method getSteps
     * @return {Array} The steps
     */
    this.getSteps = function() {
        return this.steps;
    };
    /**
     * @summary Gets the current step index
     * @memberof mathex.Router.prototype
     * @method getCurrent
     * @return {Number} The current step index
     */
    this.getCurrent = function() {
        return this.current;
    };
    /**
     * @summary Starts the execution of a step
     * @memberof mathex.Router.prototype
     * @method startStep
     * @param {Number} [index=0] The index of the step to be executed, default 0
     */
    this.startStep = function(index) {
        index = index ? index: 0;
        try {
            var step = this.steps[index];
            this.current = index;
            step.run(this);
        }
        catch(err) {
            console.log(err);
            console.log('step undefined or not a step');
        }
    };
    /**
     * @summary Ends the execution of a step
     * @memberof mathex.Router.prototype
     * @method endStep
     * @param {Number} [callback] A callback function to call if it was the last step
     * @return void
     */
    this.endStep = function(callback) {
        if(this.current === this.steps.length - 1 ) {
            if(typeof callback != 'undefined') {
                callback();
            }
        }
        else {
            this.startStep(this.current + 1);
        }
    };
    /**
     * @summary Executes all the steps in succession. Debugging purposes.
     * @memberof mathex.Router.prototype
     * @method allSteps
     * @return void
     */
    this.allSteps = function() {
        this.current = 0;
        while(this.current <= this.steps.length - 1) {
            this.startStep(this.current);
            this.current++;
        }
    }
}

/**
 * @namespace
 * @summary Exercises step superclass,    an object which all steps have as their prototype.
 * @memberof mathex
 */
mathex.Step = {

    /**
     * @summary Checks the result of a text field
     * @memberof mathex.Step.prototype
     * @method checkFieldResult
     * @param {Object} field The mootools input field object
     * @param {Mixed} result The right result
     * @param {Object} fieldobj The input object
     */
    checkFieldResult: function(field, result, fieldobj) {

        this.removeInputEvents();

        if(this.end_message) {
            var callback = function() {
                mathex.Shared.showMessage(this.end_message, 'message', null);
            }.bind(this)
        }
        else {
            var callback = null;
        }

        if(!field.retrieve('errors')) {
            field.store('errors', 0);
        }

        if(!mathex.Shared.checkResult(fieldobj.type, result, field.value)){
            if(field.retrieve('errors') != 1) {
                if(typeof fieldobj != 'undefined' && typeof fieldobj.comment != 'undefined') {
                    mathex.Shared.showMessage(fieldobj.comment, 'message', this.addInputEvents.bind(this), {target: field});
                }
                else {
                    mathex.Shared.showMessage('Risposta errata, riprova', 'error', function() { field.value = ''; this.addInputEvents(); }.bind(this), {target: field});
                }
                field.blur();
                field.store('errors', 1);
            }
            else {
                var end_callback = function() {
                    if(callback) callback();
                    this.deactivate();
                    this.router.endStep();
                }.bind(this);
                mathex.Shared.showMessage('Risposta errata. La risposta esatta è ' + result, 'failed', function() { field.value = result; end_callback(); }, {target: field});
            }
        }
        else {
            var success_callback = function() {
                if(callback) callback();
                this.deactivate();
                this.router.endStep();
            }.bind(this);
            mathex.Shared.showMessage('Risposta esatta', 'success', success_callback, {target: field});
        }
    }
}

/**
 * @summary Exercises - Text plus one active field
 * @memberof mathex
 * @constructs mathex.TextFieldStep
 * @extends mathex.Step
 * @param {String} tpl The exercise template.<br />
 *                                                <p>The math to be parsed by mathjax (latex syntax) must be placed inside the tag {%%}, i.e. {% 2^4=16 %}</p>
 *                                                <p>The input fields inside the math must be formatted this way: \\FormInput2, where 2 is the id of the input which is described through the inputs parameter.</p>
 * @param {Object} inputs The object describing the inputs in the template
 * @param {String} [end_message] A message to be displayed at the end of the step
 * @param {Object} [options] The step options
 * @param {Boolean} [options.container=true] Whether or not to insert the exercise text inside a div container
 * @param {String} [options.target=null] Id of the target element where to insert the step content, if null the content is inserted at the bottom of the container
 * @return {Object} TextFieldStep instance
 *
 * @example
 *    var step1 = new mathex.TextFieldStep(
 *        '&lt;h3&gt; Show that {% 2^7 : 2^4 = 2^(7-4) = 2^3 %}&lt;/h3&gt;' + 
 *        '&lt;p&gt;Demonstration:&lt;/p&gt;' + 
 *        '&lt;p&gt;{% 2^7 = \\FormInput0 %}&lt;/p&gt;' + 
 *        '&lt;p&gt;{% 2^4 = \\FormInput1 %}&lt;/p&gt;' +
 *        '&lt;p&gt;etc...&lt;/p&gt;',
 *        {
 *            0: {
 *                size: 3,
 *                active: true,
 *                result: '128',
 *                type: 'string'
 *            },
 *            1: {
 *                size: 2,
 *                active: false,
 *            }
 *        },
 *        'a message'
 *    );
 *
 */
mathex.TextFieldStep = function(tpl, inputs, end_message, options) {

    this.container = options && typeof options.container != 'undefined' ? options.container : true;
    this.target = options && typeof options.target != 'undefined' ? options.target : null;

    /**
     * @summary Executes the step
     * @description Renders the template and activates the input fields
     * @memberof mathex.TextFieldStep.prototype
     * @method run
     * @param {Object} router a mathex.Router instance
     * @return void
     */
    this.run = function(router) {
        this.tpl = mathex.Shared.parseTpl(tpl, inputs);
        this.inputs = inputs;
        this.end_message = typeof end_message == 'undefined' ? null : end_message;
        var self = this;
        this.router = router;
        if(this.container) {
            var div = new Element('div').set('html', this.tpl).inject( this.target ? $(this.target) : $('container'), 'bottom');
        }
        else {
            if(this.target) {
                $(this.target).set('html', $(this.target).get('html') + this.tpl);
            }
            else {
                $('container').set('html', $('container').get('html') + this.tpl);
            }
        }
        MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
        MathJax.Hub.Queue(function() {
            self.addInputEvents();
        });
    };
    /**
     * @summary Adds events to the input fields
     * @memberof mathex.TextFieldStep.prototype
     * @method addInputEvents
     * @return void
     */
    this.addInputEvents = function() {
        var self = this;
        Object.each(this.inputs, function(input, index) {
            var input_obj = document.id('field_' + index);
            if(!input.active) {
                input_obj.setProperty('readonly', 'readonly').addClass('disabled');
            }
            else {
                input_obj.addEvent('keydown', self.keyhandler = function(evt) {
                    if(evt.key == 'enter') {
                        self.checkFieldResult(input_obj, input.result, input);
                    }
                });
            }
        }.bind(this));
    }
    /**
     * @summary Removes events from active input fields
     * @memberof mathex.TextFieldStep.prototype
     * @method removeInputEvents
     * @return void
     */
    this.removeInputEvents = function() {
        var self = this;
        Object.each(this.inputs, function(input, index) {
            var input_obj = document.id('field_' + index);
            if(input.active) {
                input_obj.removeEvent('keydown', self.keyhandler);
            }
        }.bind(this));
    }
    /**
     * @summary Deactivates all inputs
     * @memberof mathex.TextFieldStep.prototype
     * @method deactivate
     * @return void
     */
    this.deactivate = function() {
        Object.each(this.inputs, function(input, index) {
            var input_obj = document.id('field_' + index);
            if(input.active) {
                input_obj.removeEvents('keydown');
                input_obj.setProperty('readonly', 'readonly');
            }
        }.bind(this))
    }
}
mathex.TextFieldStep.prototype = mathex.Step;

/**
 * @summary Exercises - Text plus one radio input
 * @memberof mathex
 * @constructs mathex.TextChoiceFieldStep
 * @extends mathex.Step
 * @param {String} tpl The exercise template.<br />
 *                                                <p>The math to be parsed by mathjax must be placed inside the tag {%%}, i.e. {% 2^4=16 %}</p>
 *                                                <p>The available choices must be written this way: [[0]] my choice. Then the [[0]] is parsed and a radio buton is created.</p>
 * @param {Number} result The index of the correct radio answer
 * @param {String} [end_message] A message to be displayed at the end of the step
 * @param {Object} [options] The step options
 * @param {Boolean} [options.container=true] Whether or not to insert the exercise text inside a div container
 * @param {String} [options.target=null] Id of the target element where to insert the step content, if null the content is inserted at the bottom of the container
 * @return {Object} TextChoiceFieldStep instance
 * @example
 *    var step = new mathex.TextChoiceFieldStep(
 *        '&lt;h3&gt;Title&lt;/h3&gt;' + 
 *        '&lt;p&gt;Which color is yellow?&lt;/p&gt;' + 
 *        '&lt;ul&gt;' + 
 *        '&lt;li&gt;[[0]] red&lt;/li&gt;' + 
 *        '&lt;li&gt;[[1]] {% 2^7 = 32 %}&lt;/li&gt;' + 
 *        '&lt;li&gt;[[2]] yellow&lt;/li&gt;' + 
 *        '&lt;/ul&gt;',
 *        2
 *    );
 */
mathex.TextChoiceFieldStep = function(tpl, result, end_message, options) {

    this.container = options && typeof options.container != 'undefined' ? options.container : true;
    this.target = options && typeof options.target != 'undefined' ? options.target : null;

    /**
     * @summary Executes the step
     * @description Renders the template and activates radio buttons
     * @memberof mathex.TextChoiceFieldStep.prototype
     * @method run
     * @param {Object} router a mathex.Router instance
     * @return void
     */
    this.run = function(router) {
        this.errors = 0;
        this.string = String.uniqueID();
        this.tpl = mathex.Shared.parseTpl(tpl, []);
        var radio_rexp = new RegExp("\\[\\[([0-9]*?)\\]\\]", "gim");
        this.tpl = this.tpl.replace(radio_rexp, "<input type=\"radio\" name=\"radio_" + this.string + "\" id=\"radio_$1\" />");
        this.result = result;
        this.end_message = typeof end_message == 'undefined' ? null : end_message;
        var self = this;
        this.router = router;
        if(this.container) {
            var div = new Element('div').set('html', this.tpl).inject( this.target ? $(this.target) : $('container'), 'bottom');
        }
        else {
            if(this.target) {
                $(this.target).set('html', $(this.target).get('html') + this.tpl);
            }
            else {
                $('container').set('html', $('container').get('html') + this.tpl);
            }
        }
        MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
        MathJax.Hub.Queue(function() {
            self.addInputEvents();
        });
    };
    /**
     * @summary Checks the user answer
     * @memberof mathex.TextChoiceFieldStep.prototype
     * @method checkChoiceFieldResult
     * @param {Object} field The mootools radio button object
     * @param {Number} id The index of the clicked radio button
     * @return void
     */
    this.checkChoiceFieldResult = function(field, id) {
        this.removeInputEvents();

        if(this.end_message) {
            var callback = function() {
                mathex.Shared.showMessage(this.end_message, 'message', null);
            }.bind(this)
        }
        else {
            var callback = null;
        }

        if(!(id.toInt() === this.result || this.errors == 1)) {
            mathex.Shared.showMessage('Risposta errata, riprova', 'error', this.addInputEvents.bind(this), {target: field});
            var x = new Element('span.x').set('html', '&#215;').inject(document.id('radio_' + id).setStyle('display', 'none'), 'before');
            field.removeProperty('checked');
            this.errors = 1;
        }
        else {

            var end_callback = function() {
                if(callback) callback();
                this.deactivate();
                this.router.endStep();
            }.bind(this);


            if(id.toInt() === this.result) {
                mathex.Shared.showMessage('Risposta esatta', 'success', end_callback, {target: field});
                var v = new Element('span.v').set('html', '✔').inject(document.id('radio_' + this.result).setStyle('display', 'none'), 'before');
            }
            else {
                mathex.Shared.showMessage('Risposta errata.', 'failed', end_callback, {target: field});
                var x = new Element('span.x').set('html', '&#215;').inject(document.id('radio_' + id).setStyle('display', 'none'), 'before');
                var v = new Element('span.v').set('html', '✔').inject(document.id('radio_' + this.result).setStyle('display', 'none'), 'before');
            }
        }

    };
    /**
     * @summary Adds events to the radio buttons
     * @memberof mathex.TextChoiceFieldStep.prototype
     * @method addInputEvents
     * @return void
     */
    this.addInputEvents = function() {
        var self = this;
        document.getElements('input[name=radio_' + this.string + ']').each(function(input, index) {
            var input_obj = input;
            input_obj.removeEvents('click');
            input_obj.addEvent('click', self.clickhandler = function(evt) {
                self.checkChoiceFieldResult(input_obj, input_obj.get('id').replace('radio_', ''));
            });
        }.bind(this));
    }
    /**
     * @summary Removes events from the radio buttons
     * @memberof mathex.TextChoiceFieldStep.prototype
     * @method removeInputEvents
     * @return void
     */
    this.removeInputEvents = function() {
        var self = this;
        Object.each(this.inputs, function(input, index) {
            var input_obj = document.id('radio_' + index);
            input_obj.removeEvent('click', self.clickhandler);
        }.bind(this));
    }
    /**
     * @summary Deactivates all inputs
     * @memberof mathex.TextChoiceFieldStep.prototype
     * @method deactivate
     * @return void
     */
    this.deactivate = function() {
        document.getElements('input[name=radio_' + this.string + ']').each(function(input, index) {
            var input_obj = input;
            input_obj.removeEvents('click');
            input_obj.setProperty('readonly', 'readonly');
        }.bind(this))
    }
}
mathex.TextChoiceFieldStep.prototype = mathex.Step;

/**
 * @summary Exercises - Text plus multiple checkboxes
 * @memberof mathex
 * @constructs mathex.TextMulticheckFieldStep
 * @extends mathex.Step
 * @param {String} tpl The exercise template.<br />
 *                 <p>The math to be parsed by mathjax must be placed inside the tag {%%}, i.e. {% 2^4=16 %}</p>
 *                 <p>The available choices must be written this way: [[0]] my choice. Then the [[0]] is parsed and a radio buton is created.</p>
 * @param {Array} result The indexes of the checked answers
 * @param {String} [end_message] A message to be displayed at the end of the step
 * @param {Object} [options] The step options
 * @param {Boolean} [options.container=true] Whether or not to insert the exercise text inside a div container
 * @param {String} [options.target=null] Id of the target element where to insert the step content, if null the content is inserted at the bottom of the container
 * @return {Object} TextMulticheckFieldStep instance
 * @example
 *    var step = new mathex.TextChoiceFieldStep(
 *        '&lt;h3&gt;Title&lt;/h3&gt;' + 
 *        '&lt;p&gt;Which are colors?&lt;/p&gt;' + 
 *        '&lt;ul&gt;' + 
 *        '&lt;li&gt;[[0]] red&lt;/li&gt;' + 
 *        '&lt;li&gt;[[1]] {% 2^7 = 32 %}&lt;/li&gt;' + 
 *        '&lt;li&gt;[[2]] yellow&lt;/li&gt;' + 
 *        '&lt;/ul&gt;',
 *        [0, 2]
 *    );
 */
mathex.TextMulticheckFieldStep = function(tpl, result, end_message, options) {

    this.container = options && typeof options.container != 'undefined' ? options.container : true;
    this.target = options && typeof options.target != 'undefined' ? options.target : null;

    /**
     * @summary Executes the step
     * @description Renders the template and activates the checkboxes
     * @memberof mathex.TextMulticheckFieldStep.prototype
     * @method run
     * @param {Object} router a mathex.Router instance
     * @return void
     */
    this.run = function(router) {
        this.errors = 0;
        this.string = String.uniqueID();
        this.tpl = mathex.Shared.parseTpl(tpl, []);
        var check_rexp = new RegExp("\\[\\[([0-9]*?)\\]\\]", "gim");
        this.tpl = this.tpl.replace(check_rexp, "<input type=\"checkbox\" name=\"check_" + this.string + "[]\" id=\"check_$1\" />");
        this.tpl += '<p><input type="button" value="verifica" id="' + this.string + '_confirm" /></p>';
        this.result = result;
        this.end_message = typeof end_message == 'undefined' ? null : end_message;
        var self = this;
        this.router = router;
        if(this.container) {
            var div = new Element('div').set('html', this.tpl).inject( this.target ? $(this.target) : $('container'), 'bottom');
        }
        else {
            if(this.target) {
                $(this.target).set('html', $(this.target).get('html') + this.tpl);
            }
            else {
                $('container').set('html', $('container').get('html') + this.tpl);
            }
        }
        MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
        MathJax.Hub.Queue(function() {
            self.addInputEvents();
        });
    };
    /**
     * @summary Checks the user answer
     * @memberof mathex.TextMulticheckFieldStep.prototype
     * @method checkMulticheckFieldResult
     * @return void
     */
    this.checkMulticheckFieldResult = function() {
        this.removeInputEvents();

        if(this.end_message) {
            var callback = function() {
                mathex.Shared.showMessage(this.end_message, 'message', null);
            }.bind(this)
        }
        else {
            var callback = null;
        }

        var result = true;
        var checkboxes = document.getElements('input[type=checkbox][name^=check_' + this.string +'[]');
        checkboxes.each(function(checkbox) {
            var index = checkbox.get('id').replace(/check_/, '').toInt();
            if((checkbox.checked && this.result.indexOf(index) == -1) || (!checkbox.checked && this.result.indexOf(index) != -1)) {
                result = false;
            };
        }.bind(this));

        if(!(result || this.errors == 1)) {
            mathex.Shared.showMessage('Risposta errata, riprova', 'error', function() {this.addInputEvents(); this.clean();}.bind(this), {target: checkboxes[checkboxes.length - 1]});
            this.errors = 1;
        }
        else {
            var end_callback = function() {
                if(callback) callback();
                this.deactivate();
                this.router.endStep();
            }.bind(this);


            if(result) {
                mathex.Shared.showMessage('Risposta esatta', 'success', end_callback, {target: checkboxes[checkboxes.length - 1]});
            }
            else {
                mathex.Shared.showMessage('Risposta errata.', 'failed', function() { end_callback(); this.setRightResult(); }.bind(this), {target: checkboxes[checkboxes.length - 1]});
            }
        }
    };
    /**
     * @summary sets the right result
     * @memberof mathex.TextMulticheckFieldStep.prototype
     * @method setRightResult
     * @return void
     */
    this.setRightResult = function() {
        document.getElements('input[name^=check_' + this.string + '[]').each(function(input, index) {
            var index = input.get('id').replace(/check_/, '').toInt();
            if(this.result.indexOf(index) == -1) {
                input.removeProperty('checked');
            }
            else {
                input.setProperty('checked', 'checked');
            }
        }.bind(this));
    };
    /**
     * @summary cleans the checkboxes
     * @memberof mathex.TextMulticheckFieldStep.prototype
     * @method clean
     * @return void
     */
    this.clean = function() {
        document.getElements('input[name^=check_' + this.string + '[]').each(function(input, index) {
            input.removeProperty('checked');
        });
    };
    /**
     * @summary Adds events to the confirm button
     * @memberof mathex.TextMulticheckFieldStep.prototype
     * @method addInputEvents
     * @return void
     */
    this.addInputEvents = function() {
        var self = this;
        document.id(this.string + '_confirm').addEvent('click', self.clickhandler = function() {
            self.checkMulticheckFieldResult();
        });
    };
    /**
     * @summary Removes events from the confirm button
     * @memberof mathex.TextMulticheckFieldStep.prototype
     * @method removeInputEvents
     * @return void
     */
    this.removeInputEvents = function() {
        var self = this;
        document.id(this.string + '_confirm').removeEvent('click', self.clickhandler);
    }
    /**
     * @summary Deactivates all inputs
     * @memberof mathex.TextMulticheckFieldStep.prototype
     * @method deactivate
     * @return void
     */
    this.deactivate = function() {
        document.getElements('input[name^=check_' + this.string + '[]').each(function(input, index) {
            var input_obj = input;
            input_obj.setProperty('disabled', 'disabled');
        }.bind(this));
        document.id(this.string + '_confirm').getParent('p').dispose();
    }
}
mathex.TextMulticheckFieldStep.prototype = mathex.Step;

/**
 * @summary Exercises - Text plus one select input
 * @memberof mathex
 * @constructs mathex.TextSelectFieldStep
 * @extends mathex.Step
 * @params {String} tpl The exercise template.<br />
 *                                                <p>The math to be parsed by mathjax must be placed inside the tag {%%}, i.e. {% 2^4=16 %}</p>
 *                                                <p>The select input field must be inserted this way: [[]]. Its options are described through the select_options parameter.
 * @params {Array} select_options The select options
 * @params {String} result The correct option
 * @params {String} [end_message] A message to be displayed at the end of the step
 * @params {Object} [options] The step options
 * @params {Boolean} [options.container=true] Whether or not to insert the exercise text inside a div container
 * @param {String} [options.target=null] Id of the target element where to insert the step content, if null the content is inserted at the bottom of the container
 * @return {Object} TextSelectFieldStep instance
 * @example
 *
 *    var step4 = new mathex.TextSelectFieldStep(
 *        '&lt;h3&gt;Title&lt;/h3&gt;' + 
 *        '&lt;p&gt;Which color is yellow?&lt;/p&gt;' + 
 *        '&lt;p&gt;[[]] choose one&lt;/p&gt;',
 *        ['red', 'orange', 'yellow'],
 *        'yellow'
 *    );
 */
mathex.TextSelectFieldStep = function(tpl, select_options, result, end_message, options) {

    this.container = options && typeof options.container != 'undefined' ? options.container : true;
    this.target = options && typeof options.target != 'undefined' ? options.target : null;

    /**
     * @summary Populates the select field with the options
     * @memberof mathex.TextSelectFieldStep.prototype
     * @method populateSelect
     * @return void
     */
    this.populateSelect = function() {
        select_options.each(function(option) {
            var opt = new Element('option[value=' + option +']').set('text', option).inject(document.id('select_' + this.string), 'bottom');
        }.bind(this));
    };
    /**
     * @summary Executes the step
     * @description Renders the template and activates the select input
     * @memberof mathex.TextSelectFieldStep.prototype
     * @method run
     * @param {Object} router a mathex.Router instance
     * @return void
     */
    this.run = function(router) {
        this.errors = 0;
        this.string = String.uniqueID();
        this.tpl = mathex.Shared.parseTpl(tpl, []);
        var select_rexp = new RegExp("\\[\\[\\]\\]", "gim");
        this.tpl = this.tpl.replace(select_rexp, "<select id=\"select_" + this.string + "\"><option value=''></option></select>");
        this.result = result;
        this.end_message = typeof end_message == 'undefined' ? null : end_message;
        var self = this;
        this.router = router;
        if(this.container) {
            var div = new Element('div').set('html', this.tpl).inject( this.target ? $(this.target) : $('container'), 'bottom');
        }
        else {
            if(this.target) {
                $(this.target).set('html', $(this.target).get('html') + this.tpl);
            }
            else {
                $('container').set('html', $('container').get('html') + this.tpl);
            }
        }
        this.populateSelect();
        MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
        MathJax.Hub.Queue(function() {
            self.addInputEvents();
        });
    };
    /**
     * @summary Checks the user answer
     * @memberof mathex.TextSelectFieldStep.prototype
     * @method checkSelectFieldResult
     * @param {Object} field The mootools select input object
     * @return void
     */
    this.checkSelectFieldResult = function(field) {
        this.removeInputEvents();

        if(this.end_message) {
            var callback = function() {
                mathex.Shared.showMessage(this.end_message, 'message', null);
            }.bind(this)
        }
        else {
            var callback = null;
        }

        if(!(field.value == this.result || this.errors == 1)) {
            mathex.Shared.showMessage('Risposta errata, riprova', 'error', function() { field.set('value', ''); this.addInputEvents(); }.bind(this), {target: field});
            this.errors = 1;
        }
        else {

            var end_callback = function() {
                if(callback) callback();
                this.deactivate();
                this.router.endStep();
            }.bind(this);

            if(field.value == this.result) {
                mathex.Shared.showMessage('Risposta esatta', 'success', end_callback, {target: field});
            }
            else {
                mathex.Shared.showMessage('Risposta errata', 'failed', function() { field.set('value', this.result); end_callback(); }.bind(this), {target: field});
            }
        }

    }
    /**
     * @summary Adds events to the select input
     * @memberof mathex.TextSelectFieldStep.prototype
     * @method addInputEvents
     * @return void
     */
    this.addInputEvents = function() {
        var self = this;
        document.id('select_' + this.string).addEvent('change', self.changehandler = function(evt) {
                self.checkSelectFieldResult(document.id('select_' + this.string));
            }.bind(this));
    }
    /**
     * @summary Removes events from the select input
     * @memberof mathex.TextSelectFieldStep.prototype
     * @method removeInputEvents
     * @return void
     */
    this.removeInputEvents = function() {
        var self = this;
        document.id('select_' + this.string).removeEvent('change', self.changehandler);
    }
    /**
     * @summary Deactivates all inputs
     * @memberof mathex.TextSelectFieldStep.prototype
     * @method deactivate
     * @return void
     */
    this.deactivate = function() {
        document.id('select_' + this.string).removeEvents('change');
        document.id('select_' + this.string).setProperty('readonly', 'readonly').setProperty('disabled', 'disabled');
    }
}
mathex.TextSelectFieldStep.prototype = mathex.Step;

/**
 * @summary Exercises - One already rendered text input field activation
 * @memberof mathex
 * @constructs mathex.FieldStep
 * @extends mathex.Step
 * @param {String} input_id The input identifier
 * @param {Mixed} result The correct result
 * @param {String} [end_message] A message to be displayed at the end of the step
 * @param {Object} options The step options
 * @param {Boolean} options.type The result type cast
 * @return {Object} FieldStep instance
 * @example
 *    // if a previous defined (in a mathex.TextFieldStep object) input field exists, with id=2
 *    var step = new mathex.FieldStep(2, 16, null, {type: 'int'});
 */
mathex.FieldStep = function(input_id, result, end_message, options) {

    this.input_id = input_id;
    this.result = result;
    this.options = options;
    this.end_message = typeof end_message == 'undefined' ? null : end_message;
    /**
     * @summary Executes the step
     * @description Activates the text input
     * @memberof mathex.FieldStep.prototype
     * @method run
     * @param {Object} router a mathex.Router instance
     * @return void
     */
    this.run = function(router) {
        var self = this;
        this.router = router;
        document.id('field_' + this.input_id).removeProperty('readonly').removeClass('disabled');
        self.addInputEvents();
    }
    /**
     * @summary Executes the step
     * @description Activates the input
     * @memberof mathex.FieldStep.prototype
     * @method addInputEvents
     * @return void
     */
    this.addInputEvents = function() {
        var self = this;
        var input_obj = document.id('field_' + this.input_id);
        input_obj.addEvent('keydown', this.keyhandler = function(evt) {
            if(evt.key == 'enter') {
                self.checkFieldResult(input_obj, self.result, typeof self.options != 'undefined' ? self.options: null);
            }
        })
    }
    /**
     * @summary Removes events from the text input
     * @memberof mathex.FieldStep.prototype
     * @method removeInputEvents
     * @return void
     */
    this.removeInputEvents = function() {
        var input_obj = document.id('field_' + this.input_id);
        input_obj.removeEvent('keydown', this.keyhandler);
    }
    /**
     * @summary Deactivates all inputs
     * @memberof mathex.FieldStep.prototype
     * @method deactivate
     * @return void
     */
    this.deactivate = function() {
        var input_obj = document.id('field_' + this.input_id);
        input_obj.removeEvents('keydown');
        input_obj.setProperty('readonly', 'readonly');
    }

}
mathex.FieldStep.prototype = mathex.Step;

/**
 * @summary Exercises - Only text step
 * @memberof mathex
 * @constructs mathex.TextStep
 * @extends mathex.Step
 * @param {String} tpl The step template.<br />
 *                                                <p>The math to be parsed by mathjax must be placed inside the tag {%%}, i.e. {% 2^4=16 %}</p>
 * @param {String} [end_message] A message to be displayed at the end of the step
 * @param {Object} [options] The step options
 * @param {Boolean} [options.container=true] Whether or not to insert the exercise text inside a div container
 * @param {String} [options.target=null] Id of the target element where to insert the step content, if null the content is inserted at the bottom of the container
 * @return {Object} TextStep instance
 * @example
 *    var step = new mathex.TextStep('&lt;p&gt;my text&lt;/p&gt;', 'my message', {container: false});
 */
mathex.TextStep = function(tpl, end_message, options) {

    this.container = options && typeof options.container != 'undefined' ? options.container : true;
    this.target = options && typeof options.target != 'undefined' ? options.target : null;

    this.tpl = mathex.Shared.parseTpl(tpl, {});
    this.end_message = typeof end_message == 'undefined' ? null : end_message;
    /**
     * @summary Executes the step
     * @description Renders the parsed text
     * @memberof mathex.TextStep.prototype
     * @method run
     * @param {Object} router a mathex.Router instance
     * @return void
     */
    this.run = function(router) {
        var self = this;
        this.router = router;
        if(this.container) {
            var div = new Element('div').set('html', this.tpl).inject( this.target ? $(this.target) : $('container'), 'bottom');
        }
        else {
            if(this.target) {
                $(this.target).set('html', $(this.target).get('html') + this.tpl);
            }
            else {
                $('container').set('html', $('container').get('html') + this.tpl);
            }
        }

        MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
        if(this.end_message) {
            mathex.Shared.showMessage(this.end_message, 'message', null);
        }
        this.router.endStep();

    };

}
mathex.TextStep.prototype = mathex.Step;

/***********************************************************************
 *
 *    QUESTIONS
 *    Set of questions proposed one after the other, with rating and end message
 *
 ***********************************************************************/
/**
 * @summary Questions - Question class
 * @memberof mathex
 * @constructs mathex.Question
 * @param {Object} prop Properties object
 * @param {String} prop.text The question text
 *                                                            <p>The math to be parsed by mathjax must be placed inside the tag {%%}, i.e. {% 2^4=16 %}</p>
 * @param {Array} prop.answers Proposed answers. Each answer can contain mathjsx math.
 * @param {Number} prop.correct_answer Index of the correct answer
 * @return {Object} mathex.Question instance
 * @example 
 *    var question = new mathex.Question({
 *     text: '2. Which of the following is an identity?',
 *     answers: [
 *         '{% 3x = 9 %}',
 *         '{% 2a = 5 %}',
 *         '{% 7 + 8 = 16 %}',
 *         '{% 15 - 9 = 6 %}'
 *     ],
 *     correct_answer: 3
 * })
 */
mathex.Question = function(prop) {

    this.text = prop.text;
    this.answers = prop.answers;
    this.correct_answer = prop.correct_answer;
    this.errors = 0;
    this.last = false;
    /**
     * @summary Sets the last property to true
     * @memberof mathex.Question.prototype
     * @method setLast
     * @return void
     */
    this.setLast = function() {
        this.last = true;
    }
    /**
     * @summary Executes the question
     * @description Renders the question activating the answers
     * @memberof mathex.Question.prototype
     * @method run
     * @param {Object} router The mathex.QuestionRouter instance
     * @return void
     */
    this.run = function(router) {
        $('answers_container').empty();
        this.router = router;
        var self = this;
        this.text = mathex.Shared.parseTpl(this.text, []);
        var div = new Element('div').set('html', this.text).inject($('answers_container'), 'bottom');
        this.list = new Element('ul.test');
        for(var i = 0; i < this.answers.length; i++) {
            var answer = this.answers[i];
            var answer_text = new Element('label[for=answ' + i + ']').set('html', mathex.Shared.parseTpl(answer, []));
            var line = new Element('li');
            var input = new Element('input#answ' + i + '[type=radio][name=answer][value=' + i +']').addEvent('click', function() {
                self.checkAnswer(this.get('value'), self.correct_answer);
            });
            line.adopt(input, answer_text).inject(this.list);
        }
        this.list.inject($('answers_container'), 'bottom');
        MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
    };
    /**
     * @summary Checks the user answer
     * @description Checks the answer, updates the gui, saves the rating and shows a response message to the user
     * @memberof mathex.Question.prototype
     * @method checkAnswer
     * @param {Number} index Index of the choosen answer
     * @param {Number} correct Index of the correct answer
     * @return void
     */
    this.checkAnswer = function(index, correct) {

        if(!(index == correct || this.errors == 1)) {
            mathex.Shared.showMessage('Risposta errata, riprova', 'error', null);
            var x = new Element('span.x').set('html', '&#215;').inject(this.list.getElements('input')[index].setStyle('display', 'none'), 'before');
            this.errors = 1;
        }
        else {

            if(this.last) {
                var callback = function() {
                    this.router.showResult();
                }.bind(this)
            }
            else {
                var callback = function() {};
            }

            if(index == correct) {
                if(this.errors == 1) {
                    var result = 'sattempt';
                    this.router.addAttemptAnswer();
                }
                else {
                    var result = 'success';
                    this.router.addRightAnswer();
                }
                mathex.Shared.showMessage('Risposta esatta', 'success', function() {this.router.endStep(result, this); callback(); }.bind(this));
                var v = new Element('span.v').set('html', '✔').replaces(this.list.getElements('input')[index]);
            }
            else {
                this.router.addWrongAnswer();
                mathex.Shared.showMessage('Risposta errata', 'failed', function() {this.router.endStep('failed', this); callback(); }.bind(this));
                var x = new Element('span.x').set('html', '&#215;').inject(this.list.getElements('input')[index].setStyle('display', 'none'), 'before');
                var v = new Element('span.v').set('html', '✔').replaces(this.list.getElements('input')[correct]);
            }
        }
    };
    /**
     * @summary Removes events from inputs
     * @memberof mathex.Question.prototype
     * @method removeEvents
     * @return void
     */
    this.removeEvents = function() {
        this.list.getElements('input').setProperty('disabled', 'disabled').removeEvents('click');
    };
}

/**
 * @summary Questions - Question Router Class
 * @classdesc The Router class handles the navigation through questions
 * @constructs mathex.QuestionRouter
 * @memberof mathex
 * @return {Object} mathex.QuestionRouter instance
 */
mathex.QuestionRouter = function() {
    /**
     * @summary Initializes the QuestionRouter instance
     * @description Renders widgets and gui
     * @memberof mathex.QuestionRouter.prototype
     * @method init
     * @param {Array} s Array of managed questions @see mathex.Question
     * @param {Object} options The options object
     * @param {Function} options.activities Function which receives as a parameter the points
     *                   and must return the activities to be proposed
     * @return void
     */
    this.init = function(s, options) {
        // widgets
        if(mathex.config.font_ctrl) {
            mathex.Shared.fontWidget();
        }
        mathex.Shared.calculatorWidget();
        this.steps = s;
        this.steps[s.length - 1].setLast();
        var answer_div = new Element('div#answers_container').inject($('container'), 'bottom');
        var nav_div = new Element('div#answers_nav.navigation');
        mathex.Shared.setNavigation(nav_div);
        for(var i = 1, l = s.length; i < l + 1; i++) {
            var navel = new Element('span#nav' + i).set('text', i).inject(nav_div);
        }

        this.options = options || {};
        if(typeof this.options.activities == 'undefined') {
            this.options.activities = function(points) {
                return '';
            }
        }

        this.points = 0;
        this.right_answers = 0;
        this.wrong_answers = 0;
        this.attempt_answers = 0;
        this.results = [];
    };
    /**
     * @summary Add a point to the rating
     * @memberof mathex.QuestionRouter.prototype
     * @method addPoint
     * @param {Number} point The point to add
     * @return void
     */
    this.addPoint = function(point) {
        this.points += point;
    };
    /**
     * @summary Adds a right answer
     * @memberof mathex.QuestionRouter.prototype
     * @method addRightAnswer
     * @return void
     */
    this.addRightAnswer = function() {
        this.right_answers += 1;
        this.addPoint(1);
        this.results.push(1);
    };
    /**
     * @summary Adds a wrong answer
     * @memberof mathex.QuestionRouter.prototype
     * @method addWrongAnswer
     * @return void
     */
    this.addWrongAnswer = function() {
        this.wrong_answers += 1;
        this.addPoint(0);
        this.results.push(0);
    };
    /**
     * @summary Adds a partially correct answer (2 attempts)
     * @memberof mathex.QuestionRouter.prototype
     * @method addAttemptAnswer
     * @return void
     */
    this.addAttemptAnswer = function() {
        this.attempt_answers += 1;
        this.addPoint(0.5);
        this.results.push(0.5);
    };
    /**
     * @summary Executes the given question
     * @memberof mathex.QuestionRouter.prototype
     * @method startStep
     * @param {Number} [index=0] The index of the question to execute
     * @return void
     */
    this.startStep = function(index) {
        index = index ? index: 0;
        $('nav' + (index + 1)).set('class', 'current');
        mathex.QuestionRouter.prototype.startStep.call(this, index);
    };
    /**
     * @summary Ends the question step
     * @memberof mathex.QuestionRouter.prototype
     * @method endStep
     * @param {String} result The question result ('success', 'failed')
     * @param {Object} obj The mathex.Question object
     * @return void
     */
    this.endStep = function(result, obj) {
        $('nav' + (this.getCurrent() + 1)).set('class', result);
        mathex.QuestionRouter.prototype.endStep.call(this, obj.removeEvents.bind(obj));
    };
    /**
     * @summary Gets the final evaluation
     * @memberof mathex.QuestionRouter.prototype
     * @method getEvaluation
     * @return {String} The evaluation text
     */
    this.getEvaluation = function() {
        var points = Math.floor(this.points);
        var message;
        if(points < 4) {
            message = "Preparazione del tutto insufficiente.";
        }
        else if(points == 4) {
            message = "Preparazione insufficiente";
        }
        else if(points == 5) {
            message = "Preparazione lacunosa";
        }
        else if(points == 6) {
            message = "Preparazione sufficiente";
        }
        else if(points == 7) {
            message = "Preparazione buona con qualche lacuna";
        }
        else if(points == 8) {
            message = "Preparazione molto buona";
        }
        else {
            message = "Preparazione adeguata.";
        }

        return message;
    };

    /**
     * @summary Shows the final result, with evaluation
     * @memberof mathex.QuestionRouter.prototype
     * @method showResult
     * @return {String} The final result
     */
    this.showResult = function() {

        $('container').empty();
        var instructions;
        if(instructions = $$('p.instructions')[0]) {
            instructions.setStyle('display', 'none');
        }
        mathex.Shared.clearNavigation();

        var title = new Element('h3.no-margin-top').set('text', 'Esito');

        var summary = new Element('div.questions-summary').adopt(
            new Element('p.result-success').set('text', 'RISPOSTE CORRETTE: ' + this.right_answers),
            new Element('p.result-sattempt').set('text', 'RISPOSTE CORRETTE AL SECONDO TENTATIVO: ' + this.attempt_answers),
            new Element('p.result-failed').set('text', 'RISPOSTE SBAGLIATE: ' + this.wrong_answers)
        );
        var p_summary = new Element('p.questions-summary');
        for(var i = 0, l = this.steps.length; i < l; i++) {
            var item_el = new Element('span.questions-summary-question').set('text', (i + 1));
            if(this.results[i] == 1) {
                item_el.addClass('success');
            }
            else if(this.results[i] == 0.5) {
                item_el.addClass('sattempt');
            }
            else {
                item_el.addClass('failed');
            }
            item_el.inject(p_summary);
        }
        p_summary.inject(summary);

        var rating = new Element('div.question-rating').adopt(
            new Element('p.points').set('text', 'Il tuo punteggio totale è: ' + this.points),
            new Element('p.evaluation').set('text', this.getEvaluation()),
            new Element('div.activities').set('html', this.options.activities.call(this, this.points))
        );

        container.adopt(
            title,
            summary,
            rating
        );
    }

}
mathex.QuestionRouter.prototype = new mathex.Router();

/***********************************************************************
 *
 *    FAQ
 *    Faq have an index and can be browsed
 *
 ***********************************************************************/
/**
 * @summary FAQ - Faq Class
 * @classdesc Stores an array containing all the faq items
 * @constructs mathex.Faq
 * @memberof mathex
 * @param {Array} items The array describing all items. Each item is an object with properties:
 *                                            <ul>
 *                                                <li><b>question</b>: string. The question, can contain mathjax math inside the tag {% LATEX MATH HERE %}</li>
 *                                                <li><b>answer</b>: string. The answer, can contain mathjax math inside the tag {% LATEX MATH HERE %}, and links to other faqs, 
 *                                                        whether indexed faqs or not (in this case showing the linked one in a layer): {{link_text:3}} or {{link_text:3:layer}}</li>
 *                                                <li><b>audio</b>: object. The audio object for the question and answer, it has the 'mp3', 'ogg' and 'instructions' properties storing the files' paths and a text</li>
 *                                            </ul>
 * @return {Object} mathex.Faq instance
 * @example
 *    var faq = new mathex.Faq([
 *        {
 *            question: "Which color is yellow?",
 *                 answer: 'yellow!',
 *                 audio: {
 *                     mp3: 'audio/myfile.mp3',
 *                     ogg: 'audio/myfile.ogg',
 *                     instructions: 'listen to the audio file ...',
 *            }
 *        },
 *        {
 *            question: "How much it is {% 1 + 1 %}?",
 *            answer: "&lt;p&gt;TWO!&lt;/p&gt;"
 *        }
 *    ]);
 */
mathex.Faq = function(items) {
    this.items = items;
    this.index_items = [];
    this.items.each(function(item, index) {
        if(typeof item.index == 'undefined' || item.index === true) {
            item.index = index;
            this.index_items.push(item);
        }
    }.bind(this));
}
/**
 * @summary FAQ - Faq Router Class
 * @classdesc handles the faq navigation and rendering
 * @memberof mathex
 * @constructs mathex.FaqRouter
 * @param {Object} faq The mathex.Faq instance
 * @return {Object} mathex.Faq instance
 */
mathex.FaqRouter = function(faq) {
    this.faq = faq;
    /**
     * @summary Starts the execution of the faq
     * @memberof mathex.FaqRouter.prototype
     * @method start
     * @return void
     */
    this.start = function() {
        this.faq_div = new Element('div#faq_container').inject($('container'), 'bottom');
        this.faq_nav = new Element('div#faq_nav.navigation');
        mathex.Shared.setNavigation(this.faq_nav);
        // widgets
        if(mathex.config.font_ctrl) {
            mathex.Shared.fontWidget();
        }
        mathex.Shared.calculatorWidget();
        this.renderIndex();
    }
    /**
     * @summary Renders the faq index
     * @memberof mathex.FaqRouter.prototype
     * @method renderIndex
     * @return void
     */
    this.renderIndex = function() {
        if($('index_controller')) {
            mathex.Shared.removeWidget($('index_controller'));
        }
        this.faq_div.empty();
        this.faq_nav.empty();
        var list = new Element('ul').inject(this.faq_div);
        var i = 1;
        this.faq.index_items.each(function(item, index) {
            var li = new Element('li.link_faq')
                .set('html', i + '. ' + mathex.Shared.parseTpl(item.question, []))
                .addEvent('click', function() {
                    this.renderFaq(item.index, index);
                }.bind(this))
                .inject(list, 'bottom');
            i++;
        }.bind(this));

        mathex.Shared.playerWidget(null);

        MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
    }
    /**
     * @summary Renders one single faq (question, answer)
     * @memberof mathex.FaqRouter.prototype
     * @method renderFaq
     * @param {Number} index the index of the faq to be rendered
     * @param {Number} index_index the index of the faq to be rendered considering only indexed faq
     * @return void
     */
    this.renderFaq = function(index, index_index) {

        index = parseInt(index);
        /* index */
        var self = this;
        var title = new Element('h3').set('html',  (index_index !== null ? (index_index + 1) + '. ' : '') + mathex.Shared.parseTpl(this.faq.items[index].question, []));

        var item = this.faq.items[index];
        this.faq_div.empty();
        this.faq_nav.empty();
        var answer = mathex.Shared.parseTpl(item.answer, []);
        var link_rexp = new RegExp("{{\s*(.*?):([0-9]+):?(layer)?\s*}}", "gim");
        var answer = answer.replace(link_rexp, "<span class=\"link\" onclick=\"router.goto($2, '$3')\">$1</span>");
        this.faq_div.adopt(title, new Element('div').set('html', answer));

        MathJax.Hub.Queue(['Typeset',MathJax.Hub]);

        if(index_index !== null) {
            var prev = null, next = null;
            if(index_index > 0) {
                prev = new Element('span.prev.link').set('text', '<').addEvent('click', function() {
                    this.renderFaq(index - 1, index_index - 1);
                    window.location.hash = 'top';
                }.bind(this)).inject(this.faq_nav);
            }
            else {
                prev = new Element('span.prev').set('text', '<').inject(this.faq_nav);
            }

            var i = 0;
            this.faq.index_items.each(function(faq, index) {
                var item_el = new Element('span.item')
                    .set('text', ++i)
                    .inject(this.faq_nav);
                if(index_index == i - 1) {
                    item_el.addClass('selected');
                }
                else {
                    item_el.addClass('active link')
                        .addEvent('click', function() { this.renderFaq(this.faq.items.indexOf(faq), index); window.location.hash = 'top'; }.bind(this));
                }
            }.bind(this));

            if(index < this.faq.index_items.length - 1) {
                next = new Element('span.next.link').set('text', '>').addEvent('click', function() {
                    this.renderFaq(index + 1, index_index + 1);
                    window.location.hash = 'top';
                }.bind(this)).inject(this.faq_nav);
            }
            else {
                next = new Element('span.next').set('text', '>').inject(this.faq_nav);
            }

            var toindex = new Element('span.index').set('text', 'indice').addEvent('click', function() {
                this.renderIndex();
                window.location.hash = 'top';
            }.bind(this)).inject(this.faq_nav);
        }
        mathex.Shared.indexWidget(function() { this.renderIndex(); window.location.hash = 'top'; }.bind(this));


        /* audio */
        if(typeof item.audio != 'undefined') {
            mathex.Shared.playerWidget(item.audio);
        }
        else {
            mathex.Shared.playerWidget(null);
        }

    };
    /**
     * @summary Moves to another faq
     * @memberof mathex.FaqRouter.prototype
     * @method goto
     * @param {Number} index The index of the faq to go to
     * @param {String} [layer] Whether to show the faq over a layer (if its value is 'layer') or not
     * @return void
     */
    this.goto = function(index, layer) {
        if(layer == 'layer') {
            var item = this.faq.items[index];
            var answer = mathex.Shared.parseTpl(item.answer, []);
            var link_rexp = new RegExp("{{\s*(.*?):([0-9]+):?(layer)?\s*}}", "gim");
            var answer = answer.replace(link_rexp, "<span class=\"link\" onclick=\"router.goto($2, '$3')\">$1</span>");
            var viewport = mathex.Shared.getViewport();
            var layer = new Element('div.layer').setStyles({
                'position': 'absolute',
                'margin': 'auto',
                'top': 0,
                'bottom': 0,
                'left': 0,
                'right': 0,
                'width': '500px',
                'height': '50%',
                //'top': (viewport.cY - 100) + 'px',
                //'left': (viewport.cX - 200) + 'px',
            }).inject($(document.body));
            var title = new Element('h2').set('html', mathex.Shared.parseTpl(item.question, []));
            var close = new Element('span.link.layer-close')
                .set('html', '&#215;').addEvent('click', function() { layer.dispose(); });
            layer.adopt(close, new Element('div.layer-body').adopt(
                    title, new Element('div').set('html', answer)
                ).setStyles({
                    'height': (layer.getCoordinates().height - 40) + 'px',
                    'overflow': 'auto'
                })
            );
            MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
        }
        else {
            var item = this.faq.items[index];
            if(item.index === false) {
                this.renderFaq(index, null);
            }
            else {
                this.renderFaq(index, this.faq.index_items.indexOf(item));
            }
        }
    }
}

/***********************************************************************
 *
 *    Test
 *    Test with questions and rating
 *
 ***********************************************************************/
/**
 * @summary Test - Test Question Factory Class
 * @classdesc returns a Test question specific instance
 * @memberof mathex
 * @constructs mathex.TestQuestion
 * @param {String} type Type of the question to create
 * @param {Object} options Object to be passed to the specific question class constructor
 * @return {Object} A specific test question instance
 */
mathex.TestQuestion = function(type, options) {
    if(type == 'input') {
        return new mathex.TestInputQuestion(options);
    }
    else if(type == 'radio') {
        return new mathex.TestRadioQuestion(options);
    }
    else if(type == 'multicheck') {
        return new mathex.TestMulticheckQuestion(options);
    }
    else return null;
}

/**
 * @summary Test - Test multicheck question, answer with multiple checkboxes
 * @memberof mathex
 * @constructs mathex.TestMulticheckQuestion
 * @param {Object} options Options
 * @param {String} options.question The question and answer template to be parsed
 *                                                                        <p>The math to be parsed by mathjax (latex syntax) must be placed inside the tag {%%}, i.e. {% 2^4=16 %}</p>
 *                                                                        <p>The checkboxes must be written this way: [[1]] choice, where 1 is the index of the choice.</p>
 * @param {Array} options.result The indexes of the correct answers
 * @return {Object} mathex.TestMulticheckQuestion instance
 * @example
 *    var question3 = new mathex.TestQuestion('multicheck', {
 *        question: 'Which equations are correct?' + 
 *            '&lt;ul&gt;' +
 *            '&lt;li&gt;[[0]] {% 5^3 * 5^4 = 5^7 %}&lt;/li&gt;' +
 *            '&lt;li&gt;[[1]] {% 2^5 * 3^5 = 6^5 %}&lt;/li&gt;' +
 *            '&lt;li&gt;[[2]] {% 9^6 + 9^2 = 9^8 %}&lt;/li&gt;' +
 *            '&lt;li&gt;[[3]] {% 7^8 : 7 = 7^7 %}&lt;/li&gt;' +
 *            '&lt;/ul&gt;',
 *        result: [0, 1, 3],
 *    });
 *
 */
mathex.TestMulticheckQuestion = function(options) {

    this.question = options.question;
    this.result = options.result;
    /**
     * @summary Executes the test question
     * @memberof mathex.TestMulticheckQuestion.prototype
     * @method run
     * @param {Object} test The mathex.Test instance
     * @param {Number} index The question index
     * @return void
     */
    this.run = function(test, index) {
        var self = this;
        this.string = String.uniqueID();
        this.tpl = mathex.Shared.parseTpl(this.question, {});
        var check_rexp = new RegExp("\\[\\[([0-9]*?)\\]\\]", "gim");
        this.tpl = this.tpl.replace(check_rexp, "<input type=\"checkbox\" name=\"check_" + this.string + "\" id=\"check_$1\" />");
        this.test = test;
        var div = new Element('div').set('html', this.tpl).inject($('container'), 'bottom');
        var confirm = new Element('input[type=button][value=conferma]')
            .addEvent('click', self.checkAnswer.bind(self))
            .inject(new Element('div.test-confirm').inject($('container'), 'bottom'));
        MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
        this.test.renderNavigation(index);
    }
    /**
     * @summary Cheks the user answer, saves the result and proceeds with the next question
     * @memberof mathex.TestMulticheckQuestion.prototype
     * @method checkAnswer
     * @return void
     */
    this.checkAnswer = function() {
        var result = true;
        var values = [];
        document.getElements('input[type=checkbox]').each(function(checkbox) {
            var index = checkbox.get('id').replace(/check_/, '').toInt();
            if(checkbox.checked) {
                values.push(index);
            }
            if((checkbox.checked && this.result.indexOf(index) == -1) || (!checkbox.checked && this.result.indexOf(index) != -1)) {
                result = false;
            };
        }.bind(this));

        this.test.saveResult(result, values);

        // uncomment and comment next line to make layers appear near the input field
        //var target = $$('input[type=radio]')[0].getParent().getParent();
        var target = null;

        if(result) {
            mathex.Shared.showMessage('Risposta esatta', 'success', this.test.nextQuestion.bind(this.test), {target: target});
        }
        else {
            mathex.Shared.showMessage('Risposta errata', 'failed', this.test.nextQuestion.bind(this.test), {target: target});
        }

    }
    /**
     * @summary Shows the result for correction
     * @description Shows the original question with the right answer and the wrong answer 
     * if a wrong answer was given
     * @memberof mathex.TestMulticheckQuestion.prototype
     * @method showResult
     * @param {Element} container the container into which 
     * @param {Number} question_index the question index
     * @return void
     */
    this.showResult = function(container, question_index) {
        var self = this;
        this.string = String.uniqueID();
        this.tpl = mathex.Shared.parseTpl(this.question, {});
        var checkbox_rexp = new RegExp("\\[\\[([0-9]*?)\\]\\]", "gim");
        this.tpl = this.tpl.replace(checkbox_rexp, "<input type=\"checkbox\" name=\"multicheck" + this.string + "\" id=\"check_$1\" />");
        this.test = test;
        if(!this.test.results[question_index]) {
            var wrong_result = new Element('div.test-result-wrong')
                .set('html', this.tpl)
                .inject(container);
            MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
            MathJax.Hub.Queue(function() {
                Object.each(this.test.answers[question_index], function(index) {
                    $('check_' + index).setProperty('checked', 'checked')
                        .setStyle('background', '#eca9a9')
                        .removeProperty('id');
                }.bind(self));
                wrong_result.getElements('input[type=checkbox]').setProperty('disabled', 'disabled');
            });
        }
        var right_result = new Element('div.test-result-right')
            .set('html', this.tpl)
            .inject(container);
        MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
        MathJax.Hub.Queue(function() {
            Object.each(self.result, function(index) {
                $('check_' + index).setProperty('checked', 'checked')
                    .setStyle('background', '#afe1bc')
                    .removeProperty('id');
            }.bind(self));
            right_result.getElements('input[type=checkbox]').setProperty('disabled', 'disabled');
        });
    }
}

/**
 * @summary Test - Test question, answers with only text fields
 * @memberof mathex
 * @constructs mathex.TestInputQuestion
 * @param {Object} [options] Options
 * @param {String} [options.question] The question and answer template to be parsed.
 *                                                                        <p>The math to be parsed by mathjax (latex syntax) must be placed inside the tag {%%}, i.e. {% 2^4=16 %}</p>
 *                                                                        <p>The input fields inside the math must be formatted this way: \\FormInput2, where 2 is the id of the input which is described through the inputs parameter.</p>
 * @param {String} [options.inputs] Object storing ll the inputs description. Each input object has the properties:
 *                                                                    <ul>
 *                                                                        <li><b>size</b>: number. The input field size</li>
 *                                                                        <li><b>result</b>: string. The input field result</li>
 *                                                                        <li><b>type</b>: string. The input field result type ('float', 'int', 'string_case')</li>
 *                                                                    </ul>
 * @return {Object} mathex.TestInputQuestion instance
 * @example
 *    var question1 = new mathex.TestQuestion('input', {
 *        question: '&lt;p&gt;How do you write the pow with base 20 and exponent 3?&lt;/p&gt;&lt;p&gt;{%\\FormInput0 ^ \\FormInput1%}&lt;/p&gt;',
 *        inputs: {
 *            0: {
 *                size: 2,
 *                result: '20',
 *                type: 'int'
 *            },
 *            1: {
 *                size: 1,
 *                result: 3,
 *                type: 'int'
 *            }
 *        }
 *    });
 */
mathex.TestInputQuestion = function(options) {

    this.question = options.question;
    this.inputs = options.inputs;
    /**
     * @summary Executes the test question
     * @memberof mathex.TestInputQuestion.prototype
     * @method run
     * @param {Object} test The mathex.Test instance
     * @param {Number} index The question index
     * @return void
     */
    this.run = function(test, index) {
        var self = this;
        this.tpl = mathex.Shared.parseTpl(this.question, this.inputs);
        this.test = test;
        var div = new Element('div').set('html', this.tpl).inject($('container'), 'bottom');
        var confirm = new Element('input[type=button][value=conferma]')
            .addEvent('click', self.checkAnswer.bind(self))
            .inject(new Element('div.test-confirm').inject($('container'), 'bottom'));
        MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
        this.test.renderNavigation(index);
    }
    /**
     * @summary Cheks the user answer, saves the result and proceeds with the next question
     * @memberof mathex.TestInputQuestion.prototype
     * @method checkAnswer
     * @return void
     */
    this.checkAnswer = function() {
        var result = true;
        var values = [];
        var length = 0;
        Object.each(this.inputs, function(input, index) {
            var value = $('field_' + index).get('value');
            values.push(value);
            result = result && mathex.Shared.checkResult(input.type, input.result, value);
            length++;
        }.bind(this));

        this.test.saveResult(result, values);

        // uncomment and comment next line to make layers appear near the input field
        //var target = length > 1 ? null : $('field_0');
        var target = null;

        if(result) {
            mathex.Shared.showMessage('Risposta esatta', 'success', this.test.nextQuestion.bind(this.test), {target: target});
        }
        else {
            mathex.Shared.showMessage('Risposta errata', 'failed', this.test.nextQuestion.bind(this.test), {target: target});
        }

    }
    /**
     * @summary Shows the result for correction
     * @description Shows the original question with the right answer and the wrong answer 
     * if a wrong answer was given
     * @memberof mathex.TestInputQuestion.prototype
     * @method showResult
     * @param {Element} container the container into which
     * @param {Number} question_index the question index
     * @return void
     */
    this.showResult = function(container, question_index) {
        var self = this;
        this.tpl = mathex.Shared.parseTpl(this.question, this.inputs);
        this.test = test;
        if(!this.test.results[question_index]) {
             var wrong_result = new Element('div.test-result-wrong')
                .set('html', this.tpl)
                .inject(container);
            MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
            MathJax.Hub.Queue(function() {
                Object.each(self.inputs, function(input, index) {
                    $('field_' + index).set('value', this.test.answers[question_index][index])
                        .setProperty('readonly', 'readonly')
                        .setStyle('background', '#eca9a9')
                        .removeProperty('id');
                }.bind(self));
            });
        }
        var right_result = new Element('div.test-result-right')
            .set('html', this.tpl)
            .inject(container);
        MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
        MathJax.Hub.Queue(function() {
            Object.each(self.inputs, function(input, index) {
                $('field_' + index).set('value', input.result)
                    .setProperty('readonly', 'readonly')
                    .setStyle('background', '#afe1bc')
                    .removeProperty('id');
            }.bind(self));
        });
    }
}
/**
 * @summary Test - Test radio question, answer with one multiple radio choice
 * @memberof mathex
 * @constructs mathex.TestRadioQuestion
 * @param {Object} options Options
 * @param {String} options.question The question and answer template to be parsed
 *                                                                        <p>The math to be parsed by mathjax (latex syntax) must be placed inside the tag {%%}, i.e. {% 2^4=16 %}</p>
 *                                                                        <p>The radio choices must be written this way: [[1]] choice, where 1 is the index of the choice.</p>
 * @param {Number} options.result The index of the correct answer
 * @return {Object} mathex.TestRadioQuestion instance
 * @example
 *    var question3 = new mathex.TestQuestion('radio', {
 *        question: 'Which equation is wrong?' + 
 *            '&lt;ul&gt;' +
 *            '&lt;li&gt;[[0]] {% 5^3 * 5^4 = 5^7 %}&lt;/li&gt;' +
 *            '&lt;li&gt;[[1]] {% 2^5 * 3^5 = 6^5 %}&lt;/li&gt;' +
 *            '&lt;li&gt;[[2]] {% 9^6 + 9^2 = 9^8 %}&lt;/li&gt;' +
 *            '&lt;li&gt;[[3]] {% 7^8 : 7 = 7^7 %}&lt;/li&gt;' +
 *            '&lt;/ul&gt;',
 *        result: 2,
 *    });
 *
 */
mathex.TestRadioQuestion = function(options) {

    this.question = options.question;
    this.result = options.result;
    /**
     * @summary Executes the test question
     * @memberof mathex.TestRadioQuestion.prototype
     * @method run
     * @param {Object} test The mathex.Test instance
     * @param {Number} index The question index
     * @return void
     */
    this.run = function(test, index) {
        var self = this;
        this.string = String.uniqueID();
        this.tpl = mathex.Shared.parseTpl(this.question, {});
        var radio_rexp = new RegExp("\\[\\[([0-9]*?)\\]\\]", "gim");
        this.tpl = this.tpl.replace(radio_rexp, "<input type=\"radio\" name=\"radio_" + this.string + "\" id=\"radio_$1\" />");
        this.test = test;
        var div = new Element('div').set('html', this.tpl).inject($('container'), 'bottom');
        var confirm = new Element('input[type=button][value=conferma]')
            .addEvent('click', self.checkAnswer.bind(self))
            .inject(new Element('div.test-confirm').inject($('container'), 'bottom'));
        MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
        this.test.renderNavigation(index);
    }
    /**
     * @summary Cheks the user answer, saves the result and proceeds with the next question
     * @memberof mathex.TestRadioQuestion.prototype
     * @method checkAnswer
     * @return void
     */
    this.checkAnswer = function() {
        var result = false;
        var values = [];
        document.getElements('input[type=radio]').each(function(radio, index) {
            if(radio.checked) {
                values.push(index);
            }
            if(radio.checked && index == this.result) {
                result = true;
            };
        }.bind(this));

        this.test.saveResult(result, values);

        // uncomment and comment next line to make layers appear near the input field
        //var target = $$('input[type=radio]')[0].getParent().getParent();
        var target = null;

        if(result) {
            mathex.Shared.showMessage('Risposta esatta', 'success', this.test.nextQuestion.bind(this.test), {target: target});
        }
        else {
            mathex.Shared.showMessage('Risposta errata', 'failed', this.test.nextQuestion.bind(this.test), {target: target});
        }

    }
    /**
     * @summary Shows the result for correction
     * @description Shows the original question with the right answer and the wrong answer 
     * if a wrong answer was given
     * @memberof mathex.TestRadioQuestion.prototype
     * @method showResult
     * @param {Element} container the container into which 
     * @param {Number} question_index the question index
     * @return void
     */
    this.showResult = function(container, question_index) {
        var self = this;
        this.string = String.uniqueID();
        this.tpl = mathex.Shared.parseTpl(this.question, {});
        var radio_rexp = new RegExp("\\[\\[([0-9]*?)\\]\\]", "gim");
        this.tpl = this.tpl.replace(radio_rexp, "<input type=\"radio\" name=\"radio_" + this.string + "\" id=\"radio_$1\" />");
        var right_result = new Element('div.test-result-' + (this.test.results[question_index] ? 'right' : 'wrong'))
            .set('html', this.tpl)
            .inject(container);
        MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
        MathJax.Hub.Queue(function() {
            var v = new Element('span.v').set('html', '✔').inject(document.id('radio_' + self.result).setStyle('display', 'none'), 'before');
            if(!self.test.results[question_index]) {
                if(self.test.answers[question_index].length) {
                    var x = new Element('span.x').set('html', '&#215;').inject(document.id('radio_' + self.test.answers[question_index][0]).setStyle('display', 'none'), 'before');
                }
            }
        });

    }


}
/**
 * @summary Test - Test class
 * @classdesc Handles the test rendering and flow
 * @constructs mathex.Test
 * @memberof mathex
 * @return {Object} mathex.Test instance
 */
mathex.Test = function() {

    this.questions = [];
    this.current = 0;
    this.results = [];
    this.answers = [];

    /**
     * @summary Initializes the Test instance
     * @memberof mathex.Test.prototype
     * @method init
     * @param {Array} questions Array of test question objects
     * @param {Object} options Options
     * @param {Array} options.steps The steps used for the rating, in asc order, check is made this way: if result <= step sup limit
     * @param {Array} options.rating Array of objects describing the rating of the steps previously defined. Each object has a message property (text to be shown) and a color property (text color)
     * @param {Boolean} [options.widgets=false] Whether or not to create the widgets @see mathex.Shared
     * @return void
     * @example
     *    test.init([question1, question2, question3], {
     *        steps: [2, 7, 10],
     *        rating: [
     *            {message: 'very bad', color: 'red'},
     *            {message: 'quite good', color: 'yellow'},
     *            {message: 'meow', color: 'green'},
     *        ]
     *    });
     *
     **/
    this.init = function(questions, options) {
        this.options = options;
        if(options && typeof this.options.widgets != 'undefined') {
            // widgets
            if(mathex.config.font_ctrl) {
                mathex.Shared.fontWidget();
            }
            mathex.Shared.calculatorWidget();
        }
        this.questions = questions;
    }
    /**
     * @summary Executes the given index question
     * @memberof mathex.Test.prototype
     * @method start
     * @params {Number} [index=0] The index of the question to execute
     * @return void
     */
    this.start = function(index) {
        $('container').empty();
        index = typeof index != 'undefined' ? index : 0;
        try {
            var question = this.questions[index];
            this.current = index;
            question.run(this, index);
        }
        catch(err) {
            console.log(err);
            console.log('question undefined or not a question');
        }
    }

    /**
     * @summary Renders the navigation bar at the bottom of the question
     * @memberof mathex.Test.prototype
     * @method renderNavigation
     * @params {Number} [current] The index of the current question
     * @return void
     */
    this.renderNavigation = function(current) {
        this.test_nav = new Element('div#test_nav.navigation');
        mathex.Shared.setNavigation(this.test_nav);
        this.questions.each(function(question, index) {
            var item_el = new Element('span.item')
                .set('text', (index + 1))
                .inject(this.test_nav);
            if(index < current) {
                if(this.results[index]) {
                    item_el.addClass('success');
                }
                else {
                    item_el.addClass('failed');
                }
            }
            else if(index == current) {
                item_el.addClass('filled');
            }
        }.bind(this));
    }

    /**
     * @summary Stores the given result
     * @memberof mathex.Test.prototype
     * @method saveResult
     * @params {Boolean} result The result to store
     * @return void
     */
    this.saveResult = function(result, values) {
        this.results.push(result ? 1 : 0);
        this.answers.push(values);
    }
    /**
     * @summary Goes to the next questions or the end of the test
     * @memberof mathex.Test.prototype
     * @method nextQuestion
     * @return void
     */
    this.nextQuestion = function() {
        if(this.current == this.questions.length - 1) {
            this.renderResults();
        }
        else {
            this.start(this.current + 1);
        }
    }
    /**
     * @summary Renders the test final rating
     * @memberof mathex.Test.prototype
     * @method renderResults
     * @return void
     */
    this.renderResults = function() {

        mathex.Shared.clearNavigation();
        var instructions;
        if(instructions = $$('p.instructions')[0]) {
            instructions.setStyle('display', 'none');
        }

        var correct = 0;
        var incorrect = 0;

        var title = new Element('h3.no-margin-top').set('text', 'Esito');

        var intro_text = new Element('p.test-correction')
            .set('html', "<b>Correzione</b>: seleziona il pulsante corrispondente alla domanda di cui vuoi leggere la correzione");

        this.results.each(function(result, index) {
            if(result) correct++;
            else incorrect++;
        });

        var total = this.results.reduce(function(previousValue, currentValue, index, array){ return previousValue + currentValue; });

        var correct_text = new Element('p.result-success')
            .set('text', 'RISPOSTE CORRETTE: ' + correct);

        var incorrect_text = new Element('p.result-failed')
            .set('text', 'RISPOSTE SBAGLIATE: ' + incorrect);

        // message
        for(var i = 0, l = this.options.steps.length; i < l; i++) {
            var limit = this.options.steps[i];
            if(total <= limit) {
                var rating = this.options.rating[i];
                break;
            }
        }
        var rating_element = new Element('p.test-rating').setStyle('color', rating.color).set('text', rating.message);

        // summary
        var summary_container = new Element('div.test-summary');
        this.results.each(function(result, index) {
            var q_el = new Element('span.test-summary-question')
                .set('text', (index + 1))
                .addClass(result ? 'success' : 'failed')
                .addEvent('click', this.showResult.bind(this, index))
                .inject(summary_container);
        }.bind(this));
        var summary_result = new Element('div#test-summary-result')
            .inject(summary_container);

        $('container').empty();
        $('container').adopt(
            title, 
            correct_text, 
            incorrect_text, 
            rating_element,
            intro_text, 
            summary_container
        );
    };
    /**
     * @summary Renders a question result
     * @memberof mathex.Test.prototype
     * @method showResult
     * @param {Number} [index] question index
     * @param {Event} [evt] the click event
     * @return void
     */
    this.showResult = function(index, evt) {
        var container = $('test-summary-result').empty();
        var question = this.questions[index];
        question.showResult(container, index);
    }
}

/**
 * @summary Attaches a load event to the window object which creates a top anchor
 * @event
 */
window.addEvent('load', function() {
    var anchor = new Element('a', {name: 'top'}).set('text', 'top').setStyles({
        color: '#fff',
        'line-height': 0,
        position: 'absolute',
        top: 0
    }).inject(document.getElements('header')[0], 'after');
});
