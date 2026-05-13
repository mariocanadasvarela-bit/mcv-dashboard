// app.js - MCV Seguros Dashboard - Versión final con pestañas y diseño de dos columnas
const POLIZAS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTizUhGOMK4CqFeegbAtWciBpS29ZZ8fvqaednZUMlwOFMZ9lzK0-0PpcJyacyifXeSJazpTIcLqL2q/pub?gid=0&single=true&output=csv';
const ITEMS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTizUhGOMK4CqFeegbAtWciBpS29ZZ8fvqaednZUMlwOFMZ9lzK0-0PpcJyacyifXeSJazpTIcLqL2q/pub?gid=1897816776&single=true&output=csv';

let polizasData = [];
let itemsData = [];
let tipoCambioUSD = 1200;
let charts = {};
let currentTab = 'recurrente';   // 'recurrente' o 'evento'
let currentRamoFiltro = null;

// Mapeo de coberturas específicas por número real de póliza (o fallback por ID)
const coberturaMap = new Map([
    ["68.280.884", "Privilegio L2 (completo: daños propios, robo, incendio, RC, granizo, cristales, asistencia)"],
    ["58.881.286", "Privilegio L2 (completo)"],
    ["58.845.801", "Múltiples coberturas: Trailer → Arranque L2 (solo RC); Nissan Frontier → Privilegio L2 (completo)"],
    ["58.881.287", "Privilegio L2 (completo) en todos los vehículos"],
    ["58.844.225", "Arranque L2 (solo RC)"],
    ["67.844.592", "Arranque L2 (solo RC)"],
    ["58.844.224", "Arranque L2 (solo RC)"],
    ["41.789.769", "Plan Nro. 25 (cubre solo siniestros totales: accidente, incendio, robo; no daños parciales comunes)"],
    ["45.598.579", "Selecto L2 (completo: daños, robo, incendio, RC, granizo, cristales, asistencia)"],
    ["40.156.645", "Seguro Técnico - Equipos de contratistas (daños totales por accidente, incendio, robo; RC)"],
    ["40.194.044", "Robo exclusivo (excluye hurto) - equipos fotográficos"],
    ["352086", "ART - Ley 24.557 (riesgos del trabajo)"],
    ["350751", "ART - Ley 24.557 (riesgos del trabajo)"],
    ["54.001.250", "Vida Colectivo - Fallecimiento, Invalidez Total Permanente, Muerte por Accidente"],
    ["54.001.127", "Vida Colectivo - Fallecimiento e Invalidez (según sueldo)"],
    ["55.004.187", "Vida Colectivo - Fallecimiento"],
    ["54.001.267", "Vida Colectivo - Fallecimiento, Invalidez, Muerte por Accidente"],
    ["54.001.112", "Vida Colectivo - Fallecimiento e Invalidez (según sueldo)"],
    ["55.004.186", "Vida Colectivo - Fallecimiento"],
    ["4.089.566", "RC Comprensiva - Actividad telecomunicaciones (instalación/mantenimiento)"],
]);

function getCobertura(poliza) {
    // Intentar por número real, luego por ID interno, luego por ramo
    if (poliza.nro_poliza && coberturaMap.has(poliza.nro_poliza)) return coberturaMap.get(poliza.nro_poliza);
    if (poliza.id_poliza && coberturaMap.has(poliza.id_poliza)) return coberturaMap.get(poliza.id_poliza);
    if (poliza.ramo && poliza.ramo.toLowerCase().includes('accidentes personales')) return "Accidentes Personales (muerte, invalidez, asistencia médica)";
    return "No especificada";
}

// Helper para abreviar números
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
        let nroPolizaRaw = limpiarTexto(p['Nro Póliza'] || '');
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

    // Agregar cobertura
    polizasData = polizasData.map(p => ({
        ...p,
        cobertura: getCobertura(p)
    }));

    // Calcular cantidad de items y suma asegurada total por póliza (en ARS convertido)
    const itemsPorPoliza = new Map();
    const sumaAseguradaPorPoliza = new Map();
    for (const item of itemsData) {
        const id = item.id_poliza;
        itemsPorPoliza.set(id, (itemsPorPoliza.get(id) || 0) + 1);
        const sumaItem = item.suma_asegurada_ars + (item.suma_asegurada_usd * tipoCambioUSD);
        sumaAseguradaPorPoliza.set(id, (sumaAseguradaPorPoliza.get(id) || 0) + sumaItem);
    }
    polizasData = polizasData.map(p => ({
        ...p,
        cantidad_items: itemsPorPoliza.get(p.id_poliza) || 0,
        suma_asegurada_total: sumaAseguradaPorPoliza.get(p.id_poliza) || 0
    }));

    // Aplicar filtro de pestaña y renderizar
    renderCurrentTab();
    document.getElementById('lastUpdate').innerHTML = new Date().toLocaleTimeString() + ' - USD $' + tipoCambioUSD;
}

