# Pipeline de Importación — Referencia técnica

> Documento de referencia para sesiones futuras. Describe el flujo completo de la sección **Importar** (`index.html`) — CSV/Excel, foto de extracto (OCR) y la asignación manual de banco — función por función, en el orden real de ejecución. Última actualización: V FSA 0057 (2026-06-27).

---

## 1. Punto de entrada (UI)

HTML de la sección: `#section-importar` (línea ~5706).

| Elemento | ID | Línea aprox. |
|---|---|---|
| Zona de drop | `#import-drop-zone` | 5708 |
| Botón seleccionar archivo | `#import-select-btn` | 5715 |
| Input de archivo | `#import-file-input` (`accept=".csv,.xlsx,.xls,image/*"`, `multiple`, `hidden`) | 5725 |
| Botón "Deseleccionar duplicados" | `#import-deselect-dups-btn` | 5740 |
| Tabla de preview | `#import-table` / `#import-tbody` | 5748 / 5768 |
| Checkbox "seleccionar todo" | `#import-select-all` | 5751 |
| `<select>` de banco del encabezado | `#import-th-banco` | 5757 |
| Botón guardar | `#import-confirm-btn` ("Guardar en Registros") | 5784 |
| Botón limpiar | `#import-reset-btn` | 5787 |

`initImportSection()` (línea 17371) conecta los listeners:
- Click en `#import-select-btn` → abre el file picker.
- Drag & drop sobre `#import-drop-zone`.
- `change` del input → `Array.from(fileInput.files).forEach(f => processImportFile(f))`.
- `change` de `#import-th-banco` → asignación masiva de banco (ver sección 5).

Todas las rutas de archivo (CSV, Excel, imagen) convergen en **`processImportFile(file)`** (línea 17199).

---

## 2. Flujo completo, en orden de ejecución

### 2.1 — CSV / Excel

```
processImportFile(file)                          línea 17199
 ├─ si .csv  → parseCSVImport(text)                línea 15892
 │              → processImportRows(rows, name)    línea 16022
 └─ si .xlsx/.xls → parseXLSXImport(buf, name)      línea 16073
                     → (internamente llama processImportRows)

processImportRows(rawRows, filename)               línea 16022
 ├─ findHeaderIdxImport(rawRows)                    línea 15935
 ├─ buildColMapImport(headerRow)                     línea 15953
 ├─ detectBankImport(filename)                        línea 15990 (delega en detectBankFromText, línea 15967)
 │    └─ si no encuentra ningún banco configurado → throw (bankNotDetected:true) — nunca asume en silencio
 └─ por cada fila → cleanBankDescription(rawDesc)     línea 16845
                  → construye el objeto "row" con bankDetected:true (shape en sección 4)
```

### 2.2 — Foto de extracto (OCR)

```
processImportFile(file)                          línea 17199
 └─ si image/*  → processImportImage(file)         línea 16528

processImportImage(file)                          línea 16528
 ├─ loadTesseractLib()                              línea 16511  (carga Tesseract.js 5 vía CDN, lazy)
 ├─ Tesseract.recognize(file, "eng")                → words[] con bounding boxes
 ├─ clusterWordsIntoLines(words)                     línea 16197  (agrupa palabras en líneas por yCenter)
 ├─ stripDividerLines(lines)                         línea 16257  (elimina resúmenes diarios y encabezados de sección)
 ├─ detectBankFromText(linesText)                    línea 15967  (mismo texto YA reconstruido, no el texto crudo de Tesseract)
 ├─ findColumnSplit(lines, imageWidth)                línea 16230  (estima dónde empieza la columna de montos)
 ├─ reconstructTransactionBlocks(lines, xSplit)       línea 16276  (parser de escritorio, 2 columnas)
 │    └─ si devuelve 0 bloques →
 │         reconstructMobileTransactionBlocks(lines)  línea 16385  (parser de app móvil, fecha-encabezado)
 └─ ocrBlocksToImportRows(blocks, banco, bankDetected) línea 16435 (shape en sección 4)
```

### 2.3 — Tramo común (ambas fuentes)

