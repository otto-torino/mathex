var mathex;
if (!mathex) mathex = {};
else if( typeof mathex != 'object') {
  throw new Error('mathex already exists and is not an object');
}

/*
 * Configuration
 */
mathex.config = {
  font_ctrl: true
};

/**
 * Object with common operations
 */
mathex.Shared = {
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
  showMessage: function(msg, css, callback) {

    var doc_dim = document.getScrollSize();

    this.overlay = new Element('div');
    this.overlay.setStyles({
      position: 'absolute',
      top: 0,
      left: 0,
      background: '#000',
      'z-index': 1,
      width: doc_dim.x,
      height: doc_dim.y,
      opacity: 0.6
    });
    this.overlay.inject(document.body);

    var vp = this.getViewport();

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
    this.message_container.inject(document.body);
    this.message_container.set('html', '<p>' + msg + '</p>');

    this.overlay.addEvent('click', function(evt) {
      this.message_container.dispose();
      this.overlay.dispose();
      if(callback) callback();
    }.bind(this));

    this.message_container.addEvent('click', function(evt) {
      this.message_container.dispose();
      this.overlay.dispose();
      if(callback) callback();
    }.bind(this));
  },
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
  addWidget: function(widget, position) {
    widget.inject($('widgets'), position);
  },
  removeWidget: function(widget) {
    widget.dispose();
  },
  playerWidget: function(audio_obj) {
    if(audio_obj === null) {
      if(typeof $('widgets').getElements('audio')[0] != 'undefined') {
        $('widgets').getElements('audio')[0].dispose();
      }
      return true;
    }
    var audio = new Element('audio[controls]');
    if(typeof audio_obj.mp3 != 'undefined') {
      var mp3_source = new Element('source[src=' + audio_obj.mp3 + '][type=audio/mp3]').inject(audio);
    }
    if(typeof audio_obj.ogg != 'undefined') {
      var ogg_source = new Element('source[src=' + audio_obj.ogg + '][type=audio/ogg]').inject(audio);
    }
    audio.inject($('widgets'), 'top');
  },
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
        else if(target.get('class') == 'number' || target.get('class') == 'dot')  {
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
  }
}

/*
 * Router (exercises router)
 */
mathex.Router = function() {
  this.steps = [];
  this.current = null;

  this.init = function(s) {
    // widgets
    if(mathex.config.font_ctrl) {
      mathex.Shared.fontWidget();
    }
    mathex.Shared.calculatorWidget();
    this.steps = s;
  };

  this.addSteps = function(s) {
    this.steps = this.steps.append(s);
  };

  this.getSteps = function() {
    return this.steps;
  };

  this.getCurrent = function() {
    return this.current;
  };

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

  this.endStep = function(callback) {
    if(this.current === this.steps.length - 1 ) {
      //mathex.Shared.showMessage('The end')
      if(typeof callback != 'undefined') {
        callback();
      }
    }
    else {
      this.startStep(this.current + 1);
    }
  };

  this.allSteps = function(callback) {
    this.current = 0;
    while(this.current <= this.steps.length - 1) {
      this.startStep(this.current);
      this.current++;
    }
  }
}

/**
 * Primitive Abstract Step Object
 */
mathex.Step = {

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

    if(!this.checkResult(fieldobj, result, field.value)){
      if(field.retrieve('errors') != 1) {
        if(typeof fieldobj != 'undefined' && typeof fieldobj.comment != 'undefined') {
          mathex.Shared.showMessage(fieldobj.comment, 'message', this.addInputEvents.bind(this));
        }
        else {
          mathex.Shared.showMessage('Risposta errata, riprova', 'error', this.addInputEvents.bind(this));
        }
        field.blur();
        field.value = '';
        field.store('errors', 1);
      }
      else {
        mathex.Shared.showMessage('Risposta errata. La risposta esatta è ' + result, 'failed', callback);
        field.value = result;
        this.deactivate();
        this.router.endStep();
      }
    }
    else {
      mathex.Shared.showMessage('Risposta esatta', 'success', callback);
      this.deactivate();
      this.router.endStep();
    }
  },
  checkResult: function(field, result, value) {
    if(field.type == 'float') {
      return parseFloat(result.replace(',', '.')) === parseFloat(value.replace(',', '.'));
    }
    else if(field.type == 'int') {
      return parseInt(result) === parseInt(value);
    } 
    else if(field.type == 'string_case') {
      return result === value;
    }
    else {
      return result.toLowerCase() === value.toLowerCase();
    }
  }
}

