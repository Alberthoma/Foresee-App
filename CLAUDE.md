# Foresee — Gestor de Presupuesto Web

## Qué es este proyecto
App web de gestión de presupuesto personal. Todo el código vive en **un único archivo HTML**
(`index.html`, ~13.000+ líneas) que incluye CSS, JS y HTML en un solo fichero. Usa Firebase Auth + Firestore
para autenticación y persistencia, Chart.js para gráficos y jsPDF para exportar PDF.

Publicado en GitHub Pages vía: `https://github.com/Alberthoma/Foresee-App`

---

## Archivo principal de trabajo
El archivo activo siempre se llama **`index.html`** en la raíz del proyecto. Es el único archivo que se edita y publica.

- **Versión activa:** `V FSA 0018` (2026-06-06)
- **Próxima versión:** `V FSA 0019`
- **Punto de restauración más reciente:** `Backup\antes de V FSA 0019 — 2026-06-06.html`

La carpeta `Backup\` contiene el historial de snapshots anteriores — no modificar manualmente.

---

## ⚡ TAREAS PENDIENTES
Ver lista completa con estado en memoria: `project_pendientes.md`

**Próxima: Fase 2 del plan de comercialización.**

---

## 🔄 Protocolo de inicio de sesión
Al comenzar una sesión nueva, hacer esto en orden antes de tocar código:

1. Leer este `CLAUDE.md` — verificar versión activa y tarea pendiente
2. Leer el último informe en `Informes de actualización\` para conocer el estado exacto
3. Leer solo las secciones CSS/JS relevantes del `index.html` (usar `Read` con `offset` y `limit`)
4. Confirmar con el usuario desde qué punto continuar
5. Nunca asumir que el trabajo anterior se completó — verificar el estado real del archivo

---

## 📋 Protocolo de cambio — obligatorio en cada modificación

Cada vez que se realiza un cambio en `index.html`, seguir este orden:

### 1. Antes de editar — crear backup
Copiar `index.html` a `Backup\` con el nombre:
```
antes de V FSA XXXX — YYYY-MM-DD.html
```
donde `XXXX` es el número de la versión que se va a aplicar.
**El bat de push hace esto automáticamente.**

### 2. Editar `index.html`
Aplicar el cambio. Actualizar el número de versión visible en el pie de página:
```html
<p id="app-version">V FSA XXXX</p>
```

### 3. Crear informe de actualización
Crear archivo `Informes de actualización\V FSA XXXX — YYYY-MM-DD.md` con esta estructura:
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

### 4. Actualizar este CLAUDE.md
- Cambiar **Versión activa** al número nuevo
- Cambiar **Próxima versión** (XXXX + 1)
- Actualizar **Punto de restauración** con el nuevo backup
- Agregar fila al **Historial de versiones**

### 5. Publicar
Ejecutar `Git Push — Enviar cambios desde PC.bat`
El bat crea el backup automáticamente, hace commit y sube a GitHub.

---

## ⚠️ Protocolo de corrección (versión incorrecta)

Cuando un cambio aplicado resulta incorrecto:

1. El informe de esa versión se marca al inicio con:
   ```
   > ⚠️ **SUPERADO** — El fix fue incorrecto. Ver V FSA XXXX para la solución correcta.
   ```
2. La versión mala **no se revierte** — queda registrada con su número
3. La siguiente versión es el intento de corrección (puede haber varios intentos)
4. Cuando la corrección funciona, se retoma la secuencia normal
5. El informe corrector incluye al inicio:
   ```
   > Corrige el intento fallido de V FSA XXXX.
   ```

---

## 🖥️ Repositorio Git y publicación

### Configuración
- **Repo local:** `D:\$$$ Proyectos\0 Foresee-App\Foresee-App GitHub\`
- **Remote:** `https://github.com/Alberthoma/Foresee-App.git`
- **Rama:** `main`
- **GitHub Pages:** activado desde rama `main` (raíz)
- **Excluido de git:** `Imagenes/Imagenes.rar` (117 MB, supera límite de GitHub)

### Archivos de publicación
| Archivo | Función |
|---|---|
| `Git Push — Enviar cambios desde PC.bat` | Crea backup → commit → sube a GitHub |
| `Git Pull — Traer cambios del movil.bat` | Baja cambios editados desde el móvil a la PC |

### Flujo según dispositivo
| Situación | Pasos |
|---|---|
| Solo trabajé en PC | Editar → crear informe → actualizar CLAUDE.md → ejecutar Push bat |
| Trabajé en móvil antes | Ejecutar Pull bat → editar → crear informe → actualizar CLAUDE.md → ejecutar Push bat |

---

## 🛡️ Estrategia anti-límite de tokens (archivo de 13.000+ líneas)

