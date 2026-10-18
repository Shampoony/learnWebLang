import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

test('development server serves application assets and protects non-public files',async t=>{
 const child=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
 t.after(()=>child.kill());
 const output=await Promise.race([once(child.stdout,'data').then(([chunk])=>chunk.toString()),once(child,'exit').then(()=>{throw Error('Server exited before readiness');}),new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('Startup timed out')),5000);timer.unref();})]);
 const port=output.match(/port (\d+)/)?.[1];assert.ok(port);
 const base=`http://127.0.0.1:${port}`;
 const home=await fetch(base);assert.equal(home.status,200);assert.match(await home.text(),/ТВОЁ ПРОСТРАНСТВО/);
 for(const path of ['/style.css','/app.js','/data.js','/lessons-extra.js','/exam-data.js','/exam-ui.js']){const r=await fetch(base+path);assert.equal(r.status,200);assert.ok(Number(r.headers.get('content-length'))>0);}
 for(const path of ['/.git/config','/server.mjs','/package.json','/not-found'])assert.equal((await fetch(base+path)).status,404);
 assert.equal((await fetch(base,{method:'POST'})).status,405);
 const head=await fetch(base,{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
});
