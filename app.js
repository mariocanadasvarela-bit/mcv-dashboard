// app.js - MCV Seguros Dashboard - Tarjetas de ramos + pólizas al hacer clic
let polizasData = [];
let itemsData = [];
let charts = {};
let currentTab = 'recurrente';
let currentEmpresa = 'Ambas';
let currentPolizaSearch = ''; // búsqueda global (se mantiene)
let selectedRamo = null;      // ramo seleccionado para mostrar pólizas

const savedEmpresa = localStorage.getItem('mcv_empresa');
if (savedEmpresa && ['GHM SRL', 'GHM Satelital SRL', 'Ambas'].includes(savedEmpresa)) currentEmpresa = savedEmpresa;

// ======================== DATOS EMBEBIDOS (los mismos que antes) ========================
// (incluir todos los datos polizas e items del código anterior, igual que en la versión funcional)
// Para abreviar, asumimos que ya están definidos globalmente.
// En la práctica, copia los arrays completos de la versión anterior.
// ...

// ======================== FUNCIONES AUXILIARES ========================
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
function esCaucion(p) { return p.esCaucion === true; }

function getPolizasFiltradas() {
    let base = currentTab === 'recurrente' ? polizasData.filter(esRecurrente) : polizasData.filter(esEvento);
    if (currentEmpresa === 'GHM SRL') base = base.filter(p => p.empresa === 'GHM SRL');
    else if (currentEmpresa === 'GHM Satelital SRL') base = base.filter(p => p.empresa === 'GHM Satelital SRL');
    if (currentPolizaSearch) {
        const s = currentPolizaSearch.toLowerCase();
        base = base.filter(p => p.nro_poliza.toLowerCase().includes(s) || p.tomador.toLowerCase().includes(s) || p.ramo.toLowerCase().includes(s) || p.cobertura_corta.toLowerCase().includes(s) || itemsData.some(i => i.id_poliza === p.id_poliza && (i.item.toLowerCase().includes(s) || i.identificacion.toLowerCase().includes(s))));
    }
    return base;
}

function updateKPIs(polizas) {
    // Igual que antes: gasto mensual excluye cauciones, suma asegurada total, etc.
    const polizasMensuales = polizas.filter(p => !esCaucion(p));
    let gastoARS = 0, gastoUSD = 0;
    for (const p of polizasMensuales) {
        gastoARS += p.costo_mensual_ars || 0;
        gastoUSD += p.costo_mensual_usd || 0;
    }
    document.getElementById('kpiGastoMensual').innerHTML = abreviaturaNumero(gastoARS + gastoUSD);
    document.getElementById('kpiGastoDetalle').innerHTML = `ARS ${gastoARS.toLocaleString()} / USD ${gastoUSD.toLocaleString()}`;
    
    let sumaAsegurada = 0;
    for (const p of polizas) sumaAsegurada += p.suma_asegurada_total || 0;
    document.getElementById('kpiSumaAsegurada').innerHTML = abreviaturaNumero(sumaAsegurada);
    document.getElementById('kpiPolizasActivas').innerHTML = polizas.length;
    
    const aseguradorasSet = new Set(polizas.map(p => p.aseguradora));
    document.getElementById('kpiAseguradoras').innerHTML = aseguradorasSet.size;
    
    const cauciones = polizas.filter(esCaucion);
    let totalCaucionesARS = 0, totalCaucionesUSD = 0;
    for (const c of cauciones) {
        if (c.moneda_total === 'ARS') totalCaucionesARS += c.costo_total_vigencia;
        else totalCaucionesUSD += c.costo_total_vigencia;
    }
    let kpiCauciones = '';
    if (totalCaucionesARS > 0) kpiCauciones += `${abreviaturaNumero(totalCaucionesARS)} ARS`;
    if (totalCaucionesUSD > 0) kpiCauciones += `${kpiCauciones ? ' + ' : ''}${abreviaturaNumero(totalCaucionesUSD)} USD`;
    if (!kpiCauciones) kpiCauciones = '$0';
    document.getElementById('kpiCauciones').innerHTML = kpiCauciones;
}