/**
 * Text plus one active input field step (exercises)
 */
mathex.TextFieldStep = function(tpl, inputs, end_message, options) {

  this.container = options && typeof options.container != 'undefined' ? options.container : true;

  this.run = function(router) {
    this.tpl = mathex.Shared.parseTpl(tpl, inputs);
    this.inputs = inputs;
    this.end_message = typeof end_message == 'undefined' ? null : end_message;
    var self = this;
    this.router = router;
    if(this.container) {
      var div = new Element('div').set('html', this.tpl).inject($('container'), 'bottom');
    }
    else {
      $('container').set('html', $('container').get('html') + this.tpl);
    }
    MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
    MathJax.Hub.Queue(function() {
      self.addInputEvents();
    });
  };

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

  this.removeInputEvents = function() {
    var self = this;
    Object.each(this.inputs, function(input, index) {
      var input_obj = document.id('field_' + index);
      if(input.active) {
        input_obj.removeEvent('keydown', self.keyhandler);
      }
    }.bind(this));
  }

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
 * Text plus one active choice field (exercises)
 */
mathex.TextChoiceFieldStep = function(tpl, result, end_message, options) {

  this.container = options && typeof options.container != 'undefined' ? options.container : true;

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
      var div = new Element('div').set('html', this.tpl).inject($('container'), 'bottom');
    }
    else {
      $('container').set('html', $('container').get('html') + this.tpl);
    }
    MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
    MathJax.Hub.Queue(function() {
      self.addInputEvents();
    });
  };

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
      var x = new Element('span.x').set('html', '&#215;').inject(document.id('radio_' + id).setStyle('display', 'none'), 'before');
      mathex.Shared.showMessage('Risposta errata, riprova', 'error', this.addInputEvents.bind(this));
      field.removeProperty('checked');
      this.errors = 1;
    }
    else {

      if(id.toInt() === this.result) {
        var v = new Element('span.v').set('html', '✔').replaces(document.id('radio_' + id));
        mathex.Shared.showMessage('Risposta esatta', 'success', callback);
      }
      else {
        var x = new Element('span.x').set('html', '&#215;').inject(document.id('radio_' + id).setStyle('display', 'none'), 'before');
        var v = new Element('span.v').set('html', '✔').replaces(document.id('radio_' + this.result));
        mathex.Shared.showMessage('Risposta errata.', 'failed', callback);
      }
      this.deactivate();
      this.router.endStep();
    }

  }

  this.addInputEvents = function() {
    var self = this;
    document.getElements('input[name=radio_' + this.string + ']').each(function(input, index) {
      var input_obj = input;
      input_obj.addEvent('click', self.clickhandler = function(evt) {
        self.checkChoiceFieldResult(input_obj, input_obj.get('id').replace('radio_', ''));
      });
    }.bind(this));
  }

  this.removeInputEvents = function() {
    var self = this;
    Object.each(this.inputs, function(input, index) {
      var input_obj = document.id('radio_' + index);
      input_obj.removeEvent('click', self.clickhandler);
    }.bind(this));
  }

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
 * Text plus one active choice field (exercises)
 */
mathex.TextSelectFieldStep = function(tpl, options, result, end_message, options) {

  this.container = options && typeof options.container != 'undefined' ? options.container : true;

  this.populateSelect = function() {
    options.each(function(option) {
      var opt = new Element('option[value=' + option +']').set('text', option).inject(document.id('select_' + this.string), 'bottom');
    }.bind(this));
  };

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
      var div = new Element('div').set('html', this.tpl).inject($('container'), 'bottom');
    }
    else {
      $('container').set('html', $('container').get('html') + this.tpl);
    }
    this.populateSelect();
    MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
    MathJax.Hub.Queue(function() {
      self.addInputEvents();
    });
  };

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
      mathex.Shared.showMessage('Risposta errata, riprova', 'error', this.addInputEvents.bind(this));
      field.set('value', '');
      this.errors = 1;
    }
    else {

      if(field.value == this.result) {
        mathex.Shared.showMessage('Risposta esatta', 'success', callback);
      }
      else {
        mathex.Shared.showMessage('Risposta errata.', 'failed', callback);
        field.set('value', this.result);
      }
      this.deactivate();
      this.router.endStep();
    }

  }

  this.addInputEvents = function() {
    var self = this;
    document.id('select_' + this.string).addEvent('change', self.changehandler = function(evt) {
        self.checkSelectFieldResult(document.id('select_' + this.string));
      }.bind(this));
  }

  this.removeInputEvents = function() {
    var self = this;
    document.id('select_' + this.string).removeEvent('change', self.changehandler);
  }

  this.deactivate = function() {
    document.id('select_' + this.string).removeEvents('change');
    document.id('select_' + this.string).setProperty('readonly', 'readonly').setProperty('disabled', 'disabled');
  }
}
mathex.TextSelectFieldStep.prototype = mathex.Step;

