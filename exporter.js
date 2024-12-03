//exporter.js

 // Exportar resultados a Excel con formato numérico correcto
export function exportarAExcel() {
    // Obtener la tabla
    const table = document.querySelector("table");
    const headers = Array.from(table.querySelectorAll("thead th")).map(th => th.textContent);
    
    // Obtener solo las filas visibles
    const rows = Array.from(table.querySelectorAll("tbody tr")).filter(row => row.style.display !== "none");

    // Crear el array de resultados basados en las filas visibles
    const resultados = rows.map(row => {
        const cells = row.querySelectorAll("td");
        let rowData = {};
        headers.forEach((header, index) => {
            rowData[header] = cells[index] ? cells[index].textContent : ''; // Manejar caso donde la celda sea undefined
        });
        return rowData;
    });

    // Definir las columnas en orden
    const columnasOrdenadas = [
        "Versión", "Serie", "Folio", "Tipo", "Fecha Emisión", "RFC Emisor", "Nombre Emisor", 
        "RFC Receptor", "Nombre Receptor", "Uso CFDI", "CP Receptor", 
        "RegimenFiscal Receptor", "SubTotal", "Descuento", "iva16", "iva8", 
        "iva0", "ieps", "retencionISR", "retencionIVA", "Total", 
        "totalImpuestosTrasladados", "Moneda", "Forma de Pago", 
        "Método de Pago", "Lugar Expedición", "UUID", "Descripción Conceptos", 
        "baseiva16", "baseiva8", "baseiva0", "baseieps"
    ];

    // Crear el worksheet asegurando el orden de las columnas
    const worksheet = XLSX.utils.json_to_sheet(resultados, { header: columnasOrdenadas });

    // Definir columnas que son numéricas
    const columnasNumericas = [
        "SubTotal", "Descuento", "iva16", "iva8", "iva0", "ieps", 
        "retencionISR", "retencionIVA", "Total", "totalImpuestosTrasladados", 
        "baseiva16", "baseiva8", "baseiva0", "baseieps"
    ];

    // Recorrer las filas de datos y convertir las celdas numéricas
    const rango = XLSX.utils.decode_range(worksheet['!ref']);
    for (let fila = rango.s.r + 1; fila <= rango.e.r; fila++) { // Saltar la fila de encabezado
        columnasNumericas.forEach(columna => {
            const celda = worksheet[XLSX.utils.encode_cell({ r: fila, c: columnasOrdenadas.indexOf(columna) })];
            if (celda && typeof celda.v === 'string') {
                // Eliminar cualquier símbolo de moneda y convertir a número
                const valor = parseFloat(celda.v.replace(/[^\d.-]/g, ''));  
                if (!isNaN(valor)) {
                    celda.t = 'n'; // 'n' indica que es un número
                    celda.v = valor; // Asegurarse de que el valor sea numérico
                }
            }
        });
    }

    // Crear el libro de trabajo (workbook)
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados");

    // Descargar el archivo Excel
    XLSX.writeFile(workbook, "resultados.xlsx");
}

