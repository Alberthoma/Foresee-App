# Foresee — Gestor de Presupuesto Web

## Qué es Foresee
Foresee es una **app web de gestión de presupuesto personal** diseñada principalmente para móvil. Permite al usuario llevar el control completo de sus finanzas personales: ingresos, gastos, saldos, deudas y proyecciones futuras.

### Funcionalidades principales
- **Registro de transacciones** — ingresos y gastos con categoría, banco, fecha y descripción. Entrada por calculadora o por voz (NLP en español)
- **Categorías y bancos** — personalizables por el usuario
- **Tarjetas de crédito** — seguimiento de deuda, pagos y alertas
- **Gastos comunes** — distribución de gastos compartidos entre personas
- **Gastos recurrentes** — suscripciones y pagos fijos mensuales
- **Transferencias internas** — movimientos entre cuentas propias
- **Saldos** — balance en tiempo real por banco y total
- **Reportes y presupuesto** — tablas de ingresos/gastos con comparativa mensual
- **Proyección financiera** — estimación de saldo futuro basada en patrones
- **Exportar** — Excel (.xlsx) con 4 hojas y fórmulas, y PDF
- **Modo oscuro/claro** — con transición suave y tokens CSS
- **PWA instalable** — funciona como app nativa en iOS y Android
- **Notificaciones** — alertas del navegador para recordatorios
- **Cambio de mes automático** — transición y cierre de ciclo mensual sin intervención del usuario

### Tecnologías
- **Firebase Auth + Firestore** — autenticación y persistencia en la nube
- **Chart.js 4.4.4** — gráficos de ingresos/gastos
- **jsPDF** — exportación a PDF
- **Web Speech API** — entrada por voz
- **SheetJS (xlsx)** — exportación a Excel
- Todo el código en **un único archivo HTML** (`index.html`, ~13.000+ líneas) — CSS, JS y HTML en un solo fichero

Publicado en GitHub Pages: `https://github.com/Alberthoma/Foresee-App`

### CDN dependencies (versiones fijas en `<head>`)
- **Firebase 11.x** — Auth + Firestore (`firebase-app`, `firebase-auth`, `firebase-firestore`)
- **Chart.js 4.4.4** — gráficos
- **SheetJS (xlsx)** — exportación Excel
- **jsPDF** — exportación PDF

---

## Desarrollo local

**No hay sistema de build.** El proyecto es un único `index.html` autocontenido — CSS, JS y HTML en un solo archivo.

Para previsualizar localmente:
- VS Code → extensión **Live Server** → clic derecho en `index.html` → "Open with Live Server"
- O cualquier servidor HTTP estático apuntando a la raíz del proyecto

No hay comandos de build, lint, ni tests automatizados. La verificación se hace manualmente en el navegador.

---

## Estado actual

- **Versión activa:** `V FSA 0029` (2026-06-14)
- **Próxima versión:** `V FSA 0030`
- **Archivo de trabajo:** `index.html` (raíz del proyecto — único archivo que se edita)
- **Último backup:** `Backup\antes de V FSA 0029 — 2026-06-14.html`
- **Último informe:** `Informes de actualización\V FSA 0029 — 2026-06-14.md`

---

## 🔄 Protocolo de inicio de sesión

Antes de tocar cualquier código, en este orden:

1. Leer este `CLAUDE.md` — versión activa y estado
2. Leer el último informe en `Informes de actualización\` — conocer el estado exacto del último cambio
3. Leer solo las secciones relevantes de `index.html` (usar `Read` con `offset` y `limit`)
4. Confirmar con el usuario desde qué punto continuar
5. Nunca asumir que el trabajo anterior se completó — verificar el estado real del archivo

---

## 📋 Protocolo de cambio — obligatorio en cada modificación

Cada vez que se modifica `index.html`, seguir este orden exacto:

### Paso 1 — Backup (automático)
El bat de push lo crea solo. No hace falta hacerlo a mano.
Nombre del archivo: `Backup\antes de V FSA XXXX — YYYY-MM-DD.html`

### Paso 2 — Editar `index.html`
Aplicar el cambio. Actualizar el número de versión en el pie de página:
```html
<p id="app-version">V FSA XXXX</p>
```

### Paso 3 — Crear informe
Crear `Informes de actualización\V FSA XXXX — YYYY-MM-DD.md`:
```markdown
# Informe de Actualización — V FSA XXXX
**Fecha:** YYYY-MM-DD

