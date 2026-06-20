# Plan de Mejoras — Foresee App

**Creado:** 2026-06-13
**Última actualización:** 2026-06-14

Este documento define el plan de implementación de mejoras prioritarias para Foresee.
Actualizar el estado de cada tarea a medida que se complete.

---

## Estado general

| # | Mejora | Estado | Versión |
|---|--------|--------|---------|
| 1 | Gráfico de categorías (donut interactivo) | ✅ Completado | V FSA 0019 |
| 2 | Presupuesto por categoría | ✅ Completado | V FSA 0019 |
| 3 | Notificaciones inteligentes | ✅ Completado | V FSA 0020 |
| 4 | Importar CSV/Excel de bancos | ✅ Completado | V FSA 0021 |
| 5 | Metas de ahorro | ⏳ Pendiente | — |
| 6 | Deudas y préstamos | ⏳ Pendiente | — |
| 7 | Escaneo de recibos (OCR) | ✅ Completado | V FSA 0047 |

**Estados:** ⏳ Pendiente — 🔄 En progreso — ✅ Completado — ❌ Descartado

---

## Tareas posteriores (registradas, sin fecha)

- Ingresos recurrentes
- Comparativa presupuesto vs real en tabla
- Gráfico de tendencia 12 meses
- Modo offline real (IndexedDB)
- Separar código en módulos CSS/JS/HTML
- Multi-usuario (parejas/familias)
- Conexión bancaria Open Banking/PSD2
- IA de análisis de patrones de gasto

---

## Detalle de cada mejora

---

### MEJORA 1 — Gráfico de categorías
**Estado:** ✅ Completado
**Complejidad:** Baja
**Estimación:** 1-2 sesiones
**Versión completada:** V FSA 0019 (2026-06-14)
**Dependencias:** Ninguna — Chart.js ya está incluido en la app

#### Qué hace
Gráfico donut interactivo en la sección de Reportes que muestra el gasto del mes actual distribuido por categoría. Al hacer clic en una porción se filtran las transacciones de esa categoría en la tabla de abajo.

#### Estrategia de implementación
1. Agregar un contenedor `<canvas>` en la sección de Reportes para el gráfico donut
2. Crear función `renderCategoryDonut()` que:
   - Agrupa las transacciones del mes filtrado por categoría
   - Calcula el porcentaje de cada una sobre el total de gastos
   - Construye el dataset para Chart.js con los colores de cada categoría
3. Conectar el click del gráfico con el filtro de la tabla de transacciones
4. Actualizar el gráfico cada vez que cambia el mes seleccionado

#### Notas técnicas
- Usar los colores ya definidos en `appState.categories` para coherencia visual
- Excluir transferencias internas del cálculo (no son gastos reales)
- Mínimo: mostrar solo categorías con gasto > 0 en el mes

#### Sección y funciones afectadas
- **Sección HTML:** `#section-reportes` (línea ~4469)
- `renderReportes()` (línea 10044) — función principal a modificar; agregar el canvas del donut y la lógica de agrupación por categoría dentro de esta función
- Los chart instances existentes (`expensesChartInstance`, `cashFlowChartInstance`) no se tocan — se añade uno nuevo

#### Criterio de aceptación
- [ ] El donut aparece en Reportes al cambiar de mes
- [ ] Cada porción tiene el color de la categoría (de `appState.categories`)
- [ ] Hacer clic en una porción filtra la tabla de transacciones por esa categoría
- [ ] Las transferencias internas no aparecen en el gráfico
- [ ] Si no hay gastos en el mes, el gráfico muestra estado vacío sin errores en consola

---

### MEJORA 2 — Presupuesto por categoría
**Estado:** ✅ Completado
**Complejidad:** Media
**Estimación:** 1-2 sesiones
**Versión completada:** V FSA 0019 (2026-06-14)
**Dependencias:** Ninguna

#### Qué hace
El usuario define un límite mensual de gasto por categoría. En Reportes aparece una barra de progreso por categoría mostrando gastado vs límite. La barra cambia de color (verde → naranja → rojo) según el porcentaje consumido.

