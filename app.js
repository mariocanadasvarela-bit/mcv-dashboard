// app.js - MCV Seguros Dashboard Profesional
// URLs de Google Sheets (tus enlaces públicos)
const POLIZAS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTizUhGOMK4CqFeegbAtWciBpS29ZZ8fvqaednZUMlwOFMZ9lzK0-0PpcJyacyifXeSJazpTIcLqL2q/pub?gid=0&single=true&output=csv';
const ITEMS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTizUhGOMK4CqFeegbAtWciBpS29ZZ8fvqaednZUMlwOFMZ9lzK0-0PpcJyacyifXeSJazpTIcLqL2q/pub?gid=1897816776&single=true&output=csv';

// Inicializar plugin de dayjs para formato personalizado
dayjs.extend(window.dayjs_plugin_customParseFormat);

// Estado global
let polizasData = [];
let itemsData = [];
let filteredPolizas = [];
let charts = {};
let tipoCambioUSD = 1200; // valor por defecto, se actualiza con API
const TIPO_CAMBIO_CACHE_KEY = 'mcv_tipo_cambio';
const TIPO_CAMBIO_EXPIRY = 60 * 60 * 1000; // 1 hora

// ----- 1. Función fetchCSV con PapaParse (robusta) -----
function fetchCSV(url) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors && results.errors.length) {
                    console.warn("PapaParse advierte errores:", results.errors);
                }
                resolve(results.data);
            },
            error: (err) => {
                console.error("Error al cargar CSV:", err);
                reject(null);
            }
        });
    });
}

// ----- 2. Obtener tipo de cambio oficial con caché y fallback -----
async function obtenerTipoCambio() {
    const cached = localStorage.getItem(TIPO_CAMBIO_CACHE_KEY);
    if (cached) {
        const { valor, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < TIPO_CAMBIO_EXPIRY) {
            return valor;
        }
    }
    try {
        const response = await fetch('https://dolarapi.com/v1/dolares/oficial');
        if (!response.ok) throw new Error('API no responde');
        const data = await response.json();
        const venta = parseFloat(data.venta);
        if (isNaN(venta)) throw new Error('Valor inválido');
        localStorage.setItem(TIPO_CAMBIO_CACHE_KEY, JSON.stringify({ valor: venta, timestamp: Date.now() }));
        return venta;
    } catch (error) {
        console.warn("Error obteniendo tipo de cambio oficial, usando valor por defecto 1200", error);
        return 1200;
    }
}

// ----- 3. Datos de ejemplo (fallback si no carga CSV) -----
function getSamplePolizas() {
    return [
        { id_poliza: "POL-001", tomador: "GHM Satelital SRL", proyecto: "Estructura Operativa", ramo: "Automotor", aseguradora: "La Segunda", vigencia_hasta: "27/07/2026", costo_mensual_ars: 428549, costo_mensual_usd: 0 },
        { id_poliza: "POL-002", tomador: "GHM Satelital SRL", proyecto: "Estructura Operativa", ramo: "Automotor", aseguradora: "La Segunda", vigencia_hasta: "05/07/2026", costo_mensual_ars: 200421, costo_mensual_usd: 0 }
    ];
}
function getSampleItems() {
    return [
        { id_poliza: "POL-001", id_item: "ITEM-001", descripcion: "Flota vehicular", valor_asegurado: 45000000 }
    ];
}

