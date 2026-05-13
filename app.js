// app.js - MCV Seguros Dashboard - Versión con tarjetas por ramo + pólizas expandibles
const POLIZAS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTizUhGOMK4CqFeegbAtWciBpS29ZZ8fvqaednZUMlwOFMZ9lzK0-0PpcJyacyifXeSJazpTIcLqL2q/pub?gid=0&single=true&output=csv';
const ITEMS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTizUhGOMK4CqFeegbAtWciBpS29ZZ8fvqaednZUMlwOFMZ9lzK0-0PpcJyacyifXeSJazpTIcLqL2q/pub?gid=1897816776&single=true&output=csv';

let polizasData = [];
let itemsData = [];
let ramosData = [];        // Array de objetos { ramo, polizas, gastoARS, gastoUSD, sumaAsegurada, cantidadItems, resumenBienes }
let currentRamoFiltro = null;
let tipoCambioUSD = 1200;
let charts = {};

// Mapeo de coberturas específicas por número de póliza real (no por ID interno)
// Usaremos el campo 'nro_poliza' real extraído del CSV
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

// Para pólizas del evento se puede asignar genérico
function getCobertura(nroPoliza, ramo) {
    if (coberturaMap.has(nroPoliza)) return coberturaMap.get(nroPoliza);
    if (ramo && ramo.toLowerCase().includes('accidentes personales')) return "Accidentes Personales (muerte, invalidez, asistencia médica)";
    return "No especificada";
}

