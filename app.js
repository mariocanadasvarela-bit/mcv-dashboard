// app.js - MCV Seguros Dashboard - Versión definitiva profesional
const POLIZAS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTizUhGOMK4CqFeegbAtWciBpS29ZZ8fvqaednZUMlwOFMZ9lzK0-0PpcJyacyifXeSJazpTIcLqL2q/pub?gid=0&single=true&output=csv';
const ITEMS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTizUhGOMK4CqFeegbAtWciBpS29ZZ8fvqaednZUMlwOFMZ9lzK0-0PpcJyacyifXeSJazpTIcLqL2q/pub?gid=1897816776&single=true&output=csv';

let polizasData = [];
let itemsData = [];
let filteredPolizas = [];
let tipoCambioUSD = 1200;
let charts = {};
let currentSortColumn = 'id_poliza';
let currentSortDirection = 'asc';
let currentModalPolizaId = null;
let currentFilters = { aseguradora: '', ramo: '' };

// Función para abreviar números (ej. 1234567 -> "1,2M")
function abreviaturaNumero(num) {
    if (num === undefined || num === null) return '$0';
    if (num >= 1e9) return '$' + (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1e6) return '$' + (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1e3) return '$' + (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return '$' + num.toLocaleString();
}

function abreviaturaNumeroRaw(num) {
    if (num === undefined || num === null) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
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
            let tomadorRaw = limpiarTexto(p.Tomador || '');
            return {
                id_poliza: p.ID_Poliza?.toString().trim() || '',
                tomador: tomadorRaw,
                empresa: tomadorRaw,
                proyecto: proyectoRaw,
                proyecto_norm: normalizarParaComparacion(proyectoRaw),
                ramo: limpiarTexto(p.Ramo || ''),
                aseguradora: limpiarTexto(p.Aseguradora || ''),
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
            item: limpiarTexto(i['Ítem asegurado'] || ''),
            identificacion: limpiarTexto(i['Identificación (Patente/DNI/Serie)'] || ''),
            suma_asegurada_ars: parseFloat(i['Suma Asegurada ARS'] || 0),
            suma_asegurada_usd: parseFloat(i['Suma Asegurada USD'] || 0)
        }));
    } else {
        itemsData = getSampleItems();
    }
    
    const itemsPorPoliza = new Map();
    for (const item of itemsData) {
        if (!itemsPorPoliza.has(item.id_poliza)) itemsPorPoliza.set(item.id_poliza, []);
        itemsPorPoliza.get(item.id_poliza).push(item);
    }
    polizasData = polizasData.map(p => {
        const itemsPol = itemsPorPoliza.get(p.id_poliza) || [];
        let exposicion = itemsPol.reduce((sum, i) => sum + (i.suma_asegurada_ars || 0) + (i.suma_asegurada_usd || 0) * tipoCambioUSD, 0);
        if (exposicion === 0) exposicion = (p.costo_mensual_ars || 0) * 12 * 2;
        return { ...p, exposicion_ars: exposicion, cantidad_items: itemsPol.length };
    });
    
    // Unificar empresas
    polizasData = polizasData.map(p => {
        let empresa = p.tomador;
        if (normalizarParaComparacion(empresa) === 'ghm contenidos') empresa = 'GHM SRL';
        if (normalizarParaComparacion(empresa) === 'ghm satelital') empresa = 'GHM Satelital SRL';
        if (normalizarParaComparacion(empresa).includes('ghm') && !normalizarParaComparacion(empresa).includes('satelital')) empresa = 'GHM SRL';
        return { ...p, empresa };
    });
    
    // Pagador: para evento es GHM SRL, resto = empresa
    polizasData = polizasData.map(p => {
        let pagador = p.empresa;
        if (esEvento(p)) pagador = 'GHM SRL';
        return { ...p, pagador };
    });
    
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