## Solicitud del usuario
[qué pidió]

## Análisis previo al cambio
[qué se analizó antes de tocar código]

## Modificaciones realizadas
[lista numerada: qué se cambió, en qué línea, tipo REEMPLAZO/INSERCIÓN/ELIMINACIÓN]

## Estado final
[cómo quedó, si hay algo pendiente]
```

### Paso 4 — Actualizar este CLAUDE.md
- **Versión activa** → nuevo número
- **Próxima versión** → XXXX + 1
- **Último backup** → nombre del nuevo backup
- **Último informe** → nombre del nuevo informe
- Agregar fila al **Historial de versiones**

### Paso 5 — Publicar
Ejecutar el skill `/foresee-commit` — hace todo automáticamente:
crea el backup, actualiza el footer, crea el informe, actualiza CLAUDE.md, hace commit y push a GitHub.

Si no está disponible el skill, ejecutar manualmente `Git Push — Enviar cambios desde PC.bat`.

---

## ⚠️ Protocolo de corrección (versión incorrecta)

Cuando un cambio resulta incorrecto:

1. El informe de esa versión se marca al inicio:
   ```
   > ⚠️ SUPERADO — El fix fue incorrecto. Ver V FSA XXXX para la solución correcta.
   ```
2. La versión mala **no se revierte** — queda registrada con su número
3. La siguiente versión es el intento de corrección
4. El informe corrector incluye:
   ```
   > Corrige el intento fallido de V FSA XXXX.
   ```
5. Cuando la corrección funciona, se retoma la secuencia normal

---

## 📝 Protocolo de cierre de sesión

Al final de **cualquier sesión** — de código, infraestructura, documentación o planificación — el usuario puede pedir cerrar la sesión. Frases que activan este protocolo:

> "cierra la sesión", "voy a cambiar de sesión", "guarda todo lo de esta sesión", "documenta la sesión", "procede a cerrar"

El objetivo es dejar un registro que permita retomar el trabajo en una sesión futura sin perder contexto: qué se hizo, qué decisiones se tomaron, qué cambió y qué quedó pendiente.

### Pasos

1. **Proponer un título** para la sesión basado en el tema principal trabajado. Confirmar con el usuario si quiere otro nombre.

2. **Crear `MD/Sesion YYYY-MM-DD — Titulo.md`** con este contenido:
   ```markdown
   # Sesión YYYY-MM-DD — Título

   **Fecha:** YYYY-MM-DD
   **Versión activa al cierre:** V FSA XXXX
   **Tipo:** [Código / Infraestructura / Documentación / Planificación / Mixta]

   ## Resumen
   [dos o tres líneas: qué se trabajó y cuál fue el resultado]

   ## [Una sección por cada tema o bloque de trabajo]
   - Contexto o punto de partida
   - Lo que se analizó o encontró
   - Decisión tomada y por qué
   - Resultado o solución aplicada

   ## Estado al cierre
   [tabla o lista: componente → estado actual]

   ## Pendiente para próxima sesión
   [si hay algo sin terminar o que requiere seguimiento]

   ## Commits de esta sesión
   | Hash | Mensaje |
   |------|---------|
   | `xxxxxxx` | mensaje |
   ```

3. **Hacer commit y push:**
   ```
   git add "MD/Sesion YYYY-MM-DD — Titulo.md"
   git commit -m "Docs: agregar sesion YYYY-MM-DD a MD/"
   git push --force-with-lease origin main
   ```

### Notas
- Si la sesión incluyó cambios de versión en `index.html`, el informe de `Informes de actualización/` ya existe — el documento de sesión es **complementario**, no duplica ese contenido sino que da el contexto narrativo completo
- El título del documento lo sugiere Claude basándose en lo trabajado; el usuario puede ajustarlo
- Si el usuario vuelve a la misma sesión más tarde, actualizar el documento con lo nuevo antes de cerrar definitivamente

---

## 🖥️ Git y publicación

### Configuración del repo
- **Carpeta local:** `D:\$$$ Proyectos\0 Foresee-App\Foresee-App GitHub\`
- **Remote:** `https://github.com/Alberthoma/Foresee-App.git`
- **Rama:** `main`
- **Excluido de git:** `Imagenes/Imagenes.rar` (117 MB, supera límite de GitHub)

