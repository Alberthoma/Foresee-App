# Foresee App — Documento de Continuidad de Sesión

> **LEER COMPLETO ANTES DE TOCAR CUALQUIER CÓDIGO.**
> Este archivo garantiza que cualquier sesión nueva continúe exactamente igual que las anteriores,
> con los mismos estándares, protocolo y contexto.

---

## 1. QUÉ ES ESTE PROYECTO

**Foresee Finances** — App web PWA de gestión de presupuesto personal.

- Todo el código vive en **un único archivo HTML** (`index.html`, raíz del repo, ~13.000+ líneas).
  Contiene CSS, JS y HTML en un solo fichero. **No separar en archivos.**
- Stack: Firebase Auth + Firestore (auth y persistencia), Chart.js (gráficos), jsPDF (exportar PDF),
  Web Speech API (entrada por voz), SheetJS (exportar Excel).
- PWA instalable: `manifest.json` conectado en el `<head>`.
- Repositorio GitHub: `alberthoma/foresee-app` — rama principal: `main`.
- El archivo activo es **`index.html`** en la raíz. No hay otros archivos de producción HTML activos.
- Carpeta `Backup/` — respaldos históricos. **No modificar.**
- Carpeta `Informes de actualización/` — un `.md` por cada versión V FSA.
- Carpeta `skin/` — ejemplos visuales. No son producción.

---

## 2. SISTEMA DE VERSIONES V FSA

Cada modificación al código recibe un número de versión correlativo:

```
V FSA 0000, V FSA 0001, V FSA 0002 ... V FSA XXXX
```

- El número se muestra en el footer del HTML: `<p id="app-version">V FSA XXXX</p>`
- **Cada versión = una modificación con propósito único.**
- La versión actual es **V FSA 0013**. La próxima es **V FSA 0014**.

---

## 3. PROTOCOLO OBLIGATORIO DE MODIFICACIÓN

**Este protocolo se sigue SIN EXCEPCIÓN en cada cambio. Nunca saltarse pasos.**

### Paso 1 — ANÁLISIS (antes de tocar código)
1. Leer las secciones del HTML relevantes al cambio solicitado (`Read` con `offset`/`limit`)
2. Identificar la causa raíz exacta del problema
3. Redactar el análisis en texto al usuario: qué ocurre, por qué, qué se va a cambiar
4. **Esperar confirmación del usuario antes de proceder**

### Paso 2 — RESPALDO (obligatorio, antes de cualquier edición)
```bash
cp "index.html" "Backup/antes de V FSA XXXX — YYYY-MM-DD.html"
```
Donde `XXXX` es el número de la versión que se va a aplicar.
El respaldo se hace sobre `index.html` antes de modificarlo.

### Paso 3 — MODIFICACIÓN
- Usar siempre **`Edit`** (nunca `Write` para reescribir el archivo completo)
- Un bloque a la vez — aplicar, verificar, pasar al siguiente
- Leer solo las secciones necesarias (`Read` con `offset` y `limit`)

### Paso 4 — VERSIÓN
Actualizar el número en el footer:
```html
<p id="app-version">V FSA XXXX</p>
```

### Paso 5 — INFORME
Crear archivo Markdown en `Informes de actualización/`:
```
Informes de actualización/V FSA XXXX — YYYY-MM-DD.md
```
Contenido mínimo:
- Solicitud del usuario
- Causa identificada (si es bug)
- Modificación realizada (antes/después del código)
- Alcance del cambio

### Paso 6 — COMMIT Y PUSH
```bash
git add index.html "Backup/antes de V FSA XXXX — YYYY-MM-DD.html" "Informes de actualización/V FSA XXXX — YYYY-MM-DD.md"
git commit -m "V FSA XXXX — descripción breve"
git push origin main
```
Si el push falla con "rejected — fetch first", hacer pull primero:
```bash
git pull origin main --no-rebase
# Resolver conflictos (normalmente solo en la línea de app-version)
git add index.html
git commit -m "Merge: resolver conflicto versión → V FSA XXXX"
git push origin main
```

---

## 4. EXIGENCIAS DEL USUARIO — CÓMO TRABAJAR

Estas son las reglas de interacción que el usuario ha establecido. **Cumplirlas siempre.**

