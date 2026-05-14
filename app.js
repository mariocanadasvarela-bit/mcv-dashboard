// app.js - MCV Seguros Dashboard - Versión corregida (tarjetas visibles)
const POLIZAS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTizUhGOMK4CqFeegbAtWciBpS29ZZ8fvqaednZUMlwOFMZ9lzK0-0PpcJyacyifXeSJazpTIcLqL2q/pub?gid=0&single=true&output=csv';
const ITEMS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTizUhGOMK4CqFeegbAtWciBpS29ZZ8fvqaednZUMlwOFMZ9lzK0-0PpcJyacyifXeSJazpTIcLqL2q/pub?gid=1897816776&single=true&output=csv';

let polizasData = [];
let itemsData = [];
let tipoCambioUSD = 1200;
let charts = {};
let currentTab = 'recurrente';
let currentEmpresa = 'Ambas';
let currentRamoFiltro = null;
let currentPolizaSearch = '';

const savedEmpresa = localStorage.getItem('mcv_empresa');
if (savedEmpresa && ['GHM SRL', 'GHM Satelital SRL', 'Ambas'].includes(savedEmpresa)) currentEmpresa = savedEmpresa;

function normalizarNroPoliza(str) {
    if (!str) return '';
    return str.toString().replace(/[.,\s]/g, '');
}

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
            cobertura_corta: p['Cobertura Corta'] || p['cobertura_corta'] || ''
        };
    });
    
    // Construir itemsData a partir del CSV
    itemsData = [];
    if (itemsCSV.length) {
        itemsCSV.forEach(i => {
            let idPol = i.ID_Poliza?.toString().trim() || '';
            if (idPol) {
                itemsData.push({
                    id_poliza: idPol,
                    item: limpiarTexto(i['Ítem asegurado'] || ''),
                    identificacion: limpiarTexto(i['Identificación (Patente/DNI/Serie)'] || ''),
                    suma_asegurada_ars: parseFloat(i['Suma Asegurada ARS'] || 0),
                    suma_asegurada_usd: parseFloat(i['Suma Asegurada USD'] || 0)
                });
            }
        });
    }
    
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
    
    // Calcular suma asegurada total por póliza y cantidad de items
    const sumaPorPoliza = new Map();
    const countPorPoliza = new Map();
    for (const item of itemsData) {
        const id = item.id_poliza;
        sumaPorPoliza.set(id, (sumaPorPoliza.get(id) || 0) + (item.suma_asegurada_ars || 0) + (item.suma_asegurada_usd || 0) * tipoCambioUSD);
        countPorPoliza.set(id, (countPorPoliza.get(id) || 0) + 1);
    }
    polizasData = polizasData.map(p => ({
        ...p,
        suma_asegurada_total: sumaPorPoliza.get(p.id_poliza) || 0,
        cantidad_items: countPorPoliza.get(p.id_poliza) || 0
    }));
    
    renderCurrentTab();
    document.getElementById('lastUpdate').innerHTML = new Date().toLocaleTimeString() + ' - USD $' + tipoCambioUSD;
}

function getPolizasFiltradas() {
    let base = currentTab === 'recurrente' ? polizasData.filter(esRecurrente) : polizasData.filter(esEvento);
    if (currentTab === 'recurrente') {
        if (currentEmpresa === 'GHM SRL') base = base.filter(p => p.empresa === 'GHM SRL');
        else if (currentEmpresa === 'GHM Satelital SRL') base = base.filter(p => p.empresa === 'GHM Satelital SRL');
        // Ambas no filtra
    }
    if (currentRamoFiltro) base = base.filter(p => p.ramo === currentRamoFiltro);
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
    renderFiltrosRapidos(polizas);
    renderPolizasCards(polizas);
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
    document.getElementById('polizasCount').innerHTML = polizas.length;
}

function updateCharts(polizas) {
    const gastoAseguradora = {};
    for (const p of polizas) {
        const costo = (p.costo_mensual_ars || 0) + (p.costo_mensual_usd || 0) * tipoCambioUSD;
        gastoAseguradora[p.aseguradora] = (gastoAseguradora[p.aseguradora] || 0) + costo;
    }
    renderBarChart('chartGastoAseguradora', gastoAseguradora, 'Gasto mensual ARS');
    
    const gastoRamo = {};
    for (const p of polizas) {
        const costo = (p.costo_mensual_ars || 0) + (p.costo_mensual_usd || 0) * tipoCambioUSD;
        gastoRamo[p.ramo] = (gastoRamo[p.ramo] || 0) + costo;
    }
    renderBarChart('chartGastoRamo', gastoRamo, 'Gasto mensual ARS');
}

function renderBarChart(canvasId, dataObj, label) {
    const ctx = document.getElementById(canvasId).getContext('2d');
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
    const ramosUnicos = [...new Set(polizas.map(p => p.ramo))].sort();
    const container = document.getElementById('filtrosRapidos');
    if (!container) return;
    container.innerHTML = '';
    ramosUnicos.forEach(ramo => {
        const btn = document.createElement('button');
        btn.className = `text-xs px-3 py-1 rounded-full border ${currentRamoFiltro === ramo ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`;
        btn.textContent = ramo;
        btn.addEventListener('click', () => {
            currentRamoFiltro = (currentRamoFiltro === ramo) ? null : ramo;
            renderCurrentTab();
        });
        container.appendChild(btn);
    });
    if (currentRamoFiltro) {
        const clearBtn = document.createElement('button');
        clearBtn.className = 'text-xs px-3 py-1 rounded-full bg-gray-200 text-gray-600';
        clearBtn.textContent = '✖ Limpiar filtro';
        clearBtn.addEventListener('click', () => {
            currentRamoFiltro = null;
            renderCurrentTab();
        });
        container.appendChild(clearBtn);
    }
}

