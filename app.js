// app.js - MCV Seguros Dashboard - Panel izquierdo de ramos y derecha de pólizas
let polizasData = [];
let itemsData = [];
let charts = {};
let currentTab = 'recurrente';
let currentEmpresa = 'Ambas';
let currentRamoSeleccionado = null;
let currentPolizaSearch = '';

// Cargar preferencia guardada
const savedEmpresa = localStorage.getItem('mcv_empresa');
if (savedEmpresa && ['GHM SRL', 'GHM Satelital SRL', 'Ambas'].includes(savedEmpresa)) currentEmpresa = savedEmpresa;

// Datos embebidos (ya validados)
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
    if (currentPolizaSearch) {
        const s = currentPolizaSearch.toLowerCase();
        base = base.filter(p => p.nro_poliza.toLowerCase().includes(s) || p.tomador.toLowerCase().includes(s) || p.ramo.toLowerCase().includes(s) || p.cobertura_corta.toLowerCase().includes(s) || itemsData.some(i => i.id_poliza === p.id_poliza && (i.item.toLowerCase().includes(s) || i.identificacion.toLowerCase().includes(s))));
    }
    return base;
}

// Obtener ramos agregados
function getRamosAgregados(polizas) {
    const ramosMap = new Map();
    for (const p of polizas) {
        if (!ramosMap.has(p.ramo)) ramosMap.set(p.ramo, []);
        ramosMap.get(p.ramo).push(p);
    }
    const ramos = [];
    for (const [ramo, pols] of ramosMap.entries()) {
        const gastoARS = pols.reduce((acc, p) => acc + p.costo_mensual_ars, 0);
        const gastoUSD = pols.reduce((acc, p) => acc + p.costo_mensual_usd, 0);
        ramos.push({ ramo, polizas: pols, gastoARS, gastoUSD, cantidad: pols.length });
    }
    ramos.sort((a, b) => a.ramo.localeCompare(b.ramo));
    return ramos;
}

function renderCurrentTab() {
    const todasPolizas = getPolizasFiltradas();
    updateKPIs(todasPolizas);
    updateCharts(todasPolizas);
    const ramos = getRamosAgregados(todasPolizas);
    renderRamosList(ramos);
    // Si hay un ramo seleccionado, mostrarlo; si no, seleccionar el primero
    if (currentRamoSeleccionado && ramos.some(r => r.ramo === currentRamoSeleccionado)) {
        const ramoData = ramos.find(r => r.ramo === currentRamoSeleccionado);
        renderPolizasList(ramoData.polizas);
        document.getElementById('ramoSeleccionadoTitulo').innerText = currentRamoSeleccionado;
        document.getElementById('polizasCount').innerHTML = ramoData.polizas.length;
    } else if (ramos.length > 0) {
        currentRamoSeleccionado = ramos[0].ramo;
        renderPolizasList(ramos[0].polizas);
        document.getElementById('ramoSeleccionadoTitulo').innerText = ramos[0].ramo;
        document.getElementById('polizasCount').innerHTML = ramos[0].polizas.length;
        // Resaltar tarjeta del ramo seleccionado (se hará en renderRamosList)
    } else {
        document.getElementById('polizasListContainer').innerHTML = '<div class="text-center text-gray-400 py-8">No hay pólizas</div>';
        document.getElementById('ramoSeleccionadoTitulo').innerText = 'Ninguno';
        document.getElementById('polizasCount').innerHTML = '0';
    }
}