function getPolizasPorTab() {
    if (currentTab === 'recurrente') return polizasData.filter(esRecurrente);
    else return polizasData.filter(esEvento);
}

function renderCurrentTab() {
    const polizasFiltradas = getPolizasPorTab();
    updateKPIs(polizasFiltradas);
    updateCharts(polizasFiltradas);
    renderRamoCards(polizasFiltradas);
    if (currentRamoFiltro) {
        const ramoObj = ramosData.find(r => r.ramo === currentRamoFiltro);
        if (ramoObj) renderPolizasDetail(ramoObj);
        else document.getElementById('polizasDetailContainer').classList.add('hidden');
    } else {
        document.getElementById('polizasDetailContainer').classList.add('hidden');
    }
}

// Variables globales para los datos de ramos (se regeneran en cada pestaña)
let ramosData = [];

function updateKPIs(polizas) {
    let gastoARS = 0, gastoUSD = 0, sumaAsegurada = 0;
    const aseguradorasSet = new Set();
    for (const p of polizas) {
        gastoARS += p.costo_mensual_ars;
        gastoUSD += p.costo_mensual_usd * tipoCambioUSD;
        sumaAsegurada += p.suma_asegurada_total;
        aseguradorasSet.add(p.aseguradora);
    }
    const gastoTotal = gastoARS + gastoUSD;
    document.getElementById('kpiGastoMensual').innerHTML = abreviaturaNumero(gastoTotal);
    document.getElementById('kpiSumaAsegurada').innerHTML = abreviaturaNumero(sumaAsegurada);
    document.getElementById('kpiPolizasActivas').innerHTML = polizas.length;
    document.getElementById('kpiAseguradoras').innerHTML = aseguradorasSet.size;
}

