// app.js - MCV Seguros Dashboard - Versión con tabla de pólizas + acordeón + coberturas específicas
const POLIZAS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTizUhGOMK4CqFeegbAtWciBpS29ZZ8fvqaednZUMlwOFMZ9lzK0-0PpcJyacyifXeSJazpTIcLqL2q/pub?gid=0&single=true&output=csv';
const ITEMS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTizUhGOMK4CqFeegbAtWciBpS29ZZ8fvqaednZUMlwOFMZ9lzK0-0PpcJyacyifXeSJazpTIcLqL2q/pub?gid=1897816776&single=true&output=csv';

let polizasData = [];
let itemsData = [];
let filteredPolizas = [];
let tipoCambioUSD = 1200;
let charts = {};
let currentSortColumn = 'id_poliza';
let currentSortDirection = 'asc';
let currentFilters = { aseguradora: '', ramo: '' };

// Mapeo de coberturas específicas extraídas de los PDFs (por ID_Poliza)
const coberturaMap = new Map([
    ["POL-001", "Privilegio L2 (completo: daños propios, robo, incendio, RC, granizo, cristales, asistencia)"],
    ["POL-002", "Privilegio L2 (completo)"],
    ["POL-003", "Múltiples coberturas: Trailer → Arranque L2 (solo RC); Nissan Frontier → Privilegio L2 (completo)"],
    ["POL-004", "Privilegio L2 (completo) en todos los vehículos"],
    ["POL-005", "Arranque L2 (solo RC)"],
    ["POL-006", "Arranque L2 (solo RC)"],
    ["POL-007", "Arranque L2 (solo RC)"],
    ["POL-008", "Plan Nro. 25 (cubre solo siniestros totales: accidente, incendio, robo; no daños parciales comunes)"],
    ["POL-009", "Selecto L2 (completo: daños, robo, incendio, RC, granizo, cristales, asistencia)"],
    ["POL-010", "Seguro Técnico - Equipos de contratistas (daños totales por accidente, incendio, robo; RC)"],
    ["POL-011", "Robo exclusivo (excluye hurto) - equipos fotográficos"],
    ["POL-012", "ART - Ley 24.557 (riesgos del trabajo)"],
    ["POL-013", "ART - Ley 24.557 (riesgos del trabajo)"],
    ["POL-014", "Vida Colectivo - Fallecimiento, Invalidez Total Permanente, Muerte por Accidente"],
    ["POL-015", "Vida Colectivo - Fallecimiento e Invalidez (según sueldo)"],
    ["POL-016", "Vida Colectivo - Fallecimiento"],
    ["POL-017", "Vida Colectivo - Fallecimiento, Invalidez, Muerte por Accidente"],
    ["POL-018", "Vida Colectivo - Fallecimiento e Invalidez (según sueldo)"],
    ["POL-019", "Vida Colectivo - Fallecimiento"],
    ["POL-020", "RC Comprensiva - Actividad telecomunicaciones (instalación/mantenimiento)"],
    ["POL-021", "Caución - Gobierno de San Juan"],
    ["POL-022", "Caución - Minera Andina del Sol"],
    ["POL-023", "Caución - Barrick Exploraciones"],
    ["POL-024", "Caución - Gobierno de San Juan (mantenimiento cámaras)"],
]);

// Para pólizas del evento, cobertura genérica (se puede detallar si se tienen PDFs)
for (let i = 25; i <= 50; i++) {
    coberturaMap.set(`POL-0${i}`, "Accidentes Personales / Seguro Integral para evento");
}

