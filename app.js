// app.js - MCV Seguros Dashboard - Versión final con todas las correcciones y mejoras
const POLIZAS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTizUhGOMK4CqFeegbAtWciBpS29ZZ8fvqaednZUMlwOFMZ9lzK0-0PpcJyacyifXeSJazpTIcLqL2q/pub?gid=0&single=true&output=csv';
const ITEMS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTizUhGOMK4CqFeegbAtWciBpS29ZZ8fvqaednZUMlwOFMZ9lzK0-0PpcJyacyifXeSJazpTIcLqL2q/pub?gid=1897816776&single=true&output=csv';

let polizasData = [];
let itemsData = [];
let tipoCambioUSD = 1200;
let charts = {};
let currentTab = 'recurrente';
let currentEmpresa = 'GHM SRL';   // solo para recurrentes
let currentRamoFiltro = null;
let currentPolizaSearch = '';

// ======================== DATOS CORREGIDOS POR PÓLIZA (sobrescriben CSV) ========================
// Estructura: key = número real de póliza (string)
const correcciones = new Map();

// 1) 68280884
correcciones.set('68280884', {
    premio_ars: 428549,
    suma_asegurada_total: 159676000,
    cobertura_corta: 'Privilegio L2 (completo)',
    vigencia_desde: '27/04/2026',
    vigencia_hasta: '27/07/2026',
    items: [
        { item: 'TOYOTA HILUX L/25 2.8 DC 4X4 TDI SRV+ AT6 2026 - AI002UK', identificacion: 'AI002UK', suma_ars: 79838000, suma_usd: 0 },
        { item: 'TOYOTA HILUX L/25 2.8 DC 4X4 TDI SRV+ AT6 2026 - AI002UJ', identificacion: 'AI002UJ', suma_ars: 79838000, suma_usd: 0 }
    ]
});
// 2) 58881286
correcciones.set('58881286', {
    premio_ars: 201561.17,
    suma_asegurada_total: 45000000,
    cobertura_corta: 'Privilegio L2 (completo)',
    vigencia_desde: '05/04/2026',
    vigencia_hasta: '05/07/2026',
    items: [
        { item: 'TOYOTA HILUX L/21 2.8 DC 4X4 TDI SR', identificacion: 'AF353UN', suma_ars: 45000000, suma_usd: 0 }
    ]
});
// 3) 58845801
correcciones.set('58845801', {
    premio_ars: 184357,
    suma_asegurada_total: 45000000, // solo la Nissan, el trailer es solo RC
    cobertura_corta: 'Privilegio L2 para Nissan / Arranque L2 para Trailer',
    vigencia_desde: '26/02/2026',
    vigencia_hasta: '26/05/2026',
    items: [
        { item: 'Trailer', identificacion: '101AF981GW', suma_ars: 0, suma_usd: 0, solo_rc: true },
        { item: 'Nissan Frontier', identificacion: 'AP981GW', suma_ars: 45000000, suma_usd: 0 }
    ]
});
// 4) 58881287
correcciones.set('58881287', {
    premio_ars: 698123,
    suma_asegurada_total: 38500000+37300000+45000000 = 120800000, // suma de los tres autos (trailer 0)
    cobertura_corta: 'Privilegio L2 para autos / Arranque L2 para trailer',
    vigencia_desde: '05/04/2026',
    vigencia_hasta: '05/07/2026',
    items: [
        { item: 'Toyota Hilux 2019', identificacion: 'AD571CC', suma_ars: 38500000, suma_usd: 0 },
        { item: 'Toyota Hilux 2017', identificacion: 'AB210EX', suma_ars: 37300000, suma_usd: 0 },
        { item: 'Toyota Hilux SW4 2018', identificacion: 'AC899XO', suma_ars: 45000000, suma_usd: 0 },
        { item: 'Trailer', identificacion: '101AB210EX', suma_ars: 0, suma_usd: 0, solo_rc: true }
    ]
});
// 5) 58844225
correcciones.set('58844225', {
    premio_ars: 15905,
    suma_asegurada_total: 0, // solo RC
    cobertura_corta: 'Arranque L2 (solo RC)',
    vigencia_desde: '14/02/2026',
    vigencia_hasta: '14/05/2026',
    items: [
        { item: 'Trailer', identificacion: '101AF353UN', suma_ars: 0, suma_usd: 0, solo_rc: true }
    ]
});
// 6) 58844224
correcciones.set('58844224', {
    premio_ars: 15905,
    suma_asegurada_total: 0,
    cobertura_corta: 'Arranque L2 (solo RC)',
    vigencia_desde: '14/02/2026',
    vigencia_hasta: '14/05/2026',
    items: [
        { item: 'Trailer', identificacion: '101AD571CC', suma_ars: 0, suma_usd: 0, solo_rc: true }
    ]
});
// 7) 67844592
correcciones.set('67844592', {
    premio_ars: 15336,
    suma_asegurada_total: 0,
    cobertura_corta: 'Arranque L2 (solo RC)',
    vigencia_desde: '17/02/2026',
    vigencia_hasta: '17/05/2026',
    items: [
        { item: 'Trailer', identificacion: '101AF981GW', suma_ars: 0, suma_usd: 0, solo_rc: true }
    ]
});
// 8) 41789769
correcciones.set('41789769', {
    premio_ars: 33358,
    suma_asegurada_total: 13807159,
    cobertura_corta: 'Plan Nro. 25 – solo siniestros totales',
    vigencia_desde: '05/03/2026',
    vigencia_hasta: '05/06/2026',
    items: [
        { item: 'Cuatriciclo', identificacion: '419HXK', suma_ars: 13807159, suma_usd: 0 }
    ]
});
// 9) 45598579
correcciones.set('45598579', {
    premio_ars: 57241,
    suma_asegurada_total: 11246000,
    cobertura_corta: 'Selecto L2 (completo)',
    vigencia_desde: '28/02/2026',
    vigencia_hasta: '31/05/2026',
    items: [
        { item: 'Beta Zontes 368 G', identificacion: 'A269GYK', suma_ars: 11246000, suma_usd: 0 }
    ]
});
// 10) 40156645
correcciones.set('40156645', {
    premio_ars: 12609,
    suma_asegurada_total: 4262287 + 5732041 = 9994328,
    cobertura_corta: 'Seguro Técnico – Equipo de contratista',
    vigencia_desde: '18/02/2026',
    vigencia_hasta: '18/08/2026',
    items: [
        { item: 'Moto de nieve SKI DOO 1', identificacion: 'N° serie no especificado', suma_ars: 4262287, suma_usd: 0 },
        { item: 'Moto de nieve SKI DOO 2', identificacion: 'N° serie no especificado', suma_ars: 5732041, suma_usd: 0 }
    ]
});
// 11) 40194044
correcciones.set('40194044', {
    premio_ars: 18008,
    suma_asegurada_total: 1500000,
    cobertura_corta: 'Robo exclusivo (excluye hurto)',
    vigencia_desde: '10/01/2026',
    vigencia_hasta: '10/07/2026',
    items: [
        { item: 'Equipos fotográficos', identificacion: 'N/A', suma_ars: 1500000, suma_usd: 0 }
    ]
});
// 12) 352086 (ART GHM Satelital)
correcciones.set('352086', {
    premio_ars: 439468,
    suma_asegurada_total: 0,
    cobertura_corta: 'ART – Ley 24.557 (riesgos del trabajo)',
    vigencia_desde: '01/09/2023',
    vigencia_hasta: '31/12/2026',
    items: [
        { item: '6 trabajadores', identificacion: 'CIIU 614090', suma_ars: 0, suma_usd: 0, es_prestacional: true }
    ]
});
// 13) 350751 (ART GHM SRL)
correcciones.set('350751', {
    premio_ars: 500164,
    suma_asegurada_total: 0,
    cobertura_corta: 'ART – Ley 24.557 (riesgos del trabajo)',
    vigencia_desde: '01/08/2023',
    vigencia_hasta: '31/12/2026',
    items: [
        { item: '14 trabajadores', identificacion: 'CIIU 591110', suma_ars: 0, suma_usd: 0, es_prestacional: true }
    ]
});
// 14) 54001250
correcciones.set('54001250', {
    premio_ars: 23135.76,
    suma_asegurada_total: 2400000,
    cobertura_corta: 'Vida Colectivo – Fallecimiento e Invalidez (Provincial San Juan)',
    vigencia_desde: '01/03/2026',
    vigencia_hasta: '01/03/2027',
    items: [
        { item: '8 asegurados', identificacion: 'Provincial San Juan', suma_ars: 2400000, suma_usd: 0 }
    ]
});
// 15) 54001127
correcciones.set('54001127', {
    premio_ars: 18760,
    suma_asegurada_total: 25968503.98,
    cobertura_corta: 'Vida Colectivo – Fallecimiento e Invalidez (Ley Contrato Trabajo)',
    vigencia_desde: '01/05/2026',
    vigencia_hasta: '01/03/2027',
    items: [
        { item: '8 asegurados', identificacion: 'Ley 20.744', suma_ars: 25968503.98, suma_usd: 0 }
    ]
});
// 16) 55004187
correcciones.set('55004187', {
    premio_ars: 2984.34,
    suma_asegurada_total: 14499100,
    cobertura_corta: 'Vida Colectivo – Fallecimiento (Decreto 1567/74)',
    vigencia_desde: '01/03/2026',
    vigencia_hasta: '01/03/2027',
    items: [
        { item: '7 asegurados', identificacion: 'No Doméstico', suma_ars: 14499100, suma_usd: 0 }
    ]
});
// 17) 54001267
correcciones.set('54001267', {
    premio_ars: 3373,
    suma_asegurada_total: 4200000,
    cobertura_corta: 'Vida Colectivo – Fallecimiento e Invalidez (Provincial San Juan)',
    vigencia_desde: '01/03/2026',
    vigencia_hasta: '01/03/2027',
    items: [
        { item: '14 asegurados', identificacion: 'Provincial San Juan', suma_ars: 4200000, suma_usd: 0 }
    ]
});
// 18) 54001112
correcciones.set('54001112', {
    premio_ars: 63830,
    suma_asegurada_total: 87302247.98,
    cobertura_corta: 'Vida Colectivo – Fallecimiento e Invalidez (Ley Contrato Trabajo)',
    vigencia_desde: '01/05/2026',
    vigencia_hasta: '01/03/2027',
    items: [
        { item: '13 asegurados', identificacion: 'Ley 20.744', suma_ars: 87302247.98, suma_usd: 0 }
    ]
});
// 19) 55004186
correcciones.set('55004186', {
    premio_ars: 2984.34,
    suma_asegurada_total: 26926900,
    cobertura_corta: 'Vida Colectivo – Fallecimiento (Decreto 1567/74)',
    vigencia_desde: '01/03/2026',
    vigencia_hasta: '01/03/2027',
    items: [
        { item: '13 asegurados', identificacion: 'No Doméstico', suma_ars: 26926900, suma_usd: 0 }
    ]
});
// 20) 4089566 (RC Comprensiva)
correcciones.set('4089566', {
    premio_ars: 36034.08,
    suma_asegurada_total: 68000000,
    cobertura_corta: 'RC Comprensiva – Instalación/mantenimiento sistemas de comunicación',
    vigencia_desde: '26/03/2026',
    vigencia_hasta: '26/03/2027',
    items: [] // sin bienes específicos
});
// 21-24) Caución (ya corregidas con datos del Excel adicional)
correcciones.set('1239222', {
    premio_ars: 48553.8,
    suma_asegurada_total: 3165500,
    cobertura_corta: 'Caución por Adjudicación – Garantía mantenimiento cámaras 4K (Expte. 1100-000717-2025)',
    vigencia_desde: '15/05/2026',
    vigencia_hasta: '15/08/2026',
    items: [{ item: 'Servicio cámaras 4K', identificacion: 'Expte. 1100-000717-2025', suma_ars: 3165500, suma_usd: 0 }]
});
correcciones.set('1234850', {
    premio_usd: 203.04,
    suma_asegurada_usd: 27500,
    cobertura_corta: 'Caución por Anticipo – Stand Fiesta del Sol (Pedido 4501322401)',
    vigencia_desde: '11/05/2026',
    vigencia_hasta: '11/08/2026',
    items: [{ item: 'Stand Fiesta del Sol', identificacion: 'Pedido 4501322401', suma_ars: 0, suma_usd: 27500 }]
});
correcciones.set('1234845', {
    premio_usd: 204.36,
    suma_asegurada_usd: 27694.35,
    cobertura_corta: 'Caución por Anticipo – Stand Fiesta del Sol (Pedido 4501322193)',
    vigencia_desde: '11/05/2026',
    vigencia_hasta: '11/08/2026',
    items: [{ item: 'Stand Fiesta del Sol', identificacion: 'Pedido 4501322193', suma_ars: 0, suma_usd: 27694.35 }]
});
correcciones.set('1233958', {
    premio_ars: 79019.4,
    suma_asegurada_total: 711100,
    cobertura_corta: 'Caución por Mantenimiento de Oferta – Garantía cámaras (Licitación 04/2025)',
    vigencia_desde: '22/10/2025',
    vigencia_hasta: '22/01/2026',
    items: [{ item: 'Mantenimiento cámaras', identificacion: 'Licitación 04/2025', suma_ars: 711100, suma_usd: 0 }]
});

