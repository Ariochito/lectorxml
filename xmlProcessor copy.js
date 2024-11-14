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
    '99': '99 - Por definir',
    'Transferencia':'03 - Transferencia electrónica de fondos',
    'Pago en una sola exhibición':'PUE-Pago en una sola exhibición',
    'Pago en parcialidades o diferido': 'PPD-Pago en parcialidades o diferido'
};

const TIPOS_DE_COMPROBANTE = {
    'I': 'Factura',
    'E': 'Nota de crédito',
    'T': 'Traslado',
    'N': 'Nómina',
    'P': 'Pago',
    'ingreso': 'Factura'
};

const METODOS_DE_PAGO = {
    'PUE': 'PUE-Pago en una sola exhibición',
    'PPD': 'PPD-Pago en parcialidades o diferido',
    'Pago en una sola exhibición':'PUE-Pago en una sola exhibición',
    'Pago en parcialidades o diferido': 'PPD-Pago en parcialidades o diferido',
    'Transferencia':'03 - Transferencia electrónica de fondos'
};

const USO_CFDI = {
    'G01': 'Adquisición de mercancías.',
    'G02': 'Devoluciones, descuentos o bonificaciones.',
    'G03': 'Gastos en general.',
    'I01': 'Construcciones.',
    'I02': 'Mobiliario y equipo de oficina por inversiones.',
    'I03': 'Equipo de transporte.',
    'I04': 'Equipo de computo y accesorios.',
    'I05': 'Dados, troqueles, moldes, matrices y herramental.',
    'I06': 'Comunicaciones telefónicas.',
    'I07': 'Comunicaciones satelitales.',
    'I08': 'Otra maquinaria y equipo.',
    'D01': 'Honorarios médicos, dentales y gastos hospitalarios.',
    'D02': 'Gastos médicos por incapacidad o discapacidad.',
    'D03': 'Gastos funerales.',
    'D04': 'Donativos.',
    'D05': 'Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación).',
    'D06': 'Aportaciones voluntarias al SAR.',
    'D07': 'Primas por seguros de gastos médicos.',
    'D08': 'Gastos de transportación escolar obligatoria.',
    'D09': 'Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones.',
    'D10': 'Pagos por servicios educativos (colegiaturas).',
    'S01': 'Sin efectos fiscales.  ',
    'CP01': 'Pagos',
    'CN01': 'Nómina',
};

// Lista de namespaces de CFDI para distintas versiones
const CFDI_NAMESPACES = [
    "http://www.sat.gob.mx/cfd/3",
    "http://www.sat.gob.mx/cfd/4",
    "http://www.sat.gob.mx/cfd/3.3",
    "http://www.sat.gob.mx/cfd/3.2",
    "http://www.sat.gob.mx/TimbreFiscalDigital"
];

// Función para obtener el nodo de acuerdo al primer namespace disponible en la lista
function getElementsByTagNameInNamespaces(xmlDoc, tagName) {
    for (const ns of CFDI_NAMESPACES) {
        const nodes = xmlDoc.getElementsByTagNameNS(ns, tagName);
        if (nodes.length > 0) return nodes;
    }
    return [];
}

// Función para obtener un único nodo
function getElementByTagNameInNamespaces(xmlDoc, tagName) {
    for (const ns of CFDI_NAMESPACES) {
        const node = xmlDoc.getElementsByTagNameNS(ns, tagName)[0];
        if (node) return node;
    }
    return null;
}

