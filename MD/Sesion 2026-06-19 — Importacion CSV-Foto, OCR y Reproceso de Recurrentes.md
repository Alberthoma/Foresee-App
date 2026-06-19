# Sesión 2026-06-19 — Importación CSV/Foto, OCR y Reproceso de Recurrentes

**Fecha:** 2026-06-19 (sesión continuada desde 2026-06-16)
**Versión activa al cierre:** V FSA 0045
**Tipo:** Código

## Resumen

Sesión larga centrada casi por completo en la sección **Importar**: se terminó de pulir el pipeline de importación CSV/Excel (limpieza de descripción, íconos, reemplazo de recurrentes, agrupación de transferencias), se diseñó e implementó desde cero la **importación desde foto (OCR client-side con Tesseract.js)**, y se corrigieron en cadena varios bugs reales de duplicados detectados por el usuario probando con datos reales de sus bancos (Bank of America, Chase, Wells Fargo). Cerró con un fix al reproceso indebido de gastos recurrentes causado por parpadeos de autenticación/Firestore.

## 1. Cierre de V FSA 0034 y pulido del pipeline CSV (V FSA 0035)

- Se completó el protocolo de commit de V FSA 0034 (ícono ❓ para importados sin categoría) que había quedado pendiente de una sesión anterior.
- El usuario probó la importación con CSV reales y reportó varios problemas: formato de descripción inconsistente, ícono ❓ invisible, reemplazo de recurrentes (`®`) fallando cuando el nombre del recurrente no empezaba con el nombre del comercio.
- **Diagnóstico y fixes (todos en `cleanBankDescription` y funciones relacionadas):**
  - Nueva función `sharesDescriptionWord()` (coincidencia por cualquier palabra compartida de 4+ caracteres) reemplazó a `firstKeyword()` (que solo comparaba la primera palabra) — usada para el reemplazo de recurrentes.
  - `cleanBankDescription()`: prefijo "Authorized On" generalizado, nuevo prefijo "Recurring Transfer To/From", extracción de código `REF#`/`Conf#`, deduplicación de palabras repetidas, `*` tratado como separador (no trunca), truncado de palabras en cualquier carácter especial salvo `-`.
  - **Bug crítico encontrado:** la lista de abreviaciones de estado de EE.UU. incluía `"ID"` (Idaho), que colisionaba con el marcador "Web Id"/"PPD ID" de identificador bancario — se excluyó deliberadamente.
  - **Bug crítico encontrado:** el ícono ❓ (`UNKNOWN_ICON`) usaba doble codificación URI (`%23` dentro de un string ya pasado por `encodeURIComponent()`), produciendo un color de stroke inválido e ícono invisible — corregido y rediseñado como círculo naranja con signo de interrogación blanco.
  - `buildTransferPairPartners()` + `effectiveOrder`: nueva lógica para que ambos lados de una transferencia confirmada queden siempre adyacentes en Registros, sin romper la cadena de Saldo (se confirmó con el usuario vía preguntas que no importaba quién va arriba, solo que estuvieran juntos).
  - `coveredByImport` ampliado: ya no exige el símbolo `®` para considerar un recurrente "cubierto" — compara contra cualquier transacción `type: 'expense'`.
  - Nuevo banner informativo (con checkbox "no volver a mostrar") en el modal "Añadir Gasto Recurrente", sugiriendo nombrar el recurrente con una palabra que coincida con el extracto bancario.

## 2. Importación desde foto — diseño e implementación (V FSA 0036)

- El usuario pidió poder subir una foto/captura de pantalla bancaria y que se procesara igual que un CSV.
- Se aclaró un punto de arquitectura importante: Claude puede leer la imagen **en la conversación**, pero la app publicada no tiene acceso a ningún modelo de IA — para que sea una función real dentro de la app, se necesita una librería de OCR client-side. El usuario descartó explícitamente usar una API de IA con visión (costo, requiere Cloud Functions + plan Blaze de Firebase) y eligió **Tesseract.js** (gratis, sin servidor).
- Se entró en modo plan, se exploró el pipeline CSV existente, se diseñó el algoritmo de reconstrucción de transacciones a partir de palabras con bounding boxes (clustering por Y, corte de columna por X, detección de fecha como disparador de bloque), y se guardó el plan en `MD/Plan OCR Importar Foto — Foresee.md`.
- Se creó también `MD/Pipeline de Importación CSV — Referencia.md`, documento de referencia función por función del pipeline CSV existente (para que sesiones futuras no tengan que re-explorar el código).
- Implementación: nuevas funciones (`clusterWordsIntoLines`, `findColumnSplit`, `reconstructTransactionBlocks`, `ocrBlocksToImportRows`, `loadTesseractLib`, `processImportImage`, etc.), integradas al pipeline existente sin tocar su lógica interna. Carga diferida de Tesseract.js (no penaliza el arranque de la app). Filas sin monto detectable quedan marcadas `needsReview` con el monto editable en el preview.