```
[de vuelta en processImportFile]
batchId = importNextBatchId++ ; newRows.forEach(r => r.batchId = batchId)
importRows = [...importRows, ...newRows]
pairZelleRows(importRows)                          línea 16793
detectImportDuplicates(importRows)                 línea 16932
importRows.forEach(r => { if (!r.needsReview) importSelectedIds.add(r._id) })
renderImportTable()                                línea 16959

[usuario revisa preview, ajusta categoría/banco/selección, click "Guardar en Registros"]

bulkImportTransactions()                           línea 17251
 ├─ por cada row seleccionada:
 │   ├─ chequeo de duplicado (por código o por bank+fecha+monto+descripción exacta)
 │   ├─ sharesDescriptionWord(tx.description, row.descripcion) contra tx.isRecurring === true
 │   │    → si hay match: deleteDoc(recurrente) + guarda con " ®" al final
 │   └─ addDoc(transactions, txObj)  con importedFrom: "csv" | "image"
 └─ muestra resumen final (#import-summary)
```

---

## 3. Función por función

### `detectBankFromText(text)` — línea 15967
Lógica de matching **compartida** entre el nombre de archivo (CSV/XLSX) y el texto OCR (foto) — mismo criterio, distinta fuente de texto. Busca el nombre de cada banco configurado en `appState.banks` dentro del texto (case-insensitive), más abreviaciones conocidas (`"boa"`/`"bofa"` → Bank of America, `"wf"`/`"wellsfargo"` → Wells Fargo). Devuelve el nombre exacto tal como está en `appState.banks`, o `null` si no encuentra nada.

### `detectBankImport(filename)` — línea 15990
Delega directamente en `detectBankFromText(filename)`. Si no encuentra ningún banco configurado en el nombre del archivo, **lanza un error** (`err.bankNotDetected = true`) pidiendo al usuario que renombre el archivo — nunca asume un banco en silencio para CSV/Excel (a diferencia de la foto, donde sí hay un fallback, ver más abajo).

### `cleanBankDescription(raw)` — línea 16845
La función más compleja del pipeline. Pasos en orden (el orden importa, ver "Lecciones aprendidas" más abajo):
1. **Strip de prefijos**: `"<algo> Authorized On MM/DD"` (genérico, no exige literalmente "Purchase"), `Pos Purchase/Debit`, `Payment To`, `Zelle (Payment) To/From`, `Recurring Transfer To/From`, y genérico `Purchase|Debit|Credit|Withdrawal` al inicio.
2. Descarta el primer token si el texto queda como `"WORD - resto"` (prefijos de red bancaria tipo `"Cfx - "`).
3. **Limpieza de ruido** (antes de buscar el código — importante, ver lecciones): `Card\s*\d+`, teléfonos `\d{3}-\d{3}-\d{4}`, abreviaciones de estado de EE.UU. (**sin incluir `"ID"`**, ver lecciones), fechas `MM/DD`, `A/R`/`A/P`, `Ending In \d+`. El símbolo `*` se reemplaza por espacio (separador, no se trunca lo que sigue).
4. **Extracción de código de transacción**, en este orden de prioridad:
   - S-code de BoA: `\bS\d{12,}\b`
   - `ID[:\s]+(\d{8,})` (cubre `"Web Id:"`, `"PPD ID:"`, `"CO ID:"`, etc. — genérico, no exige la palabra "Web")
   - `REF\s*#` o `Conf\s*#` seguido de 5+ caracteres alfanuméricos
   - Fallback mayúsculas: `[A-Z0-9]{12,}` contiguo
   - Fallback mixto: token de 6+ caracteres con al menos una letra y un dígito (cubre códigos en minúsculas como `JPM99ck2sro5`)
5. **Extracción del nombre del comercio**: separa en palabras, **cada palabra se trunca en el primer carácter especial que no sea `-`** (ej. `"Apple.com/bill"` → `"Apple"`), se eliminan palabras duplicadas consecutivas (case-insensitive), se toman las primeras 1-2 palabras.
6. Retorna `"Nombre - CÓDIGO"`, solo `"Nombre"` si no hay código, o el raw original si no se pudo extraer nada.