function updateCharts(polizas) {
    const polizasMensuales = polizas.filter(p => !esCaucion(p));
    const gastoAseguradora = {};
    for (const p of polizasMensuales) {
        const costo = (p.costo_mensual_ars || 0) + (p.costo_mensual_usd || 0);
        gastoAseguradora[p.aseguradora] = (gastoAseguradora[p.aseguradora] || 0) + costo;
    }
    renderBarChart('chartGastoAseguradora', gastoAseguradora, 'Gasto mensual ARS');
    const gastoRamo = {};
    for (const p of polizasMensuales) {
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
        data: { labels, datasets: [{ label, data: values, backgroundColor: '#c7d2fe', borderRadius: 6 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' } } }
    });
}

function renderRamosCards(polizas) {
    const ramosMap = new Map();
    for (const p of polizas) {
        if (!ramosMap.has(p.ramo)) ramosMap.set(p.ramo, []);
        ramosMap.get(p.ramo).push(p);
    }
    const container = document.getElementById('ramosContainer');
    container.innerHTML = '';
    for (const [ramo, pols] of ramosMap.entries()) {
        let gastoARS = 0, gastoUSD = 0, sumaAsegurada = 0;
        const allItems = [];
        for (const p of pols) {
            gastoARS += p.costo_mensual_ars || 0;
            gastoUSD += p.costo_mensual_usd || 0;
            sumaAsegurada += p.suma_asegurada_total || 0;
            const items = itemsData.filter(i => i.id_poliza === p.id_poliza);
            allItems.push(...items.map(i => i.item));
        }
        const uniqueItems = [...new Set(allItems)];
        const resumenBienes = uniqueItems.slice(0, 2).join(', ') + (uniqueItems.length > 2 ? ` +${uniqueItems.length-2} más` : (uniqueItems.length === 0 ? 'Sin bienes' : ''));
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer';
        card.addEventListener('click', () => {
            selectedRamo = ramo;
            renderPolizasDeRamo(pols);
            document.getElementById('ramosSection').classList.add('hidden');
            document.getElementById('polizasSection').classList.remove('hidden');
            document.getElementById('ramoSeleccionadoNombre').innerText = ramo;
        });
        card.innerHTML = `
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <i class="fas ${getIconForRamo(ramo)} text-indigo-400 text-xl"></i>
                    <h3 class="font-bold text-slate-800 text-lg">${ramo}</h3>
                </div>
                <span class="text-xs bg-slate-100 px-2 py-1 rounded-full">${pols.length} pólizas</span>
            </div>
            <div class="text-sm text-slate-600 mb-2">
                <div>Gasto: ${abreviaturaNumero(gastoARS + gastoUSD)}</div>
                <div class="text-xs text-slate-400">ARS ${gastoARS.toLocaleString()} / USD ${gastoUSD.toLocaleString()}</div>
            </div>
            <div class="text-xs text-slate-500 truncate">📦 ${resumenBienes}</div>
        `;
        container.appendChild(card);
    }
}

function getIconForRamo(ramo) {
    const r = ramo.toLowerCase();
    if (r.includes('automotor')) return 'fa-car';
    if (r.includes('art')) return 'fa-briefcase-medical';
    if (r.includes('vida')) return 'fa-heartbeat';
    if (r.includes('rc')) return 'fa-shield-alt';
    if (r.includes('caución')) return 'fa-handshake';
    if (r.includes('robo')) return 'fa-lock';
    return 'fa-file-alt';
}

function renderPolizasDeRamo(polizas) {
    const container = document.getElementById('polizasContainer');
    container.innerHTML = '';
    for (const poliza of polizas) {
        const items = itemsData.filter(i => i.id_poliza === poliza.id_poliza);
        const costoStr = esCaucion(poliza) ? `${abreviaturaNumero(poliza.costo_total_vigencia)} ${poliza.moneda_total} (total vigencia)` : `${abreviaturaNumero(poliza.costo_mensual_ars)} ARS/mes ${poliza.costo_mensual_usd ? `+ ${abreviaturaNumero(poliza.costo_mensual_usd)} USD/mes` : ''}`;
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all';
        card.innerHTML = `
            <div class="p-5">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="text-indigo-600 text-sm font-semibold uppercase tracking-wide">${poliza.ramo}</div>
                        <div class="text-xl font-bold text-slate-800 mt-1">${poliza.cobertura_corta || 'Cobertura específica'}</div>
                        <div class="text-sm text-slate-600 mt-1">${poliza.tomador}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-xs text-slate-400">Póliza N° ${poliza.nro_poliza}</div>
                        <div class="text-sm font-semibold text-slate-800 mt-1">${costoStr}</div>
                    </div>
                </div>
                <div class="mt-4 flex flex-wrap items-center gap-4 text-sm">
                    <div><span class="text-slate-400"># Bienes:</span> <span class="font-medium">${poliza.cantidad_items}</span></div>
                    <div><span class="text-slate-400">Suma asegurada:</span> <span class="font-medium">${abreviaturaNumero(poliza.suma_asegurada_total)}</span></div>
                    <div><span class="text-slate-400">Vigencia:</span> <span class="font-medium">${poliza.vigencia_desde} al ${poliza.vigencia_hasta}</span></div>
                    <div><span class="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">VIGENTE</span></div>
                </div>
                <div class="mt-4">
                    <button class="ver-bienes-btn text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1" data-id="${poliza.id_poliza}"><i class="fas fa-box-open"></i> Ver bienes (${poliza.cantidad_items})</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    }
    // Eventos para botones "Ver bienes"
    document.querySelectorAll('.ver-bienes-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idPoliza = btn.getAttribute('data-id');
            const poliza = polizasData.find(p => p.id_poliza === idPoliza);
            const items = itemsData.filter(i => i.id_poliza === idPoliza);
            const modal = document.getElementById('modalItems');
            const modalTitle = document.getElementById('modalTitle');
            const modalContent = document.getElementById('modalContent');
            modalTitle.innerText = `Bienes asegurados - ${poliza.nro_poliza} (${poliza.ramo})`;
            if (items.length === 0) {
                modalContent.innerHTML = '<p class="text-slate-500 text-center py-6">No hay bienes registrados para esta póliza.</p>';
            } else {
                let html = `<div class="overflow-x-auto"><table class="min-w-full text-sm"><thead class="bg-slate-50"><tr><th class="text-left py-2 px-3">Ítem asegurado</th><th class="text-left py-2 px-3">Identificación</th><th class="text-right py-2 px-3">Suma ARS</th><th class="text-right py-2 px-3">Suma USD</th></tr></thead><tbody>`;
                for (const item of items) {
                    html += `<tr class="border-b"><td class="py-2 px-3">${item.item}<tr><td class="py-2 px-3">${item.identificacion}</td><td class="py-2 px-3 text-right">${item.suma_asegurada_ars ? '$'+item.suma_asegurada_ars.toLocaleString() : '$0'}</td><td class="py-2 px-3 text-right">${item.suma_asegurada_usd ? '$'+item.suma_asegurada_usd.toLocaleString() : '-'}</td></tr>`;
                }
                html += `</tbody></table></div>`;
                modalContent.innerHTML = html;
            }
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        });
    });
}

function exportToCSV() { /* igual que antes */ }
function exportToExcel() { /* igual que antes */ }
async function exportToPDF() { /* igual que antes */ }

// Inicialización y eventos
document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos (ya están embebidos)
    const polizas = getPolizasFiltradas();
    updateKPIs(polizas);
    updateCharts(polizas);
    renderRamosCards(polizas);
    
    document.getElementById('lastUpdate').innerHTML = new Date().toLocaleTimeString() + ' - Datos embebidos';
    document.getElementById('refreshBtn')?.addEventListener('click', () => { location.reload(); });
    document.getElementById('exportCSVBtn')?.addEventListener('click', exportToCSV);
    document.getElementById('exportExcelBtn')?.addEventListener('click', exportToExcel);
    document.getElementById('exportPDFBtn')?.addEventListener('click', exportToPDF);
    document.getElementById('searchPoliza')?.addEventListener('input', (e) => {
        currentPolizaSearch = e.target.value;
        const polizasFiltradas = getPolizasFiltradas();
        updateKPIs(polizasFiltradas);
        updateCharts(polizasFiltradas);
        if (selectedRamo) {
            const pols = polizasFiltradas.filter(p => p.ramo === selectedRamo);
            renderPolizasDeRamo(pols);
        } else {
            renderRamosCards(polizasFiltradas);
        }
    });
    document.getElementById('backToRamosBtn')?.addEventListener('click', () => {
        selectedRamo = null;
        document.getElementById('ramosSection').classList.remove('hidden');
        document.getElementById('polizasSection').classList.add('hidden');
        const polizasFiltradas = getPolizasFiltradas();
        renderRamosCards(polizasFiltradas);
    });
    document.getElementById('closeModalBtn')?.addEventListener('click', () => document.getElementById('modalItems').classList.add('hidden'));
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modalItems')) document.getElementById('modalItems').classList.add('hidden');
    });
    
    // Pestañas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active', 'border-b-2', 'border-indigo-400', 'text-slate-800'));
            btn.classList.add('active', 'border-b-2', 'border-indigo-400', 'text-slate-800');
            currentTab = btn.getAttribute('data-tab');
            currentPolizaSearch = '';
            document.getElementById('searchPoliza').value = '';
            selectedRamo = null;
            document.getElementById('ramosSection').classList.remove('hidden');
            document.getElementById('polizasSection').classList.add('hidden');
            const polizasFiltradas = getPolizasFiltradas();
            updateKPIs(polizasFiltradas);
            updateCharts(polizasFiltradas);
            renderRamosCards(polizasFiltradas);
        });
    });
    
    // Selector de empresa (orden: Ambas, GHM SRL, GHM Satelital)
    document.querySelectorAll('.empresa-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const empresa = btn.getAttribute('data-empresa');
            currentEmpresa = empresa;
            localStorage.setItem('mcv_empresa', empresa);
            document.querySelectorAll('.empresa-btn').forEach(b => {
                b.classList.remove('bg-indigo-100', 'text-indigo-800', 'border-indigo-200');
                b.classList.add('bg-white', 'text-slate-700', 'border-slate-200');
            });
            btn.classList.remove('bg-white', 'text-slate-700', 'border-slate-200');
            btn.classList.add('bg-indigo-100', 'text-indigo-800', 'border-indigo-200');
            currentPolizaSearch = '';
            document.getElementById('searchPoliza').value = '';
            selectedRamo = null;
            document.getElementById('ramosSection').classList.remove('hidden');
            document.getElementById('polizasSection').classList.add('hidden');
            const polizasFiltradas = getPolizasFiltradas();
            updateKPIs(polizasFiltradas);
            updateCharts(polizasFiltradas);
            renderRamosCards(polizasFiltradas);
        });
    });
    
    // Asegurar que el botón "Ambas" esté activo al inicio
    const ambasBtn = Array.from(document.querySelectorAll('.empresa-btn')).find(b => b.getAttribute('data-empresa') === 'Ambas');
    if (ambasBtn) ambasBtn.click();
});