### Antes de modificar
- **Siempre analizar primero y exponer el análisis al usuario.**
  Describir: qué ocurre, causa raíz, qué se cambiaría. Luego esperar "confirmado" o "procede".
- **Nunca modificar sin que el usuario confirme**, salvo que haya confirmado explícitamente al pedir la tarea.
- **Siempre respaldar antes de modificar.** Si se olvida el respaldo, el usuario lo recordará — no continuar sin hacerlo.

### Durante la modificación
- Actuar como **programador experto**: analizar el código completo antes de proponer cambios.
- Verificar que los cambios no rompen funcionalidad existente.
- Nunca entregar código truncado o con `// ... resto igual`. Siempre bloques completos.

### Respuestas al usuario
- Respuestas **concisas y directas**. Sin relleno ni frases de cortesía vacías.
- Si el usuario pregunta algo antes de confirmar, responder la pregunta y esperar.
- Si el usuario dice "dime antes" o "analiza antes", no tocar código hasta recibir "confirmado" o "procede".
- Si el usuario dice "continúa", retomar desde donde se dejó.

### Estándares de código
- **CSS puro únicamente** — sin Tailwind, Bootstrap ni librerías externas.
- **Mobile-first** — la app se usa principalmente en móvil. Breakpoints: 480px, 640px, 768px, 1024px.
- No usar `window.*` para nuevas comunicaciones entre módulos.
- No agregar `console.log` — solo `console.error` para errores reales.
- No crear archivos nuevos — todo va en `index.html`.
- No agregar dependencias externas sin consultar.
- Seguridad: nunca `innerHTML` con datos del usuario, siempre `textContent`/`createTextNode`.
- Usar `color-mix()` y variables CSS (`var(--color-*)`) para colores — no valores hardcodeados rgba.

### Nomenclatura de respaldos
```
Backup/antes de V FSA XXXX — YYYY-MM-DD.html
```

---

## 5. ESTADO ACTUAL DEL PROYECTO (2026-06-06)

### Archivo activo
- **`index.html`** en la raíz del repositorio
- Versión actual: **V FSA 0013**
- Siguiente versión pendiente: **V FSA 0014**

### Variables CSS principales
```css
--color-bg          /* fondo principal */
--color-surface     /* fondo de tarjetas/paneles */
--color-surface-2   /* fondo secundario */
--color-text        /* texto principal */
--color-text-muted  /* texto secundario */
--color-accent      /* azul principal (#4f8fff modo oscuro, #1d4ed8 modo claro) */
--color-danger      /* rojo */
--color-success     /* verde */
--color-warning     /* amarillo/naranja */
--color-border      /* bordes */
--tab-bar-h         /* altura del tab-bar: 5.5rem */
--header-bar-h      /* altura del header */
```

### Secciones principales de la app
- **Registros** — tabla de transacciones (ingresos/gastos)
- **Voz** — entrada por reconocimiento de voz (Web Speech API)
- **Proyección** — gráficos y proyecciones
- **Gastos Recurrentes** — pagos periódicos
- **Gastos Comunes** — gastos compartidos entre personas
- **Tarjetas de Crédito** — gestión de tarjetas (rediseñadas a cards en V FSA 0005)
- **Presupuesto** — categorías y límites
- **Saldos** — cuentas bancarias
- **Reportes** — análisis y comparativas
- **Configuración** — ajustes (incluye toggle modo oscuro/claro)
- **Dashboard** — vista resumen

### CSS crítico — zonas modificadas
```css
/* Tab-bar */
#tab-bar { position: fixed; top: var(--header-bar-h); z-index: 99; }

/* Tab botón activo */
.tab-btn--active {
  background: color-mix(in srgb, var(--color-accent) 28%, var(--color-surface));
  backdrop-filter: blur(8px);
}

/* Action-bar sticky */
#action-bar {
  position: sticky;
  top: var(--tab-bar-h);
  z-index: 50;
  background: color-mix(in srgb, var(--color-bg) 80%, transparent);
  backdrop-filter: blur(8px);
}
```

---

## 6. HISTORIAL V FSA — QUÉ SE HIZO EN CADA VERSIÓN

