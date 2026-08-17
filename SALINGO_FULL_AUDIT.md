# SALingo — Full Product & Technical Audit

**Fecha:** análisis del estado del repositorio a hoy. **Ningún archivo de producto fue modificado para producir este documento.** Todas las referencias de archivo/línea corresponden al código real leído durante la auditoría, no a nombres de pantalla.

---

## 0. Resumen ejecutivo

SALingo es un prototipo con una base técnica notablemente sólida — persistencia real en Supabase con RLS 1:1, arquitectura Angular 21 limpia (standalone, signals, `OnPush` en todo), 33 tests unitarios, lint en cero, y una superficie de producto que cubre casi todo lo que pide el spec original (aprendizaje de inglés completo + módulo de entrevistas/call center con 12+ subpáginas + gamificación + analítica).

El problema no es cobertura, es profundidad en el punto exacto que sostiene la propuesta de valor. **Cero llamadas a un LLM real existen en todo el repositorio.** Los 8 servicios `Ai*Service` son heurísticas o texto con plantillas, documentados honestamente como tales en el propio código. Eso sería aceptable como fase intermedia si la simulación fuera *convincente* — pero no lo es en el módulo que más importa: el simulador de llamadas responde con las mismas 3 frases fijas sin importar el escenario, la persona del cliente, o lo que el usuario escribió.

Este documento es el diagnóstico. No se implementa nada.

---

## 1. Arquitectura Angular

**Patrón consistente en todo el proyecto:** standalone components, `ChangeDetectionStrategy.OnPush` en el 100% de los componentes revisados, señales (`signal`/`computed`/`effect`) como único mecanismo de estado — sin NgRx, sin store centralizado. Contenido estático vive en `core/services/mock-data/*.ts`; estado por-usuario vive en servicios `@Injectable({providedIn:'root'})` que sincronizan contra Supabase vía `effect()` reactivo a `AuthService.userId()`/`ready()`.