/**
 * One already rendered input field active (exercises)
 */
mathex.FieldStep = function(input_id, result, end_message, options) {

  this.input_id = input_id;
  this.result = result;
  this.options = options;
  this.end_message = typeof end_message == 'undefined' ? null : end_message;

  this.run = function(router) {
    var self = this;
    this.router = router;
    document.id('field_' + this.input_id).removeProperty('readonly').removeClass('disabled');
    self.addInputEvents();
  }

  this.addInputEvents = function() {
    var self = this;
    var input_obj = document.id('field_' + this.input_id);
    input_obj.addEvent('keydown', this.keyhandler = function(evt) {
      if(evt.key == 'enter') {
        self.checkFieldResult(input_obj, self.result, typeof self.options != 'undefined' ? self.options: null);
      }
    })
  }

  this.removeInputEvents = function() {
    var input_obj = document.id('field_' + this.input_id);
    input_obj.removeEvent('keydown', this.keyhandler);
  }

  this.deactivate = function() {
    var input_obj = document.id('field_' + this.input_id);
    input_obj.removeEvents('keydown');
    input_obj.setProperty('readonly', 'readonly');
  }

}
mathex.FieldStep.prototype = mathex.Step;

/**
 * Text (exercises)
 */
mathex.TextStep = function(tpl, end_message, options) {

  this.container = options && typeof options.container != 'undefined' ? options.container : true;

  this.tpl = mathex.Shared.parseTpl(tpl, {});
  this.end_message = typeof end_message == 'undefined' ? null : end_message;

  this.run = function(router) {
    var self = this;
    this.router = router;
    if(this.container) {
      var div = new Element('div').set('html', this.tpl).inject($('container'), 'bottom');
    }
    else {
      $('container').set('html', $('container').get('html') + this.tpl);
    }
    MathJax.Hub.Queue(['Typeset',MathJax.Hub]);

    this.router.endStep();

  };

}
mathex.TextStep.prototype = mathex.Step;

/**
 * Question
 */
mathex.Question = function(prop) {

  this.text = prop.text;
  this.answers = prop.answers;
  this.correct_answer = prop.correct_answer;
  this.errors = 0;
  this.last = false;

  this.setLast = function() {
    this.last = true;
  }

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

  this.checkAnswer = function(index, correct) {

    if(!(index == correct || this.errors == 1)) {
      mathex.Shared.showMessage('Risposta errata, riprova', 'error');
      var x = new Element('span.x').set('html', '&#215;').inject(this.list.getElements('input')[index].setStyle('display', 'none'), 'before');
      this.errors = 1;
    }
    else {

      if(this.last) {
        var callback = function() {
          mathex.Shared.showMessage(this.router.getEndMessage(), 'message', null);
        }.bind(this)
      }
      else {
        var callback = function() {};
      }

      if(index == correct) {
        if(this.errors == 1) {
          var result = 'sattempt';
          this.router.addPoint(0.5);
        }
        else {
          var result = 'success';
          this.router.addPoint(1);
        }
        mathex.Shared.showMessage('Risposta esatta', 'success', function() {this.router.endStep(result, this); callback(); }.bind(this));
        var v = new Element('span.v').set('html', '✔').replaces(this.list.getElements('input')[index]);
      }
      else {
        mathex.Shared.showMessage('Risposta errata', 'failed', function() {this.router.endStep('failed', this); callback(); }.bind(this));
        var x = new Element('span.x').set('html', '&#215;').inject(this.list.getElements('input')[index].setStyle('display', 'none'), 'before');
        var v = new Element('span.v').set('html', '✔').replaces(this.list.getElements('input')[correct]);
      }
    }
  };

  this.removeEvents = function() {
    this.list.getElements('input').setProperty('disabled', 'disabled').removeEvents('click');
  };
}