- **Nunca usar `Write` para reescribir el archivo completo** — siempre usar `Edit` (solo el diff)
- **Un bloque a la vez** — aplicar, verificar funcionamiento, luego pasar al siguiente
- **Leer solo las secciones necesarias** — usar `Read` con `offset` y `limit`
- **Si el output se corta**: el usuario dice "continúa" y se retoma desde el siguiente bloque
- **Checkpoint**: después de cada bloque confirmado, anotar en el historial de cambios

---

## Directrices de trabajo (leer antes de generar cualquier código)

### Rol y enfoque
- Actuar como programador experto. Analizar el código completo antes de proponer cambios.
- Verificar siempre que el código generado no rompe funcionalidad existente.
- Sugerir mejoras proactivamente aunque el usuario no las pida, indicando que son opcionales.

### Entrega de código
- **Nunca** entregar código truncado, resumido o con comentarios `// ... resto igual`.
  Siempre bloques completos y funcionales.
- Entregar los cambios **por bloques** numerados indicando:
  1. Número de línea exacto o rango donde se aplica
  2. Si es REEMPLAZO, INSERCIÓN o ELIMINACIÓN
  3. Referencia visual: texto único del código circundante para ubicar el punto exacto
- Antes de cada bloque, describir en 1-2 líneas qué hace y por qué.

### Interfaz y estilos
- La UI debe ser **moderna, limpia y coherente** con la identidad de Foresee
  (app de finanzas personales: paleta sobria, tipografía clara, componentes funcionales).
- **CSS puro únicamente** — sin Tailwind, sin Bootstrap, sin librerías externas.
- Diseño **mobile-first**. Breakpoints: 480px, 640px, 768px, 1024px, 1280px.
- Mantener coherencia con los estilos ya existentes.

### Seguridad (obligatorio en cada cambio)
- Nunca insertar datos del usuario en el DOM vía `innerHTML` — usar `createTextNode` o `textContent`.
- Escapar atributos HTML con datos del usuario (`&quot;`, `&#39;`, etc.).
- No exponer información sensible en consola — solo `console.error` para errores reales.
- Validar inputs en el lado cliente antes de enviar a Firestore.
- No introducir `eval()`, `new Function()` ni `innerHTML` con datos dinámicos.

### Rendimiento y calidad
- Preferir una sola pasada de array (`reduce`) sobre múltiples `filter` + `map`.
- Usar event delegation en lugar de listeners individuales en listas dinámicas.
- No acumular listeners — verificar que no se re-adjunten en cada render.
- Evitar re-renders innecesarios del DOM.

### Convenciones del proyecto
- No usar `window.*` para nuevas comunicaciones entre módulos.
- No agregar `console.log` — solo `console.error` para errores reales de producción.
- No crear archivos nuevos — todo el código va en `index.html`.
- No agregar dependencias externas nuevas sin consultarlo primero.

---

## Historial de versiones

| Versión | Fecha | Cambio clave |
|---------|-------|-------------|
| V FSA 0000 | 2026-06-05 | Nueva nomenclatura, sistema de informes creado |
| V FSA 0001 | 2026-06-05 | Colores modo claro más intensos |
| V FSA 0002 | 2026-06-05 | — |
| V FSA 0003 | 2026-06-05 | — |
| V FSA 0004 | 2026-06-05 | — |
| V FSA 0005 | 2026-06-05 | — |
| V FSA 0006 | 2026-06-05 | — |
| V FSA 0007 | 2026-06-05 | — |
| V FSA 0008 | 2026-06-05 | — |
| V FSA 0009 | 2026-06-05 | — |
| V FSA 0010 | 2026-06-05 | — |
| V FSA 0011 | 2026-06-05 | — |
| V FSA 0012 | 2026-06-05 | — |
| V FSA 0013 | 2026-06-06 | Fix voz: montos >9,999 + clasificación ingreso/gasto |
| V FSA 0014 | 2026-06-06 | — |
| V FSA 0015 ⚠️ | 2026-06-06 | SUPERADO — fix incorrecto, ver 0017 |
| V FSA 0016 ⚠️ | 2026-06-06 | SUPERADO — fix incorrecto, ver 0017 |
| V FSA 0017 | 2026-06-06 | Corrección definitiva de 0015 y 0016 |
| V FSA 0018 | 2026-06-06 | Fix ícono transferencia en tabla proyección |

---

## Sesiones anteriores (proyecto de edición)
Las sesiones 001-020 corresponden al proyecto de edición previo (`Edicion Cld` / `FS XXXX`).
Ver informes en `Informes de actualización\Informes Anteriores\`.

---

## Deuda técnica pendiente (no urgente)
- **Archivo único ~503KB** — Separar en CSS/JS/HTML independientes para mejor caché y carga.
- **Patrón `window.*`** — El módulo Firebase exporta funciones a `window.*`. Requiere refactorización mayor.
