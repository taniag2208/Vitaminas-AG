# QA — MVP Tita Discovery Studio

Ejecución: `npm run build && npm run preview` + `npm run e2e` (Chromium, Playwright) y `npm test` (Vitest).

## Criterios de aceptación obligatorios — 16/16 ✔

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Agregar una página la incorpora al mapa del sitio | Activar "Kits" → aparece en el mapa del sitio y abre en el simulador |
| 2 | Eliminar una página la retira de la navegación | Desactivar "Blog" → sale del menú, del footer y del mapa del sitio |
| 3 | Seleccionar una sección del Home la incorpora | Agregar "Testimonios" desde la paleta → aparece en el simulador |
| 4 | Reordenar cambia la posición | Con flechas y con **drag & drop real** (puntero) → cambia el orden en el simulador |
| 5 | Modificar un título actualiza el contenido | Editar el título del hero → el H1 del simulador cambia |
| 6 | Cambiar el diseño de filtros modifica su presentación | Lateral → horizontal → lateral |
| 7 | Aplicar filtros cambia los productos | Marca + objetivo: el contador coincide con las tarjetas, todas de la marca elegida; "Limpiar todo" restablece |
| 8 | Cambiar el layout de ficha modifica su estructura | Apilada + galería en cuadrícula + pestañas funcionales |
| 9 | Seleccionar variantes modifica la selección activa | "120 tabletas" queda activa (`aria-checked`) |
| 10 | Agregar al carrito actualiza el carrito | Contador, líneas, recálculo de subtotal y flujo de pedido demostrativo |
| 11 | La vista móvil se adapta | 390 px, menú hamburguesa, drawer de filtros y sin desbordamiento horizontal |
| 12 | Las anotaciones muestran especificaciones | Panel con funcionalidad, implementación, dependencias, riesgos y criterios; compatibilidad de tema "pendiente" |
| 13 | Las decisiones se conservan al recargar | Estado aprobado, título y orden persisten |
| 14 | La exportación JSON refleja las decisiones | Se validan páginas, secciones, título, filtros, ficha, encabezado, suscripciones y estado de aprobación; las otras 5 exportaciones no están vacías |
| 15 | Las funcionalidades por validar se identifican | Lista de deseos (adicional) y suscripciones (validación) muestran la advertencia y aparecen en PMO › Alcance |
| 16 | Volver a cualquier fase sin perder respuestas | Se navega entre las fases 4, 2 y 1 y se verifican sus respuestas |

Además, la prueba falla si hay errores de página o de consola. La ejecución final terminó sin errores.

## Pruebas unitarias del motor — 19/19 ✔

Integridad entre preguntas y configuración, anotaciones referenciadas, preguntas condicionales, mapa del sitio, filtros (AND entre atributos, OR dentro de un atributo), facetas, ordenamiento, atributos personalizados, clasificación de alcance, estados de decisión, requerimientos, riesgos y exportaciones.

## Defectos encontrados y corregidos durante el QA

- Varios `useEffect` devolvían implícitamente el resultado de `element.scrollTo()`, que en Chromium reciente es una Promise; React la trataba como función de limpieza y fallaba al cambiar de fase. Ahora esos efectos usan cuerpo con llaves.
- Etiquetas de alcance que desbordaban en el selector de páginas.
- El campo de newsletter del footer quedaba aplastado y el banner promocional ancho no ocupaba todo el contenedor.
- El desplazamiento hasta una sección recién agregada usaba `scrollIntoView`, que podía mover contenedores externos. Ahora el cálculo considera la escala del lienzo desktop.

## Limitaciones conocidas (MVP)

- La persistencia es local (localStorage); las imágenes cargadas se comprimen, pero muchas imágenes pueden agotar la cuota. La app avisa cuando el guardado falla.
- El catálogo de demostración es único (vertical bienestar). Las categorías nuevas sin productos demo muestran una colección vacía filtrada.
- El bundle JS pesa unos 530 kB (sin code-splitting). Es aceptable para una herramienta interna.
- La compatibilidad por tema no está modelada: al registrar el tema solo deja de mostrarse como "pendiente"; la verificación sigue siendo manual.
