(function(){
  // firebase init loader: loads compat SDKs and exposes sendSubmission(entry) if FIREBASE_CONFIG exists
  if(!window.FIREBASE_CONFIG) {console.info('Firebase config not found (js/firebase-config.js). Skipping init.'); return}
  function loadScript(src){return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); });}
  const sdkApp = 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js';
  const sdkFS = 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js';
  loadScript(sdkApp).then(()=>loadScript(sdkFS)).then(()=>{
    try{
      firebase.initializeApp(window.FIREBASE_CONFIG);
      const db = firebase.firestore();
      window.firebaseApp = firebase; window.firestore = db;
      window.sendSubmission = async function(entry){
        if(!db) throw new Error('firestore not initialized');
        const doc = {ts: entry.ts || Date.now(), form: entry.form || {}, recs: entry.recs || []};
        const ref = await db.collection('submissions').add(doc);
        return {ok:true,id:ref.id};
      }
      console.info('Firebase initialized. sendSubmission available.');
    }catch(e){console.warn('Firebase init error',e)}
  }).catch(e=>{console.warn('Failed to load Firebase SDK',e)});
})();
