(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c] || c));

  function injectStyles(){
    if ($('layout-v2-styles')) return;
    const style = document.createElement('style');
    style.id = 'layout-v2-styles';
    style.textContent = `
      .layout-v2-single-visual{margin-top:18px}
      .layout-v2-title{font-size:24px;font-weight:750;margin:0 0 14px}
      .layout-v2-note{font-size:13px;color:var(--muted);margin:-6px 0 16px}
      .layout-v2-portrait{display:grid;grid-template-columns:1fr 180px;gap:14px;align-items:end}
      .layout-v2-preview{aspect-ratio:3/4;border-radius:14px;overflow:hidden;background:var(--soft);min-height:150px}
      .layout-v2-preview img{width:100%;height:100%;object-fit:cover;display:block}
      .layout-v2-aesthetic{margin-top:22px}
      .layout-v2-aesthetic-title{text-align:center;font-size:21px;font-weight:750;letter-spacing:.04em;margin-bottom:16px}
      .layout-v2-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      .layout-v2-slot{border:1px solid var(--line);border-radius:14px;padding:12px;background:#faf8f5}
      .layout-v2-slot h4{margin:0 0 8px;font-size:15px}
      .layout-v2-slot input[type=url]{font-size:13px;padding:9px}
      .layout-v2-slot input[type=file]{width:100%;font-size:11px;margin-top:7px}
      .layout-v2-extra{margin-top:14px}
      .layout-v2-extra summary{cursor:pointer;color:var(--muted);font-size:14px}
      .layout-v2-pair-head{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
      .layout-v2-person{border:1px solid var(--line);border-radius:14px;padding:14px;background:#faf8f5}
      .layout-v2-person h3{font-size:18px;margin:0 0 10px}
      .layout-v2-pair-portrait{display:grid;grid-template-columns:1fr 105px;gap:10px;align-items:end}
      .layout-v2-pair-preview{aspect-ratio:3/4;border-radius:12px;overflow:hidden;background:var(--soft);min-height:130px}
      .layout-v2-pair-preview img{width:100%;height:100%;object-fit:cover;display:block}
      .layout-v2-pair-aesthetic{margin-top:20px}
      .layout-v2-pair-aesthetic-title{text-align:center;font-size:21px;font-weight:750;letter-spacing:.05em;margin:4px 0 16px}
      .layout-v2-hidden{display:none!important}
      .layout-v2-upload{display:inline-block;margin-top:7px}
      @media(max-width:700px){.layout-v2-portrait,.layout-v2-pair-head,.layout-v2-pair-portrait{grid-template-columns:1fr}.layout-v2-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function mirrorUrl(hiddenId, value){
    const el=$(hiddenId);
    if(!el)return;
    el.value=value;
    el.dispatchEvent(new Event('input',{bubbles:true}));
  }

  function preserveLegacyInputs(source, prefix){
    const hidden=document.createElement('div');
    hidden.className='layout-v2-hidden';
    hidden.setAttribute('aria-hidden','true');
    const ids=[`${prefix}-portrait-url`,`${prefix}-portrait-file`];
    for(let i=0;i<6;i++)ids.push(`${prefix}-img-url-${i}`,`${prefix}-img-file-${i}`);
    ids.forEach(id=>{const el=$(id);if(el)hidden.appendChild(el);});
    source.appendChild(hidden);
    return hidden;
  }

  function bindPreview(urlInput, fileInput, preview){
    const draw=()=>{
      const src=urlInput?.value.trim();
      preview.innerHTML=src?`<img src="${esc(src)}" alt="Портрет">`:'';
    };
    urlInput?.addEventListener('input',draw);
    fileInput?.addEventListener('change',()=>setTimeout(draw,40));
    draw();
  }

  function buildSingle(){
    const source=$('single-visual'), eqCard=$('single-eq')?.closest('.card');
    if(!source||!eqCard||source.dataset.v2==='1')return;
    source.dataset.v2='1';
    preserveLegacyInputs(source,'s');
    eqCard.appendChild(source);
    source.classList.add('layout-v2-single-visual');
    source.innerHTML=`
      <div class="layout-v2-title">Визуальный образ персонажа</div>
      <div class="layout-v2-note">Главный портрет + 4 обязательных образа и до 2 дополнительных. Можно использовать ссылку или загрузить изображение.</div>
      <div class="layout-v2-portrait">
        <div class="field" style="margin:0">
          <label>Главное фото персонажа</label>
          <input id="v2-s-portrait-url" type="url" placeholder="Ссылка на фото">
          <button type="button" class="tab layout-v2-upload" id="v2-s-portrait-file">Загрузить фото</button>
        </div>
        <div id="v2-s-portrait-preview" class="layout-v2-preview"></div>
      </div>
      <div class="layout-v2-aesthetic">
        <div class="layout-v2-aesthetic-title">ЭСТЕТИКА</div>
        <div class="layout-v2-grid">
          <div class="layout-v2-slot"><h4>Символ его истории</h4><input id="v2-s-img-url-0" type="url" placeholder="Ссылка на изображение"><button type="button" class="tab layout-v2-upload" data-file="s-img-file-0">Загрузить</button></div>
          <div class="layout-v2-slot"><h4>Место</h4><input id="v2-s-img-url-1" type="url" placeholder="Ссылка на изображение"><button type="button" class="tab layout-v2-upload" data-file="s-img-file-1">Загрузить</button></div>
          <div class="layout-v2-slot"><h4>Настроение / погода</h4><input id="v2-s-img-url-2" type="url" placeholder="Ссылка на изображение"><button type="button" class="tab layout-v2-upload" data-file="s-img-file-2">Загрузить</button></div>
          <div class="layout-v2-slot"><h4>Важная сцена</h4><input id="v2-s-img-url-3" type="url" placeholder="Ссылка на изображение"><button type="button" class="tab layout-v2-upload" data-file="s-img-file-3">Загрузить</button></div>
        </div>
        <details class="layout-v2-extra"><summary>Ещё 2 изображения</summary><div class="layout-v2-grid" style="margin-top:10px">
          <div class="layout-v2-slot"><h4>Дополнительный образ</h4><input id="v2-s-img-url-4" type="url" placeholder="Ссылка на изображение"><button type="button" class="tab layout-v2-upload" data-file="s-img-file-4">Загрузить</button></div>
          <div class="layout-v2-slot"><h4>Дополнительный образ</h4><input id="v2-s-img-url-5" type="url" placeholder="Ссылка на изображение"><button type="button" class="tab layout-v2-upload" data-file="s-img-file-5">Загрузить</button></div>
        </div></details>
      </div>`;

    const portraitUrl=$('v2-s-portrait-url'), portraitFile=$('s-portrait-file'), preview=$('v2-s-portrait-preview');
    portraitUrl.addEventListener('input',()=>mirrorUrl('s-portrait-url',portraitUrl.value));
    $('v2-s-portrait-file').addEventListener('click',()=>portraitFile?.click());
    bindPreview(portraitUrl,portraitFile,preview);
    for(let i=0;i<6;i++){
      const url=$(`v2-s-img-url-${i}`), hidden=$(`s-img-url-${i}`), button=document.querySelector(`[data-file="s-img-file-${i}"]`), file=$(`s-img-file-${i}`);
      url.addEventListener('input',()=>mirrorUrl(hidden.id,url.value));
      button?.addEventListener('click',()=>file?.click());
    }
  }

  function buildPair(){
    const host=$('pair-visual');
    if(!host||host.dataset.v2==='1')return;
    host.dataset.v2='1';
    preserveLegacyInputs(host,'p1');
    preserveLegacyInputs(host,'p2');
    host.innerHTML=`
      <div class="layout-v2-pair-head">
        <div class="layout-v2-person"><h3>Персонаж 1 · визуальный образ</h3><div class="layout-v2-pair-portrait"><div class="field" style="margin:0"><label>Главное фото персонажа</label><input id="v2-p1-portrait-url" type="url" placeholder="Ссылка на фото"><button type="button" class="tab layout-v2-upload" id="v2-p1-portrait-file">Загрузить фото</button></div><div id="v2-p1-portrait-preview" class="layout-v2-pair-preview"></div></div></div>
        <div class="layout-v2-person"><h3>Персонаж 2 · визуальный образ</h3><div class="layout-v2-pair-portrait"><div class="field" style="margin:0"><label>Главное фото персонажа</label><input id="v2-p2-portrait-url" type="url" placeholder="Ссылка на фото"><button type="button" class="tab layout-v2-upload" id="v2-p2-portrait-file">Загрузить фото</button></div><div id="v2-p2-portrait-preview" class="layout-v2-pair-preview"></div></div></div>
      </div>
      <div class="layout-v2-pair-aesthetic"><div class="layout-v2-pair-aesthetic-title">ЭСТЕТИКА</div><div class="layout-v2-grid">
        <div class="layout-v2-slot"><h4>Их место</h4><input id="v2-pair-img-0" type="url" placeholder="Ссылка на изображение"></div>
        <div class="layout-v2-slot"><h4>Их настроение / погода</h4><input id="v2-pair-img-1" type="url" placeholder="Ссылка на изображение"></div>
        <div class="layout-v2-slot"><h4>Их символ</h4><input id="v2-pair-img-2" type="url" placeholder="Ссылка на изображение"></div>
        <div class="layout-v2-slot"><h4>Важная сцена</h4><input id="v2-pair-img-3" type="url" placeholder="Ссылка на изображение"></div>
      </div><details class="layout-v2-extra"><summary>Ещё 2 изображения</summary><div class="layout-v2-grid" style="margin-top:10px">
        <div class="layout-v2-slot"><h4>Дополнительный образ</h4><input id="v2-pair-img-4" type="url" placeholder="Ссылка на изображение"></div>
        <div class="layout-v2-slot"><h4>Дополнительный образ</h4><input id="v2-pair-img-5" type="url" placeholder="Ссылка на изображение"></div>
      </div></details></div>`;

    for(const prefix of ['p1','p2']){
      const url=$(`v2-${prefix}-portrait-url`), hidden=$(`${prefix}-portrait-url`), file=$(`${prefix}-portrait-file`), preview=$(`v2-${prefix}-portrait-preview`);
      url.addEventListener('input',()=>mirrorUrl(hidden.id,url.value));
      $(`v2-${prefix}-portrait-file`).addEventListener('click',()=>file?.click());
      bindPreview(url,file,preview);
    }
    for(let i=0;i<6;i++){
      const url=$(`v2-pair-img-${i}`), hidden=$(`p1-img-url-${i}`);
      url.addEventListener('input',()=>mirrorUrl(hidden.id,url.value));
    }
  }

  function start(){
    injectStyles();
    const observer=new MutationObserver(()=>{buildSingle();buildPair();});
    observer.observe(document.body,{childList:true,subtree:true});
    buildSingle();buildPair();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