### `extractImportCode(desc)` — línea 16923
Versión simplificada usada solo para **comparar duplicados** (no para limpiar): reconoce S-code o un número de 8+ dígitos. Si la descripción no tiene ninguno, retorna `null`.

### `pairZelleRows(rows)` — línea 16793
Después de parsear todas las filas del archivo (y antes del preview), revisa las marcadas `isZelleCandidate: true` (descripción raw contiene "zelle"):
1. Empareja dentro del mismo batch por `sharesRefToken()` + mismo monto absoluto + fecha ±1 día + banco distinto.
2. Para las que no encontraron par en el batch, busca en `appState.transactions` (transferencias Zelle ya guardadas) con el mismo criterio.
3. Solo si hay par confirmado en cualquiera de las dos fuentes → `type: 'transfer'` + `transferDirection`. Sin par → queda como `income`/`expense` según el signo.

### `detectImportDuplicates(rows)` — línea 16932
Marca `row.duplicado = true/false` comparando contra `appState.transactions`: primero por código extraído (`extractImportCode`) + fecha + monto; si no hay código, cae al criterio de **fecha + monto + palabra compartida en la descripción** (`sharesDescriptionWord`), exigiendo además **mismo banco** — dos lados de una transferencia real entre bancos distintos no son duplicados.

### `renderImportTable()` — línea 16959
Pinta la tabla de preview: checkbox de selección, fecha, descripción (con tooltip mostrando `descripcionRaw`), categoría (ícono "?" clicable si no hay categoría asignada — mismo `UNKNOWN_ICON` que usa Registros), banco (badge clicable, ver sección 5), monto (texto con clases `amount--income`/`amount--expense`, o un `<input>` editable si `needsReview`), badge de duplicado ⚠️. Al final llama `updateImportThBancoSelect()` para sincronizar el `<select>` del encabezado.

### `bulkImportTransactions()` — línea 17251
Al hacer click en "Guardar en Registros": por cada fila seleccionada, vuelve a chequear duplicado (mismo criterio por código), busca si hay un gasto recurrente (`tx.isRecurring === true`) que comparta una palabra (4+ caracteres, función `sharesDescriptionWord`, línea 7773) con la descripción importada dentro de ±5 días — si lo encuentra, borra el recurrente y guarda la transacción real con `" ®"` añadido a la descripción. Guarda con `importedFrom: "csv"` o `"image"`.

### Pipeline de foto — funciones de OCR

| Función | Línea | Para qué |
|---|---|---|
| `loadTesseractLib()` | 16511 | Carga `tesseract.js@5` vía CDN una sola vez (lazy, solo si el usuario sube una imagen). |
| `clusterWordsIntoLines(words)` | 16197 | Agrupa las palabras detectadas por Tesseract en líneas según su `yCenter` (tolerancia = 60% de la altura promedio de palabra), y dentro de cada línea las ordena por `xLeft`. |
| `findColumnSplit(lines, imageWidth)` | 16230 | Busca el `xLeft` mínimo entre todos los tokens que "parecen monto" (`looksLikeAmountToken`) y lo usa como frontera entre la columna de descripción (izquierda) y la de monto (derecha). Si no encuentra ningún monto, usa 60% del ancho de imagen como fallback. |
| `stripDividerLines(lines)` | 16257 | Elimina líneas de resumen diario (`OCR_SKIP_LINE_RE`: "fecha de registro", "saldo diario final", etc. — arrastra también la línea siguiente si el valor viene separado) y encabezados de sección sin valor propio (`OCR_SKIP_STANDALONE_LINE_RE`: "transacciones pendientes/autorizadas/registradas" de Wells Fargo — **no** arrastra la línea siguiente, porque esa sí es una transacción real). |
| `reconstructTransactionBlocks(lines, xSplit)` | 16276 | Parser de **escritorio**: asume 2 columnas fijas. Cada línea con fecha al inicio (izquierda) abre un bloque nuevo; las líneas siguientes sin fecha se acumulan como descripción, **salvo** que el bloque vigente ya tenga un monto asignado Y la línea actual traiga uno nuevo — en ese caso es una segunda transacción del mismo día sin fecha repetida (ej. Chase desktop), y se abre un bloque nuevo conservando la fecha del bloque anterior. |
| `reconstructMobileTransactionBlocks(lines)` | 16385 | Parser de **app móvil** (fallback si el de escritorio devuelve 0 bloques): una fecha-encabezado aplica a varias transacciones debajo (no se repite por fila), y el monto puede venir junto al saldo en cualquier orden en la misma línea (`pickMobileAmountToken` prioriza el token con signo explícito). Descarta ruido de interfaz (`MOBILE_UI_NOISE_RE`: reloj, máscara de cuenta, botones, "Mostrar detalles", etc.) y hace backfill retroactivo de fecha en bloques creados antes de verla. |
| `ocrBlocksToImportRows(blocks, banco, bankDetected)` | 16435 | Convierte los bloques (`{fecha, descLines, amountTexts, balanceTexts}`) en el shape de "row" (sección 4). Si no hay monto del lado derecho, busca un token de monto dentro de la descripción como respaldo. Si el monto no trae signo explícito, infiere ingreso/gasto por palabra clave (`OCR_EXPENSE_KEYWORDS_RE`/`OCR_INCOME_KEYWORDS_RE`); si es ambiguo, marca `needsReview: true` y deja un `<input>` editable en el preview. |