### Los dos .bat

| Archivo | Cuándo usarlo |
|---|---|
| `Git Push — Enviar cambios desde PC.bat` | Siempre al terminar de editar en la PC |
| `Git Pull — Traer cambios del movil.bat` | Solo si editaste desde el móvil antes de trabajar en la PC |

### Flujo según situación

**Solo trabajé en PC:**
Editar `index.html` → ejecutar `/foresee-commit` (hace el resto solo)

**Edité en el móvil antes:**
Ejecutar `Git Pull — Traer cambios del movil.bat` → editar `index.html` → ejecutar `/foresee-commit`

**Al completar una mejora del plan:**
Ejecutar `/foresee-commit` → ejecutar `/foresee-mejora-done`

---

## 🗺️ Arquitectura de la app

### Secciones (líneas ~4321–4853 del HTML)

| Sección | ID en HTML | data-section |
|---------|-----------|--------------|
| Registros | `section-registros` | `registros` |
| Proyección | `section-proyeccion` | `proyeccion` |
| Gastos Recurrentes | `section-recurrentes` | `recurrentes` |
| Gastos Comunes | `section-comunes` | `gastos-comunes` |
| Tarjetas / Préstamos | `section-tarjetas` | `tarjetas` |
| Saldos | `section-saldos` | `saldos` |
| Reportes | `section-reportes` | `reportes` |
| Presupuesto | `section-presupuesto` | `presupuesto` |
| Configuración | `section-configuracion` | `configuracion` |
| Voz | `section-voz` | `voz` |

### Estado global `appState` (línea 5682)

Objeto central que contiene todo el estado de la app en memoria:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `transactions` | `[]` | Todas las transacciones del usuario |
| `projections` | `[]` | Entradas de proyección financiera |
| `recurringExpenses` | `[]` | Gastos recurrentes configurados |
| `creditCards` | `[]` | Tarjetas de crédito y préstamos |
| `gastosComunes` | `{ people[], items[] }` | Gastos comunes: personas e ítems |
| `categories` | `[]` | Categorías personalizadas del usuario |
| `banks` | `[]` | Bancos configurados por el usuario |
| `descriptions` | `[]` | Descripciones guardadas (autocomplete) |
| `categoryBudgets` | `{}` | Límites de presupuesto por categoría |
| `openingBalance` | `number` | Saldo inicial de apertura |
| `userAlias` | `string` | Nombre visible del usuario |
| `currency` | `string` | Divisa activa (ej: `'USD'`) |
| `notificationsEnabled` | `boolean` | Notificaciones del navegador activas |
| `budgetAlertsShown` | `{}` | Control de deduplicación de alertas |
| `lastMonthProcessed` | `string\|null` | Control del cambio de mes automático |
| `filterMonth` | `string` | Mes activo en filtros |
| `filterBank` | `string` | Banco activo en filtros |
| `filterCategory` | `string` | Categoría activa en filtros |
| `currentTab` | `string\|null` | Sección visible actualmente |
| `currentUser` | `object\|null` | Usuario autenticado de Firebase |

### Estructura del archivo index.html

| Zona | Líneas aproximadas | Contenido |
|------|--------------------|-----------|
| `<head>` y CDN | 1 – 50 | Meta tags, Firebase, Chart.js, SheetJS, jsPDF |
| CSS | 50 – ~4300 | Todos los estilos de la app |
| HTML | ~4300 – ~4900 | Secciones, modales, navegación |
| JavaScript | ~4900 – 13000+ | Todo el código JS, `appState` en línea 5682 |

