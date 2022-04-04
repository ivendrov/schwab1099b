/**
 * Functions for entering 1099B transactions into TurboTax Online.
 *
 * See README.md for instructions.
 */


const eltIds = {
  'desc' : 'stk-transaction-summary-entry-views-0-fields-4-input-DescOfPropertyPP',
  'acq_date_radio' : 'stk-transaction-summary-entry-views-0-fields-5-choice-IsDateAcquiredALiteralInd',
  'acq' : 'stk-transaction-summary-entry-views-0-fields-5-choice-IsDateAcquiredALiteralInd-choices-0-choiceDetail-input-DateAcquiredDtPP',
  'sale' : 'stk-transaction-summary-entry-views-0-fields-7-input-DateSoldOrDisposedDtPP',
  'proceeds' : 'stk-transaction-summary-entry-views-0-fields-9-input-ProceedsAmtPP',
  'basis' : 'stk-transaction-summary-entry-views-0-fields-9-input-CostBasisAmtPP',
  'category' : 'stk-transaction-summary-entry-views-0-fields-3-choice-Form8949CodePP',
  'continue' : 'stk-transaction-summary-entry-views-0-actions-1-action_Next',
  'more_boxes' : 'stk-transaction-summary-entry-views-0-fields-11-multiSelect-choices-0',
  'wash' : 'stk-transaction-summary-entry-views-0-fields-12-collection-values-0-fieldCollection-values-1-input-WashSaleLossDisallowedAmtPP',
  'continue2' : 'stk-uncommon-views-0-actions-1-action_Next',
  'add_another' : 'stk-transaction-gateway-views-5-primaryInfo-0-table-SecurityDetailPP-actions-0-action_AddItem',
  'type' : 'stk-transaction-summary-entry-views-0-fields-0-staticSwitch-1-choice-InvestmentType',
}

function selectValueFor(category) {
  return "stk-transaction-summary-entry-views-0-fields-3-choice-Form8949CodePP-choices-" + category;
}

function selectValueForType() {
  return "stk-transaction-summary-entry-views-0-fields-0-staticSwitch-1-choice-InvestmentType-choices-3";
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

function getElement(eltId) {
  let el = document.getElementById(eltId);
  if (!el) {
    throw new Error("Couldn't find: " + eltId);
  }
  return el;
}

function click(eltId) {
  return new Promise(function(resolve, reject) {
    getElement(eltId).click();
    resolve(true);
  });
}

function focus(eltId) {
  return new Promise(function(resolve, reject) {
    getElement(eltId).focus();
    resolve(true);
  });
}

function enterData(eltId, value) {
  return new Promise(function(resolve, reject) {
    getElement(eltId).value = value;
    resolve(true);
  });
}

function waitForElement(eltId) {
  let tester = function(resolve, reject) {
    let el = document.getElementById(eltId);
    if (!el || el.offsetParent === null) {
      // wait 100ms and try again
      window.setTimeout(function() { tester(resolve, reject); }, 100);
    } else {
      resolve(true);
    }
  };
  return new Promise(tester);
}

function clickAndEnter(eltId, data) {
  return waitForElement(eltId)
      .then(focus.bind(null, eltId))
      .then(veryShortPause)
      .then(enterData.bind(null, eltId, data));
}

function dispatchChangeEvent(eltId) {
  return new Promise(function(resolve, reject) {
    let evt = new Event('change', {'bubbles': true, 'cancelable': false});
    getElement(eltId).dispatchEvent(evt);
    resolve(true);
  });
}

function enterOneRow(data, haveMore) {
  let promise = shortPause()
      .then(clickAndEnter.bind(null, eltIds['desc'], data['desc']))
      .then(shortPause)
      .then(clickAndEnter.bind(null, eltIds['acq'], data['acq']))
      .then(shortPause)
      .then(clickAndEnter.bind(null, eltIds['sale'], data['sale']))
      .then(shortPause)
      .then(clickAndEnter.bind(null, eltIds['proceeds'], data['proceeds']))
      .then(shortPause)
      .then(clickAndEnter.bind(null, eltIds['basis'], data['basis']))
      .then(shortPause)
      .then(clickAndEnter.bind(null, eltIds['category'], selectValueFor(data['category'])))
      .then(shortPause)
      .then(dispatchChangeEvent.bind(null, eltIds['category']))
      .then(shortPause)
      .then(clickAndEnter.bind(null, eltIds['type'], selectValueForType()))
      .then(shortPause)
      .then(dispatchChangeEvent.bind(null, eltIds['type']))
      .then(shortPause)
      .then(click.bind(null, eltIds['more_boxes']))
      .then(shortPause)
      .then(data["wash"] ? clickAndEnter.bind(null, eltIds['wash'], data["wash"]) : shortPause())
      .then(shortPause)
      .then(click.bind(null, eltIds['continue']))
      .then(longPause);
	/*
      .then(click.bind(null, eltIds['continue2'])); */
    
  if (haveMore) {
      return promise
          .then(longPause)
          .then(click.bind(null, eltIds['add_another']));
  }
  return promise;
}

function enterAll(entries) {
  entries.reduce(function(prev, currEntry, index) {
    return prev.then(function() {
      return enterOneRow(currEntry, index + 1 < entries.length);
    });
  }, longPause().then(longPause)).then(function() {
    console.log('All Done!');
  });
}