#### Estrategia de implementación
1. **Modelo de datos** — agregar campo `budget` al objeto de cada categoría en Firestore:
   ```
   categoria: { name, icon, color, budget: 0 }
   ```
   Si `budget === 0` significa sin límite definido.

2. **UI de configuración** — en la pantalla de edición de categorías agregar un campo numérico "Límite mensual (opcional)". Si se deja en 0 o vacío, no hay límite.

3. **UI de visualización** — en Reportes, debajo o junto a cada categoría, mostrar:
   - Barra de progreso (gastado / límite)
   - Texto: "€320 de €400 — 80%"
   - Colores: verde < 70%, naranja 70-90%, rojo > 90%

4. **Reset mensual** — los presupuestos son límites fijos mensuales que se evalúan siempre contra el mes en curso. No necesitan resetearse — simplemente se comparan contra las transacciones del mes actual.

5. **Guardado** — actualizar la categoría en Firestore al guardar el límite.

#### Notas técnicas
- El campo `budget` es opcional — mostrar las barras solo en categorías que tienen límite definido
- No romper la estructura actual de categorías al agregar el campo nuevo

#### Sección y funciones afectadas
- **Secciones HTML:** `#section-presupuesto` (línea ~4535) para mostrar las barras; `#section-configuracion` (línea ~4561) para editar el límite por categoría
- `categoryBudgets: {}` ya existe en `appState` (línea 5691) y se persiste en Firestore (línea 8500) — la infraestructura de datos está lista, no hay que crear nada nuevo en el modelo
- `renderBudgetTable()` (línea 8752) — ampliar para mostrar barras de progreso por categoría con color semántico
- `saveCategoryWithIcon()` (línea 8359) — agregar campo numérico "Límite mensual" en el modal de edición de categoría
- `saveBudgets()` (línea 8874) — ya guarda `categoryBudgets` en Firestore; verificar si aplica o crear lógica específica

#### Criterio de aceptación
- [ ] En Configuración > Categorías, cada categoría tiene campo opcional "Límite mensual"
- [ ] En Presupuesto, las categorías con límite definido muestran barra de progreso (gastado / límite)
- [ ] Colores correctos: verde < 70%, naranja 70-90%, rojo > 90%
- [ ] Categorías sin límite definido no muestran barra (comportamiento actual intacto)
- [ ] El límite se guarda en Firestore y persiste entre sesiones

---

### MEJORA 3 — Notificaciones inteligentes
**Estado:** ✅ Completado
**Complejidad:** Baja
**Estimación:** 1 sesión
**Versión completada:** V FSA 0020 (2026-06-14)
**Dependencias:** Mejora 2 (presupuesto por categoría) para las alertas de límite

#### Qué hace
Tres tipos de alerta proactiva:
1. **Alerta de presupuesto** — al registrar una transacción, si esa categoría supera el 80% de su límite mensual → notificación inmediata del navegador
2. **Alerta de saldo proyectado** — al abrir la app, si el saldo proyectado en los próximos 15 días es negativo → aviso visible en pantalla (banner o toast)
3. **Recordatorio de recurrentes** — notificación cuando un gasto recurrente vence en los próximos 3 días

#### Estrategia de implementación
1. **Alerta de presupuesto:**
   - Ejecutar tras cada `finalizeTransaction()` exitoso
   - Calcular el gasto acumulado del mes en esa categoría
   - Si supera el 80% del `budget` definido → `showNotification()` con mensaje claro
   - Guardar en `localStorage` qué alertas ya se mostraron hoy para no repetir

2. **Alerta de saldo proyectado:**
   - Calcular en `renderDashboard()` el saldo actual menos los recurrentes de los próximos 15 días
   - Si el resultado es negativo → mostrar banner de advertencia en el dashboard
   - No usar notificación del navegador para esto — es información contextual, va en pantalla

