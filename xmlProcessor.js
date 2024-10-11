//xmlProcessor.js

// Diccionarios para convertir códigos a descripciones
const FORMAS_DE_PAGO = {
    '01': '01 - Efectivo',
    '02': '02 - Cheque nominativo',
    '03': '03 - Transferencia electrónica de fondos',
    '04': '04 - Tarjeta de crédito',
    '05': '05 - Monedero electrónico',
    '06': '06 - Dinero electrónico',
    '08': '08 - Vales de despensa',
    '12': '12 - Dación en pago',
    '13': '13 - Pago por subrogación',
    '14': '14 - Pago por consignación',
    '15': '15 - Condonación',
    '17': '17 - Compensación',
    '23': '23 - Novación',
    '24': '24 - Confusión',
    '25': '25 - Remisión de deuda',
    '26': '26 - Prescripción o caducidad',
    '27': '27 - A satisfacción del acreedor',
    '28': '28 - Tarjeta de débito',
    '29': '29 - Tarjeta de servicios',
    '30': '30 - Aplicación de anticipos',
    '31': '31 - Intermediario pagos',
    '99': '99 - Por definir'
};

const TIPOS_DE_COMPROBANTE = {
    'I': 'Factura',
    'E': 'Nota de crédito',
    'T': 'Traslado',
    'N': 'Nómina',
    'P': 'Pago'
};

const METODOS_DE_PAGO = {
    'PUE': 'PUE-Pago en una sola exhibición',
    'PPD': 'PPD-Pago en parcialidades o diferido'
};

const USO_CFDI= {
    'G01':'Adquisición de mercancías.',
    'G02':'Devoluciones, descuentos o bonificaciones.',
    'G03':'Gastos en general.',
    'I01':'Construcciones.',
    'I02':'Mobiliario y equipo de oficina por inversiones.',
    'I03':'Equipo de transporte.',
    'I04':'Equipo de computo y accesorios.',
    'I05':'Dados, troqueles, moldes, matrices y herramental.',
    'I06':'Comunicaciones telefónicas.',
    'I07':'Comunicaciones satelitales.',
    'I08':'Otra maquinaria y equipo.',
    'D01':'Honorarios médicos, dentales y gastos hospitalarios.',
    'D02':'Gastos médicos por incapacidad o discapacidad.',
    'D03':'Gastos funerales.',
    'D04':'Donativos.',
    'D05':'Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación).',
    'D06':'Aportaciones voluntarias al SAR.',
    'D07':'Primas por seguros de gastos médicos.',
    'D08':'Gastos de transportación escolar obligatoria.',
    'D09':'Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones.',
    'D10':'Pagos por servicios educativos (colegiaturas).',
    'S01':'Sin efectos fiscales.  ',
    'CP01':'Pagos',
    'CN01':'Nómina',


};


// Fin de los diccionarios para convertir códigos a descripciones


// Función para formatear fechas
function formatearFecha(fecha) {
    const fechaObj = new Date(fecha);
    const dia = String(fechaObj.getDate()).padStart(2, '0');
    const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
    const anio = fechaObj.getFullYear();
    return `${dia}-${mes}-${anio}`;
}


const formatoMoneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });


function extraerImpuestos(xmlDoc) {
    const impuestos_ns = "http://www.sat.gob.mx/cfd/4";
    const impuestosNodes = xmlDoc.getElementsByTagNameNS(impuestos_ns, "Impuestos");

    // Verificar si hay nodos de impuestos y tomar el último
    if (!impuestosNodes || impuestosNodes.length === 0) {
        return {
            totalImpuestosTrasladados: "0.00",
            iva16: "0.00",
            iva8: "0.00",
            iva0: "0.00",
            ieps: "0.00"
        };
    }

    // Tomar el último nodo de impuestos (el acumulado)
    const impuestosTotales = impuestosNodes[impuestosNodes.length - 1];

    let totalImpuestosTrasladados = parseFloat(impuestosTotales.getAttribute("TotalImpuestosTrasladados")) || 0;
    let iva16 = 0.0, iva8 = 0.0, iva0 = 0.0, ieps = 0.0;

    // Procesar los nodos de "Traslado" en el nodo de impuestos totales
    const traslados = impuestosTotales.getElementsByTagNameNS(impuestos_ns, "Traslado");
    for (let traslado of traslados) {
        const tipoImpuesto = traslado.getAttribute("Impuesto");
        const tasa = parseFloat(traslado.getAttribute("TasaOCuota")) * 100;
        const importe = parseFloat(traslado.getAttribute("Importe")) || 0;

        // Clasificar los impuestos trasladados por tipo y tasa
        if (tipoImpuesto === '002') { // IVA
            if (tasa === 16.0) {
                iva16 += importe;
            } else if (tasa === 8.0) {
                iva8 += importe;
            } else if (tasa === 0.0) {
                iva0 += importe;
            }
        } else if (tipoImpuesto === '003') { // IEPS
            ieps += importe;
        }
    }

    return {
        totalImpuestosTrasladados: formatoMoneda.format(totalImpuestosTrasladados),
        iva16: formatoMoneda.format(iva16),
        iva8: formatoMoneda.format(iva8),
        iva0: formatoMoneda.format(iva0),
        ieps: formatoMoneda.format(ieps)
    };
}