// Helper: abreviar números
function abreviaturaNumero(num) {
    if (num === undefined || num === null) return '$0';
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

async function loadAllData() {
    tipoCambioUSD = await obtenerTipoCambio();
    let polCSV = [], itemsCSV = [];
    try {
        polCSV = await fetchCSV(POLIZAS_CSV_URL);
        itemsCSV = await fetchCSV(ITEMS_CSV_URL);
    } catch(e) { console.warn(e); }
    
    polizasData = (polCSV.length ? polCSV : getSamplePolizas()).map(p => {
        let proyectoRaw = limpiarTexto(p['Proyecto / Centro de Costo'] || '');
        let tomadorRaw = limpiarTexto(p.Tomador || '');
        let pagadorRaw = limpiarTexto(p['Pagador Real'] || tomadorRaw);
        return {
            id_poliza: p.ID_Poliza?.toString().trim() || '',
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
            vigencia_hasta: p['Vigencia Hasta (fecha)'] || ''
        };
    });
    
    itemsData = (itemsCSV.length ? itemsCSV : getSampleItems()).map(i => ({
        id_poliza: i.ID_Poliza?.toString().trim() || '',
        item: limpiarTexto(i['Ítem asegurado'] || ''),
        identificacion: limpiarTexto(i['Identificación (Patente/DNI/Serie)'] || ''),
        suma_asegurada_ars: parseFloat(i['Suma Asegurada ARS'] || 0),
        suma_asegurada_usd: parseFloat(i['Suma Asegurada USD'] || 0)
    }));
    
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
    
    // Agregar cobertura desde el mapa
    polizasData = polizasData.map(p => ({
        ...p,
        cobertura: coberturaMap.get(p.id_poliza) || "No especificada"
    }));
    
    // Contar items por póliza
    const itemsPorPoliza = new Map();
    itemsData.forEach(item => {
        itemsPorPoliza.set(item.id_poliza, (itemsPorPoliza.get(item.id_poliza) || 0) + 1);
    });
    polizasData = polizasData.map(p => ({
        ...p,
        cantidad_items: itemsPorPoliza.get(p.id_poliza) || 0
    }));
    
    cargarFiltros();
    applyFiltersAndRender();
    document.getElementById('lastUpdate').innerHTML = new Date().toLocaleTimeString() + ' - USD $' + tipoCambioUSD;
}

function cargarFiltros() {
    const aseguradoras = [...new Set(polizasData.map(p => p.aseguradora))].sort();
    const ramos = [...new Set(polizasData.map(p => p.ramo))].sort();
    const selectAse = document.getElementById('filterAseguradora');
    const selectRamo = document.getElementById('filterRamo');
    if (selectAse) {
        selectAse.innerHTML = '<option value="">Todas aseguradoras</option>' + aseguradoras.map(a => `<option value="${a}">${a}</option>`).join('');
        selectAse.addEventListener('change', (e) => { currentFilters.aseguradora = e.target.value; actualizarBadges(); applyFiltersAndRender(); });
    }
    if (selectRamo) {
        selectRamo.innerHTML = '<option value="">Todos los ramos</option>' + ramos.map(r => `<option value="${r}">${r}</option>`).join('');
        selectRamo.addEventListener('change', (e) => { currentFilters.ramo = e.target.value; actualizarBadges(); applyFiltersAndRender(); });
    }
}

function actualizarBadges() { /* igual que antes */ }

function applyFiltersAndRender() {
    const activeBtn = document.querySelector('.viewSelectorBtn.active');
    const vista = activeBtn ? activeBtn.dataset.view : 'recurrente';
    const searchTerm = document.getElementById('searchTable')?.value.toLowerCase() || '';
    
    let base = polizasData;
    if (vista === 'recurrente') base = polizasData.filter(esRecurrente);
    if (vista === 'evento') base = polizasData.filter(esEvento);
    
    filteredPolizas = base.filter(p => 
        (p.id_poliza.toLowerCase().includes(searchTerm) || 
         p.aseguradora.toLowerCase().includes(searchTerm) ||
         p.empresa.toLowerCase().includes(searchTerm) ||
         p.pagador.toLowerCase().includes(searchTerm) ||
         p.cobertura.toLowerCase().includes(searchTerm)) &&
        (currentFilters.aseguradora === '' || p.aseguradora === currentFilters.aseguradora) &&
        (currentFilters.ramo === '' || p.ramo === currentFilters.ramo)
    );
    
    sortFilteredPolizas();
    updateKPIsRecurrentes();
    updateKPIsEvento();
    updateResumenEmpresas();
    updateTablaPolizasConAcordeon(); // nueva función
    updateChartsRecurrentes();
    updateChartGastoEmpresa();
}

function sortFilteredPolizas() {
    filteredPolizas.sort((a, b) => {
        let valA, valB;
        switch (currentSortColumn) {
            case 'id_poliza': valA = a.id_poliza; valB = b.id_poliza; break;
            case 'tomador': valA = a.tomador; valB = b.tomador; break;
            case 'aseguradora': valA = a.aseguradora; valB = b.aseguradora; break;
            case 'ramo': valA = a.ramo; valB = b.ramo; break;
            case 'cobertura': valA = a.cobertura; valB = b.cobertura; break;
            case 'costo_ars': valA = a.costo_mensual_ars; valB = b.costo_mensual_ars; break;
            case 'costo_usd': valA = a.costo_mensual_usd; valB = b.costo_mensual_usd; break;
            case 'cantidad_items': valA = a.cantidad_items; valB = b.cantidad_items; break;
            default: valA = a.id_poliza; valB = b.id_poliza;
        }
        if (typeof valA === 'string') {
            return currentSortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            return currentSortDirection === 'asc' ? valA - valB : valB - valA;
        }
    });
}

function updateKPIsRecurrentes() { /* igual que antes pero usando solo costo_ars y costo_usd sin convertir */ }
function updateKPIsEvento() { /* similar */ }
function updateResumenEmpresas() { /* similar */ }
function updateChartsRecurrentes() { /* similar */ }
function updateChartGastoEmpresa() { /* similar */ }

// Nueva función: tabla con acordeón
function updateTablaPolizasConAcordeon() {
    const tbody = document.getElementById('tablaBody');
    tbody.innerHTML = '';
    filteredPolizas.forEach(p => {
        const rowId = `row-${p.id_poliza}`;
        const items = itemsData.filter(i => i.id_poliza === p.id_poliza);
        
        // Fila principal
        let tr = document.createElement('tr');
        tr.className = 'border-b border-gray-100 hover:bg-gray-50 cursor-pointer';
        tr.setAttribute('data-poliza-id', p.id_poliza);
        tr.setAttribute('data-expanded', 'false');
        
        // Celda de ícono expandir
        const tdIcon = document.createElement('td');
        tdIcon.className = 'py-2 px-4 text-center';
        tdIcon.innerHTML = '<i class="fas fa-chevron-right text-gray-400 expand-icon"></i>';
        tr.appendChild(tdIcon);
        
        // Resto de celdas
        const celdas = [
            p.id_poliza,
            p.tomador,
            p.aseguradora,
            p.ramo,
            p.cobertura.length > 50 ? p.cobertura.substring(0,50)+'…' : p.cobertura,
            p.costo_mensual_ars ? '$'+p.costo_mensual_ars.toLocaleString() : '$0',
            p.costo_mensual_usd ? '$'+p.costo_mensual_usd.toLocaleString() : '-',
            p.cantidad_items || 0
        ];
        celdas.forEach((valor, idx) => {
            const td = document.createElement('td');
            td.className = 'py-2 px-4';
            td.textContent = valor;
            tr.appendChild(td);
        });
        
        // Fila detalle (acordeón) - inicialmente oculta
        const trDetail = document.createElement('tr');
        trDetail.className = 'hidden bg-gray-50';
        trDetail.id = `detail-${p.id_poliza}`;
        const tdDetail = document.createElement('td');
        tdDetail.colSpan = 9;
        tdDetail.className = 'p-4';
        
        if (items.length === 0) {
            tdDetail.innerHTML = '<p class="text-gray-500 text-sm">No hay bienes registrados para esta póliza.</p>';
        } else {
            let tableHtml = `<table class="min-w-full text-sm"><thead class="border-b"><tr><th class="text-left py-2">Ítem asegurado</th><th class="text-left">Identificación</th><th class="text-right">Suma ARS</th><th class="text-right">Suma USD</th><th class="text-left">Cobertura del bien</th></tr></thead><tbody>`;
            items.forEach(item => {
                let coberturaBien = p.cobertura;
                if (p.id_poliza === 'POL-003') {
                    if (item.item.includes('Trailer')) coberturaBien = "Arranque L2 (solo RC)";
                    else if (item.item.includes('Nissan')) coberturaBien = "Privilegio L2 (completo)";
                }
                tableHtml += `<tr class="border-b">
                    <td class="py-2">${item.item || '-'}</td>
                    <td class="py-2">${item.identificacion || '-'}</td>
                    <td class="py-2 text-right">${item.suma_asegurada_ars ? '$'+item.suma_asegurada_ars.toLocaleString() : '$0'}</td>
                    <td class="py-2 text-right">${item.suma_asegurada_usd ? '$'+item.suma_asegurada_usd.toLocaleString() : '-'}</td>
                    <td class="py-2">${coberturaBien}</td>
                </tr>`;
            });
            tableHtml += `</tbody></table>`;
            tdDetail.innerHTML = tableHtml;
        }
        trDetail.appendChild(tdDetail);
        
        tbody.appendChild(tr);
        tbody.appendChild(trDetail);
        
        // Evento click para expandir/colapsar
        tr.addEventListener('click', (e) => {
            e.stopPropagation();
            const expanded = tr.getAttribute('data-expanded') === 'true';
            const icon = tr.querySelector('.expand-icon');
            trDetail.classList.toggle('hidden');
            if (!expanded) {
                tr.setAttribute('data-expanded', 'true');
                icon.classList.remove('fa-chevron-right');
                icon.classList.add('fa-chevron-down');
            } else {
                tr.setAttribute('data-expanded', 'false');
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-right');
            }
        });
    });
}

// Exportar CSV con detalle de ítems (una fila por bien, con costo ARS de la póliza)
function exportToCSV() {
    const itemsToExport = [];
    for (const poliza of filteredPolizas) {
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
                costo_mensual_ars: poliza.costo_mensual_ars  // sin prorratear
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
    link.setAttribute('download', `items_mcv_${new Date().toISOString().slice(0,19)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Inicialización de eventos y carga
document.querySelectorAll('.viewSelectorBtn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.viewSelectorBtn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFiltersAndRender();
    });
});
document.getElementById('searchTable')?.addEventListener('input', applyFiltersAndRender);
document.getElementById('refreshBtn')?.addEventListener('click', loadAllData);
document.getElementById('exportCSVBtn')?.addEventListener('click', exportToCSV);

function initSorting() {
    const headers = document.querySelectorAll('#polizasTable .sortable');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.column;
            if (currentSortColumn === column) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = column;
                currentSortDirection = 'asc';
            }
            applyFiltersAndRender();
            headers.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
            header.classList.add(`sort-${currentSortDirection}`);
        });
    });
}

function getSamplePolizas() { /* igual */ }
function getSampleItems() { /* igual */ }

setInterval(loadAllData, 300000);
loadAllData().then(() => initSorting());