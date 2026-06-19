# Plan — Importar transacciones desde foto (OCR client-side con Tesseract.js)

> Nota: el plan anterior de importación (limpieza de descripción, ®, Zelle, ícono ❓) ya se implementó y publicó como V FSA 0031–0035. Este documento es la siguiente mejora solicitada, todavía **no implementada** — queda pendiente de aprobación final antes de tocar `index.html`.

## Contexto

El usuario quiere poder subir una **foto/captura de pantalla** de su app bancaria (ej. historial de transacciones de Bank of America móvil) y que Foresee extraiga las transacciones automáticamente, aplicando el **mismo criterio de limpieza y de-duplicación** que ya usa la importación CSV/Excel (`cleanBankDescription`, `pairZelleRows`, `detectImportDuplicates`, preview con checkboxes antes de guardar).

Esto corresponde a la "Mejora 7: Escaneo de recibos (OCR)" de su roadmap (`MD/plan-mejoras.md`), aplicada primero a capturas de extracto bancario.

**Decisión de arquitectura ya tomada con el usuario** (tras aclarar que Claude no puede operar dentro de la app en vivo): se implementa con **Tesseract.js**, una librería de OCR 100% client-side (corre en el navegador del usuario), gratis, sin API externa, sin Cloud Functions ni cambios al plan de Firebase. Se descartó explícitamente usar una API de IA con visión por el costo y la complejidad de infraestructura (Cloud Functions + plan Blaze).

**No se modifica la lógica interna de ninguna función existente del pipeline CSV/XLSX** (`cleanBankDescription`, `pairZelleRows`, `detectImportDuplicates`, `bulkImportTransactions`). Todo el código nuevo es aditivo y se conecta al pipeline produciendo el mismo "shape" de objeto que ya produce `processImportRows`.

---

## Anclas confirmadas en el código existente (no se modifica su lógica interna)

| Elemento | Línea aprox. | Nota |
|---|---|---|
| `let importRows = []; importSelectedIds; importNextId; importPendingRowId;` | 15360-15363 | Estado global del módulo de importación |
| `cleanBankDescription(raw)` | 15535 | Función pura, reutilizada tal cual |
| `extractImportCode(desc)` | ~15672 | No se toca |
| `detectImportDuplicates(rows)` | ~15683 | No se toca |
| `detectBankImport(filename)` | 15450 | Solo aplica a CSV/XLSX (tiene filename útil); para foto no hay nombre de banco fiable, ver sección "Banco sin filename" |
| `processImportRows(rawRows, filename)` | 15488 | Define el "shape" de row que la función OCR debe imitar |
| `parseXLSXImport(buf, filename)` | ~15532 | Patrón de función "productora de rows" a imitar para imágenes |
| `pairZelleRows(rows)` | ~15544 | Se reutiliza sin cambios sobre las rows producidas por OCR |
| `processImportFile(file)` | 15865 | Dispatcher por extensión — único punto que gana una rama nueva |
| `bulkImportTransactions()` | 15904 | No se toca |
| `showLoading()` / `hideLoading()` | 6999-7005 | Overlay con `<p class="loading-text">` ya existente en el HTML (línea 4412) — se reutiliza ese nodo para mostrar progreso, no se crea una clase nueva |
| `renderImportTable()` | 15703 | Se le agrega manejo de la bandera `needsReview` (ver sección 6) |
| HTML sección Importar | 5563-5652 | `#import-file-input` (5581, `accept=".csv,.xlsx,.xls"`, `multiple`, `hidden`), `#import-drop-zone`, `#import-tbody`, `#import-confirm-btn` |
| `initImportSection()` | 16015 | Listeners de click/drag/drop/change sobre el input — no cambian, solo se amplía qué tipos de archivo dispara `processImportFile` |
| CDN scripts `<head>` | líneas 21-24 | Chart.js, jsPDF, jspdf-autotable, xlsx — **no se agrega Tesseract.js aquí** (ver lazy load) |

**Shape exacto que debe producir la función OCR** (igual al de `processImportRows`):
```javascript
{
  _id: importNextId++,
  fecha: "YYYY-MM-DD",
  descripcion: String,       // ya pasada por cleanBankDescription(descripcionRaw)
  descripcionRaw: String,
  categoria: "",
  banco: String,
  monto: number,             // negativo = gasto, positivo = ingreso
  type: "expense" | "income",
  isZelleCandidate: boolean,
  duplicado: false,
  needsReview: boolean,       // NUEVO campo, false para CSV/XLSX (no aplica), true en OCR cuando no se pudo extraer un monto válido
}
```

