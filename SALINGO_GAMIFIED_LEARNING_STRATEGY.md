# SALingo — Gamified Learning Strategy

**LEARN → PRACTICE → PLAY → MAKE MISTAKES → LEARN FROM MISTAKES → LEVEL UP**

Análisis y plan. No se implementó nada. Ningún archivo de producto fue modificado.

---

## 0. La tesis en una frase

SALingo ya tiene, sin saberlo, la mitad del motor de un juego de aprendizaje — un motor de ejercicios reutilizable, una economía de XP real, un motor de logros reactivo, spaced repetition, detección de errores recurrentes, y un "Skill Engine" embrionario (`CareerCoachService`) que ya calcula fortalezas/debilidades sobre datos reales. Lo que falta no es reconstruir nada de eso — es **envolverlo en capas de juego** (misiones, minijuegos, exámenes, bosses) que ya usan esa misma tubería de datos, y **rediseñar el Home** para que deje de parecer un LMS.

La pregunta guía en cada sección: *¿esto hace que aprender inglés sea más activo, práctico, memorable y divertido?*

---

## 1. Qué partes actuales SIRVEN (reutilizar, no tocar)

| Pieza actual | Por qué ya es parte del motor de juego |
|---|---|
| `ExercisePlayerComponent` + 7 tipos de ejercicio (`multiple-choice`, `translation`, `fill-blank`, `word-order`, `true-false`, `listening-exercise`, `speaking-exercise`) | Es literalmente el motor de "haz, no leas" — ya orquesta cualquier secuencia de ejercicios con scoring y XP. Lessons, Speaking, Listening, Scenarios y Placement Test **ya lo comparten**. Cualquier minijuego nuevo debería producir el mismo `ExerciseResult[]` y conectarse aquí, no crear un player paralelo. |
| `XP_RULES` (`core/constants/xp.constant.ts`) + `UserStateService.recordActivity()` | Economía de XP centralizada y ya conectada a streak/nivel/logros. Es el único punto de entrada de XP en toda la app — cualquier juego/examen/misión nueva llama a esto, nunca inventa su propio contador. |
| `AchievementService` (21 logros, motor reactivo sobre `AchievementContext`) | Ya evalúa contexto en vivo y desbloquea sin intervención manual. Es el motor de logros — solo necesita más *contexto* (ver §9), no una reescritura. |
| `SpacedRepetitionService` (SM-2 simplificado, probado) | Ya es adaptativo en el sentido estricto: ajusta cuándo vuelve a aparecer una palabra según si fallaste. Es el prototipo de cómo debería comportarse cualquier sub-skill débil. |
| `MistakeDetectionService` + `MistakeMemoryService` | Ya es "detectar errores recurrentes" — la pieza exacta que el spec pide para el Skill Engine. Ya alimenta Writing, Mock Interview, Roleplay y AI Tutor. |
| `CareerCoachService` (`jobReadyScore`, `weaknesses`, `recommendedActivities`) | Es el Skill Engine en miniatura: agrega señales reales de varios módulos, nunca fabrica un número, y ya produce debilidades rankeadas + recomendaciones. Hay que **generalizarlo**, no reemplazarlo (ver §6). |
| `CallFlowScoringService` | Ya es un motor de "performance contra un checklist" — la base técnica exacta de un Boss Challenge de Customer Service. |
| `AiRoleplayService` (reactividad por escenario, recién construida) | Ya es la base de "Customer Mission" — un escenario con objetivo, dificultad y resolución esperada, evaluado en vivo. |
| `CareerPathService` / Career Tracks | Ya es un mapa de progreción con etapas y % real — el esqueleto visual de un "mapa de niveles" tipo juego. |
| `PreparationPlanComponent` (7 días / intermedio / 24h) | Ya es una secuencia de misiones con estado de completado — el patrón a copiar para Missions genéricas. |
| `AdvancedAnalyticsService` (reporte semanal) | Ya es "ver tu evolución" — falta conectarlo a sub-skills específicos, no reconstruirlo. |

**Conclusión de §1:** SALingo no necesita un motor de juego nuevo. Necesita que el motor que ya tiene deje de estar escondido detrás de una UI de curso tradicional.

---

## 2. Qué partes deben MODIFICARSE