| Versión | Fecha | Descripción |
|---------|-------|-------------|
| V FSA 0000 | 2026-06-05 | Renombre del sistema de versiones (V FS 00031 → V FSA 0000). Inicio del sistema de informes en `Informes de actualización/`. |
| V FSA 0001 | 2026-06-05 | Colores más intensos en modo claro: `--color-accent: #1d4ed8`, `--color-danger: #b91c1c`, `--color-success: #15803d`, `--color-warning: #b45309`. Solo en `html[data-theme='light']`. |
| V FSA 0002 | 2026-06-05 | Fix "Comparativa vs Mes Anterior" sin datos: se añadió fallback a `appState.transactions` filtradas por fecha cuando no hay archivo de mes anterior. |
| V FSA 0003 | 2026-06-05 | Swipe horizontal para navegar entre secciones (IIFE con `touchstart`/`touchend`, umbral 50px, sin interferir con scroll vertical ni inputs). |
| V FSA 0004 | 2026-06-05 | Fix columna de ícono de categoría demasiado ancha en Presupuesto móvil. `table-layout: fixed`, columna ícono `width: 36px`. |
| V FSA 0005 | 2026-06-05 | Rediseño completo Tarjetas de Crédito: de tabla a cards individuales con barra de uso visual. Nuevo template `tpl-cc-card`, nueva función `renderCreditCardsTable()`, `handleCardDataChange()` actualizado a `data-card-id`. |
| V FSA 0006 | 2026-06-05 | Intento de ampliar campos Monto/Línea en cards de TC — revertido en V FSA 0007 porque cambiaba el orden. |
| V FSA 0007 | 2026-06-05 | Fix real de campos angostos en TC: eliminada regla residual `max-width: 70px` en `.cc-table-input` dentro de `@media (max-width: 768px)`. Campos ahora ocupan ancho completo de su celda. |
| V FSA 0008 | 2026-06-05 | Action-bar sticky: `position: sticky; top: var(--tab-bar-h); z-index: 50; background: var(--color-bg); padding-top: var(--space-sm)`. Botones de acción permanecen visibles al hacer scroll. |
| V FSA 0009 | 2026-06-05 | Action-bar semi-transparente: `background: color-mix(in srgb, var(--color-bg) 80%, transparent)` + `backdrop-filter: blur(8px)`. Efecto cristal esmerilado. |
| V FSA 0010 | 2026-06-05 | Tab activo frosted glass: `.tab-btn--active` con `color-mix(accent 28%, surface)` + `backdrop-filter: blur(8px)`. Box-shadow migrado a `color-mix` para respetar tema claro/oscuro. |
| V FSA 0011 | 2026-06-05 | Eliminar bordes horizontales: removido `border-bottom` de `#tab-bar` y `#action-bar`. UI sin líneas separadoras. |
| V FSA 0012 | 2026-06-05 | Gastos Comunes en móvil: `#comunes-cards` padding lateral reducido a 4px (cards al borde de pantalla). Panel de personas cambia a `grid 1fr 1fr` — dos personas por fila, botón "+" en fila propia. Solo `@media (max-width: 768px)`. |
| V FSA 0013 | 2026-06-06 | Fix voz — tres bugs: (1) Montos grandes: normalizar separador de miles americano `15,000 → 15000` antes de parsear. (2) Keywords faltantes: añadidos `obtuve`, `percibi`, `ingrese` a `VOICE_INCOME_KW`. (3) Clasificación ingreso/gasto: reemplazada lógica `hasInc && !hasExp` por detección por posición del primer keyword + word-boundary `\b` para evitar falsos positivos por substring (`transferi` en `transferencia`). |

---

## 7. TAREA PENDIENTE — V FSA 0014

**Bug voz: formato europeo de números grandes**

El usuario probó diciendo `"Recibí 90.284,50 ..."` y la app registró **90.28** en lugar de **90,284.50**.

**Causa:** La API de reconocimiento de voz transcribió el número en formato europeo/latinoamericano:
- `.` = separador de miles
- `,` = separador decimal

El fix de V FSA 0013 solo normalizó el formato americano (`15,000` con coma). El formato europeo (`90.284,50` con punto de miles y coma decimal) no estaba cubierto.