// ======================== FUNCIONES AUXILIARES ========================
function abreviaturaNumero(num) {
    if (num === undefined || num === null || isNaN(num)) return '$0';
    if (num >= 1e9) return '$' + (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1e6) return '$' + (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1e3) return '$' + (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return '$' + num.toLocaleString();
}

function limpiarTexto(str) {
    if (!str) return '';
    return str.toString().trim().replace(/\s+/g, ' ');
}

function normalizarParaComparacion(str) {
    return limpiarTexto(str).toLowerCase();
}

function esRecurrente(p) {
    return p.proyecto_norm === 'estructura operativa';
}
function esEvento(p) {
    return p.proyecto_norm === 'expo san juan minero 2026';
}

async function obtenerTipoCambio() {
    try {
        const response = await fetch('https://dolarapi.com/v1/dolares/oficial');
        if (!response.ok) throw new Error();
        const data = await response.json();
        return parseFloat(data.venta);
    } catch {
        return 1200;
    }
}

function fetchCSV(url) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (err) => reject(err)
        });
    });
}

// Aplicar correcciones a una póliza
function aplicarCorrecciones(poliza, itemsOriginales) {
    const nro = poliza.nro_poliza;
    if (!correcciones.has(nro)) return { poliza, items: itemsOriginales };
    const corr = correcciones.get(nro);
    // Actualizar datos de la póliza
    if (corr.premio_ars !== undefined) poliza.costo_mensual_ars = corr.premio_ars;
    if (corr.premio_usd !== undefined) poliza.costo_mensual_usd = corr.premio_usd;
    if (corr.cobertura_corta) poliza.cobertura_corta = corr.cobertura_corta;
    if (corr.vigencia_desde) poliza.vigencia_desde = corr.vigencia_desde;
    if (corr.vigencia_hasta) poliza.vigencia_hasta = corr.vigencia_hasta;
    poliza.suma_asegurada_total = corr.suma_asegurada_total || 0;
    // Items corregidos
    let nuevosItems = corr.items || [];
    if (nuevosItems.length === 0 && itemsOriginales.length > 0) nuevosItems = itemsOriginales;
    return { poliza, items: nuevosItems };
}