function renderPolizasCards(polizas) {
    const container = document.getElementById('polizasListContainer');
    container.innerHTML = '';
    if (!polizas.length) {
        container.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">No hay pólizas que coincidan con los filtros.</div>';
        return;
    }
    for (const poliza of polizas) {
        const items = itemsData.filter(i => i.id_poliza === poliza.id_poliza);
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition';
        const header = document.createElement('div');
        header.className = 'p-4 cursor-pointer';
        header.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <div class="font-mono text-sm font-bold text-gray-800">${poliza.nro_poliza || poliza.id_poliza}</div>
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
        const body = document.createElement('div');
        body.className = 'hidden border-t border-gray-100 p-4 bg-gray-50';
        if (items.length === 0) {
            body.innerHTML = '<p class="text-gray-500 text-sm">No hay bienes registrados.</p>';
        } else {
            let tableHtml = `<table class="min-w-full text-xs"><thead><tr><th class="text-left py-1">Ítem</th><th class="text-left">Identificación</th><th class="text-right">Suma ARS</th><th class="text-right">Suma USD</th></tr></thead><tbody>`;
            for (const item of items) {
                tableHtml += `<tr class="border-b"><td class="py-1">${item.item||'-'}</td><td class="py-1">${item.identificacion||'-'}</td><td class="py-1 text-right">${item.suma_asegurada_ars ? '$'+item.suma_asegurada_ars.toLocaleString() : '$0'}</td><td class="py-1 text-right">${item.suma_asegurada_usd ? '$'+item.suma_asegurada_usd.toLocaleString() : '-'}</td></tr>`;
            }
            tableHtml += `</tbody></table>`;
            body.innerHTML = tableHtml;
        }
        card.appendChild(header);
        card.appendChild(body);
        header.addEventListener('click', (e) => {
            e.stopPropagation();
            body.classList.toggle('hidden');
            const icon = header.querySelector('.expand-icon');
            if (body.classList.contains('hidden')) {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            } else {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
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
                'Ítem Asegurado': item.item,
                'Identificación': item.identificacion,
                'Empresa (Tomador)': poliza.tomador,
                'Aseguradora': poliza.aseguradora,
                'Ramo': poliza.ramo,
                'Vigencia Desde': poliza.vigencia_desde,
                'Vigencia Hasta': poliza.vigencia_hasta,
                'Suma Asegurada ARS': item.suma_asegurada_ars,
                'Costo Mensual ARS (póliza)': poliza.costo_mensual_ars
            });
        }
    }
    const headers = ['Ítem Asegurado','Identificación','Empresa (Tomador)','Aseguradora','Ramo','Vigencia Desde','Vigencia Hasta','Suma Asegurada ARS','Costo Mensual ARS (póliza)'];
    const rows = itemsToExport.map(i => [i['Ítem Asegurado'], i['Identificación'], i['Empresa (Tomador)'], i['Aseguradora'], i['Ramo'], i['Vigencia Desde'], i['Vigencia Hasta'], i['Suma Asegurada ARS'], i['Costo Mensual ARS (póliza)']]);
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

function exportToExcel() {
    let polizasAEportar = getPolizasFiltradas();
    const itemsToExport = [];
    for (const poliza of polizasAEportar) {
        const itemsPol = itemsData.filter(i => i.id_poliza === poliza.id_poliza);
        for (const item of itemsPol) {
            itemsToExport.push({
                'Ítem Asegurado': item.item,
                'Identificación': item.identificacion,
                'Empresa (Tomador)': poliza.tomador,
                'Aseguradora': poliza.aseguradora,
                'Ramo': poliza.ramo,
                'Vigencia Desde': poliza.vigencia_desde,
                'Vigencia Hasta': poliza.vigencia_hasta,
                'Suma Asegurada ARS': item.suma_asegurada_ars,
                'Costo Mensual ARS (póliza)': poliza.costo_mensual_ars
            });
        }
    }
    const ws = XLSX.utils.json_to_sheet(itemsToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Detalle Bienes');
    XLSX.writeFile(wb, `detalle_bienes_${currentTab}_${currentEmpresa}_${new Date().toISOString().slice(0,19)}.xlsx`);
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

document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    document.getElementById('refreshBtn')?.addEventListener('click', loadAllData);
    document.getElementById('exportCSVBtn')?.addEventListener('click', exportToCSV);
    document.getElementById('exportExcelBtn')?.addEventListener('click', exportToExcel);
    document.getElementById('exportPDFBtn')?.addEventListener('click', exportToPDF);
    document.getElementById('searchPoliza')?.addEventListener('input', (e) => {
        currentPolizaSearch = e.target.value;
        renderCurrentTab();
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active', 'border-b-2', 'border-blue-400', 'text-gray-800'));
            btn.classList.add('active', 'border-b-2', 'border-blue-400', 'text-gray-800');
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
    
    const empresaBtn = Array.from(document.querySelectorAll('.empresa-btn')).find(btn => btn.getAttribute('data-empresa') === currentEmpresa);
    if (empresaBtn) empresaBtn.click();
});
