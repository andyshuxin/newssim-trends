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
  function countWordByDay (word, data) {

    let result = {}

    for (let entry of data) {
      if (entry.content.includes(word)) {
        if (result[entry.publish_date]) {
          result[entry.publish_date] += 1
        } else {
          result[entry.publish_date] = 1
        }
      }
    }

    return result
  }

  /**
   * Extract parts (year, month, or day) from a date string in the form of 20120823
   * @param {string} dateString
   * @returns {string[]}
   */
  function separateDateComponents(dateString) {
    return [dateString.slice(0, 4),
            dateString.slice(4, 6),
            dateString.slice(6, 8)]
  }

  /**
   * Aggregate word frequencies by week, month, or year
   * @param {object[]} wordCounts
   * @param {string} period
   */
  function aggregatePeriod (wordCounts, period = 'month') {

    let result = {}

    let key, getKey
    if (period === 'year') {
      getKey = (date) => date.slice(0, 4)
    } else if (period === 'month') {
      getKey = (date) => date.slice(0, 6)
    } else if (period === 'day') {
      getKey = (date) => date.slice(0, 8)
    } else {
      throw new Error('un-implemented period: ', period)
    }

    for (let date in wordCounts) if (wordCounts.hasOwnProperty(date)) {
      key = getKey(date)

      if (result[key]) {
        result[key] += wordCounts[date]
      } else {
        result[key] = wordCounts[date]
      }
    }

    return result
  }

  console.log(aggregatePeriod(countWordByDay('一胎', newssimData), 'year'))

  // Hide loading notice
  const loadingNotice = document.getElementsByClassName('loading-notice')[0]
  loadingNotice.parentNode.removeChild(loadingNotice)

  // Get DOM elements
  const btnConfirm = document.getElementsByClassName('btnConfirm')[0]
  const keywordInput = document.getElementsByClassName('keywordInput')[0]
  const display = document.getElementById('display')

  btnConfirm.addEventListener('click', (event) => {
    let searchResult = aggregatePeriod(countWordByDay(keywordInput.value, newssimData), 'month')
    let resultLine
    let bar
    display.innerHTML = ''

    for (let date in searchResult) {
      resultLine = document.createElement('p')
      bar = document.createElement('div')
      resultLine.textContent = date.toString() + '-' + searchResult[date]
      bar.style.height = '10px'
      bar.style.backgroundColor = 'black'
      bar.style.width = searchResult[date] * 100 + 'px'
      resultLine.appendChild(bar)
      display.appendChild(resultLine)
    }
  })

})(window, window.document, window.d3, window.newssim_db)