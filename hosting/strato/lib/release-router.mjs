import assert from 'node:assert/strict';
import {publicPath} from './artifact.mjs';
export const ROUTER_MARKER='\n# BEGIN STATIC STRATO ROUTING\n';
const PUBLIC_MARKER='# PK PUBLIC WEBSITE\n';
export const isPublicRouter = configuration => configuration.startsWith(PUBLIC_MARKER);
export const releaseId = value => typeof value==='string' && /^[a-z0-9][a-z0-9-]{7,100}$/.test(value);
export function authLayer(configuration) {
  assert.ok(!isPublicRouter(configuration),'Public routing requires the public release workflow');
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
function publicLayer(configuration) {
  const current=configuration.split(ROUTER_MARKER)[0];
  const protectedLayer=isPublicRouter(current)?current:authLayer(current);
  const credential=protectedLayer.match(/^AuthUserFile "[^"\r\n]+"$/m)?.[0];
  assert.ok(credential,'Private preview credential binding missing');
  // Keep the editor behind the existing Apache login. The staff application
  // authenticates independently, and the PHP intake validates every request.
  return [PUBLIC_MARKER.trimEnd(),'AuthMerging Off','AuthType Basic','AuthName "PK Hockey Academy - Interne Vorschau"',
    'AuthBasicProvider file',credential,'<RequireAny>','  Require valid-user',
    '  Require expr "%{HTTP_HOST} =~ m#^(?:www\\.)?pkhockeyacademy\\.de$#i && %{REQUEST_URI} !~ m#^/(?:redaktion(?:/|$)|api/preview(?:/|$))#i"',
    '</RequireAny>','<FilesMatch "^\\.">','  Require all denied','</FilesMatch>',''].join('\n');
}
export function verifyOperatorLayer(configuration) {
  if(!isPublicRouter(configuration))return authLayer(configuration);
  assert.equal(configuration.split(ROUTER_MARKER)[0].trimEnd(),publicLayer(configuration).trimEnd(),'Unexpected public access rules');
}
export function renderRouter(authentication,id,inventory,{publicLaunch=false}={}) {
  assert.ok(releaseId(id),'Invalid release identifier');
  assert.ok(inventory.every(file=>publicPath(file.path)),'Unsafe release inventory');
  const prefix='.pk-releases/'+id+'/';
  const preview=inventory.some(file=>file.path==='api/editor.php');
  const requests=inventory.some(file=>file.path==='api/requests.php');
  const rules=[publicLaunch?publicLayer(authentication):authLayer(authentication),ROUTER_MARKER.trimEnd(),`# PK-RELEASE ${id}`,
    'Options -Indexes -MultiViews','DirectorySlash Off','DirectoryIndex index.html',
    'ErrorDocument 404 /404.html','RewriteEngine On','RewriteBase /',
    // Client URLs are decoded before matching. END prevents this rule from running
    // again for the internal release path selected below.
    'RewriteRule (^|/)(?:\\.[^/]+|node_modules|src|vendor)(?:/|$) - [F,END]',
    'RewriteRule ^(?:manifest|previous)\\.json$ - [F,END]',
    'RewriteRule ^api/preview-lib(?:/|$) - [F,END]',
    ...(publicLaunch?['RewriteRule ^api/.*\\.php(?:/|$) - [F,END,NC]']:[]),
    'RewriteRule ^_astro(?:/|$) - [END]',
    'RewriteCond %{HTTP_HOST} ^www\\.pkhockeyacademy\\.de$ [NC]',
    'RewriteRule ^ https://pkhockeyacademy.de%{REQUEST_URI} [R=308,END,NE]',
    ...(requests ? [
      `RewriteRule ^api/registration(?:/token)?/?$ ${prefix}api/requests.php [END]`,
      `RewriteRule ^intern/anmeldungen/?$ ${prefix}api/requests.php [END]`,
    ] : [`RewriteRule ^api/registration/?$ ${prefix}api/registration.php [END]`]),
    ...(publicLaunch?[`RewriteRule ^redaktion/(pk-maintenance-[a-f0-9-]{36})$ ${prefix}api/$1.php [END]`]:[]),
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
