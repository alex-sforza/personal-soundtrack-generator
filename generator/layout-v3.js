(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c] || c));

  function styles(){
    if ($('layout-v3-styles')) return;
    const s=document.createElement('style');s.id='layout-v3-styles';s.textContent=`
      .v3-single{margin-top:18px}
      .v3-title{font-size:24px;font-weight:750;margin:0 0 8px}
      .v3-note{font-size:13px;color:var(--muted);margin-bottom:16px}
      .v3-portrait{display:grid;grid-template-columns:minmax(0,1fr) 180px;gap:14px;align-items:end}
      .v3-preview{aspect-ratio:3/4;border-radius:14px;overflow:hidden;background:var(--soft);min-height:150px}
      .v3-preview img{width:100%;height:100%;object-fit:cover;display:block}
      .v3-aesthetic{margin-top:22px}
      .v3-aesthetic-title{text-align:center;font-size:21px;font-weight:750;letter-spacing:.04em;margin-bottom:16px}
      .v3-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      .v3-slot{border:1px solid var(--line);border-radius:14px;padding:12px;background:#faf8f5}
      .v3-slot h4{margin:0 0 8px;font-size:15px}
      .v3-slot input[type=url]{font-size:13px;padding:9px}
      .v3-upload{display:inline-block;margin-top:7px}
      .v3-legacy{display:none!important}
      .v3-pair-head{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
      .v3-person{border:1px solid var(--line);border-radius:14px;padding:14px;background:#faf8f5}
      .v3-person h3{font-size:18px;margin:0 0 10px}
      .v3-pair-portrait{display:grid;grid-template-columns:minmax(0,1fr) 105px;gap:10px;align-items:end}
      .v3-pair-preview{aspect-ratio:3/4;border-radius:12px;overflow:hidden;background:var(--soft);min-height:130px}
      .v3-pair-preview img{width:100%;height:100%;object-fit:cover;display:block}
      .v3-pair-aesthetic{margin-top:20px}
      .v3-pair-aesthetic-title{text-align:center;font-size:21px;font-weight:750;letter-spacing:.05em;margin:4px 0 16px}
      @media(max-width:700px){.v3-portrait,.v3-pair-head,.v3-pair-portrait{grid-template-columns:1fr}.v3-grid{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  function hideLegacy(prefix){
    const ids=[`${prefix}-portrait-url`,`${prefix}-portrait-file`];
    for(let i=0;i<6;i++)ids.push(`${prefix}-img-url-${i}`,`${prefix}-img-file-${i}`);
    ids.forEach(id=>{const el=$(id);if(el){el.classList.add('v3-legacy');if(el.parentElement)el.parentElement.classList.add('v3-legacy');}});
  }

  function mirror(id,value){const el=$(id);if(el){el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));}}

  function bindFile(buttonId,fileId){const b=$(buttonId),f=$(fileId);if(b&&!b.dataset.v3Bound){b.dataset.v3Bound='1';b.addEventListener('click',()=>f?.click());}}

  function buildSingle(){
    const host=$('single-visual'),eq=$('single-eq')?.closest('.card');
    if(!host||!eq)return;
    if(host.querySelector('.v3-title'))return;
    hideLegacy('s');
    eq.appendChild(host);host.classList.add('v3-single');
    host.innerHTML=`
      <div class="v3-title">Визуальный образ персонажа</div>
      <div class="v3-note">Главное фото + 4 изображения, которые характеризуют персонажа. Можно использовать ссылку или загрузить изображение.</div>
      <div class="v3-portrait"><div class="field" style="margin:0"><label>Главное фото персонажа</label><input id="v3-s-portrait-url" type="url" placeholder="Ссылка на фото"><button type="button" class="tab v3-upload" id="v3-s-portrait-file">Загрузить фото</button></div><div id="v3-s-preview" class="v3-preview"></div></div>
      <div class="v3-aesthetic"><div class="v3-aesthetic-title">ЭСТЕТИКА</div><div class="v3-grid">
        <div class="v3-slot"><h4>Символ его истории</h4><input id="v3-s-img-0" type="url" placeholder="Ссылка на изображение"><button type="button" class="tab v3-upload" data-v3-file="s-img-file-0">Загрузить</button></div>
        <div class="v3-slot"><h4>Место</h4><input id="v3-s-img-1" type="url" placeholder="Ссылка на изображение"><button type="button" class="tab v3-upload" data-v3-file="s-img-file-1">Загрузить</button></div>
        <div class="v3-slot"><h4>Настроение / погода</h4><input id="v3-s-img-2" type="url" placeholder="Ссылка на изображение"><button type="button" class="tab v3-upload" data-v3-file="s-img-file-2">Загрузить</button></div>
        <div class="v3-slot"><h4>Важная сцена</h4><input id="v3-s-img-3" type="url" placeholder="Ссылка на изображение"><button type="button" class="tab v3-upload" data-v3-file="s-img-file-3">Загрузить</button></div>
      </div></div>`;
    const pu=$('v3-s-portrait-url');pu?.addEventListener('input',()=>{mirror('s-portrait-url',pu.value);const p=$('v3-s-preview');p.innerHTML=pu.value.trim()?`<img src="${esc(pu.value.trim())}" alt="Портрет">`:'';});
    bindFile('v3-s-portrait-file','s-portrait-file');
    for(let i=0;i<4;i++){const u=$(`v3-s-img-${i}`);u?.addEventListener('input',()=>mirror(`s-img-url-${i}`,u.value));bindFile(`v3-s-img-${i}`.replace(`v3-s-img-${i}`,`v3-s-img-file-${i}`),`s-img-file-${i}`);}
  }

  function buildPair(){
    const host=$('pair-visual');if(!host)return;
    if(host.querySelector('.v3-pair-head'))return;
    hideLegacy('p1');hideLegacy('p2');
    host.innerHTML=`
      <div class="v3-pair-head">
        <div class="v3-person"><h3>Персонаж 1 · визуальный образ</h3><div class="v3-pair-portrait"><div class="field" style="margin:0"><label>Главное фото персонажа</label><input id="v3-p1-portrait-url" type="url" placeholder="Ссылка на фото"><button type="button" class="tab v3-upload" id="v3-p1-portrait-file">Загрузить фото</button></div><div id="v3-p1-preview" class="v3-pair-preview"></div></div></div>
        <div class="v3-person"><h3>Персонаж 2 · визуальный образ</h3><div class="v3-pair-portrait"><div class="field" style="margin:0"><label>Главное фото персонажа</label><input id="v3-p2-portrait-url" type="url" placeholder="Ссылка на фото"><button type="button" class="tab v3-upload" id="v3-p2-portrait-file">Загрузить фото</button></div><div id="v3-p2-preview" class="v3-pair-preview"></div></div></div>
      </div>
      <div class="v3-pair-aesthetic"><div class="v3-pair-aesthetic-title">ЭСТЕТИКА</div><div class="v3-grid">
        <div class="v3-slot"><h4>Их место</h4><input id="v3-pair-img-0" type="url" placeholder="Ссылка на изображение"><button type="button" class="tab v3-upload" data-v3-file="p1-img-file-0">Загрузить</button></div>
        <div class="v3-slot"><h4>Их настроение / погода</h4><input id="v3-pair-img-1" type="url" placeholder="Ссылка на изображение"><button type="button" class="tab v3-upload" data-v3-file="p1-img-file-1">Загрузить</button></div>
        <div class="v3-slot"><h4>Их символ</h4><input id="v3-pair-img-2" type="url" placeholder="Ссылка на изображение"><button type="button" class="tab v3-upload" data-v3-file="p1-img-file-2">Загрузить</button></div>
        <div class="v3-slot"><h4>Важная сцена</h4><input id="v3-pair-img-3" type="url" placeholder="Ссылка на изображение"><button type="button" class="tab v3-upload" data-v3-file="p1-img-file-3">Загрузить</button></div>
      </div></div>`;
    for(const prefix of ['p1','p2']){
      const u=$(`v3-${prefix}-portrait-url`),p=$(`v3-${prefix}-preview`);u?.addEventListener('input',()=>{mirror(`${prefix}-portrait-url`,u.value);p.innerHTML=u.value.trim()?`<img src="${esc(u.value.trim())}" alt="Портрет">`:'';});bindFile(`v3-${prefix}-portrait-file`,`${prefix}-portrait-file`);
    }
    for(let i=0;i<4;i++){const u=$(`v3-pair-img-${i}`);u?.addEventListener('input',()=>mirror(`p1-img-url-${i}`,u.value));bindFile(`v3-pair-img-${i}`.replace(`v3-pair-img-${i}`,`v3-pair-file-${i}`),`p1-img-file-${i}`);}
  }

  function start(){
    styles();
    const run=()=>{buildSingle();buildPair();};
    const observer=new MutationObserver(run);observer.observe(document.body,{childList:true,subtree:true});run();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