3. **Recordatorio de recurrentes:**
   - Al iniciar la app, recorrer los gastos recurrentes
   - Si alguno vence en los próximos 3 días → notificación del navegador
   - Deduplicar con `localStorage` (ya existe lógica de dedup en la app)

#### Notas técnicas
- La infraestructura de notificaciones del navegador ya está implementada — reutilizarla
- No spamear: máximo una notificación por categoría por día

#### Sección y funciones afectadas
- No requiere nueva sección — trabaja sobre funciones existentes
- `finalizeTransaction()` (línea 7117) — agregar comprobación de límite de categoría tras guardar exitosamente en Firestore
- `renderDashboard()` (línea 6568) — agregar cálculo y banner de saldo proyectado negativo a 15 días
- `renderRecurringAlerts()` (línea 6540) — ya detecta vencimientos; ampliar con notificación del navegador para los que vencen en ≤ 3 días
- `budgetAlertsShown: {}` (línea 5698) — ya existe para deduplicar alertas de presupuesto; reutilizar el mismo patrón para las nuevas alertas

#### Criterio de aceptación
- [ ] Al guardar una transacción cuya categoría supera el 80% del límite → notificación del navegador aparece
- [ ] La notificación no se repite más de una vez por categoría por día
- [ ] Si el saldo proyectado a 15 días es negativo → banner visible en el dashboard
- [ ] Si un recurrente vence en ≤ 3 días → notificación del navegador al abrir la app
- [ ] Todo funciona aunque las notificaciones del navegador estén desactivadas (degradación sin errores)

---

### MEJORA 4 — Importar CSV/Excel de bancos
**Estado:** ✅ Completado
**Complejidad:** Media-alta
**Estimación:** 3-4 sesiones
**Versión completada:** V FSA 0021 (2026-06-14)
**Dependencias:** SheetJS ya incluido en la app para Excel

#### Qué hace
Botón "Importar extracto" en la sección de Registro. Acepta `.csv` y `.xlsx`. El usuario sube el archivo del banco, mapea las columnas, previsualiza las transacciones y confirma la importación. La app detecta duplicados y sugiere categorías automáticamente.

#### Estrategia de implementación

**Paso 1 — Subida del archivo**
- Input `<input type="file" accept=".csv,.xlsx,.xls">`
- Para `.xlsx/.xls`: parsear con SheetJS → convertir primera hoja a array de objetos
- Para `.csv`: detectar delimitador (`,` o `;`), detectar encoding (UTF-8 vs Latin-1), parsear manualmente o con FileReader

**Paso 2 — Detección de columnas**
- Mostrar tabla previa con las primeras 3 filas del archivo
- Dropdowns sobre cada columna para que el usuario indique: Fecha / Concepto / Monto / Tipo (ingreso/gasto) / Ignorar
- Guardar ese mapeo en `localStorage` asociado al nombre de banco detectado por el patrón de columnas
- En futuras importaciones del mismo banco → aplicar mapeo guardado automáticamente

