import fs from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const dataDir=path.join(root,'data');
const officialURL='https://exercise-dataset.com/exercises.json';
const additions=JSON.parse(await fs.readFile(path.join(dataDir,'coory_extensions.json'),'utf8')).exercises;
const slug=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const basename=(s)=>slug(s).replace(/-+/g,'-');
const output=[];
const seen=new Set();
let officialCount=0;
if(process.argv.includes('--repdb')) {
 console.log('Récupération depuis la source officielle RepDB…');
 const res=await fetch(officialURL);if(!res.ok)throw new Error(`RepDB HTTP ${res.status}`);
 const payload=await res.json();
 if(!Array.isArray(payload.exercises))throw new Error('Format RepDB incompatible');
 for(const ex of payload.exercises){
  const key=slug(ex.name_en||ex.id);if(seen.has(key))continue;seen.add(key);officialCount++;
  const image=ex.images?.flat||{};
  output.push({id:`repdb-${ex.id}`,slug:ex.id,name_fr:null,name_en:ex.name_en,discipline:ex.category||'strength',equipment:ex.equipment?[ex.equipment]:[],primary_muscles:ex.primary_muscles||[],secondary_muscles:ex.secondary_muscles||[],difficulty:ex.difficulty||null,description_fr:null,instructions_fr:[],tags:ex.tags||[],source:'repdb_free_in_app_attribution_required',review_status:'needs_translation_and_review',image_status:'repdb_original_only',images:{main:image.main?`https://exercise-dataset.com/${image.main}`:null,start:image.start?`https://exercise-dataset.com/${image.start}`:null,end:image.peak?`https://exercise-dataset.com/${image.peak}`:null},repdb_id:ex.id});
 }
}
let duplicates=[];
for(const ex of additions){const key=slug(ex.name_en);if(seen.has(key)){duplicates.push(ex.name_en);continue;}seen.add(key);output.push(ex)}
await fs.mkdir(dataDir,{recursive:true});
const payload={schema_version:'1.0',generated_at:new Date().toISOString(),sources:{repdb:officialCount,coory_original:output.length-officialCount},attribution:officialCount?'Exercise data by RepDB (repdb.co)':'',exercises:output};
await fs.writeFile(path.join(dataDir,'exercises.generated.json'),JSON.stringify(payload,null,2));
const cols=['id','slug','name_fr','name_en','discipline','equipment','primary_muscles','secondary_muscles','difficulty','source','review_status','image_status','image_main','image_start','image_end'];
const csv=v=>`"${String(v??'').replace(/"/g,'""')}"`;
const rows=[cols.join(',')];for(const e of output)rows.push(cols.map(k=>csv(k.startsWith('image_')?e.images?.[k.slice(6)]:Array.isArray(e[k])?e[k].join('|'):e[k])).join(','));
await fs.writeFile(path.join(dataDir,'exercises.generated.csv'),'\ufeff'+rows.join('\n'));
console.log(`Catalogue généré : ${output.length} exercices (${officialCount} RepDB, ${output.length-officialCount} COORY). Doublons exacts ignorés : ${duplicates.length}.`);
