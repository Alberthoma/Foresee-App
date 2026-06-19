# Pipeline de Importación CSV/Excel — Referencia técnica

> Documento de referencia para sesiones futuras. Describe el flujo completo de la sección **Importar** (`index.html`), función por función, en el orden real de ejecución. Última actualización: V FSA 0035 (2026-06-17).

---

## 1. Punto de entrada (UI)

HTML de la sección: `#section-importar` (línea ~5566).

| Elemento | ID | Línea aprox. |
|---|---|---|
| Zona de drop | `#import-drop-zone` | 5568 |
| Botón seleccionar archivo | `#import-select-btn` | 5574 |
| Input de archivo | `#import-file-input` (`accept=".csv,.xlsx,.xls"`, `multiple`, `hidden`) | 5581 |
| Tabla de preview | `#import-table` / `#import-tbody` | 5606-5619 |
| Botón guardar | `#import-confirm-btn` ("Guardar en Registros") | 5634 |
| Botón limpiar | `#import-reset-btn` | 5637 |

`initImportSection()` (línea 16015) conecta los listeners:
- Click en `#import-select-btn` → abre el file picker.
- Drag & drop sobre `#import-drop-zone`.
- `change` del input → `Array.from(fileInput.files).forEach(f => processImportFile(f))`.

Todas las rutas convergen en **`processImportFile(file)`**.

---

## 2. Flujo completo, en orden de ejecución

```
processImportFile(file)                         línea 15865
 ├─ si .csv  → parseCSVImport(text)               línea 15377
 │              → processImportRows(rows, name)   línea 15488
 └─ si .xlsx/.xls → parseXLSXImport(buf, name)     línea 15532
                     → (internamente llama processImportRows)

processImportRows(rawRows, filename)              línea 15488
 ├─ findHeaderIdxImport(rawRows)                   línea 15420
 ├─ buildColMapImport(headerRow)                    línea 15438
 ├─ detectBankImport(filename)                       línea 15450
 └─ por cada fila → cleanBankDescription(rawDesc)    línea 15596
                  → construye el objeto "row" (shape en sección 4)

[de vuelta en processImportFile]
importRows = [...importRows, ...newRows]
pairZelleRows(importRows)                          línea 15544
detectImportDuplicates(importRows)                 línea 15683
importRows.forEach(r => importSelectedIds.add(r._id))   ← auto-selecciona todo
renderImportTable()                                línea 15703

[usuario revisa preview, ajusta categoría/banco/selección, click "Guardar en Registros"]

bulkImportTransactions()                           línea 15904
 ├─ por cada row seleccionada:
 │   ├─ chequeo de duplicado (por código o por bank+fecha+monto+descripción exacta)
 │   ├─ sharesDescriptionWord(tx.description, row.descripcion) contra tx.isRecurring === true
 │   │    → si hay match: deleteDoc(recurrente) + guarda con " ®" al final
 │   └─ addDoc(transactions, txObj)  con importedFrom: "csv"
 └─ muestra resumen final (#import-summary)
```

---

## 3. Función por función

### `detectBankImport(filename)` — línea 15450
Busca palabras clave en el **nombre del archivo** (case-insensitive): `"bank of america"`/`"boa"` → `"Bank of America"`, `"chase"` → `"Chase"`, `"wells fargo"`/`"wellsfargo"` → `"Wells Fargo"`. Si no coincide nada, usa el nombre del archivo sin extensión. El banco final se valida contra `appState.banks`; si no está registrado, usa `appState.banks[0]`.

### `cleanBankDescription(raw)` — línea 15596
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

### `extractImportCode(desc)` — línea 15674
Versión simplificada usada solo para **comparar duplicados** (no para limpiar): reconoce S-code o un número de 8+ dígitos. Si la descripción no tiene ninguno, retorna `null`.

### `pairZelleRows(rows)` — línea 15544
Después de parsear todas las filas del archivo (y antes del preview), revisa las marcadas `isZelleCandidate: true` (descripción raw contiene "zelle"):
1. Empareja dentro del mismo batch por `sharesRefToken()` + mismo monto absoluto + fecha ±1 día + banco distinto.
2. Para las que no encontraron par en el batch, busca en `appState.transactions` (transferencias Zelle ya guardadas) con el mismo criterio.
3. Solo si hay par confirmado en cualquiera de las dos fuentes → `type: 'transfer'` + `transferDirection`. Sin par → queda como `income`/`expense` según el signo.

### `detectImportDuplicates(rows)` — línea 15683
Marca `row.duplicado = true/false` comparando contra `appState.transactions`: primero por código extraído (`extractImportCode`) + fecha + monto; si no hay código, cae al criterio anterior (banco + descripción exacta).

### `renderImportTable()` — línea 15703
Pinta la tabla de preview: checkbox de selección, fecha, descripción (con tooltip mostrando `descripcionRaw`), categoría (clickable, abre selector), banco (**dropdown editable inline**), monto, badge de duplicado.

### `bulkImportTransactions()` — línea 15904
Al hacer click en "Guardar en Registros": por cada fila seleccionada, vuelve a chequear duplicado (mismo criterio por código), busca si hay un gasto recurrente (`tx.isRecurring === true`) que comparta una palabra (4+ caracteres, función `sharesDescriptionWord`, línea 7563) con la descripción importada dentro de ±5 días — si lo encuentra, borra el recurrente y guarda la transacción real con `" ®"` añadido a la descripción. Guarda con `importedFrom: "csv"`.