1. **`UserStateService.recordActivity()` / `ActivityLogEntry`** — hoy solo registra `type` (`lesson`/`review`/`grammar`/`listening`/`speaking`/`writing`/`placement-test`/`interview`) y `accuracy`. Para que el Skill Engine detecte *"Past Simple weakness"* y no solo *"Grammar weakness"*, cada entrada necesita un campo opcional `skillTag` (ej. `"grammar:past-simple"`, `"vocab:customer-service"`). Es un campo nuevo, no una migración destructiva — todo lo que ya escribe activity log sigue funcionando sin ese campo.
2. **`CareerCoachService.skillMastery` (vía `UserStateService`)** — hoy calcula mastery por las 6 categorías amplias (Vocabulary/Grammar/Listening/Speaking/Reading/Writing). Necesita un segundo nivel: mastery por `skillTag` dentro de cada categoría. Es una extensión del mismo computed, no un servicio nuevo.
3. **Dashboard** — reordenar y reencuadrar (§10), no reescribir. Los datos ya existen casi todos (`streak()`, `xp()`, `weaknesses()`, `recommendedActivities()`); falta el marco de "misión de hoy" y el minijuego/desafío diario.
4. **`RecommendationService` / `CareerCoachService.recommendedActivities`** — hoy solo recomienda entre un puñado de rutas fijas (lección siguiente, review, skill más débil, entrevista). Debe poder recomendar **cualquier tipo de actividad** (minijuego, examen corto, misión) filtrando por `skillTag` más débil, no solo por categoría amplia.
5. **`AchievementContext`** — necesita señales de comportamiento útil, no solo volumen (ver §9): "mejoraste una debilidad real", no solo "hiciste 10 lecciones".

## 3. Qué partes FALTAN

- **Minijuegos** con mecánica propia (§4).
- **Sistema de Exámenes** distinto de una lección — multi-skill, con reporte estructurado (§5).
- **Misiones** — contenedor narrativo que encadena ejercicio → minijuego → examen corto → speaking → evaluación, con objetivo/dificultad/XP/desbloqueo declarados (§8).
- **Daily Challenge** — una actividad diaria elegida por el Skill Engine según la debilidad más reciente.
- **Boss Challenges** — evaluación multi-skill al final de una unidad/nivel/track.
- **Skill Engine formalizado** como servicio propio (evolución de `CareerCoachService`, ver §6).
- **Vista de evolución por sub-skill** ("Past Simple: 61% → 74% en 2 semanas").

---

## 4. Qué minijuegos construir primero (con propósito educativo explícito)

Regla: cada minijuego nuevo es una **mecánica de UI nueva sobre datos y modelos que YA existen**. Ninguno necesita contenido nuevo para lanzar.

| Prioridad | Juego | Mecánica | Contenido que ya existe | Skill / skillTag |
|---|---|---|---|---|
| **P0** | **Grammar Battle** | MCQ contra reloj, rachas de aciertos multiplican XP | 45 temas de `mock-grammar.data.ts`, ya con ejercicios | `grammar:<topic>` |
| **P0** | **Vocabulary Rush** | Empareja palabra↔traducción antes de que se acabe el tiempo | 52 palabras + 55 de call center ya en Supabase | `vocab:<category>` |
| **P0** | **Find the Mistake** | Se muestra una oración; el usuario toca la parte incorrecta | Las ~20 reglas de `MistakeDetectionService` son literalmente el banco de oraciones incorrectas — genera el juego automáticamente, cero contenido nuevo | `grammar:<mistake-category>` |
| **P1** | **Sentence Builder** | Ya existe como ejercicio `word-order` — solo falta un "modo juego" (temporizador + combo) sobre el mismo componente | Ejercicios `word-order` existentes | `grammar:sentence-structure` |
| **P1** | **Memory Cards** | Voltear pares palabra/imagen-emoji o palabra/traducción | Vocabulario existente | `vocab:<category>` |
| **P1** | **Listen & Type** | Se reproduce audio (TTS ya integrado en Pronunciation Coach), el usuario escribe lo que oyó | Reutiliza `TextToSpeechService` + oraciones de `mock-listening.data.ts` | `listening:<level>` |
| **P2** | **Word Builder** | Arma una palabra letra por letra contra el reloj | Vocabulario existente | `vocab:spelling` |
| **P2** | **Conversation Challenge** | Versión "juego" del roleplay: turnos cronometrados, puntos por velocidad + precisión | Reutiliza `AiRoleplayService` ya reactivo | `speaking:fluency`, `customer-service:<category>` |

**No construir todavía** (marcados abajo en §11 como P2/no-ahora): Pronunciation Challenge dedicado (Pronunciation Coach ya cubre esto), Timed Speaking como juego separado (Real Interview Mode del Mock Interview ya es esto).

---

## 5. Qué exámenes construir primero

Un examen se diferencia de una lección en tres cosas: (1) es multi-tema dentro de una skill, (2) es cronometrado o de intento único, (3) su salida es un **reporte de skill**, no solo un score.

