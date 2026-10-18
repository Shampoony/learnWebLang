import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons,levels,questionsFor,nextReview} from '../data.js';
test('each language has a complete set of introductory levels',()=>{for(const lang of ['de','sk'])assert.deepEqual([...new Set(lessons.filter(l=>l.lang===lang).map(l=>l.level))],levels);assert.equal(new Set(lessons.map(l=>l.id)).size,64);});
test('all exercise answers are unique and selectable',()=>{let count=0;for(const l of lessons){assert.equal(l.words.length,6);for(const q of questionsFor(l)){assert.ok(q.prompt);assert.equal(q.options.length,3);assert.equal(new Set(q.options).size,3);assert.equal(q.options.filter(o=>o===q.answer).length,1);count++;}}assert.equal(count,448);});
test('spaced repetition schedules failures sooner, doubles success and caps at 30 days',()=>{const now=1000;assert.deepEqual(nextReview(now,false,8),{due:601000,interval:0});assert.deepEqual(nextReview(now,true),{due:86401000,interval:1});assert.equal(nextReview(now,true,8).interval,16);assert.equal(nextReview(now,true,16).interval,30);assert.equal(nextReview(now,true,30).interval,30);});
test('written exercises require active recall in both languages',()=>{for(const l of lessons){const qs=questionsFor(l).filter(q=>q.type==='written');assert.equal(qs.length,3);assert.ok(qs.every(q=>l.words.some(w=>w.word===q.answer)));}});

test('each level has eight lessons with stable unique IDs and distinct content',()=>{
 for(const lang of ['de','sk'])for(const level of levels){const group=lessons.filter(l=>l.lang===lang&&l.level===level);assert.equal(group.length,8);assert.equal(new Set(group.map(l=>l.title)).size,8);assert.ok(group.every(l=>l.note.length>70));}
});
