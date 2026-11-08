import {createDataAttribute} from '@sanity/visual-editing/create-data-attribute';
import {normalizePreviewTrainers} from './trainer-preview-normalize';
import {trainerImageUrl} from './trainers';
import {getStudioEditBaseUrl} from './admin';
import {installPreviewEditing} from './preview-visual-editing';
import type {Trainer} from '../types/content';

type Config={projectId:string;dataset:string;studioUrl:string};
function fieldPath(element:Element) {
  const pair=element.getAttribute('data-sanity')?.split(';').find(value=>value.startsWith('path='));
  return pair?decodeURIComponent(pair.slice(5)).replace(/:(\d+)/g,'[$1]'):undefined;
}
function attributes(root:ParentNode,path:string){return [...root.querySelectorAll<HTMLElement>('[data-sanity]')].filter(element=>fieldPath(element)===path);}
function image(element:HTMLImageElement,asset:NonNullable<Trainer['portrait']>) {
  element.src=trainerImageUrl(asset,800);
  element.srcset=`${trainerImageUrl(asset,400)} 400w, ${trainerImageUrl(asset,800)} 800w`;
  element.width=asset.width;element.height=asset.height;element.alt=asset.alt;
}
function list(element:Element,values:string[]) {
  element.replaceChildren(...values.map(value=>{const item=document.createElement('li');item.textContent=value;return item;}));
}
export function renderPreviewTrainer(trainer:Trainer,config:Config,published:boolean) {
  const source=document.querySelector<HTMLTemplateElement>(trainer.portrait?'#preview-photo':'#preview-no-photo');
  if(!source)throw Error('Preview template unavailable');
  const fragment=source.content.cloneNode(true) as DocumentFragment;
  const mark=(element:Element,path:string)=>element.setAttribute('data-sanity',createDataAttribute({id:trainer.id,type:'trainer',path,projectId:config.projectId,dataset:config.dataset,baseUrl:getStudioEditBaseUrl(config.studioUrl)}).toString());
  for(const element of fragment.querySelectorAll('[data-sanity]')){const path=fieldPath(element);if(path)mark(element,path);}
  const article=fragment.querySelector('article')!;article.id='trainer-'+trainer.id;
  for(const element of attributes(fragment,'name'))element.textContent=trainer.name.toLocaleUpperCase('de-DE')+'.';
  for(const element of attributes(fragment,'role'))element.textContent=trainer.role+' · PK Hockey Academy';
  const biography=attributes(fragment,'biography');
  const paragraph=biography[0];
  if(paragraph){for(const value of trainer.biography.split(/\n\s*\n/).filter(Boolean)){const node=paragraph.cloneNode(true) as HTMLElement;node.textContent=value;paragraph.before(node);}for(const node of biography)node.remove();}
  for(const path of ['verifiedBackground','qualifications','specialties'] as const)for(const element of attributes(fragment,path)){
    list(element,trainer[path]);
    if(!trainer[path].length){if(element.previousElementSibling?.tagName==='H3')element.previousElementSibling.remove();element.remove();}
  }
  const selected='/redaktion/trainerpool?'+new URLSearchParams({id:trainer.id,...(published?{perspective:'published'}:{})});
  for(const link of fragment.querySelectorAll<HTMLAnchorElement>('a[href^="/trainerpool/"]'))link.href=selected;
  const portrait=fragment.querySelector<HTMLAnchorElement>('.trainer-portrait')!;
  portrait.setAttribute('aria-label',`${trainer.name} – Trainerprofil ansehen`);
  if(trainer.portrait){image(portrait.querySelector('img')!,trainer.portrait);portrait.querySelector('.image-label')!.textContent=trainer.name;}
  const button=fragment.querySelector('.trainer-copy .button span');if(button)button.textContent=trainer.name+' kennenlernen';
  for(const element of attributes(fragment,'portrait.credit')){if(trainer.portrait?.credit)element.textContent='Bildnachweis: '+trainer.portrait.credit;else element.remove();}
  for(const path of ['playingYears','coachingYears','highestDivision'] as const)for(const element of attributes(fragment,path)){
    const value=trainer[path];if(value===undefined||value==='')element.remove();else element.querySelector('dd')!.textContent=String(value);
  }
  for(const element of attributes(fragment,'notableTeams')){if(trainer.notableTeams?.length)list(element.querySelector('ul')!,trainer.notableTeams);else element.remove();}
  if(!fragment.querySelector('.coach-stats > div')&&!trainer.notableTeams?.length)fragment.querySelector('.coach-career')?.remove();
  const track=fragment.querySelector<HTMLElement>('.coach-gallery-track');
  const gallery=trainer.playerGallery||[];
  if(!gallery.length)fragment.querySelector('.coach-gallery')?.remove();
  else if(track){
    const item=track.querySelector('li')!;const template=item.cloneNode(true) as HTMLElement;track.replaceChildren();
    track.setAttribute('aria-label',`Bilder aus der Spielerlaufbahn von ${trainer.name}`);
    fragment.querySelector('.coach-gallery')!.id='laufbahn-'+trainer.id;
    for(const [index,asset] of gallery.entries()){
      const node=template.cloneNode(true) as HTMLElement;image(node.querySelector('img')!,asset);
      mark(node.querySelector('figure')!,`playerGallery[${index}]`);
      node.querySelector('.coach-frame-number')!.textContent=String(index+1).padStart(2,'0');
      for(const [selector,value] of [['figcaption p',asset.caption],['figcaption small',asset.credit?'Bildnachweis: '+asset.credit:undefined]]){
        const element=node.querySelector(selector!);if(element){if(value)element.textContent=value;else element.remove();}
      }
      track.append(node);
    }
  }
  return fragment;
}