// Helper para abreviar números
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
    
    // Mapear pólizas
    polizasData = (polCSV.length ? polCSV : getSamplePolizas()).map(p => {
        let proyectoRaw = limpiarTexto(p['Proyecto / Centro de Costo'] || '');
        let tomadorRaw = limpiarTexto(p.Tomador || '');
        let pagadorRaw = limpiarTexto(p['Pagador Real'] || tomadorRaw);
        let nroPolizaRaw = limpiarTexto(p['Nro Póliza'] || '');  // número real
        return {
            id_poliza: p.ID_Poliza?.toString().trim() || '',     // interno
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
    
    // Mapear items
    itemsData = (itemsCSV.length ? itemsCSV : getSampleItems()).map(i => ({
        id_poliza: i.ID_Poliza?.toString().trim() || '',
        item: limpiarTexto(i['Ítem asegurado'] || ''),
        identificacion: limpiarTexto(i['Identificación (Patente/DNI/Serie)'] || ''),
        suma_asegurada_ars: parseFloat(i['Suma Asegurada ARS'] || 0),
        suma_asegurada_usd: parseFloat(i['Suma Asegurada USD'] || 0)
    }));
    
    // Unificar empresas y limpiar
    polizasData = polizasData.map(p => {
        let empresa = p.tomador;
        if (normalizarParaComparacion(empresa) === 'ghm contenidos') empresa = 'GHM SRL';
        if (normalizarParaComparacion(empresa) === 'ghm satelital') empresa = 'GHM Satelital SRL';
        if (normalizarParaComparacion(empresa).includes('ghm') && !normalizarParaComparacion(empresa).includes('satelital')) empresa = 'GHM SRL';
        let pagador = p.pagador;
        if (esEvento(p)) pagador = 'GHM SRL';
        return { ...p, empresa, pagador };
    });
    
    // Agregar cobertura usando número real de póliza
    polizasData = polizasData.map(p => ({
        ...p,
        cobertura: getCobertura(p.nro_poliza, p.ramo)
    }));
    
    // Calcular items por póliza (usando id_poliza interno, pero coincide)
    const itemsPorPoliza = new Map();
    itemsData.forEach(item => {
        itemsPorPoliza.set(item.id_poliza, (itemsPorPoliza.get(item.id_poliza) || 0) + 1);
    });
    polizasData = polizasData.map(p => ({
        ...p,
        cantidad_items: itemsPorPoliza.get(p.id_poliza) || 0
    }));
    
    // Construir resumen por ramo (solo recurrentes, ignoramos evento para los resúmenes? pero lo incluimos si el cliente quiere)
    // Por claridad, separamos: el dashboard muestra ambos, pero en las tarjetas de resumen solo recurrentes? Mejor mostrar todos.
    const allPolizas = polizasData; // incluye evento y recurrente
    const ramosMap = new Map();
    for (const poliza of allPolizas) {
        const ramo = poliza.ramo;
        if (!ramosMap.has(ramo)) {
            ramosMap.set(ramo, []);
        }
        ramosMap.get(ramo).push(poliza);
    }
    ramosData = [];
    for (const [ramo, polizas] of ramosMap.entries()) {
        let gastoARS = 0, gastoUSD = 0, sumaAsegurada = 0;
        for (const p of polizas) {
            gastoARS += p.costo_mensual_ars;
            gastoUSD += p.costo_mensual_usd;
            // Suma asegurada: sumar los items de cada póliza
            const itemsPol = itemsData.filter(i => i.id_poliza === p.id_poliza);
            for (const item of itemsPol) {
                sumaAsegurada += item.suma_asegurada_ars + (item.suma_asegurada_usd * tipoCambioUSD);
            }
        }
        // Generar resumen de bienes representativos (primeros 3 items únicos)
        const allItems = [];
        for (const p of polizas) {
            const itemsPol = itemsData.filter(i => i.id_poliza === p.id_poliza);
            allItems.push(...itemsPol.map(i => i.item));
        }
        const uniqueItems = [...new Set(allItems)];
        const resumenBienes = uniqueItems.slice(0, 3).join(', ') + (uniqueItems.length > 3 ? ` +${uniqueItems.length-3} más` : '');
        
        ramosData.push({
            ramo,
            polizas,
            gastoARS,
            gastoUSD,
            sumaAsegurada,
            cantidadPolizas: polizas.length,
            cantidadItems: allItems.length,
            resumenBienes
        });
    }
    // Ordenar ramos por gasto total descendente
    ramosData.sort((a,b) => (b.gastoARS + b.gastoUSD*tipoCambioUSD) - (a.gastoARS + a.gastoUSD*tipoCambioUSD));
    
    updateKPIs();
    updateCharts();
    renderRamoCards();
    // Si hay un filtro activo, renderizar detalle
    if (currentRamoFiltro) {
        renderPolizasDetail(currentRamoFiltro);
    } else {
        document.getElementById('polizasDetailContainer').classList.add('hidden');
    }
    document.getElementById('lastUpdate').innerHTML = new Date().toLocaleTimeString() + ' - USD $' + tipoCambioUSD;
}

function updateKPIs() {
    const recurrentes = polizasData.filter(esRecurrente);
    const gastoARS = recurrentes.reduce((s,p) => s + p.costo_mensual_ars, 0);
    const gastoUSD = recurrentes.reduce((s,p) => s + p.costo_mensual_usd * tipoCambioUSD, 0);
    const gastoTotal = gastoARS + gastoUSD;
    let sumaAsegurada = 0;
    for (const p of recurrentes) {
        const itemsPol = itemsData.filter(i => i.id_poliza === p.id_poliza);
        sumaAsegurada += itemsPol.reduce((acc,i) => acc + i.suma_asegurada_ars + (i.suma_asegurada_usd * tipoCambioUSD), 0);
    }
    const aseguradoras = new Set(recurrentes.map(p => p.aseguradora)).size;
    const tasa = sumaAsegurada > 0 ? (gastoTotal / sumaAsegurada) * 100 : 0;
    document.getElementById('kpiGastoMensual').innerHTML = abreviaturaNumero(gastoTotal);
    document.getElementById('kpiSumaAsegurada').innerHTML = abreviaturaNumero(sumaAsegurada);
    document.getElementById('kpiPolizasActivas').innerHTML = recurrentes.length;
    document.getElementById('kpiAseguradoras').innerHTML = aseguradoras;
    document.getElementById('kpiTasaRiesgo').innerHTML = `${tasa.toFixed(2)}%`;
}

function updateCharts() {
    const recurrentes = polizasData.filter(esRecurrente);
    
    // Gasto por aseguradora
    const gastoAseguradora = {};
    recurrentes.forEach(p => {
        const costo = p.costo_mensual_ars + (p.costo_mensual_usd * tipoCambioUSD);
        gastoAseguradora[p.aseguradora] = (gastoAseguradora[p.aseguradora] || 0) + costo;
    });
    if (charts.gastoAseguradora) charts.gastoAseguradora.destroy();
    const gastoCtx = document.getElementById('chartGastoAseguradora').getContext('2d');
    charts.gastoAseguradora = new Chart(gastoCtx, {
        type: 'bar',
        data: { labels: Object.keys(gastoAseguradora), datasets: [{ label: 'Gasto mensual ARS', data: Object.values(gastoAseguradora), backgroundColor: '#003b5c', borderRadius: 8 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true }
    });
    
    // Gasto por ramo
    const gastoRamo = {};
    recurrentes.forEach(p => {
        const costo = p.costo_mensual_ars + (p.costo_mensual_usd * tipoCambioUSD);
        gastoRamo[p.ramo] = (gastoRamo[p.ramo] || 0) + costo;
    });
    if (charts.gastoRamo) charts.gastoRamo.destroy();
    const ramoCtx = document.getElementById('chartGastoRamo').getContext('2d');
    charts.gastoRamo = new Chart(ramoCtx, {
        type: 'bar',
        data: { labels: Object.keys(gastoRamo), datasets: [{ label: 'Gasto mensual ARS', data: Object.values(gastoRamo), backgroundColor: '#00a8e8', borderRadius: 8 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true }
    });
    
    // Suma asegurada por aseguradora
    const patrimonioAseguradora = {};
    for (const p of recurrentes) {
        const itemsPol = itemsData.filter(i => i.id_poliza === p.id_poliza);
        const suma = itemsPol.reduce((acc,i) => acc + i.suma_asegurada_ars + (i.suma_asegurada_usd * tipoCambioUSD), 0);
        patrimonioAseguradora[p.aseguradora] = (patrimonioAseguradora[p.aseguradora] || 0) + suma;
    }
    if (charts.patrimonioAseguradora) charts.patrimonioAseguradora.destroy();
    const patAseCtx = document.getElementById('chartPatrimonioAseguradora').getContext('2d');
    charts.patrimonioAseguradora = new Chart(patAseCtx, {
        type: 'bar',
        data: { labels: Object.keys(patrimonioAseguradora), datasets: [{ label: 'Suma asegurada ARS', data: Object.values(patrimonioAseguradora), backgroundColor: '#003b5c', borderRadius: 8 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true }
    });
    
    // Suma asegurada por ramo
    const patrimonioRamo = {};
    for (const p of recurrentes) {
        const itemsPol = itemsData.filter(i => i.id_poliza === p.id_poliza);
        const suma = itemsPol.reduce((acc,i) => acc + i.suma_asegurada_ars + (i.suma_asegurada_usd * tipoCambioUSD), 0);
        patrimonioRamo[p.ramo] = (patrimonioRamo[p.ramo] || 0) + suma;
    }
    if (charts.patrimonioRamo) charts.patrimonioRamo.destroy();
    const patRamoCtx = document.getElementById('chartPatrimonioRamo').getContext('2d');
    charts.patrimonioRamo = new Chart(patRamoCtx, {
        type: 'bar',
        data: { labels: Object.keys(patrimonioRamo), datasets: [{ label: 'Suma asegurada ARS', data: Object.values(patrimonioRamo), backgroundColor: '#00a8e8', borderRadius: 8 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true }
    });
}

function renderRamoCards() {
    const container = document.getElementById('ramoCardsContainer');
    container.innerHTML = '';
    for (const ramoData of ramosData) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer';
        card.setAttribute('data-ramo', ramoData.ramo);
        card.addEventListener('click', () => {
            currentRamoFiltro = ramoData.ramo;
            renderPolizasDetail(ramoData.ramo);
            document.getElementById('polizasDetailContainer').classList.remove('hidden');
            document.getElementById('ramoSeleccionadoTitulo').innerText = ramoData.ramo;
            // Scroll suave al detalle
            document.getElementById('polizasDetailContainer').scrollIntoView({ behavior: 'smooth' });
        });
        const gastoTotalARS = ramoData.gastoARS + (ramoData.gastoUSD * tipoCambioUSD);
        const icon = getIconForRamo(ramoData.ramo);
        card.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <i class="${icon} text-xl text-[#003b5c]"></i>
                    <h3 class="font-bold text-gray-800">${ramoData.ramo}</h3>
                </div>
                <span class="text-xs bg-gray-100 px-2 py-1 rounded-full">${ramoData.cantidadPolizas} pólizas</span>
            </div>
            <div class="text-sm text-gray-600 mb-2">
                <div>Gasto: ${abreviaturaNumero(gastoTotalARS)}</div>
                <div class="text-xs text-gray-400">ARS ${ramoData.gastoARS.toLocaleString()} / USD ${ramoData.gastoUSD.toLocaleString()}</div>
            </div>
            <div class="text-sm text-gray-600 border-t pt-2 mt-1">
                <div class="font-medium">Bienes:</div>
                <div class="text-xs text-gray-500">${ramoData.resumenBienes || '—'}</div>
            </div>
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

function renderPolizasDetail(ramo) {
    const container = document.getElementById('polizasListContainer');
    const ramoObj = ramosData.find(r => r.ramo === ramo);
    if (!ramoObj) return;
    const polizas = ramoObj.polizas;
    container.innerHTML = '';
    for (const poliza of polizas) {
        const items = itemsData.filter(i => i.id_poliza === poliza.id_poliza);
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden';
        // Cabecera de la póliza (siempre visible)
        const header = document.createElement('div');
        header.className = 'p-4 flex flex-wrap justify-between items-center cursor-pointer hover:bg-gray-50 transition';
        header.innerHTML = `
            <div class="flex items-center gap-3">
                <i class="fas fa-chevron-right text-gray-400 expand-icon-politica"></i>
                <div>
                    <div class="font-mono text-sm font-bold text-[#003b5c]">${poliza.nro_poliza}</div>
                    <div class="text-xs text-gray-500">${poliza.aseguradora}</div>
                </div>
            </div>
            <div class="flex flex-wrap gap-4 text-sm">
                <div><span class="text-gray-500">Cobertura:</span> <span class="font-medium">${poliza.cobertura.substring(0,50)}${poliza.cobertura.length>50?'…':''}</span></div>
                <div><span class="text-gray-500">Costo ARS:</span> ${poliza.costo_mensual_ars ? '$'+poliza.costo_mensual_ars.toLocaleString() : '$0'}</div>
                <div><span class="text-gray-500">Costo USD:</span> ${poliza.costo_mensual_usd ? '$'+poliza.costo_mensual_usd.toLocaleString() : '-'}</div>
                <div><span class="text-gray-500"># Bienes:</span> ${poliza.cantidad_items}</div>
            </div>
        `;
        // Cuerpo expandible (bienes)
        const body = document.createElement('div');
        body.className = 'hidden border-t border-gray-100 p-4 bg-gray-50';
        if (items.length === 0) {
            body.innerHTML = '<p class="text-gray-500 text-sm">No hay bienes registrados.</p>';
        } else {
            let tableHtml = `<table class="min-w-full text-sm"><thead><tr><th class="text-left">Ítem asegurado</th><th class="text-left">Identificación</th><th class="text-right">Suma ARS</th><th class="text-right">Suma USD</th></tr></thead><tbody>`;
            for (const item of items) {
                tableHtml += `<tr class="border-b">
                    <td class="py-2">${item.item || '-'}</td>
                    <td class="py-2">${item.identificacion || '-'}</td>
                    <td class="py-2 text-right">${item.suma_asegurada_ars ? '$'+item.suma_asegurada_ars.toLocaleString() : '$0'}</td>
                    <td class="py-2 text-right">${item.suma_asegurada_usd ? '$'+item.suma_asegurada_usd.toLocaleString() : '-'}</td>
                </tr>`;
            }
            tableHtml += `</tbody></table>`;
            body.innerHTML = tableHtml;
        }
        card.appendChild(header);
        card.appendChild(body);
        // Toggle expandir
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

// Exportar CSV (detalle de ítems, una fila por bien)
function exportToCSV() {
    const polizasAEportar = currentRamoFiltro ? ramosData.find(r => r.ramo === currentRamoFiltro)?.polizas : polizasData;
    if (!polizasAEportar) return;
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
    link.setAttribute('download', `items_mcv_${new Date().toISOString().slice(0,19)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Eventos
document.getElementById('refreshBtn')?.addEventListener('click', loadAllData);
document.getElementById('exportCSVBtn')?.addEventListener('click', exportToCSV);
document.getElementById('limpiarFiltroBtn')?.addEventListener('click', () => {
    currentRamoFiltro = null;
    document.getElementById('polizasDetailContainer').classList.add('hidden');
});

// Datos de muestra por si falla la carga
function getSamplePolizas() { return []; }
function getSampleItems() { return []; }

setInterval(loadAllData, 300000);
loadAllData();