// ----- 4. Carga principal de datos -----
async function loadAllData() {
    document.getElementById('kpiPolizas').innerHTML = '...';
    
    tipoCambioUSD = await obtenerTipoCambio();
    
    let polCSV = null, itemsCSV = null;
    try {
        polCSV = await fetchCSV(POLIZAS_CSV_URL);
        itemsCSV = await fetchCSV(ITEMS_CSV_URL);
    } catch(e) {
        console.error("Error de red o parseo", e);
    }
    
    if (polCSV && polCSV.length) {
        polizasData = polCSV.map(p => ({
            id_poliza: p.ID_Poliza || p.id_poliza || '',
            tomador: p.Tomador || p.tomador || '',
            pagador_real: p.Pagador_Real || p.pagador_real || '',
            proyecto: p['Proyecto / Centro de Costo'] || p.proyecto || '',
            ramo: p.Ramo || p.ramo || '',
            aseguradora: p.Aseguradora || p.aseguradora || '',
            nro_poliza: p.Nro_Póliza || p.nro_poliza || '',
            vigencia_desde: p['Vigencia Desde'] || p.vigencia_desde || '',
            vigencia_hasta: p['Vigencia Hasta (fecha)'] || p.vigencia_hasta || '',
            costo_mensual_ars: parseFloat(p['Costo Mensual ARS'] || p.costo_mensual_ars || 0),
            costo_mensual_usd: parseFloat(p['Costo Mensual USD'] || p.costo_mensual_usd || 0),
            observaciones: p.Observaciones || p.observaciones || ''
        }));
    } else {
        polizasData = getSamplePolizas();
    }
    
    if (itemsCSV && itemsCSV.length) {
        itemsData = itemsCSV.map(i => ({
            id_poliza: i.ID_Poliza || i.id_poliza || '',
            id_item: i.ID_Item || i.id_item || '',
            descripcion: i.Descripcion || i.descripcion || '',
            valor_asegurado: parseFloat(i.Valor_Asegurado || i.valor_asegurado || 0)
        }));
    } else {
        itemsData = getSampleItems();
    }
    
    // HashMap para escalabilidad
    const itemsPorPoliza = new Map();
    for (const item of itemsData) {
        const polId = item.id_poliza;
        if (!itemsPorPoliza.has(polId)) itemsPorPoliza.set(polId, []);
        itemsPorPoliza.get(polId).push(item);
    }
    
    // Enriquecer pólizas con exposición y riesgo
    polizasData = polizasData.map(p => {
        const itemsPol = itemsPorPoliza.get(p.id_poliza) || [];
        let exposicion = itemsPol.reduce((sum, i) => sum + (i.valor_asegurado || 0), 0);
        if (exposicion === 0) {
            exposicion = (p.costo_mensual_ars || 0) * 12 * 2;
        }
        let riesgo = "Bajo";
        if (p.costo_mensual_ars > 200000) riesgo = "Alto";
        else if (p.costo_mensual_ars > 50000) riesgo = "Medio";
        return { ...p, exposicion_ars: exposicion, riesgo_critico: riesgo };
    });
    
    applyFiltersAndRender();
    const now = new Date();
    document.getElementById('lastUpdate').innerHTML = now.toLocaleTimeString() + " - USD $" + tipoCambioUSD;
}

// ----- 5. Filtros y renderizado -----
function applyFiltersAndRender() {
    const ramoFiltro = document.getElementById('filterRamo').value;
    const asegFiltro = document.getElementById('filterAseguradora').value;
    const proyectoFiltro = document.getElementById('filterProyecto').value;
    const tomadorFiltro = document.getElementById('filterTomador').value;
    
    filteredPolizas = polizasData.filter(p => {
        if (ramoFiltro !== 'all' && p.ramo !== ramoFiltro) return false;
        if (asegFiltro !== 'all' && p.aseguradora !== asegFiltro) return false;
        if (proyectoFiltro !== 'all' && p.proyecto !== proyectoFiltro) return false;
        if (tomadorFiltro !== 'all' && p.tomador !== tomadorFiltro) return false;
        return true;
    });
    updateKPIs();
    updateCharts();
    updateTable();
    updateInsights();
    populateFilterOptions();
}

function updateKPIs() {
    const costoTotal = filteredPolizas.reduce((sum, p) => sum + (p.costo_mensual_ars || 0), 0);
    const exposicionTotal = filteredPolizas.reduce((sum, p) => sum + p.exposicion_ars, 0);
    const polizasCount = filteredPolizas.length;
    const totalItems = itemsData.filter(i => filteredPolizas.some(p => p.id_poliza === i.id_poliza)).length;
    
    const hoy = dayjs();
    const vencProx = filteredPolizas.filter(p => {
        if (!p.vigencia_hasta) return false;
        const venc = dayjs(p.vigencia_hasta, 'DD/MM/YYYY');
        if (!venc.isValid()) return false;
        return venc.isAfter(hoy) && venc.isBefore(hoy.add(30, 'day'));
    }).length;
    
    let exposicionUsd = 0;
    for (const p of filteredPolizas) {
        if (p.costo_mensual_usd > 0) {
            exposicionUsd += p.costo_mensual_usd * tipoCambioUSD * 12;
        }
    }
    const porcUsd = exposicionTotal ? (exposicionUsd / exposicionTotal * 100).toFixed(1) : 0;
    
    document.getElementById('kpiCosto').innerHTML = `$${costoTotal.toLocaleString()}`;
    document.getElementById('kpiExposicion').innerHTML = `$${exposicionTotal.toLocaleString()}`;
    document.getElementById('kpiPolizas').innerHTML = polizasCount;
    document.getElementById('kpiItems').innerHTML = totalItems;
    document.getElementById('kpiVencimientos').innerHTML = vencProx;
    document.getElementById('kpiUsd').innerHTML = `$${exposicionUsd.toLocaleString()} (${porcUsd}%)`;
}