**Paso 3 — Vista previa y limpieza**
- Mostrar tabla con las transacciones que se van a importar
- Parsear fechas en múltiples formatos (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
- Normalizar montos (quitar puntos de miles, convertir coma decimal a punto)
- Mostrar sugerencia de categoría basada en palabras clave del concepto:
  - "MERCADONA", "CARREFOUR", "LIDL" → Comida
  - "NETFLIX", "SPOTIFY", "HBO" → Entretenimiento
  - "REPSOL", "GASOLINERA", "BP" → Transporte
  - etc. (tabla de keywords ampliable)
- El usuario puede cambiar la categoría sugerida antes de importar

**Paso 4 — Detección de duplicados**
- Antes de importar, comparar cada transacción contra las existentes en el mes
- Criterio de duplicado: misma fecha + mismo monto + mismo tipo
- Marcar duplicados detectados con advertencia, dejar al usuario decidir si importar igual

**Paso 5 — Importación**
- Llamar a `finalizeTransaction()` en lote para cada transacción confirmada
- Mostrar resumen: "X transacciones importadas, Y duplicados omitidos"

#### Notas técnicas
- Cada banco tiene formato distinto — la clave es el mapeador flexible, no intentar hardcodear formatos
- Manejar el caso de montos negativos (muchos bancos los usan para gastos)
- El campo "Tipo" puede inferirse del signo del monto si el banco no tiene columna separada

#### Sección y funciones afectadas
- **Sección HTML:** `#section-registros` (línea ~4321) — agregar botón "Importar extracto" y el modal de importación (todo nuevo)
- `finalizeTransaction()` (línea 7117) — llamar en lote para cada transacción confirmada; verificar si admite llamadas consecutivas sin efectos secundarios
- `SheetJS` (`XLSX`) ya disponible globalmente en el scope del `<script>` — no requiere import adicional
- Todo el flujo de UI (modal de mapeo, tabla previa, detección de duplicados) es código nuevo

#### Criterio de aceptación
- [ ] Botón "Importar extracto" visible en la sección de Registros
- [ ] Acepta `.csv` y `.xlsx`
- [ ] El usuario puede asignar qué columna es fecha / concepto / monto
- [ ] Se muestra tabla previa antes de confirmar la importación
- [ ] Los posibles duplicados se marcan visualmente con advertencia
- [ ] El mapeo de columnas se guarda en localStorage para la próxima importación del mismo banco
- [ ] Resumen al final: "X transacciones importadas, Y duplicados omitidos"

---

### MEJORA 5 — Metas de ahorro
**Estado:** ⏳ Pendiente
**Complejidad:** Media
**Estimación:** 2-3 sesiones
**Versión completada:** —
**Dependencias:** Ninguna — sección nueva independiente

#### Qué hace
Nueva sección "Metas" en la navegación. El usuario crea objetivos de ahorro con nombre, monto objetivo y fecha límite. Registra abonos manuales hacia cada meta. La app muestra progreso, porcentaje y fecha estimada de cumplimiento.

#### Estrategia de implementación

**Modelo de datos en Firestore:**
```
metas: [
  {
    id, nombre, montoObjetivo, fechaLimite,
    abonos: [ { fecha, monto, nota } ],
    creadaEn, estado: 'activa' | 'completada' | 'cancelada'
  }
]
```

**UI — sección Metas:**
- Tarjetas por cada meta activa mostrando:
  - Nombre e ícono
  - Barra de progreso (ahorrado / objetivo)
  - Porcentaje completado
  - Monto restante
  - Fecha límite y días restantes
  - Fecha estimada de cumplimiento (calculada según ritmo de ahorro)
- Botón "Abonar" en cada tarjeta → modal simple con monto y nota opcional
- Botón "Nueva meta" → modal de creación
- Sección inferior: metas completadas y canceladas (colapsada)

**Cálculo de fecha estimada:**
- Promedio de abono mensual = total ahorrado / meses transcurridos desde creación
- Meses restantes = (objetivo - ahorrado) / promedio mensual
- Fecha estimada = hoy + meses restantes

#### Notas técnicas
- Si no hay abonos aún, no mostrar fecha estimada (mostrar "—")
- Meta completada: cuando ahorrado >= objetivo → cambiar estado y mostrar celebración (toast)
- Los abonos NO se registran como transacciones en el registro principal (son independientes)

#### Sección y funciones afectadas
- **Sección nueva:** `#section-metas` — agregar en HTML junto al resto de secciones (~línea 4560) y añadir ítem en la barra de navegación
- `renderAll()` (línea 10894) — agregar llamada a la nueva función `renderMetas()`
- `loadUserData()` (~línea 6063) — suscribir a colección `metas` en Firestore (mismo patrón que `creditCards`, línea 6176)
- `appState` (línea 5682) — agregar campo `metas: []`
- Colección Firestore `metas` — no existe aún, se crea con el primer `addDoc`

#### Criterio de aceptación
- [ ] Nueva sección "Metas" accesible desde la navegación
- [ ] El usuario puede crear una meta con nombre, monto objetivo y fecha límite
- [ ] Cada meta muestra barra de progreso, % completado, monto restante y días restantes
- [ ] Botón "Abonar" abre modal y registra el abono en Firestore
- [ ] La fecha estimada de cumplimiento se calcula si hay al menos un abono previo
- [ ] Al llegar al 100% → toast de celebración y estado cambia a "completada"
- [ ] Los datos persisten en Firestore entre sesiones

---

### MEJORA 6 — Deudas y préstamos
**Estado:** ⏳ Pendiente
**Complejidad:** Baja-media
**Estimación:** 1-2 sesiones
**Versión completada:** —
**Dependencias:** Ninguna — extensión de la sección existente de Tarjetas

#### Qué hace
Agregar soporte para préstamos de cuota fija (personal, coche, hipoteca) dentro de la sección de Tarjetas/Crédito, como una pestaña o modo adicional. Muestra saldo pendiente, cuota mensual, número de cuotas restantes y fecha de finalización.

#### Diferencia con tarjetas de crédito
| Tarjeta de crédito | Préstamo |
|---|---|
| Deuda revolving (varía cada mes) | Cuota fija mensual |
| Sin fecha de fin definida | Plazo fijo (N meses) |
| Tasa variable o diferida | Tasa de interés fija |
| Pago mínimo flexible | Cuota obligatoria |

#### Estrategia de implementación

**Modelo de datos:**
```
prestamos: [
  {
    id, nombre, montoOriginal, tasaInteres,
    cuotaMensual, totalCuotas, cuotasPagadas,
    fechaInicio, creadoEn
  }
]
```

**UI — pestaña "Préstamos" dentro de sección Crédito:**
- Tarjeta por cada préstamo mostrando:
  - Nombre (ej: "Préstamo coche Santander")
  - Saldo pendiente (calculado: montoOriginal - pagado)
  - Cuota mensual
  - Cuotas pagadas / total (ej: "8 de 36")
  - Barra de progreso de amortización
  - Fecha estimada de finalización
- Botón "Registrar pago" → marca una cuota como pagada y opcionalmente crea transacción en el registro
- Botón "Nuevo préstamo" → modal de alta

#### Notas técnicas
- El cálculo de saldo pendiente puede ser simplificado (sin amortización francesa completa) si el usuario no ingresa tasa de interés — simplemente montoOriginal / totalCuotas × cuotasRestantes
- Si ingresa tasa de interés → calcular tabla de amortización real

#### Sección y funciones afectadas
- **Sección HTML:** `#section-tarjetas` (línea ~4438) — agregar selector de pestañas "Tarjetas" / "Préstamos" dentro de la sección existente; no crear sección nueva
- `renderCreditCardsTable()` (línea 9116) — convertir en función con pestañas o crear función hermana `renderPrestamosTable()`
- `appState` (línea 5682) — agregar campo `prestamos: []`
- `loadUserData()` (~línea 6063) — suscribir a colección `prestamos` en Firestore (mismo patrón que `creditCards`, línea 6176)
- `renderCreditCardAlerts()` (línea 6524) — opcionalmente ampliar para incluir alertas de cuota de préstamo próxima a vencer

#### Criterio de aceptación
- [ ] La sección Tarjetas tiene dos pestañas: "Tarjetas/Crédito" (existente, sin cambios) y "Préstamos" (nueva)
- [ ] El usuario puede dar de alta un préstamo con nombre, monto, cuota mensual y total de cuotas
- [ ] Cada préstamo muestra: saldo pendiente, cuotas pagadas/total, barra de amortización y fecha de finalización
- [ ] Botón "Registrar pago" marca una cuota como pagada
- [ ] El comportamiento existente de tarjetas de crédito no se ve afectado

---

### MEJORA 7 — Escaneo de recibos (OCR)
**Estado:** ✅ Completado
**Complejidad:** Alta
**Estimación:** 2-3 sesiones
**Versión completada:** V FSA 0047 (2026-06-20)
**Dependencias:** Ninguna — pero implementar al final por complejidad

#### Qué hace
El usuario toma una foto del ticket de compra o sube una imagen. La app extrae el monto, la fecha y el comercio mediante OCR, y pre-rellena el formulario de registro de transacción para que el usuario solo confirme.

#### Decisión técnica — librería OCR
**Opción A — Tesseract.js (recomendada)**
- Procesamiento 100% local en el navegador, sin API externa
- Mantiene la privacidad (la imagen no sale del dispositivo)
- Agrega ~6MB a la carga inicial → resolver con lazy load (cargar solo cuando el usuario activa la función)
- Precisión: buena para texto impreso, limitada para tickets térmicos deteriorados

**Opción B — Google Cloud Vision API**
- Mucho más precisa, especialmente con tickets térmicos
- Requiere clave API, cuenta Google Cloud y tiene coste por uso (~1.5$/1000 imágenes)
- La imagen viaja a servidores de Google

**→ Implementar con Tesseract.js + lazy load. Si la precisión es insuficiente, migrar a Cloud Vision.**

#### Estrategia de implementación

**Paso 1 — Captura de imagen**
- Botón "Escanear ticket" en el modal de nueva transacción
- Input: `<input type="file" accept="image/*" capture="environment">` → abre cámara trasera en móvil
- También permite subir imagen desde galería

**Paso 2 — Pre-procesamiento**
- Convertir imagen a escala de grises y aumentar contraste antes del OCR
- Mejora significativamente la precisión en tickets térmicos
- Implementable con Canvas API sin librerías adicionales

**Paso 3 — OCR con Tesseract.js**
- Cargar Tesseract.js de forma lazy (solo cuando se usa esta función)
- Ejecutar reconocimiento sobre la imagen procesada
- Obtener texto completo del ticket

**Paso 4 — Extracción de datos**
- Monto: buscar el valor más alto precedido por "TOTAL", "IMPORTE", "A PAGAR" (regex)
- Fecha: detectar patrones DD/MM/YYYY, DD-MM-YYYY en el texto
- Comercio: tomar las primeras líneas del ticket (suele ser el nombre del establecimiento)

**Paso 5 — Pre-relleno del formulario**
- Abrir modal de nueva transacción con los campos extraídos ya rellenos
- El usuario revisa, corrige si es necesario, y confirma

#### Notas técnicas
- Tesseract.js carga con lazy: `import('tesseract.js')` solo al pulsar el botón por primera vez
- Mostrar spinner durante el procesamiento (puede tardar 2-5 segundos en móvil)
- Si el OCR falla o no extrae datos → abrir el formulario vacío igual, sin bloquear al usuario
- Idioma OCR: español (spa) — mejorar reconocimiento de caracteres especiales (€, ñ, tildes)

#### Sección y funciones afectadas
- **Punto de entrada:** modal de nueva transacción — `openCalcModal()` (línea 6933) — agregar botón "Escanear ticket" que inicia el flujo OCR
- `finalizeTransaction()` (línea 7117) — debe aceptar datos pre-rellenados del OCR (monto, fecha, descripción) como argumentos opcionales
- Tesseract.js se carga con `import()` dinámico la primera vez que el usuario pulsa el botón — no va en `<head>`
- Canvas API nativa (sin dependencias adicionales) para el pre-procesamiento de imagen

#### Criterio de aceptación
- [ ] Botón "Escanear ticket" visible en el modal de nueva transacción
- [ ] En móvil abre la cámara trasera; en desktop permite subir imagen desde galería
- [ ] Spinner visible mientras se procesa el OCR
- [ ] Si se extraen datos → formulario pre-relleno con monto, fecha y comercio detectados
- [ ] Si el OCR falla → formulario vacío abierto igual (sin mensaje de error bloqueante)
- [ ] Tesseract.js se descarga solo la primera vez que se usa, no en la carga inicial de la app
