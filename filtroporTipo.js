export function filtrarPorTipo() {
    const filtroTipo = document.getElementById("filtro-tipo").value.toLowerCase();
    const table = document.querySelector("table");

    if (!table) {
        console.error("La tabla no existe en el DOM.");
        return;
    }

    const tbody = table.querySelector("tbody");

    if (!tbody) {
        console.error("El tbody no existe en la tabla.");
        return;
    }

    tbody.querySelectorAll("tr").forEach(row => {
        const tipoCelda = row.cells[1].textContent.toLowerCase(); // Asumimos que la columna "Tipo" está en el índice 1
        row.style.display = filtroTipo === "" || tipoCelda === filtroTipo ? "" : "none";
    });
}
