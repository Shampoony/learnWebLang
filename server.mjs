import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const assets=new Map([
  ...['lessons-extra.js','exam-data.js','exam-ui.js'].map(name=>['/'+name,[name,'text/javascript; charset=utf-8']]),
  ['/', ['index.html','text/html; charset=utf-8']],
  ['/index.html',['index.html','text/html; charset=utf-8']],
  ['/style.css',['style.css','text/css; charset=utf-8']],
  ['/app.js',['app.js','text/javascript; charset=utf-8']],
  ['/data.js',['data.js','text/javascript; charset=utf-8']],
]);
const server=createServer(async(req,res)=>{
  try {
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});return res.end();}
    const asset=assets.get(new URL(req.url,'http://localhost').pathname);
    if(!asset){res.writeHead(404);return res.end('Not found');}
    const body=await readFile(new URL(asset[0],import.meta.url));
    res.writeHead(200,{'Content-Type':asset[1],'X-Content-Type-Options':'nosniff','Content-Length':body.length});
    res.end(req.method==='HEAD'?undefined:body);
  }catch{res.writeHead(500);res.end('Unable to load page');}
});
server.listen(Number(process.env.PORT??3000),'0.0.0.0',()=>console.log('Lingua Path running on port '+server.address().port));
