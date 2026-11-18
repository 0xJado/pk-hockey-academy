// Exercise actual Apache authorization and internal rewrites on CI loopback.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {createServer} from 'node:net';
import {request as httpRequest} from 'node:http';
import {tmpdir,userInfo} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {createHash} from 'node:crypto';
import {renderRouter} from '../lib/release-router.mjs';

const socket=createServer().listen(0,'127.0.0.1');
await once(socket,'listening');
const port=socket.address().port;
await new Promise(resolve=>socket.close(resolve));
const dir=await mkdtemp(join(tmpdir(),'pk-apache-'));
const web=join(dir,'www'), id='release-apache-test';
const release=join(web,'.pk-releases',id);
let apache;
try {
  await mkdir(join(release,'api'),{recursive:true});
  await writeFile(join(release,'index.html'),'academy homepage');
  await writeFile(join(release,'api','editor.php'),'editor fixture');
  await writeFile(join(release,'api','requests.php'),'staff fixture');
  const maintenance='pk-maintenance-00000000-0000-0000-0000-000000000000';
  await writeFile(join(release,'api',maintenance+'.php'),'maintenance fixture');
  await writeFile(join(dir,'users'),'review:{SHA}'+createHash('sha1').update('fictional').digest('base64')+'\n');
  const guard='AuthUserFile "'+join(dir,'users')+'"\nRequire valid-user\n';
  await writeFile(join(web,'.htaccess'),renderRouter(guard,id,['index.html','api/editor.php','api/requests.php'].map(path=>({path})),{publicLaunch:true}));
  const modules=['mpm_prefork','authn_core','authn_file','authz_core','authz_host','authz_user','auth_basic','mime','dir','rewrite'];
  const config=[...modules.map(m=>'LoadModule '+m+'_module /usr/lib/apache2/modules/mod_'+m+'.so'),
    'ServerName localhost','ServerRoot "'+dir+'"','PidFile "'+join(dir,'pid')+'"',
    'DefaultRuntimeDir "'+dir+'"','ErrorLog "'+join(dir,'error.log')+'"','LogLevel info','TypesConfig /etc/mime.types',
    'Listen 127.0.0.1:'+port,'User '+userInfo().username,'Group #'+userInfo().gid,'StartServers 1','MaxRequestWorkers 3',
    'DocumentRoot "'+web+'"','<Directory "'+web+'">','Options FollowSymLinks','AllowOverride All','Require all granted','</Directory>'];
  await writeFile(join(dir,'test.conf'),config.join('\n')+'\n');
  apache=spawn('/usr/sbin/apache2',['-DFOREGROUND','-f',join(dir,'test.conf')],{stdio:'inherit'});
  const exited=once(apache,'exit');
  async function request(path,authorized=false) {
    return new Promise((resolve,reject)=>{
      const req=httpRequest({hostname:'127.0.0.1',port,path,headers:{host:'pkhockeyacademy.de',
        ...(authorized?{Authorization:'Basic '+Buffer.from('review:fictional').toString('base64')}:{})}},res=>{
          let body='';res.setEncoding('utf8');res.on('data',chunk=>{body+=chunk;});
          res.on('end',()=>resolve({status:res.statusCode,body}));
      });
      req.on('error',reject);req.end();
    });
  }
  let first;
  for(let i=0;i<50&&!first;i++){
    try{first=await request('/');}catch(error){if(i===49)throw error;await delay(100);}
    assert.equal(apache.exitCode,null,'Apache exited before accepting requests');
    assert.equal(apache.signalCode,null,'Apache stopped before accepting requests');
  }
  assert.equal(first?.status,200,'Anonymous homepage');
  assert.equal(first.body,'academy homepage');
  for(const [path,status,authorized] of [['/intern/anmeldungen',200,false],['/redaktion/verbinden',401,false],
    ['/redaktion/verbinden',200,true],['/redaktion/'+maintenance,401,false],['/redaktion/'+maintenance,200,true],
    ['/api/'+maintenance+'.php',403,false],['/api/editor.php',403,false],['/.pk-state/',403,false],
    ['/.pk-releases/'+id+'/index.html',403,false]])assert.equal((await request(path,authorized)).status,status,path);
  apache.kill();await exited;
  console.log('Apache public routing and protected editor checks passed.');
} catch(error) {
  console.error(await readFile(join(dir,'error.log'),'utf8').catch(()=>''));throw error;
} finally {
  if(apache&&apache.exitCode===null&&apache.signalCode===null){const stopped=once(apache,'exit');apache.kill();await stopped;}
  await rm(dir,{recursive:true,force:true});
}
