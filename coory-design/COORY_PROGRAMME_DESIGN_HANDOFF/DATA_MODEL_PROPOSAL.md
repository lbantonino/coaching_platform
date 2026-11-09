# Proposition de modèle de données (PROPOSED)

> Ne prétend pas connaître le schéma réel de COORY. Claude Code doit d'abord lire le schéma existant, puis mapper ces entités sur l'existant et ne migrer que le strict nécessaire.

```ts
Program { id, coachId, athleteId | null /* null = modèle */, isTemplate: boolean, templateSource: 'coory' | 'mine' | null,
  sourceTemplateId?: id /* copie de */, title, discipline: 'running'|'strength'|'hyrox'|'hybrid',
  goal?: { raceName, raceDate, category /* 'open_women'… */, note },
  aimDefaults: { running: 'pace'|'hr', strength: 'kg'|'pct' },
  startDate | null, weeksCount, sessionsPerWeek, status: 'draft'|'published'|'archived',
  publishedVersion: number, hasUnpublishedChanges: boolean, createdAt, updatedAt }
Phase { id, programId, name, weekFrom, weekTo, order }
Week { id, programId, index /* 1..N */, startDate | null, isLight: boolean,
  scheduling: 'ordered'|'fixed_days' }
Session { id, weekId, order, discipline, sessionType /* Fractionné, Circuit… */, name, goal, coachTip,
  fixedDay?: 0..6, fixedTime?: 'HH:mm', athleteCanMove: boolean,
  coachAppointmentId?: id /* verrouille le jour */, templateId?: id, estDurationMin, estDistanceKm }
Block /* arbre ordonné */ { id, sessionId, parentId | null, order,
  kind: 'step'|'repeat'|'exercise'|'superset'|'emom'|'circuit'|'amrap'|'for_time'|'intervals'|'simulation'|'warmup_text'|'cooldown_text',
  repeatCount?, rounds?, restBetweenSec?, targetTimeSec?, timeCapSec?, note? }
RunStep (Block.kind='step') { role: 'warmup'|'run'|'recovery'|'rest'|'cooldown', measure: 'time'|'distance'|'open', value,
  aim: 'pace'|'hr', paceFrom?, paceTo? /* s/km */, pctVmaFrom?, hrZone?: 1..5, hrFrom?, hrTo?, aimComputedFrom?: 'vma'|'hrmax'|null }
StrengthExercise (kind='exercise') { exerciseId /* bibliothèque */, loadMode: 'kg'|'pct', rest, tempo, cue,
  sets: [{ n, type: 'warmup'|'normal', reps, kg?, pct?, rir? }] }
HyroxStation (kind='step') { station: 'skierg'|'sled_push'|'sled_pull'|'bbj'|'row'|'farmers'|'sandbag_lunges'|'wall_balls'|'run'|'transition',
  distance?, reps?, loadMode: 'coach'|'official', loadKg?, pace?, targetTimeSec? }
AthleteBenchmarks { athleteId, vmaKmh, hrMax, maxes: { exerciseId: kg }, hyroxCategory, updatedAt }  // déjà existant ? (onglet Repères)
Availability { athleteId, weekday, slot: 'morning'|'noon'|'evening'|'unavailable' }                 // déjà existant ? (onglet Disponibilités)
SessionCompletion { sessionId, athleteId, doneAt, rpe, feeling }
ProgramExport { id, programVersion, kind: 'agenda'|'sheets', fileUrl, generatedAt }
```

Relations : Program 1–N Phase, 1–N Week ; Week 1–N Session ; Session 1–N Block (arbre) ; Program(template) 1–N Program(copies) via sourceTemplateId.
Hybride [P] : une Session `discipline='hybrid'` dont les Blocks de premier niveau portent leur propre discipline.