function updateCharts() {
    // Barras horizontales
    const expByAseg = {};
    filteredPolizas.forEach(p => { expByAseg[p.aseguradora] = (expByAseg[p.aseguradora] || 0) + p.exposicion_ars; });
    const labelsBar = Object.keys(expByAseg);
    const dataBar = Object.values(expByAseg);
    if (charts.barras) {
        charts.barras.data.labels = labelsBar;
        charts.barras.data.datasets[0].data = dataBar;
        charts.barras.update();
    } else {
        const ctx = document.getElementById('chartBarras').getContext('2d');
        charts.barras = new Chart(ctx, {
            type: 'bar',
            data: { labels: labelsBar, datasets: [{ label: 'Exposición ARS', data: dataBar, backgroundColor: '#3b82f6', borderRadius: 8 }] },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true, plugins: { legend: { labels: { color: '#ccc' } } } }
        });
    }
    
    // Doughnut por ramo
    const expByRamo = {};
    filteredPolizas.forEach(p => { expByRamo[p.ramo] = (expByRamo[p.ramo] || 0) + p.exposicion_ars; });
    const labelsDonut = Object.keys(expByRamo);
    const dataDonut = Object.values(expByRamo);
    if (charts.doughnut) {
        charts.doughnut.data.labels = labelsDonut;
        charts.doughnut.data.datasets[0].data = dataDonut;
        charts.doughnut.update();
    } else {
        charts.doughnut = new Chart(document.getElementById('chartDoughnut'), {
            type: 'doughnut',
            data: { labels: labelsDonut, datasets: [{ data: dataDonut, backgroundColor: ['#f97316','#8b5cf6','#10b981','#06b6d4','#ef4444','#eab308'] }] },
            options: { plugins: { legend: { position: 'bottom', labels: { color: '#ddd' } } } }
        });
    }
    
    // Timeline vencimientos
    const hoy = dayjs();
    const timelineData = [];
    for (const p of filteredPolizas) {
        if (!p.vigencia_hasta) continue;
        const venc = dayjs(p.vigencia_hasta, 'DD/MM/YYYY');
        if (!venc.isValid()) continue;
        const dias = venc.diff(hoy, 'day');
        if (dias >= -10 && dias <= 120) {
            timelineData.push({ x: dias, y: p.id_poliza });
        }
    }
    if (charts.timeline) {
        charts.timeline.data.datasets[0].data = timelineData;
        charts.timeline.update();
    } else {
        charts.timeline = new Chart(document.getElementById('chartTimeline'), {
            type: 'scatter',
            data: { datasets: [{ label: 'Vencimiento (días)', data: timelineData, backgroundColor: '#facc15' }] },
            options: { scales: { x: { title: { display: true, text: 'Días hacia futuro', color: '#aaa' } }, y: { ticks: { color: '#ccc' } } } }
        });
    }
    
    // Scatter matriz riesgo
    const scatterPoints = filteredPolizas.map(p => ({ x: p.exposicion_ars, y: p.costo_mensual_ars, label: p.id_poliza }));
    if (charts.scatter) {
        charts.scatter.data.datasets[0].data = scatterPoints;
        charts.scatter.update();
    } else {
        charts.scatter = new Chart(document.getElementById('chartScatter'), {
            type: 'scatter',
            data: { datasets: [{ label: 'Pólizas', data: scatterPoints, backgroundColor: '#60a5fa', pointRadius: 5 }] },
            options: { scales: { x: { type: 'logarithmic', title: { text: 'Exposición ARS' } }, y: { type: 'logarithmic', title: { text: 'Costo mensual ARS' } } } }
        });
    }
    
    renderTreemap(expByAseg);
}

function renderTreemap(data) {
    const container = document.getElementById('treemapSVG');
    const total = Object.values(data).reduce((a,b)=>a+b,0);
    if(total === 0 || Object.keys(data).length === 0) {
        container.innerHTML = '<div class="text-gray-500">Sin datos</div>';
        return;
    }
    let html = '<div class="grid grid-cols-2 gap-2">';
    for (let [k, v] of Object.entries(data)) {
        let percent = (v/total)*100;
        html += `<div class="bg-blue-900/30 p-2 rounded-lg text-center text-xs">${k}<br><span class="font-bold">$${(v/1e6).toFixed(1)}M</span><span class="text-gray-400 ml-1">(${percent.toFixed(0)}%)</span></div>`;
    }
    html += '</div>';
    container.innerHTML = html;
}