/* QuestionRouter */
mathex.QuestionRouter = function() {

  this.init = function(s) {
    // widgets
    if(mathex.config.font_ctrl) {
      mathex.Shared.fontWidget();
    }
    mathex.Shared.calculatorWidget();
    this.steps = s;
    this.steps[s.length - 1].setLast();
    var answer_div = new Element('div#answers_container').inject($('container'), 'bottom');
    var nav_div = new Element('div#answers_nav').inject($('container'), 'bottom');
    for(var i = 1, l = s.length; i < l + 1; i++) {
      var navel = new Element('span#nav' + i).set('text', i).inject(nav_div);
    }
    this.points = 0;
  };

  this.addPoint = function(point) {
    this.points += point;
  };

  this.startStep = function(index) {
    index = index ? index: 0;
    $('nav' + (index + 1)).set('class', 'current');
    mathex.QuestionRouter.prototype.startStep.call(this, index);
  };

  this.endStep = function(result, obj) {
    $('nav' + (this.getCurrent() + 1)).set('class', result);
    mathex.QuestionRouter.prototype.endStep.call(this, obj.removeEvents.bind(obj));
  };

  this.getEndMessage = function() {
    var points = Math.floor(this.points);
    var message = "Il tuo punteggio è " + points + '.\n';
    if(points < 4) {
      message += "Numerosissime lacune.\nRistudia tutto l'argomento.";
    }
    else if(points < 6) {
      message += "La preparazione è lacunosa.\nRipassa tutto l'argomento.";
    }
    else if(points == 6) {
      message += "La prova evidenzia alcune lacune da colmare con esercizi di recupero.";
    }
    else if(points < 9) {
      message += "Nel complesso la preparazione è completa, puoi migliorare con esercizi di potenziamento.";
    }
    else {
      message += "La prova dimostra una preparazione adeguata.";
    }

    return message;
  };

}
mathex.QuestionRouter.prototype = new mathex.Router();

mathex.Faq = function(items) {
  this.items = items;
}

mathex.FaqRouter = function(faq) {
  this.faq = faq;

  this.start = function() {
    this.faq_div = new Element('div#faq_container').inject($('container'), 'bottom');
    this.faq_nav = new Element('div#faq_nav').inject($('container'), 'bottom');
    // widgets
    if(mathex.config.font_ctrl) {
      mathex.Shared.fontWidget();
    }
    mathex.Shared.calculatorWidget();
    this.renderIndex();
  }

  this.renderIndex = function() {
    this.faq_div.empty();
    this.faq_nav.empty();
    var list = new Element('ul').inject(this.faq_div);
    this.faq.items.each(function(item, index) {
      if(typeof item.index == 'undefined' || item.index) {
/*      kkk*/
        var li = new Element('li.link_faq')
/*        kkk*/
          .set('html', mathex.Shared.parseTpl(item.question, []))
          .addEvent('click', function() {
            this.renderFaq(index);
          }.bind(this))
          .inject(list, 'bottom');
      }
    }.bind(this));

    mathex.Shared.playerWidget(null);

    MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
  }

  this.renderFaq = function(index) {


    /* index */
    var select = new Element('select.title');
    this.faq.items.each(function(item, opt_index) {
      if(typeof item.index == 'undefined' || item.index) {
/*      kkk*/
        var option = new Element('option')
/*        kkk*/
          .set('html', mathex.Shared.parseTpl(item.question, []))
          .setProperty('value', opt_index)
          .inject(select);
        if(index == opt_index) {
          option.setProperty('selected', 'selected');
        }
      }
    }.bind(this));
    var self = this;
    select.addEvent('change', function() {
      self.renderFaq(this.value);
    });
    var item = this.faq.items[index];
    this.faq_div.empty();
    this.faq_nav.empty();
    var answer = mathex.Shared.parseTpl(item.answer, []);
    var link_rexp = new RegExp("{{\s*(.*?):([0-9]+):?(layer)?\s*}}", "gim");
    var answer = answer.replace(link_rexp, "<span class=\"link\" onclick=\"router.goto($2, '$3')\">$1</span>");
    this.faq_div.adopt(select, new Element('div').set('html', answer));

    MathJax.Hub.Queue(['Typeset',MathJax.Hub]);

    var prev = null, next = null;
    if(index > 0) {
      prev = new Element('span').set('text', 'precedente').addEvent('click', function() {
        this.renderFaq(index - 1);
        window.location.hash = 'top';
      }.bind(this)).inject(this.faq_nav);
    }
    var toindex = new Element('span').set('text', 'indice').addEvent('click', function() {
      this.renderIndex();
      window.location.hash = 'top';
    }.bind(this)).inject(this.faq_nav);

    if(index < this.faq.items.length - 1) {
      next = new Element('span').set('text', 'successiva').addEvent('click', function() {
        this.renderFaq(index + 1);
        window.location.hash = 'top';
      }.bind(this)).inject(this.faq_nav);
    }

    /* audio */
    if(typeof item.audio != 'undefined') {
      mathex.Shared.playerWidget(item.audio);
    }
    else {
      mathex.Shared.playerWidget(null);
    }

  };

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
        'overflow': 'auto'
        //'top': (viewport.cY - 100) + 'px',
        //'left': (viewport.cX - 200) + 'px',
      }).inject($(document.body));
      var title = new Element('h2').set('html', mathex.Shared.parseTpl(item.question, []));
      var close = new Element('div.link.button-close').setStyles({
        position: 'absolute',
        right: 0,
        top: 0,
        'font-size': '32px'
      }).set('html', '&#215;').addEvent('click', function() { layer.dispose(); });
      layer.adopt(close, title, new Element('div').set('html', answer));
    }
    else {
      this.renderFaq(index);
    }
  }
}

