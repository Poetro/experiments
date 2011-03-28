/*! Copyright (c) 2010-2011 Peter (Poetro) Galiba (http://poetro.hu/) MIT Licensed */

/**
 * @fileoverview Browser independent basic event handling.
 * @author Peter (Poetro) Galiba poetro@poetro.hu
 */
(function (window) {
  /**
   * Normalize the event object.
   *
   * The normalized properties:
   *   - target
   *   - preventDefault
   *   - stopPropagation
   *
   * @param {Object} event
   *   Event object. The function mutates the even object.
   * @returns {Element}
   *   Target of the event.
   */
  function normalizeEvent(event) {
    var target;

    if (!event) {
      event = window.event;
    }
    if (event.target) {
      target = event.target;
    }
    else if (event.srcElement) {
      target = event.srcElement;
    }
    if (target && target.nodeType == 3) {
      target = target.parentNode;
    }
    event.preventDefault = event.preventDefault || function () {
      this.returnValue = false;
    };
    event.stopPropagation = event.stopPropagation || function () {
      this.cancelBubble = true;
    };

    return target;
  }

  /**
   * Prepares callback function for addEvent.
   *
   * @param {Function} func
   *   The callback function.
   * @returns {Function}
   *   The new callback function.
   *
   * @see addEvent()
   * @see getCallback()
   */
  function prepareCallback(func) {
    // Prepare a function where the `this` is the target of the event.
    return function (event) {
      var target = normalizeEvent(event),
          returnValue = func.call(target, event);

      if (returnValue === false) {
        event.preventDefault();
        event.stopPropagation();
      }

      return returnValue;
    };
  }

  /**
   * Fetches a callback function for the specified function.
   *
   * @param {Function} func
   *   The function that needs the generated callback.
   * @param {String} [op]
   *   The operation to be done on the maintained function list.
   *   The list can be modified with the following operations:
   *    - 'add' : Adds the `func` to the list (or increments counter),
   *    - 'remove' : Removes the `func` from the list (or increments counter).
   */
  function getCallback(func, op) {
    var gc = getCallback, fl, i, map, f, index = -1;

    // Maintained `static` function list.
    if (!gc.fl) {
      gc.fl = [];
    }
    fl = gc.fl;

    // Iterate through our list, to get the item.
    for (i = fl.length - 1; i >= 0; i -= 1) {
      map = fl[i];
      if (map && map.original === func) {
        index = i;
        f = map.generated;
        break;
      }
    }

    if (op === 'remove') {
      if (index !== -1) {
        fl[index].counter -= 1;
        if (fl[index].counter <= 0) {
          delete fl[index];
        }
      }
    }
    else if (op === 'add') {
      if (index !== -1) {
        fl[index].counter += 1;
      }
      else {
        f = prepareCallback(func);
        fl[fl.length] = {
          original  : func,
          generated : f,
          counter   : 1
        };
      }
    }

    return f;
  }

  /**
   * Remove an event handler from the specifed element.
   *
   * @param {Element} elm
   *   The DOM element from which the event handler to be removed.
   * @param {String} evt
   *   The type of the event, ex. `click`.
   * @param {Function} func
   *   The callback function that is invoked by the event.
   */
  this.removeEvent = function (elm, evt, func) {
    var f = getCallback(func, 'remove'),
        removeEventListener = elm.removeEventListener,
        detachEvent = elm.detachEvent;

    if (removeEventListener) {
      removeEventListener.call(elm, evt, f, false);
    }
    else if (detachEvent) {
      detachEvent.call(elm, 'on' + evt, f);
    }
    else {
      elm['on' + evt] = null;
    }
  };

  /**
   * Add an event handler to the specifed element.
   *
   * @param {Element} elm
   *   The DOM element to which the event handler to be added.
   * @param {String} evt
   *   The type of the event, ex. `click`.
   * @param {Function} func
   *   The callback function that is invoked by the event.
   */
  this.addEvent = function (elm, evt, func) {
    var f = getCallback(func, 'add'),
        addEventListener = elm.addEventListener,
        attachEvent = elm.attachEvent;

    if (addEventListener) {
      addEventListener.call(elm, evt, f, false);
    }
    else if (attachEvent) {
      attachEvent.call(elm, 'on' + evt, f);
    }
    else {
      elm['on' + evt] = f;
    }
  };
}).call(this, this);