---

## 4. Shape exacto del objeto "row"

Producido por `processImportRows` y por `ocrBlocksToImportRows` (y debe replicarse igual por cualquier nueva fuente de datos):

```javascript
{
  _id: importNextId++,        // contador incremental global
  batchId: number,            // asignado en processImportFile — identifica de qué
                               // archivo/captura vino la fila (ver sección 5)
  fecha: "YYYY-MM-DD",
  descripcion: String,        // ya pasada por cleanBankDescription(descripcionRaw)
  descripcionRaw: String,     // texto original, se muestra en el tooltip
  categoria: "",               // se asigna en el preview
  banco: String,
  bankDetected: boolean,       // true = se encontró el banco en el texto/nombre de
                               // archivo; false = suposición (solo posible en foto)
  monto: number,               // negativo = gasto, positivo = ingreso
  type: "expense" | "income" | "transfer", // monto < 0 ? "expense" : "income"
                               // (pairZelleRows puede reescribirlo a "transfer")
  isZelleCandidate: boolean,   // descripcionRaw.toLowerCase().includes("zelle")
  duplicado: false,            // se calcula después con detectImportDuplicates
  needsReview: boolean,        // solo en filas de foto — monto/signo ambiguo,
                               // el preview muestra un <input> en vez de texto
}
```

---

## 5. Asignación manual de banco (V FSA 0056–0057)

### Por qué existe
La detección automática de banco solo funciona si el banco aparece como **texto legible** en la captura (ej. Wells Fargo lo muestra en el encabezado de la página). La mayoría de bancos (Bank of America, Chase) solo muestran su logo — eso no es texto, Tesseract no lo lee, y no hay forma de mejorar la detección por regex para ese caso: es una limitación estructural, no un bug. La solución es dejar corregir el banco a mano de forma rápida, en vez de perseguir una detección perfecta imposible.

### Por fila — badge clicable (`renderImportTable`, ~línea 17059-17103)
Cada fila muestra un badge de color (`import-bank-badge` + `bankBadgeClass(banco)` para el color por banco). Al hacer click, el badge se **reemplaza por completo** (no se anida dentro) por un `<select>` con las opciones de `appState.banks`; al elegir uno, se actualiza `row.banco`, se marca `row.bankDetected = true`, y se vuelve a renderizar la tabla (lo que reconstruye el badge actualizado). Si `row.bankDetected === false`, aparece un ⚠️ (clase `import-dup-badge`, reutilizada) junto al badge con tooltip explicando que es una suposición.

> ⚠️ Importante: el `<select>` debe **reemplazar** al elemento que tiene el listener de click, nunca quedar anidado dentro de él — si el select queda como hijo del mismo elemento clicable, abrir la lista nativa dispara de nuevo el listener del padre (el click "rebota"), reconstruyendo y cerrando el select antes de poder elegir nada.