---

## 4. Shape exacto del objeto "row"

Producido por `processImportRows` (y debe replicarse igual por cualquier nueva fuente de datos, ej. OCR):

```javascript
{
  _id: importNextId++,        // contador incremental global
  fecha: "YYYY-MM-DD",
  descripcion: String,        // ya pasada por cleanBankDescription(descripcionRaw)
  descripcionRaw: String,     // texto original, se muestra en el tooltip
  categoria: "",              // se asigna en el preview
  banco: String,
  monto: number,              // negativo = gasto, positivo = ingreso
  type: "expense" | "income", // monto < 0 ? "expense" : "income"
  isZelleCandidate: boolean,  // descripcionRaw.toLowerCase().includes("zelle")
  duplicado: false,           // se calcula después con detectImportDuplicates
}
```

---

## 5. Funciones auxiliares reutilizadas en otras partes de la app

| Función | Línea | Para qué |
|---|---|---|
| `sharesRefToken(descA, descB)` | 7989 | Compara los últimos 5 caracteres de tokens alfanuméricos (6+ chars, con al menos un dígito) entre dos descripciones — detecta si comparten el mismo código de referencia bancario (usado en `pairZelleRows` y en `buildInternalPairMap`/`buildTransferPairPartners`). |
| `sharesDescriptionWord(descA, descB)` | 7563 | Compara TODAS las palabras (sin `®`, 4+ caracteres) entre dos descripciones — `true` si comparten al menos una, sin importar la posición. Usado para reemplazo de gastos recurrentes (al importar y al abrir la app). |
| `withinDays(dateA, dateB, margin)` | 7574 | Diferencia en días entre dos fechas ≤ margin. |
| `buildInternalPairMap(transactions)` | 8002 | Detecta pares de transferencia confirmados (misma fecha+monto, banco distinto, `sharesRefToken`) y devuelve `Map<id, 'send'|'recv'>` — usado para saldos. |
| `buildTransferPairPartners(transactions)` | 8053 | Mismo criterio que la anterior, pero devuelve `Map<id, partnerId>` — usado en Registros para mantener ambos lados de una transferencia siempre adyacentes en la tabla sin romper la columna de Saldo. |
| `buildCatDisplay(name, type, isImported)` | 10374 | Ícono de categoría en la tabla. Si `isImported` es `true` y no hay categoría asignada y no es transferencia → ícono ❓ (`UNKNOWN_ICON`, círculo naranja con signo de interrogación blanco). |

---

## 6. Lecciones aprendidas (errores ya corregidos — no repetirlos)

1. **Orden de limpieza de ruido vs. extracción de código importa.** Si se busca el código ANTES de limpiar ruido, un número de tarjeta enmascarado sin espacio (`CARD0149`) puede confundirse con un código real. La limpieza de ruido va PRIMERO.
2. **`"ID"` es una trampa.** La lista de abreviaciones de estado de EE.UU. incluye `"ID"` (Idaho). En descripciones bancarias, `"ID"` casi siempre significa "Identification" (`Web Id:`, `PPD ID:`). Se excluyó deliberadamente de la lista de limpieza de ruido — si se necesita reinstaurar Idaho como estado, hay que buscar otra forma de distinguirlo del marcador de identificador.
3. **Doble codificación URI en SVG data-URI.** Si se construye un ícono SVG como string con `%23` (que ya es `#` codificado) y luego se pasa por `encodeURIComponent()`, el `%` se vuelve a codificar (`%2523...`) y el color queda inválido (ícono invisible, sin error visible). Usar siempre el carácter literal (`#888888`) y dejar que `encodeURIComponent()` lo codifique una sola vez.
4. **Coincidencia por "primera palabra" es demasiado estricta.** Si el nombre del gasto recurrente no empieza con el nombre del comercio (ej. `"Hipoteca - Freedom Mortgage"` vs. `"Freedom Mtg"`), comparar solo la primera palabra falla. Se usa coincidencia de **cualquier palabra compartida** (mínimo 4 caracteres, `sharesDescriptionWord`) para tolerar esto, aceptando el riesgo controlado de palabras cortas coincidiendo por azar.
5. **Reordenar visualmente sin romper la cadena de saldo.** La tabla de Registros calcula el saldo por fila asumiendo que el orden de visualización es el inverso exacto del orden usado para acumular el saldo. Para agrupar pares de transferencia de forma adyacente sin generar saltos visuales en la columna Saldo, ambos lados del par deben compartir el **mismo criterio de orden** en ambos cálculos (ver `buildTransferPairPartners` + `effectiveOrder` en `renderTransactionsTable`), no solo reordenar la tabla final.

---

## 7. Cómo extender este pipeline (ej. nueva fuente de datos)

Cualquier nueva forma de traer transacciones (la próxima es OCR desde foto, ver `MD/Plan OCR Importar Foto — Foresee.md`) debe:
1. Producir un array de objetos con el **shape exacto de la sección 4**.
2. Insertarse en el flujo en el mismo punto donde hoy se hace `importRows = [...importRows, ...newRows]` (línea ~15895 en `processImportFile`).
3. Dejar que `pairZelleRows`, `detectImportDuplicates`, `renderImportTable` y `bulkImportTransactions` se ejecuten sin modificación — todo ese código ya es agnóstico al origen de los datos.
4. Reutilizar `cleanBankDescription(descripcionRaw)` para producir el campo `descripcion` — no reimplementar limpieza de texto en paralelo.
