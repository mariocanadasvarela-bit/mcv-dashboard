// app.js - MCV Seguros Dashboard (corregido)
const POLIZAS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTizUhGOMK4CqFeegbAtWciBpS29ZZ8fvqaednZUMlwOFMZ9lzK0-0PpcJyacyifXeSJazpTIcLqL2q/pub?gid=0&single=true&output=csv';
const ITEMS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTizUhGOMK4CqFeegbAtWciBpS29ZZ8fvqaednZUMlwOFMZ9lzK0-0PpcJyacyifXeSJazpTIcLqL2q/pub?gid=1897816776&single=true&output=csv';

let polizasData = [];
let itemsData = [];
let filteredPolizas = [];
let tipoCambioUSD = 1200;
let charts = {};

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

function limpiarTexto(str) {
    if (!str) return '';
    return str.toString().trim().replace(/\s+/g, ' ');
}

function normalizarParaComparacion(str) {
    return limpiarTexto(str).toLowerCase();
}

async function loadAllData() {
    tipoCambioUSD = await obtenerTipoCambio();
    let polCSV = null, itemsCSV = null;
    try {
        polCSV = await fetchCSV(POLIZAS_CSV_URL);
        itemsCSV = await fetchCSV(ITEMS_CSV_URL);
    } catch(e) { console.warn(e); }
    
    if (polCSV && polCSV.length) {
        polizasData = polCSV.map(p => {
            let proyectoRaw = limpiarTexto(p['Proyecto / Centro de Costo'] || '');
            let ramoRaw = limpiarTexto(p.Ramo || '');
            let aseguradoraRaw = limpiarTexto(p.Aseguradora || '');
            let tomadorRaw = limpiarTexto(p.Tomador || '');
            // Fechas vienen en formato YYYY-MM-DD (de tu CSV)
            let fechaVencimiento = p['Vigencia Hasta (fecha)'] ? p['Vigencia Hasta (fecha)'].split(' ')[0] : '';
            return {
                id_poliza: p.ID_Poliza?.toString().trim() || '',
                tomador: tomadorRaw,
                proyecto: proyectoRaw,
                proyecto_norm: normalizarParaComparacion(proyectoRaw),
                ramo: ramoRaw,
                aseguradora: aseguradoraRaw,
                vigencia_hasta: fechaVencimiento,
                costo_mensual_ars: parseFloat(p['Costo Mensual ARS'] || 0),
                costo_mensual_usd: parseFloat(p['Costo Mensual USD'] || 0)
            };
        });
    } else {
        polizasData = getSamplePolizas();
    }
    
    if (itemsCSV && itemsCSV.length) {
        itemsData = itemsCSV.map(i => ({
            id_poliza: i.ID_Poliza?.toString().trim() || '',
            suma_asegurada_ars: parseFloat(i['Suma Asegurada ARS'] || 0),
            suma_asegurada_usd: parseFloat(i['Suma Asegurada USD'] || 0)
        }));
    } else {
        itemsData = getSampleItems();
    }
    
    // Calcular exposición real por póliza usando Suma Asegurada ARS + USD convertido
    const itemsPorPoliza = new Map();
    for (const item of itemsData) {
        if (!itemsPorPoliza.has(item.id_poliza)) itemsPorPoliza.set(item.id_poliza, []);
        itemsPorPoliza.get(item.id_poliza).push(item);
    }
    let sinPatrimonio = 0;
    polizasData = polizasData.map(p => {
        const itemsPol = itemsPorPoliza.get(p.id_poliza) || [];
        let exposicion = itemsPol.reduce((sum, i) => sum + (i.suma_asegurada_ars || 0) + (i.suma_asegurada_usd || 0) * tipoCambioUSD, 0);
        if (exposicion === 0) {
            exposicion = (p.costo_mensual_ars || 0) * 12 * 2;
            sinPatrimonio++;
        }
        return { ...p, exposicion_ars: exposicion };
    });
    if (sinPatrimonio > 0) console.warn(`⚠️ ${sinPatrimonio} pólizas sin patrimonio definido en Items. Se usó estimación.`);
    
    // Unificar empresas: GHM Contenidos -> GHM SRL, GHM SATELITAL -> GHM Satelital SRL
    polizasData = polizasData.map(p => {
        let empresa = p.tomador;
        if (normalizarParaComparacion(empresa) === 'ghm contenidos') empresa = 'GHM SRL';
        if (normalizarParaComparacion(empresa) === 'ghm satelital') empresa = 'GHM Satelital SRL';
        if (normalizarParaComparacion(empresa).includes('ghm') && !normalizarParaComparacion(empresa).includes('satelital')) {
            empresa = 'GHM SRL';
        }
        return { ...p, empresa };
    });
    
    console.log('📊 Pólizas cargadas:', polizasData.length);
    console.log('🏢 Empresas únicas:', [...new Set(polizasData.map(p => p.empresa))]);
    
    applyFiltersAndRender();
    document.getElementById('lastUpdate').innerHTML = new Date().toLocaleTimeString() + ' - USD $' + tipoCambioUSD;
}

