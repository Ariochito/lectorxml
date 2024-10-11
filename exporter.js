//exporter.js

  // Exportar resultados a Excel con formato numérico correcto
export function exportarAExcel(resultados) {
    // Especificar el orden de las columnas
    const columnasOrdenadas = [
        "Versión", "Tipo", "Fecha Emisión", "RFC Emisor", "Nombre Emisor", 
        "RFC Receptor", "Nombre Receptor", "Uso CFDI", "CP Receptor", 
        "RegimenFiscal Receptor", "SubTotal", "Descuento", "iva16", "iva8", 
        "iva0", "ieps", "retencionISR", "retencionIVA", "Total", 
        "totalImpuestosTrasladados", "Moneda", "Forma de Pago", 
        "Método de Pago", "Lugar Expedición", "UUID", "Descripción Conceptos","baseiva16", "baseiva8", "baseiva0", "baseieps"
    ];

    // Crear el worksheet asegurando el orden de las columnas
    const worksheet = XLSX.utils.json_to_sheet(resultados, { header: columnasOrdenadas });

    // Identificar las columnas que contienen números
    const columnasNumericas = [
        "SubTotal", "Descuento", "iva16", "iva8", "iva0", "ieps", 
        "retencionISR", "retencionIVA", "Total", "totalImpuestosTrasladados"
        ,"baseiva16", "baseiva8", "baseiva0", "baseieps"
    ];

    // Recorrer las filas de datos
    const rango = XLSX.utils.decode_range(worksheet['!ref']);
    for (let fila = rango.s.r + 1; fila <= rango.e.r; fila++) { // Saltar la fila de encabezado
        columnasNumericas.forEach(columna => {
            const celda = worksheet[XLSX.utils.encode_cell({ r: fila, c: columnasOrdenadas.indexOf(columna) })];
            if (celda) {
                const valor = parseFloat(celda.v.replace(/[^\d.-]/g, ''));  // Eliminar cualquier símbolo de moneda y convertir a número
                if (!isNaN(valor)) {
                    celda.t = 'n'; // Tipo 'n' indica que es un número
                    celda.v = valor; // Asegurar que el valor sea un número real
                }
            }
        });
    }

    // Crear el libro de trabajo (workbook)
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados");

    // Exportar el archivo Excel
    XLSX.writeFile(workbook, "resultados.xlsx");
}
