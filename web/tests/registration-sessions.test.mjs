import test from 'node:test';
import assert from 'node:assert/strict';
import {requestableSessionOptions} from '../src/lib/registration/sessions.ts';
test('registration options use only future open published sessions at active venues, with Berlin labels',()=>{
 const now=Date.parse('2026-11-01T10:00:00Z');
 const venue={id:'active',city:'Essen',status:'active_city'};
 const good={id:'real',title:'Training',group:'U13',venueId:'active',startAt:'2026-11-15T10:00:00Z',endAt:'2026-11-15T12:00:00Z',status:'open',isDemo:false,availableSpots:null};
 const variants=[{isDemo:true},{id:'drafts.hidden'},{id:'versions.hidden'},{status:'full'},{status:'cancelled'},{status:'draft'},{availableSpots:0},{availableSpots:-1},{availableSpots:1.5},{venueId:'planned'},{startAt:'2026-11-15T10:00:00'},{endAt:'2026-11-15T12:00:00'},{startAt:'2026-10-15T10:00:00Z'},{endAt:'2026-11-15T09:00:00Z'}];
 const rows=[{...good,id:'later',startAt:'2026-11-22T10:00:00Z',endAt:'2026-11-22T12:00:00Z'},...variants.map((value,index)=>({...good,id:'invalid-'+index,...value})),good];
 const options=requestableSessionOptions(rows,[venue,{id:'planned',city:'Herne',status:'planned_city'}],now);
 assert.deepEqual(options.map(option=>option.id),['real','later']);
 assert.match(options[0].label,/15\.11\.2026.*11:00.*Essen.*U13/);
 assert.deepEqual(requestableSessionOptions([], [venue], now),[]);
});