Angular **21.2.0**, TypeScript **~5.9.2**, `tsconfig.json` con `strict: true` + `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `isolatedModules`, y Angular-específicos `strictInjectionParameters`, `strictInputAccessModifiers`, `strictTemplates` — configuración notablemente estricta para el ecosistema, poco común en proyectos de este tamaño.

**No escala bien:** no existe backend propio. El día que cualquier `Ai*Service` necesite llamar a un LLM real, tiene que pasar por un backend (Supabase Edge Function u otro) para no exponer API keys — hoy no existe ni el esqueleto de esa capa, es una decisión de arquitectura pendiente, no un detalle de implementación.

**Servicio dios:** `core/services/user-state.service.ts` (452 líneas, el archivo de lógica más grande del repo) tiene fan-in de **26 archivos** — casi todos los feature components más 10 servicios core. Funciona hoy porque es disciplinado (solo signals/computed, sin lógica ajena), pero es el candidato #1 a partirse si el equipo crece.

**Sin capa de abstracción de IA:** los 8 `Ai*Service` son independientes entre sí — bien para no romperse mutuamente, mal porque no hay un punto compartido para timeout/retry/rate-limit/fallback. Cuando llegue la IA real, cada uno repetirá ese manejo por separado.

---

## 2. Componentes

**46 componentes de feature** (`.ts`, sin contar `.spec.ts`). El más grande, `features/interview-prep/mock-interview/mock-interview.ts` (238 líneas), mezcla control de fase, timer de "Real Interview Mode", selección adaptativa de preguntas, agregación de evaluación y guardado de sesión+mistakes en un solo archivo — primer candidato a extraer un `MockInterviewSessionService` si crece más.

**Duplicación real encontrada:** el patrón `condición ? set.delete(x) : set.add(x);` usado como sentencia (no como expresión) apareció copiado a mano en 3 archivos distintos (`interview-progress.service.ts`, `vocabulary.service.ts`, `features/interview-prep/tips/tips.ts`) — evidencia de que un helper compartido `toggleInSet(set, id)` nunca se extrajo pese a repetirse.

**Responsive:** de 52 archivos `.scss` en el proyecto, solo **8 tienen `@media` queries**. El spec original pedía revisar especialmente Interview/Roleplay/Speaking/Vocabulary/Call Simulator para mobile — no hay evidencia de que se haya hecho una pasada sistemática; la mayoría de pantallas dependen de que flex/grid se comporte razonablemente por defecto, sin ajustes deliberados de breakpoint.

**Accesibilidad:** el lint de plantillas (`angular-eslint templateAccessibility`) está activo y en cero errores — eso cubre problemas estáticamente detectables (labels, roles básicos). No se hizo una auditoría real de teclado/foco/lectores de pantalla en esta sesión; es un hueco declarado, no un "aprobado".

**Loading states:** casi todos los servicios de datos exponen un `loading` signal (`VocabularyService`, `GrammarService`, `InterviewProgressService`, etc.) — pero solo **5 de 46 componentes** lo usan en su plantilla. La mayoría de pantallas no muestra ningún estado de carga mientras Supabase responde; en una conexión lenta, el usuario ve contenido vacío/parcial brevemente sin indicación.

**Empty states:** `EmptyStateComponent` compartido existe y se usa en **10 pantallas** (Dashboard, My Mistakes, History, etc.) — cobertura razonable pero no exhaustiva; varias listas (Company Prep, Career Tracks) no tienen un estado vacío dedicado porque siempre tienen contenido estático de fondo.

---

## 3. Services — inventario y estado real

| Servicio | Lo que hace | Backend | IA |
|---|---|---|---|
| `UserStateService` (452L) | Identidad, progreso, XP, streak, activity log | ✅ Supabase | N/A |
| `CareerCoachService` (219L) | Job Ready Score, Weaknesses, Recommendations | Derivado | Fórmula fija, no IA |
| `InterviewProgressService` (216L) | Perfil onboarding + respuestas + vocab conocido — 3 responsabilidades en un archivo | ✅ | N/A |
| `MistakeMemoryService` / `MistakeDetectionService` | Captura y agrupa errores | ✅ | 20 reglas regex, no IA |
| `SpacedRepetitionService` | SM-2 simplificado, probado con tests | ✅ | N/A |
| `AchievementService` | Evalúa 21 logros contra contexto real | ✅ | N/A |
| `CareerPathService` / `CareerTracksService` (config) | Deriva 7 etapas / 6 rutas de datos existentes | Derivado | N/A |
| `AdvancedAnalyticsService` | Reporte semanal vs. semana anterior | Derivado | N/A |
| `AiTutorService` | **Mock** — plantilla fija, ignora el input | ❌ | ❌ |
| `AiAnswerBuilderService` | **Mock** — templating, solo 1 de 23 preguntas | ❌ | ❌ |
| `AiEvaluationService` (Writing) | **Mock** heurístico — fórmula de gramática invertida (bug) | ❌ | ❌ |
| `AiExerciseService` | **Mock** — genera el mismo MCQ interpolado siempre | ❌ | ❌ |
| `AiInterviewEvaluationService` | **Mock** heurístico — conteo de palabras + filler words | ❌ | ❌ |
| `AiInterviewService` (adaptativo) | Reglas por keyword para ramificar preguntas | ❌ | ❌ |
| `AiRoleplayService` | **Mock** — 3 frases fijas por turno, iguales en los 14 escenarios | ❌ | ❌ |
| `AiJobAnalysisService` (Company Prep) | **Mock** — regex sobre keywords | ❌ | ❌ |
| `SpeechRecognitionService` / `TextToSpeechService` | Web Speech API real del navegador, honesto sobre límites | N/A (browser) | N/A |
| `CallFlowScoringService` | Scoring real del transcript contra checklist de llamada | Derivado | Reglas, no IA |

---

## 4. Models / Interfaces

Modelos organizados por dominio en `core/models/*.model.ts` (`user`, `language`, `skill`, `exercise`, `lesson`, `vocabulary`, `review-item`, `grammar`, `achievement`, `user-progress`, `ai`, `interview`, `career-coach`), re-exportados desde un `index.ts` central. Tipado estricto y consistente — sin `any` fuera de los que existían en `speech-recognition.service.ts` (ya corregidos). El único riesgo real: `core/services/supabase.types.ts` (260 líneas) es un **mirror escrito a mano** del esquema SQL — el propio comentario del archivo admite que debería regenerarse con `supabase gen types typescript` una vez que la CLI de Supabase esté conectada, y no lo está. Riesgo de drift silencioso si alguien cambia una columna en el SQL Editor sin actualizar el tipo TS correspondiente.

---

## 5. Routing

`app.routes.ts` (211 líneas): ruta raíz redirige a `dashboard`; `/auth/*` detrás de `guestGuard`; todo lo demás detrás de `authGuard`, dentro de un `ShellComponent`. ~35 rutas, todas lazy-loaded vía `loadComponent`. Wildcard `**` redirige a `dashboard`.

**Ruta huérfana confirmada:** `placement-test` (línea 87) — cero `routerLink` en toda la app apunta ahí. No está en `NAV_ITEMS` ni `MOBILE_NAV_ITEMS` (`core/constants/nav.constant.ts`), ni enlazada desde Dashboard ni ningún hub. Solo alcanzable escribiendo la URL. La lógica de scoring/nivel CEFR funciona perfecto — el problema es 100% de descubribilidad.

Guards (`core/guards/auth.guard.ts`): `authGuard`/`guestGuard`, ambos `await auth.readyPromise` antes de decidir — evita el parpadeo de "no autenticado" en la carga inicial. Sin interceptors HTTP en todo el proyecto porque no se usa `HttpClient` en ningún lado — todo pasa por el SDK de Supabase directamente.

---

## 6. Supabase

7 migraciones en `supabase/`, todas idempotentes (`if not exists`/`drop policy if exists`), ejecutadas manualmente en el SQL Editor — **no hay Supabase CLI ni pipeline de migraciones**, es un riesgo operativo real a medida que el número de migraciones crece (ya son 7, ejecutadas en orden manual documentado en comentarios, sin ningún mecanismo que impida saltarse una).

19 tablas creadas en total: `profiles`, `user_settings`, `user_streak`, `language_progress`, `lesson_completions`, `daily_activity`, `activity_log`, `review_items`, `user_achievements`, `vocabulary_words`, `user_word_favorites`, `grammar_progress`, `roleplay_sessions`, `scenario_sessions`, `user_mistakes`, `interview_sessions`, `interview_profile`, `interview_answers`, `interview_vocab_progress`.

**Tablas faltantes vs. lo que el producto necesitaría a futuro:** no existe tabla para persistir el análisis de Company Prep (§ gap conocido), ninguna para el checklist de Interview Tips, ninguna para "resultado real" (¿consiguió la entrevista/el trabajo? — necesaria para calibrar el Job Ready Score contra la realidad), ninguna para historial de conversación de AI Tutor.

---

## 7. Authentication

Real, no simulada — `core/services/auth.service.ts` delega 100% a Supabase Auth (`signInWithPassword`, `signUp`, `resetPasswordForEmail`, `signOut`, `onAuthStateChange`). `session` es un signal único, sincronizado automáticamente. Sin manejo de errores tipado (`throw new Error(error.message)` genérico) ni lógica de retry/rate-limit propia — aceptable para el tamaño actual, insuficiente si se espera tráfico real (mensajes de error de Supabase se muestran tal cual, sin traducir a lenguaje de usuario en todos los casos).

---

## 8. RLS (Row Level Security)

**19 tablas creadas, 19 `enable row level security` — cobertura 1:1, sin excepciones.** `vocabulary_words` tiene política de solo-lectura pública (`for select using (true)`) sin política de escritura — el cliente no puede mutar contenido compartido ni por error. El resto sigue el patrón `auth.uid() = user_id` uniforme. Esta es, sin exagerar, la parte mejor ejecutada de todo el proyecto desde el punto de vista de seguridad.

---

## 9. Storage

**No se usa Supabase Storage (buckets de archivos) en ningún lugar del proyecto.** No hay subida de avatar (el avatar es un emoji elegido, no una imagen), no hay subida de CV/resume (el Resume Analyzer planeado en el spec original nunca se construyó — ver §29), no hay almacenamiento de audio de Pronunciation Coach (se procesa en memoria vía Web Speech API y se descarta). Esto es coherente con el alcance actual, pero es un prerequisito de infraestructura ausente para cualquier funcionalidad futura de subida de archivos.

---

## 10. LocalStorage

Acceso centralizado correctamente: `core/services/storage.service.ts` es el único punto que toca `localStorage` directamente (comentario explícito: "Nothing else in the app should call `localStorage` directly"), con claves registradas en `core/constants/storage-keys.constant.ts`. Usado principalmente por `ThemeService` para preferencia de tema local-first. Ningún dato sensible (tokens, contraseñas) se guarda manualmente ahí — la sesión de Supabase la maneja el SDK con su propio adaptador de storage.

---

## 11–19. Módulos de aprendizaje (Learning, Vocabulary, Grammar, Speaking, Listening, Writing, Placement Test, Progress, Gamification)

| # | Módulo | Existe | Real o mock | Funciona | Persiste | Conectado | Backend | IA | Falta |
|---|---|---|---|---|---|---|---|---|---|
| 11 | Learning (Lessons, 9) | ✅ | Real | ✅ | ✅ | ✅ | ✅ | N/A | Más lecciones por nivel (9 es un currículo delgado para B2/C1/C2) |
| 12 | Vocabulary (52 palabras) | ✅ | Real | ✅ | ✅ | ✅ (Review, Career Path) | ✅ | N/A | Volumen bajo — 52 palabras totales es poco para un curso serio |
| 13 | Grammar (45 temas) | ✅ | Real | ✅ | ✅ | ✅ (Job Ready no lo usa — ver §28) | ✅ | N/A | No entra en la fórmula de Job Ready Score pese a tener datos |
| 14 | Speaking (16 ejercicios) | ✅ | Real scoring, no fonético | ✅ | ✅ | ✅ | ✅ | ❌ solapamiento de palabras | Evaluación fonética real |
| 15 | Listening (20 ejercicios) | ✅ | Real | ✅ | ✅ | ✅ | ✅ | N/A | Audio real (hoy TTS del navegador) |
| 16 | Writing (12 prompts) | ✅ | **Mock con bug** | ✅ visualmente | ✅ | ✅ | ✅ | ❌ | `grammarScore` invertido (§2 del audit previo) — corregir antes que cualquier otra cosa en este módulo |
| 17 | Placement Test | ✅ | Real, lógica sólida | ✅ | Parcial (solo nivel final) | ❌ **huérfano, sin enlaces** | ✅ | N/A | Un `routerLink` |
| 18 | Progress + Weekly Report | ✅ | Real | ✅ | ✅ | ✅ | ✅ | N/A | — |
| 19 | Gamification (21 logros) | ✅ | Real | ✅ | ✅ | ✅ | ✅ | N/A | Sin elementos sociales (leaderboard) — ver §"no construir todavía" |

---

## 20–24. Módulo de empleabilidad (Interview Prep, Mock Interview, Roleplay, Call Center, Company Prep)

| # | Módulo | Existe | Real o mock | Funciona | Persiste | Conectado | Backend | IA | Falta |
|---|---|---|---|---|---|---|---|---|---|
| 20 | Interview Prep (hub) | ✅ | Real | ✅ | ✅ | ✅ | ✅ | N/A | — |
| 21 | Mock Interview | ✅ | Selección adaptativa real, evaluación heurística | ✅ | ✅ | ✅ | ✅ | ❌ evaluación | Evaluación de contenido real, no solo forma (conteo de palabras) |
| 22 | Roleplay | ✅ | Scoring de flujo real, **diálogo 100% scripted** | ✅ | ✅ | ✅ | ✅ | ❌ diálogo | **El hallazgo más grave del audit**: el cliente responde igual sin importar el escenario — ver §3 del audit anterior |
| 23 | Call Center (vocab + phrases) | ✅ | Real (55 palabras) | ✅ | ✅ | ✅ | ✅ | N/A | — |
| 24 | Company Prep 2.0 | ✅ | Real input, análisis por keywords | ✅ | ❌ no persiste | ✅ (alimenta Mock Interview) | ✅ | ❌ | Persistencia + análisis real vía LLM |

---

## 25–26. AI Services & Adaptive Learning

Ya cubierto en detalle en la auditoría previa (§9, §10 de `salingo-audit.html`). Resumen: **cero llamadas reales a LLM**; el sistema adaptativo existente (`CareerCoachService.weaknesses`, `MistakeMemoryService` resurfacing, `AiInterviewService.pickNextQuestion`) es real y honesto sobre datos, pero adapta *recomendaciones*, no *contenido* — no ajusta dificultad ni genera ejercicios dirigidos a un error específico. Ningún ejercicio existente tiene taxonomía de "qué concepto gramatical/vocabulario cubre", lo cual es el prerequisito de datos para un verdadero motor adaptativo, con o sin IA.

## 27. Recommendations

`RecommendationService` + `CareerCoachService.recommendedActivities` — reglas simples sobre datos reales (palabras por vencer, siguiente lección, skill más débil, primera entrevista si no hay ninguna). No fabrica datos, gatea correctamente cuando no hay suficiente actividad. Punto débil: el *contenido* de la recomendación es genérico ("Practice Speaking"), no específico al error real cometido.

## 28. Job Ready Score

Ya auditado en profundidad (§11 anterior). Fórmula ponderada (English 20 / Speaking 20 / Interview 20 / Customer Service 15 / Vocabulary 15 / Confidence 10), renormaliza cuando faltan dimensiones, gate de "no hay suficiente actividad", probado con tests de monotonicidad. **Grammar no está incluido pese a tener datos disponibles** (45 temas con progreso real). Los pesos son arbitrarios — razonables como punto de partida, pero nunca calibrados contra un resultado real porque **no existe ningún mecanismo para capturar si el usuario efectivamente consiguió la entrevista o el trabajo**.

## 29. Resume functionality

**No implementado.** Estaba en el spec original ("Resume Analyzer", sección 21) como P1. No existe componente, servicio, ni tabla. Cero código relacionado con parseo o análisis de CV.

## 30. Job Description functionality

Parcialmente implementado dentro de Company Prep 2.0 (`AiJobAnalysisService`) — el usuario pega una descripción de puesto y obtiene perfil/vocabulario/estrategia por keyword-matching. No hay un módulo separado ni persistencia (ver §24).

## 31. Responsive / mobile

Ver §2. Solo 8/52 `.scss` tienen media queries. No hay evidencia de testing real en viewport móvil durante el desarrollo — riesgo alto dado que el público objetivo declarado (hispanohablantes buscando trabajo en call center) es predominantemente mobile-first.

## 32. Accessibility

Lint de plantillas activo y limpio (cobertura estática). Sin auditoría real de navegación por teclado, contraste, ni lectores de pantalla. Declarado como hueco, no evaluado a fondo.

## 33. Error handling

Patrón consistente: casi todas las escrituras a Supabase son `.then(({error}) => error && console.error(...))` — fire-and-forget, sin reintento, sin notificación visible al usuario cuando algo falla en segundo plano (el signal local ya se actualizó optimistamente, así que el usuario nunca se entera si el guardado real falló). Es un patrón deliberado y documentado, razonable para MVP, pero significa que **hoy es posible perder datos silenciosamente** si Supabase rechaza un write (por ejemplo, por una migración no corrida) sin que el usuario lo sepa.

## 34. Loading states

Ver §2 — 5 de 46 componentes usan el signal `loading` que sus servicios ya exponen. La infraestructura existe, el consumo en UI es inconsistente.

## 35. Empty states

Ver §2 — `EmptyStateComponent` compartido, usado en 10 pantallas. Cobertura razonable, no exhaustiva.

## 36. Testing

33 tests unitarios en 7 archivos (Vitest vía `@angular/build:unit-test`), priorizados correctamente sobre lógica crítica (Job Ready Score, Call Flow Scoring, Mistake Detection, spaced repetition, selección adaptativa de preguntas). **Cero tests de componentes**, **cero tests e2e** (no hay Cypress/Playwright instalado). Cobertura real de la superficie total del producto: baja, pero la lógica que más importa si se rompe silenciosamente sí está cubierta.

## 37. ESLint

`ng add @angular-eslint/schematics` configurado, `ng lint` en **cero errores** — verificado, no solo instalado. Reglas estándar de Angular + TypeScript recomendadas + estilo.

## 38. Performance

Bundle inicial ~479kB raw / ~123kB gzip, bien debajo del presupuesto de 500kB configurado en `angular.json`. Lazy loading en todas las rutas. Sin profiling de runtime (nunca se midió tiempo de carga real, uso de memoria, ni re-renders). No hay evidencia de un problema de performance real hoy — tampoco hay evidencia de que se haya medido a propósito más allá del tamaño de bundle.

## 39. Security

Ver §8 (RLS) y auditoría previa §5. Resumen: RLS ejemplar, sin secretos filtrados (la anon key es pública por diseño de Supabase), auth delegada correctamente. Gaps: sin CI/secret-scanning, sin ambiente de staging separado, tipos de DB escritos a mano (riesgo de drift), sin límites de costo/rate-limit diseñados para cuando haya IA real con costo por llamada.

## 40. Production readiness

**El área más débil del proyecto junto con IA real.** No hay CI/CD, no hay pipeline de migraciones (SQL corrido a mano en el editor), no hay monitoreo de errores en producción (sin Sentry ni equivalente), no hay ambiente de staging, no hay tests e2e, no hay plan de rollback más allá de `git revert`. El código en sí está listo para desplegarse (`ng build` limpio, PWA configurada); la *operación* de un despliegue real no tiene ninguna red de seguridad todavía.

---

## Usuarios simulados

### A — Quiere aprender inglés, nunca usó SALingo
Puede: registrarse, empezar en Lesson 1 (A1) directo. **Nunca ve el Placement Test** (§17) — si ya sabe inglés intermedio, pierde tiempo en contenido demasiado básico antes de que el sistema lo detecte por desempeño real. Debería recomendársele el Placement Test en el primer login, no descubrirlo por accidente.

### B — Nivel A2, quiere trabajo en call center
Puede: onboarding de Interview Prep, Career Tracks lo dirige a "Customer Service", ve su Career Path completo. Se bloquea en: el Roleplay — la parte que más necesita practicar (una llamada real) es la más falsa del producto. SALingo debería recomendarle Roleplay temprano y con confianza; hoy esa recomendación es prematura dado el estado real de esa función.

### C — Entrevista en 7 días
Puede: usar el Preparation Plan de 7 días — encaja exactamente con su ventana de tiempo, es el caso mejor cubierto de los seis. Falta: nada estructural, aunque la profundidad de cada día depende de los mismos módulos con las mismas limitaciones (Roleplay, evaluación heurística).

### D — Entrevista mañana
Puede: fijar fecha en Preparation Plan → cambia automáticamente a modo intensivo → termina en Speaking Warm-up → Mock Interview. Bien resuelto, verificado en vivo en sesiones anteriores. Único hueco: el campo de fecha solo vive en la pantalla de Plan, no hay una entrada directa tipo "¿Tu entrevista es mañana?" desde el Dashboard.

### E — Ya trabaja en customer service, quiere mejorar
Necesita: contenido avanzado y detección de errores sutiles, no básicos. My Mistakes y Advanced Analytics son exactamente la herramienta correcta conceptualmente — pero My Mistakes solo detecta 20 patrones de principiante; un profesional en ejercicio probablemente ya no comete esos errores, así que su progreso real queda invisible para el sistema. SALingo no tiene nada que ofrecerle hoy que se sienta "para su nivel".

### F — Encontró una vacante específica, quiere prepararse para ella
Puede: pegar la descripción en Company Prep 2.0, obtener perfil/vocabulario/estrategia, lanzar una entrevista personalizada — funciona de punta a punta. Se bloquea en: si vuelve al día siguiente, el análisis desapareció (no persiste). Debería poder guardar múltiples análisis por vacante y volver a cualquiera.

---

## ¿Qué tan cerca está SALingo de "Learn English. Get Interview Ready. Get Hired."?

- **"Learn English"** — cumplido con solidez. 9 lecciones, 45 temas de gramática, spaced repetition probado, 4 skills con ejercicios y persistencia real.
- **"Get Interview Ready"** — parcialmente cumplido. La estructura (banco de preguntas, Answer Builder, historial, plan de preparación, warm-up) es real y está bien conectada. La *simulación* de la entrevista y de la llamada — el corazón de "estar listo" — todavía es superficial.
- **"Get Hired"** — no cumplido, ni podría estarlo con el diseño actual: no existe ningún mecanismo para saber si un usuario efectivamente consiguió una entrevista o un trabajo. El Job Ready Score es una estimación honesta basada en actividad, nunca validada contra un resultado real.

---

## Scores de madurez

| Categoría | Score | Justificación breve |
|---|---|---|
| **PRODUCT READINESS** | **58/100** | Amplitud excelente, profundidad desigual — fuerte en aprendizaje base, débil en el módulo que diferencia al producto |
| **TECHNICAL READINESS** | **70/100** | Arquitectura limpia, tests, lint, tipos estrictos; sin backend propio ni pipeline de DB |
| **UX READINESS** | **55/100** | Flujos de entrevista bien pensados; ruta huérfana, loading/mobile inconsistentes |
| **AI READINESS** | **20/100** | Contratos y arquitectura de swap listos; cero capacidad de IA real hoy |
| **CALL CENTER READINESS** | **40/100** | Contenido y scoring de flujo reales; la conversación en sí es scripted e idéntica entre escenarios |
| **EMPLOYABILITY READINESS** | **50/100** | Job Ready Score/Career Path/Tracks son diferenciadores reales; falta Resume Analyzer y captura de resultado real |
| **SECURITY READINESS** | **72/100** | RLS ejemplar, auth correcta; sin CI/secret-scanning ni staging separado |
| **PRODUCTION READINESS** | **35/100** | El código despliega limpio; no hay red de seguridad operativa (CI/CD, monitoreo, migraciones automatizadas, e2e) |

**Promedio simple: 50/100.** Lectura honesta: es un prototipo avanzado, no un producto listo para vender. La mitad del camino no está distribuida uniformemente — está muy adelantada en cimientos y muy atrasada en la pieza que se supone que vende el producto.

---

## Gap Analysis — Current State vs Target State

| # | Gap | Estado actual | Estado objetivo | Prioridad |
|---|---|---|---|---|
| 1 | Roleplay/Call Simulator no reacciona al usuario | 3 frases fijas por turno, iguales en 14 escenarios | Respuesta del cliente varía según `expectedResolution`/`customerPersona` del escenario y lo que escribió el usuario | **P0** |
| 2 | Writing `grammarScore` mide longitud, no gramática | Fórmula invertida, activamente engañosa | Score que refleje corrección gramatical real | **P0** |
| 3 | Sin capa de backend para IA real | Cero infraestructura | Edge Function (o similar) como único punto de salida hacia cualquier LLM | **P0** |
| 4 | Placement Test invisible | Cero enlaces en la app | Enlazado en onboarding de usuario nuevo | **P0** |
| 5 | My Mistakes con cobertura mínima | 20 reglas regex fijas | Detección real o al menos comunicación explícita del límite en la UI | **P1** |
| 6 | AI Tutor promete corrección que no hace | Plantilla fija ignora el input | IA real o remover la promesa de "correction" del copy | **P1** |
| 7 | Evaluación de Mock Interview es solo forma | Conteo de palabras + filler words | Evaluación de contenido/relevancia real | **P1** |
| 8 | Company Prep no persiste | Se pierde al refrescar | Guardado por vacante, múltiples análisis históricos | **P1** |
| 9 | Sin plan intermedio de preparación | Solo 7 días o 24 horas | Tramo de 2-5 días | **P2** |
| 10 | Answer Builder cubre 1 de 23 preguntas | Solo "Tell me about yourself" | Generalizado o UI que aclare el alcance real | **P2** |
| 11 | `UserStateService` es servicio dios | 452 líneas, 26 dependientes | Separar identidad/settings de activity log/streak | **P2** |
| 12 | Sin captura de resultado real | Job Ready Score nunca validado | Campo "¿conseguiste la entrevista/el trabajo?" | **P2** |
| 13 | Grammar fuera del Job Ready Score | Dato disponible, no usado | Incluir como 7ma dimensión | **P2** |
| 14 | Mobile no auditado sistemáticamente | 8/52 scss con media queries | Pasada real en viewport móvil, especialmente Interview/Roleplay | **P2** |
| 15 | Loading states inconsistentes | 5/46 componentes usan el signal `loading` disponible | Consumo sistemático del loading state existente | **P3** |
| 16 | Sin accesibilidad auditada más allá del lint estático | Desconocido | Auditoría real de teclado/contraste/lector de pantalla | **P3** |
| 17 | Sin CI/CD ni pipeline de migraciones | Todo manual | Automatizar build+test+lint+migración | **P1** |
| 18 | Resume Analyzer no existe | 0% implementado | Análisis de CV + generación de preguntas desde el CV | **P2** |
| 19 | Sin rate-limit/control de costo para IA futura | No diseñado | Límite de turnos/llamadas por usuario antes de conectar LLM real | **P1** |
| 20 | Sin monitoreo de errores en producción | Solo `console.error` | Sentry o equivalente antes de tener usuarios reales | **P2** |

---

## TOP 20 THINGS TO FIX

*Priorizado por impacto en el usuario, valor de producto, diferenciación, calidad, riesgo y escalabilidad — no por facilidad.*

1. **Hacer que el Call Simulator reaccione de verdad al escenario y a lo que escribe el usuario.** Es la funcionalidad que más define si SALingo cumple su promesa. Sin esto, todo lo demás es soporte para una pieza central que no funciona.
2. **Corregir la fórmula de `grammarScore` en Writing.** Activamente incorrecta, no solo incompleta — un usuario puede estar recibiendo señales falsas sobre su propio nivel de gramática ahora mismo.
3. **Diseñar y construir la capa de backend para IA real** (Edge Function u otra), antes de tocar cualquier `Ai*Service`. Es la dependencia que desbloquea los siguientes 6 puntos.
4. **Conectar IA real a la evaluación de Mock Interview y Roleplay.** El Job Ready Score y toda la narrativa de "estás listo" dependen de que estas evaluaciones midan algo real, no forma superficial.
5. **Enlazar el Placement Test.** El fix de menor esfuerzo de toda la lista con impacto directo en cuánto tiempo pierde un usuario nuevo en contenido mal calibrado.
6. **Ampliar o reemplazar la detección de My Mistakes.** Hoy genera falsa confianza en el peor caso posible: "no se encontraron errores" cuando en realidad no se buscaron los errores correctos.
7. **Decidir qué hacer con AI Tutor** — construir la capacidad real de corrección que su propio copy promete, o quitar esa promesa. Dejarlo como está es la única inconsistencia directa entre lo que la UI dice y lo que el código hace.
8. **Capturar resultado real del usuario** (¿llegaste a la entrevista? ¿conseguiste el trabajo?). Sin esto, el Job Ready Score nunca puede validarse ni mejorarse con datos reales — es el dato faltante más importante de todo el producto a largo plazo.
9. **Persistir el análisis de Company Prep** por vacante, con historial. Un usuario preparándose para una vacante específica es exactamente el tipo de usuario de mayor intención — perder su trabajo al refrescar es un costo de fricción alto para ese segmento.
10. **Auditar y arreglar mobile de forma sistemática**, empezando por Roleplay/Mock Interview/Speaking — el público objetivo declarado es mobile-first y hoy no hay evidencia de que se haya probado en ese contexto.
11. **Separar `UserStateService`** antes de que crezca más — no es urgente hoy, pero el costo de hacerlo después de agregar IA real (que también tocará estado de usuario) será mayor.
12. **Generalizar Answer Builder** a las 23 preguntas del banco, o limitar visiblemente el acceso a la única que cubre.
13. **Incluir Grammar en la fórmula de Job Ready Score** — el dato ya existe y hoy se ignora sin razón declarada.
14. **Construir un pipeline mínimo de CI** (typecheck + lint + test en cada push) — la calidad actual del código merece no depender de que alguien corra los checks a mano.
15. **Automatizar las migraciones de Supabase** (CLI en vez de SQL Editor manual) — con 7 migraciones ya y creciendo, el riesgo de saltarse una en un entorno nuevo es real y silencioso.
16. **Diseñar límites de costo/uso antes de conectar cualquier LLM real** — sin esto, el día 1 de IA real puede ser también el día 1 de una factura sorpresa.
17. **Agregar monitoreo de errores en producción** (Sentry o similar) — hoy un fallo silencioso de escritura a Supabase (§33) es invisible tanto para el usuario como para el equipo.
18. **Construir el Resume Analyzer** — es la pieza de empleabilidad más grande que falta por completo, y conecta directamente con generar preguntas de entrevista personalizadas desde el CV real del usuario.
19. **Ampliar el volumen de contenido de Vocabulary** (52 palabras es bajo) y evaluar si Lessons (9) alcanza para niveles B2+.
20. **Agregar un tramo intermedio al Preparation Plan** (2–5 días) — hoy solo existen los extremos (7 días o mañana).

---

## THINGS WE SHOULD NOT BUILD YET

Funcionalidades que serían distracción en el estado actual — no porque no tengan valor eventual, sino porque construirlas ahora resta foco de lo que realmente sostiene el producto:

- **Leaderboards / elementos sociales / competencia entre usuarios** — gamificación ya tiene 21 logros funcionando; agregar una capa social antes de que el contenido central (Roleplay) sea real es invertir en retención de un producto que todavía no demuestra el valor que debería retener.
- **App nativa (iOS/Android)** — la PWA ya está configurada (aunque con íconos genéricos pendientes de reemplazar); una app nativa es una inversión de plataforma que no tiene sentido antes de validar el producto web.
- **Expansión a otros idiomas de aprendizaje** (francés, alemán, etc.) — el modelo de datos ya lo soporta (`LanguageCode`), pero diluye el foco de "inglés para conseguir trabajo en call center" que es la diferenciación real.
- **Más Career Tracks** allá de los 6 actuales — la arquitectura ya está lista para agregar tracks baratos; hacerlo ahora no resuelve ningún problema real, solo agrega superficie.
- **Voz completa en el Call Simulator (speech-to-speech en vivo)** — antes de eso, el diálogo *en texto* tiene que ser real (§ P0 #1). Agregar voz a una conversación scripted no resuelve el problema de fondo, lo disfraza mejor.
- **Optimización de performance / infraestructura de cache para IA** — prematuro con cero uso real de IA; no hay nada que optimizar todavía.
- **Monetización / paywall** — no tiene sentido cobrar por un producto cuya pieza diferenciadora central (Roleplay/entrevistador IA) todavía no es real. Cobrar ahora sería vender la promesa, no el producto.
- **Funcionalidades B2B/enterprise** (dashboards para BPOs, licenciamiento) — hipotéticamente el modelo de negocio más prometedor a largo plazo, pero requiere que el producto B2C primero demuestre resultado real (§ punto 8 del Top 20) antes de poder venderle a una empresa "esto consigue trabajo".

---

## RECOMMENDED ROADMAP

### Fase 1 — Cerrar los huecos del cimiento (sin IA nueva)
**Objetivo:** que todo lo que ya existe sea honesto y esté conectado, antes de construir nada nuevo.
**Funcionalidades:** enlazar Placement Test; corregir `grammarScore`; persistir Company Prep y el checklist de Tips; incluir Grammar en Job Ready Score; agregar el tramo intermedio del Preparation Plan; separar `UserStateService`; pasada de mobile en los módulos de mayor uso.
**Dependencias:** ninguna — todo se puede hacer con la arquitectura actual.
**Resultado esperado:** el producto deja de tener funcionalidades "falsamente completas" en el sentido de UX (rutas huérfanas, datos que desaparecen, fórmulas erróneas). No cambia la propuesta de valor todavía, pero deja de restarle credibilidad.

### Fase 2 — Backend + IA real donde más importa
**Objetivo:** que la simulación de entrevista y de llamada deje de ser scripted.
**Funcionalidades:** capa de backend (Edge Function) como único punto de salida hacia un LLM; IA real para `AiRoleplayService` (respuesta del cliente contextual); IA real para evaluación de Mock Interview (contenido, no solo forma); límites de costo/uso diseñados desde el inicio.
**Dependencias:** Fase 1 completa (especialmente la separación de `UserStateService`, para no tocar estado de usuario en dos frentes a la vez).
**Resultado esperado:** el Call Simulator y el Mock Interview se sienten realmente distintos cada vez que se practican — esto es lo que convierte "Get Interview Ready" de promesa a realidad.

### Fase 3 — Profundidad de empleabilidad
**Objetivo:** cerrar el círculo de "Get Hired", no solo "Get Interview Ready".
**Funcionalidades:** Resume Analyzer real; IA real para Company Prep/Job Description Analyzer; captura de resultado real (¿conseguiste la entrevista? ¿el trabajo?); recalibración del Job Ready Score contra esos resultados; My Mistakes con detección real en vez de 20 reglas.
**Dependencias:** Fase 2 (misma infraestructura de backend/IA).
**Resultado esperado:** SALingo puede empezar a demostrar con datos propios, no solo con la fórmula del Job Ready Score, que ayuda a conseguir trabajo.

### Fase 4 — Escala y calidad de producción
**Objetivo:** que el producto pueda operarse con usuarios reales sin depender de que alguien lo vigile manualmente.
**Funcionalidades:** CI/CD; pipeline de migraciones automatizado (Supabase CLI); monitoreo de errores (Sentry); tests e2e de los flujos críticos (onboarding, Mock Interview, Roleplay); auditoría real de accesibilidad; branding real de los íconos PWA.
**Dependencias:** ninguna funcional — puede correr en paralelo a Fase 2/3, pero debería estar terminada antes de Producción.
**Resultado esperado:** un incidente en producción se detecta y diagnostica en minutos, no cuando un usuario se queja.

### Producción
**Objetivo:** lanzar con una red de seguridad real.
**Requisitos de entrada:** Fase 1 y Fase 4 completas como mínimo; Fase 2 idealmente completa (lanzar sin IA real en el Call Simulator es viable pero diluye la diferenciación desde el día 1).
**Acciones:** ambiente de staging separado del proyecto de Supabase actual; rotación de claves; plan de rollback documentado; términos de servicio/privacidad (recolecta datos de progreso y, eventualmente, de resultado laboral — dato sensible).

### Monetización
**Objetivo:** validar disposición a pagar sin comprometer la propuesta de valor central.
**Hipótesis de modelo:** freemium — gratis: aprendizaje de inglés completo + un número limitado de Mock Interviews/Roleplays con IA real por mes; pago: ilimitado + Resume Analyzer + Company Prep con historial + evaluación de IA más profunda. Alternativa B2B (bootcamps, agencias de colocación, BPOs) es probablemente el modelo de mayor ticket a mediano plazo, pero requiere primero poder mostrarle a un comprador empresarial evidencia real de resultado (Fase 3).
**Dependencias:** Fase 2 y 3 completas — cobrar antes de que la IA sea real vende una promesa, no un producto, y es la forma más rápida de perder confianza temprano con los primeros usuarios pagos.

---

*Fin de la auditoría. Ningún archivo de producto fue modificado durante su elaboración.*