function updateCharts(polizas) {
    // Gasto por aseguradora
    const gastoAseguradora = {};
    for (const p of polizas) {
        const costo = p.costo_mensual_ars + (p.costo_mensual_usd * tipoCambioUSD);
        gastoAseguradora[p.aseguradora] = (gastoAseguradora[p.aseguradora] || 0) + costo;
    }
    if (charts.gastoAseguradora) charts.gastoAseguradora.destroy();
    const gastoCtx = document.getElementById('chartGastoAseguradora').getContext('2d');
    charts.gastoAseguradora = new Chart(gastoCtx, {
        type: 'bar',
        data: { labels: Object.keys(gastoAseguradora), datasets: [{ label: 'Gasto mensual ARS', data: Object.values(gastoAseguradora), backgroundColor: '#003b5c', borderRadius: 8 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true }
    });

    // Gasto por ramo
    const gastoRamo = {};
    for (const p of polizas) {
        const costo = p.costo_mensual_ars + (p.costo_mensual_usd * tipoCambioUSD);
        gastoRamo[p.ramo] = (gastoRamo[p.ramo] || 0) + costo;
    }
    if (charts.gastoRamo) charts.gastoRamo.destroy();
    const ramoCtx = document.getElementById('chartGastoRamo').getContext('2d');
    charts.gastoRamo = new Chart(ramoCtx, {
        type: 'bar',
        data: { labels: Object.keys(gastoRamo), datasets: [{ label: 'Gasto mensual ARS', data: Object.values(gastoRamo), backgroundColor: '#00a8e8', borderRadius: 8 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true }
    });

    // Suma asegurada por aseguradora
    const sumaAseguradora = {};
    for (const p of polizas) {
        sumaAseguradora[p.aseguradora] = (sumaAseguradora[p.aseguradora] || 0) + p.suma_asegurada_total;
    }
    if (charts.patrimonioAseguradora) charts.patrimonioAseguradora.destroy();
    const patAseCtx = document.getElementById('chartPatrimonioAseguradora').getContext('2d');
    charts.patrimonioAseguradora = new Chart(patAseCtx, {
        type: 'bar',
        data: { labels: Object.keys(sumaAseguradora), datasets: [{ label: 'Suma asegurada ARS', data: Object.values(sumaAseguradora), backgroundColor: '#003b5c', borderRadius: 8 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true }
    });
}

function renderRamoCards(polizas) {
    // Agrupar por ramo
    const ramosMap = new Map();
    for (const poliza of polizas) {
        const ramo = poliza.ramo;
        if (!ramosMap.has(ramo)) ramosMap.set(ramo, []);
        ramosMap.get(ramo).push(poliza);
    }
    ramosData = [];
    for (const [ramo, pols] of ramosMap.entries()) {
        let gastoARS = 0, gastoUSD = 0, sumaAsegurada = 0;
        const allItems = [];
        for (const p of pols) {
            gastoARS += p.costo_mensual_ars;
            gastoUSD += p.costo_mensual_usd * tipoCambioUSD;
            sumaAsegurada += p.suma_asegurada_total;
            const itemsPol = itemsData.filter(i => i.id_poliza === p.id_poliza);
            allItems.push(...itemsPol.map(i => i.item));
        }
        const uniqueItems = [...new Set(allItems)];
        const resumenBienes = uniqueItems.slice(0, 3).join(', ') + (uniqueItems.length > 3 ? ` +${uniqueItems.length-3} más` : (uniqueItems.length === 0 ? 'Sin bienes individuales' : ''));
        ramosData.push({
            ramo,
            polizas: pols,
            gastoARS,
            gastoUSD,
            sumaAsegurada,
            cantidadPolizas: pols.length,
            resumenBienes
        });
    }
    // Ordenar por gasto total
    ramosData.sort((a,b) => (b.gastoARS + b.gastoUSD) - (a.gastoARS + a.gastoUSD));

    const container = document.getElementById('ramoCardsContainer');
    container.innerHTML = '';
    for (const rd of ramosData) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl p-3 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition';
        card.setAttribute('data-ramo', rd.ramo);
        card.addEventListener('click', () => {
            currentRamoFiltro = rd.ramo;
            renderPolizasDetail(rd);
            document.getElementById('polizasDetailContainer').classList.remove('hidden');
            document.getElementById('ramoSeleccionadoTitulo').innerText = rd.ramo;
            document.getElementById('polizasDetailContainer').scrollIntoView({ behavior: 'smooth' });
        });
        const gastoTotal = rd.gastoARS + rd.gastoUSD;
        const icon = getIconForRamo(rd.ramo);
        card.innerHTML = `
            <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-1">
                    <i class="${icon} text-sm text-[#003b5c]"></i>
                    <span class="font-semibold text-sm">${rd.ramo}</span>
                </div>
                <span class="text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">${rd.cantidadPolizas} pólizas</span>
            </div>
            <div class="text-xs text-gray-600 mb-1">
                Gasto: ${abreviaturaNumero(gastoTotal)}
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

function renderPolizasDetail(ramoData) {
    const container = document.getElementById('polizasListContainer');
    container.innerHTML = '';
    for (const poliza of ramoData.polizas) {
        const items = itemsData.filter(i => i.id_poliza === poliza.id_poliza);
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden';
        const header = document.createElement('div');
        header.className = 'p-3 flex flex-wrap justify-between items-center cursor-pointer hover:bg-gray-50 transition';
        const displayNumber = poliza.nro_poliza || poliza.id_poliza;
        header.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="fas fa-chevron-right text-gray-400 expand-icon-politica"></i>
                <div>
                    <div class="font-mono text-sm font-bold text-[#003b5c]">${displayNumber}</div>
                    <div class="text-xs text-gray-500">${poliza.aseguradora}</div>
                </div>
            </div>
            <div class="flex flex-wrap gap-3 text-xs">
                <div><span class="text-gray-500">Cobertura:</span> <span class="font-medium">${poliza.cobertura.substring(0,40)}${poliza.cobertura.length>40?'…':''}</span></div>
                <div><span class="text-gray-500">Costo ARS:</span> ${poliza.costo_mensual_ars ? '$'+poliza.costo_mensual_ars.toLocaleString() : '$0'}</div>
                <div><span class="text-gray-500">Costo USD:</span> ${poliza.costo_mensual_usd ? '$'+poliza.costo_mensual_usd.toLocaleString() : '-'}</div>
                <div><span class="text-gray-500"># Bienes:</span> ${poliza.cantidad_items}</div>
            </div>
        `;
        const body = document.createElement('div');
        body.className = 'hidden border-t border-gray-100 p-3 bg-gray-50';
        if (items.length === 0) {
            body.innerHTML = '<p class="text-gray-500 text-sm">No hay bienes registrados. ' + (poliza.ramo === 'ART' ? 'Prestaciones según ley.' : '') + '</p>';
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
    let polizasAEportar;
    if (currentRamoFiltro) {
        const rd = ramosData.find(r => r.ramo === currentRamoFiltro);
        polizasAEportar = rd ? rd.polizas : [];
    } else {
        polizasAEportar = getPolizasPorTab();
    }
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
    link.setAttribute('download', `items_mcv_${currentTab}_${new Date().toISOString().slice(0,19)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Eventos
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active', 'border-b-2', 'border-[#003b5c]', 'text-[#003b5c]');
            b.classList.add('bg-gray-50', 'text-gray-600');
        });
        btn.classList.add('active', 'border-b-2', 'border-[#003b5c]', 'text-[#003b5c]', 'bg-white');
        btn.classList.remove('bg-gray-50', 'text-gray-600');
        currentTab = btn.getAttribute('data-tab');
        currentRamoFiltro = null;
        renderCurrentTab();
    });
});
document.getElementById('refreshBtn')?.addEventListener('click', loadAllData);
document.getElementById('exportCSVBtn')?.addEventListener('click', exportToCSV);
document.getElementById('limpiarFiltroBtn')?.addEventListener('click', () => {
    currentRamoFiltro = null;
    document.getElementById('polizasDetailContainer').classList.add('hidden');
});

function getSamplePolizas() { return []; }
function getSampleItems() { return []; }

setInterval(loadAllData, 300000);
loadAllData();