async function loadAllData() {
    tipoCambioUSD = await obtenerTipoCambio();
    let polCSV = [], itemsCSV = [];
    try {
        polCSV = await fetchCSV(POLIZAS_CSV_URL);
        itemsCSV = await fetchCSV(ITEMS_CSV_URL);
    } catch(e) { console.warn(e); }
    
    // Mapear pólizas
    polizasData = (polCSV.length ? polCSV : []).map(p => {
        let proyectoRaw = limpiarTexto(p['Proyecto / Centro de Costo'] || '');
        let tomadorRaw = limpiarTexto(p.Tomador || '');
        let pagadorRaw = limpiarTexto(p['Pagador Real'] || tomadorRaw);
        let nroPolizaRaw = limpiarTexto(p['Nro Póliza'] || p.ID_Poliza || '');
        return {
            id_poliza: p.ID_Poliza?.toString().trim() || '',
            nro_poliza: nroPolizaRaw,
            tomador: tomadorRaw,
            empresa: tomadorRaw,
            pagador: pagadorRaw,
            proyecto_raw: proyectoRaw,
            proyecto_norm: normalizarParaComparacion(proyectoRaw),
            ramo: limpiarTexto(p.Ramo || ''),
            aseguradora: limpiarTexto(p.Aseguradora || ''),
            costo_mensual_ars: parseFloat(p['Costo Mensual ARS'] || 0),
            costo_mensual_usd: parseFloat(p['Costo Mensual USD'] || 0),
            vigencia_desde: p['Vigencia Desde'] || '',
            vigencia_hasta: p['Vigencia Hasta (fecha)'] || '',
            cobertura_corta: ''
        };
    });
    
    // Mapear items
    let itemsMap = new Map();
    (itemsCSV.length ? itemsCSV : []).forEach(i => {
        let idPol = i.ID_Poliza?.toString().trim() || '';
        if (!itemsMap.has(idPol)) itemsMap.set(idPol, []);
        itemsMap.get(idPol).push({
            item: limpiarTexto(i['Ítem asegurado'] || ''),
            identificacion: limpiarTexto(i['Identificación (Patente/DNI/Serie)'] || ''),
            suma_asegurada_ars: parseFloat(i['Suma Asegurada ARS'] || 0),
            suma_asegurada_usd: parseFloat(i['Suma Asegurada USD'] || 0)
        });
    });
    
    // Unificar empresas
    polizasData = polizasData.map(p => {
        let empresa = p.tomador;
        if (normalizarParaComparacion(empresa) === 'ghm contenidos') empresa = 'GHM SRL';
        if (normalizarParaComparacion(empresa) === 'ghm satelital') empresa = 'GHM Satelital SRL';
        if (normalizarParaComparacion(empresa).includes('ghm') && !normalizarParaComparacion(empresa).includes('satelital')) empresa = 'GHM SRL';
        let pagador = p.pagador;
        if (esEvento(p)) pagador = 'GHM SRL';
        return { ...p, empresa, pagador };
    });
    
    // Aplicar correcciones y reconstruir itemsData global
    let nuevosItems = [];
    polizasData = polizasData.map(p => {
        const itemsOrg = itemsMap.get(p.id_poliza) || [];
        const { poliza, items } = aplicarCorrecciones(p, itemsOrg);
        nuevosItems.push(...items.map(item => ({ ...item, id_poliza: poliza.id_poliza, nro_poliza: poliza.nro_poliza })));
        return poliza;
    });
    itemsData = nuevosItems;
    
    // Calcular suma asegurada total por póliza (suma de items)
    const sumaPorPoliza = new Map();
    itemsData.forEach(item => {
        const key = item.id_poliza;
        const suma = (item.suma_asegurada_ars || 0) + (item.suma_asegurada_usd || 0) * tipoCambioUSD;
        sumaPorPoliza.set(key, (sumaPorPoliza.get(key) || 0) + suma);
    });
    polizasData = polizasData.map(p => ({
        ...p,
        suma_asegurada_total: sumaPorPoliza.get(p.id_poliza) || 0,
        cantidad_items: itemsData.filter(i => i.id_poliza === p.id_poliza).length
    }));
    
    renderCurrentTab();
    document.getElementById('lastUpdate').innerHTML = new Date().toLocaleTimeString() + ' - USD $' + tipoCambioUSD;
}