function actualizarBadges() {
    const container = document.getElementById('activeFiltersContainer');
    if (!container) return;
    const hasFilters = currentFilters.aseguradora !== '' || currentFilters.ramo !== '';
    if (!hasFilters) {
        container.classList.add('hidden');
        container.innerHTML = '';
        return;
    }
    container.classList.remove('hidden');
    let html = '';
    if (currentFilters.aseguradora) {
        html += `<span class="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Aseguradora: ${currentFilters.aseguradora} <button class="remove-filter" data-type="aseguradora">✖</button></span>`;
    }
    if (currentFilters.ramo) {
        html += `<span class="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Ramo: ${currentFilters.ramo} <button class="remove-filter" data-type="ramo">✖</button></span>`;
    }
    container.innerHTML = html;
    document.querySelectorAll('.remove-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = btn.dataset.type;
            if (type === 'aseguradora') {
                currentFilters.aseguradora = '';
                document.getElementById('filterAseguradora').value = '';
            } else if (type === 'ramo') {
                currentFilters.ramo = '';
                document.getElementById('filterRamo').value = '';
            }
            actualizarBadges();
            applyFiltersAndRender();
        });
    });
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
        (p.id_poliza.toLowerCase().includes(searchTerm) || 
         p.aseguradora.toLowerCase().includes(searchTerm) ||
         p.empresa.toLowerCase().includes(searchTerm) ||
         p.pagador.toLowerCase().includes(searchTerm)) &&
        (currentFilters.aseguradora === '' || p.aseguradora === currentFilters.aseguradora) &&
        (currentFilters.ramo === '' || p.ramo === currentFilters.ramo)
    );
    
    sortFilteredPolizas();
    updateKPIsRecurrentes();
    updateKPIsEvento();
    updateResumenEmpresas();
    updateTablaPolizas();
    updateChartsRecurrentes();
    updateChartGastoEmpresa();
}

function sortFilteredPolizas() {
    filteredPolizas.sort((a, b) => {
        let valA, valB;
        switch (currentSortColumn) {
            case 'id_poliza': valA = a.id_poliza; valB = b.id_poliza; break;
            case 'pagador': valA = a.pagador; valB = b.pagador; break;
            case 'empresa': valA = a.empresa; valB = b.empresa; break;
            case 'aseguradora': valA = a.aseguradora; valB = b.aseguradora; break;
            case 'ramo': valA = a.ramo; valB = b.ramo; break;
            case 'costo_total': valA = a.costo_mensual_ars + (a.costo_mensual_usd * tipoCambioUSD); valB = b.costo_mensual_ars + (b.costo_mensual_usd * tipoCambioUSD); break;
            case 'cantidad_items': valA = a.cantidad_items || 0; valB = b.cantidad_items || 0; break;
            default: valA = a.id_poliza; valB = b.id_poliza;
        }
        if (typeof valA === 'string') {
            return currentSortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            return currentSortDirection === 'asc' ? valA - valB : valB - valA;
        }
    });
}

function updateKPIsRecurrentes() {
    const recurrentes = polizasData.filter(esRecurrente);
    const gastoARS = recurrentes.reduce((s,p) => s + p.costo_mensual_ars, 0);
    const gastoUSD = recurrentes.reduce((s,p) => s + (p.costo_mensual_usd * tipoCambioUSD), 0);
    const gastoTotal = gastoARS + gastoUSD;
    const sumaAsegurada = recurrentes.reduce((s,p) => s + p.exposicion_ars, 0);
    const aseguradoras = new Set(recurrentes.map(p => p.aseguradora)).size;
    let tasaPromedio = sumaAsegurada > 0 ? (gastoTotal / sumaAsegurada) * 100 : 0;
    
    document.getElementById('kpiGastoRecurrente').innerHTML = abreviaturaNumero(gastoTotal);
    document.getElementById('kpiPatrimonioRecurrente').innerHTML = abreviaturaNumero(sumaAsegurada);
    document.getElementById('kpiPolizasRecurrentes').innerHTML = recurrentes.length;
    document.getElementById('kpiAseguradorasRecurrentes').innerHTML = aseguradoras;
    document.getElementById('kpiTasaPromedio').innerHTML = `${tasaPromedio.toFixed(2)}%`;
}

function updateKPIsEvento() {
    const eventos = polizasData.filter(esEvento);
    const gasto = eventos.reduce((s,p) => s + p.costo_mensual_ars + (p.costo_mensual_usd * tipoCambioUSD), 0);
    const sumaAsegurada = eventos.reduce((s,p) => s + p.exposicion_ars, 0);
    document.getElementById('kpiCostoEvento').innerHTML = abreviaturaNumero(gasto);
    document.getElementById('kpiPatrimonioEvento').innerHTML = abreviaturaNumero(sumaAsegurada);
    document.getElementById('kpiPolizasEvento').innerHTML = eventos.length;
}

