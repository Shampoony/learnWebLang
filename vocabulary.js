import {levels,languages,normalizeAnswer} from './data.js';
export function safeSource(value){
 if(!value)return '';
 try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password?url.href:'';}catch{return '';}
}
export function validateCustomWord(input){
 const value={word:String(input.word??'').trim(),translation:String(input.translation??'').trim(),lang:String(input.lang??''),level:String(input.level??''),example:String(input.example??'').trim(),source:String(input.source??'').trim()};
 const errors={};
 if(!value.word||value.word.length>200)errors.word='Введи слово или выражение: от 1 до 200 символов.';
 if(!value.translation||value.translation.length>500)errors.translation='Добавь перевод: от 1 до 500 символов.';
 if(!Object.hasOwn(languages,value.lang))errors.lang='Выбери немецкий или словацкий язык.';
 if(value.level&&!levels.includes(value.level))errors.level='Выбери A1–B2 или «Без уровня».';
 if(value.example.length>1000)errors.example='Пример должен быть не длиннее 1000 символов.';
 if(value.source&&(value.source.length>2048||!safeSource(value.source)))errors.source='Укажи полную ссылку http:// или https:// без логина и пароля.';
 if(!errors.source)value.source=safeSource(value.source);
 return {value,errors};
}
export function sameWord(a,b){return a.lang===b.lang&&normalizeAnswer(a.word)===normalizeAnswer(b.word)&&normalizeAnswer(a.translation)===normalizeAnswer(b.translation);}
export function parseWordBackup(text){
 const data=JSON.parse(text);if(data?.format!=='lingua-words-v1'||!Array.isArray(data.words)||data.words.length>5000)throw Error('Нужен файл словаря Lingua (не более 5000 слов).');
 return data.words.map(item=>{if(!item||typeof item!=='object')throw Error('В файле есть некорректная карточка.');const {value,errors}=validateCustomWord(item);if(Object.keys(errors).length)throw Error('В файле есть некорректная карточка: '+Object.values(errors)[0]);return value;});
}
