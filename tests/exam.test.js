import test from 'node:test';
import assert from 'node:assert/strict';
import {examFor,gradeExam,sectionNames} from '../exam-data.js';
import {levels,lessons} from '../data.js';

test('all eight exams cover four objective sections with meaningful texts and open tasks',()=>{
 for(const lang of ['de','sk'])for(const level of levels){
  const exam=examFor(lang,level);assert.equal(exam.questions.length,24);assert.equal(new Set(exam.questions.map(q=>q.id)).size,24);
  for(const section of Object.keys(sectionNames))assert.equal(exam.questions.filter(q=>q.section===section).length,['grammar','vocabulary'].includes(section)?8:4);
  for(const q of exam.questions){if(q.section==='grammar')assert.ok(!/что означает|как сказать|выбери перевод/i.test(q.prompt));assert.equal(q.options.length,3);assert.equal(new Set(q.options).size,3);assert.equal(q.options.filter(o=>o===q.answer).length,1);assert.ok(q.explanation.length>5);}
  assert.ok(exam.reading.length>200);assert.ok(exam.listening.length>150);assert.ok(exam.writing.length>60);assert.ok(exam.speaking.length>60);assert.ok(exam.minWords<exam.maxWords);
 }
 assert.throws(()=>examFor('fr','A1'));assert.throws(()=>examFor('de','C2'));
});
test('perfect objective answers pass only when listening was completed without transcript',()=>{
 const exam=examFor('de','B2'),answers=Object.fromEntries(exam.questions.map(q=>[q.id,q.answer]));
 assert.equal(gradeExam(exam,answers,{listened:true}).objectivePassed,true);
 assert.equal(gradeExam(exam,answers,{listened:true}).percent,100);
 assert.equal(gradeExam(exam,answers).objectivePassed,false);
 assert.equal(gradeExam(exam,answers,{listened:true,transcript:true}).objectivePassed,false);
});
test('unanswered items score zero; one weak section prevents a pass even with high total',()=>{
 const exam=examFor('sk','A2');const empty=gradeExam(exam,{});assert.equal(empty.correct,0);assert.equal(empty.percent,0);assert.equal(empty.objectivePassed,false);
 const answers=Object.fromEntries(exam.questions.filter(q=>q.section!=='reading').map(q=>[q.id,q.answer]));
 const result=gradeExam(exam,answers,{listened:true});assert.equal(result.correct,20);assert.equal(result.percent,83);assert.equal(result.objectivePassed,false);
});
test('pass requires raw scores of at least 70 percent total and 50 percent per section',()=>{
 const exam=examFor('de','A1');
 const answers={};for(const section of Object.keys(sectionNames)){const qs=exam.questions.filter(q=>q.section===section);for(const q of qs.slice(0,qs.length/2))answers[q.id]=q.answer;}
 assert.equal(gradeExam(exam,answers,{listened:true}).objectivePassed,false);
 for(const q of exam.questions.filter(q=>q.section==='grammar'))answers[q.id]=q.answer;
 assert.equal(gradeExam(exam,answers,{listened:true}).correct,16);assert.equal(gradeExam(exam,answers,{listened:true}).objectivePassed,false);
 const next=exam.questions.find(q=>q.section==='vocabulary'&&!answers[q.id]);answers[next.id]=next.answer;
 assert.equal(gradeExam(exam,answers,{listened:true}).correct,17);assert.equal(gradeExam(exam,answers,{listened:true}).objectivePassed,true);
});
test('previous lesson IDs stay available for saved progress',()=>{
 for(const lang of ['de','sk'])for(const level of levels)assert.ok(lessons.some(l=>l.id===`${lang}-${level}`));
});