// Obtener pólizas según pestaña y empresa
function getPolizasFiltradas() {
    let base = currentTab === 'recurrente' ? polizasData.filter(esRecurrente) : polizasData.filter(esEvento);
    if (currentTab === 'recurrente') {
        base = base.filter(p => p.empresa === currentEmpresa);
    }
    // Filtro por ramo seleccionado
    if (currentRamoFiltro) {
        base = base.filter(p => p.ramo === currentRamoFiltro);
    }
    // Búsqueda en detalle de pólizas
    if (currentPolizaSearch) {
        const searchLower = currentPolizaSearch.toLowerCase();
        base = base.filter(p => 
            p.nro_poliza.toLowerCase().includes(searchLower) ||
            p.tomador.toLowerCase().includes(searchLower) ||
            p.ramo.toLowerCase().includes(searchLower) ||
            p.cobertura_corta.toLowerCase().includes(searchLower) ||
            itemsData.some(i => i.id_poliza === p.id_poliza && (i.item.toLowerCase().includes(searchLower) || i.identificacion.toLowerCase().includes(searchLower)))
        );
    }
    return base;
}

function renderCurrentTab() {
    const polizas = getPolizasFiltradas();
    updateKPIs(polizas);
    updateCharts(polizas);
    renderRamoCards(polizas);
    if (currentRamoFiltro) {
        renderPolizasDetail(polizas);
        document.getElementById('polizasDetailContainer').classList.remove('hidden');
    } else {
        document.getElementById('polizasDetailContainer').classList.add('hidden');
    }
}

