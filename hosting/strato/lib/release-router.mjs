import assert from 'node:assert/strict';
import {publicPath} from './artifact.mjs';
export const ROUTER_MARKER='\n# BEGIN STATIC STRATO ROUTING\n';
export const releaseId = value => typeof value==='string' && /^[a-z0-9][a-z0-9-]{7,100}$/.test(value);
export function authLayer(configuration) {
  const layer=configuration.split(ROUTER_MARKER)[0];
  assert.ok(layer.includes('Require valid-user')&&/^AuthUserFile "[^"\r\n]+"$/m.test(layer),'Review authentication is missing');
  assert.ok(!/Require\s+all\s+granted/i.test(layer),'Authentication bypass rejected');
  return layer;
}
export function activeRelease(configuration) {
  const match=configuration.match(/^# PK-RELEASE ([a-z0-9-]+)$/m);
  if(!match)return 'legacy';
  assert.ok(releaseId(match[1]),'Invalid active release');return match[1];
}
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function renderRouter(authentication,id,inventory) {
  assert.ok(releaseId(id),'Invalid release identifier');
  assert.ok(inventory.every(file=>publicPath(file.path)),'Unsafe release inventory');
  const prefix='.pk-releases/'+id+'/';
  const preview=inventory.some(file=>file.path==='api/editor.php');
  const requests=inventory.some(file=>file.path==='api/requests.php');
  const rules=[authLayer(authentication),ROUTER_MARKER.trimEnd(),`# PK-RELEASE ${id}`,
    'Options -Indexes -MultiViews','DirectorySlash Off','DirectoryIndex index.html',
    'ErrorDocument 404 /404.html','RewriteEngine On','RewriteBase /',
    // Client URLs are decoded before matching. END prevents this rule from running
    // again for the internal release path selected below.
    'RewriteRule (^|/)(?:\\.[^/]+|node_modules|src|vendor)(?:/|$) - [F,END]',
    'RewriteRule ^(?:manifest|previous)\\.json$ - [F,END]',
    'RewriteRule ^api/preview-lib(?:/|$) - [F,END]',
    'RewriteRule ^_astro(?:/|$) - [END]',
    ...(requests ? [
      `RewriteRule ^api/registration(?:/token)?/?$ ${prefix}api/requests.php [END]`,
      `RewriteRule ^intern/anmeldungen/?$ ${prefix}api/requests.php [END]`,
    ] : [`RewriteRule ^api/registration/?$ ${prefix}api/registration.php [END]`]),
    ...(preview?[`RewriteRule ^(?:api/preview/enable|redaktion/(?:verbinden|trainerpool|daten|abmelden))/?$ ${prefix}api/editor.php [END]`]:[]),
    `RewriteRule ^(?:api/preview(?:/.*)?|redaktion(?:/.*)?)$ ${prefix}api/preview-unavailable.php [END]`,
    `RewriteRule ^$ ${prefix}index.html [END]`];
  for(const file of inventory)if(file.path.endsWith('/index.html')) {
    const route=file.path.slice(0,-'/index.html'.length);
    rules.push(`RewriteRule ^${escape(route)}/?$ ${prefix}${file.path} [END]`);
  }
  rules.push(`RewriteRule ^(.*)$ ${prefix}$1 [END]`,'');
  return rules.join('\n');
}
