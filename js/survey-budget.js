// js/survey-budget.js
// 预算选择 + 机身/镜头分配交互脚本
(function () {
  // helpers
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function id(n){ return document.getElementById(n); }

  // 初始化绑定
  function initBudgetUI() {
    $$('input[name="budgetOpt"]').forEach(el => el.addEventListener('change', onBudgetChange));
    const customMin = id('customMin'); if (customMin) customMin.addEventListener('input', onCustomBudgetInput);
    const customMax = id('customMax'); if (customMax) customMax.addEventListener('input', onCustomBudgetInput);

    $$('input[name="allocOpt"]').forEach(el => el.addEventListener('change', onAllocChange));
    const bodyRange = id('bodyPercent');
    if (bodyRange) {
      bodyRange.addEventListener('input', (e) => {
        id('bodyPercentVal').innerText = e.target.value + '%';
        computeBudgets();
      });
    }

    // 在提交按钮上确保预处理
    const saveButton = id('saveSubmissionBtn') || $('button.save-submission') || $('button#save');
    if (saveButton) {
      saveButton.addEventListener('click', (ev) => {
        prepareBudgetAndAlloc();
        // allow normal submit flow to continue after we set hidden fields
      });
    }
  }

  function onBudgetChange(e) {
    const v = e.target.value;
    const customBlock = id('customBudgetInputs');
    if (v === 'custom') {
      if (customBlock) customBlock.style.display = 'block';
    } else {
      if (customBlock) customBlock.style.display = 'none';
      const [min, max] = v.split('-').map(x => parseInt(x, 10));
      if (!isNaN(min)) id('budgetMin').value = min;
      if (!isNaN(max)) id('budgetMax').value = max;
    }
    computeBudgets();
  }

  function onCustomBudgetInput() {
    const min = parseInt(id('customMin').value, 10) || 0;
    const max = parseInt(id('customMax').value, 10) || 0;
    if (min > 0 && max >= min) {
      id('budgetMin').value = min;
      id('budgetMax').value = max;
    }
    computeBudgets();
  }

  function onAllocChange(e) {
    const v = e.target.value;
    const customAllocBlock = id('customAllocInputs');
    if (v === 'customAlloc') {
      if (customAllocBlock) customAllocBlock.style.display = 'block';
    } else {
      if (customAllocBlock) customAllocBlock.style.display = 'none';
      // expected format "50-50" or "80-20"
      const [b, l] = v.split('-').map(x => parseInt(x, 10));
      if (!isNaN(b) && id('bodyPercent')) {
        id('bodyPercent').value = b;
        id('bodyPercentVal').innerText = b + '%';
      }
    }
    computeBudgets();
  }

  function computeBudgets() {
    const min = parseInt(id('budgetMin').value, 10) || 0;
    const max = parseInt(id('budgetMax').value, 10) || 0;
    const bodyPercent = parseInt(id('bodyPercent')?.value || '50', 10);
    if (min && max && min <= max) {
      const mid = Math.round((min + max) / 2);
      const bodyAmt = Math.round(mid * bodyPercent / 100);
      const lensAmt = mid - bodyAmt;
      id('bodyBudget').value = bodyAmt;
      id('lensBudget').value = lensAmt;

      const hintEl = id('budgetHint');
      if (hintEl) {
        hintEl.innerText = `按当前选择：机身 ≈ ${bodyAmt} 元，镜头 ≈ ${lensAmt} 元（预算中值 ${mid} 元）`;
      }
    }
  }

  // call this before submission to ensure hidden fields filled
  window.prepareBudgetAndAlloc = function () {
    computeBudgets();
    // return object if needed
    return {
      budgetMin: parseInt(id('budgetMin').value, 10) || null,
      budgetMax: parseInt(id('budgetMax').value, 10) || null,
      bodyBudget: parseInt(id('bodyBudget').value, 10) || null,
      lensBudget: parseInt(id('lensBudget').value, 10) || null,
      bodyPercent: parseInt(id('bodyPercent')?.value || 50, 10)
    };
  };

  // auto init when DOM ready
  document.addEventListener('DOMContentLoaded', initBudgetUI);
})();
