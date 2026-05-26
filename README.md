# Lector XML

Este proyecto permite procesar comprobantes CFDI en formato XML directamente en el navegador. Puedes cargar varios archivos, visualizar sus datos en una tabla, filtrarlos y exportar la información a Excel.

## Requisitos

- Un navegador moderno con soporte para módulos ES6.
- Para abrir `index.html` es necesario servir los archivos mediante un servidor HTTP local (por ejemplo Python o Node.js). Esto se debe a que los scripts se cargan como módulos y no funcionarán al abrir el archivo directamente con `file://`.
- Conexión a Internet para obtener la biblioteca `xlsx` desde el CDN indicado en `index.html`.

## Cómo abrir `index.html`

1. Sitúate en la carpeta del proyecto.
2. Inicia un servidor HTTP sencillo:
   - Con Python:
     ```bash
     python3 -m http.server 8000
     ```
   - O con Node.js utilizando `http-server`:
     ```bash
     npx http-server -p 8000
     ```
3. Abre tu navegador y visita `http://localhost:8000/index.html` (ajusta el puerto si es distinto).
4. Selecciona tus archivos XML y pulsa **Procesar Archivos** para visualizar la información. Puedes exportar la tabla filtrada a Excel con el botón **Exportar a Excel**.

## Propósito de cada script

- **index.html**: Interfaz principal de la aplicación. Incluye los campos para cargar archivos XML, botones de acción y el área donde se muestran los resultados.
- **main.js**: Punto de entrada del código JavaScript. Controla los botones de la página y coordina la lectura de los archivos usando `xmlProcessor copy.js`. También llama a `resultados.js`, `filtro.js` y `exporter.js` para mostrar la tabla, aplicar filtros y exportar los datos.
- **xmlProcessor copy.js**: Módulo utilizado por la aplicación para analizar cada XML. Extrae datos de distintas versiones de CFDI, calcula impuestos y genera un objeto con toda la información necesaria para la tabla.
- **xmlProcessor.js**: Versión alternativa del procesador de XML enfocada en CFDI 4. Se conserva como referencia pero no es importada en la página principal.
- **resultados.js**: Genera la tabla HTML donde se muestran los resultados obtenidos del procesador de XML.
- **filtro.js**: Añade filtros por columna en la tabla y gestiona la lógica para mostrar u ocultar filas según el texto ingresado.
- **exporter.js**: Convierte la tabla visible en un archivo Excel utilizando la biblioteca `xlsx`.
- **style.css**: Hoja de estilos que define la apariencia de la página y de la tabla de resultados.

