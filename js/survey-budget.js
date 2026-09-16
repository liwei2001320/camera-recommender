// js/survey-budget.js
(function () {
  const id = (n) => document.getElementById(n);
  const q = (s) => document.querySelectorAll(s);

  // ABC tiers mapping
  const tiers = {
    A: { min: 5000, max: 15000 },
    B: { min: 15001, max: 30000 },
    C: { min: 30001, max: 50000 }
  };

  function init() {
    q('input[name="budgetOpt"]').forEach(el => el.addEventListener('change', onBudgetChange));
    if (id('customMin')) id('customMin').addEventListener('input', onCustomBudgetInput);
    if (id('customMax')) id('customMax').addEventListener('input', onCustomBudgetInput);

    q('input[name="allocOpt"]').forEach(el => el.addEventListener('change', onAllocChange));
    if (id('bodyPercent')) {
      id('bodyPercent').addEventListener('input', (e) => {
        id('bodyPercentVal').innerText = e.target.value + '%';
        computeBudgets();
      });
    }

    const saveBtn = document.querySelector('button#submitBtn') || document.querySelector('button#saveBtn');
    if (saveBtn) saveBtn.addEventListener('click', () => prepareBudgetAndAlloc());

    const f = document.querySelector('form#surveyForm');
    if (f) f.addEventListener('submit', () => prepareBudgetAndAlloc());
  }

  function onBudgetChange(e) {
    const v = e.target.value;
    if (v === 'custom') {
      if (id('customBudgetInputs')) id('customBudgetInputs').style.display = 'block';
    } else {
      if (id('customBudgetInputs')) id('customBudgetInputs').style.display = 'none';
      const t = tiers[v];
      if (t) {
        id('budgetMin').value = t.min;
        id('budgetMax').value = t.max;
      }
    }
    computeBudgets();
  }

  function onCustomBudgetInput(){
    const min = parseInt(id('customMin')?.value || 0, 10);
    const max = parseInt(id('customMax')?.value || 0, 10);
    if (min>0 && max>=min) {
      id('budgetMin').value = min;
      id('budgetMax').value = max;
    }
    computeBudgets();
  }

  function onAllocChange(e) {
    const v = e.target.value;
    if (v === 'customAlloc') {
      if (id('customAllocInputs')) id('customAllocInputs').style.display = 'block';
    } else {
      if (id('customAllocInputs')) id('customAllocInputs').style.display = 'none';
      const parts = v.split('-').map(x => parseInt(x, 10));
      if (parts.length === 2 && !isNaN(parts[0])) {
        if (id('bodyPercent')) {
          id('bodyPercent').value = parts[0];
          id('bodyPercentVal').innerText = parts[0] + '%';
        }
      }
    }
    computeBudgets();
  }

  function computeBudgets() {
    const min = parseInt(id('budgetMin')?.value || 0, 10);
    const max = parseInt(id('budgetMax')?.value || 0, 10);
    const bodyPercent = parseInt(id('bodyPercent')?.value || 50, 10);
    if (min && max && min <= max) {
      const mid = Math.round((min + max) / 2);
      const bodyAmt = Math.round(mid * bodyPercent / 100);
      const lensAmt = mid - bodyAmt;
      if (id('bodyBudget')) id('bodyBudget').value = bodyAmt;
      if (id('lensBudget')) id('lensBudget').value = lensAmt;
      if (id('bodyPercentHidden')) id('bodyPercentHidden').value = bodyPercent;
      if (id('budgetHint')) id('budgetHint').innerText = `按当前选择：机身 ≈ ${bodyAmt} 元，镜头 ≈ ${lensAmt} 元（预算中值 ${mid} 元）`;
    }
  }

  window.prepareBudgetAndAlloc = function () {
    computeBudgets();
    return {
      budgetMin: parseInt(id('budgetMin')?.value || 0, 10),
      budgetMax: parseInt(id('budgetMax')?.value || 0, 10),
      bodyBudget: parseInt(id('bodyBudget')?.value || 0, 10),
      lensBudget: parseInt(id('lensBudget')?.value || 0, 10),
      bodyPercent: parseInt(id('bodyPercentHidden')?.value || id('bodyPercent')?.value || 50, 10)
    };
  };

  document.addEventListener('DOMContentLoaded', init);
})();