function updateKPIs(polizas) {
    let gastoARS = 0, gastoUSD = 0, sumaAsegurada = 0;
    const aseguradorasSet = new Set();
    for (const p of polizas) {
        gastoARS += p.costo_mensual_ars || 0;
        gastoUSD += (p.costo_mensual_usd || 0) * tipoCambioUSD;
        sumaAsegurada += p.suma_asegurada_total || 0;
        aseguradorasSet.add(p.aseguradora);
    }
    const gastoTotal = gastoARS + gastoUSD;
    document.getElementById('kpiGastoMensual').innerHTML = abreviaturaNumero(gastoTotal);
    document.getElementById('kpiGastoDetalle').innerHTML = `ARS ${gastoARS.toLocaleString()} / USD ${gastoUSD.toLocaleString()}`;
    document.getElementById('kpiSumaAsegurada').innerHTML = abreviaturaNumero(sumaAsegurada);
    document.getElementById('kpiPolizasActivas').innerHTML = polizas.length;
    document.getElementById('kpiAseguradoras').innerHTML = aseguradorasSet.size;
}

// Gestión de gráficos con toggle individual
let chartTypes = {
    gastoAseguradora: 'bar',
    gastoRamo: 'bar',
    patrimonioAseguradora: 'bar'
};

function updateCharts(polizas) {
    // Gasto por aseguradora
    const gastoAseguradora = {};
    for (const p of polizas) {
        const costo = (p.costo_mensual_ars || 0) + (p.costo_mensual_usd || 0) * tipoCambioUSD;
        gastoAseguradora[p.aseguradora] = (gastoAseguradora[p.aseguradora] || 0) + costo;
    }
    renderChart('chartGastoAseguradora', 'gastoAseguradora', gastoAseguradora, 'Gasto mensual ARS');
    
    // Gasto por ramo
    const gastoRamo = {};
    for (const p of polizas) {
        const costo = (p.costo_mensual_ars || 0) + (p.costo_mensual_usd || 0) * tipoCambioUSD;
        gastoRamo[p.ramo] = (gastoRamo[p.ramo] || 0) + costo;
    }
    renderChart('chartGastoRamo', 'gastoRamo', gastoRamo, 'Gasto mensual ARS');
    
    // Suma asegurada por aseguradora
    const sumaAseguradora = {};
    for (const p of polizas) {
        sumaAseguradora[p.aseguradora] = (sumaAseguradora[p.aseguradora] || 0) + (p.suma_asegurada_total || 0);
    }
    renderChart('chartPatrimonioAseguradora', 'patrimonioAseguradora', sumaAseguradora, 'Suma asegurada ARS');
}