| Prioridad | Examen | Por qué primero |
|---|---|---|
| **P0** | **Grammar Exam** | 45 temas ya dan volumen de sobra; el reporte de salida (fortalezas/debilidades por tema) es el primer caso de uso real del Skill Engine granular. |
| **P0** | **Vocabulary Exam** | Mismo argumento — contenido ya existe, cero fricción. |
| **P0** | **Final Job Readiness Exam** | No es contenido nuevo — es una **vista agregada** del Job Ready Score existente presentada como examen formal con certificado/resultado, cerrando el círculo "Get Interview Ready". |
| **P1** | **Listening Exam** | Requiere solo más volumen de audio (ya hay 20 ejercicios). |
| **P1** | **Speaking Exam** | Reutiliza `SpeechRecognitionService`/`Pronunciation Coach`, formaliza el modo cronometrado que Mock Interview's "Real Interview Mode" ya prototipa. |
| **P1** | **Customer Service Exam** | Reutiliza escenarios de Roleplay + `CallFlowScoringService` en modo examen (sin pistas, cronometrado). |
| **P2** | **Interview Exam** | Es esencialmente Mock Interview en "Real Interview Mode" — ya existe, solo falta reencuadrarlo como examen formal con certificado. |
| **P0 (ya construido)** | **Placement Exam** | Ya existe (`placement-test`) — solo falta enlazarlo al Skill Engine granular en vez de solo devolver un nivel CEFR. |

**Regla de diseño para todos los exámenes:** el resultado nunca es solo `"80%"`. Cada examen debe devolver una estructura como:

```text
ExamResult {
  overallScore: number
  bySkillTag: { tag: string; score: number; correct: number; total: number }[]
  recurringMistakes: MistakeCategory[]   // reutiliza MistakeDetectionService
  strengths: string[]                    // tags con score alto
  weaknesses: string[]                   // tags con score bajo
  recommendedNext: RecommendedActivity[] // del Skill Engine, no hardcodeado
}
```

Esto no es un modelo nuevo desde cero — es una extensión de `InterviewEvaluation` (ya existe en `career-coach.model.ts`, preparado exactamente para esto pero sin usar aún) generalizada a cualquier examen, no solo entrevistas.

---

## 6. Cómo debería funcionar el Skill Engine

**No es un servicio nuevo desde cero — es la evolución declarada de `CareerCoachService` más un nivel de granularidad.**

```text
Cualquier actividad (ejercicio, juego, examen, roleplay, speaking)
      ↓
  emite un SkillSignal:
  { skill: CoreSkill, skillTag?: string, correct: boolean,
    difficulty: 'easy'|'medium'|'hard', source: string, timestamp }
      ↓
  UserStateService.recordActivity() ya es el único punto de entrada —
  se extiende con un campo opcional `skillTag`, no se duplica
      ↓
  SkillEngineService (nuevo nombre para la evolución de CareerCoachService)
  agrega, por (skill, skillTag):
    - mastery reciente (ventana de tiempo, más peso a lo reciente)
    - tendencia (mejorando / estable / empeorando)
    - último error visto (via MistakeMemoryService)
      ↓
  Weakness Detection (ya existe como `weaknesses()`, se generaliza a skillTag)
      ↓
  Recommendation Engine (ya existe como `recommendedActivities()`, se generaliza
  para poder recomendar CUALQUIER tipo de actividad: juego, examen, misión — no
  solo lección/review/entrevista)
      ↓
  Next Best Activity — lo que se muestra en el Home como "🎤 Recommended practice"
```

Las 8 skills que el motor debe conocer (ya definidas parcialmente):

| Skill | Estado hoy |
|---|---|
| Vocabulary | ✅ ya trackeado (`Skill.Vocabulary`) |
| Grammar | ✅ ya trackeado, ✅ ya en Job Ready Score |
| Listening | ✅ ya trackeado |
| Speaking | ✅ ya trackeado |
| Fluency | ❌ no existe como dimensión propia — hoy se aproxima dentro de "Confidence". Necesita su propia señal (velocidad de habla ya la mide `PronunciationResult.wordsPerMinute`, listo para usarse) |
| Customer Service | ✅ ya existe (`customerServiceScore`) |
| Interview | ✅ ya existe (`interviewScore`) |
| Confidence | ✅ ya existe (aproximado, documentado como tal) |