mathex.Recovery = function(items) {
  this.items = items;
}

mathex.RecoveryRouter = function(recovery) {

  this.recovery = recovery;

  this.start = function() {
    this.r_div = new Element('div#r_container').inject($('container'), 'bottom');
    this.r_nav = new Element('div#r_nav').inject($('container'), 'bottom');
    // widgets
    if(mathex.config.font_ctrl) {
      mathex.Shared.fontWidget();
    }
    mathex.Shared.calculatorWidget();
    this.renderIndex();
  }

  this.renderIndex = function() {
    window.location.hash = '';
    this.r_div.empty();
    this.r_nav.empty();
    var list = new Element('ul').inject(this.r_div);
    this.recovery.items.each(function(item, index) {
      var li = new Element('li.link')
        .set('html', mathex.Shared.parseTpl(item.title, []))
        .addEvent('click', function() {
          this.renderRecovery(index);
        }.bind(this))
        .inject(list, 'bottom');
    }.bind(this));

    MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
  }

  this.renderRecovery = function(index) {
    window.location.hash = '';
    var item = this.recovery.items[index];
    this.r_div.empty();
    this.r_nav.empty();
    var tpl = mathex.Shared.parseTpl(item.tpl, []);

    // parse for hidden results
    var hidden_rexp = new RegExp("\\[\\[(.*?)\\]\\]", "gim");
    tpl = tpl.replace(hidden_rexp, "<span class=\"recovery-hidden\">$1</span>");
    this.r_div.set('html', "<h2>" + mathex.Shared.parseTpl(item.title, []) + "</h2>" + tpl);

    document.getElements('.recovery-hidden').addEvent('click', function() {
      this.removeClass('recovery-hidden');
    })

    MathJax.Hub.Queue(['Typeset',MathJax.Hub]);

    var prev = null, next = null;
    if(index > 0) {
      prev = new Element('span').set('text', 'precedente').addEvent('click', function() {
        this.renderRecovery(index - 1);
        window.location.hash = 'top';
      }.bind(this)).inject(this.r_nav);
    }
    var toindex = new Element('span').set('text', 'indice').addEvent('click', function() {
      this.renderIndex();
      window.location.hash = 'top';
    }.bind(this)).inject(this.r_nav);

    if(index < this.recovery.items.length - 1) {
      next = new Element('span').set('text', 'successiva').addEvent('click', function() {
        this.renderRecovery(index + 1);
        window.location.hash = 'top';
      }.bind(this)).inject(this.r_nav);
    }
  };

  this.goto = function(index) {
    this.renderRecovery(index);
  }
}

// place a top anchor in the header
window.addEvent('load', function() {
    var anchor = new Element('a', {name: 'top'}).set('text', 'top').setStyles({
        color: '#fff',
        'line-height': 0,
        position: 'absolute',
        top: 0
    }).inject($$('header')[0], 'after');
});
