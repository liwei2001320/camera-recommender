// 文件：js/recommender-core.js
// 初代问卷 + 推荐引擎（中文）。确保 index.html 在 firebase-init 之后或不依赖 firebase 亦可工作。

(function(){
  // 问题定义（简化版：文本和选项）
  const QUESTIONS = [
    { id:'q1_budget_bucket', title:'问题 1 — 总预算', type:'radio', required:true,
      opts:[
        {v:'A', t:'A：5,000 — 15,000 RMB（入门/爱好者）'},
        {v:'B', t:'B：15,001 — 30,000 RMB（进阶/半专业）'},
        {v:'C', t:'C：30,001 — 50,000 RMB（专业/高端）'},
        {v:'D', t:'D：自定义（填写数值）'}
      ]
    },
    { id:'q2_body_lens_ratio', title:'问题 2 — 机身 / 镜头 预算占比', type:'radio', required:true,
      opts:[
        {v:'5:5', t:'5:5（机身:镜头 = 50% : 50%，默认）'},
        {v:'6:4', t:'6:4（偏机身）'},
        {v:'7:3', t:'7:3（更偏机身）'},
        {v:'8:2', t:'8:2（机身优先）'},
        {v:'custom', t:'自定义（请输入百分比）'}
      ]
    },
    { id:'q3_use', title:'问题 3 — 主要用途（多选）', type:'checkbox', opts:[
      {v:'portrait',t:'人像'},{v:'landscape',t:'风光'},{v:'night',t:'夜景'},{v:'street',t:'街拍'},
      {v:'travel',t:'旅游'},{v:'sports',t:'运动/野生'},{v:'video',t:'视频内容'}
    ]},
    { id:'q4_photo_vs_video', title:'问题 4 — 照片 vs 视频', type:'radio', opts:[
      {v:'photo',t:'以照片为主'},{v:'both',t:'照片 / 视频同等'},{v:'video',t:'以视频为主'}
    ]},
    { id:'q5_portability', title:'问题 5 — 便携性', type:'radio', opts:[
      {v:'very',t:'非常便携（轻量）'},{v:'medium',t:'偶尔携带'},{v:'no',t:'不在意重量'}
    ]},
    { id:'q6_af_need', title:'问题 6 — 是否依赖自动对焦（运动/动物）', type:'radio', opts:[
      {v:'high',t:'非常依赖'},{v:'normal',t:'一般'},{v:'low',t:'不太依赖'}
    ]},
    { id:'q7_ibis', title:'问题 7 — 是否需要机身 / 镜头防抖', type:'radio', opts:[
      {v:'must',t:'必须'},{v:'want',t:'希望有'},{v:'no',t:'无所谓'}
    ]},
    { id:'q8_post', title:'问题 8 — 是否大量后期（RAW）', type:'radio', opts:[
      {v:'heavy',t:'大量后期'},{v:'some',t:'有时调整'},{v:'none',t:'不做后期'}
    ]},
    { id:'q9_lowlight', title:'问题 9 — 是否需要高感性能', type:'radio', opts:[
      {v:'must',t:'必须'},{v:'nice',t:'希望'},{v:'no',t:'不需要'}
    ]},
    { id:'q10_video_pro', title:'问题 10 — 是否需要专业视频功能', type:'radio', opts:[
      {v:'must',t:'需要（10-bit/高帧/散热）'},{v:'some',t:'希望'},{v:'no',t:'不需要'}
    ]},
    { id:'q11_focal', title:'问题 11 — 常用焦段（多选）', type:'checkbox', opts:[
      {v:'wide',t:'广角'}, {v:'standard',t:'标准'}, {v:'shorttele',t:'短远摄'}, {v:'longtele',t:'长焦'}, {v:'macro',t:'微距'}
    ]},
    { id:'q12_lens_pref', title:'问题 12 — 镜头偏好', type:'radio', opts:[
      {v:'native',t:'优先原厂'}, {v:'accept_3rd',t:'原厂为主亦接受第三方'}, {v:'3rd_ok',t:'第三方也可'}
    ]},
    { id:'q13_owned_lenses', title:'问题 13 — 已持有镜头（可选，文本）', type:'text' },
    { id:'q14_weather', title:'问题 14 — 是否常在户外/需耐候', type:'radio', opts:[
      {v:'outdoor',t:'常户外/需防护'}, {v:'some',t:'偶尔户外'}, {v:'indoor',t:'室内为主'}
    ]},
    { id:'q15_color_pref', title:'问题 15 — 色彩偏好', type:'radio', opts:[
      {v:'warm',t:'偏暖/肤色友好'}, {v:'high_contrast',t:'高对比'}, {v:'neutral',t:'中性/无偏好'}
    ]},
    { id:'q16_burst', title:'问题 16 — 连拍/缓冲需求', type:'radio', opts:[
      {v:'must',t:'必须'}, {v:'nice',t:'希望'}, {v:'no',t:'不需要'}
    ]},
    { id:'q17_upgrade_plan', title:'问题 17 — 未来升级计划', type:'radio', opts:[
      {v:'one_time',t:'一次买好'}, {v:'step',t:'逐步升级'}, {v:'frequent',t:'追新换机'}
    ]},
    { id:'q18_hold_prefer', title:'问题 18 — 机身握持/重量偏好', type:'radio', opts:[
      {v:'light',t:'偏轻巧'}, {v:'std',t:'标准'}, {v:'heavy',t:'稳重大手感'}
    ]},
    { id:'q19_mobile_share', title:'问题 19 — 是否需要手机即时分享', type:'radio', opts:[
      {v:'yes',t:'是'}, {v:'no',t:'否'}
    ]},
    { id:'q20_other', title:'问题 20 — 其它偏好或禁忌（可选文本）', type:'text' }
  ];

  // 初代机型（简化评分向量）
  const CAMERA_DB = [
    { id:'xs10', brand:'Fujifilm', model:'X-S10', sensor:'APS-C', price:7000, photo:7, video:6, af:6, lowlight:6, ibis:1, port:8, ecosystem:7 },
    { id:'a6400', brand:'Sony', model:'a6400', sensor:'APS-C', price:6000, photo:6, video:6, af:7, lowlight:5, ibis:0, port:8, ecosystem:8 },
    { id:'r10', brand:'Canon', model:'R10', sensor:'APS-C', price:6500, photo:6, video:6, af:6, lowlight:5, ibis:0, port:8, ecosystem:7 },
    { id:'a7iv', brand:'Sony', model:'A7 IV', sensor:'Full', price:20000, photo:9, video:9, af:9, lowlight:8, ibis:1, port:6, ecosystem:9 },
    { id:'r6ii', brand:'Canon', model:'R6 II', sensor:'Full', price:22000, photo:8, video:8, af:8, lowlight:9, ibis:1, port:6, ecosystem:9 },
    { id:'z6ii', brand:'Nikon', model:'Z6 II', sensor:'Full', price:18000, photo:8, video:7, af:7, lowlight:8, ibis:1, port:6, ecosystem:8 },
    { id:'xt5', brand:'Fujifilm', model:'X-T5', sensor:'APS-C', price:17000, photo:9, video:6, af:6, lowlight:7, ibis:0, port:7, ecosystem:7 },
    { id:'a7rv', brand:'Sony', model:'A7R V', sensor:'Full', price:42000, photo:10, video:9, af:9, lowlight:9, ibis:1, port:5, ecosystem:9 },
    { id:'r5', brand:'Canon', model:'R5', sensor:'Full', price:38000, photo:9, video:9, af:9, lowlight:9, ibis:1, port:5, ecosystem:9 },
    { id:'z9', brand:'Nikon', model:'Z9', sensor:'Full', price:50000, photo:10, video:10, af:10, lowlight:10, ibis:1, port:5, ecosystem:9 }
  ];

  // 简化镜头库（初代用）
  const LENS_DB = [
    { id:'xf18-55', brand:'Fujifilm', model:'XF 18-55mm f/2.8-4', price:3000, kind:'kit' },
    { id:'xf35', brand:'Fujifilm', model:'XF 35mm f/2', price:2000, kind:'prime' },
    { id:'e18-135', brand:'Sony', model:'E 18-135mm', price:3500, kind:'travel' },
    { id:'gm24-70', brand:'Sony', model:'FE 24-70mm f/2.8 GM', price:20000, kind:'pro' },
    { id:'rf24-70', brand:'Canon', model:'RF 24-70mm f/2.8 L', price:20000, kind:'pro' },
    { id:'n24-70', brand:'Nikon', model:'Nikkor Z 24-70 f/4', price:9000, kind:'standard' }
  ];

  // 构建权重（根据用户回答）
  function buildWeights(answers){
    let w = { photo:1, video:1, af:1, lowlight:1, ibis:1, portability:1, ecosystem:1 };
    if(answers.q4_photo_vs_video === 'photo'){ w.photo = 2; w.video = 0.8; }
    if(answers.q4_photo_vs_video === 'video'){ w.video = 2; w.photo = 0.8; }
    if(answers.q6_af_need === 'high'){ w.af = 2; }
    if(answers.q7_ibis === 'must'){ w.ibis = 2; }
    if(answers.q9_lowlight === 'must'){ w.lowlight = 2; }
    if(answers.q5_portability === 'very'){ w.portability = 2; }
    if(answers.q10_video_pro === 'must'){ w.video += 0.5; w.lowlight += 0.3; }
    return w;
  }

  function scoreCamera(cam, weights){
    const v = (
      (cam.photo * (weights.photo || 1)) +
      (cam.video * (weights.video || 1)) +
      (cam.af * (weights.af || 1)) +
      (cam.lowlight * (weights.lowlight || 1)) +
      (cam.ibis * (weights.ibis || 1)) +
      (cam.port * (weights.portability || 1)) +
      (cam.ecosystem * (weights.ecosystem || 1))
    );
    return v;
  }

  function pickLensForCamera(cam, budget, ratio){
    let lensRatio = 0.5;
    if(ratio === '6:4') lensRatio = 0.4;
    if(ratio === '7:3') lensRatio = 0.3;
    if(ratio === '8:2') lensRatio = 0.2;
    if(ratio === '5:5') lensRatio = 0.5;
    const lensBudget = Math.round(budget * lensRatio);
    let candidates = LENS_DB.filter(l => l.brand.toLowerCase().includes(cam.brand.toLowerCase().split(' ')[0]));
    if(candidates.length === 0) candidates = LENS_DB.slice();
    let pick = candidates.find(l=> l.price <= lensBudget);
    if(!pick) pick = candidates.reduce((a,b)=> a.price < b.price ? a : b);
    return { lens: pick, lensBudget };
  }

  function recommend(answers){
    let budgetBucket = answers.q1_budget_bucket || 'A';
    let budget = 15000;
    if(budgetBucket === 'A') budget = 12000;
    if(budgetBucket === 'B') budget = 22000;
    if(budgetBucket === 'C') budget = 40000;
    const ratio = answers.q2_body_lens_ratio || '5:5';
    const weights = buildWeights(answers);
    const scored = CAMERA_DB.map(cam => {
      const s = scoreCamera(cam, weights);
      const pick = pickLensForCamera(cam, budget, ratio);
      const totalComboPrice = cam.price + (pick.lens ? pick.lens.price : 0);
      let pricePenalty = 0;
      if(totalComboPrice > budget) pricePenalty = - (totalComboPrice - budget) / 10000;
      const comboScore = s + pricePenalty;
      return { cam, pick, s, comboScore, totalComboPrice };
    });
    scored.sort((a,b)=> b.comboScore - a.comboScore);
    const top = scored.slice(0,3).map(item => {
      return {
        body: `${item.cam.brand} ${item.cam.model}`,
        lens: item.pick.lens ? `${item.pick.lens.brand} ${item.pick.lens.model}` : '暂无',
        priceEstimate: item.totalComboPrice,
        reason: genReason(item.cam, answers),
        rawScore: item.comboScore
      }
    });
    return top;
  }

  function genReason(cam, answers){
    const reason = [];
    if(answers.q4_photo_vs_video === 'video' && cam.video >= 8) reason.push('视频性能优秀（适合创作视频内容）');
    if(answers.q4_photo_vs_video === 'photo' && cam.photo >= 8) reason.push('照片画质/高像素与动态范围表现优秀');
    if(answers.q6_af_need === 'high' && cam.af >= 8) reason.push('自动对焦强，适合运动与动物追焦');
    if(answers.q7_ibis === 'must' && cam.ibis === 1) reason.push('机身具备防抖（IBIS）');
    if(answers.q5_portability === 'very' && cam.port >= 7) reason.push('轻便易携带，适合旅行街拍');
    if(reason.length===0) reason.push('综合性能良好，适合多种拍摄场景');
    return reason.join('；');
  }

  function renderSurvey(containerId){
    const container = document.getElementById(containerId);
    if(!container) return console.warn('没有找到容器', containerId);
    container.innerHTML = '';
    const form = document.createElement('form');
    form.id = 'cameraSurveyForm';
    QUESTIONS.forEach(q=>{
      const section = document.createElement('section');
      section.className='survey-question';
      const h3 = document.createElement('h4');
      h3.textContent = q.title;
      section.appendChild(h3);
      if(q.type === 'radio' || q.type === 'checkbox'){
        q.opts.forEach(opt=>{
          const label = document.createElement('label');
          label.style.display='block';
          label.style.margin='6px 0';
          const inp = document.createElement('input');
          inp.type = q.type;
          inp.name = q.id;
          inp.value = opt.v;
          inp.style.marginRight = '8px';
          label.appendChild(inp);
          label.appendChild(document.createTextNode(opt.t));
          section.appendChild(label);
        });
      } else if(q.type === 'text'){
        const ta = document.createElement('input');
        ta.type='text'; ta.name=q.id; ta.style.width='60%';
        section.appendChild(ta);
      }
      form.appendChild(section);
    });
    const submit = document.createElement('button');
    submit.type='button';
    submit.textContent='提交并推荐';
    submit.style.marginTop='12px';
    submit.className='primary';
    submit.onclick = onSubmitClick;
    form.appendChild(submit);
    container.appendChild(form);

    const out = document.createElement('div'); out.id='recommendationOutput'; out.style.marginTop='20px';
    container.appendChild(out);
  }

  function gatherAnswers(){
    const ans = {};
    QUESTIONS.forEach(q=>{
      if(q.type === 'radio'){
        const v = document.querySelector(`input[name="${q.id}"]:checked`);
        ans[q.id] = v ? v.value : null;
      } else if(q.type === 'checkbox'){
        const vals = Array.from(document.querySelectorAll(`input[name="${q.id}"]:checked`)).map(i=>i.value);
        ans[q.id] = vals;
      } else if(q.type === 'text'){
        const v = document.querySelector(`input[name="${q.id}"]`);
        ans[q.id] = v ? v.value.trim() : '';
      }
    });
    return ans;
  }

  async function onSubmitClick(e){
    const answers = gatherAnswers();
    if(!answers.q1_budget_bucket || !answers.q2_body_lens_ratio){
      alert('请先填写：总预算与机身/镜头占比（前两题为必答）');
      return;
    }
    const top = recommend(answers);
    renderResults(top);
    const payload = { answers, recommendations: top, createdAt: new Date().toISOString() };
    try {
      if(typeof window.sendSubmission === 'function'){
        await window.sendSubmission(payload);
        console.log('已调用 window.sendSubmission 保存到 Firestore（如果已配置）');
      } else if(typeof window.saveSubmissionToFirestore === 'function'){
        await window.saveSubmissionToFirestore(payload);
        console.log('已调用 saveSubmissionToFirestore 保存到 Firestore（如果已配置）');
      } else {
        console.warn('检测不到 Firestore 保存函数，未保存到后端（开发环境）。');
      }
    } catch(err){
      console.error('保存到 Firestore 失败：', err);
    }
  }

  function renderResults(list){
    const out = document.getElementById('recommendationOutput');
    if(!out) return;
    out.innerHTML = '<h3>推荐结果（Top 3）</h3>';
    list.forEach((it, idx)=>{
      const card = document.createElement('div');
      card.style.border='1px solid #eee'; card.style.padding='12px'; card.style.margin='8px 0'; card.style.borderRadius='8px';
      card.innerHTML = `<strong>#${idx+1} 机身：</strong>${it.body}<br><strong>推荐镜头：</strong>${it.lens}<br><strong>估算套装价：</strong>≈ ${it.priceEstimate} RMB<br><strong>推荐理由：</strong>${it.reason}`;
      out.appendChild(card);
    });
    // 滚动到结果
    out.scrollIntoView({ behavior: 'smooth' });
  }

  document.addEventListener('DOMContentLoaded', function(){
    if(document.getElementById('surveyContainer')){
      renderSurvey('surveyContainer');
    }
  });

  window._recommender = { recommend, buildWeights, scoreCamera };
})();
