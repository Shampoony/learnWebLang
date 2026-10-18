import {examFor,gradeExam,sectionNames,rubrics} from './exam-data.js';
import {languages,levels,lessons} from './data.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key='lingua-exams-v1';
const countWords=text=>(text.trim().match(/\S+/gu)||[]).length;
export function createExamUI({openModal,closeModal,toast,onPractice}){
 let store={drafts:{},results:{}};
 try{const parsed=JSON.parse(localStorage.getItem(key));if(parsed?.drafts&&parsed?.results)store=parsed;}catch{}
 let current=null,ticker=null;
 const save=()=>{try{localStorage.setItem(key,JSON.stringify(store));}catch{toast('Не удалось сохранить тест. Не закрывай вкладку до завершения.');}};
 const stop=()=>{clearInterval(ticker);ticker=null;if('speechSynthesis' in window)speechSynthesis.cancel();};
 const remaining=()=>current?Math.max(0,Math.ceil((current.draft.endsAt-Date.now())/1000)):0;
 const clock=s=>`${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
 function card(lang,level){
  const id=`${lang}-${level}`,history=store.results[id]||[],last=history.at(-1),draft=store.drafts[id];
  return `<article class="exam-card"><div><span class="pill">ФИНИШ УРОВНЯ ${level}</span><h3>Проверь себя: ${level}</h3><p>24 задания · чтение и аудирование · письмо и устная практика</p><small>${draft?'Есть сохранённая попытка':last?`Последний результат автопроверки: ${last.grade.percent}% · ${new Date(last.finishedAt).toLocaleDateString('ru-RU')}`:'Тренировочный формат. Не выдаёт языковой сертификат.'}</small></div><button class="primary" data-exam="${id}">${draft?'Продолжить тест':'Итоговый тест'} ↗</button></article>`;
 }
 function intro(id){
  stop();const lang=id.slice(0,2),level=id.slice(3);const exam=examFor(lang,level),draft=store.drafts[id],last=(store.results[id]||[]).at(-1);current={exam,draft:null};
  const done=lessons.filter(l=>l.lang===lang&&l.level===level).length;
  openModal(`<div class="eyebrow">${languages[lang].flag} ${languages[lang].name} · УРОВЕНЬ ${level}</div><h2>Итоговый тест ${level}</h2><p>После ${done} уроков уровня: проверь понимание и применение языка. Можно пройти заранее для диагностики.</p><div class="exam-outline"><div><strong>24 задания</strong><span>8 грамматика · 8 лексика · 4 чтение · 4 аудирование</span></div><div><strong>${exam.minutes} минут</strong><span>Общий таймер, включая письмо и устную практику</span></div><div><strong>Письмо и говорение</strong><span>Сохраняются отдельно; проверка по критериям с преподавателем</span></div></div><p>Это авторский тренировочный формат с отдельными элементами языковых экзаменов, а не официальный пробник Goethe, telc или ECL. Порог автопроверки здесь: ≥70% всего и ≥50% в каждом разделе. Это правила сайта, а не требования конкретного экзамена.</p><p>Ответы и объяснения откроются только после завершения. Пропуски считаются ошибками. Закрытие окна не останавливает таймер; попытка сохраняется на этом устройстве. Для аудирования нужен голос ${languages[lang].native} в браузере. Расшифровка доступна, но её открытие переводит аудирование в практику чтения.</p>${draft?'<div class="lesson-note">Есть незавершённая попытка. Продолжи её или начни заново; новая попытка заменит текущий черновик.</div>':''}<button class="primary full" id="exam-start">${draft?'Продолжить сохранённую попытку':'Начать тест'}</button>${draft?'<button class="outline full" id="exam-restart">Начать новую попытку</button>':''}${last?'<button class="outline full" id="exam-last-result">Последний результат и разбор</button>':''}`);
 }
 function begin(fresh=false){
  const exam=current.exam;let draft=store.drafts[exam.id];
  if(fresh||!draft){draft={startedAt:Date.now(),endsAt:Date.now()+exam.minutes*60000,index:0,answers:{},writing:'',notes:'',writingRatings:{},speakingRatings:{},listened:false,transcript:false};store.drafts[exam.id]=draft;save();}
  current={exam,draft};
  if(remaining()===0){finish(true);return;}
  show();ticker=setInterval(()=>{if(!current?.draft)return;const timer=document.querySelector('#exam-clock');if(timer)timer.textContent=clock(remaining());if(remaining()===0)finish(true);},1000);
 }
 function show(){
  const {exam,draft}=current,i=draft.index,q=exam.questions[i],stage=i===24?'writing':i===25?'speaking':q.section;
  const sections=[...Object.keys(sectionNames),'writing','speaking'];
  const names={...sectionNames,writing:'Письмо',speaking:'Говорение'};
  const buttons=sections.map(s=>{const index=s==='writing'?24:s==='speaking'?25:exam.questions.findIndex(q=>q.section===s);return `<button data-exam-index="${index}" class="${s===stage?'selected':''}">${names[s]}</button>`;}).join('');
  let body='';
  if(i<24){
   const passage=q.section==='reading'?`<div class="exam-passage" lang="${exam.lang}">${esc(exam.reading)}</div>`:q.section==='listening'?`<div class="audio-panel"><p>Прослушай сообщение, затем выбери ответ. Синтез речи браузера — учебное аудио, а не запись носителя.</p><button class="outline" id="exam-listen">▶ Прослушать</button> <button class="text-button" id="exam-stop-audio">Остановить</button><span id="audio-status" role="status"></span><details id="exam-transcript" ${draft.transcript?'open':''}><summary>Показать расшифровку (снять зачёт аудирования)</summary><p lang="${exam.lang}">${esc(exam.listening)}</p></details></div>`:'';
   body=`${passage}<h3 class="exam-question">${i+1}. ${esc(q.prompt)}</h3><fieldset class="exam-options"><legend class="sr-only">Выбери один ответ</legend>${q.options.map((option,n)=>`<label><input type="radio" name="exam-answer" value="${esc(option)}" ${draft.answers[q.id]===option?'checked':''}><span>${esc(option)}</span></label>`).join('')}</fieldset><p class="scope-note">До завершения теста ответ можно изменить. Правильный вариант пока не показывается.</p>`;
  }else{
   const writing=i===24,field=writing?'writing':'notes',ratings=writing?'writingRatings':'speakingRatings';
   body=`<h3>${writing?'Письменная работа':'Устная практика'}</h3><div class="lesson-note">${esc(writing?exam.writing:exam.speaking)}</div><p>${writing?`Ориентир: ${exam.minWords}–${exam.maxWords} слов. Объём — только один из критериев; автоматически качество текста не оценивается.`:'Говори вслух, затем запиши тезисы. Запись звука не ведётся. Для независимой оценки выполни задание с партнёром или преподавателем.'}</p><label class="written-label" for="exam-text">${writing?'Твой текст':'Тезисы и заметки'}</label><textarea id="exam-text" data-exam-field="${field}" rows="8" lang="${exam.lang}" placeholder="${writing?'Пиши на изучаемом языке':'Запиши план ответа'}">${esc(draft[field])}</textarea><p id="exam-word-count" class="scope-note">${writing?`Слов: ${countWords(draft.writing)}`:'Заметки сохраняются только в этом браузере'}</p><h4>Самооценка · не входит в автоматический балл</h4><p class="scope-note">0 — пока нет · 1 — частично · 2 — в основном · 3 — уверенно. Это твоя оценка, не заключение экзаменатора.</p><div class="rubric-grid">${rubrics.map((text,j)=>`<label>${esc(text)}<select data-exam-rating="${ratings}" data-criterion="${j}" aria-label="${esc(text)}"><option value="">Не оценено</option>${[0,1,2,3].map(n=>`<option value="${n}" ${draft[ratings][j]===n?'selected':''}>${n}</option>`).join('')}</select></label>`).join('')}</div>`;
  }
  openModal(`<div class="exam-top"><span class="eyebrow">${languages[exam.lang].flag} ТЕСТ ${exam.level}</span><span class="exam-timer">Осталось <b id="exam-clock">${clock(remaining())}</b></span></div><div class="exam-section-tabs">${buttons}</div><div class="exercise-meta"><span>${names[stage]}</span><span>Ответов: ${Object.keys(draft.answers).length} / 24</span></div><div class="progress-track"><i style="width:${Object.keys(draft.answers).length/24*100}%"></i></div>${body}<div class="exam-navigation"><button class="outline" data-exam-index="${Math.max(0,i-1)}" ${i===0?'disabled':''}>← Назад</button>${i<25?`<button class="primary" data-exam-index="${i+1}">${i<23?'Далее →':i===23?'К письму →':'К говорению →'}</button>`:''}<button class="text-button" id="exam-check-finish">Завершить тест</button></div>`);
 }
 function confirmFinish(){
  const {draft}=current;const missing=24-Object.keys(draft.answers).length;
  openModal(`<div class="eyebrow">ПРОВЕРКА ПЕРЕД ОТПРАВКОЙ</div><h2>Завершить попытку?</h2><p>Без ответа: <strong>${missing} из 24</strong>. Пропущенные вопросы получат 0 баллов.</p><p>Письмо: ${countWords(draft.writing)} слов. Устные заметки: ${draft.notes.trim()?'сохранены':'не добавлены'}. Самооценка и письмо не подтверждают уровень языка.</p><button class="primary full" id="exam-submit">Завершить и посмотреть результат</button><button class="outline full" id="exam-back">Вернуться к заданиям</button>`);
 }
 function finish(timedOut=false){
  if(!current?.draft)return;stop();
  const {exam,draft}=current;const result={...draft,finishedAt:Date.now(),timedOut,grade:gradeExam(exam,draft.answers,draft)};
  store.results[exam.id]=[...(store.results[exam.id]||[]),result].slice(-10);delete store.drafts[exam.id];save();onPractice(Object.keys(draft.answers).length);current={exam,result};showResult();
 }
 function showResult(){
  const {exam,result}=current,g=result.grade;
  openModal(`<div class="eyebrow">${languages[exam.lang].flag} ${exam.level} · РЕЗУЛЬТАТ ТРЕНИРОВКИ</div><h2>${g.percent}% <span class="result-subtitle">· ${g.correct} / ${g.total}</span></h2><p>${result.timedOut?'Время истекло, попытка автоматически завершена. ':''}${g.objectivePassed?'Автоматическая часть пройдена по правилам сайта.':'Автоматическая часть пока не зачтена.'} Это не подтверждение уровня CEFR.</p><div class="exam-results">${Object.entries(g.sections).map(([name,s])=>`<div><span>${sectionNames[name]} ${name==='listening'&&!g.listeningValid?'<small>не проверено на слух</small>':''}</span><strong>${s.correct}/${s.total} · ${s.percent}%</strong></div>`).join('')}</div>${!g.listeningValid?'<div class="lesson-note">Аудирование не зачтено: озвучивание не было прослушано полностью или открывалась расшифровка. Ответы сохранены как учебная практика.</div>':''}<h3>Письмо и говорение</h3><p>Письмо: ${countWords(result.writing)} слов. Самооценка заполнена: ${Object.keys(result.writingRatings).length}/4 (письмо), ${Object.keys(result.speakingRatings).length}/4 (говорение). Независимая проверка <strong>не выполнена</strong>. Обсуди эти задания с преподавателем.</p><button class="outline full" id="exam-export">Скачать работу и разбор (.txt)</button><h3>Разбор всех заданий</h3><div class="exam-corrections">${exam.questions.map((q,i)=>{const correct=result.answers[q.id]===q.answer;return `<details><summary>${correct?'✓':'○'} ${i+1}. ${esc(q.prompt)}</summary><p>Твой ответ: ${esc(result.answers[q.id]||'нет ответа')}<br>Правильный: <strong>${esc(q.answer)}</strong></p><p>${esc(q.explanation)}</p></details>`;}).join('')}</div><button class="primary full" id="exam-restart">Новая попытка</button><button class="outline full close-result">Вернуться к урокам</button>`);
 }
 function download(){
  const {exam,result:r}=current;
  const text=[`Lingua · ${languages[exam.lang].name} ${exam.level}`,`Тренировочная автопроверка: ${r.grade.correct}/${r.grade.total} (${r.grade.percent}%)`,`Это не сертификат CEFR. Письмо и говорение требуют независимой проверки.`,`Аудирование на слух: ${r.grade.listeningValid?'выполнено':'не подтверждено'}`,'',...exam.questions.map((q,i)=>`${i+1}. ${q.prompt}\nОтвет: ${r.answers[q.id]||'пропущен'}\nПравильно: ${q.answer}\n${q.explanation}`),'','Письмо:',exam.writing,r.writing,'Самооценка письма:',...rubrics.map((s,i)=>`${s}: ${r.writingRatings[i]??'не оценено'}`),'','Говорение:',exam.speaking,r.notes,'Самооценка говорения:',...rubrics.map((s,i)=>`${s}: ${r.speakingRatings[i]??'не оценено'}`)].join('\n');
  const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`lingua-${exam.id}-result.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.exam){intro(b.dataset.exam);return;}
  if(!current)return;
  if(b.id==='exam-start'){begin();return;}
  if(b.id==='exam-restart'){begin(true);return;}
  if(b.id==='exam-last-result'){current.result=store.results[current.exam.id].at(-1);showResult();return;}
  if(!current.draft){if(b.id==='exam-export')download();return;}
  if(b.dataset.examIndex!==undefined){current.draft.index=Number(b.dataset.examIndex);save();if('speechSynthesis'in window)speechSynthesis.cancel();show();return;}
  if(b.id==='exam-check-finish'){confirmFinish();return;}
  if(b.id==='exam-back'){show();return;}
  if(b.id==='exam-submit'){finish();return;}
  if(b.id==='exam-stop-audio'){if('speechSynthesis'in window)speechSynthesis.cancel();return;}
  if(b.id==='exam-listen'){
   const status=document.querySelector('#audio-status');
   if(!('speechSynthesis'in window)){status.textContent='Озвучивание недоступно; можно открыть расшифровку для практики.';return;}
   const voice=speechSynthesis.getVoices().find(v=>v.lang.startsWith(current.exam.lang));
   if(!voice){status.textContent='Голос языка не установлен. Добавь его в настройках устройства или используй расшифровку.';return;}
   speechSynthesis.cancel();const owner=current;const u=new SpeechSynthesisUtterance(current.exam.listening);u.voice=voice;u.lang=voice.lang;u.rate=current.exam.level==='A1'?.8:.95;
   u.onstart=()=>{if(status.isConnected)status.textContent='Идёт воспроизведение…';};
   u.onend=()=>{if(current!==owner)return;current.draft.listened=true;save();if(status.isConnected)status.textContent='Прослушано полностью';};
   u.onerror=()=>{if(status.isConnected)status.textContent='Воспроизведение прервано. Прослушай ещё раз.';};speechSynthesis.speak(u);
  }
 });
 document.addEventListener('change',e=>{
  if(!current?.draft)return;const t=e.target;
  if(t.name==='exam-answer'){const q=current.exam.questions[current.draft.index];current.draft.answers[q.id]=t.value;save();const meta=document.querySelector('.exercise-meta span:last-child');if(meta)meta.textContent=`Ответов: ${Object.keys(current.draft.answers).length} / 24`;const bar=document.querySelector('.progress-track i');if(bar)bar.style.width=`${Object.keys(current.draft.answers).length/24*100}%`;}
  if(t.dataset.examRating){const ratings=current.draft[t.dataset.examRating];if(t.value==='')delete ratings[t.dataset.criterion];else ratings[t.dataset.criterion]=Number(t.value);save();}
 });
 document.addEventListener('input',e=>{if(current?.draft&&e.target.dataset.examField){current.draft[e.target.dataset.examField]=e.target.value;save();if(e.target.dataset.examField==='writing')document.querySelector('#exam-word-count').textContent=`Слов: ${countWords(e.target.value)}`;}});
 document.addEventListener('toggle',e=>{if(e.target.id==='exam-transcript'&&e.target.open&&current?.draft){current.draft.transcript=true;save();}},true);
 return {card,onClose(){stop();current=null;}};
}
