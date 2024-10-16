Export function filtrarPorTipo() {
    const filtroTipo = document.getElementById("filtro-tipo").value.toLowerCase();
    const table = document.querySelector("table");
    const tbody = table.querySelector("tbody");

    tbody.querySelectorAll("tr").forEach(row => {
        const tipoCelda = row.cells[1].textContent.toLowerCase(); // Asumimos que la columna "Tipo" está en el índice 1
        row.style.display = filtroTipo === "" || tipoCelda === filtroTipo ? "" : "none";
    });
}
