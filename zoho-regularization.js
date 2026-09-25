(async function () {
  const CHECK_IN_TIME = '09:00 AM';
  const CHECK_OUT_TIME = '06:00 PM';
  const REASON_TEXT = 'Worked from home';
  const DESC_TEXT = 'work from home';

  function fillMaskedInput(inputEl, fullText) {
    if (!inputEl) return;

    inputEl.focus();
    inputEl.select();
    inputEl.setSelectionRange(0, inputEl.value.length);

    const dt = new DataTransfer();
    dt.setData('text/plain', fullText);
    const pasteEv = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: dt
    });
    inputEl.dispatchEvent(pasteEv);

    if (inputEl.value !== fullText) {
      document.execCommand('insertText', false, fullText);
    }

    if (inputEl.value.includes('dd-MMM-yyyy') || inputEl.value.includes(':mm')) {
      inputEl.value = '';
      for (let i = 0; i < fullText.length; i++) {
        const char = fullText[i];
        inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
        inputEl.dispatchEvent(new KeyboardEvent('keypress', { key: char, bubbles: true }));
        inputEl.value += char;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
      }
    }

    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function selectZohoReason(index, label) {
    const container = document.getElementById(`reg_req_reason_${index}-container`);
    const listbox = document.getElementById(`reg_req_reason_${index}-listbox`);
    if (!container || !listbox) return;

    const trigger = container.querySelector('.zselectbox__arrow, .zselectbox__trigger, span') || container;
    trigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    trigger.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    await new Promise(resolve => setTimeout(resolve, 50));

    const items = Array.from(listbox.querySelectorAll('li, div[role="option"], div, span'));
    const match = items.find(el => el.children.length === 0 && el.innerText.trim().toLowerCase() === label.toLowerCase());

    if (match) {
      match.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      match.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      match.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }

    container.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    container.blur();
  }

  async function commitTimeInput(inputBox, hiddenInput) {
    if (!inputBox) return;

    inputBox.focus();
    inputBox.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    inputBox.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    inputBox.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    inputBox.dispatchEvent(new Event('input', { bubbles: true }));
    inputBox.dispatchEvent(new Event('change', { bubbles: true }));

    await new Promise(resolve => setTimeout(resolve, 50));

    inputBox.blur();
    inputBox.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    inputBox.dispatchEvent(new Event('change', { bubbles: true }));

    if (window.$) {$(inputBox).trigger('change').trigger('blur');
      if (hiddenInput) {
        $(hiddenInput).trigger('change').trigger('blur');
      }
    }
  }

  window.__runZohoAutomation = async function (isSecondPass = false) {
    const rows = document.querySelectorAll('#attRegTableBody tr:not(#attDetailsListRow):not(.DNI)');

    // Only set Reason & Description on Pass 1
    if (!isSecondPass) {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const dayEl = row.querySelector('#dayValue');
        const day = dayEl ? dayEl.innerText.trim().toLowerCase() : '';
        if (day === 'sat' || day === 'sun') continue;

        await selectZohoReason(i, REASON_TEXT);

        const desc = row.querySelector('input#reg_req_desc');
        if (desc) {
          desc.value = DESC_TEXT;
          desc.dispatchEvent(new Event('input', { bubbles: true }));
          desc.dispatchEvent(new Event('change', { bubbles: true }));
          if (window.regularization_operation?.checkSingleRowCharacterLimit && window.$) {
            regularization_operation.checkSingleRowCharacterLimit($(desc));
          }
        }
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Datetime Pass
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const dayEl = row.querySelector('#dayValue');
      const day = dayEl ? dayEl.innerText.trim().toLowerCase() : '';
      if (day === 'sat' || day === 'sun') continue;

      const dateCell = row.querySelector('#attRegDateDiv');
      const dateStr = dateCell ? dateCell.getAttribute('date_orgformat') : row.id;
      if (!dateStr) continue;

      const fullIn = `${dateStr} ${CHECK_IN_TIME}`;
      const fullOut = `${dateStr} ${CHECK_OUT_TIME}`;

      const checkInBox = row.querySelector(`#check-in-${index}-container input.zinputfield__textbox`);
      const checkOutBox = row.querySelector(`#check-out-${index}-container input.zinputfield__textbox`);
      const hiddenIn = document.getElementById(`check-in-${index}`);
      const hiddenOut = document.getElementById(`check-out-${index}`);

      fillMaskedInput(checkInBox, fullIn);
      if (hiddenIn) {
        hiddenIn.value = fullIn;
        hiddenIn.dispatchEvent(new Event('change', { bubbles: true }));
      }
      await commitTimeInput(checkInBox, hiddenIn);

      fillMaskedInput(checkOutBox, fullOut);
      if (hiddenOut) {
        hiddenOut.value = fullOut;
        hiddenOut.dispatchEvent(new Event('change', { bubbles: true }));
      }
      await commitTimeInput(checkOutBox, hiddenOut);

      if (window.regularization_operation && window.$) {
        try {
          if (hiddenOut && typeof regularization_operation.regFILOChangedTabular === 'function') {
            regularization_operation.regFILOChangedTabular($(hiddenOut));
          }
          if (typeof regularization_operation.calculateDuration === 'function') {
            regularization_operation.calculateDuration($(row));
          }
        } catch (e) {}
      }

      await new Promise(resolve => setTimeout(resolve, 80));
    }

    if (window.regularization_operation && typeof regularization_operation.calculateTotalHours === 'function') {
      try {
        regularization_operation.calculateTotalHours();
      } catch (e) {}
    }

    // Trigger Pass 2 automatically through the global task queue
    if (!isSecondPass) {
      console.log('Pass 1 finished. Starting automated Pass 2 in 400ms...');
      setTimeout(() => {
        window.__runZohoAutomation(true);
      }, 400);
    } else {
      console.log('✅ Automated Pass 2 complete. All durations calculated.');
    }
  };

  // Start execution
  await window.__runZohoAutomation(false);
})();
