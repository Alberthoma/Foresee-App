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

---

## Estado actual

- **Versión activa:** `V FSA 0018` (2026-06-06)
- **Próxima versión:** `V FSA 0019`
- **Archivo de trabajo:** `index.html` (raíz del proyecto — único archivo que se edita)
- **Último backup:** `Backup\antes de V FSA 0019 — 2026-06-06.html`
- **Último informe:** `Informes de actualización\V FSA 0018 — 2026-06-06.md`

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
Ejecutar `Git Push — Enviar cambios desde PC.bat`
El bat crea el backup, hace commit y sube a GitHub automáticamente.

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
Editar → informe → actualizar CLAUDE.md → ejecutar Push bat

**Edité en el móvil antes:**
Ejecutar Pull bat → editar → informe → actualizar CLAUDE.md → ejecutar Push bat

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

---

## Deuda técnica (no urgente)
- **Archivo único ~503KB** — separar CSS/JS/HTML mejoraría caché y carga inicial
- **Patrón `window.*`** — Firebase exporta funciones a `window.*`; requiere refactorización mayor