function renderRamosList(ramos) {
    const container = document.getElementById('ramosListContainer');
    if (!container) return;
    container.innerHTML = '';
    for (const r of ramos) {
        const div = document.createElement('div');
        div.className = `p-3 cursor-pointer hover:bg-gray-50 transition ${currentRamoSeleccionado === r.ramo ? 'bg-blue-50 border-l-4 border-blue-400' : ''}`;
        div.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="font-medium text-gray-800 text-sm">${r.ramo}</div>
                <span class="text-xs bg-gray-100 px-2 py-0.5 rounded-full">${r.cantidad}</span>
            </div>
            <div class="text-xs text-gray-500 mt-1">
                Gasto: ${abreviaturaNumero(r.gastoARS)} ${r.gastoUSD ? `+ ${abreviaturaNumero(r.gastoUSD)} USD` : ''}
            </div>
        `;
        div.onclick = () => {
            currentRamoSeleccionado = r.ramo;
            renderCurrentTab(); // refresca todo y resalta el ramo
        };
        container.appendChild(div);
    }
}

function renderPolizasList(polizas) {
    const container = document.getElementById('polizasListContainer');
    if (!container) return;
    container.innerHTML = '';
    if (polizas.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-400 py-8">No hay pólizas en este ramo.</div>';
        return;
    }
    for (const poliza of polizas) {
        const card = document.createElement('div');
        card.className = 'bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition';
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <div class="font-mono text-sm font-bold text-gray-800">${poliza.nro_poliza}</div>
                    <div class="text-xs text-gray-500">${poliza.aseguradora}</div>
                </div>
                <div class="text-right">
                    <div class="text-sm font-semibold">${poliza.costo_mensual_ars ? '$'+poliza.costo_mensual_ars.toLocaleString() : '$0'} <span class="text-xs font-normal text-gray-500">ARS/mes</span></div>
                    ${poliza.costo_mensual_usd ? `<div class="text-xs text-gray-500">${poliza.costo_mensual_usd.toLocaleString()} USD/mes</div>` : ''}
                </div>
            </div>
            <div class="mt-2 text-xs text-gray-600">${poliza.cobertura_corta || 'Sin cobertura específica'}</div>
            <div class="mt-2 flex justify-between items-center">
                <div class="text-xs text-gray-500">Suma asegurada: ${abreviaturaNumero(poliza.suma_asegurada_total)}</div>
                <button class="ver-bienes-btn text-blue-500 hover:text-blue-700 text-xs" data-id="${poliza.id_poliza}">Ver ${poliza.cantidad_items} bienes</button>
            </div>
        `;
        container.appendChild(card);
    }
    // Reasignar eventos a los botones "Ver bienes"
    document.querySelectorAll('.ver-bienes-btn').forEach(btn => {
        btn.removeEventListener('click', window.verBienesHandler);
        const handler = (e) => {
            const idPoliza = btn.getAttribute('data-id');
            const poliza = polizasData.find(p => p.id_poliza === idPoliza);
            const items = itemsData.filter(i => i.id_poliza === idPoliza);
            const modal = document.getElementById('modalItems');
            const modalTitle = document.getElementById('modalTitle');
            const modalContent = document.getElementById('modalContent');
            modalTitle.innerText = `Bienes asegurados - ${poliza.nro_poliza} (${poliza.ramo})`;
            if (items.length === 0) {
                modalContent.innerHTML = '<p class="text-gray-500 text-center py-8">No hay bienes registrados para esta póliza.</p>';
            } else {
                let html = `<table class="min-w-full text-sm"><thead><tr><th class="text-left py-2">Bien asegurado</th><th class="text-left">Identificación</th><th class="text-right">Suma ARS</th><th class="text-right">Suma USD</th></tr></thead><tbody>`;
                for (const item of items) {
                    html += `<tr class="border-b"><td class="py-2">${item.item}</td><td class="py-2">${item.identificacion}</td><td class="py-2 text-right">${item.suma_asegurada_ars ? '$'+item.suma_asegurada_ars.toLocaleString() : '$0'}</td><td class="py-2 text-right">${item.suma_asegurada_usd ? '$'+item.suma_asegurada_usd.toLocaleString() : '-'}</td></tr>`;
                }
                html += `</tbody></table>`;
                modalContent.innerHTML = html;
            }
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            // Guardar id para exportación
            window.currentModalPolizaId = idPoliza;
        };
        btn.addEventListener('click', handler);
        window.verBienesHandler = handler;
    });
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

function exportModalItemsToCSV() {
    if (!window.currentModalPolizaId) return;
    const items = itemsData.filter(i => i.id_poliza === window.currentModalPolizaId);
    const poliza = polizasData.find(p => p.id_poliza === window.currentModalPolizaId);
    if (items.length === 0) return;
    const headers = ['Ítem asegurado', 'Identificación', 'Suma ARS', 'Suma USD'];
    const rows = items.map(i => [i.item, i.identificacion, i.suma_asegurada_ars, i.suma_asegurada_usd]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `items_${poliza.nro_poliza}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function exportToCSV() { /* similar a antes, exporta todos los ítems filtrados */ }
function exportToExcel() { /* similar */ }
async function exportToPDF() { /* similar */ }

// Eventos e inicialización
document.addEventListener('DOMContentLoaded', () => {
    renderCurrentTab();
    document.getElementById('lastUpdate').innerHTML = new Date().toLocaleTimeString() + ' - Datos embebidos';
    document.getElementById('refreshBtn')?.addEventListener('click', () => { renderCurrentTab(); alert('Datos recargados'); });
    document.getElementById('exportCSVBtn')?.addEventListener('click', exportToCSV);
    document.getElementById('exportExcelBtn')?.addEventListener('click', exportToExcel);
    document.getElementById('exportPDFBtn')?.addEventListener('click', exportToPDF);
    document.getElementById('closeModalBtn')?.addEventListener('click', () => {
        document.getElementById('modalItems').classList.add('hidden');
    });
    document.getElementById('exportModalItemsBtn')?.addEventListener('click', exportModalItemsToCSV);
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modalItems')) {
            document.getElementById('modalItems').classList.add('hidden');
        }
    });
    document.getElementById('searchPoliza')?.addEventListener('input', (e) => {
        currentPolizaSearch = e.target.value;
        currentRamoSeleccionado = null; // resetear selección al buscar
        renderCurrentTab();
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active', 'border-b-2', 'border-blue-400'));
            btn.classList.add('active', 'border-b-2', 'border-blue-400');
            currentTab = btn.getAttribute('data-tab');
            currentRamoSeleccionado = null;
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
            currentRamoSeleccionado = null;
            currentPolizaSearch = '';
            renderCurrentTab();
        });
    });
    
    const empresaBtn = Array.from(document.querySelectorAll('.empresa-btn')).find(b => b.getAttribute('data-empresa') === currentEmpresa);
    if (empresaBtn) empresaBtn.click();
});