function updateResumenEmpresas() {
    const recurrentes = polizasData.filter(esRecurrente);
    const empresas = ['GHM SRL', 'GHM Satelital SRL'];
    const data = empresas.map(emp => {
        const pols = recurrentes.filter(p => p.empresa === emp);
        const gasto = pols.reduce((s,p) => s + p.costo_mensual_ars + (p.costo_mensual_usd * tipoCambioUSD), 0);
        const sumaAsegurada = pols.reduce((s,p) => s + p.exposicion_ars, 0);
        return { empresa: emp, gasto, sumaAsegurada, polizas: pols.length };
    });
    const totalGasto = data.reduce((s,d) => s + d.gasto, 0);
    const tbody = document.getElementById('tablaResumenEmpresas');
    tbody.innerHTML = '';
    data.forEach(d => {
        const porcentaje = totalGasto ? (d.gasto / totalGasto * 100).toFixed(1) : 0;
        tbody.innerHTML += `<tr class="border-b border-gray-100">
            <td class="py-2">${d.empresa}</td>
            <td class="tooltip-num" data-full="${d.gasto.toLocaleString()}">${abreviaturaNumero(d.gasto)}</td>
            <td class="tooltip-num" data-full="${d.sumaAsegurada.toLocaleString()}">${abreviaturaNumero(d.sumaAsegurada)}</td>
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
        const totalARS = p.costo_mensual_ars + (p.costo_mensual_usd * tipoCambioUSD);
        const detalleUSD = p.costo_mensual_usd ? ` + $${p.costo_mensual_usd} USD` : '';
        const tooltipTexto = `Costo mensual: $${p.costo_mensual_ars.toLocaleString()} ARS${detalleUSD} (Total ARS: $${totalARS.toLocaleString()})`;
        const tipo = esRecurrente(p) ? 'Recurrente' : 'Evento';
        const badgeColor = tipo === 'Recurrente' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600';
        
        tbody.innerHTML += `<tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="py-2 px-4 font-mono text-xs">${p.id_poliza}</td>
            <td class="px-4">${p.pagador}</td>
            <td class="px-4">${p.empresa}</td>
            <td class="px-4">${p.aseguradora}</td>
            <td class="px-4"><span class="text-xs px-2 py-0.5 rounded-full ${badgeColor}">${p.ramo}</span></td>
            <td class="px-4 text-right tooltip-num" data-full="${tooltipTexto}">${abreviaturaNumero(totalARS)}</td>
            <td class="px-4 text-center">${p.cantidad_items || 0}</td>
            <td class="px-4 text-center"><button onclick="verItems('${p.id_poliza}')" class="text-[#00a8e8] hover:text-[#003b5c] text-sm"><i class="fas fa-list-ul mr-1"></i>Ver bienes</button></td>
        </table>`;
    });
    // Inicializar tooltips nativos (usando title)
    document.querySelectorAll('.tooltip-num').forEach(el => {
        el.setAttribute('title', el.dataset.full);
    });
}

function verItems(idPoliza) {
    currentModalPolizaId = idPoliza;
    const items = itemsData.filter(i => i.id_poliza === idPoliza);
    const poliza = polizasData.find(p => p.id_poliza === idPoliza);
    const modal = document.getElementById('modalItems');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    
    modalTitle.innerText = `Bienes asegurados - ${idPoliza} (${poliza?.ramo || ''})`;
    
    if (items.length === 0) {
        modalContent.innerHTML = '<p class="text-gray-500 text-center py-8">No hay bienes registrados para esta póliza.</p>';
    } else {
        let html = `<table class="min-w-full text-sm"><thead class="border-b"><tr><th class="text-left py-2">Bien asegurado</th><th class="text-left">Identificación</th><th class="text-right">Suma ARS</th><th class="text-right">Suma USD</th></tr></thead><tbody>`;
        items.forEach(item => {
            const sumaUsdConvertida = (item.suma_asegurada_usd || 0) * tipoCambioUSD;
            html += `<tr class="border-b">
                <td class="py-2">${item.item || '-'}</td>
                <td class="py-2">${item.identificacion || '-'}</td>
                <td class="py-2 text-right tooltip-num" data-full="$${(item.suma_asegurada_ars || 0).toLocaleString()}">${abreviaturaNumero(item.suma_asegurada_ars || 0)}</td>
                <td class="py-2 text-right">${item.suma_asegurada_usd ? `$${item.suma_asegurada_usd.toLocaleString()} USD<br><span class="text-xs text-gray-400 tooltip-num" data-full="$${sumaUsdConvertida.toLocaleString()} ARS">(= ${abreviaturaNumero(sumaUsdConvertida)})</span>` : '-'}</td>
            </tr>`;
        });
        html += `</tbody>}</table>`;
        modalContent.innerHTML = html;
        document.querySelectorAll('.tooltip-num').forEach(el => {
            if (el.dataset.full) el.setAttribute('title', el.dataset.full);
        });
    }
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function exportItemsToCSV() {
    if (!currentModalPolizaId) return;
    const items = itemsData.filter(i => i.id_poliza === currentModalPolizaId);
    if (items.length === 0) return;
    const headers = ['ID Póliza', 'Bien asegurado', 'Identificación', 'Suma ARS', 'Suma USD'];
    const rows = items.map(i => [i.id_poliza, i.item, i.identificacion, i.suma_asegurada_ars || 0, i.suma_asegurada_usd || 0]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `items_${currentModalPolizaId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function mostrarDetalleEvento() {
    const polizasEvento = polizasData.filter(esEvento);
    const agrupado = new Map();
    polizasEvento.forEach(p => {
        const tomador = p.tomador;
        if (!agrupado.has(tomador)) agrupado.set(tomador, { polizas: [], pagador: 'GHM SRL' });
        agrupado.get(tomador).polizas.push(p);
    });
    let html = `<table class="min-w-full text-sm"><thead class="border-b"><tr><th class="text-left py-2">Tomador</th><th class="text-left">Pagador</th><th class="text-left">Ramo</th><th class="text-center"># Bienes</th><th class="text-left">Bienes (resumen)</th></tr></thead><tbody>`;
    for (const [tomador, data] of agrupado.entries()) {
        for (const p of data.polizas) {
            const items = itemsData.filter(i => i.id_poliza === p.id_poliza);
            const resumen = items.slice(0, 3).map(i => i.item).join(', ') + (items.length > 3 ? ` +${items.length-3} más` : (items.length === 0 ? 'Sin bienes individuales' : ''));
            html += `<tr class="border-b">
                <td class="py-2">${tomador}</td>
                <td class="py-2">${data.pagador}</td>
                <td class="py-2">${p.ramo}</td>
                <td class="py-2 text-center">${items.length}</td>
                <td class="py-2">${resumen}</td>
            </tr>`;
        }
    }
    html += `</tbody></table>`;
    document.getElementById('modalEventoContent').innerHTML = html;
    document.getElementById('modalEvento').classList.remove('hidden');
    document.getElementById('modalEvento').classList.add('flex');
}

function cerrarModalEvento() {
    const modal = document.getElementById('modalEvento');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function exportToCSV() {
    const headers = ['ID Póliza', 'Pagador', 'Empresa', 'Aseguradora', 'Ramo', 'Costo ARS', 'Costo USD', 'Total ARS', 'Cantidad Bienes', 'Tipo'];
    const rows = filteredPolizas.map(p => {
        const totalARS = p.costo_mensual_ars + (p.costo_mensual_usd * tipoCambioUSD);
        return [p.id_poliza, p.pagador, p.empresa, p.aseguradora, p.ramo, p.costo_mensual_ars, p.costo_mensual_usd, totalARS, p.cantidad_items || 0, esRecurrente(p) ? 'Recurrente' : 'Evento'];
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
    
    // Gasto por aseguradora (barras horizontales)
    const gastoAseguradora = {};
    recurrentes.forEach(p => { const costo = p.costo_mensual_ars + (p.costo_mensual_usd * tipoCambioUSD); gastoAseguradora[p.aseguradora] = (gastoAseguradora[p.aseguradora] || 0) + costo; });
    if (charts.gastoAseguradora) charts.gastoAseguradora.destroy();
    const gastoCtx = document.getElementById('chartGastoAseguradora').getContext('2d');
    charts.gastoAseguradora = new Chart(gastoCtx, {
        type: 'bar',
        data: { labels: Object.keys(gastoAseguradora), datasets: [{ label: 'Gasto mensual ARS', data: Object.values(gastoAseguradora), backgroundColor: '#003b5c', borderRadius: 8 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true, onClick: (e, activeEls) => { if (activeEls.length) { const aseguradora = Object.keys(gastoAseguradora)[activeEls[0].dataIndex]; currentFilters.aseguradora = aseguradora; document.getElementById('filterAseguradora').value = aseguradora; actualizarBadges(); applyFiltersAndRender(); } } }
    });
    
    // Gasto por ramo (barras horizontales)
    const gastoRamo = {};
    recurrentes.forEach(p => { const costo = p.costo_mensual_ars + (p.costo_mensual_usd * tipoCambioUSD); gastoRamo[p.ramo] = (gastoRamo[p.ramo] || 0) + costo; });
    if (charts.gastoRamo) charts.gastoRamo.destroy();
    const ramoCtx = document.getElementById('chartGastoRamo').getContext('2d');
    charts.gastoRamo = new Chart(ramoCtx, {
        type: 'bar',
        data: { labels: Object.keys(gastoRamo), datasets: [{ label: 'Gasto mensual ARS', data: Object.values(gastoRamo), backgroundColor: '#00a8e8', borderRadius: 8 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true, onClick: (e, activeEls) => { if (activeEls.length) { const ramo = Object.keys(gastoRamo)[activeEls[0].dataIndex]; currentFilters.ramo = ramo; document.getElementById('filterRamo').value = ramo; actualizarBadges(); applyFiltersAndRender(); } } }
    });
    
    // Suma asegurada por aseguradora
    const patrimonioAseguradora = {};
    recurrentes.forEach(p => { patrimonioAseguradora[p.aseguradora] = (patrimonioAseguradora[p.aseguradora] || 0) + p.exposicion_ars; });
    if (charts.patrimonioAseguradora) charts.patrimonioAseguradora.destroy();
    const patAseCtx = document.getElementById('chartPatrimonioAseguradora').getContext('2d');
    charts.patrimonioAseguradora = new Chart(patAseCtx, {
        type: 'bar',
        data: { labels: Object.keys(patrimonioAseguradora), datasets: [{ label: 'Suma asegurada ARS', data: Object.values(patrimonioAseguradora), backgroundColor: '#003b5c', borderRadius: 8 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true, onClick: (e, activeEls) => { if (activeEls.length) { const aseguradora = Object.keys(patrimonioAseguradora)[activeEls[0].dataIndex]; currentFilters.aseguradora = aseguradora; document.getElementById('filterAseguradora').value = aseguradora; actualizarBadges(); applyFiltersAndRender(); } } }
    });
    
    // Suma asegurada por ramo (barras horizontales)
    const patrimonioRamo = {};
    recurrentes.forEach(p => { patrimonioRamo[p.ramo] = (patrimonioRamo[p.ramo] || 0) + p.exposicion_ars; });
    if (charts.patrimonioRamo) charts.patrimonioRamo.destroy();
    const patRamoCtx = document.getElementById('chartPatrimonioRamo').getContext('2d');
    charts.patrimonioRamo = new Chart(patRamoCtx, {
        type: 'bar',
        data: { labels: Object.keys(patrimonioRamo), datasets: [{ label: 'Suma asegurada ARS', data: Object.values(patrimonioRamo), backgroundColor: '#00a8e8', borderRadius: 8 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true, onClick: (e, activeEls) => { if (activeEls.length) { const ramo = Object.keys(patrimonioRamo)[activeEls[0].dataIndex]; currentFilters.ramo = ramo; document.getElementById('filterRamo').value = ramo; actualizarBadges(); applyFiltersAndRender(); } } }
    });
}

function updateChartGastoEmpresa() { if (charts.gastoEmpresa) charts.gastoEmpresa.update(); }

function getSamplePolizas() {
    return [
        { id_poliza: "POL-001", tomador: "GHM Satelital SRL", proyecto: "Estructura Operativa", proyecto_norm: "estructura operativa", ramo: "Automotor", aseguradora: "La Segunda", costo_mensual_ars: 428549, costo_mensual_usd: 0 },
        { id_poliza: "POL-022", tomador: "GHM SRL", proyecto: "Estructura Operativa", proyecto_norm: "estructura operativa", ramo: "Caución", aseguradora: "Aseguradores de Cauciones", costo_mensual_ars: 165600, costo_mensual_usd: 138 }
    ];
}
function getSampleItems() {
    return [
        { id_poliza: "POL-001", item: "Toyota Hilux", identificacion: "AI002UK", suma_asegurada_ars: 500000000, suma_asegurada_usd: 0 },
        { id_poliza: "POL-022", item: "Stand Fiesta del Sol", identificacion: "Pedido 4501322401", suma_asegurada_ars: 0, suma_asegurada_usd: 27500 }
    ];
}

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
document.getElementById('closeModalBtn')?.addEventListener('click', () => { document.getElementById('modalItems').classList.add('hidden'); });
document.getElementById('exportItemsBtn')?.addEventListener('click', exportItemsToCSV);
document.getElementById('verDetalleEventoBtn')?.addEventListener('click', mostrarDetalleEvento);
document.getElementById('closeEventoModalBtn')?.addEventListener('click', cerrarModalEvento);
window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalItems')) document.getElementById('modalItems').classList.add('hidden');
    if (e.target === document.getElementById('modalEvento')) cerrarModalEvento();
});
window.verItems = verItems;

setInterval(loadAllData, 300000);
loadAllData().then(() => initSorting());