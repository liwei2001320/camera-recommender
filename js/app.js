// App logic for Camera Recommender - enhanced UX (dynamic, minimal questions first)
const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => Array.from(document.querySelectorAll(sel));

let cameras = [];

async function init(){
  bindUI();
  try{
    const res = await fetch('data/cameras.json');
    cameras = await res.json();
  }catch(e){
    console.warn('无法载入机型数据', e);
    cameras = [];
  }
  // shared result handling
  const params = new URLSearchParams(location.search);
  if(params.get('shared')){
    const payload = params.get('data');
    if(payload){
      try{
        const parsed = JSON.parse(decodeURIComponent(atob(payload)));
        renderRecommendations(parsed.recs || [], parsed.meta || {});
        showSection('result');
      }catch(err){console.warn(err)}
    }
  }
}

function bindUI(){
  qs('#startBtn').addEventListener('click', ()=>{startQuickFlow();});
  qs('#resumeBtn').addEventListener('click', ()=>{loadHistory(); showSection('history')});
  qs('#langBtn').addEventListener('click', toggleLang);
  qs('#prevBtn')?.addEventListener('click', ()=>{prevStep()});
  qs('#surveyForm').addEventListener('submit', onSubmit);
  qs('#saveBtn')?.addEventListener('click', saveCurrent);
  qs('#exportBtn')?.addEventListener('click', exportCSV);
  qs('#shareBtn')?.addEventListener('click', shareCurrent);
  qs('#compareBtn')?.addEventListener('click', ()=>{qs('#compareArea').classList.toggle('hidden')});
  qs('#clearHistory')?.addEventListener('click', ()=>{localStorage.removeItem('camera_history'); loadHistory()});
}

function startQuickFlow(){
  // show a compact quick-start modal (we reuse step 1 for simplicity)
  // Pre-fill some fields with defaults and show first simplified step
  showSection('survey');
  showStep(1);
  // emphasize quick mode: collapse advanced steps
}

function showSection(id){
  qsa('main .card').forEach(c => c.classList.add('hidden'));
  qs('#'+id).classList.remove('hidden');
}

function showStep(n){
  qsa('#survey .step').forEach(s => s.classList.add('hidden'));
  qs('#survey .step[data-step="'+n+'"]')?.classList.remove('hidden');
}

function prevStep(){
  const visible = document.querySelector('#survey .step:not(.hidden)');
  if(!visible) return;
  const cur = parseInt(visible.getAttribute('data-step'));
  if(cur>1) showStep(cur-1);
}

function toggleLang(){
  const btn = qs('#langBtn');
  if(btn.textContent.trim()==='EN'){btn.textContent='中'; localize('en');}else{btn.textContent='EN'; localize('zh');}
}

function localize(lang){
  // Minimal localization: swap some labels. For full translation we will extend.
  if(lang==='en'){
    qs('.title').textContent = 'Camera Purchase Survey';
    qs('.lead').textContent = 'Answer a few quick questions — we will recommend the most suitable camera + lens split.';
    qs('#startBtn').textContent = 'Start survey';
    qs('#resumeBtn').textContent = 'History';
    qs('#submitBtn').textContent = 'Submit';
  } else {
    qs('.title').textContent = '中英双语 — 相机选购问卷';
    qs('.lead').textContent = '回答几个简单问题，我们会基于预算、用途与偏好给出推荐（机身/镜头分配支持）。';
    qs('#startBtn').textContent = '开始问卷 / Start survey';
    qs('#resumeBtn').textContent = '查看历史 / History';
    qs('#submitBtn').textContent = '提交并推荐 / Submit';
  }
}

function collectForm(){
  // Collect and normalize form values (updated to new budget UI)
  const min = Number(qs('#budgetMin').value||5000);
  const max = Number(qs('#budgetMax').value||50000);
  // bodyPercent slider or default 50
  const bodyPercent = Number(qs('#bodyPercent')?.value || 50);
  const bodyShare = bodyPercent/100;
  const uses = Array.from(qs('#useCase')?.selectedOptions||[]).map(o=>o.value);
  return {
    budgetMin:min,budgetMax:max,bodyShare,uses,
    portability: Number(qs('#portability')?.value||3),
    prioImage: Number(qs('#prioImage')?.value||4),
    prioAF: Number(qs('#prioAF')?.value||4),
    prioIBIS: Number(qs('#prioIBIS')?.value||3),
    postProcessing: qs('#postProcessing')?.value || 'medium',
    brands: qsa('.brand:checked').map(c=>c.value),
    videoNeed: qs('#videoNeed')?.value || 'optional', highFPS: qs('#highFPS')?.value || 'no'
  }
}

function scoreCamera(cam, form){
  const wImage = form.prioImage;
  const wAF = form.prioAF;
  const wIBIS = form.prioIBIS;
  const totalW = wImage + wAF + wIBIS + 1;
  const Wi = wImage/totalW, Wa = wAF/totalW, Wb = wIBIS/totalW, Wo = 1/totalW;

  const budget = (form.budgetMin + form.budgetMax)/2;
  const priceScore = cam.price<=budget ? 1 : Math.max(0, 1 - (cam.price - budget)/(budget));

  const portabilityScore = 1 - (cam.weight||700)/1200;
  const videoScore = (cam.video_score||5)/10;

  const core = (Wi*(cam.image_score||6)/10 + Wa*(cam.af_score||6)/10 + Wb*(cam.ibis_score||6)/10 + Wo*portabilityScore);
  const score = priceScore*0.35 + core*0.55 + videoScore*0.1;
  if(form.prioIBIS>=4 && (cam.ibis_score||0) < 4) return Math.round((score*0.8)*1000)/1000;
  if(form.videoNeed==='required' && (cam.video_score||0) < 6) return Math.round((score*0.85)*1000)/1000;
  return Math.round(score*1000)/1000;
}