export async function loadStratoPreview() {
  const status=document.querySelector<HTMLElement>('#preview-status')!;
  const profiles=document.querySelector<HTMLElement>('#preview-profiles')!;
  const incomplete=document.querySelector<HTMLElement>('#preview-incomplete')!;
  const marker=document.querySelector<HTMLElement>('#pk-visual-editing')!;
  profiles.replaceChildren();incomplete.replaceChildren();
  try {
    const current=new URL(location.href),query=new URLSearchParams();
    for(const key of ['id','perspective'])if(current.searchParams.has(key))query.set(key,current.searchParams.get(key)!);
    const response=await fetch('/redaktion/daten?'+query,{credentials:'same-origin',cache:'no-store',redirect:'error'});
    if(!response.ok)throw Error('Private preview unavailable');
    const data=await response.json();
    const config:Config={projectId:data.projectId,dataset:data.dataset,studioUrl:data.studioUrl};
    const result=normalizePreviewTrainers(data.documents,config);
    const published=data.perspective==='published';
    document.querySelector('#preview-perspective')!.textContent=published?'Veröffentlichter Bearbeitungsstand':'Entwurfsvorschau · nicht veröffentlicht';
    const studio=document.querySelector<HTMLAnchorElement>('#preview-studio')!;studio.href=data.studioUrl;studio.hidden=false;
    const add=document.querySelector<HTMLAnchorElement>('#preview-add')!;add.href=data.studioUrl.replace(/\/$/,'')+'/intent/create/type=trainer/';add.hidden=false;
    const all=document.querySelector<HTMLAnchorElement>('[data-preview-leave]')!;all.href='/redaktion/trainerpool'+(published?'?perspective=published':'');
    for(const trainer of result.trainers)profiles.append(renderPreviewTrainer(trainer,config,published));
    for(const profile of result.incomplete){
      const notice=document.createElement('div');notice.className='notice';
      const title=document.createElement('h2');title.textContent=profile.name;
      title.setAttribute('data-sanity',createDataAttribute({id:profile.id,type:'trainer',path:'name',projectId:config.projectId,dataset:config.dataset,baseUrl:getStudioEditBaseUrl(config.studioUrl)}).toString());
      const text=document.createElement('p');text.textContent='Dieses Profil ist noch unvollständig. Pflichtfelder und gegebenenfalls die Bildbeschreibung im Studio ergänzen. Danach erscheint hier das Website-Layout.';
      const link=document.createElement('a');link.href=data.studioUrl.replace(/\/$/,'')+'/intent/edit/id='+encodeURIComponent(profile.id)+';type=trainer/';link.target='_top';link.textContent='Profil vervollständigen ↗';
      notice.append(title,text,link);incomplete.append(notice);
    }
    status.textContent=result.trainers.length||result.incomplete.length?'':'Noch kein Trainerprofil in dieser Perspektive. Über „Trainer hinzufügen“ ein Profil anlegen oder zur Entwurfsperspektive wechseln.';
    marker.dataset.profileId=current.searchParams.get('id')?.replace(/^drafts\./,'')||'';
    await installPreviewEditing(marker);
    if(typeof data.expiresAt==='number'){
      const expire=()=>{if(Date.now()>=data.expiresAt*1000){profiles.replaceChildren();incomplete.replaceChildren();status.textContent='Die Vorschau-Sitzung ist abgelaufen. Bitte im Studio neu öffnen.';}};
      setTimeout(expire,Math.max(0,data.expiresAt*1000-Date.now()));
      document.addEventListener('visibilitychange',expire);
    }
  }catch{
    profiles.replaceChildren();incomplete.replaceChildren();
    status.textContent='Die private Vorschau ist nicht verfügbar oder die Sitzung ist abgelaufen. Bitte im angemeldeten Studio neu öffnen.';
    status.setAttribute('role','alert');
  }
}