**Fix planificado:**
Antes de los parsers de monto en `parseVoiceInput()`, añadir:
```js
// 1. Formato europeo completo: 90.284,50 → 90284.50
rem = rem.replace(/\b(\d{1,3}(?:\.\d{3})+),(\d{1,2})\b/g, (_, int, dec) =>
  int.replace(/\./g, '') + '.' + dec
);
// 2. Solo miles europeo sin decimal: 90.284 → 90284
rem = rem.replace(/\b(\d{1,3}(?:\.\d{3})+)\b/g, (m) => m.replace(/\./g, ''));
// 3. Coma decimal sola: 90,50 → 90.50 (ya cubierto por Estrategia B/C)
```

**Estado:** El usuario vio el análisis pero pidió primero crear este CLAUDE.md. Confirmar con el usuario antes de aplicar.

---

## 8. DECISIONES TÉCNICAS TOMADAS (no revertir sin motivo)

1. **`position: sticky` para action-bar**, no `fixed` — evita que el action-bar ocupe espacio fijo permanente fuera del flujo del documento.
2. **`color-mix()` para transparencias** — en lugar de rgba hardcodeados, para que los colores respeten el tema claro/oscuro automáticamente.
3. **`backdrop-filter: blur(8px)`** en action-bar y tab activo — efecto cristal esmerilado consistente en toda la zona de navegación.
4. **Word-boundary `\b` en detección de keywords de voz** — evita falsos positivos por substring (ej: `transferi` dentro de `transferencia`).
5. **Posición del primer keyword para clasificar ingreso/gasto** — el keyword que aparece antes en la frase determina el tipo, en lugar de AND/NOT simple que fallaba con frases mixtas como `"recibí un pago"`.
6. **Cards para Tarjetas de Crédito** (no tabla) — más usable en móvil, cada tarjeta es un componente independiente con barra visual de uso.
7. **Grid 2 columnas para personas en Gastos Comunes** (solo móvil) — más compacto y usable.
8. **Swipe sin interferir con scroll** — el detector de swipe ignora movimientos con más componente vertical que horizontal.

---

## 9. DEUDA TÉCNICA (no urgente, no tocar sin solicitarlo)

- **Archivo único ~500KB+** — Separar en CSS/JS/HTML independientes mejoraría caché y carga, pero requiere refactorización mayor.
- **Patrón `window.*`** — Firebase exporta funciones a `window.*`. Deuda existente, no ampliar.
- **Commits duplicados** — El entorno de ejecución remoto (Claude Code en la web) a veces genera conflictos de versión entre sesiones. Se resuelven con `git pull --no-rebase` y conservando siempre el número V FSA más alto.

---

## 10. ESTRATEGIA ANTI-TOKENS (archivo 13.000+ líneas)

- **Nunca `Write` para reescribir el archivo completo** — siempre `Edit` (solo el diff).
- **Leer solo las secciones necesarias** — `Read` con `offset` y `limit`.
- **Un bloque a la vez** — aplicar, confirmar, siguiente.
- Si el output se corta: el usuario dice "continúa" y se retoma desde el siguiente bloque.

---

## 11. ENTORNO DE EJECUCIÓN

- Claude Code corre en un **contenedor remoto efímero** (Claude Code en la web).
- El repositorio se clona fresco al inicio de cada contenedor.
- Los cambios solo persisten si se hace **commit + push** a `origin/main`.
- Si una sesión termina sin push, los cambios locales se pierden.
- El usuario usa la app desde el móvil (iPhone/iOS) — Safari es el navegador principal.
  - `-webkit-backdrop-filter` es obligatorio junto a `backdrop-filter`.
  - `color-mix(in srgb, ...)` funciona en Safari moderno.

---

## 12. CÓMO INICIAR UNA SESIÓN NUEVA CORRECTAMENTE

1. Leer este `CLAUDE.md` completo.
2. Leer el informe de la última versión aplicada en `Informes de actualización/`.
3. Verificar el estado real del archivo: `grep -n "app-version" index.html`
4. Verificar git: `git log --oneline -5` y `git status`
5. Preguntar al usuario desde qué punto quiere continuar.
6. **No asumir que el trabajo anterior se completó** — verificar siempre.
7. La tarea pendiente más reciente está en la **Sección 7** de este documento.
