// Offline review tooling only. Never imported by the website or a PHP endpoint.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,stat,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve,relative,sep} from 'node:path';
import {registration as paper} from '../src/data/registration.ts';

const root=new URL('../../',import.meta.url);
const review=JSON.parse(await readFile(new URL('docs/registration-policy-review.json',root),'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const launchPolicy=(await readFile(new URL('docs/REGISTRATION-LAUNCH-POLICY.md',root),'utf8')).replaceAll('\r\n','\n');
const textPolicy=JSON.parse(await readFile(new URL('hosting/strato/registration/policy.v1.json',root),'utf8'));
assert.equal(textPolicy.status,'implementation-draft');assert.equal(textPolicy.publicIntakeEnabled,false);
assert.equal(textPolicy.sourcePdfSha256,paper.sha256);
assert.equal(textPolicy.booking.spielerPlusIntegration,false);assert.equal(textPolicy.booking.paymentsEnabled,false);
assert.equal(new Set(textPolicy.fields.map(field=>field.name)).size,textPolicy.fields.length);
assert.deepEqual(textPolicy.consents.map(consent=>consent.purpose),['health','website','print','analysis']);
for(const consent of textPolicy.consents){assert.equal(consent.required,false);assert.equal(consent.default,false);assert.ok(consent.text.trim().length>80);}
assert.equal(textPolicy.fields.find(field=>field.name==='healthNotes').requiresConsent,'health');
const digest=sha(JSON.stringify({review,paper,launchPolicy,textPolicy}));
const document=new URL('docs/REGISTRATION-POLICY-REVIEW.md',root);
const privateDirectory=new URL('output/registration-private/',root);
const privateName=`policy-answers.${digest.slice(0,12)}.local.json`;
const privateFile=new URL(privateName,privateDirectory);
const args=process.argv.slice(2);
const allowed=new Set(['--write','--check','--init-private','--status']);
for(let i=0;i<args.length;i++){
  assert.ok(allowed.has(args[i]),'Unknown review option');
  if(args[i]==='--status'){assert.ok(args[i+1],'Supply the ignored private worksheet path');i++;}
}
assert.equal(review.schemaVersion,1);
assert.equal(review.status,'unapproved','This is a review packet, not an approved runtime policy');
assert.match(review.reviewVersion,/^registration-v2-review-\d{4}-\d{2}-\d{2}$/);
const pdf=await readFile(new URL('web/public'+paper.downloadUrl,root));
assert.equal(pdf.length,paper.sizeBytes,'Original PDF size changed');
assert.equal(sha(pdf),paper.sha256,'Original PDF changed');
assert.equal(review.sourceSha256,paper.sha256,'Review refers to a different PDF');
assert.equal(paper.pages,2,'Review pagination requires another visual check');

const expected=[];
const add=(id,sourceRef,section)=>expected.push({id,sourceRef,section,page:section<4?1:2});
paper.child.forEach((field,i)=>add(field.id,`child.${i}.label`,0));
add('child-position','positions',0);add(paper.experience.id,'experience.label',0);
paper.guardians.forEach((field,i)=>add(field.id,`guardians.${i}.label`,1));
add('booking-type','bookingChoices',2);add(paper.health.id,'health.label',3);add('health-confirmation','healthConfirmation',3);
for(const [source,ids,section]of [
  ['insuranceChoices',['insurance-cover','liability-acknowledgement'],4],
  ['mediaChoices',['media-public-yes','media-public-no','media-internal-video'],6],
  ['signatures',['signature-location-date','guardian-1-signature','guardian-2-signature'],7],
]){
  assert.equal(paper[source].length,ids.length,'New paper choices need explicit review coverage');
  ids.forEach((id,i)=>add(id,`${source}.${i}`,section));
}
add('medical-first-aid','medicalChoices',5);
assert.equal(new Set(review.fields.map(field=>field.id)).size,review.fields.length,'Duplicate field decision');
assert.equal(review.fields.length,expected.length,'Paper decision coverage changed');
const mappedPaperIds=new Set([...textPolicy.fields.flatMap(field=>field.paperIds),...textPolicy.consents.flatMap(consent=>consent.paperIds),...textPolicy.omittedPaperIds]);
assert.deepEqual([...mappedPaperIds].sort(),expected.map(item=>item.id).sort(),'Text policy must map or explicitly omit every paper field');
for(const item of expected){
  assert.ok(launchPolicy.includes('`'+item.id+'`'),'Launch policy must map each paper field/choice');
  const field=review.fields.find(field=>field.id===item.id);
  assert.ok(field,'Missing paper field decision');
  for(const key of ['sourceRef','section','page'])assert.equal(field[key],item[key],'Paper reference drift');
  assert.ok(typeof field.question==='string'&&field.question.trim(),'Missing field review question');
}
assert.equal(new Set(review.decisions.map(item=>item.id)).size,review.decisions.length,'Duplicate process decision');
for(const decision of review.decisions)assert.ok(decision.title&&decision.questions.length,'Incomplete process decision');
const sourceText=path=>{
  let value=paper;
  for(const part of path.split('.')){assert.ok(Object.hasOwn(value,part),'Invalid source reference');value=value[part];}
  assert.ok(typeof value==='string'||(Array.isArray(value)&&value.every(item=>typeof item==='string')),'Unexpected source field');
  return Array.isArray(value)?value.join(' / '):value;
};
const cell=value=>String(value).replaceAll('|','\\|').replace(/[\r\n]+/g,' ');
const rows=review.fields.map(field=>`| \`${field.id}\` | ${field.page} / ${field.section+1} | ${cell(sourceText(field.sourceRef))} | ${cell(field.question)} |`).join('\n');
const decisions=review.decisions.map(item=>`## ${item.title}\n\nQuellenreview: \`${item.id}\`. Aktuelle Produktentscheidungen stehen im [einfachen Startmodell](REGISTRATION-LAUNCH-POLICY.md); die folgenden Punkte dienen dem Abgleich, nicht einer erneuten Abfrage bereits festgelegter Regeln.\n\n${item.questions.map(text=>'- '+text).join('\n')}`).join('\n\n');
const markdown=`# Anmeldung v2: Freigabeunterlage für Pierre

**Quellenreview der Papiervorlage, keine Aktivierungsfreigabe und keine fertigen Rechtstexte.** Die Produktentscheidungen vom 10. November stehen im [einfachen Startmodell](REGISTRATION-LAUNCH-POLICY.md); Aufbewahrung und Zugriff sind in den [Betriebsregeln](DATENSCHUTZ-BETRIEBSREGELN.md) festgelegt. Diese Quellfragen öffnen bereits getroffene Entscheidungen nicht erneut. Onlineeingabe und Versand bleiben deaktiviert. Keine privaten Antworten oder ausgefüllten Anmeldungen hier eintragen.

Review-Version: \`${review.reviewVersion}\`

Konkrete Textfassung: [\`${textPolicy.version}\`](REGISTRATION-TEXT-V1.md), Umsetzungsvorlage mit noch ausstehender finaler Textfreigabe.

Review-Prüfsumme: \`${digest}\`

Quelle: [unveränderte Anmeldung v2](../web/public${paper.downloadUrl}), ${paper.pages} Seiten, ${paper.sizeBytes} Bytes.

PDF-SHA-256: \`${paper.sha256}\`

## Was bereits feststeht

- Astro/Sanity bleiben erhalten. Anmeldungen sind für PHP und eine private STRATO-Datenbank vorgesehen; keine Google-Tabelle und keine Ablage in Sanity.
- Angebot bis U13, 60 Minuten On-Ice plus 60 Minuten Off-Ice. Bekannte Preise: 50 € für eine Einheit, 200 € für fünf Einheiten. Daraus folgen keine weiteren Paket- oder Zahlungsregeln.
- SpielerPlus ist ein vollständig eigenständiger Vorgang außerhalb der Website. Keine Integration, automatische Einladung, Datenübertragung oder SpielerPlus-Abnahme als Launch-Voraussetzung vorsehen.
- Das Original-PDF liegt bereits vor und wird nicht erneut angefordert oder verändert. Es enthält selbst einen Hinweis auf die rechtliche Prüfung.
- Die Formularvorlage legt keinen Pflichtstatus fest. Zwei Kontakt-/Unterschriftsbereiche bedeuten nicht automatisch zwei online verpflichtende Personen.

## Feld-, Zweck- und Pflichtmatrix

Die Zuordnung aller 28 Papierfelder/-auswahlen mit Zweck, Pflichtstatus und Format ist im Startmodell festgelegt. Die folgende Tabelle bewahrt die Quellfragen zur Nachvollziehbarkeit; sie ist keine offene 28-Punkte-Aufgabenliste für Pierre. Zusätzliche private Abweichungen werden nur bei tatsächlichem Bedarf dokumentiert.

| ID | PDF-Seite / Abschnitt | Feld bzw. Auswahl der Papiervorlage | Prüffrage |
| --- | --- | --- | --- |
${rows}

## Medienauswahl: festgelegtes Startmodell

| Papierauswahl | Online-Abbildung |
| --- | --- |
| Öffentliches Ja und Nein zugleich | Kein widersprüchliches Kästchenpaar übernehmen; getrennte optionale Zwecke verwenden. |
| Öffentliches Nein plus interne Videoanalyse | Unabhängige Auswahl; interne Analyse erlaubt keine Veröffentlichung. |
| Öffentliches Ja ohne interne Auswahl | Keine interne Analyse aus einer Veröffentlichungsfreigabe ableiten. |
| Keine Medienauswahl | Keine Erlaubnis für den jeweiligen Zweck; keine Vorauswahl. |

${decisions}

## Aufbewahrung und Rollen: bereits festgelegt

Die Datenschutz-Betriebsregeln definieren die gewählten Fristen, Auslöser, Zugriffe und Verantwortlichkeiten. Diese nicht erneut als unbeantwortete Fragen behandeln; Implementierung und tatsächliche Lösch-/Zugriffskontrollen bleiben nachzuweisen. Keine gesetzliche Pflicht zur pauschalen Archivierung aller Anmeldedaten daraus ableiten.

Die rechtliche Prüfung muss zu den tatsächlichen Zwecken und Abläufen passen. Die Prüffragen betreffen insbesondere Datenumfang, Rechtsgrundlage, Einwilligungen, besondere Datenkategorien, Information und Löschung; die Einzelfallentscheidung ist offen. Referenz: [DSGVO, insbesondere Artikel 5, 6, 7, 9, 13 und 17](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32016R0679).

## Vorschlag für eine spätere technische Eingangsbestätigung

Für das Startmodell gewählt, noch nicht im Formular oder einem Versanddienst verwendet:

> Deine Trainingsanfrage wurde entgegengenommen. Die Academy prüft die Anfrage. Ein Trainingsplatz ist damit noch nicht bestätigt.

Diese Meldung darf erst nach nachgewiesener dauerhafter Speicherung verwendet werden. Sie ersetzt keine Platzprüfung oder Buchungsbestätigung. Pierre bestätigt die Buchung persönlich; weitere Bedingungen werden nicht erfunden. Die jetzige API nimmt keine Angaben an und gibt weiterhin HTTP 503 zurück.

## Private Antworten und verbindliche Freigabe

Pierre kann die Fragen in normalem Deutsch beantworten; die Arbeitsdatei dient der privaten Dokumentation durch die Entwicklung. Im Verzeichnis \`web/\` wird sie mit \`npm run review:registration -- --init-private\` unter \`output/registration-private/${privateName}\` im Projektstamm erzeugt. Dieser Pfad ist Git-ignoriert. Der Dateiname bindet sie an den Review-Stand. Vorhandene Antworten werden weder überschrieben noch automatisch in neue Versionen übernommen.

Das Arbeitsblatt ist nur für zusätzliche private Nachweise oder Abweichungen vorgesehen; ein leeres altes Blatt bedeutet nicht, dass die im Startmodell bereits gewählten Produktregeln offen sind. Je Feld: \`collection\` ist \`include\`, \`omit\` oder \`separate_approved_channel\`; \`purpose\` beschreibt den Zweck bzw. das Weglassen. Bei \`include\` werden \`requiredness\` als \`required\` oder \`optional\` und das genaue \`format\` eingetragen; sonst \`not_applicable\`. Eine vollständig ausgefüllte Datei ist keine eigenständige Aktivierungs- oder Rechtsfreigabe.

Keine realen Anmeldungen, Gesundheitsangaben, Passwörter oder Einladungslinks in die Arbeitskopie schreiben; sensible Freigabeunterlagen nur über private Verweise referenzieren.

\`npm run review:registration -- --status ../output/registration-private/${privateName}\` zeigt nur Vollständigkeitszahlen, keine Antworten. Die Prüfung bestätigt weder Pierres Identität/Freigabe noch rechtliche Angemessenheit und kann die Registrierung nicht aktivieren. Geänderte Fragen, Quellformulierungen oder PDF-Versionen machen die Versionsbindung der Arbeitskopie ungültig.

Die Nutzerentscheidung vom 10. November legt das einfache Produktmodell fest. #13 bis #15 setzen dessen Datenverarbeitung und Bedienung um; vor echten Daten bleiben technische Abnahme, konkrete Textstände und erforderlicher rechtlicher/Provider-Abgleich nachzuweisen. Die Papiervorlage gilt dadurch nicht als rechtlich geprüft. SpielerPlus ist keine Freigabeabhängigkeit. Hosting, ein ausgefülltes Arbeitsblatt oder ein erfolgreicher HTTP-Request aktivieren keine Registrierung.
`;
if(args.includes('--write'))await writeFile(document,markdown);
assert.equal((await readFile(document,'utf8')).replaceAll('\r\n','\n'),markdown,'Review document is stale; regenerate with --write');

const under=(file,directory)=>{
  const normalize=value=>process.platform==='win32'?value.toLowerCase():value;
  return normalize(file).startsWith(normalize(directory.endsWith(sep)?directory:directory+sep));
};
async function ignoredPrivatePath(path){
  await mkdir(privateDirectory,{recursive:true});
  const base=await realpath(fileURLToPath(privateDirectory));
  assert.ok(under(base,await realpath(fileURLToPath(new URL('output/',root)))),'Private worksheet directory escaped output');
  const candidate=resolve(path);
  assert.ok(under(candidate,base),'Use the ignored registration-private directory');
  execFileSync('git',['check-ignore','-q','--',relative(fileURLToPath(root),candidate)],{cwd:fileURLToPath(root),stdio:'ignore'});
  return candidate;
}
if(args.includes('--init-private')){
  const target=await ignoredPrivatePath(fileURLToPath(privateFile));
  const worksheet={schemaVersion:1,reviewVersion:review.reviewVersion,reviewDigest:digest,sourceSha256:paper.sha256,
    notice:'Nur private Prozessentscheidungen. Kein Aktivierungsschalter, keine echten Anmeldungen oder Gesundheitsdaten.',
    fields:Object.fromEntries(review.fields.map(field=>[field.id,{collection:null,purpose:null,requiredness:null,format:null}])),
    decisions:Object.fromEntries(review.decisions.map(item=>[item.id,{resolution:null,approvalReference:null}])),
    approvalReferences:{business:null,privacyLegalReview:null,recordedAt:null}};
  try{await writeFile(target,JSON.stringify(worksheet,null,2)+'\n',{flag:'wx',mode:0o600});console.log('Created ignored blank review worksheet; no policy is approved.');}
  catch(error){if(error.code!=='EEXIST')throw error;console.log('Existing private worksheet preserved.');}
}
if(args.includes('--status')){
  try {
  const target=await ignoredPrivatePath(args[args.indexOf('--status')+1]);
  assert.ok(under(await realpath(target),await realpath(fileURLToPath(privateDirectory))),'Private worksheet symlink escaped its directory');
  assert.ok((await stat(target)).size<=256*1024,'Private worksheet exceeds review size limit');
  const answers=JSON.parse(await readFile(target,'utf8'));
  assert.ok(answers.schemaVersion===1&&answers.reviewVersion===review.reviewVersion&&answers.reviewDigest===digest&&answers.sourceSha256===paper.sha256,'Review/source version changed; renewed review required');
  assert.ok(JSON.stringify(Object.keys(answers.fields||{}).sort())===JSON.stringify(review.fields.map(field=>field.id).sort()),'Worksheet field coverage changed');
  assert.ok(JSON.stringify(Object.keys(answers.decisions||{}).sort())===JSON.stringify(review.decisions.map(item=>item.id).sort()),'Worksheet process coverage changed');
  assert.ok(JSON.stringify(Object.keys(answers.approvalReferences||{}).sort())===JSON.stringify(['business','privacyLegalReview','recordedAt'].sort()),'Worksheet approval-reference coverage changed');
  const text=value=>typeof value==='string'&&value.trim().length>0;
  const complete=Object.values(answers.fields).filter(field=>text(field.purpose)&&(
    field.collection==='include'&&['required','optional'].includes(field.requiredness)&&text(field.format)
    || ['omit','separate_approved_channel'].includes(field.collection)&&field.requiredness==='not_applicable')).length;
  const processes=Object.values(answers.decisions).filter(item=>text(item.resolution)&&text(item.approvalReference)).length;
  console.log(JSON.stringify({fieldDecisionsComplete:complete,fieldDecisionsPending:review.fields.length-complete,processDecisionsComplete:processes,processDecisionsPending:review.decisions.length-processes,approvalReferencesPresent:Object.values(answers.approvalReferences||{}).filter(text).length,humanApprovalVerified:false,activatesRegistration:false}));
  }catch{
    // Private syntax errors or unknown keys can themselves contain personal text.
    console.error('Private worksheet could not be checked. Inspect its schema and source/review version locally; no answers were printed.');
    process.exitCode=1;
  }
}
if(!process.exitCode)console.log(JSON.stringify({reviewChecked:true,pdfUnchanged:true,fieldDecisions:review.fields.length,processDecisions:review.decisions.length,status:'unapproved'}));
