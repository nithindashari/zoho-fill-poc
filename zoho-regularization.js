(async function () {
  var checkInTime = '09:00 AM';
  var checkOutTime = '06:00 PM';
  var reasonText = 'Worked from home';
  var descText = 'work from home';

  function fillMaskedInput(inputEl, fullText) {
    if (!inputEl) return;

    inputEl.focus();
    inputEl.select();
    inputEl.setSelectionRange(0, inputEl.value.length);

    var dt = new DataTransfer();
    dt.setData('text/plain', fullText);
    var pasteEv = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: dt
    });
    inputEl.dispatchEvent(pasteEv);

    if (inputEl.value !== fullText) {
      document.execCommand('insertText', false, fullText);
    }

    if (inputEl.value.indexOf('dd-MMM-yyyy') !== -1 || inputEl.value.indexOf(':mm') !== -1) {
      inputEl.value = '';
      for (var i = 0; i < fullText.length; i++) {
        var char = fullText[i];
        inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
        inputEl.dispatchEvent(new KeyboardEvent('keypress', { key: char, bubbles: true }));
        inputEl.value += char;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
      }
    }

    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    inputEl.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
  }

  async function selectZohoReason(index, label) {
    var container = document.getElementById('reg_req_reason_' + index + '-container');
    var listbox = document.getElementById('reg_req_reason_' + index + '-listbox');
    if (!container || !listbox) return;

    var trigger = container.querySelector('.zselectbox__arrow, .zselectbox__trigger, span') || container;
    trigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    trigger.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    await new Promise(function (resolve) { setTimeout(resolve, 60); });

    var items = Array.from(listbox.querySelectorAll('li, div[role="option"], div, span'));
    var match = items.find(function (el) {
      return el.children.length === 0 && el.innerText.trim().toLowerCase() === label.toLowerCase();
    });

    if (match) {
      match.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      match.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      match.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }

    container.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    container.blur();
  }

  function triggerZohoCalculation(row, hiddenIn, hiddenOut) {
    if (window.regularization_operation && window.$) {
      try {
        var $row = $(row);
        var $in = $(hiddenIn);
        var $out = $(hiddenOut);

        if (typeof regularization_operation.regFILOChangedTabular === 'function') {
          regularization_operation.regFILOChangedTabular($in);
          regularization_operation.regFILOChangedTabular($out);
        }
        if (typeof regularization_operation.calculateDuration === 'function') {
          regularization_operation.calculateDuration($row);
        }
        if (typeof regularization_operation.calculateTotalHours === 'function') {
          regularization_operation.calculateTotalHours();
        }
      } catch (e) {
        console.warn('Direct calculation call error:', e);
      }
    }
  }

  var rows = document.querySelectorAll('#attRegTableBody tr:not(#attDetailsListRow):not(.DNI)');

  for (var index = 0; index < rows.length; index++) {
    var row = rows[index];

    // 1. Skip weekends
    var dayEl = row.querySelector('#dayValue');
    var day = dayEl ? dayEl.innerText.trim().toLowerCase() : '';
    if (day === 'sat' || day === 'sun') {
      continue;
    }

    // 2. Extract date
    var dateCell = row.querySelector('#attRegDateDiv');
    var dateStr = dateCell ? dateCell.getAttribute('date_orgformat') : row.id;
    if (!dateStr) continue;

    var fullIn = dateStr + ' ' + checkInTime;
    var fullOut = dateStr + ' ' + checkOutTime;

    // 3. Fill textboxes (paste/insertText)
    var checkInBox = row.querySelector('#check-in-' + index + '-container input.zinputfield__textbox');
    var checkOutBox = row.querySelector('#check-out-' + index + '-container input.zinputfield__textbox');

    fillMaskedInput(checkInBox, fullIn);
    fillMaskedInput(checkOutBox, fullOut);

    // 4. Update hidden inputs and fire change
    var hiddenIn = document.getElementById('check-in-' + index);
    if (hiddenIn) {
      hiddenIn.value = fullIn;
      hiddenIn.dispatchEvent(new Event('change', { bubbles: true }));
    }
    var hiddenOut = document.getElementById('check-out-' + index);
    if (hiddenOut) {
      hiddenOut.value = fullOut;
      hiddenOut.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // 5. Select Reason
    await selectZohoReason(index, reasonText);

    // 6. Fill Description
    var desc = row.querySelector('input#reg_req_desc');
    if (desc) {
      desc.value = descText;
      desc.dispatchEvent(new Event('input', { bubbles: true }));
      desc.dispatchEvent(new Event('change', { bubbles: true }));
      if (window.regularization_operation && regularization_operation.checkSingleRowCharacterLimit && window.$) {
        regularization_operation.checkSingleRowCharacterLimit($(desc));
      }
    }

    // 7. Trigger row and grand total duration calculations
    triggerZohoCalculation(row, hiddenIn, hiddenOut);
  }

  // Final pass for grand totals across the entire table
  if (window.regularization_operation && typeof regularization_operation.calculateTotalHours === 'function') {
    try {
      regularization_operation.calculateTotalHours();
    } catch (e) {}
  }

  console.log('✅ Form automated: dates, calculated hours, and reasons intact.');
})();