function renderChart(canvasId, chartKey, dataObj, label) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const labels = Object.keys(dataObj);
    const values = Object.values(dataObj);
    if (charts[chartKey]) charts[chartKey].destroy();
    
    if (chartTypes[chartKey] === 'pie') {
        charts[chartKey] = new Chart(ctx, {
            type: 'pie',
            data: { labels: labels, datasets: [{ data: values, backgroundColor: ['#a5f3fc', '#bbf7d0', '#fed7aa', '#fbcfe8', '#c7d2fe', '#fecaca', '#d9f99d'] }] },
            options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (tooltipItem) => `${tooltipItem.label}: ${abreviaturaNumero(tooltipItem.raw)}` } } } }
        });
    } else {
        charts[chartKey] = new Chart(ctx, {
            type: 'bar',
            data: { labels: labels, datasets: [{ label: label, data: values, backgroundColor: '#a5f3fc', borderRadius: 8 }] },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true, onClick: (e, activeEls) => { if (activeEls.length) { const ramo = labels[activeEls[0].index]; currentRamoFiltro = ramo; renderCurrentTab(); document.getElementById('polizasDetailContainer').scrollIntoView({ behavior: 'smooth' }); } } }
        });
    }
}

// Tarjetas de resumen por ramo
function renderRamoCards(polizas) {
    const ramosMap = new Map();
    for (const poliza of polizas) {
        if (!ramosMap.has(poliza.ramo)) ramosMap.set(poliza.ramo, []);
        ramosMap.get(poliza.ramo).push(poliza);
    }
    const ramosArray = [];
    for (const [ramo, pols] of ramosMap.entries()) {
        let gastoARS = 0, gastoUSD = 0, sumaAsegurada = 0;
        const allItems = [];
        for (const p of pols) {
            gastoARS += p.costo_mensual_ars || 0;
            gastoUSD += (p.costo_mensual_usd || 0) * tipoCambioUSD;
            sumaAsegurada += p.suma_asegurada_total || 0;
            const itemsPol = itemsData.filter(i => i.id_poliza === p.id_poliza);
            allItems.push(...itemsPol.map(i => i.item));
        }
        const uniqueItems = [...new Set(allItems)];
        const resumenBienes = uniqueItems.slice(0, 3).join(', ') + (uniqueItems.length > 3 ? ` +${uniqueItems.length-3} más` : (uniqueItems.length === 0 ? 'Sin bienes individuales' : ''));
        ramosArray.push({ ramo, polizas: pols, gastoARS, gastoUSD, sumaAsegurada, cantidadPolizas: pols.length, resumenBienes });
    }
    ramosArray.sort((a,b) => (b.gastoARS+b.gastoUSD) - (a.gastoARS+a.gastoUSD));
    
    const container = document.getElementById('ramoCardsContainer');
    container.innerHTML = '';
    const searchTerm = document.getElementById('searchRamo')?.value.toLowerCase() || '';
    for (const rd of ramosArray) {
        if (searchTerm && !rd.ramo.toLowerCase().includes(searchTerm)) continue;
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl p-3 border border-[#e2e8f0] shadow-sm cursor-pointer hover:shadow-md transition';
        card.setAttribute('data-ramo', rd.ramo);
        card.addEventListener('click', () => {
            currentRamoFiltro = rd.ramo;
            currentPolizaSearch = '';
            document.getElementById('searchPoliza').value = '';
            renderCurrentTab();
            document.getElementById('polizasDetailContainer').scrollIntoView({ behavior: 'smooth' });
        });
        const icon = getIconForRamo(rd.ramo);
        card.innerHTML = `
            <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-1">
                    <i class="${icon} text-sm text-[#38bdf8]"></i>
                    <span class="font-semibold text-sm">${rd.ramo}</span>
                </div>
                <span class="text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">${rd.cantidadPolizas} pólizas</span>
            </div>
            <div class="text-xs text-gray-600 mb-1">
                Gasto: ${rd.gastoARS > 0 ? 'ARS '+rd.gastoARS.toLocaleString() : ''}${rd.gastoARS > 0 && rd.gastoUSD > 0 ? ' + ' : ''}${rd.gastoUSD > 0 ? 'USD '+(rd.gastoUSD/tipoCambioUSD).toLocaleString() : ''}
            </div>
            <div class="text-xs text-gray-500 truncate" title="${rd.resumenBienes}">${rd.resumenBienes}</div>
        `;
        container.appendChild(card);
    }
}

function getIconForRamo(ramo) {
    const r = ramo.toLowerCase();
    if (r.includes('automotor')) return 'fas fa-car';
    if (r.includes('art')) return 'fas fa-briefcase-medical';
    if (r.includes('vida')) return 'fas fa-heartbeat';
    if (r.includes('rc')) return 'fas fa-shield-alt';
    if (r.includes('caución')) return 'fas fa-handshake';
    if (r.includes('robo')) return 'fas fa-lock';
    return 'fas fa-file-alt';
}

function renderPolizasDetail(polizasFiltradas) {
    const container = document.getElementById('polizasListContainer');
    container.innerHTML = '';
    document.getElementById('ramoSeleccionadoTitulo').innerText = currentRamoFiltro || 'Todas';
    for (const poliza of polizasFiltradas) {
        const items = itemsData.filter(i => i.id_poliza === poliza.id_poliza);
        const displayNumber = poliza.nro_poliza || poliza.id_poliza;
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden';
        const header = document.createElement('div');
        header.className = 'p-3 flex flex-wrap justify-between items-center cursor-pointer hover:bg-gray-50 transition';
        header.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="fas fa-chevron-right text-gray-400 expand-icon-politica"></i>
                <div>
                    <div class="font-mono text-sm font-bold text-[#1e293b]">${displayNumber}</div>
                    <div class="text-xs text-gray-500">${poliza.aseguradora}</div>
                </div>
            </div>
            <div class="flex flex-wrap gap-3 text-xs">
                <div><span class="text-gray-500">Cobertura:</span> <span class="font-medium">${poliza.cobertura_corta || poliza.cobertura || 'No especificada'}</span></div>
                <div><span class="text-gray-500"><i class="fas fa-dollar-sign text-xs"></i> ARS:</span> ${poliza.costo_mensual_ars ? poliza.costo_mensual_ars.toLocaleString() : '0'}</div>
                ${poliza.costo_mensual_usd ? `<div><span class="text-gray-500"><i class="fas fa-dollar-sign text-xs"></i> USD:</span> ${poliza.costo_mensual_usd.toLocaleString()}</div>` : ''}
                <div><span class="text-gray-500"># Bienes:</span> ${poliza.cantidad_items}</div>
            </div>
        `;
        const body = document.createElement('div');
        body.className = 'hidden border-t border-[#e2e8f0] p-3 bg-gray-50';
        if (items.length === 0) {
            body.innerHTML = '<p class="text-gray-500 text-sm">No hay bienes registrados.</p>';
        } else {
            let tableHtml = `<table class="min-w-full text-xs"><thead><tr><th class="text-left">Ítem asegurado</th><th class="text-left">Identificación</th><th class="text-right">Suma ARS</th><th class="text-right">Suma USD</th></tr></thead><tbody>`;
            for (const item of items) {
                tableHtml += `<tr class="border-b">
                    <td class="py-1">${item.item || '-'}</td>
                    <td class="py-1">${item.identificacion || '-'}</td>
                    <td class="py-1 text-right">${item.suma_asegurada_ars ? '$'+item.suma_asegurada_ars.toLocaleString() : '$0'}</td>
                    <td class="py-1 text-right">${item.suma_asegurada_usd ? '$'+item.suma_asegurada_usd.toLocaleString() : '-'}</td>
                </tr>`;
            }
            tableHtml += `</tbody></table>`;
            body.innerHTML = tableHtml;
        }
        card.appendChild(header);
        card.appendChild(body);
        header.addEventListener('click', (e) => {
            e.stopPropagation();
            body.classList.toggle('hidden');
            const icon = header.querySelector('.expand-icon-politica');
            if (body.classList.contains('hidden')) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-right');
            } else {
                icon.classList.remove('fa-chevron-right');
                icon.classList.add('fa-chevron-down');
            }
        });
        container.appendChild(card);
    }
}

function exportToCSV() {
    let polizasAEportar = getPolizasFiltradas();
    const itemsToExport = [];
    for (const poliza of polizasAEportar) {
        const itemsPol = itemsData.filter(i => i.id_poliza === poliza.id_poliza);
        for (const item of itemsPol) {
            itemsToExport.push({
                item: item.item,
                identificacion: item.identificacion,
                tomador: poliza.tomador,
                aseguradora: poliza.aseguradora,
                ramo: poliza.ramo,
                vigencia_desde: poliza.vigencia_desde,
                vigencia_hasta: poliza.vigencia_hasta,
                suma_asegurada_ars: item.suma_asegurada_ars,
                costo_mensual_ars: poliza.costo_mensual_ars
            });
        }
    }
    const headers = ['Ítem Asegurado', 'Identificación', 'Empresa (Tomador)', 'Aseguradora', 'Ramo', 'Vigencia Desde', 'Vigencia Hasta', 'Suma Asegurada ARS', 'Costo Mensual ARS (póliza)'];
    const rows = itemsToExport.map(i => [
        i.item, i.identificacion, i.tomador, i.aseguradora, i.ramo, i.vigencia_desde, i.vigencia_hasta, i.suma_asegurada_ars, i.costo_mensual_ars
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `items_mcv_${currentTab}_${currentEmpresa}_${new Date().toISOString().slice(0,19)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

async function exportToPDF() {
    const element = document.querySelector('.max-w-7xl');
    if (!element) return;
    try {
        const canvas = await html2canvas(element, { scale: 2, logging: false });
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf || await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const imgWidth = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`resumen_mcv_${currentTab}_${currentEmpresa}.pdf`);
    } catch(e) { console.warn(e); alert('Error generando PDF'); }
}

// Eventos
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active', 'border-b-2', 'border-[#38bdf8]', 'text-[#1e293b]');
            b.classList.add('bg-gray-50', 'text-gray-600');
        });
        btn.classList.add('active', 'border-b-2', 'border-[#38bdf8]', 'text-[#1e293b]', 'bg-white');
        btn.classList.remove('bg-gray-50', 'text-gray-600');
        currentTab = btn.getAttribute('data-tab');
        currentRamoFiltro = null;
        currentPolizaSearch = '';
        document.getElementById('searchPoliza').value = '';
        document.getElementById('empresaSelectorContainer').style.display = currentTab === 'recurrente' ? 'block' : 'none';
        renderCurrentTab();
    });
});