const esRecurrente = (p) => p.proyecto_norm === 'estructura operativa';
const esEvento = (p) => p.proyecto_norm === 'expo san juan minero 2026';

function applyFiltersAndRender() {
    const activeBtn = document.querySelector('.viewSelectorBtn.active');
    const vista = activeBtn ? activeBtn.dataset.view : 'recurrente';
    const searchTerm = document.getElementById('searchTable')?.value.toLowerCase() || '';
    
    let base = polizasData;
    if (vista === 'recurrente') base = polizasData.filter(esRecurrente);
    if (vista === 'evento') base = polizasData.filter(esEvento);
    
    filteredPolizas = base.filter(p => 
        p.id_poliza.toLowerCase().includes(searchTerm) || 
        p.aseguradora.toLowerCase().includes(searchTerm) ||
        p.empresa.toLowerCase().includes(searchTerm)
    );
    
    updateKPIsRecurrentes();
    updateKPIsEvento();
    updateResumenEmpresas();
    updateTablaPolizas();
    updateChartsRecurrentes();
    updateChartGastoEmpresa();
}

function updateKPIsRecurrentes() {
    const recurrentes = polizasData.filter(esRecurrente);
    const gastoARS = recurrentes.reduce((s,p) => s + p.costo_mensual_ars, 0);
    const gastoUSD = recurrentes.reduce((s,p) => s + (p.costo_mensual_usd * tipoCambioUSD), 0);
    const gastoTotal = gastoARS + gastoUSD;
    const patrimonio = recurrentes.reduce((s,p) => s + p.exposicion_ars, 0);
    const aseguradoras = new Set(recurrentes.map(p => p.aseguradora)).size;
    let tasaPromedio = patrimonio > 0 ? (gastoTotal / patrimonio) * 100 : 0;
    
    document.getElementById('kpiGastoRecurrente').innerHTML = `$${gastoTotal.toLocaleString()}`;
    document.getElementById('kpiPatrimonioRecurrente').innerHTML = `$${patrimonio.toLocaleString()}`;
    document.getElementById('kpiPolizasRecurrentes').innerHTML = recurrentes.length;
    document.getElementById('kpiAseguradorasRecurrentes').innerHTML = aseguradoras;
    document.getElementById('kpiTasaPromedio').innerHTML = `${tasaPromedio.toFixed(2)}%`;
}

function updateKPIsEvento() {
    const eventos = polizasData.filter(esEvento);
    const gasto = eventos.reduce((s,p) => s + p.costo_mensual_ars + (p.costo_mensual_usd * tipoCambioUSD), 0);
    const patrimonio = eventos.reduce((s,p) => s + p.exposicion_ars, 0);
    document.getElementById('kpiCostoEvento').innerHTML = `$${gasto.toLocaleString()}`;
    document.getElementById('kpiPatrimonioEvento').innerHTML = `$${patrimonio.toLocaleString()}`;
    document.getElementById('kpiPolizasEvento').innerHTML = eventos.length;
}

