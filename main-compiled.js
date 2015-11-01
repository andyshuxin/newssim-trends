'use strict';

;(function (window, document, d3, newssimData) {
  'use strict';

  /**
   * Get the frequencies of a keyword in a data on daily basis
   * @param {string}    word: keyword to search
   * @param {object}  data: database of content, arary of objects with content field
   * @return {object}   in form of {20130202: 3,
   *                                20130804: 2,
   *                                ...}
   *                    days with no mentions are not included at all
   */
  function countWordByDay(word, data) {

    var result = {};

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var entry = _step.value;

        if (entry.content.includes(word)) {
          if (result[entry.publish_date]) {
            result[entry.publish_date] += 1;
          } else {
            result[entry.publish_date] = 1;
          }
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator['return']) {
          _iterator['return']();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return result;
  }

  /**
   * Extract parts (year, month, or day) from a date string in the form of 20120823
   * @param {string} dateString
   * @returns {string[]}
   */
  function separateDateComponents(dateString) {
    return [dateString.slice(0, 4), dateString.slice(4, 6), dateString.slice(6, 8)];
  }

  /**
   * Aggregate word frequencies by week, month, or year
   * @param {object[]} wordCounts
   * @param {string} period
   */
  function aggregatePeriod(wordCounts) {
    var period = arguments.length <= 1 || arguments[1] === undefined ? 'month' : arguments[1];

    var result = {};

    var key = undefined,
        getKey = undefined;
    if (period === 'year') {
      getKey = function (date) {
        return date.slice(0, 4);
      };
    } else if (period === 'month') {
      getKey = function (date) {
        return date.slice(0, 6);
      };
    } else if (period === 'day') {
      getKey = function (date) {
        return date.slice(0, 8);
      };
    } else {
      throw new Error('un-implemented period: ', period);
    }

    for (var date in wordCounts) {
      if (wordCounts.hasOwnProperty(date)) {
        key = getKey(date);

        if (result[key]) {
          result[key] += wordCounts[date];
        } else {
          result[key] = wordCounts[date];
        }
      }
    }return result;
  }

  console.log(aggregatePeriod(countWordByDay('一胎', newssimData), 'year'));

  // Hide loading notice
  var loadingNotice = document.getElementsByClassName('loading-notice')[0];
  loadingNotice.parentNode.removeChild(loadingNotice);

  // Get DOM elements
  var btnConfirm = document.getElementsByClassName('btnConfirm')[0];
  var keywordInput = document.getElementsByClassName('keywordInput')[0];
  var display = document.getElementById('display');

  btnConfirm.addEventListener('click', function (event) {
    var searchResult = aggregatePeriod(countWordByDay(keywordInput.value, newssimData), 'month');
    var resultLine = undefined;
    var bar = undefined;
    display.innerHTML = '';

    for (var date in searchResult) {
      resultLine = document.createElement('p');
      bar = document.createElement('div');
      resultLine.textContent = date.toString() + '-' + searchResult[date];
      bar.style.height = '10px';
      bar.style.backgroundColor = 'black';
      bar.style.width = searchResult[date] * 100 + 'px';
      resultLine.appendChild(bar);
      display.appendChild(resultLine);
    }
  });
})(window, window.document, window.d3, window.newssim_db);

//# sourceMappingURL=main-compiled.js.map