---

## 🤖 Skills disponibles

Tres skills instalados en Claude para automatizar las tareas más repetitivas del proyecto.
Los archivos fuente están en `skill\` dentro del proyecto.

| Skill | Cuándo usarlo |
|---|---|
| `/foresee-find` | Antes de editar — localiza funciones, CSS, HTML o variables en las 13.000+ líneas sin leer el archivo completo |
| `/foresee-commit` | Al terminar cualquier cambio — ejecuta el protocolo completo: backup, footer, informe, CLAUDE.md, commit y push |
| `/foresee-mejora-done` | Al completar una mejora del plan — sincroniza el estado en CLAUDE.md y `MD/plan-mejoras.md` |

### Reinstalar skills (si se pierden)

Los archivos fuente están en `skill\` dentro del proyecto. Para reinstalar ejecutar en Bash:
```bash
cp "D:/$$$ Proyectos/0 Foresee-App/Foresee-App GitHub/skill/foresee-commit/SKILL.md" "C:/Users/Albert/.claude/skills/foresee-commit/SKILL.md"
cp "D:/$$$ Proyectos/0 Foresee-App/Foresee-App GitHub/skill/foresee-mejora-done/SKILL.md" "C:/Users/Albert/.claude/skills/foresee-mejora-done/SKILL.md"
cp "D:/$$$ Proyectos/0 Foresee-App/Foresee-App GitHub/skill/foresee-find/SKILL.md" "C:/Users/Albert/.claude/skills/foresee-find/SKILL.md"
```

---

## 🛡️ Estrategia anti-límite de tokens (archivo de 13.000+ líneas)

- **Nunca usar `Write` para reescribir el archivo completo** — siempre `Edit` (solo el diff)
- **Un bloque a la vez** — aplicar, verificar, luego continuar
- **Leer solo las secciones necesarias** — `Read` con `offset` y `limit`
- **Si el output se corta** — el usuario dice "continúa" y se retoma desde el siguiente bloque

---

## Directrices de código

### Entrega de código
- **Nunca** entregar código truncado o con `// ... resto igual` — siempre bloques completos
- Indicar para cada bloque: número de línea, tipo (REEMPLAZO / INSERCIÓN / ELIMINACIÓN) y referencia visual del código circundante
- Describir en 1-2 líneas qué hace cada bloque y por qué

### Interfaz y estilos
- UI moderna, limpia y coherente con Foresee (finanzas personales: paleta sobria, tipografía clara)
- **CSS puro** — sin Tailwind, Bootstrap ni librerías externas
- **Mobile-first** — breakpoints: 480px, 640px, 768px, 1024px, 1280px

### Seguridad
- No insertar datos del usuario en el DOM vía `innerHTML` — usar `createTextNode` o `textContent`
- Escapar atributos HTML con datos del usuario (`&quot;`, `&#39;`)
- Solo `console.error` para errores reales — no `console.log`
- Validar inputs antes de enviar a Firestore
- No usar `eval()`, `new Function()` ni `innerHTML` con datos dinámicos

### Rendimiento
- Una sola pasada de array (`reduce`) sobre múltiples `filter` + `map`
- Event delegation en lugar de listeners individuales en listas dinámicas
- No acumular listeners — verificar que no se re-adjunten en cada render

### Convenciones
- No usar `window.*` para nuevas comunicaciones entre módulos
- No crear archivos nuevos — todo el código va en `index.html`
- No agregar dependencias externas sin consultarlo primero

---

## Historial de versiones