function extraerBases(xmlDoc) {
    const bases_ns = "http://www.sat.gob.mx/cfd/4";
    const basesNodes = xmlDoc.getElementsByTagNameNS(bases_ns, "Impuestos");

    // Verificar si hay nodos de impuestos y tomar el último
    if (!basesNodes || basesNodes.length === 0) {
        return {
            baseiva16: "0.00",
            baseiva8: "0.00",
            baseiva0: "0.00",
            baseieps: "0.00"
        };
    }


// Tomar el último nodo de bases (el acumulado)
const basesTotales = basesNodes[basesNodes.length - 1];

let baseiva16 = 0.0, baseiva8 = 0.0, baseiva0 = 0.0, baseieps = 0.0;

// Procesar los nodos de "Traslado" en el nodo de Base totales
const traslados = basesTotales.getElementsByTagNameNS(bases_ns, "Traslado");
for (let traslado of traslados) {
    const tipoImpuesto = traslado.getAttribute("Impuesto");
    const tasa = parseFloat(traslado.getAttribute("TasaOCuota")) * 100;
    const base = parseFloat(traslado.getAttribute("Base")) || 0;

    // Clasificar los impuestos trasladados por tipo y tasa
    if (tipoImpuesto === '002') { // IVA
        if (tasa === 16.0) {
            baseiva16 += base;
        } else if (tasa === 8.0) {
            baseiva8 += base;
        } else if (tasa === 0.0) {
            baseiva0 += base;
        }
    } else if (tipoImpuesto === '003') { // IEPS
        baseieps += base;
    }
}

return {
    baseiva16: formatoMoneda.format(baseiva16),
    baseiva8: formatoMoneda.format(baseiva8),
    baseiva0: formatoMoneda.format(baseiva0),
    baseieps: formatoMoneda.format(baseieps)
};
}


function extraerRetenciones(xmlDoc) {
    const impuestos_ns = "http://www.sat.gob.mx/cfd/4";
    const retencionesNode = xmlDoc.getElementsByTagNameNS(impuestos_ns, "Retenciones")[0];

    // Verificar si el nodo Retenciones existe
    if (!retencionesNode) {
        return {
            retencionIVA: "0.00",
            retencionISR: "0.00"
        };
    }

    let retencionIVA = 0.0, retencionISR = 0.0;

    const retenciones = retencionesNode.getElementsByTagNameNS(impuestos_ns, "Retencion");
    for (let retencion of retenciones) {
        const tipoImpuesto = retencion.getAttribute("Impuesto");
        const importe = parseFloat(retencion.getAttribute("Importe")) || 0;

        if (tipoImpuesto === '002') { // IVA
            retencionIVA += importe;
        } else if (tipoImpuesto === '001') { // ISR
            retencionISR += importe;
        }
    }

    return {
        retencionIVA: formatoMoneda.format(retencionIVA),
        retencionISR: formatoMoneda.format(retencionISR)
    };
}





// Función para extraer descripciones de conceptos
function extraerDescripciones(xmlDoc) {
    const conceptos = xmlDoc.getElementsByTagNameNS("http://www.sat.gob.mx/cfd/4", "Concepto");
    const descripciones = Array.from(conceptos).map(concepto => concepto.getAttribute("Descripcion") || 'N/A');
    return descripciones.join(" | ");
}

