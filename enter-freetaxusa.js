/**
 * Functions for entering 1099B transactions into TurboTax Online.
 *
 * See README.md for instructions.
 */


const eltSelectors = {
  'owner': '#ts_flag-T',  // NOTE: confirm ID before using
  'single-stock': '#sale_type-I',
  'desc' : '#temp_inv_desc',
  'acq' : '#acq_date',
  'sale' : '#sold_date',
  'proceeds' : '#sale_price',
  'basis' : '#temp_basis',
  'not-reported': '#basis_shown-B', // TODO: deal with different types
  'continue' : '.btn.btn-primary.mx-1.button1',
}

function waitFor(millisecs) {
  return new Promise(function(resolve, reject) {
    window.setTimeout(function() { resolve(true); }, millisecs);
  });
}

function veryShortPause() {
  return waitFor(100);
}

function shortPause() {
  return waitFor(1000);
}

function longPause() {
  return waitFor(3000);
}

function getElement(eltSelector) {
  let el = document.querySelector(eltSelector);
  if (!el) {
    throw new Error("Couldn't find: " + eltSelector);
  }
  return el;
}

function click(eltSelector) {
  return new Promise(function(resolve, reject) {
    getElement(eltSelector).click();
    resolve(true);
  });
}

function focus(eltSelector) {
  return new Promise(function(resolve, reject) {
    getElement(eltSelector).focus();
    resolve(true);
  });
}

function enterData(eltSelector, value) {
  return new Promise(function(resolve, reject) {
    getElement(eltSelector).value = value;
    resolve(true);
  });
}

function waitForElement(eltSelector) {
  let tester = function(resolve, reject) {
    let el = document.querySelector(eltSelector);
    if (!el || el.offsetParent === null) {
      // wait 100ms and try again
      window.setTimeout(function() { tester(resolve, reject); }, 100);
    } else {
      resolve(true);
    }
  };
  return new Promise(tester);
}

function focusAndEnter(eltSelector, data) {
  return waitForElement(eltSelector)
    .then(() => focus(eltSelector))
    .then(veryShortPause)
    .then(() => enterData(eltSelector, data));
}

function waitAndClick(eltSelector) {
  return waitForElement(eltSelector)
    .then(() => click(eltSelector));
}

function enterOneRow(data, haveMore) {
  // TODO: handle wash sales and other situations.
  return shortPause()
    .then(() => waitAndClick(eltSelectors['continue']))
    .then(shortPause)
    .then(() => waitAndClick(eltSelectors['owner']))
    .then(shortPause)
    .then(() => waitAndClick(eltSelectors['single-stock']))
    .then(shortPause)
    .then(() => waitAndClick(eltSelectors['continue']))
    .then(shortPause)
    .then(() => focusAndEnter(eltSelectors['desc'], data['desc']))
    .then(shortPause)
    .then(() => focusAndEnter(eltSelectors['acq'], data['acq']))
    .then(shortPause)
    .then(() => focusAndEnter(eltSelectors['sale'], data['sale']))
    .then(shortPause)
    .then(() => focusAndEnter(eltSelectors['proceeds'], data['proceeds']))
    .then(shortPause)
    .then(() => focusAndEnter(eltSelectors['basis'], data['basis']))
    .then(shortPause)
    .then(() => click(eltSelectors['not-reported']))
    .then(shortPause)
    .then(() => click(eltSelectors['continue']))
    .then(shortPause)
    .then(() => waitAndClick(eltSelectors['continue']))
  ;
}

function enterAll(entries) {
  entries.reduce(
      (prev, currEntry) => prev.then(() => enterOneRow(currEntry)),
      longPause()
  ).then(() => console.log('All Done!'));
}