El ejemplo del spec — *"el usuario falla 4 preguntas de Past Simple → Past Simple weakness +1 → aparece actividad → minijuego → examen corto → speaking → reevalúa → si mejora, weakness baja"* — es exactamente el ciclo que `SpacedRepetitionService` ya implementa para vocabulario individual. El Skill Engine es ese mismo ciclo, un nivel más arriba (por tema, no por palabra).

---

## 7. Cómo debería funcionar el Adaptive Learning

Ya existen dos prototipos reales de adaptividad en el código, ambos rule-based y sin IA:

- `AiInterviewService.pickNextQuestion()` — rama la siguiente pregunta según keywords detectadas en la respuesta anterior.
- `SpacedRepetitionService` — decide cuándo vuelve a aparecer cada palabra según si se falló.

El Adaptive Learning generalizado es la fusión de ambos patrones aplicada a **cualquier pool de contenido**: dado un `skillTag` débil, filtrar el pool de ejercicios/preguntas/juegos disponibles por ese tag y priorizarlos, igual que `pickNextQuestion` prioriza por tema detectado. No requiere IA real — es indexar el contenido existente por `skillTag` (trabajo de datos, no de arquitectura) y añadir un método `pickBySkillTag(pool, weakestTag)` al Skill Engine.

---

## 8. Cómo conectar juegos + exámenes + speaking + entrevistas

Todos pasan por el mismo embudo — no se crean tuberías paralelas:

```text
Juego / Examen / Speaking / Roleplay / Mock Interview
      ↓ (todos ya llaman o deberían llamar a esto)
UserStateService.recordActivity({ type, skillTag, xp, accuracy })
      ↓
Activity Log (ya existe, ya alimenta streak/XP/nivel)
      ↓
SkillEngineService lee el mismo Activity Log (no una copia)
      ↓
Weakness Detection → Recommendation Engine → Next Best Activity
      ↓
Se muestra en Home, en Missions, en Daily Challenge
```

La única disciplina nueva: **todo componente de juego/examen nuevo debe terminar llamando a `recordActivity` con un `skillTag`**, igual que ya lo hacen Writing, Roleplay y Scenarios. Ese es el contrato completo — no hay integración adicional que construir.

---

## 9. Cómo debería funcionar XP / Levels / Achievements (con propósito, no superficial)

- **XP ya está centralizado** (`XP_RULES`) — no tocar la mecánica, sí las reglas de *cuándo* se otorga: hoy XP es principalmente por completar/acertar. Para cumplir "XP conectado con aprendizaje", agregar un bonus (no un sistema nuevo) cuando una actividad **mejora una debilidad real** — ej. `XP_RULES.weaknessImprovedBonus` cuando el mastery de un `skillTag` que estaba por debajo de 60% sube tras la actividad. Esto convierte el XP en una señal de progreso real, no solo de volumen.
- **Achievements ya son reactivos sobre contexto real** — extender `AchievementContext` con señales de comportamiento útil: *"mejoraste una debilidad 20 puntos"*, *"completaste un Boss Challenge"*, *"ganaste una Daily Challenge 7 días seguidos"* — en vez de solo contadores de volumen (*"completa 10 lecciones"*). No reemplaza los logros de volumen existentes, los complementa.
- **Streaks ya existen y ya son reales** (día con actividad) — para que incentiven *práctica real* y no solo abrir la app, la Daily Challenge (nueva) debería ser la actividad que cuenta para el streak con más peso, no cualquier click.
- **Levels** (CEFR + nivel de XP) ya existen en paralelo — no hay que fusionarlos, pero el Home debe mostrar ambos con claridad de qué significa cada uno (hoy XP-level y CEFR-level no siempre se distinguen visualmente).

---

## 10. Cómo debería ser el nuevo Home/Dashboard

No es una reescritura — es una reorganización del mismo `DashboardComponent` (`user-state.service.ts` + `career-coach.service.ts` ya proveen casi todo el dato) alrededor de una sola pregunta: **¿qué hago ahora?**

```text
┌─────────────────────────────────────────┐
│  🎯 Today's mission: [Daily Challenge]   │  ← NUEVO, la pieza más prominente
│     "Practice Past Simple" · 5 min       │
├───────────────┬───────────────┬─────────┤
│ 🔥 Streak      │ ⭐ XP / Level  │ 📈 Job   │  ← ya existen (streak/xp/jobReadyScore)
│    12 days     │    Lv. 4       │  Ready 78│
├───────────────┴───────────────┴─────────┤
│ 🧠 Your weaknesses                       │  ← ya existe (weaknesses())
│    1. Past Simple      61%               │
│    2. Speaking          67%              │
├───────────────────────────────────────────┤
│ 🎮 Recommended for you (mixed)           │  ← se generaliza recommendedActivities()
│    🎮 Grammar Battle: Past Simple  5 min │     para incluir juegos, no solo lecciones
│    🎤 Speak & Repeat                8 min │
│    📞 Next Mission: Handle a Refund      │  ← NUEVO
└─────────────────────────────────────────┘
```

