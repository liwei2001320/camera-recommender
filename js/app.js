// App logic for Camera Recommender - minimal viable
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
  // if shared result in url
  const params = new URLSearchParams(location.search);
  if(params.get('shared')){
    // decode and show
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
  qs('#startBtn').addEventListener('click', ()=>{showStep(1); showSection('survey')});
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
  // minimal toggle: just swap button text
  const btn = qs('#langBtn');
  if(btn.textContent.trim()==='EN'){btn.textContent='中'}else{btn.textContent='EN'}
}

function collectForm(){
  const min = Number(qs('#budgetMin').value||5000);
  const max = Number(qs('#budgetMax').value||50000);
  const ratio = qs('#bodyLensRatio').value || '5:5';
  const [b,l] = ratio.split(':').map(x=>Number(x)||5);
  const bodyShare = b/(b+l);
  const uses = Array.from(qs('#useCase').selectedOptions).map(o=>o.value);
  return {
    budgetMin:min,budgetMax:max,bodyShare,uses,
    portability: Number(qs('#portability').value||3),
    prioImage: Number(qs('#prioImage').value||4),
    prioAF: Number(qs('#prioAF').value||4),
    prioIBIS: Number(qs('#prioIBIS').value||3),
    postProcessing: qs('#postProcessing').value,
    brands: qsa('.brand:checked').map(c=>c.value),
    videoNeed: qs('#videoNeed').value, highFPS: qs('#highFPS').value
  }
}

function scoreCamera(cam, form){
  // weights from priorities
  const wImage = form.prioImage;
  const wAF = form.prioAF;
  const wIBIS = form.prioIBIS;
  // normalize weights
  const totalW = wImage + wAF + wIBIS + 1; // +1 for other
  const Wi = wImage/totalW, Wa = wAF/totalW, Wb = wIBIS/totalW, Wo = 1/totalW;

  // price fit
  const budget = (form.budgetMin + form.budgetMax)/2;
  const priceScore = cam.price<=budget ? 1 : Math.max(0, 1 - (cam.price - budget)/(budget));

  // portability inverse weight
  const portabilityScore = 1 - (cam.weight||700)/1200; // rough

  // video needs
  const videoScore = cam.video_score/10;

  // combined
  const score = priceScore*0.35 + (Wi*(cam.image_score/10) + Wa*(cam.af_score/10) + Wb*(cam.ibis_score/10) + Wo*portabilityScore)*0.55 + videoScore*0.1;
  return Math.round(score*1000)/1000;
}

function filterAndRank(form){
  // filter by brand
  const allowed = new Set(form.brands);
  let pool = cameras.filter(c => allowed.has(c.brand));
  // filter by price soft: allow up to max*1.5
  pool = pool.filter(c => c.price <= form.budgetMax*1.5);
  // compute score
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
      <p>评分: <strong>${(cam.score||0)*100}</strong></p>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="secondary" onclick='compareAdd("${cam.id}")'>加入对比</button>
        <button class="primary" onclick='selectForSave("${cam.id}")'>选择保存</button>
      </div>`;
    container.appendChild(el);
  });
  // attach full list to compare area
  const comp = qs('#compareArea'); comp.innerHTML = '<h4>Top 10</h4>' + list.map(c=>`<div style="padding:6px 0;border-bottom:1px solid #f5f5f5">${c.brand} ${c.model} — ¥${c.price} — 分数:${c.score}</div>`).join('');
}

function onSubmit(e){
  e.preventDefault();
  const form = collectForm();
  const ranked = filterAndRank(form);
  renderRecommendations(ranked, form);
  // save into history (local)
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
  alert('保存到服务器功能尚未配置。当前数据已保存在本地历史。若需开启后台存储，我可以接入 Airtable/Google Sheets/Firebase。');
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
  // naive: toggle in local compare list
  const cur = JSON.parse(localStorage.getItem('compare')||'[]');
  if(cur.includes(id)){alert('已在对比中');return}
  cur.push(id); localStorage.setItem('compare', JSON.stringify(cur)); alert('已加入对比（本地）');
}

function selectForSave(id){
  // mark selected top
  alert('已标记该机型为保存（本地）。 若需持久化，请配置服务器端点。');
}

window.replay = replay; window.compareAdd = compareAdd; window.selectForSave = selectForSave;

init();