### Por lote — `<select>` del encabezado (`updateImportThBancoSelect`, línea 17464; listener en `initImportSection`, línea 17447)
El encabezado "Banco" de la tabla (`#import-th-banco`) es un `<select>` real y permanente, no un texto que se convierte en uno al hacer click — un `<select>` creado dinámicamente nunca abre su lista nativa de forma confiable solo con `focus()`/`click()` programático entre navegadores, así que la única forma robusta es que ya sea un `<select>` real desde el principio.

Al elegir un banco ahí, se aplica a **todas las filas de `importRows`**, marcándolas `bankDetected: true`. Para que esto sea seguro, el select se deshabilita salvo que **todas las filas vengan del mismo `batchId`** (mismo archivo/captura) — si hay varias capturas de bancos distintos mezcladas en la misma tabla (el input de archivo permite seleccionar varias imágenes a la vez), aplicar "a todas" pisaría bancos ya correctos de otra imagen del lote. `batchId` se asigna en `processImportFile` con un contador (`importNextBatchId`) que se reinicia en `resetImportState()`.

La opción placeholder ("Banco ▾") se marca `disabled hidden` para que no aparezca como una opción más al abrir la lista, solo como el texto visible del control cerrado.

---

## 6. Funciones auxiliares reutilizadas en otras partes de la app

| Función | Línea | Para qué |
|---|---|---|
| `sharesRefToken(descA, descB)` | 8202 | Compara los últimos 5 caracteres de tokens alfanuméricos (6+ chars, con al menos un dígito) entre dos descripciones — detecta si comparten el mismo código de referencia bancario (usado en `pairZelleRows` y en `buildInternalPairMap`/`buildTransferPairPartners`). |
| `sharesDescriptionWord(descA, descB)` | 7773 | Compara TODAS las palabras (sin `®`, 4+ caracteres) entre dos descripciones — `true` si comparten al menos una, sin importar la posición. Usado para reemplazo de gastos recurrentes (al importar y al abrir la app) y para duplicados entre capturas/CSV. |
| `withinDays(dateA, dateB, margin)` | 7784 | Diferencia en días entre dos fechas ≤ margin. |
| `buildInternalPairMap(transactions)` | 8215 | Detecta pares de transferencia confirmados (misma fecha+monto, banco distinto, `sharesRefToken`) y devuelve `Map<id, 'send'|'recv'>` — usado para saldos. |
| `buildTransferPairPartners(transactions)` | 8266 | Mismo criterio que la anterior, pero devuelve `Map<id, partnerId>` — usado en Registros para mantener ambos lados de una transferencia siempre adyacentes en la tabla sin romper la columna de Saldo. |
| `buildCatDisplay(name, type, isImported)` / `UNKNOWN_ICON` | 10772 / 10766 | Ícono de categoría en Registros. Si `isImported` es `true` y no hay categoría asignada y no es transferencia → ícono ❓ (círculo naranja con signo de interrogación blanco) — el mismo ícono que ahora usa también la tabla de preview de Importar. |

---

## 7. Lecciones aprendidas (errores ya corregidos — no repetirlos)

