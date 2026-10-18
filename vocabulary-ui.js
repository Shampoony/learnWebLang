import {languages,levels} from './data.js';
import {validateCustomWord,sameWord,parseWordBackup,safeSource} from './vocabulary.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createVocabularyUI({state,allWords,openModal,closeModal,persist,toast,onSaved}){
 let editing=null;
 function saveChange(change){
  const previous={customWords:[...state.customWords],saved:[...state.saved],reviews:{...state.reviews},lang:state.lang};
  change();if(!persist()){Object.assign(state,previous);throw Error('Не удалось сохранить изменения. Проверь доступное место и разрешения браузера; можно экспортировать текущий словарь.');}
 }
 function editor(id){
  editing=id?state.customWords.find(w=>w.id===id):null;if(id&&!editing)return;
  const w=editing||{word:'',translation:'',lang:state.lang,level:'',example:'',source:''};
  openModal(`<div class="eyebrow">ЛИЧНЫЙ СЛОВАРЬ</div><h2>${editing?'Редактировать слово':'Добавить своё слово'}</h2><p>Слово, выражение или целая фраза из книги, видео или разговора. Перевод заполняешь ты — автоматического переводчика здесь нет.</p><form id="custom-word-form" novalidate>
   <div class="field-grid"><label>Язык<select name="lang">${Object.entries(languages).map(([id,l])=>`<option value="${id}" ${w.lang===id?'selected':''}>${l.name}</option>`).join('')}</select></label><label>Уровень<select name="level"><option value="">Без уровня</option>${levels.map(l=>`<option ${w.level===l?'selected':''}>${l}</option>`).join('')}</select></label></div>
   <label>Слово или выражение *<input name="word" required maxlength="200" value="${esc(w.word)}" placeholder="Например: die Gelegenheit / príležitosť" autocomplete="off"></label>
   <label>Перевод *<input name="translation" required maxlength="500" value="${esc(w.translation)}" placeholder="Например: возможность" autocomplete="off"></label>
   <label>Пример или заметка<textarea name="example" maxlength="1000" rows="3" placeholder="Фраза, в которой встретилось слово">${esc(w.example)}</textarea></label>
   <label>Ссылка на источник<input name="source" type="url" maxlength="2048" value="${esc(w.source)}" placeholder="https://…" inputmode="url"></label>
   <label class="checkbox-label"><input name="review" type="checkbox" ${!editing||state.saved.includes(w.id)?'checked':''}> Добавить в интервальное повторение</label>
   <p class="scope-note">Если не знаешь уровень, оставь «Без уровня». Слова и прогресс хранятся в этом браузере. Для переноса на другое устройство используй экспорт и импорт.</p>
   <div id="word-form-error" role="alert"></div><button class="primary full" type="submit">${editing?'Сохранить изменения':'Добавить слово'}</button>
   ${editing?`<button class="text-button danger full" type="button" data-delete-word="${esc(w.id)}">Удалить свою карточку</button>`:''}
  </form>`);
 }
 function fail(message,field){const error=document.querySelector('#word-form-error');error.textContent=message;error.className='feedback error';const input=document.querySelector(`[name="${field}"]`);input?.setAttribute('aria-invalid','true');input?.focus();}
 function confirmDelete(id){const word=state.customWords.find(w=>w.id===id);if(!word)return;openModal(`<div class="eyebrow">ЛИЧНЫЙ СЛОВАРЬ</div><h2>Удалить карточку?</h2><p>«${esc(word.word)}» и её история повторения будут удалены. Остальные слова останутся.</p><button class="primary full" id="confirm-delete-word" data-word="${esc(id)}">Удалить карточку</button><button class="outline full" data-edit-word="${esc(id)}">Оставить и вернуться</button>`);}
 function download(){
  if(!state.customWords.length){toast('Сначала добавь свои слова');return;}
  const text=JSON.stringify({format:'lingua-words-v1',exportedAt:new Date().toISOString(),words:state.customWords.map(({word,translation,lang,level,example,source})=>({word,translation,lang,level,example,source}))},null,2);
  const url=URL.createObjectURL(new Blob([text],{type:'application/json;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='lingua-my-words.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.id==='add-custom-word')editor();
  if(b.dataset.editWord)editor(b.dataset.editWord);
  if(b.dataset.deleteWord)confirmDelete(b.dataset.deleteWord);
  if(b.id==='confirm-delete-word'){const id=b.dataset.word;try{saveChange(()=>{state.customWords=state.customWords.filter(w=>w.id!==id);state.saved=state.saved.filter(saved=>saved!==id);delete state.reviews[id];});closeModal();toast('Карточка удалена');}catch(error){toast(error.message);}}
  if(b.id==='export-custom-words')download();
  if(b.id==='import-custom-words')document.querySelector('#word-import-file').click();
 });
 document.addEventListener('submit',e=>{
  if(e.target.id!=='custom-word-form')return;e.preventDefault();
  const form=e.target;form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
  const data=Object.fromEntries(new FormData(form));const {value,errors}=validateCustomWord(data);
  if(Object.keys(errors).length){const [field,message]=Object.entries(errors)[0];fail(message,field);return;}
  if(state.customWords.some(w=>w.id!==editing?.id&&sameWord(w,value))){fail('Такое слово с этим переводом уже есть в твоих карточках этого языка. Найди его через поиск или добавь другое значение.','word');return;}
  const id=editing?.id||`custom-${crypto.randomUUID()}`;
  const changed=editing&&(editing.word!==value.word||editing.translation!==value.translation||editing.lang!==value.lang);
  const word={...value,id,custom:true};
  try{saveChange(()=>{
  if(editing)state.customWords=state.customWords.map(w=>w.id===id?word:w);else state.customWords.push(word);
  if(data.review==='on'){if(!state.saved.includes(id))state.saved.push(id);}else{state.saved=state.saved.filter(saved=>saved!==id);delete state.reviews[id];}
  if(changed)delete state.reviews[id];
  state.lang=value.lang;});}catch(error){fail(error.message,'word');return;}onSaved();closeModal();toast(editing?'Изменения сохранены':'Слово добавлено в личный словарь');editing=null;
 });
 document.addEventListener('change',async e=>{
  if(e.target.id!=='word-import-file')return;
  const input=e.target,file=input.files?.[0];if(!file)return;
  try{
   if(file.size>2*1024*1024)throw Error('Файл слишком большой. Максимум — 2 МБ.');
   const rows=parseWordBackup(await file.text());const merged=[...state.customWords];let added=0;
   for(const value of rows)if(!merged.some(w=>sameWord(w,value))){merged.push({...value,id:`custom-${crypto.randomUUID()}`,custom:true});added++;}
   const newWords=merged.slice(state.customWords.length);saveChange(()=>{state.customWords=merged;state.saved.push(...newWords.map(w=>w.id));});onSaved();toast(`Добавлено карточек: ${added}. Повторы пропущены.`);
  }catch(error){toast(error instanceof SyntaxError?'Не удалось прочитать JSON. Выбери экспорт словаря Lingua.':error.message);}finally{input.value='';}
 });
 return {details(word){return `${word.example?`<blockquote class="word-example">${esc(word.example)}</blockquote>`:''}${safeSource(word.source)?`<a class="word-source" href="${esc(safeSource(word.source))}" target="_blank" rel="noopener noreferrer">Источник · ${esc(new URL(word.source).hostname)} ↗</a>`:''}${word.custom?`<button class="text-button edit-word" data-edit-word="${esc(word.id)}">Редактировать</button>`:''}`;}};
}