function filterAndRank(form){
  const allowed = new Set(form.brands);
  let pool = cameras.filter(c => allowed.has(c.brand));
  pool = pool.filter(c => c.price <= form.budgetMax*1.5);
  const scored = pool.map(c => ({...c, score: scoreCamera(c, form)}));
  scored.sort((a,b)=>b.score - a.score);
  return scored.slice(0,10);
}

function renderRecommendations(list, meta){
  const container = qs('#recommendations'); container.innerHTML='';
  if(!list || list.length===0){container.innerHTML='<p class="muted">未找到匹配机型 / No matches</p>'; return}
  list.slice(0,3).forEach(cam => {
    const el = document.createElement('div'); el.className='card';
    el.innerHTML = `<h4>${cam.brand} ${cam.model} — ¥${cam.price}</h4>
      <p class="muted">${cam.description||''}</p>
      <p>评分: <strong>${Math.round((cam.score||0)*100)}</strong></p>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="secondary" onclick='compareAdd("${cam.id}")'>加入对比</button>
        <button class="primary" onclick='selectForSave("${cam.id}")'>选择保存</button>
      </div>`;
    container.appendChild(el);
  });
  const comp = qs('#compareArea'); comp.innerHTML = '<h4>Top 10</h4>' + list.map(c=>`<div style="padding:6px 0;border-bottom:1px solid #f5f5f5">${c.brand} ${c.model} — ¥${c.price} — 分数:${c.score}</div>`).join('');
}

function onSubmit(e){
  e.preventDefault();
  const form = collectForm();
  // Basic validation
  if(form.budgetMin < 5000){alert('最低预算为 5000 RMB'); return}
  const ranked = filterAndRank(form);
  renderRecommendations(ranked, form);
  const recs = ranked.slice(0,3).map(r=>({id:r.id,brand:r.brand,model:r.model,price:r.price,score:r.score}));
  const entry = {ts:Date.now(), form, recs};
  const hist = JSON.parse(localStorage.getItem('camera_history')||'[]');
  hist.unshift(entry); localStorage.setItem('camera_history', JSON.stringify(hist.slice(0,50)));
  showSection('result');
}

function loadHistory(){
  const list = JSON.parse(localStorage.getItem('camera_history')||'[]');
  const node = qs('#historyList'); node.innerHTML='';
  if(list.length===0) node.innerHTML='<p class="muted">暂无历史记录</p>';
  list.forEach((h,idx)=>{
    const d = new Date(h.ts);
    const el = document.createElement('div'); el.className='card';
    el.innerHTML = `<div><strong>${d.toLocaleString()}</strong> — 推荐:${h.recs.map(r=>r.brand+' '+r.model).join(', ')}</div>
      <div style="margin-top:8px"><button class="secondary" onclick='replay(${idx})'>查看</button></div>`;
    node.appendChild(el);
  })
}

function replay(idx){
  const list = JSON.parse(localStorage.getItem('camera_history')||'[]');
  const item = list[idx]; if(!item) return; renderRecommendations(item.recs, item.form); showSection('result');
}

function saveCurrent(){
  const hist = JSON.parse(localStorage.getItem('camera_history')||'[]');
  if(hist.length===0){alert('没有可保存的历史，请先提交问卷');return}
  const item = hist[0];
  if(window.sendSubmission){
    sendSubmission(item).then(r=>{alert('已保存到后台 (id:'+ (r && r.id? r.id:'unknown') +')')}).catch(e=>{console.warn(e); alert('保存到后台失败，已保存在本地历史。')});
  } else {
    alert('未配置后台，已保存在本地历史。若需开启 Firebase 请在 js/firebase-config.js 中填入配置。');
  }
}

function exportCSV(){
  const hist = JSON.parse(localStorage.getItem('camera_history')||'[]');
  if(hist.length===0){alert('没有历史可导出');return}
  const rows = ['timestamp,brands,models,prices,scores'];
  hist.forEach(h=>{
    rows.push(`${h.ts},"${(h.form.brands||[]).join('|')}","${h.recs.map(r=>r.model).join('|')}","${h.recs.map(r=>r.price).join('|')}","${h.recs.map(r=>r.score).join('|')}"`)
  });
  const blob = new Blob([rows.join('\n')],{type:'text/csv'});
  const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='camera_history.csv'; a.click(); URL.revokeObjectURL(url);
}

function shareCurrent(){
  const hist = JSON.parse(localStorage.getItem('camera_history')||'[]');
  if(hist.length===0){alert('无历史可分享，请先提交问卷');return}
  const item = hist[0];
  const payload = {recs:item.recs, meta:item.form};
  const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));
  const url = location.origin + location.pathname + '?shared=1&data=' + encoded;
  navigator.clipboard.writeText(url).then(()=>alert('已复制分享链接，可发给微信/好友'));
}

function compareAdd(id){
  const cur = JSON.parse(localStorage.getItem('compare')||'[]');
  if(cur.includes(id)){alert('已在对比中');return}
  cur.push(id); localStorage.setItem('compare', JSON.stringify(cur)); alert('已加入对比（本地）');
}

function selectForSave(id){
  alert('已标记该机型为保存（本地）。 若需持久化，请配置服务器端点。');
}

window.replay = replay; window.compareAdd = compareAdd; window.selectForSave = selectForSave;

init();