document.querySelectorAll('.empresa-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.empresa-btn').forEach(b => b.classList.remove('active', 'bg-[#bbf7d0]', 'bg-[#fef9c3]'));
        btn.classList.add('active');
        if (btn.getAttribute('data-empresa') === 'GHM SRL') {
            btn.classList.add('bg-[#bbf7d0]');
            currentEmpresa = 'GHM SRL';
        } else {
            btn.classList.add('bg-[#fef9c3]');
            currentEmpresa = 'GHM Satelital SRL';
        }
        currentRamoFiltro = null;
        currentPolizaSearch = '';
        document.getElementById('searchPoliza').value = '';
        renderCurrentTab();
    });
});

document.getElementById('searchRamo')?.addEventListener('input', () => {
    const polizas = getPolizasFiltradas();
    renderRamoCards(polizas);
});
document.getElementById('searchPoliza')?.addEventListener('input', (e) => {
    currentPolizaSearch = e.target.value;
    renderCurrentTab();
});
document.getElementById('limpiarFiltroBtn')?.addEventListener('click', () => {
    currentRamoFiltro = null;
    currentPolizaSearch = '';
    document.getElementById('searchPoliza').value = '';
    renderCurrentTab();
});
document.getElementById('refreshBtn')?.addEventListener('click', loadAllData);
document.getElementById('exportCSVBtn')?.addEventListener('click', exportToCSV);
document.getElementById('exportPDFBtn')?.addEventListener('click', exportToPDF);

document.querySelectorAll('.toggleChartBtn').forEach(btn => {
    btn.addEventListener('click', () => {
        const chartKey = btn.getAttribute('data-chart');
        if (chartTypes[chartKey] === 'bar') chartTypes[chartKey] = 'pie';
        else chartTypes[chartKey] = 'bar';
        const polizas = getPolizasFiltradas();
        updateCharts(polizas);
    });
});

setInterval(loadAllData, 300000);
loadAllData();