Todo lo marcado "ya existe" son signals que `CareerCoachService`/`UserStateService` ya calculan hoy — el trabajo es de layout y de generalizar `recommendedActivities()`, no de crear cálculos nuevos.

---

## 11. Priorización

**P0 — cambia la sensación del producto de inmediato, cero contenido nuevo necesario:**
1. Skill Engine granular (`skillTag` en activity log + mastery por tag) — desbloquea todo lo demás.
2. Grammar Battle, Vocabulary Rush, Find the Mistake (los 3 juegos de cero-contenido-nuevo).
3. Grammar Exam + Vocabulary Exam (mismo argumento).
4. Rediseño del Home alrededor de "¿qué hago ahora?".
5. Daily Challenge (una actividad, elegida por el Skill Engine).

**P1 — profundiza el sistema:**
6. Missions (contenedor narrativo reutilizando el patrón de Preparation Plan).
7. Sentence Builder / Memory Cards / Listen & Type.
8. Listening Exam, Speaking Exam, Customer Service Exam.
9. Boss Challenges de fin de nivel/track.
10. XP bonus por mejora real de debilidad + Achievements de comportamiento útil.

**P2 — pulido y expansión:**
11. Word Builder, Conversation Challenge.
12. Interview Exam formalizado (certificado).
13. Vista dedicada de evolución por skillTag a lo largo del tiempo.
14. Career Boss por track (Sales Boss, Technical Support Boss, etc.).

**No ahora (evitar distracción, mismo criterio que el Top 20 anterior):** minijuegos de pronunciación separados (ya cubiertos por Pronunciation Coach), elementos sociales/leaderboards, cualquier mecánica que no declare explícitamente qué `skillTag` mejora.

---

## 12. Roadmap recomendado

**Fase 1 — Fundamento del Skill Engine (sin juegos todavía)**
Objetivo: que el sistema *sepa* qué sub-skill se está practicando en cada actividad existente.
- Agregar `skillTag` opcional a `ActivityLogEntry`.
- Etiquetar el contenido existente (temas de grammar, categorías de vocab) con tags.
- Extender `CareerCoachService`/`UserStateService` con mastery por tag.
- Generalizar `recommendedActivities()` para aceptar cualquier tipo de actividad.
- Resultado esperado: la app ya puede decir *"estás fallando Past Simple"*, aunque la UI todavía no cambió.

**Fase 2 — Los 3 juegos y 2 exámenes de cero-contenido-nuevo**
Objetivo: la primera prueba real de "aprender jugando".
- Grammar Battle, Vocabulary Rush, Find the Mistake.
- Grammar Exam, Vocabulary Exam con reporte por skillTag.
- Resultado esperado: usuarios pueden practicar la misma debilidad de 3 formas distintas (lección, juego, examen) sin que el equipo cree contenido nuevo.

**Fase 3 — Home rediseñado + Daily Challenge**
Objetivo: que abrir la app se sienta como abrir un juego, no un curso.
- Dashboard reorganizado (§10).
- Daily Challenge elegida por el Skill Engine.
- Resultado esperado: el usuario sabe en 3 segundos qué hacer hoy.

**Fase 4 — Missions + Boss Challenges**
Objetivo: darle narrativa y progresión a lo que ya existe disperso (Roleplay, Scenarios, Mock Interview).
- Missions como contenedor (reutiliza el patrón de Preparation Plan).
- Boss Challenges de fin de nivel/track (reutiliza `CallFlowScoringService` + `AiInterviewEvaluationService`).
- Resultado esperado: Career Path deja de ser una lista de etapas y se siente como un mapa de niveles.

**Fase 5 — Gamificación con propósito**
Objetivo: que XP/Achievements/Streaks midan progreso real, no volumen.
- XP bonus por mejora de debilidad.
- Achievements de comportamiento útil.
- Vista de evolución por skillTag.
- Resultado esperado: cerrar el ciclo que pide el spec — *"si mejora, la debilidad baja, y el usuario lo ve."*

**Después de esto** (no antes): conectar IA real a los juegos/exámenes/misiones es la Fase 2 del plan de IA ya discutido — esta estrategia de gamificación es independiente de esa decisión y puede avanzar en paralelo.

---

*Fin del análisis. Ningún archivo de producto fue modificado.*
