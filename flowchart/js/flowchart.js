"use strict";

var flowchart = {};

flowchart.EventDispatcher = {
  _prefix: 'on_',
  listeners: {},
  register: function(evt_name, bind, callback) {
    var _evt_name = this._prefix + evt_name;
    if(typeof this.listeners[_evt_name] == 'undefined') {
      this.listeners[_evt_name] = [];
    }
    this.listeners[_evt_name].push([bind === null ? this : bind, callback]);
  },
  emit: function(evt_name, params) {
    var _evt_name = this._prefix + evt_name;
    if(typeof this.listeners[_evt_name] != 'undefined') {
      for(var i = 0, l = this.listeners[_evt_name].length; i < l; i++) {
        this.listeners[_evt_name][i][1].call(this.listeners[_evt_name][i][0], evt_name, params);
      }
    }
  }
}

flowchart.BlockFactory = function(type, node) {
  if(type == 'straight') {
    return new flowchart.StraightBlock(node);
  }
  else if(type == 'conditional') {
    return new flowchart.ConditionalBlock(node);
  }
  else if(type == 'error') {
    return new flowchart.ErrorBlock(node);
  }
  else if(type == 'end') {
    return new flowchart.EndBlock(node);
  }
}

/**
 * Block ancestor class
 */
flowchart.Block = {
  _status: 'idle',
  init: function(node) {
    this._id = node.attr('id');
  },
  remove: function() {
    jQuery(this._block_container).remove();
  }
}

/**
 * Straight Block, no choices
 */
flowchart.StraightBlock = function(node) {

  this.init(node);
  this._next = node.attr('next');

  this.render = function() {

    var self = this;

    var block_content = jQuery('<div/>', {
      'class': 'block-content',
      html: node.children('html').text()
    });

    var block_arrow = jQuery('<span/>', {
      'class': 'fa fa-3x fa-arrow-down link'
    }).bind('click', function() {
      self.updateStatus('selected');
      flowchart.EventDispatcher.emit('block-click', {
        from: self._id,
        next: self._next
      });
    });

    var block_controllers = jQuery('<div/>', {
      'class': 'block-controllers',
    }).append(block_arrow);

    this._block_container = jQuery('<div/>', {
      'id': 'block_' + self._id,
      'class': 'block straight'
    }).append(block_content, block_controllers);

    return this._block_container;
  }

  this.updateStatus = function(status) {
    if(status == 'selected') {
      this._block_container.find('.selected').removeClass('selected');
      this._block_container.addClass(status);
      this._block_container.find('.fa-arrow-down').addClass(status);
    }
  }

}
flowchart.StraightBlock.prototype = flowchart.Block;

/**
 * Conditional Block
 */
flowchart.ConditionalBlock = function(node) {

  this.init(node);
  this._answers = node.children('answer');

  this.render = function() {

    var self = this;

    var block_content = jQuery('<div/>', {
      'class': 'block-content',
      html: node.children('html').text()
    });

    var block_arrows_row = jQuery('<tr/>');
    var block_answers_row = jQuery('<tr/>');
    var block_controllers_table = jQuery('<table/>').append(block_answers_row, block_arrows_row);

    for(var i = 0, l = this._answers.length; i < l; i++) {
      var answer = jQuery(this._answers[i]);
      var block_arrow = jQuery('<span/>', {
        'class': 'fa fa-3x fa-arrow-down link'
      }).attr('data-index', i).bind('click', function() {
        var index = jQuery(this).attr('data-index');
        self.updateStatus('selected-' + index);
        flowchart.EventDispatcher.emit('block-click', {
          from: self._id,
          next: jQuery(self._answers[index]).attr('next')
        });
      }).appendTo(jQuery('<td style="width: ' + (100 / l) + '%">').appendTo(block_arrows_row));
      var block_answer = jQuery('<div/>', {
        'class': 'answer',
        html: answer.children('html').text()
      }).attr('data-answer', i).appendTo(jQuery('<td/>').appendTo(block_answers_row))
    }

    var block_controllers = jQuery('<div/>', {
      'class': 'block-controllers',
    }).append(block_controllers_table);

    this._block_container = jQuery('<div/>', {
      'id': 'block_' + self._id,
      'class': 'block conditional'
    }).append(block_content, block_controllers);

    return this._block_container;
  }

  this.updateStatus = function(status) {
    if(/selected-.*/.test(status)) {
      this._block_container.addClass('selected');
      this._block_container.find('.selected').removeClass('selected');
      this._block_container.find('[data-answer=' + status.replace(/^selected-/, '') + ']').addClass('selected');
      this._block_container.find('[data-index=' + status.replace(/^selected-/, '') + ']').addClass('selected');
    }
  }

}
flowchart.ConditionalBlock.prototype = flowchart.Block;

/**
 * Error Block
 */
flowchart.ErrorBlock = function(node) {

  this.init(node);

  this.render = function() {

    var self = this;

    var block_content = jQuery('<div/>', {
      'class': 'block-content',
      html: node.children('html').text()
    });

    this._block_container = jQuery('<div/>', {
      'id': 'block_' + self._id,
      'class': 'block error'
    }).append(block_content);

    return this._block_container;
  }

}
flowchart.ErrorBlock.prototype = flowchart.Block;

/**
 * End Block
 */
flowchart.EndBlock = function(node) {

  this.init(node);

  this.render = function() {

    var self = this;

    var block_content = jQuery('<div/>', {
      'class': 'block-content',
      html: node.children('html').text()
    });

    this._block_container = jQuery('<div/>', {
      'id': 'block_' + self._id,
      'class': 'block end'
    }).append(block_content);

    return this._block_container;
  }

}
flowchart.EndBlock.prototype = flowchart.Block;

/**
 * Chart class
 */
flowchart.Chart = function() {

  this._history = [];
  this._history_obj = {};

  /**
   * Loads the xml object from path
   */
  this.getXmlObject = function(path) {
    var xml_object = null;
    var xmltext = jQuery.ajax({
        async: false,
        type:"GET",
        context: this,
        url: path,
        dataType:"xml"
      }).responseText;

    var parser = new DOMParser();
    xml_object = parser.parseFromString(xmltext, "text/xml");

    return xml_object;

  }

  this.start = function(path) {

    // retrieve xml object
    this._xml_object = this.getXmlObject(path);
    // create html container element
    this._chart = jQuery('<div id="chart"></div>').appendTo('body');
    // retrieve root element
    this._root = jQuery(this._xml_object).children('chart');
    // register event listening
    flowchart.EventDispatcher.register('block-click', this, this.listen);
    // run the first block
    this.run(0, 1);
  }

  this.listen = function(evt_name, params) {
    this.run(params.from, params.next);
  }

  this.run = function(from, id) {

    id = parseInt(id);
    from = parseInt(from);

    var history_index = jQuery(this._history).index(from);

    if(history_index > -1) {
      // second time click, delete all story backward till there
      var l = this._history.length;
      for(var i = l - 1; i > history_index; i--) {
        var index = this._history.pop();
        this._history_obj[index].remove();
        delete this._history_obj[index];
      }
      //
    }

    var node = this._root.children('block[id=' + id + ']');
    var type = node.attr('type');
    var block_obj = flowchart.BlockFactory(type, node);

    var block_element = block_obj.render();
    block_element.appendTo(this._chart);

    this._history.push(id);
    this._history_obj[id] = block_obj;
  }

}

