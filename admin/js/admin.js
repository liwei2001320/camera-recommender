(function(){
  if(!window.FIREBASE_CONFIG){console.warn('Firebase config not found. Copy js/firebase-config.example.js to js/firebase-config.js and fill project values.'); document.getElementById('stats').innerText='未配置 Firebase'; return}
  try{
    firebase.initializeApp(window.FIREBASE_CONFIG);
    const db = firebase.firestore();
    window.firestore = db;
    const listNode = document.getElementById('list');
    const statsNode = document.getElementById('stats');
    db.collection('submissions').orderBy('ts','desc').limit(200).onSnapshot(snap=>{
      const docs = []; let count=0; let byBrand={};
      snap.forEach(d=>{const data=d.data(); docs.push({id:d.id,...data}); count++; if(data.recs) data.recs.forEach(r=>{byBrand[r.brand]=(byBrand[r.brand]||0)+1});});
      statsNode.innerHTML = `<div class="muted">总提交: ${count}</div><div>品牌分布: ${Object.entries(byBrand).map(e=>`${e[0]}:${e[1]}`).join(' / ')}</div>`;
      listNode.innerHTML = docs.map(d=>`<div class="card"><strong>${new Date(d.ts).toLocaleString()}</strong><div>推荐: ${ (d.recs||[]).map(r=>r.brand+' '+r.model).join(', ') }</div><pre style="white-space:pre-wrap">${JSON.stringify(d.form,null,2)}</pre></div>`).join('');
    });
  }catch(e){console.warn(e); document.getElementById('stats').innerText='读取 Firebase 出错: '+e.message}
})();
