import test from 'node:test';
import assert from 'node:assert/strict';
import {registrationFormEnabled} from '../src/lib/registration/activation.ts';
test('a build flag cannot enable the draft policy or review runtime',()=>{
 const draft={status:'implementation-draft',publicIntakeEnabled:false},approved={status:'approved',publicIntakeEnabled:true};
 assert.equal(registrationFormEnabled({},draft),false);
 assert.equal(registrationFormEnabled({PUBLIC_REGISTRATION_ENABLED:'false'},approved),false);
 for(const [env,policy]of [[{PUBLIC_REGISTRATION_ENABLED:'yes'},approved],[{PUBLIC_REGISTRATION_ENABLED:'true',DEPLOY_TARGET:'strato'},draft],[{PUBLIC_REGISTRATION_ENABLED:'true',DEPLOY_TARGET:'review'},approved],[{PUBLIC_REGISTRATION_ENABLED:'true',DEPLOY_TARGET:'strato'},{...approved,publicIntakeEnabled:false}]])assert.throws(()=>registrationFormEnabled(env,policy));
 assert.equal(registrationFormEnabled({PUBLIC_REGISTRATION_ENABLED:'true',DEPLOY_TARGET:'strato'},approved),true);
});