1. **Orden de limpieza de ruido vs. extracción de código importa.** Si se busca el código ANTES de limpiar ruido, un número de tarjeta enmascarado sin espacio (`CARD0149`) puede confundirse con un código real. La limpieza de ruido va PRIMERO.
2. **`"ID"` es una trampa.** La lista de abreviaciones de estado de EE.UU. incluye `"ID"` (Idaho). En descripciones bancarias, `"ID"` casi siempre significa "Identification" (`Web Id:`, `PPD ID:`). Se excluyó deliberadamente de la lista de limpieza de ruido.
3. **Doble codificación URI en SVG data-URI.** Si se construye un ícono SVG como string con `%23` (ya codificado) y luego se pasa por `encodeURIComponent()`, el `%` se vuelve a codificar y el color queda inválido (ícono invisible, sin error visible). Usar siempre el carácter literal y dejar que `encodeURIComponent()` lo codifique una sola vez.
4. **Coincidencia por "primera palabra" es demasiado estricta.** Para reemplazo de recurrentes y detección de duplicados se usa coincidencia de **cualquier palabra compartida** (mínimo 4 caracteres, `sharesDescriptionWord`), no solo la primera palabra.
5. **Reordenar visualmente sin romper la cadena de saldo.** Para agrupar pares de transferencia de forma adyacente sin generar saltos en la columna Saldo, ambos lados del par deben compartir el mismo criterio de orden en el cálculo del saldo y en el renderizado (no solo reordenar la tabla final).
6. **El texto crudo de Tesseract (`ocrResult.data.text`) no es confiable para nada que no sea lectura libre.** Reordena la lectura con su propia heurística y puede mezclar columnas de forma distinta al `lines` ya reconstruido (agrupado por `clusterWordsIntoLines` + ordenado por `xLeft`). Cualquier lógica que necesite posición/orden real (detección de banco incluida) debe usar `lines`, no el texto crudo — causó el bug "Wells Fargo detectado como Chase".
7. **Un `<select>` creado dinámicamente no abre su lista nativa de forma confiable con `focus()`/`click()` programático.** No hay API de navegador garantizada para forzar la apertura de un listbox nativo. Si la interacción necesita abrirse en el primer click, el elemento debe ser un `<select>` real desde el principio (deshabilitado/habilitado según corresponda), no un texto que se convierte en `<select>` al hacer click.
8. **Un `<select>` no debe quedar anidado dentro del mismo elemento que tiene el listener que lo creó.** El click para abrir la lista nativa "rebota" hacia el padre y vuelve a disparar el mismo listener, reconstruyendo (y cerrando) el select antes de poder elegir. El elemento clicable debe **reemplazarse por completo**, no envolver al select.
9. **Fondo transparente en un `<select>` rompe el modo oscuro.** Si el fondo del `<select>` usa `color-mix(..., transparent)`, el navegador puede renderizar la lista de `<option>` con fondo blanco por defecto sin importar el tema de la app. Para selects propios, usar siempre un color de fondo sólido (token de tema, ej. `var(--color-surface-2)`) tanto en el select como en sus `option`, más `color-scheme: dark`/`light` explícito según `data-theme`.
10. **El reset global `img { display: block; }` rompe el alto de línea si se mete un `<img>` dentro de un elemento en línea.** Un `<img>` de bloque dentro de un `<span>` en línea genera una caja de línea extra y puede casi duplicar el alto de la fila de una tabla. Hay que forzar `display: inline-block` (o `inline`) en el `<img>` puntual cuando se usa en ese contexto, sin tocar el reset global.
11. **Los emoji (ej. ⚠️) sin `line-height` explícito pueden inflar el alto de toda la línea.** Las métricas internas de las fuentes de emoji a color suelen ser mucho más altas que el texto normal. Cualquier badge/ícono basado en emoji dentro de una tabla debe fijar `line-height: 1` (y opcionalmente `display: inline-block`) para no arrastrar el alto de la fila completa.
12. **Verificar sintaxis del script correcto.** El código de la app vive en un `<script type="module">` (no en los `<script>` sin atributos, que son triviales). Cualquier validación de sintaxis con `new Function(code)` debe extraer específicamente ese bloque — `new Function` no soporta `import`, así que un chequeo que "salte" los módulos puede terminar verificando scripts vacíos sin darse cuenta. Usar `node --check archivo.mjs` sobre el contenido extraído del script módulo.

---

## 8. Cómo extender este pipeline (ej. nueva fuente de datos)

Cualquier nueva forma de traer transacciones debe:
1. Producir un array de objetos con el **shape exacto de la sección 4** (incluyendo `bankDetected` — `true` si la fuente puede confirmar el banco sin ambigüedad, como un nombre de archivo; `false` solo si es una suposición que el usuario debería revisar).
2. Insertarse en el flujo en el mismo punto donde hoy se hace `importRows = [...importRows, ...newRows]`, después de asignar `batchId` (en `processImportFile`).
3. Dejar que `pairZelleRows`, `detectImportDuplicates`, `renderImportTable` y `bulkImportTransactions` se ejecuten sin modificación — todo ese código ya es agnóstico al origen de los datos.
4. Reutilizar `cleanBankDescription(descripcionRaw)` para producir el campo `descripcion` — no reimplementar limpieza de texto en paralelo.