---

## 1. Algoritmo de reconstrucción de filas desde la imagen

Tesseract.js puede devolver texto plano (`data.text`, orden de lectura que puede mezclar columnas en un layout de dos columnas) o palabras con bounding boxes (`data.words`, cada una `{text, bbox:{x0,y0,x1,y1}, confidence}`). **Se trabaja con `data.words`**, no con el texto plano, para poder distinguir la columna izquierda (fecha + descripción) de la derecha (monto + saldo), que es como están organizadas las capturas de apps bancarias (confirmado con la captura de BoA que compartió el usuario).

### Paso 1 — Agrupar palabras en líneas horizontales (clustering por Y)
Agrupar palabras cuyo centro vertical (`(y0+y1)/2`) esté dentro de una tolerancia (proporcional a la altura media de los bounding boxes, no un valor fijo) — esto reconstruye cada "línea visual" de la captura, ordenadas de arriba a abajo y, dentro de cada línea, de izquierda a derecha.

### Paso 2 — Separar columna izquierda vs derecha (por X)
Calcular dinámicamente el punto de corte horizontal (`xSplit`) buscando los tokens que "parecen monto" (`looksLikeAmountToken`: patrón `$123.45`, `-$123.45`, `(123.45)`, tolerando confusión OCR de `$` con `S`/`5`) y usando el X mínimo de esos tokens menos un margen. Si no se detecta ningún token de monto, usar un fallback de 60% del ancho de la imagen. Cada línea se separa en `leftWords` / `rightWords` según `xLeft` respecto a `xSplit`.

### Paso 3 — Detectar inicio de un bloque de transacción (línea con fecha)
Patrón esperado en la columna izquierda: `"MMM D, YYYY"` o `"MMM DD, YYYY"` (ej. "Jun 15, 2026"), tolerando errores típicos de OCR (`O`/`o` → `0`, `I`/`l` → `1` en el día). Se usa como **prefijo** (no full-match) porque en algunos layouts la fecha puede compartir línea con el inicio de la descripción.

### Paso 4 — Agrupar líneas de descripción multilínea hasta el siguiente bloque
Recorrer las líneas en orden; cuando la columna izquierda matchea una fecha, se cierra el bloque anterior y se abre uno nuevo. Mientras no aparezca una nueva fecha, las líneas izquierdas se acumulan como descripción y las líneas derechas que parecen monto se clasifican: **la primera detectada en el bloque = monto de la transacción; la segunda = saldo (se descarta, no se necesita)**.

### Paso 5 — Construir la descripción final del bloque
Concatenar las líneas de descripción acumuladas, normalizar espacios — esta es la `descripcionRaw` que luego pasa por `cleanBankDescription()` (la misma función que ya usa el flujo CSV, sin cambios).

---

## 2. Parseo de fecha y monto OCR

- **Fecha**: `MONTH_MAP` (jan-dec en inglés) + regex tolerante a errores de OCR en el día → normaliza a `"YYYY-MM-DD"`.
- **Monto**: función nueva `parseOcrAmount(rawText)`, **separada de `normalizeImportAmount`** (la que usa el flujo CSV) porque debe tolerar casos que CSV nunca tiene: confusión de `$` con `S`/`5`, paréntesis como negativo, espacios sueltos insertados por el OCR entre dígitos. Si el texto no matchea el patrón final `\d+\.\d\d` tras la limpieza, retorna `null` (no se inventa un número) y la fila se marca `needsReview: true` en vez de descartarse silenciosamente.

---

## 3. Nuevas funciones y dónde insertarlas

**Ubicación:** entre `parseXLSXImport` (línea ~15542) y `pairZelleRows` (línea ~15544) — agrupa toda la "producción de rows" en un solo lugar, antes de las funciones de post-procesamiento (pairing, duplicados, render) que ya son agnósticas al origen del dato.

