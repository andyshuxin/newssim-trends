'use strict';

;(function (window, document, d3, newssimData) {
  'use strict';

  // Monkey patching for ES7 array includes
  Array.prototype.includes = function (element) {
    return this.indexOf(element) !== -1;
  };

  /**
   * Get the frequencies of a keyword in a data on daily basis
   * Days with no mentions are not included at all
   * @param {string}    word: keyword to search
   * @param {object}  data: database of content, arary of objects with content field
   * @return {object}   in form of {20130202: 3,
   *                                20130804: 2,
   *                                ...}
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
   * @param {object} wordCounts
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

  /**
   * Input n and return '0n' if n < 0
   * @param n
   */
  function padDatePart(n) {
    if (n < 10) {
      return '0' + n;
    } else {
      return '' + n;
    }
  }

  function getDaysInMonth(month) {
    var thirtyDaysMonth = [4, 6, 9, 11];
    var thirtyoneDaysMonth = [1, 3, 5, 7, 8, 10, 12];

    if (thirtyDaysMonth.includes(month)) {
      return 30;
    } else if (thirtyoneDaysMonth.includes(month)) {
      return 31;
    } else {
      return 28;
    }

    //FIXME: Wrong results on leap years
  }

  /**
   * Return the intervals of two dates, for example, input '201408' and '201502'
   * you get ['201408', '201409', '201410', '201411', '201412', '201501', '201502']
   * @param {string} startDate
   * @param {string} endDate
   */
  function getDateIntervals(startDate, endDate) {
    if (startDate.length !== endDate.length) {
      throw new Error('startDate and endDate have different length; aborting...');
    }

    var result = [];
    var startYear = undefined,
        startMonth = undefined,
        startDay = undefined,
        endYear = undefined,
        endMonth = undefined,
        endDay = undefined;
    switch (startDate.length) {

      // Years, like '2011' to '2015
      case 4:
        for (var i = +startDate; i <= +endDate; i += 1) {
          result.push(i.toString());
        }
        break;

      // Months, like '201104' to '201501'
      case 6:

        startYear = +startDate.slice(0, 4);
        startMonth = +startDate.slice(4, 6);
        endYear = +endDate.slice(0, 4);
        endMonth = +endDate.slice(4, 6);

        for (var year = startYear; year <= endYear; year += 1) {
          for (var month = 1; month <= 12; month += 1) {

            // First year: skip months before startMonth
            if (year === startYear && month < startMonth) {
              continue;
            }

            // Last year: skip months after endMonth
            if (year === endYear && month > endMonth) {
              continue;
            }

            result.push(year.toString() + padDatePart(month.toString()));
          }
        }

        break;

      // Days, like '20120401' to '20130801'
      case 8:
        startYear = +startDate.slice(0, 4);
        startMonth = +startDate.slice(4, 6);
        startDay = +startDate.slice(6, 8);
        endYear = +endDate.slice(0, 4);
        endMonth = +endDate.slice(4, 6);
        endDay = +endDate.slice(6, 8);

        for (var year = startYear; year <= endYear; year += 1) {
          for (var month = 1; month <= 12; month += 1) {
            for (var day = 1; day <= getDaysInMonth(month); day += 1) {

              // First year: skip months before startMonth
              if (year === startYear && month < startMonth) {
                continue;
              }

              // Last year: skip months after endMonth
              if (year === endYear && month > endMonth) {
                continue;
              }

              // First year and first month: skip days before startDay
              if (year === startYear && month === startMonth && day < startDay) {
                continue;
              }

              // last year and last month: skip days after startDay
              if (year === endYear && month === endMonth && day > endDay) {
                continue;
              }

              result.push('' + year + padDatePart(month) + padDatePart(day));
            }
          }
        }

        break;

      default:
        throw new Error('Unrecognized date format: ' + startDate);
    }

    return result;
  }

  /**
   * Transform data in form of {'201404': 32, '201408': 6} into an array like
   * [{period: '201404', value: 32},
   *  {period: '201406', value:  0},
   *  {period: '201407', value:  0},
   *  {period: '201408', value:  6}]
   * @param {object} data
   */
  function transformToArray(data) {

    var result = [];

    // Get the range of dates from data
    var minDate = 'Z';
    var maxDate = '';

    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        if (key < minDate) {
          minDate = key;
        }

        if (key > maxDate) {
          maxDate = key;
        }
      }
    } // Generate the array by pushing period-value pairs one by one
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = getDateIntervals(minDate, maxDate)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var period = _step2.value;

        if (data[period]) {
          result.push({
            period: period,
            value: data[period]
          });
        } else {
          result.push({
            period: period,
            value: 0
          });
        }
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2['return']) {
          _iterator2['return']();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    return result;
  }

  /*================================================
    END of data processing; START of DOM manipulation
   =================================================*/

  function getChosenPeriod() {

    var options = document.getElementsByName('period');
    for (var i = 0; i < options.length; i += 1) {
      if (options[i].checked) {
        return options[i].value;
      }
    }
  }

  // Hide loading notice as the script has been fully loaded by now
  var loadingNotice = document.getElementsByClassName('loading-notice')[0];
  loadingNotice.parentNode.removeChild(loadingNotice);

  // Get UI elements
  var btnConfirm = document.getElementsByClassName('btnConfirm')[0];
  var keywordInput = document.getElementsByClassName('keywordInput')[0];
  var dataDisplay = document.getElementById('display');

  btnConfirm.addEventListener('click', function (event) {
    var searchResults = transformToArray(aggregatePeriod(countWordByDay(keywordInput.value, newssimData), getChosenPeriod()));

    var selections = d3.select('#display').selectAll('div').data(searchResults);
    var newLines = selections.enter().append('p');
    newLines.append('span').classed({
      'description': true
    }).text(function (d) {
      return d.period + ': ' + d.value;
    });
    newLines.append('div').classed({
      "barBody": true
    }).style('height', '10px').style('width', '0').transition().style('width', function (d) {
      return d.value * 10 + 'px';
    });
    selections.exit().remove();
  });
})(window, window.document, window.d3, window.newssim_db);

//# sourceMappingURL=main-compiled.js.map