// Función auxiliar para obtener el valor de un atributo que puede tener diferentes nombres entre versiones
function getAttributeValue(node, possibleAttributes) {
    for (const attr of possibleAttributes) {
        if (node.hasAttribute(attr)) {
            return node.getAttribute(attr);
        }
    }
    return null;
}

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
    const impuestosNodes = getElementsByTagNameInNamespaces(xmlDoc, "Impuestos");

    if (!impuestosNodes || impuestosNodes.length === 0) {
        return {
            totalImpuestosTrasladados: "0.00",
            iva16: "0.00",
            iva8: "0.00",
            iva0: "0.00",
            ieps: "0.00"
        };
    }

    const impuestosTotales = impuestosNodes[impuestosNodes.length - 1];
    let totalImpuestosTrasladados = parseFloat(impuestosTotales.getAttribute("TotalImpuestosTrasladados")) || 0;
    let iva16 = 0.0, iva8 = 0.0, iva0 = 0.0, ieps = 0.0;

    const traslados = impuestosTotales.getElementsByTagNameNS(impuestosTotales.namespaceURI, "Traslado");
    for (let traslado of traslados) {
        const tipoImpuesto = getAttributeValue(traslado, ["Impuesto", "impuesto"]);
        let tasa = parseFloat(getAttributeValue(traslado, ["TasaOCuota", "tasa"]))|| 0;
 // Ajustar la tasa según la versión: si es menor o igual a 1, multiplicar por 100
        tasa = tasa <= 1 ? tasa * 100 : tasa;

        const importe = parseFloat(getAttributeValue(traslado,["Importe","importe"])) || 0;

        if (tipoImpuesto === '002' || tipoImpuesto === 'IVA') { // IVA
            if (tasa === 16.0) {
                iva16 += importe;
            } else if (tasa === 8.0) {
                iva8 += importe;
            } else if (tasa === 0.0) {
                iva0 += importe;
            }
        } else if (tipoImpuesto === '003' || tipoImpuesto === 'IEPS') { // IEPS
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
    const basesNodes = getElementsByTagNameInNamespaces(xmlDoc, "Impuestos");

    if (!basesNodes || basesNodes.length === 0) {
        return {
            baseiva16: "0.00",
            baseiva8: "0.00",
            baseiva0: "0.00",
            baseieps: "0.00"
        };
    }

    const basesTotales = basesNodes[basesNodes.length - 1];
    let baseiva16 = 0.0, baseiva8 = 0.0, baseiva0 = 0.0, baseieps = 0.0;

    const traslados = basesTotales.getElementsByTagNameNS(basesTotales.namespaceURI, "Traslado");
    for (let traslado of traslados) {
        const tipoImpuesto = getAttributeValue(traslado, ["Impuesto", "impuesto"]);
        const tasa = parseFloat(getAttributeValue(traslado, ["TasaOCuota", "tasa"])) * 100;
        const base = parseFloat(traslado.getAttribute("Base")) || 0;

        if (tipoImpuesto === '002' || tipoImpuesto === 'IVA') { // IVA
            if (tasa === 16.0) {
                baseiva16 += base;
            } else if (tasa === 8.0) {
                baseiva8 += base;
            } else if (tasa === 0.0) {
                baseiva0 += base;
            }
        } else if (tipoImpuesto === '003' || tipoImpuesto === 'IEPS') { // IEPS
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
    const retencionesNode = getElementByTagNameInNamespaces(xmlDoc, "Retenciones");

    if (!retencionesNode) {
        return {
            retencionIVA: "0.00",
            retencionISR: "0.00"
        };
    }

    let retencionIVA = 0.0, retencionISR = 0.0;

    const retenciones = retencionesNode.getElementsByTagNameNS(retencionesNode.namespaceURI, "Retencion");
    for (let retencion of retenciones) {
        const tipoImpuesto = getAttributeValue(retencion, ["Impuesto", "impuesto"]);
        const importe = parseFloat(getAttributeValue(retencion,["Importe","importe"])) || 0;

        if (tipoImpuesto === '002' || tipoImpuesto === 'IVA') { // IVA
            retencionIVA += importe;
        } else if (tipoImpuesto === '001' || tipoImpuesto === 'ISR') { // ISR
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
    const conceptos = getElementsByTagNameInNamespaces(xmlDoc, "Concepto");
    const descripciones = Array.from(conceptos).map(concepto => concepto.getAttribute("Descripcion") || 'N/A');
    return descripciones.join(" | ");
}




// Función para procesar un archivo XML
function procesarArchivoXML(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");

    const comprobante = getElementByTagNameInNamespaces(xmlDoc, "Comprobante");
    if (!comprobante) return null;

    const version = getAttributeValue(comprobante, ["Version", "version"]) || '';
    const tipoComprobante = TIPOS_DE_COMPROBANTE[getAttributeValue(comprobante, ["TipoDeComprobante", "tipoDeComprobante"])] || 'Desconocido';
    const fecha = formatearFecha(getAttributeValue(comprobante, ["Fecha", "fecha"]) || '');

    const emisor = getElementByTagNameInNamespaces(xmlDoc, "Emisor");
    const rfcEmisor = emisor ? getAttributeValue(emisor, ["Rfc", "rfc"]) : '';
    const nombreEmisor = emisor ? getAttributeValue(emisor, ["Nombre", "nombre"]) : '';

    const receptor = getElementByTagNameInNamespaces(xmlDoc, "Receptor");
    const rfcReceptor = receptor ? getAttributeValue(receptor, ["Rfc", "rfc"]) : '';
    const nombreReceptor = receptor ? getAttributeValue(receptor, ["Nombre", "nombre"]) : '';
    const usocfdireceptor = receptor ? USO_CFDI[getAttributeValue(receptor, ["UsoCFDI", "usoCFDI"])] : '';
    const DomicilioFiscalReceptor = receptor ? getAttributeValue(receptor, ["DomicilioFiscalReceptor", "codigoPostal    "]) : '';
    const RegimenReceptor = receptor ? getAttributeValue(receptor, ["RegimenFiscalReceptor", "regimenFiscalReceptor"]) : '';

    const subtotal = parseFloat(getAttributeValue(comprobante, ["SubTotal", "subTotal"])) || 0;
    const descuento = parseFloat(getAttributeValue(comprobante, ["Descuento", "descuento"])) || 0;
    const total = parseFloat(getAttributeValue(comprobante, ["Total", "total"])) || 0;
    const moneda = getAttributeValue(comprobante, ["Moneda", "moneda"]) || '';
    const formaPago = FORMAS_DE_PAGO[getAttributeValue(comprobante, ["FormaPago", "formaDePago"])] || 'Desconocido';
    const metodoPago = METODOS_DE_PAGO[getAttributeValue(comprobante, ["MetodoPago", "metodoDePago"])] || 'Desconocido';
    const lugarExpedicion = getAttributeValue(comprobante, ["LugarExpedicion", "lugarExpedicion"]) || '';

    const timbre = getElementByTagNameInNamespaces(xmlDoc, "TimbreFiscalDigital");
    const uuid = timbre ? getAttributeValue(timbre, ["UUID", "uuid"]) : '';

    // Función para EXTRAER PLACA
    function extraerPlaca(xmlDoc) {
        const cartaPorteNS = ["http://www.sat.gob.mx/CartaPorte31",
                              "http://www.sat.gob.mx/CartaPorte30",
                              "http://www.sat.gob.mx/CartaPorte20"

            ];
        
            let placa = "No disponible"

        // Intentar obtener el nodo "IdentificacionVehicular" dentro de "Autotransporte"
            for (const ns of cartaPorteNS) {
                const identificacionVehicularNode = xmlDoc.getElementsByTagNameNS(ns, "IdentificacionVehicular")[0];
                
                if ( identificacionVehicularNode){
                    placa=identificacionVehicularNode.getAttribute("PlacaVM")|| "";
                    break;
                }
            }

        return placa;
    }
    

    const placa= extraerPlaca(xmlDoc);
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
        "PlacaVM":placa,
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