Orden interno del nuevo bloque:
1. `looksLikeAmountToken(text)`
2. `parseOcrAmount(rawText)`
3. `MONTH_MAP`, `tryParseOcrDateLine(text)`, `extractLeadingOcrDate(text)`
4. `clusterWordsIntoLines(words, yTolerance)`
5. `findColumnSplit(lines, imageWidth)`
6. `classifyRightToken(block, rightText)`
7. `reconstructTransactionBlocks(lines, xSplit)`
8. `buildDescripcionRaw(block)`
9. `ocrBlocksToImportRows(blocks, banco)` — convierte los bloques en objetos con el shape exacto (aplicando `cleanBankDescription` igual que CSV)
10. `loadTesseractLib()` + variable `_tesseractLoadPromise` (carga diferida, ver sección 5)
11. `processImportImage(file)` — orquestador público, mismo rol que `parseXLSXImport` pero para imágenes

### Integración en `processImportFile` (línea 15865)
Única función existente que cambia, y solo para añadir una rama (sin tocar las ramas csv/xlsx ya existentes):
```javascript
} else if (file.type && file.type.startsWith("image/")) {
  newRows = await processImportImage(file);
} else {
  showToast("Formato no soportado. Usa .csv, .xlsx o una imagen", "error");
  return;
}
```
El resto de `processImportFile` (líneas 15888-15902: chequeo de `newRows.length`, concatenación a `importRows`, `pairZelleRows`, `detectImportDuplicates`, `renderImportTable`, toggles de visibilidad) se reutiliza **literalmente sin cambios** — ese es justamente el objetivo del diseño.

**Ajuste puntual en la auto-selección** (línea 15898, dentro de `processImportFile`): hoy agrega *todas* las rows nuevas a `importSelectedIds`. Se cambia a excluir las que tengan `needsReview: true`, para forzar revisión manual antes de incluirlas:
```javascript
importRows.forEach((r) => { if (!r.needsReview) importSelectedIds.add(r._id); });
```

---

## 4. Integración de UI

**Se amplía el input existente, no se crea un botón separado** — reutiliza el drag&drop y el listener `change` ya cableados en `initImportSection()` (línea 16033), mínima superficie nueva.

- Línea 5581: `accept=".csv,.xlsx,.xls"` → `accept=".csv,.xlsx,.xls,image/*"` (mismos atributos `multiple` y `hidden`).
- Textos de ayuda (líneas 5571-5572 y 5577-5579): mencionar también "una captura de pantalla (imagen)".
- **No** usar el atributo `capture` — en móvil, `accept="image/*"` ya abre un selector que ofrece tanto Cámara como Galería; el caso de uso principal es importar una captura ya tomada, no forzar la cámara.

### Banco sin filename útil
`detectBankImport(filename)` depende del nombre de archivo, que para una foto suele ser genérico. Para OCR: usar como fallback `appState.banks[0]` (banco principal configurado por el usuario) — el usuario puede corregirlo en la tabla de preview, donde el banco **ya es editable inline** (dropdown existente en `renderImportTable`, línea ~15793). No se intenta inferir el banco del propio texto OCR en esta v1 (queda documentado como limitación, sección 7).

### Fila con `needsReview: true` (sin monto detectado)
`renderImportTable()` (línea 15703) no tiene hoy un input editable para `monto` (solo texto). Se necesita un cambio puntual: cuando `row.needsReview` es `true`, la celda de monto se renderiza como un `<input type="number">` editable (en vez de texto), para que el usuario pueda corregirlo manualmente antes de seleccionar la fila; además se le agrega una clase CSS de advertencia a la fila. El resto de columnas (fecha, descripción, categoría, banco) se renderizan igual que cualquier otra row.

---

## 5. Carga de Tesseract.js — lazy loading (no en `<head>`)

CDN: `https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js` (mismo proveedor jsdelivr que ya se usa para Chart.js, línea 21). Tesseract.js gestiona internamente la descarga de su worker y del modelo de idioma inglés (~10-15MB) desde su propio CDN.

**No se agrega al `<head>`** — penalizaría el arranque de la PWA para el 100% de usuarios aunque solo una fracción use esta función. Se inyecta dinámicamente vía `loadTesseractLib()` (crea un `<script>` y resuelve una promesa al cargar) **solo la primera vez** que el usuario sube una foto en la sesión; llamadas subsecuentes resuelven de inmediato porque `window.Tesseract` ya existe.

Esto significa que la función requiere conexión a internet la primera vez que se usa (a diferencia del resto de la app, que funciona offline tras el primer login) — se documenta como limitación (sección 7), no es un blocker de diseño.

---

