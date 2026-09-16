(function () {
  const cfg = window._FIREBASE_CONFIG;
  if (!cfg) {
    console.warn('Firebase config not found: please add js/firebase-config.js with your config.');
    return;
  }

  if (!window.firebase || !window.firebase.apps || window.firebase.apps.length === 0) {
    try {
      window.firebase.initializeApp(cfg);
      window._firestore = window.firebase.firestore();
      console.log('Firebase initialized (compat).');
    } catch (e) {
      console.error('Firebase init error', e);
    }
  } else {
    window._firestore = window.firebase.firestore();
  }

  window.saveSubmissionToFirestore = async function (payload) {
    if (!window._firestore) throw new Error('Firestore not initialized.');
    const toSave = Object.assign({}, payload);
    try {
      toSave.createdAt = window.firebase.firestore.FieldValue.serverTimestamp();
    } catch(e){
      toSave.createdAt = new Date().toISOString();
    }
    try {
      const ref = await window._firestore.collection('submissions').add(toSave);
      return { ok: true, id: ref.id };
    } catch (err) {
      console.error('saveSubmissionToFirestore error', err);
      throw err;
    }
  };

  // Backwards-compatible wrapper expected by the existing app.js
  window.sendSubmission = async function (payload) {
    if (typeof window.saveSubmissionToFirestore === 'function') {
      try {
        return await window.saveSubmissionToFirestore(payload);
      } catch (err) {
        console.warn('saveSubmissionToFirestore failed', err);
        throw err;
      }
    } else {
      console.warn('saveSubmissionToFirestore not available');
      return { ok: false, error: 'save-not-available' };
    }
  };
})();