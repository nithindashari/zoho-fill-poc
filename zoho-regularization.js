(function () {
  var checkInTime = '09:00 AM';
  var checkOutTime = '06:00 PM';
  var reasonVal = '1';
  var reasonText = 'Forgot to check-out';
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
    inputEl.blur();
  }

  // Simulates a genuine user "click-in" and "click-out"
  function simulateUserClickInOut(element) {
    if (!element) return;
    element.focus();
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.blur();
    element.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  }

  var rows = document.querySelectorAll('#attRegTableBody tr:not(#attDetailsListRow):not(.DNI)');

  rows.forEach(function (row, index) {
    // 1. Skip weekends
    var dayEl = row.querySelector('#dayValue');
    var day = dayEl ? dayEl.innerText.trim().toLowerCase() : '';
    if (day === 'sat' || day === 'sun') {
      return;
    }

    // 2. Date
    var dateCell = row.querySelector('#attRegDateDiv');
    var dateStr = dateCell ? dateCell.getAttribute('date_orgformat') : row.id;
    if (!dateStr) return;

    var fullIn = dateStr + ' ' + checkInTime;
    var fullOut = dateStr + ' ' + checkOutTime;

    // 3. Fill textboxes
    var checkInBox = row.querySelector('#check-in-' + index + '-container input.zinputfield__textbox');
    var checkOutBox = row.querySelector('#check-out-' + index + '-container input.zinputfield__textbox');

    fillMaskedInput(checkInBox, fullIn);
    fillMaskedInput(checkOutBox, fullOut);

    // Sync hidden base inputs
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

    // 4. Trigger click-in and click-out cycle to trigger hours calculation
    simulateUserClickInOut(checkInBox);
    simulateUserClickInOut(checkOutBox);

    // Direct invocation of Zoho's row calculation methods
    if (window.regularization_operation && window.$) {
      try {
        if (typeof regularization_operation.regFILOChangedTabular === 'function' && hiddenOut) {
          regularization_operation.regFILOChangedTabular($(hiddenOut));
        }
        if (typeof regularization_operation.calculateDuration === 'function') {
          regularization_operation.calculateDuration($(row));
        }
      } catch (e) {}
    }

    // 5. Fill Reason
    var sel = document.getElementById('reg_req_reason_' + index);
    if (sel) {
      sel.value = reasonVal;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    var selBox = document.getElementById('reg_req_reason_' + index + '-container');
    if (selBox) {
      var txt = selBox.querySelector('.zselectbox__text');
      if (txt) txt.textContent = reasonText;
    }

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
  });

  console.log('✅ Form automated with total hours calculated.');
})();