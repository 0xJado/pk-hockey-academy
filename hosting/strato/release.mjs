import {loadArtifact} from './lib/artifact.mjs';
import {connect,settings} from './lib/sftp.mjs';
import {SftpReleaseStore} from './lib/release-store.mjs';
import {deployRelease,rollbackRelease} from './lib/releases.mjs';
import {deliveryHealth} from './lib/delivery.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {privateRoot} from './lib/sftp.mjs';

const env=await settings();
let connection;
try {
  const health=deliveryHealth(env);
  const rollback=process.argv.includes('--rollback');
  const artifact=rollback?null:await loadArtifact(undefined,[env.STRATO_SFTP_PASSWORD,env.STRATO_PREVIEW_PASSWORD,env.STRATO_DISPATCH_TOKEN]);
  connection=await connect();const store=new SftpReleaseStore(connection.call);
  const result=rollback?await rollbackRelease(store,{target:process.env.STRATO_ROLLBACK_RELEASE||undefined,health}):await deployRelease(store,artifact,{health});
  console.log(JSON.stringify({delivered:true,...result}));
} catch(error) {
  if(!process.env.CI) {
    await mkdir(privateRoot,{recursive:true});
    await writeFile(new URL('release-error.json',privateRoot),JSON.stringify({message:error.message,at:new Date().toISOString()}));
  }
  console.error('Release failed. Existing routing is retained or restored unless recovery was interrupted. Inspect the protected deployment state before retrying.');
  process.exitCode=1;
} finally{connection?.close();}
