import assert from 'node:assert/strict';
import {sha256} from './artifact.mjs';

export function deliveryHealth(env) {
  assert.ok(env.STRATO_PREVIEW_USERNAME&&env.STRATO_PREVIEW_PASSWORD,'Missing review credentials');
  const authentication='Basic '+Buffer.from(`${env.STRATO_PREVIEW_USERNAME}:${env.STRATO_PREVIEW_PASSWORD}`).toString('base64');
  const request=async(path,status,anonymous=false)=>{
    const response=await fetch('https://pkhockeyacademy.de'+path,{redirect:'manual',signal:AbortSignal.timeout(15000),headers:anonymous?{}:{Authorization:authentication}});
    const bytes=Buffer.from(await response.arrayBuffer());
    assert.equal(response.status,status,'Unexpected delivery status');
    if(!anonymous&&status===200)assert.match(response.headers.get('x-robots-tag')||'',/noindex/,'Missing indexing guard');
    return {response,bytes};
  };
  return async({ready,previousReady}={})=>{
    for(const [path,status,anonymous] of [['/',200,false],['/',401,true],['/training',200,false],['/robots.txt',200,false],['/api/registration',503,false],['/.pk-state/test',403,false],['/.pk-releases/test',403,false],['/manifest.json',403,false]]) {
      // The first legacy upload does not contain version metadata.
      if(!ready&&path==='/manifest.json')continue;
      await request(path,status,anonymous);
    }
    const served=ready?.inventory.filter(file=>file.path!=='.htaccess'&&!file.path.endsWith('.php')&&!file.path.startsWith('api/preview-lib/'))||[];
    if(ready?.inventory.some(file=>file.path==='api/editor.php')) {
      await request('/redaktion/trainerpool',401);
      await request('/redaktion/daten',401);
      const connect=await request('/redaktion/verbinden',200);
      assert.equal(sha256(connect.bytes),ready.inventory.find(file=>file.path==='api/preview-lib/preview-connect.html').sha256,'Unexpected preview handshake');
      for(const path of ['/api/preview-lib/preview-shell.html','/api/preview-lib/Preview.php'])await request(path,403);
    }
    for(let index=0;index<served.length;index+=4)await Promise.all(served.slice(index,index+4).map(async file=>{
      const {bytes}=await request('/'+file.path,200);
      assert.equal(sha256(bytes),file.sha256,'Delivered content differs from complete artifact');
    }));
    if(ready&&previousReady)for(const file of previousReady.inventory) {
      if(file.path==='.htaccess'||file.path.startsWith('_astro/')||file.path.startsWith('api/preview-lib/')||ready.inventory.some(item=>item.path===file.path))continue;
      await request('/'+file.path,404);
      if(file.path.endsWith('/index.html'))await request('/'+file.path.slice(0,-'/index.html'.length),404);
    }
  };
}
