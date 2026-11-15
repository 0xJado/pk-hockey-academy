import test from 'node:test';
import assert from 'node:assert/strict';
import {createPreviewRenewalHandler} from '../lib/preview-renewal.ts';

test('renewal accepts only the current owned iframe, exact origin and fresh nonce',async()=>{
  const replies=[];let calls=0;
  const frame={postMessage:(...args)=>replies.push(args)};
  const handler=createPreviewRenewalHandler({origin:'https://pkhockeyacademy.de',frames:()=>[frame],createSecret:async()=>{calls++;return 'private-capability';}});
  const event={origin:'https://pkhockeyacademy.de',source:frame,data:{type:'pk-preview-renew',nonce:'a'.repeat(64)}};
  await handler({...event,origin:'https://evil.example'});
  await handler({...event,source:{postMessage(){throw Error('Foreign frame');}}});
  await handler({...event,data:{...event.data,nonce:'invalid'}});
  assert.equal(calls,0);
  await Promise.all([handler(event),handler(event)]);await handler(event);
  assert.equal(calls,1);assert.deepEqual(replies,[[{type:'pk-preview-renew-result',nonce:event.data.nonce,secret:'private-capability'},event.origin]]);
});

test('renewal does not disclose credentials to a removed frame and hides permission errors',async()=>{
  let frames=[];const replies=[];const frame={postMessage:(message)=>replies.push(message)};frames=[frame];
  const event={origin:'https://pkhockeyacademy.de',source:frame,data:{type:'pk-preview-renew',nonce:'b'.repeat(64)}};
  await createPreviewRenewalHandler({origin:event.origin,frames:()=>frames,createSecret:async()=>{frames=[];return 'private';}})(event);
  assert.equal(replies.length,0);frames=[frame];
  await createPreviewRenewalHandler({origin:event.origin,frames:()=>frames,createSecret:async()=>{throw Error('Sensitive internal message');}})(event);
  assert.deepEqual(replies,[{type:'pk-preview-renew-result',nonce:event.data.nonce,failed:true}]);
});