function updateResumenEmpresas() {
    const recurrentes = polizasData.filter(esRecurrente);
    const empresas = ['GHM SRL', 'GHM Satelital SRL'];
    const data = empresas.map(emp => {
        const pols = recurrentes.filter(p => p.empresa === emp);
        const gasto = pols.reduce((s,p) => s + p.costo_mensual_ars + (p.costo_mensual_usd * tipoCambioUSD), 0);
        const patrimonio = pols.reduce((s,p) => s + p.exposicion_ars, 0);
        return { empresa: emp, gasto, patrimonio, polizas: pols.length };
    });
    const totalGasto = data.reduce((s,d) => s + d.gasto, 0);
    const tbody = document.getElementById('tablaResumenEmpresas');
    tbody.innerHTML = '';
    data.forEach(d => {
        const porcentaje = totalGasto ? (d.gasto / totalGasto * 100).toFixed(1) : 0;
        tbody.innerHTML += `<tr class="border-b border-gray-100">
            <td class="py-2">${d.empresa}</td>
            <td>$${d.gasto.toLocaleString()}</td>
            <td>$${d.patrimonio.toLocaleString()}</td>
            <td>${d.polizas}</td>
            <td>${porcentaje}%</td>
        </tr>`;
    });
    if (charts.gastoEmpresa) charts.gastoEmpresa.destroy();
    const ctx = document.getElementById('chartGastoEmpresa').getContext('2d');
    charts.gastoEmpresa = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: data.map(d => d.empresa), datasets: [{ data: data.map(d => d.gasto), backgroundColor: ['#003b5c', '#00a8e8'] }] },
        options: { plugins: { legend: { position: 'bottom', labels: { color: '#333' } } }, responsive: true, maintainAspectRatio: true }
    });
}

function updateTablaPolizas() {
    const tbody = document.getElementById('tablaBody');
    tbody.innerHTML = '';
    filteredPolizas.forEach(p => {
        const tipo = esRecurrente(p) ? 'Recurrente' : 'Evento';
        const costoTotal = p.costo_mensual_ars + (p.costo_mensual_usd * tipoCambioUSD);
        const tasa = p.exposicion_ars ? ((costoTotal / p.exposicion_ars) * 100).toFixed(2) : '0.00';
        const venc = p.vigencia_hasta ? p.vigencia_hasta : '-';
        tbody.innerHTML += `<tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="py-2 px-4">${p.id_poliza}</td>
            <td class="px-4">${p.empresa}</td>
            <td class="px-4">${p.aseguradora}</td>
            <td class="px-4">${p.ramo}</td>
            <td class="px-4">$${p.costo_mensual_ars.toLocaleString()}</td>
            <td class="px-4">${p.costo_mensual_usd ? `$${p.costo_mensual_usd} (USD)` : '-'}</td>
            <td class="px-4">$${p.exposicion_ars.toLocaleString()}</td>
            <td class="px-4">${tasa}%</td>
            <td class="px-4">${venc}</td>
            <td class="px-4"><span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">${tipo}</span></td>
        </tr>`;
    });
}