// Función para procesar un archivo XML
function procesarArchivoXML(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");

    const comprobante = xmlDoc.getElementsByTagNameNS("http://www.sat.gob.mx/cfd/4", "Comprobante")[0];
    if (!comprobante) return null;

    const version = comprobante.getAttribute("Version") || '';
    const tipoComprobante = TIPOS_DE_COMPROBANTE[comprobante.getAttribute("TipoDeComprobante")] || 'Desconocido';
    const fecha = formatearFecha(comprobante.getAttribute("Fecha") || '');

    const emisor = comprobante.getElementsByTagNameNS("http://www.sat.gob.mx/cfd/4", "Emisor")[0];
    const rfcEmisor = emisor ? emisor.getAttribute("Rfc") : '';
    const nombreEmisor = emisor ? emisor.getAttribute("Nombre") : '';

    const receptor = comprobante.getElementsByTagNameNS("http://www.sat.gob.mx/cfd/4", "Receptor")[0];
    const rfcReceptor = receptor ? receptor.getAttribute("Rfc") : '';
    const nombreReceptor = receptor ? receptor.getAttribute("Nombre") : '';
    const usocfdireceptor = receptor ? USO_CFDI[ receptor.getAttribute("UsoCFDI")] :'' ;
    const DomicilioFiscalReceptor = receptor ? receptor.getAttribute("DomicilioFiscalReceptor") : '';
    const RegimenReceptor = receptor ? receptor.getAttribute("RegimenFiscalReceptor") : '';

    const subtotal = parseFloat(comprobante.getAttribute("SubTotal")) || 0;
    const descuento = parseFloat(comprobante.getAttribute("Descuento")) || 0;
    const total = parseFloat(comprobante.getAttribute("Total")) || 0;


    const moneda = comprobante.getAttribute("Moneda") || '';
    const formaPago = FORMAS_DE_PAGO[comprobante.getAttribute("FormaPago")] || 'Desconocido';
    const metodoPago = METODOS_DE_PAGO[comprobante.getAttribute("MetodoPago")] || 'Desconocido';
    const lugarExpedicion = comprobante.getAttribute("LugarExpedicion") || '';

    const timbre = xmlDoc.getElementsByTagNameNS("http://www.sat.gob.mx/TimbreFiscalDigital", "TimbreFiscalDigital")[0];
    const uuid = timbre ? timbre.getAttribute("UUID") : '';

    const impuestos = extraerImpuestos(xmlDoc);
    const retenciones = extraerRetenciones(xmlDoc);
    const descripciones = extraerDescripciones(xmlDoc);
    const bases=extraerBases(xmlDoc);
    

    return {
        "Versión": version,
        "Tipo": tipoComprobante,
        "Fecha Emisión": fecha,
        "RFC Emisor": rfcEmisor,
        "Nombre Emisor": nombreEmisor,
        "RFC Receptor": rfcReceptor,
        "Nombre Receptor": nombreReceptor,
        "Uso CFDI": usocfdireceptor,
        "CP Receptor": DomicilioFiscalReceptor,
        "RegimenFiscal Receptor" : RegimenReceptor,
        "SubTotal": formatoMoneda.format(subtotal),
        "Descuento": formatoMoneda.format(descuento),
        "Total": formatoMoneda.format(total),
        "Moneda": moneda,
        "Forma de Pago": formaPago,
        "Método de Pago": metodoPago,
        "Lugar Expedición": lugarExpedicion,
        "UUID": uuid,
        "Descripción Conceptos": descripciones,
        ...impuestos,
        ...retenciones,
        ...bases

    };
}

// Procesar múltiples archivos
export async function procesarArchivos(files) {
    const archivos = Array.from(files);
    const resultados = await Promise.all(archivos.map(file => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(event) {
                const xmlText = event.target.result;
                const resultado = procesarArchivoXML(xmlText);
                resolve(resultado);
            };
            reader.onerror = function() {
                console.error("Error leyendo el archivo:", file.name);
                reject(new Error(`Error procesando el archivo ${file.name}`));
            };
            reader.readAsText(file);
        });
    }));

    return resultados;
}
