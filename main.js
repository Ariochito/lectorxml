//main.js

import { procesarArchivos } from './xmlProcessor.js';
import { mostrarResultados } from './resultados.js';
import { exportarAExcel } from './exporter.js';
import { agregarFiltrosATabla } from './filtro.js';


let resultadosGlobal = [];

document.getElementById("process-btn").addEventListener("click", async () => {
    const fileInput = document.getElementById("file-input");
    const files = fileInput.files;

    if (files.length === 0) {
        alert("Por favor, selecciona uno o más archivos XML.");
        return;
    }

    resultadosGlobal = await procesarArchivos(files);
    mostrarResultados(resultadosGlobal);
    agregarFiltrosATabla();

    const exportBtn = document.getElementById("export-btn");
    exportBtn.disabled = resultadosGlobal.length === 0;
});


 // Evento para el botón de exportar
 document.getElementById("export-btn").addEventListener("click", () => {
    if (resultadosGlobal.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }
    exportarAExcel(resultadosGlobal);
    alert("Archivo Excel generado exitosamente.");
});
