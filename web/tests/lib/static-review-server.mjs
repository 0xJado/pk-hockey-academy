import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
export async function staticReviewServer(directory,port=0){
 const root=resolve(directory);
 const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.pdf':'application/pdf','.xml':'application/xml','.txt':'text/plain'};
 const server=createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  try{
   const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   if(path.split('/').some(part=>part.startsWith('.'))){res.writeHead(403);return res.end();}
   if(/^\/(?:api\/registration(?:\/token)?|intern\/anmeldungen)\/?$/.test(path)){res.writeHead(503,{'Content-Type':'application/json'});return res.end('{"code":"inactive"}');}
   if(/\.php$/i.test(path)){res.writeHead(403);return res.end();}
   let file=resolve(root,'.'+path);if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);return res.end();}
   try{if((await stat(file)).isDirectory())file=resolve(file,'index.html');const body=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});return res.end(body);}
   catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});return res.end(await readFile(resolve(root,'404.html')));}
  }catch{res.writeHead(400);res.end();}
 });
 await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
 return {origin:'http://127.0.0.1:'+server.address().port,close:()=>new Promise(resolve=>server.close(resolve))};
}
