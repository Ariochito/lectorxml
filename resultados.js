//resultados.js

export function mostrarResultados(resultados) {
    const output = document.getElementById("output");
    output.innerHTML = ""; // Limpiar resultados previos

    const table = document.createElement("table");
    const headers = [
        "Versión", "Tipo", "Fecha Emisión", "RFC Emisor", "Nombre Emisor", "RFC Receptor",  "Nombre Receptor","Uso CFDI", "CP Receptor", "RegimenFiscal Receptor", "SubTotal", "Descuento", 
        "iva16", "iva8", "iva0", "ieps", "retencionISR", "retencionIVA",
        "Total", "totalImpuestosTrasladados", "Moneda", "Forma de Pago", "Método de Pago", "Lugar Expedición", "UUID", "Descripción Conceptos","baseiva16", "baseiva8", "baseiva0", "baseieps"
        
    ];

    const thead = document.createElement("thead");
    const trHead = document.createElement("tr");
    headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    resultados.forEach(resultado => {
        const tr = document.createElement("tr");
        headers.forEach(header => {
            const td = document.createElement("td");
            td.textContent = resultado[header] || "N/A";
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    output.appendChild(table);
}