## 3. Bugs de duplicados detectados con datos reales (V FSA 0037-0038)

- El usuario notó que `Best Buy`/`Capital One` se duplicaban al importar la misma operación una vez por CSV (código completo) y otra por foto (código enmascarado con "X").
- Se amplió la detección de duplicados (`detectImportDuplicates`, `isDup` en `bulkImportTransactions`) para considerar duplicado cuando coinciden fecha+monto+banco y comparten una palabra en la descripción (no solo coincidencia exacta de código o texto).
- Nueva función `findSuspectDuplicateIds()` + badge ⚠️ en Registros, para señalar visualmente duplicados ya guardados (sin borrado automático).
- Fix adicional: al reemplazar un recurrente con la transacción real importada, ahora se conserva la categoría del recurrente reemplazado (antes quedaba sin categoría).

## 4. Iteración intensiva de formatos de captura OCR (V FSA 0039-0042)

El usuario probó capturas reales de distintas vistas bancarias y se fueron encontrando y corrigiendo, una por una:

- **Formato "En proceso" (BoA, transacciones pendientes):** sin línea de fecha tradicional — se usa la fecha de hoy para estos bloques.
- **Formato numérico Wells Fargo (`MM/DD/YYYY`):** se agregó como segundo patrón de fecha reconocido.
- **Montos sin signo explícito (Wells Fargo):** se infiere gasto/ingreso por palabra clave en la descripción (`purchase`, `withdrawal`, `transfer to` → gasto; `deposit`, `transfer from`, `credit` → ingreso), marcando `needsReview` si es ambiguo.
- **Líneas de resumen diario ("Fecha de registro"/"Saldo diario final"):** se detectó que su monto se mezclaba con transacciones reales cercanas — se implementó `stripDividerLines()` para eliminarlas por completo antes de reconstruir bloques.
- **Regresión real:** tras el fix anterior, algunas capturas pasaron de dar un resultado incorrecto a dar **ningún** resultado. Se agregó un modo de diagnóstico (`window.FORESEE_OCR_DEBUG = true`) que imprime en consola las líneas y bloques reconstruidos — con el log real se encontró la causa exacta: el ícono de check (✓) se leía como el carácter `"@"`, bloqueando el reconocimiento de fecha por estar antes del número. Se corrigió limpiando ese prefijo antes de intentar matchear.
- **Etiqueta "Pendiente(s)":** no coincidía con el patrón exacto `pendiente` por el sufijo `(s)` — se cambió a coincidencia de prefijo.

Esta secuencia fue la más costosa de la sesión en iteraciones, pero terminó con una metodología reutilizable: ante un fallo de OCR no explicable por inspección visual, activar el modo debug y pedir el log real en vez de seguir corrigiendo por hipótesis.

## 5. Duplicados entre bancos distintos y detección de banco (V FSA 0043-0044)

- El usuario reportó que dos lados reales de una transferencia (BoA recibe, Chase envía) se trataban como duplicados entre sí pese a ser de bancos distintos. Causa: el criterio de "palabra compartida" (sección 3) no exigía mismo banco. Se corrigió agregando esa condición en los tres puntos donde aplica (`detectImportDuplicates`, `isDup`, `findSuspectDuplicateIds`).
- Después, una transacción de un archivo `Wf.csv` se importó etiquetada como "Bank Of America" (no se reconoció "Wf" como Wells Fargo), generando otro falso duplicado. Se rediseñó `detectBankImport()` para comparar dinámicamente contra los bancos configurados por el usuario (`appState.banks`) más abreviaciones conocidas (`boa`, `bofa`, `wf`), y — a pedido explícito del usuario — si no se reconoce ningún banco, ahora se **aborta la importación de ese archivo con un mensaje pidiendo renombrarlo**, en vez de adivinar con el primer banco de la lista.

## 6. Reproceso indebido de gastos recurrentes (V FSA 0045)