function exportToCSV() {
    const headers = ['ID Póliza', 'Empresa', 'Aseguradora', 'Ramo', 'Costo ARS', 'Costo USD', 'Patrimonio', 'Tasa %', 'Vencimiento', 'Tipo'];
    const rows = filteredPolizas.map(p => {
        const costoTotal = p.costo_mensual_ars + (p.costo_mensual_usd * tipoCambioUSD);
        const tasa = p.exposicion_ars ? ((costoTotal / p.exposicion_ars) * 100).toFixed(2) : '0.00';
        return [p.id_poliza, p.empresa, p.aseguradora, p.ramo, p.costo_mensual_ars, p.costo_mensual_usd, p.exposicion_ars, tasa, p.vigencia_hasta || '', esRecurrente(p) ? 'Recurrente' : 'Evento'];
    });
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'polizas_mcv.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function updateChartsRecurrentes() {
    const recurrentes = polizasData.filter(esRecurrente);
    
    // Gasto por aseguradora
    const gastoAseguradora = {};
    recurrentes.forEach(p => { const costo = p.costo_mensual_ars + (p.costo_mensual_usd * tipoCambioUSD); gastoAseguradora[p.aseguradora] = (gastoAseguradora[p.aseguradora] || 0) + costo; });
    if (charts.gastoAseguradora) charts.gastoAseguradora.destroy();
    charts.gastoAseguradora = new Chart(document.getElementById('chartGastoAseguradora'), {
        type: 'bar',
        data: { labels: Object.keys(gastoAseguradora), datasets: [{ label: 'Gasto mensual ARS', data: Object.values(gastoAseguradora), backgroundColor: '#003b5c', borderRadius: 8 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true, plugins: { legend: { labels: { color: '#333' } } }, scales: { x: { ticks: { color: '#666' }, grid: { color: '#e2e8f0' } }, y: { ticks: { color: '#666' }, grid: { color: '#e2e8f0' } } } }
    });
    
    // Gasto por ramo
    const gastoRamo = {};
    recurrentes.forEach(p => { const costo = p.costo_mensual_ars + (p.costo_mensual_usd * tipoCambioUSD); gastoRamo[p.ramo] = (gastoRamo[p.ramo] || 0) + costo; });
    if (charts.gastoRamo) charts.gastoRamo.destroy();
    charts.gastoRamo = new Chart(document.getElementById('chartGastoRamo'), {
        type: 'doughnut',
        data: { labels: Object.keys(gastoRamo), datasets: [{ data: Object.values(gastoRamo), backgroundColor: ['#003b5c','#00a8e8','#1e88e5','#1565c0','#0d47a1'] }] },
        options: { plugins: { legend: { position: 'bottom', labels: { color: '#333' } } }, responsive: true, maintainAspectRatio: true }
    });
    
    // Patrimonio por aseguradora
    const patrimonioAseguradora = {};
    recurrentes.forEach(p => { patrimonioAseguradora[p.aseguradora] = (patrimonioAseguradora[p.aseguradora] || 0) + p.exposicion_ars; });
    if (charts.patrimonioAseguradora) charts.patrimonioAseguradora.destroy();
    charts.patrimonioAseguradora = new Chart(document.getElementById('chartPatrimonioAseguradora'), {
        type: 'bar',
        data: { labels: Object.keys(patrimonioAseguradora), datasets: [{ label: 'Patrimonio ARS', data: Object.values(patrimonioAseguradora), backgroundColor: '#003b5c', borderRadius: 8 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true, plugins: { legend: { labels: { color: '#333' } } }, scales: { x: { ticks: { color: '#666' }, grid: { color: '#e2e8f0' } }, y: { ticks: { color: '#666' }, grid: { color: '#e2e8f0' } } } }
    });
    
    // Patrimonio por ramo
    const patrimonioRamo = {};
    recurrentes.forEach(p => { patrimonioRamo[p.ramo] = (patrimonioRamo[p.ramo] || 0) + p.exposicion_ars; });
    if (charts.patrimonioRamo) charts.patrimonioRamo.destroy();
    charts.patrimonioRamo = new Chart(document.getElementById('chartPatrimonioRamo'), {
        type: 'doughnut',
        data: { labels: Object.keys(patrimonioRamo), datasets: [{ data: Object.values(patrimonioRamo), backgroundColor: ['#003b5c','#00a8e8','#1e88e5','#1565c0','#0d47a1'] }] },
        options: { plugins: { legend: { position: 'bottom', labels: { color: '#333' } } }, responsive: true, maintainAspectRatio: true }
    });
}

function updateChartGastoEmpresa() { if (charts.gastoEmpresa) charts.gastoEmpresa.update(); }

function getSamplePolizas() {
    return [
        { id_poliza: "POL-001", tomador: "GHM Satelital SRL", proyecto: "Estructura Operativa", proyecto_norm: "estructura operativa", ramo: "Automotor", aseguradora: "La Segunda", vigencia_hasta: "2026-07-27", costo_mensual_ars: 428549, costo_mensual_usd: 0 },
        { id_poliza: "POL-022", tomador: "GHM SRL", proyecto: "Estructura Operativa", proyecto_norm: "estructura operativa", ramo: "Caución", aseguradora: "Aseguradores de Cauciones", vigencia_hasta: "2026-08-11", costo_mensual_ars: 165600, costo_mensual_usd: 138 }
    ];
}
function getSampleItems() {
    return [
        { id_poliza: "POL-001", suma_asegurada_ars: 45000000, suma_asegurada_usd: 0 },
        { id_poliza: "POL-022", suma_asegurada_ars: 80000000, suma_asegurada_usd: 27500 }
    ];
}

// Event listeners
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
setInterval(loadAllData, 300000);
loadAllData();