| Versión | Fecha | Cambio |
|---------|-------|--------|
| V FSA 0000 | 2026-06-05 | Nueva nomenclatura de versiones, sistema de informes creado |
| V FSA 0001 | 2026-06-05 | Colores semánticos modo claro más intensos y oscuros |
| V FSA 0013 | 2026-06-06 | Fix voz: montos >9.999 y clasificación ingreso/gasto |
| V FSA 0015 ⚠️ | 2026-06-06 | SUPERADO — fix incorrecto, ver V FSA 0017 |
| V FSA 0016 ⚠️ | 2026-06-06 | SUPERADO — fix incorrecto, ver V FSA 0017 |
| V FSA 0017 | 2026-06-06 | Corrección definitiva de V FSA 0015 y 0016 |
| V FSA 0018 | 2026-06-06 | Fix ícono transferencia en tabla de proyección |
| V FSA 0019 | 2026-06-14 | Donut interactivo en Reportes: click en porción/leyenda muestra detalle de transacciones por categoría |
| V FSA 0020 | 2026-06-14 | Notificaciones inteligentes: banner proyección 15 días, notif nativa presupuesto y recurrentes a 3 días |
| V FSA 0021 | 2026-06-14 | Mejora 4: sección Importar — CSV/Excel de bancos con preview, detección de duplicados y bulk save a Firestore |
| V FSA 0022 | 2026-06-14 | Categoría editable en Registros (click en celda) + tooltip flotante en descripciones truncadas |
| V FSA 0023 | 2026-06-14 | UX Importar: botón "Guardar en Registros", texto explicativo y navegación automática post-import |
| V FSA 0024 | 2026-06-14 | Duplicados estrictos en Importar (desc+monto+fecha+banco), edición inline de descripción en Registros, auto-detección Zelle como transferencia |
| V FSA 0025 | 2026-06-14 | Colores diferenciados por tipo de transferencia: naranja (interna enviada), azul (interna recibida), verde (Zelle de tercero), rojo (Zelle a tercero) |
| V FSA 0026 | 2026-06-14 | Auto-detección de transferencias propias por número de referencia compartido en descripción (misma fecha+monto+distinto banco) |
| V FSA 0027 | 2026-06-14 | Fix detección referencia: comparar últimos 5 chars (los bancos agregan prefijos distintos al número de referencia) |
| V FSA 0028 | 2026-06-14 | Descripción en Title Case al importar desde CSV/Excel a Registros |
| V FSA 0029 | 2026-06-14 | Fix saldo: transferencias recibidas (Zelle in, par propio recv) ahora suman en lugar de restar |

---

## 🚀 Plan de Comercialización

Plan completo por fases: [`MD/Plan Comercializacion — Foresee.md`](MD/Plan%20Comercializacion%20%E2%80%94%20Foresee.md)

| Fase | Estado | Descripción |
|------|--------|-------------|
| 1 — App lista para usuarios | ✅ Completa | Onboarding, recuperación de contraseña, selección de moneda, tutorial de videos, datos de demo, eliminar cuenta |
| 2 — Mejoras de producto | ⬜ Próxima | Las 7 mejoras de `plan-mejoras.md` corresponden a esta fase |
| 3 — Monetización | ⬜ Pendiente | Lógica freemium, Stripe + Cloud Functions, textos legales |
| 4 — Lanzamiento | ⬜ Pendiente | Dominio propio, landing page, PWA instalable, email de soporte |

---

## Mejoras planificadas

Plan completo con estrategia e implementación: [`MD/plan-mejoras.md`](MD/plan-mejoras.md)

| # | Mejora | Estado |
|---|--------|--------|
| 1 | Gráfico de categorías (donut interactivo) | ✅ Completado |
| 2 | Presupuesto por categoría | ✅ Completado |
| 3 | Notificaciones inteligentes | ✅ Completado |
| 4 | Importar CSV/Excel de bancos | ✅ Completado |
| 5 | Metas de ahorro | ⏳ Pendiente |
| 6 | Deudas y préstamos | ⏳ Pendiente |
| 7 | Escaneo de recibos (OCR) | ⏳ Pendiente |

**Estados:** ⏳ Pendiente — 🔄 En progreso — ✅ Completado — ❌ Descartado

Al completar cada mejora: actualizar esta tabla + actualizar `MD/plan-mejoras.md` con la versión V FSA en que se completó.

---

## Deuda técnica (no urgente)
- **Archivo único ~503KB** — separar CSS/JS/HTML mejoraría caché y carga inicial
- **Patrón `window.*`** — Firebase exporta funciones a `window.*`; requiere refactorización mayor
