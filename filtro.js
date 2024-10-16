no// Función para aplicar filtros en cada columna
export function agregarFiltrosATabla() {
    const table = document.querySelector("table");
    const thead = table.querySelector("thead");
    const trHead = thead.querySelector("tr");

    // Añadir un campo de entrada para cada columna
    const trFilter = document.createElement("tr");
    trHead.querySelectorAll("th").forEach(() => {
        const th = document.createElement("th");
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Filtrar";
        input.addEventListener("keyup", function () {
            filtrarTabla(this, table);
        });
        th.appendChild(input);
        trFilter.appendChild(th);
    });

    thead.appendChild(trFilter);
}

// Función para filtrar la tabla basada en el contenido de los filtros
export function filtrarTabla(input, table) {
    const columnIndex = input.parentElement.cellIndex;
    const filterValue = input.value.toLowerCase();
    const tbody = table.querySelector("tbody");

    tbody.querySelectorAll("tr").forEach(row => {
        const cellValue = row.cells[columnIndex].textContent.toLowerCase();
        row.style.display = cellValue.includes(filterValue) ? "" : "none";
    });
}

// Llama esta función después de generar la tabla para agregar los  // Llamada para agregar los filtros en la tabla