## 6. UX durante el OCR: progreso, fallos y filas dudosas

- **Progreso:** Tesseract.js acepta un `logger` que reporta `{status: "recognizing text", progress: 0..1}`. Se reutiliza el nodo `<p class="loading-text">` ya existente dentro de `#loading-overlay` (línea 4412) para mostrar "Leyendo imagen... NN%" — requiere que `showLoading()` acepte un parámetro `message` opcional (retrocompatible: las llamadas existentes sin argumento siguen funcionando igual).
- **Ninguna fila detectada:** ya cubierto por el flujo existente — `processImportFile` (línea 15888) muestra un toast de advertencia si `newRows.length === 0`. Se aplica igual si `processImportImage` devuelve un array vacío.
- **Fecha detectada pero sin monto válido:** la fila NO se descarta — se incluye con `monto: 0` y `needsReview: true` (diseño de `ocrBlocksToImportRows`, sección 3). Queda excluida de la auto-selección y con el monto editable en el preview (sección 4).
- **Manejo de errores de carga/OCR:** si `loadTesseractLib()` falla (sin conexión) o Tesseract lanza una excepción, se deja que burbujee — el `try/catch` que ya existe en `processImportFile` (línea 15880) la captura y muestra el toast de error genérico ya existente, sin necesidad de duplicar manejo de errores.

---

## 7. Limitaciones a documentar para el usuario (texto de ayuda / tooltip)

- Función en fase beta: el OCR puede tener errores de lectura en fuentes pequeñas, capturas borrosas o montos con muchos dígitos — revisar cuidadosamente el preview antes de guardar (la tabla de preview ya existente, con checkboxes y edición inline, es la red de seguridad).
- Requiere conexión a internet la primera vez que se usa (descarga del motor OCR).
- Funciona mejor con capturas nítidas, sin recortes, con el texto vertical (no rotado).
- El banco no se detecta automáticamente desde la imagen — se asigna el banco principal configurado, corregible en el preview.

---

## Resumen de archivos/funciones a tocar (todo dentro de `index.html`)

**Funciones nuevas** (insertar entre línea ~15542 y ~15544): `looksLikeAmountToken`, `parseOcrAmount`, `MONTH_MAP` + `tryParseOcrDateLine` + `extractLeadingOcrDate`, `clusterWordsIntoLines`, `findColumnSplit`, `classifyRightToken`, `reconstructTransactionBlocks`, `buildDescripcionRaw`, `ocrBlocksToImportRows`, `loadTesseractLib` (+ `_tesseractLoadPromise`), `processImportImage`.

**Funciones existentes con cambio mínimo aditivo:**
- `processImportFile` (línea 15865): nueva rama `else if` para `image/*`.
- Línea 15898: excluir `needsReview` de la auto-selección.
- `showLoading` (línea 6999): parámetro `message` opcional, retrocompatible.
- `renderImportTable` (línea 15703): clase de advertencia + input editable de monto cuando `row.needsReview`.

**HTML con cambio mínimo:**
- Línea 5581: `accept` del input amplía a incluir `image/*`.
- Líneas 5571-5572 y 5577-5579: textos de ayuda mencionan la opción de foto.
- No se toca el `<head>` (líneas 21-25) — Tesseract.js se inyecta dinámicamente, nunca ahí.

---

## Verificación

1. Subir la captura de BoA que compartió el usuario (7 transacciones visibles) → el preview debe mostrar 7 filas con fecha/monto/descripción razonablemente correctos, pasando por `cleanBankDescription` igual que CSV (ej. el Zelle con `Conf# xstjnz0kp` debería limpiar a algo como `"Melecio Matos - xstjnz0kp"`).
2. Verificar que el banco asignado por defecto sea editable en el dropdown del preview, igual que con CSV.
3. Forzar un caso de fila sin monto detectable (recortar una captura a propósito) → la fila debe aparecer con `needsReview`, des-seleccionada, con el monto editable manualmente.
4. Confirmar que subir un CSV/XLSX sigue funcionando exactamente igual que antes (regresión cero sobre el flujo existente).
5. Confirmar que la primera carga de la app (sin usar la función de foto) no descarga Tesseract.js — revisar la pestaña Network del navegador.
6. Probar sin conexión a internet la primera vez que se sube una foto → debe mostrar el toast de error existente ("No se pudo leer el archivo..."), no un error sin manejar en consola.