function updateTable() {
    const searchTerm = document.getElementById('searchTable').value.toLowerCase();
    const tbody = document.getElementById('tablaBody');
    tbody.innerHTML = '';
    const filtered = filteredPolizas.filter(p => p.id_poliza.toLowerCase().includes(searchTerm) || p.aseguradora.toLowerCase().includes(searchTerm));
    filtered.forEach(p => {
        const fechaVenc = p.vigencia_hasta ? dayjs(p.vigencia_hasta, 'DD/MM/YYYY').format('DD/MM/YYYY') : '-';
        const row = `<tr class="border-b border-white/5">
            <td class="py-2">${p.id_poliza}</td>
            <td class="py-2">${p.tomador || '-'}</td>
            <td class="py-2">${p.aseguradora}</td>
            <td class="py-2">${p.ramo}</td>
            <td class="py-2">$${p.costo_mensual_ars.toLocaleString()}</td>
            <td class="py-2">${fechaVenc}</td>
            <td class="py-2"><span class="px-2 py-0.5 rounded-full text-xs ${p.riesgo_critico === 'Alto' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}">${p.riesgo_critico}</span></td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

function updateInsights() {
    const totalExp = filteredPolizas.reduce((s,p)=>s+p.exposicion_ars,0);
    const byAseguradora = {};
    filteredPolizas.forEach(p => { byAseguradora[p.aseguradora] = (byAseguradora[p.aseguradora]||0) + p.exposicion_ars; });
    const topAseguradora = Object.entries(byAseguradora).sort((a,b)=>b[1]-a[1])[0];
    const porcTop = topAseguradora ? (topAseguradora[1]/totalExp*100).toFixed(1) : 0;
    
    let exposicionUsd = 0;
    for (const p of filteredPolizas) {
        if (p.costo_mensual_usd > 0) exposicionUsd += p.costo_mensual_usd * tipoCambioUSD * 12;
    }
    const porcUSD = totalExp ? (exposicionUsd/totalExp*100).toFixed(1) : 0;
    const riesgosAltos = filteredPolizas.filter(p=>p.riesgo_critico === 'Alto').length;
    
    const html = `
        <div class="bg-black/20 p-3 rounded-xl"><i class="fas fa-chart-line text-blue-400 mr-2"></i> <strong>Concentración:</strong> ${topAseguradora?.[0] || 'N/A'} concentra ${porcTop}% de exposición.</div>
        <div class="bg-black/20 p-3 rounded-xl"><i class="fas fa-dollar-sign text-green-400 mr-2"></i> <strong>Dolarización real:</strong> ${porcUSD}% de la cartera en USD (TC $${tipoCambioUSD}).</div>
        <div class="bg-black/20 p-3 rounded-xl"><i class="fas fa-exclamation-triangle text-red-400 mr-2"></i> <strong>Riesgos críticos:</strong> ${riesgosAltos} pólizas con riesgo Alto.</div>
        <div class="bg-black/20 p-3 rounded-xl"><i class="fas fa-building text-purple-400 mr-2"></i> <strong>Dependencia aseguradora:</strong> El top 1 representa ${porcTop}%.</div>
    `;
    document.getElementById('insightsContainer').innerHTML = html;
}

function populateFilterOptions() {
    const ramos = [...new Set(polizasData.map(p=>p.ramo))];
    const asegs = [...new Set(polizasData.map(p=>p.aseguradora))];
    const proyectos = [...new Set(polizasData.map(p=>p.proyecto).filter(Boolean))];
    const tomadores = [...new Set(polizasData.map(p=>p.tomador).filter(Boolean))];
    
    const ramoSelect = document.getElementById('filterRamo');
    ramoSelect.innerHTML = '<option value="all">Todos</option>' + ramos.map(r=>`<option value="${r}">${r}</option>`).join('');
    const asegSelect = document.getElementById('filterAseguradora');
    asegSelect.innerHTML = '<option value="all">Todas</option>' + asegs.map(a=>`<option value="${a}">${a}</option>`).join('');
    const proySelect = document.getElementById('filterProyecto');
    proySelect.innerHTML = '<option value="all">Todos</option>' + proyectos.map(p=>`<option value="${p}">${p}</option>`).join('');
    const tomSelect = document.getElementById('filterTomador');
    tomSelect.innerHTML = '<option value="all">Todos</option>' + tomadores.map(t=>`<option value="${t}">${t}</option>`).join('');
}

// Eventos
document.getElementById('filterRamo').addEventListener('change', applyFiltersAndRender);
document.getElementById('filterAseguradora').addEventListener('change', applyFiltersAndRender);
document.getElementById('filterProyecto').addEventListener('change', applyFiltersAndRender);
document.getElementById('filterTomador').addEventListener('change', applyFiltersAndRender);
document.getElementById('resetFilters').addEventListener('click', () => {
    document.getElementById('filterRamo').value = 'all';
    document.getElementById('filterAseguradora').value = 'all';
    document.getElementById('filterProyecto').value = 'all';
    document.getElementById('filterTomador').value = 'all';
    applyFiltersAndRender();
});
document.getElementById('searchTable').addEventListener('input', updateTable);
document.getElementById('refreshBtn').addEventListener('click', loadAllData);
setInterval(loadAllData, 300000);

loadAllData();