- El usuario encontró gastos recurrentes duplicados (Netflix, Upstart, Best Buy, Spectrum) registrados automáticamente aunque ya existiera la transacción real que debía cubrirlos. Preguntó si convenía desactivar el auto-registro.
- Se recomendó NO desactivarlo (es el valor principal de la función) y se investigó la causa: `processRecurringExpenses()` solo debe correr una vez por sesión, protegido por una bandera en memoria que se resetea en `unloadUserData()` — función que se dispara no solo al cerrar sesión, sino cada vez que `onAuthStateChanged` recibe un usuario nulo. El log de consola que compartió el usuario (errores `Missing or insufficient permissions` simultáneos en las 6 colecciones) es consistente con un parpadeo de sesión/reconexión, que dispara ese reseteo y re-ejecuta el proceso contra datos no sincronizados del todo.
- Fix: cooldown de 60 segundos en `sessionStorage`, que sobrevive a esos reseteos en memoria dentro de la misma pestaña.

## Estado al cierre

| Componente | Estado |
|---|---|
| Importación CSV/Excel | Estable, con limpieza de descripción robusta y deduplicación por fecha+monto+banco+palabra compartida |
| Importación desde foto (OCR) | Funcional para los formatos probados (BoA procesado, BoA pendiente, Wells Fargo numérico, Wells Fargo "Pendiente(s)") — modo debug disponible para futuros formatos no soportados |
| Reemplazo de gastos recurrentes (`®`) | Funcional, conserva categoría del recurrente reemplazado |
| Detección de duplicados | Por código, por texto exacto, y por fecha+monto+banco+palabra compartida; badge visual ⚠️ en Registros para revisión manual |
| Agrupación visual de transferencias en Registros | Implementada, sin afectar la columna Saldo |
| Auto-registro de gastos recurrentes | Activo, con protección anti-reproceso de 60s |

## Pendiente para próxima sesión

- Verificar que `Wf.csv` ya no duplique la transacción del 06/09 (fix de V FSA 0044, no confirmado todavía por el usuario al cierre de esta sesión).
- Limpiar manualmente los duplicados de recurrentes que ya quedaron guardados antes del fix de V FSA 0045 (Netflix, Upstart, Best Buy, Spectrum) — no se borran solos.
- Si vuelven a aparecer parpadeos de `Missing or insufficient permissions` en consola, investigar la causa raíz (no solo el cooldown defensivo que se agregó como mitigación).
- Mencionado pero no implementado: cuando los dos lados de una transferencia entre bancos se importan en sesiones separadas, ambos se guardan bien pero no se reconocen retroactivamente como par (sin ícono ⇄) — el usuario no pidió arreglarlo todavía.
- Decidir si la "Mejora 7 — Escaneo de recibos (OCR)" del roadmap (`MD/plan-mejoras.md`) se considera cubierta por la importación de fotos bancarias implementada esta sesión, o si sigue pendiente para recibos físicos de compra específicamente — no se tocó esa tabla en esta sesión, queda a definición del usuario.
- Seguir probando la importación por foto con capturas de otros bancos o vistas no probadas todavía.

## Commits de esta sesión

| Hash | Mensaje |
|------|---------|
| `d142d07` | V FSA 0034 — Ícono ❓ para transacciones importadas sin categoría asignada |
| `9a52dde` | V FSA 0035 — Fixes importación (descripción, códigos, recurrentes, agrupación transferencias), fix ícono ❓, banner gastos recurrentes |
| `9fd5031` | V FSA 0036 — Importar transacciones desde foto (OCR client-side con Tesseract.js) |
| `5c88d82` | V FSA 0037 — Detección de duplicados por fecha+monto+palabra compartida, badge de alerta en Registros |
| `12af842` | V FSA 0038 — Conservar categoría del recurrente al reemplazarlo con la transacción real importada |
| `4c12dbc` | V FSA 0039 — OCR foto: soporte fecha MM/DD/YYYY, bloques "En proceso" con fecha de hoy, inferencia de signo por palabra clave |
| `d420356` | V FSA 0040 — OCR foto: eliminar líneas de resumen diario, soporte multi-monto por línea, modo debug |
| `e4d152d` | V FSA 0041 — Fix regresión OCR: ícono de check leído como "@" bloqueaba detección de fecha |
| `70e7381` | V FSA 0042 — Fix etiqueta "Pendiente(s)" no reconocida en OCR de foto |
| `edd4ea2` | V FSA 0043 — Fix duplicados falsos entre bancos distintos en transferencias |
| `7dac1eb` | V FSA 0044 — Detección de banco dinámica contra bancos configurados, abortar con mensaje si no se reconoce |
| `99882a4` | V FSA 0045 — Fix gastos recurrentes duplicados: cooldown contra reprocesos por parpadeos de auth |
