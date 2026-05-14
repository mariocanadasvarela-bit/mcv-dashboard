// app.js - MCV Seguros Dashboard - Versión con acordeón de ramos (Opción A)
let polizasData = [];
let itemsData = [];
let charts = {};
let currentTab = 'recurrente';
let currentEmpresa = 'Ambas';
let currentRamoFiltro = null;
let currentPolizaSearch = '';

// Cargar preferencia guardada
const savedEmpresa = localStorage.getItem('mcv_empresa');
if (savedEmpresa && ['GHM SRL', 'GHM Satelital SRL', 'Ambas'].includes(savedEmpresa)) currentEmpresa = savedEmpresa;

// Datos embebidos (los que ya funcionaban)
const datosPolizas = [
    { id_poliza: 'POL-001', nro_poliza: '68.280.884', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Automotor', aseguradora: 'La Segunda', costo_mensual_ars: 428549, costo_mensual_usd: 0, cobertura_corta: 'Privilegio L2 (completo)', suma_asegurada_total: 159676000, cantidad_items: 2, vigencia_desde: '27/04/2026', vigencia_hasta: '27/07/2026', proyecto_norm: 'estructura operativa' },
    { id_poliza: 'POL-002', nro_poliza: '58.881.286', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Automotor', aseguradora: 'La Segunda', costo_mensual_ars: 201561.17, costo_mensual_usd: 0, cobertura_corta: 'Privilegio L2 (completo)', suma_asegurada_total: 45000000, cantidad_items: 1, vigencia_desde: '05/04/2026', vigencia_hasta: '05/07/2026', proyecto_norm: 'estructura operativa' },
    { id_poliza: 'POL-003', nro_poliza: '58.845.801', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Automotor', aseguradora: 'La Segunda', costo_mensual_ars: 184357, costo_mensual_usd: 0, cobertura_corta: 'Privilegio L2 para Nissan / Arranque L2 para Trailer', suma_asegurada_total: 45000000, cantidad_items: 2, vigencia_desde: '26/02/2026', vigencia_hasta: '26/05/2026', proyecto_norm: 'estructura operativa' },
    { id_poliza: 'POL-004', nro_poliza: '58.881.287', tomador: 'GHM SRL', empresa: 'GHM SRL', ramo: 'Automotor', aseguradora: 'La Segunda', costo_mensual_ars: 698123, costo_mensual_usd: 0, cobertura_corta: 'Privilegio L2 para autos / Arranque L2 para trailer', suma_asegurada_total: 120800000, cantidad_items: 4, vigencia_desde: '05/04/2026', vigencia_hasta: '05/07/2026', proyecto_norm: 'estructura operativa' },
    { id_poliza: 'POL-005', nro_poliza: '58.844.225', tomador: 'GHM SRL', empresa: 'GHM SRL', ramo: 'Automotor', aseguradora: 'La Segunda', costo_mensual_ars: 15905, costo_mensual_usd: 0, cobertura_corta: 'Arranque L2 (solo RC)', suma_asegurada_total: 0, cantidad_items: 1, vigencia_desde: '14/02/2026', vigencia_hasta: '14/05/2026', proyecto_norm: 'estructura operativa' },
    { id_poliza: 'POL-006', nro_poliza: '67.844.592', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Automotor', aseguradora: 'La Segunda', costo_mensual_ars: 15336, costo_mensual_usd: 0, cobertura_corta: 'Arranque L2 (solo RC)', suma_asegurada_total: 0, cantidad_items: 1, vigencia_desde: '17/02/2026', vigencia_hasta: '17/05/2026', proyecto_norm: 'estructura operativa' },
    { id_poliza: 'POL-007', nro_poliza: '58.844.224', tomador: 'GHM SRL', empresa: 'GHM SRL', ramo: 'Automotor', aseguradora: 'La Segunda', costo_mensual_ars: 15905, costo_mensual_usd: 0, cobertura_corta: 'Arranque L2 (solo RC)', suma_asegurada_total: 0, cantidad_items: 1, vigencia_desde: '14/02/2026', vigencia_hasta: '14/05/2026', proyecto_norm: 'estructura operativa' },
    { id_poliza: 'POL-008', nro_poliza: '41.789.769', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Cuatriciclo', aseguradora: 'La Segunda', costo_mensual_ars: 33358, costo_mensual_usd: 0, cobertura_corta: 'Plan Nro. 25 – solo siniestros totales', suma_asegurada_total: 13807159, cantidad_items: 1, vigencia_desde: '05/03/2026', vigencia_hasta: '05/06/2026', proyecto_norm: 'estructura operativa' },
    { id_poliza: 'POL-009', nro_poliza: '45.598.579', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Moto', aseguradora: 'La Segunda', costo_mensual_ars: 57241, costo_mensual_usd: 0, cobertura_corta: 'Selecto L2 (completo)', suma_asegurada_total: 11246000, cantidad_items: 1, vigencia_desde: '28/02/2026', vigencia_hasta: '31/05/2026', proyecto_norm: 'estructura operativa' },
    { id_poliza: 'POL-010', nro_poliza: '40.156.645', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Seguro Técnico', aseguradora: 'La Segunda', costo_mensual_ars: 12609, costo_mensual_usd: 0, cobertura_corta: 'Seguro Técnico – Equipo de contratista', suma_asegurada_total: 9994328, cantidad_items: 2, vigencia_desde: '18/02/2026', vigencia_hasta: '18/08/2026', proyecto_norm: 'estructura operativa' },
    { id_poliza: 'POL-011', nro_poliza: '40.194.044', tomador: 'GHM SRL', empresa: 'GHM SRL', ramo: 'Robo', aseguradora: 'La Segunda', costo_mensual_ars: 18008, costo_mensual_usd: 0, cobertura_corta: 'Robo exclusivo (excluye hurto)', suma_asegurada_total: 1500000, cantidad_items: 1, vigencia_desde: '10/01/2026', vigencia_hasta: '10/07/2026', proyecto_norm: 'estructura operativa' },
    { id_poliza: 'POL-012', nro_poliza: '352.086', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'ART', aseguradora: 'La Segunda ART', costo_mensual_ars: 439468, costo_mensual_usd: 0, cobertura_corta: 'ART – Ley 24.557 (riesgos del trabajo)', suma_asegurada_total: 0, cantidad_items: 1, vigencia_desde: '01/09/2023', vigencia_hasta: '31/12/2026', proyecto_norm: 'estructura operativa' },
    { id_poliza: 'POL-013', nro_poliza: '350.751', tomador: 'GHM SRL', empresa: 'GHM SRL', ramo: 'ART', aseguradora: 'La Segunda ART', costo_mensual_ars: 500164, costo_mensual_usd: 0, cobertura_corta: 'ART – Ley 24.557 (riesgos del trabajo)', suma_asegurada_total: 0, cantidad_items: 1, vigencia_desde: '01/08/2023', vigencia_hasta: '31/12/2026', proyecto_norm: 'estructura operativa' },
    { id_poliza: 'POL-014', nro_poliza: '54.001.250', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Vida Colectivo', aseguradora: 'La Segunda Personas', costo_mensual_ars: 23135.76, costo_mensual_usd: 0, cobertura_corta: 'Vida Colectivo – Fallecimiento e invalidez (Provincial San Juan)', suma_asegurada_total: 2400000, cantidad_items: 1, vigencia_desde: '01/03/2026', vigencia_hasta: '01/03/2027', proyecto_norm: 'estructura operativa' },
    { id_poliza: 'POL-015', nro_poliza: '54.001.127', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Vida Colectivo', aseguradora: 'La Segunda Personas', costo_mensual_ars: 18760, costo_mensual_usd: 0, cobertura_corta: 'Vida Colectivo – Fallecimiento e invalidez (Ley Contrato Trabajo)', suma_asegurada_total: 25968503.98, cantidad_items: 1, vigencia_desde: '01/05/2026', vigencia_hasta: '01/03/2027', proyecto_norm: 'estructura operativa' },
    { id_poliza: 'POL-016', nro_poliza: '55.004.187', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Vida Colectivo', aseguradora: 'La Segunda Personas', costo_mensual_ars: 2984.34, costo_mensual_usd: 0, cobertura_corta: 'Vida Colectivo – Fallecimiento (Decreto 1567/74)', suma_asegurada_total: 14499100, cantidad_items: 1, vigencia_desde: '01/03/2026', vigencia_hasta: '01/03/2027', proyecto_norm: 'estructura operativa' },
    { id_poliza: 'POL-017', nro_poliza: '54.001.267', tomador: 'GHM SRL', empresa: 'GHM SRL', ramo: 'Vida Colectivo', aseguradora: 'La Segunda Personas', costo_mensual_ars: 3373, costo_mensual_usd: 0, cobertura_corta: 'Vida Colectivo – Fallecimiento e invalidez (Provincial San Juan)', suma_asegurada_total: 4200000, cantidad_items: 1, vigencia_desde: '01/03/2026', vigencia_hasta: '01/03/2027', proyecto_norm: 'estructura operativa' },
    { id_poliza: 'POL-018', nro_poliza: '54.001.112', tomador: 'GHM SRL', empresa: 'GHM SRL', ramo: 'Vida Colectivo', aseguradora: 'La Segunda Personas', costo_mensual_ars: 63830, costo_mensual_usd: 0, cobertura_corta: 'Vida Colectivo – Fallecimiento e invalidez (Ley Contrato Trabajo)', suma_asegurada_total: 87302247.98, cantidad_items: 1, vigencia_desde: '01/05/2026', vigencia_hasta: '01/03/2027', proyecto_norm: 'estructura operativa' },
    { id_poliza: 'POL-019', nro_poliza: '55.004.186', tomador: 'GHM SRL', empresa: 'GHM SRL', ramo: 'Vida Colectivo', aseguradora: 'La Segunda Personas', costo_mensual_ars: 2984.34, costo_mensual_usd: 0, cobertura_corta: 'Vida Colectivo – Fallecimiento (Decreto 1567/74)', suma_asegurada_total: 26926900, cantidad_items: 1, vigencia_desde: '01/03/2026', vigencia_hasta: '01/03/2027', proyecto_norm: 'estructura operativa' },
    { id_poliza: 'POL-020', nro_poliza: '4.089.566', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'RC Comprensiva', aseguradora: 'Federación Patronal', costo_mensual_ars: 36034.08, costo_mensual_usd: 0, cobertura_corta: 'RC Comprensiva – Instalación/mantenimiento sistemas de comunicación', suma_asegurada_total: 68000000, cantidad_items: 0, vigencia_desde: '26/03/2026', vigencia_hasta: '26/03/2027', proyecto_norm: 'estructura operativa' },
    { id_poliza: 'POL-021', nro_poliza: '1.239.222', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Caución', aseguradora: 'Aseguradores de Cauciones', costo_mensual_ars: 48553.8, costo_mensual_usd: 0, cobertura_corta: 'Caución por Adjudicación – Garantía mantenimiento cámaras 4K', suma_asegurada_total: 3165500, cantidad_items: 1, vigencia_desde: '15/05/2026', vigencia_hasta: '15/08/2026', proyecto_norm: 'estructura operativa' },
    { id_poliza: 'POL-022', nro_poliza: '1.234.850', tomador: 'GHM SRL', empresa: 'GHM SRL', ramo: 'Caución', aseguradora: 'Aseguradores de Cauciones', costo_mensual_ars: 0, costo_mensual_usd: 203.04, cobertura_corta: 'Caución por Anticipo – Stand Fiesta del Sol', suma_asegurada_total: 27500, cantidad_items: 1, vigencia_desde: '11/05/2026', vigencia_hasta: '11/08/2026', proyecto_norm: 'estructura operativa' },
    { id_poliza: 'POL-023', nro_poliza: '1.234.845', tomador: 'GHM SRL', empresa: 'GHM SRL', ramo: 'Caución', aseguradora: 'Aseguradores de Cauciones', costo_mensual_ars: 0, costo_mensual_usd: 204.36, cobertura_corta: 'Caución por Anticipo – Stand Fiesta del Sol', suma_asegurada_total: 27694.35, cantidad_items: 1, vigencia_desde: '11/05/2026', vigencia_hasta: '11/08/2026', proyecto_norm: 'estructura operativa' },
    { id_poliza: 'POL-024', nro_poliza: '1.233.958', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Caución', aseguradora: 'Aseguradores de Cauciones', costo_mensual_ars: 79019.4, costo_mensual_usd: 0, cobertura_corta: 'Caución por Mantenimiento de Oferta – Garantía cámaras', suma_asegurada_total: 711100, cantidad_items: 1, vigencia_desde: '22/10/2025', vigencia_hasta: '22/01/2026', proyecto_norm: 'estructura operativa' }
];

const datosItems = [
    { id_poliza: 'POL-001', item: 'TOYOTA HILUX L/25 2.8 DC 4X4 TDI SRV+ AT6 2026 - AI002UK', identificacion: 'AI002UK', suma_asegurada_ars: 79838000, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-001', item: 'TOYOTA HILUX L/25 2.8 DC 4X4 TDI SRV+ AT6 2026 - AI002UJ', identificacion: 'AI002UJ', suma_asegurada_ars: 79838000, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-002', item: 'TOYOTA HILUX L/21 2.8 DC 4X4 TDI SR', identificacion: 'AF353UN', suma_asegurada_ars: 45000000, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-003', item: 'Trailer', identificacion: '101AF981GW', suma_asegurada_ars: 0, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-003', item: 'Nissan Frontier', identificacion: 'AP981GW', suma_asegurada_ars: 45000000, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-004', item: 'Toyota Hilux 2019', identificacion: 'AD571CC', suma_asegurada_ars: 38500000, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-004', item: 'Toyota Hilux 2017', identificacion: 'AB210EX', suma_asegurada_ars: 37300000, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-004', item: 'Toyota Hilux SW4 2018', identificacion: 'AC899XO', suma_asegurada_ars: 45000000, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-004', item: 'Trailer', identificacion: '101AB210EX', suma_asegurada_ars: 0, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-005', item: 'Trailer', identificacion: '101AF353UN', suma_asegurada_ars: 0, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-006', item: 'Trailer', identificacion: '101AF981GW', suma_asegurada_ars: 0, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-007', item: 'Trailer', identificacion: '101AD571CC', suma_asegurada_ars: 0, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-008', item: 'Cuatriciclo', identificacion: '419HXK', suma_asegurada_ars: 13807159, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-009', item: 'Beta Zontes 368 G', identificacion: 'A269GYK', suma_asegurada_ars: 11246000, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-010', item: 'Moto de nieve SKI DOO 1', identificacion: 'N° serie no especificado', suma_asegurada_ars: 4262287, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-010', item: 'Moto de nieve SKI DOO 2', identificacion: 'N° serie no especificado', suma_asegurada_ars: 5732041, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-011', item: 'Equipos fotográficos', identificacion: 'N/A', suma_asegurada_ars: 1500000, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-012', item: '6 trabajadores', identificacion: 'CIIU 614090', suma_asegurada_ars: 0, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-013', item: '14 trabajadores', identificacion: 'CIIU 591110', suma_asegurada_ars: 0, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-014', item: '8 asegurados', identificacion: 'Provincial San Juan', suma_asegurada_ars: 2400000, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-015', item: '8 asegurados', identificacion: 'Ley 20.744', suma_asegurada_ars: 25968503.98, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-016', item: '7 asegurados', identificacion: 'No Doméstico', suma_asegurada_ars: 14499100, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-017', item: '14 asegurados', identificacion: 'Provincial San Juan', suma_asegurada_ars: 4200000, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-018', item: '13 asegurados', identificacion: 'Ley 20.744', suma_asegurada_ars: 87302247.98, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-019', item: '13 asegurados', identificacion: 'No Doméstico', suma_asegurada_ars: 26926900, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-021', item: 'Servicio cámaras 4K', identificacion: 'Expte. 1100-000717-2025', suma_asegurada_ars: 3165500, suma_asegurada_usd: 0 },
    { id_poliza: 'POL-022', item: 'Stand Fiesta del Sol', identificacion: 'Pedido 4501322401', suma_asegurada_ars: 0, suma_asegurada_usd: 27500 },
    { id_poliza: 'POL-023', item: 'Stand Fiesta del Sol', identificacion: 'Pedido 4501322193', suma_asegurada_ars: 0, suma_asegurada_usd: 27694.35 },
    { id_poliza: 'POL-024', item: 'Mantenimiento cámaras', identificacion: 'Licitación 04/2025', suma_asegurada_ars: 711100, suma_asegurada_usd: 0 }
];

polizasData = datosPolizas;
itemsData = datosItems;

function abreviaturaNumero(num) {
    if (num === undefined || num === null || isNaN(num)) return '$0';
    if (num >= 1e9) return '$' + (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1e6) return '$' + (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1e3) return '$' + (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return '$' + num.toLocaleString();
}

function limpiarTexto(str) { return str ? str.toString().trim() : ''; }
function normalizarParaComparacion(str) { return limpiarTexto(str).toLowerCase(); }
function esRecurrente(p) { return p.proyecto_norm === 'estructura operativa'; }
function esEvento(p) { return p.proyecto_norm === 'expo san juan minero 2026'; }

function getPolizasFiltradas() {
    let base = currentTab === 'recurrente' ? polizasData.filter(esRecurrente) : polizasData.filter(esEvento);
    if (currentTab === 'recurrente') {
        if (currentEmpresa === 'GHM SRL') base = base.filter(p => p.empresa === 'GHM SRL');
        else if (currentEmpresa === 'GHM Satelital SRL') base = base.filter(p => p.empresa === 'GHM Satelital SRL');
    }
    if (currentRamoFiltro) base = base.filter(p => p.ramo === currentRamoFiltro);
    if (currentPolizaSearch) {
        const s = currentPolizaSearch.toLowerCase();
        base = base.filter(p => p.nro_poliza.toLowerCase().includes(s) || p.tomador.toLowerCase().includes(s) || p.ramo.toLowerCase().includes(s) || p.cobertura_corta.toLowerCase().includes(s) || itemsData.some(i => i.id_poliza === p.id_poliza && (i.item.toLowerCase().includes(s) || i.identificacion.toLowerCase().includes(s))));
    }
    return base;
}

function renderCurrentTab() {
    const polizas = getPolizasFiltradas();
    updateKPIs(polizas);
    updateCharts(polizas);
    renderFiltrosRapidos(polizas);
    renderAgrupacionPorRamo(polizas);
}

function updateKPIs(polizas) {
    let gastoARS = 0, gastoUSD = 0, sumaAsegurada = 0;
    const aseguradorasSet = new Set();
    for (const p of polizas) {
        gastoARS += p.costo_mensual_ars || 0;
        gastoUSD += p.costo_mensual_usd || 0;
        sumaAsegurada += p.suma_asegurada_total || 0;
        aseguradorasSet.add(p.aseguradora);
    }
    const gastoTotal = gastoARS + gastoUSD;
    document.getElementById('kpiGastoMensual').innerHTML = abreviaturaNumero(gastoTotal);
    document.getElementById('kpiGastoDetalle').innerHTML = `ARS ${gastoARS.toLocaleString()} / USD ${gastoUSD.toLocaleString()}`;
    document.getElementById('kpiSumaAsegurada').innerHTML = abreviaturaNumero(sumaAsegurada);
    document.getElementById('kpiPolizasActivas').innerHTML = polizas.length;
    document.getElementById('kpiAseguradoras').innerHTML = aseguradorasSet.size;
    document.getElementById('polizasCount').innerHTML = polizas.length;
}

function updateCharts(polizas) {
    const gastoAseguradora = {};
    for (const p of polizas) {
        const costo = (p.costo_mensual_ars || 0) + (p.costo_mensual_usd || 0);
        gastoAseguradora[p.aseguradora] = (gastoAseguradora[p.aseguradora] || 0) + costo;
    }
    renderBarChart('chartGastoAseguradora', gastoAseguradora, 'Gasto mensual ARS');
    const gastoRamo = {};
    for (const p of polizas) {
        const costo = (p.costo_mensual_ars || 0) + (p.costo_mensual_usd || 0);
        gastoRamo[p.ramo] = (gastoRamo[p.ramo] || 0) + costo;
    }
    renderBarChart('chartGastoRamo', gastoRamo, 'Gasto mensual ARS');
}

function renderBarChart(canvasId, dataObj, label) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const labels = Object.keys(dataObj);
    const values = Object.values(dataObj);
    if (charts[canvasId]) charts[canvasId].destroy();
    charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label, data: values, backgroundColor: '#93c5fd', borderRadius: 6 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' } } }
    });
}

function renderFiltrosRapidos(polizas) {
    const ramos = [...new Set(polizas.map(p => p.ramo))].sort();
    const container = document.getElementById('filtrosRapidos');
    if (!container) return;
    container.innerHTML = '';
    ramos.forEach(ramo => {
        const btn = document.createElement('button');
        btn.className = `text-xs px-3 py-1 rounded-full border ${currentRamoFiltro === ramo ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`;
        btn.textContent = ramo;
        btn.onclick = () => {
            currentRamoFiltro = (currentRamoFiltro === ramo) ? null : ramo;
            renderCurrentTab();
            // Si se selecciona un ramo, expandir su acordeón y hacer scroll
            if (currentRamoFiltro) {
                const ramoContainer = document.getElementById(`ramo-${normalizarParaComparacion(ramo)}`);
                if (ramoContainer) {
                    const body = ramoContainer.querySelector('.ramo-body');
                    const icon = ramoContainer.querySelector('.ramo-icon');
                    if (body && body.classList.contains('hidden')) {
                        body.classList.remove('hidden');
                        if (icon) icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
                    }
                    ramoContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        };
        container.appendChild(btn);
    });
    if (currentRamoFiltro) {
        const clear = document.createElement('button');
        clear.className = 'text-xs px-3 py-1 rounded-full bg-gray-200 text-gray-600';
        clear.textContent = '✖ Limpiar filtro';
        clear.onclick = () => { currentRamoFiltro = null; renderCurrentTab(); };
        container.appendChild(clear);
    }
}

function renderAgrupacionPorRamo(polizas) {
    const container = document.getElementById('polizasListContainer');
    if (!container) return;
    container.innerHTML = '';
    if (polizas.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-gray-500">No hay pólizas que coincidan con los filtros.</div>';
        return;
    }
    // Agrupar por ramo
    const grupos = new Map();
    for (const p of polizas) {
        if (!grupos.has(p.ramo)) grupos.set(p.ramo, []);
        grupos.get(p.ramo).push(p);
    }
    // Ordenar ramos alfabéticamente
    const ramosOrdenados = Array.from(grupos.keys()).sort();
    for (const ramo of ramosOrdenados) {
        const pols = grupos.get(ramo);
        const gastoARS = pols.reduce((acc, p) => acc + p.costo_mensual_ars, 0);
        const gastoUSD = pols.reduce((acc, p) => acc + p.costo_mensual_usd, 0);
        const ramoId = `ramo-${normalizarParaComparacion(ramo)}`;
        const grupoDiv = document.createElement('div');
        grupoDiv.className = 'mb-6 border border-gray-200 rounded-xl overflow-hidden bg-white';
        grupoDiv.id = ramoId;
        // Cabecera del ramo (expansible)
        const header = document.createElement('div');
        header.className = 'flex justify-between items-center p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition';
        header.innerHTML = `
            <div class="flex items-center gap-3">
                <i class="fas fa-chevron-right ramo-icon text-gray-500 text-sm"></i>
                <span class="font-semibold text-gray-800">${ramo}</span>
                <span class="text-xs bg-gray-200 px-2 py-1 rounded-full">${pols.length} pólizas</span>
                <span class="text-xs text-gray-500">Gasto: ${abreviaturaNumero(gastoARS)} ${gastoUSD ? `+ ${abreviaturaNumero(gastoUSD)} USD` : ''}</span>
            </div>
            <i class="fas fa-chevron-down text-gray-400 text-xs ramo-expand-icon hidden"></i>
        `;
        // Cuerpo del ramo (contenedor de tarjetas de póliza)
        const body = document.createElement('div');
        body.className = 'ramo-body hidden p-4 bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
        // Generar tarjetas de póliza dentro del cuerpo
        for (const poliza of pols) {
            const items = itemsData.filter(i => i.id_poliza === poliza.id_poliza);
            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition';
            const cardHeader = document.createElement('div');
            cardHeader.className = 'p-4 cursor-pointer';
            cardHeader.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-mono text-sm font-bold text-gray-800">${poliza.nro_poliza}</div>
                        <div class="text-xs text-gray-500 mt-1">${poliza.aseguradora}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-sm font-semibold text-gray-800">${poliza.costo_mensual_ars ? '$'+poliza.costo_mensual_ars.toLocaleString() : '$0'} <span class="text-xs font-normal text-gray-500">ARS/mes</span></div>
                        ${poliza.costo_mensual_usd ? `<div class="text-xs text-gray-500">${poliza.costo_mensual_usd.toLocaleString()} USD/mes</div>` : ''}
                    </div>
                </div>
                <div class="mt-2 flex flex-wrap gap-2 text-xs">
                    <span class="bg-gray-100 px-2 py-1 rounded-full">${poliza.ramo}</span>
                    <span class="bg-gray-100 px-2 py-1 rounded-full">Suma asegurada: ${abreviaturaNumero(poliza.suma_asegurada_total)}</span>
                </div>
                <div class="mt-2 text-xs text-gray-600 line-clamp-2">${poliza.cobertura_corta || 'Sin cobertura específica'}</div>
                <div class="mt-3 flex justify-end">
                    <span class="text-xs text-blue-500 flex items-center gap-1"><i class="fas fa-chevron-down expand-icon text-xs"></i> Ver bienes (${poliza.cantidad_items})</span>
                </div>
            `;
            const cardBody = document.createElement('div');
            cardBody.className = 'hidden border-t border-gray-100 p-4 bg-gray-50';
            if (items.length === 0) {
                cardBody.innerHTML = '<p class="text-gray-500 text-sm">No hay bienes registrados.</p>';
            } else {
                let html = '<table class="min-w-full text-xs"><thead><tr><th class="text-left py-1">Ítem</th><th class="text-left">Identificación</th><th class="text-right">Suma ARS</th><th class="text-right">Suma USD</th></tr></thead><tbody>';
                for (const item of items) {
                    html += `<tr class="border-b"><td class="py-1">${item.item||'-'}</td><td class="py-1">${item.identificacion||'-'}</td><td class="py-1 text-right">${item.suma_asegurada_ars ? '$'+item.suma_asegurada_ars.toLocaleString() : '$0'}</td><td class="py-1 text-right">${item.suma_asegurada_usd ? '$'+item.suma_asegurada_usd.toLocaleString() : '-'}</td></tr>`;
                }
                html += '</tbody></table>';
                cardBody.innerHTML = html;
            }
            card.appendChild(cardHeader);
            card.appendChild(cardBody);
            cardHeader.onclick = (e) => {
                e.stopPropagation();
                cardBody.classList.toggle('hidden');
                const icon = cardHeader.querySelector('.expand-icon');
                if (cardBody.classList.contains('hidden')) {
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                } else {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                }
            };
            body.appendChild(card);
        }
        grupoDiv.appendChild(header);
        grupoDiv.appendChild(body);
        container.appendChild(grupoDiv);
        // Evento toggle del grupo de ramo
        header.onclick = () => {
            body.classList.toggle('hidden');
            const icon = header.querySelector('.ramo-icon');
            if (body.classList.contains('hidden')) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-right');
            } else {
                icon.classList.remove('fa-chevron-right');
                icon.classList.add('fa-chevron-down');
            }
        };
        // Si el ramo está actualmente filtrado (currentRamoFiltro), expandirlo automáticamente
        if (currentRamoFiltro && currentRamoFiltro === ramo) {
            body.classList.remove('hidden');
            const icon = header.querySelector('.ramo-icon');
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-down');
        }
    }
}

function exportToCSV() { /* mismo código de antes */ }
function exportToExcel() { /* mismo código de antes */ }
async function exportToPDF() { /* mismo código de antes */ }

// Inicialización (sin cambios)
document.addEventListener('DOMContentLoaded', () => {
    renderCurrentTab();
    document.getElementById('lastUpdate').innerHTML = new Date().toLocaleTimeString() + ' - Datos embebidos';
    document.getElementById('refreshBtn')?.addEventListener('click', () => { renderCurrentTab(); alert('Datos recargados'); });
    document.getElementById('exportCSVBtn')?.addEventListener('click', exportToCSV);
    document.getElementById('exportExcelBtn')?.addEventListener('click', exportToExcel);
    document.getElementById('exportPDFBtn')?.addEventListener('click', exportToPDF);
    document.getElementById('searchPoliza')?.addEventListener('input', (e) => { currentPolizaSearch = e.target.value; renderCurrentTab(); });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active', 'border-b-2', 'border-blue-400'));
            btn.classList.add('active', 'border-b-2', 'border-blue-400');
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
            const empresa = btn.getAttribute('data-empresa');
            currentEmpresa = empresa;
            localStorage.setItem('mcv_empresa', empresa);
            document.querySelectorAll('.empresa-btn').forEach(b => {
                b.classList.remove('bg-blue-100', 'text-blue-800', 'border-blue-300');
                b.classList.add('bg-gray-100', 'text-gray-700', 'border-gray-300');
            });
            btn.classList.remove('bg-gray-100', 'text-gray-700', 'border-gray-300');
            btn.classList.add('bg-blue-100', 'text-blue-800', 'border-blue-300');
            currentRamoFiltro = null;
            currentPolizaSearch = '';
            renderCurrentTab();
        });
    });
    
    const empresaBtn = Array.from(document.querySelectorAll('.empresa-btn')).find(b => b.getAttribute('data-empresa') === currentEmpresa);
    if (empresaBtn) empresaBtn.click();
});
