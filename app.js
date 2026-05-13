// app.js - MCV Seguros Dashboard - Versión definitiva con datos embebidos (sin dependencia de CSVs)
const tipoCambioUSD = 1200;

let polizasData = [];
let itemsData = [];
let charts = {};
let currentTab = 'recurrente';
let currentEmpresa = 'GHM SRL';
let currentRamoFiltro = null;
let currentPolizaSearch = '';

// ======================== DATOS CORREGIDOS (fuente principal) ========================
const polizasCorregidas = [
    {
        nro_poliza: '68280884',
        tomador: 'GHM Satelital SRL',
        empresa: 'GHM Satelital SRL',
        pagador: 'GHM Satelital SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'Automotor',
        aseguradora: 'La Segunda',
        costo_mensual_ars: 428549,
        costo_mensual_usd: 0,
        vigencia_desde: '27/04/2026',
        vigencia_hasta: '27/07/2026',
        cobertura_corta: 'Privilegio L2 (completo)',
        items: [
            { item: 'TOYOTA HILUX L/25 2.8 DC 4X4 TDI SRV+ AT6 2026 - AI002UK', identificacion: 'AI002UK', suma_ars: 79838000, suma_usd: 0 },
            { item: 'TOYOTA HILUX L/25 2.8 DC 4X4 TDI SRV+ AT6 2026 - AI002UJ', identificacion: 'AI002UJ', suma_ars: 79838000, suma_usd: 0 }
        ]
    },
    {
        nro_poliza: '58881286',
        tomador: 'GHM Satelital SRL',
        empresa: 'GHM Satelital SRL',
        pagador: 'GHM Satelital SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'Automotor',
        aseguradora: 'La Segunda',
        costo_mensual_ars: 201561.17,
        costo_mensual_usd: 0,
        vigencia_desde: '05/04/2026',
        vigencia_hasta: '05/07/2026',
        cobertura_corta: 'Privilegio L2 (completo)',
        items: [
            { item: 'TOYOTA HILUX L/21 2.8 DC 4X4 TDI SR', identificacion: 'AF353UN', suma_ars: 45000000, suma_usd: 0 }
        ]
    },
    {
        nro_poliza: '58845801',
        tomador: 'GHM Satelital SRL',
        empresa: 'GHM Satelital SRL',
        pagador: 'GHM Satelital SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'Automotor',
        aseguradora: 'La Segunda',
        costo_mensual_ars: 184357,
        costo_mensual_usd: 0,
        vigencia_desde: '26/02/2026',
        vigencia_hasta: '26/05/2026',
        cobertura_corta: 'Privilegio L2 para Nissan / Arranque L2 para Trailer',
        items: [
            { item: 'Trailer', identificacion: '101AF981GW', suma_ars: 0, suma_usd: 0, solo_rc: true },
            { item: 'Nissan Frontier', identificacion: 'AP981GW', suma_ars: 45000000, suma_usd: 0 }
        ]
    },
    {
        nro_poliza: '58881287',
        tomador: 'GHM SRL',
        empresa: 'GHM SRL',
        pagador: 'GHM SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'Automotor',
        aseguradora: 'La Segunda',
        costo_mensual_ars: 698123,
        costo_mensual_usd: 0,
        vigencia_desde: '05/04/2026',
        vigencia_hasta: '05/07/2026',
        cobertura_corta: 'Privilegio L2 para autos / Arranque L2 para trailer',
        items: [
            { item: 'Toyota Hilux 2019', identificacion: 'AD571CC', suma_ars: 38500000, suma_usd: 0 },
            { item: 'Toyota Hilux 2017', identificacion: 'AB210EX', suma_ars: 37300000, suma_usd: 0 },
            { item: 'Toyota Hilux SW4 2018', identificacion: 'AC899XO', suma_ars: 45000000, suma_usd: 0 },
            { item: 'Trailer', identificacion: '101AB210EX', suma_ars: 0, suma_usd: 0, solo_rc: true }
        ]
    },
    {
        nro_poliza: '58844225',
        tomador: 'GHM Satelital SRL',
        empresa: 'GHM Satelital SRL',
        pagador: 'GHM Satelital SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'Automotor',
        aseguradora: 'La Segunda',
        costo_mensual_ars: 15905,
        costo_mensual_usd: 0,
        vigencia_desde: '14/02/2026',
        vigencia_hasta: '14/05/2026',
        cobertura_corta: 'Arranque L2 (solo RC)',
        items: [
            { item: 'Trailer', identificacion: '101AF353UN', suma_ars: 0, suma_usd: 0, solo_rc: true }
        ]
    },
    {
        nro_poliza: '58844224',
        tomador: 'GHM SRL',
        empresa: 'GHM SRL',
        pagador: 'GHM SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'Automotor',
        aseguradora: 'La Segunda',
        costo_mensual_ars: 15905,
        costo_mensual_usd: 0,
        vigencia_desde: '14/02/2026',
        vigencia_hasta: '14/05/2026',
        cobertura_corta: 'Arranque L2 (solo RC)',
        items: [
            { item: 'Trailer', identificacion: '101AD571CC', suma_ars: 0, suma_usd: 0, solo_rc: true }
        ]
    },
    {
        nro_poliza: '67844592',
        tomador: 'GHM Satelital SRL',
        empresa: 'GHM Satelital SRL',
        pagador: 'GHM Satelital SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'Automotor',
        aseguradora: 'La Segunda',
        costo_mensual_ars: 15336,
        costo_mensual_usd: 0,
        vigencia_desde: '17/02/2026',
        vigencia_hasta: '17/05/2026',
        cobertura_corta: 'Arranque L2 (solo RC)',
        items: [
            { item: 'Trailer', identificacion: '101AF981GW', suma_ars: 0, suma_usd: 0, solo_rc: true }
        ]
    },
    {
        nro_poliza: '41789769',
        tomador: 'GHM Satelital SRL',
        empresa: 'GHM Satelital SRL',
        pagador: 'GHM Satelital SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'Cuatriciclo',
        aseguradora: 'La Segunda',
        costo_mensual_ars: 33358,
        costo_mensual_usd: 0,
        vigencia_desde: '05/03/2026',
        vigencia_hasta: '05/06/2026',
        cobertura_corta: 'Plan Nro. 25 – solo siniestros totales',
        items: [
            { item: 'Cuatriciclo', identificacion: '419HXK', suma_ars: 13807159, suma_usd: 0 }
        ]
    },
    {
        nro_poliza: '45598579',
        tomador: 'GHM Satelital SRL',
        empresa: 'GHM Satelital SRL',
        pagador: 'GHM Satelital SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'Moto',
        aseguradora: 'La Segunda',
        costo_mensual_ars: 57241,
        costo_mensual_usd: 0,
        vigencia_desde: '28/02/2026',
        vigencia_hasta: '31/05/2026',
        cobertura_corta: 'Selecto L2 (completo)',
        items: [
            { item: 'Beta Zontes 368 G', identificacion: 'A269GYK', suma_ars: 11246000, suma_usd: 0 }
        ]
    },
    {
        nro_poliza: '40156645',
        tomador: 'GHM Satelital SRL',
        empresa: 'GHM Satelital SRL',
        pagador: 'GHM Satelital SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'Seguro Técnico',
        aseguradora: 'La Segunda',
        costo_mensual_ars: 12609,
        costo_mensual_usd: 0,
        vigencia_desde: '18/02/2026',
        vigencia_hasta: '18/08/2026',
        cobertura_corta: 'Seguro Técnico – Equipo de contratista',
        items: [
            { item: 'Moto de nieve SKI DOO 1', identificacion: 'N° serie no especificado', suma_ars: 4262287, suma_usd: 0 },
            { item: 'Moto de nieve SKI DOO 2', identificacion: 'N° serie no especificado', suma_ars: 5732041, suma_usd: 0 }
        ]
    },
    {
        nro_poliza: '40194044',
        tomador: 'GHM SRL',
        empresa: 'GHM SRL',
        pagador: 'GHM SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'Robo',
        aseguradora: 'La Segunda',
        costo_mensual_ars: 18008,
        costo_mensual_usd: 0,
        vigencia_desde: '10/01/2026',
        vigencia_hasta: '10/07/2026',
        cobertura_corta: 'Robo exclusivo (excluye hurto)',
        items: [
            { item: 'Equipos fotográficos', identificacion: 'N/A', suma_ars: 1500000, suma_usd: 0 }
        ]
    },
    {
        nro_poliza: '352086',
        tomador: 'GHM Satelital SRL',
        empresa: 'GHM Satelital SRL',
        pagador: 'GHM Satelital SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'ART',
        aseguradora: 'La Segunda ART',
        costo_mensual_ars: 439468,
        costo_mensual_usd: 0,
        vigencia_desde: '01/09/2023',
        vigencia_hasta: '31/12/2026',
        cobertura_corta: 'ART – Ley 24.557 (riesgos del trabajo)',
        items: [
            { item: '6 trabajadores', identificacion: 'CIIU 614090', suma_ars: 0, suma_usd: 0, es_prestacional: true }
        ]
    },
    {
        nro_poliza: '350751',
        tomador: 'GHM SRL',
        empresa: 'GHM SRL',
        pagador: 'GHM SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'ART',
        aseguradora: 'La Segunda ART',
        costo_mensual_ars: 500164,
        costo_mensual_usd: 0,
        vigencia_desde: '01/08/2023',
        vigencia_hasta: '31/12/2026',
        cobertura_corta: 'ART – Ley 24.557 (riesgos del trabajo)',
        items: [
            { item: '14 trabajadores', identificacion: 'CIIU 591110', suma_ars: 0, suma_usd: 0, es_prestacional: true }
        ]
    },
    {
        nro_poliza: '54001250',
        tomador: 'GHM Satelital SRL',
        empresa: 'GHM Satelital SRL',
        pagador: 'GHM Satelital SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'Vida Colectivo',
        aseguradora: 'La Segunda Personas',
        costo_mensual_ars: 23135.76,
        costo_mensual_usd: 0,
        vigencia_desde: '01/03/2026',
        vigencia_hasta: '01/03/2027',
        cobertura_corta: 'Vida Colectivo – Fallecimiento e Invalidez (Provincial San Juan)',
        items: [
            { item: '8 asegurados', identificacion: 'Provincial San Juan', suma_ars: 2400000, suma_usd: 0 }
        ]
    },
    {
        nro_poliza: '54001127',
        tomador: 'GHM Satelital SRL',
        empresa: 'GHM Satelital SRL',
        pagador: 'GHM Satelital SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'Vida Colectivo',
        aseguradora: 'La Segunda Personas',
        costo_mensual_ars: 18760,
        costo_mensual_usd: 0,
        vigencia_desde: '01/05/2026',
        vigencia_hasta: '01/03/2027',
        cobertura_corta: 'Vida Colectivo – Fallecimiento e Invalidez (Ley Contrato Trabajo)',
        items: [
            { item: '8 asegurados', identificacion: 'Ley 20.744', suma_ars: 25968503.98, suma_usd: 0 }
        ]
    },
    {
        nro_poliza: '55004187',
        tomador: 'GHM Satelital SRL',
        empresa: 'GHM Satelital SRL',
        pagador: 'GHM Satelital SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'Vida Colectivo',
        aseguradora: 'La Segunda Personas',
        costo_mensual_ars: 2984.34,
        costo_mensual_usd: 0,
        vigencia_desde: '01/03/2026',
        vigencia_hasta: '01/03/2027',
        cobertura_corta: 'Vida Colectivo – Fallecimiento (Decreto 1567/74)',
        items: [
            { item: '7 asegurados', identificacion: 'No Doméstico', suma_ars: 14499100, suma_usd: 0 }
        ]
    },
    {
        nro_poliza: '54001267',
        tomador: 'GHM SRL',
        empresa: 'GHM SRL',
        pagador: 'GHM SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'Vida Colectivo',
        aseguradora: 'La Segunda Personas',
        costo_mensual_ars: 3373,
        costo_mensual_usd: 0,
        vigencia_desde: '01/03/2026',
        vigencia_hasta: '01/03/2027',
        cobertura_corta: 'Vida Colectivo – Fallecimiento e Invalidez (Provincial San Juan)',
        items: [
            { item: '14 asegurados', identificacion: 'Provincial San Juan', suma_ars: 4200000, suma_usd: 0 }
        ]
    },
    {
        nro_poliza: '54001112',
        tomador: 'GHM SRL',
        empresa: 'GHM SRL',
        pagador: 'GHM SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'Vida Colectivo',
        aseguradora: 'La Segunda Personas',
        costo_mensual_ars: 63830,
        costo_mensual_usd: 0,
        vigencia_desde: '01/05/2026',
        vigencia_hasta: '01/03/2027',
        cobertura_corta: 'Vida Colectivo – Fallecimiento e Invalidez (Ley Contrato Trabajo)',
        items: [
            { item: '13 asegurados', identificacion: 'Ley 20.744', suma_ars: 87302247.98, suma_usd: 0 }
        ]
    },
    {
        nro_poliza: '55004186',
        tomador: 'GHM SRL',
        empresa: 'GHM SRL',
        pagador: 'GHM SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'Vida Colectivo',
        aseguradora: 'La Segunda Personas',
        costo_mensual_ars: 2984.34,
        costo_mensual_usd: 0,
        vigencia_desde: '01/03/2026',
        vigencia_hasta: '01/03/2027',
        cobertura_corta: 'Vida Colectivo – Fallecimiento (Decreto 1567/74)',
        items: [
            { item: '13 asegurados', identificacion: 'No Doméstico', suma_ars: 26926900, suma_usd: 0 }
        ]
    },
    {
        nro_poliza: '4089566',
        tomador: 'GHM Satelital SRL',
        empresa: 'GHM Satelital SRL',
        pagador: 'GHM Satelital SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'RC Comprensiva',
        aseguradora: 'Federación Patronal',
        costo_mensual_ars: 36034.08,
        costo_mensual_usd: 0,
        vigencia_desde: '26/03/2026',
        vigencia_hasta: '26/03/2027',
        cobertura_corta: 'RC Comprensiva – Instalación/mantenimiento sistemas de comunicación',
        items: []
    },
    {
        nro_poliza: '1239222',
        tomador: 'GHM Satelital SRL',
        empresa: 'GHM Satelital SRL',
        pagador: 'GHM Satelital SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'Caución',
        aseguradora: 'Aseguradores de Cauciones',
        costo_mensual_ars: 48553.8,
        costo_mensual_usd: 0,
        vigencia_desde: '15/05/2026',
        vigencia_hasta: '15/08/2026',
        cobertura_corta: 'Caución por Adjudicación – Garantía mantenimiento cámaras 4K',
        items: [
            { item: 'Servicio cámaras 4K', identificacion: 'Expte. 1100-000717-2025', suma_ars: 3165500, suma_usd: 0 }
        ]
    },
    {
        nro_poliza: '1234850',
        tomador: 'GHM SRL',
        empresa: 'GHM SRL',
        pagador: 'GHM SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'Caución',
        aseguradora: 'Aseguradores de Cauciones',
        costo_mensual_ars: 0,
        costo_mensual_usd: 203.04,
        vigencia_desde: '11/05/2026',
        vigencia_hasta: '11/08/2026',
        cobertura_corta: 'Caución por Anticipo – Stand Fiesta del Sol',
        items: [
            { item: 'Stand Fiesta del Sol', identificacion: 'Pedido 4501322401', suma_ars: 0, suma_usd: 27500 }
        ]
    },
    {
        nro_poliza: '1234845',
        tomador: 'GHM SRL',
        empresa: 'GHM SRL',
        pagador: 'GHM SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'Caución',
        aseguradora: 'Aseguradores de Cauciones',
        costo_mensual_ars: 0,
        costo_mensual_usd: 204.36,
        vigencia_desde: '11/05/2026',
        vigencia_hasta: '11/08/2026',
        cobertura_corta: 'Caución por Anticipo – Stand Fiesta del Sol',
        items: [
            { item: 'Stand Fiesta del Sol', identificacion: 'Pedido 4501322193', suma_ars: 0, suma_usd: 27694.35 }
        ]
    },
    {
        nro_poliza: '1233958',
        tomador: 'GHM Satelital SRL',
        empresa: 'GHM Satelital SRL',
        pagador: 'GHM Satelital SRL',
        proyecto_norm: 'estructura operativa',
        ramo: 'Caución',
        aseguradora: 'Aseguradores de Cauciones',
        costo_mensual_ars: 79019.4,
        costo_mensual_usd: 0,
        vigencia_desde: '22/10/2025',
        vigencia_hasta: '22/01/2026',
        cobertura_corta: 'Caución por Mantenimiento de Oferta – Garantía cámaras',
        items: [
            { item: 'Mantenimiento cámaras', identificacion: 'Licitación 04/2025', suma_ars: 711100, suma_usd: 0 }
        ]
    }
];

const polizasEvento = [
    { nro_poliza: '12-10363561', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', pagador: 'GHM', proyecto_norm: 'expo san juan minero 2026', ramo: 'Accidentes Personales', aseguradora: 'Federación Patronal', costo_mensual_ars: 16522.72, costo_mensual_usd: 0, vigencia_desde: '04/05/2026', vigencia_hasta: '10/05/2026', cobertura_corta: 'Accidentes Personales', items: [] },
    { nro_poliza: '12-10409355', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', pagador: 'GHM', proyecto_norm: 'expo san juan minero 2026', ramo: 'Accidentes Personales', aseguradora: 'Federación Patronal', costo_mensual_ars: 16522.72, costo_mensual_usd: 0, vigencia_desde: '06/05/2026', vigencia_hasta: '10/05/2026', cobertura_corta: 'Accidentes Personales', items: [] },
    { nro_poliza: '12-10412587', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', pagador: 'GHM', proyecto_norm: 'expo san juan minero 2026', ramo: 'Accidentes Personales', aseguradora: 'Federación Patronal', costo_mensual_ars: 9670.01, costo_mensual_usd: 0, vigencia_desde: '07/05/2026', vigencia_hasta: '10/05/2026', cobertura_corta: 'Accidentes Personales', items: [] },
    { nro_poliza: '12-10377893', tomador: 'GHM SRL', empresa: 'GHM SRL', pagador: 'GHM', proyecto_norm: 'expo san juan minero 2026', ramo: 'Accidentes Personales', aseguradora: 'Federación Patronal', costo_mensual_ars: 16522.72, costo_mensual_usd: 0, vigencia_desde: '04/05/2026', vigencia_hasta: '10/05/2026', cobertura_corta: 'Accidentes Personales', items: [] },
    { nro_poliza: '12-10405193', tomador: 'GHM Contenidos', empresa: 'GHM SRL', pagador: 'GHM', proyecto_norm: 'expo san juan minero 2026', ramo: 'Accidentes Personales', aseguradora: 'Federación Patronal', costo_mensual_ars: 40238.58, costo_mensual_usd: 0, vigencia_desde: '05/05/2026', vigencia_hasta: '09/05/2026', cobertura_corta: 'Accidentes Personales', items: [] },
    { nro_poliza: '40412649', tomador: 'GHM', empresa: 'GHM SRL', pagador: 'GHM', proyecto_norm: 'expo san juan minero 2026', ramo: 'Seguro Integral', aseguradora: 'La Segunda', costo_mensual_ars: 72400, costo_mensual_usd: 0, vigencia_desde: '28/04/2026', vigencia_hasta: '10/05/2026', cobertura_corta: 'Seguro Integral', items: [] },
    { nro_poliza: '40412631', tomador: 'GHM SATELITAL', empresa: 'GHM Satelital SRL', pagador: 'GHM', proyecto_norm: 'expo san juan minero 2026', ramo: 'Seguro Integral', aseguradora: 'La Segunda', costo_mensual_ars: 70029.41, costo_mensual_usd: 0, vigencia_desde: '28/04/2026', vigencia_hasta: '10/05/2026', cobertura_corta: 'Seguro Integral', items: [] },
    { nro_poliza: '40412647', tomador: 'henkel', empresa: 'GHM SRL', pagador: 'GHM', proyecto_norm: 'expo san juan minero 2026', ramo: 'Seguro Integral', aseguradora: 'La Segunda', costo_mensual_ars: 72400, costo_mensual_usd: 0, vigencia_desde: '28/04/2026', vigencia_hasta: '10/05/2026', cobertura_corta: 'Seguro Integral', items: [] },
    { nro_poliza: '40412611', tomador: 'weir vulco', empresa: 'GHM SRL', pagador: 'GHM', proyecto_norm: 'expo san juan minero 2026', ramo: 'Seguro Integral', aseguradora: 'La Segunda', costo_mensual_ars: 70000, costo_mensual_usd: 0, vigencia_desde: '28/04/2026', vigencia_hasta: '10/05/2026', cobertura_corta: 'Seguro Integral', items: [] }
];

const todasLasPolizas = [...polizasCorregidas, ...polizasEvento];

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

function initData() {
    polizasData = todasLasPolizas.map((p, idx) => {
        let sumaTotal = 0;
        if (p.items && p.items.length) {
            sumaTotal = p.items.reduce((acc, item) => acc + (item.suma_ars || 0) + (item.suma_usd || 0) * tipoCambioUSD, 0);
        }
        return {
            id_poliza: `POL-${idx+1}`,
            nro_poliza: p.nro_poliza,
            tomador: p.tomador,
            empresa: p.empresa,
            pagador: p.pagador,
            proyecto_norm: p.proyecto_norm,
            ramo: p.ramo,
            aseguradora: p.aseguradora,
            costo_mensual_ars: p.costo_mensual_ars,
            costo_mensual_usd: p.costo_mensual_usd,
            vigencia_desde: p.vigencia_desde,
            vigencia_hasta: p.vigencia_hasta,
            cobertura_corta: p.cobertura_corta,
            suma_asegurada_total: sumaTotal,
            cantidad_items: p.items ? p.items.length : 0
        };
    });
    
    itemsData = [];
    todasLasPolizas.forEach((p, idx) => {
        const idPoliza = `POL-${idx+1}`;
        if (p.items) {
            p.items.forEach(item => {
                itemsData.push({
                    id_poliza: idPoliza,
                    item: item.item,
                    identificacion: item.identificacion,
                    suma_asegurada_ars: item.suma_ars || 0,
                    suma_asegurada_usd: item.suma_usd || 0
                });
            });
        }
    });
}

function getPolizasFiltradas() {
    let base = currentTab === 'recurrente' ? polizasData.filter(esRecurrente) : polizasData.filter(esEvento);
    if (currentTab === 'recurrente') {
        base = base.filter(p => p.empresa === currentEmpresa);
    }
    if (currentRamoFiltro) {
        base = base.filter(p => p.ramo === currentRamoFiltro);
    }
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
    renderRamoCards(polizas);
    if (currentRamoFiltro) {
        renderPolizasDetail(polizas);
        document.getElementById('polizasDetailContainer').classList.remove('hidden');
    } else {
        document.getElementById('polizasDetailContainer').classList.add('hidden');
    }
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
}

let chartTypes = {
    gastoAseguradora: 'bar',
    gastoRamo: 'bar',
    patrimonioAseguradora: 'bar'
};

function updateCharts(polizas) {
    const gastoAseguradora = {};
    for (const p of polizas) {
        const costo = (p.costo_mensual_ars || 0) + (p.costo_mensual_usd || 0) * tipoCambioUSD;
        gastoAseguradora[p.aseguradora] = (gastoAseguradora[p.aseguradora] || 0) + costo;
    }
    renderChart('chartGastoAseguradora', 'gastoAseguradora', gastoAseguradora, 'Gasto mensual ARS');
    
    const gastoRamo = {};
    for (const p of polizas) {
        const costo = (p.costo_mensual_ars || 0) + (p.costo_mensual_usd || 0) * tipoCambioUSD;
        gastoRamo[p.ramo] = (gastoRamo[p.ramo] || 0) + costo;
    }
    renderChart('chartGastoRamo', 'gastoRamo', gastoRamo, 'Gasto mensual ARS');
    
    const sumaAseguradora = {};
    for (const p of polizas) {
        sumaAseguradora[p.aseguradora] = (sumaAseguradora[p.aseguradora] || 0) + (p.suma_asegurada_total || 0);
    }
    renderChart('chartPatrimonioAseguradora', 'patrimonioAseguradora', sumaAseguradora, 'Suma asegurada ARS');
}

function renderChart(canvasId, chartKey, dataObj, label) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const labels = Object.keys(dataObj);
    const values = Object.values(dataObj);
    if (charts[chartKey]) charts[chartKey].destroy();
    
    if (chartTypes[chartKey] === 'pie') {
        charts[chartKey] = new Chart(ctx, {
            type: 'pie',
            data: { labels: labels, datasets: [{ data: values, backgroundColor: ['#a5f3fc', '#bbf7d0', '#fed7aa', '#fbcfe8', '#c7d2fe', '#fecaca', '#d9f99d'] }] },
            options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (tooltipItem) => `${tooltipItem.label}: ${abreviaturaNumero(tooltipItem.raw)}` } } } }
        });
    } else {
        charts[chartKey] = new Chart(ctx, {
            type: 'bar',
            data: { labels: labels, datasets: [{ label: label, data: values, backgroundColor: '#a5f3fc', borderRadius: 8 }] },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true, onClick: (e, activeEls) => { if (activeEls.length) { const ramo = labels[activeEls[0].index]; currentRamoFiltro = ramo; renderCurrentTab(); document.getElementById('polizasDetailContainer').scrollIntoView({ behavior: 'smooth' }); } } }
        });
    }
}

function renderRamoCards(polizas) {
    const ramosMap = new Map();
    for (const poliza of polizas) {
        if (!ramosMap.has(poliza.ramo)) ramosMap.set(poliza.ramo, []);
        ramosMap.get(poliza.ramo).push(poliza);
    }
    const ramosArray = [];
    for (const [ramo, pols] of ramosMap.entries()) {
        let gastoARS = 0, gastoUSD = 0, sumaAsegurada = 0;
        const allItems = [];
        for (const p of pols) {
            gastoARS += p.costo_mensual_ars || 0;
            gastoUSD += (p.costo_mensual_usd || 0) * tipoCambioUSD;
            sumaAsegurada += p.suma_asegurada_total || 0;
            const itemsPol = itemsData.filter(i => i.id_poliza === p.id_poliza);
            allItems.push(...itemsPol.map(i => i.item));
        }
        const uniqueItems = [...new Set(allItems)];
        const resumenBienes = uniqueItems.slice(0, 3).join(', ') + (uniqueItems.length > 3 ? ` +${uniqueItems.length-3} más` : (uniqueItems.length === 0 ? 'Sin bienes individuales' : ''));
        ramosArray.push({ ramo, polizas: pols, gastoARS, gastoUSD, sumaAsegurada, cantidadPolizas: pols.length, resumenBienes });
    }
    ramosArray.sort((a,b) => (b.gastoARS+b.gastoUSD) - (a.gastoARS+a.gastoUSD));
    
    const container = document.getElementById('ramoCardsContainer');
    container.innerHTML = '';
    const searchTerm = document.getElementById('searchRamo')?.value.toLowerCase() || '';
    for (const rd of ramosArray) {
        if (searchTerm && !rd.ramo.toLowerCase().includes(searchTerm)) continue;
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl p-3 border border-[#e2e8f0] shadow-sm cursor-pointer hover:shadow-md transition';
        card.setAttribute('data-ramo', rd.ramo);
        card.addEventListener('click', () => {
            currentRamoFiltro = rd.ramo;
            currentPolizaSearch = '';
            document.getElementById('searchPoliza').value = '';
            renderCurrentTab();
            document.getElementById('polizasDetailContainer').scrollIntoView({ behavior: 'smooth' });
        });
        const icon = getIconForRamo(rd.ramo);
        card.innerHTML = `
            <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-1">
                    <i class="${icon} text-sm text-[#38bdf8]"></i>
                    <span class="font-semibold text-sm">${rd.ramo}</span>
                </div>
                <span class="text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">${rd.cantidadPolizas} pólizas</span>
            </div>
            <div class="text-xs text-gray-600 mb-1">
                Gasto: ${rd.gastoARS > 0 ? 'ARS '+rd.gastoARS.toLocaleString() : ''}${rd.gastoARS > 0 && rd.gastoUSD > 0 ? ' + ' : ''}${rd.gastoUSD > 0 ? 'USD '+(rd.gastoUSD/tipoCambioUSD).toLocaleString() : ''}
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

function renderPolizasDetail(polizasFiltradas) {
    const container = document.getElementById('polizasListContainer');
    container.innerHTML = '';
    document.getElementById('ramoSeleccionadoTitulo').innerText = currentRamoFiltro || 'Todas';
    for (const poliza of polizasFiltradas) {
        const items = itemsData.filter(i => i.id_poliza === poliza.id_poliza);
        const displayNumber = poliza.nro_poliza || poliza.id_poliza;
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden';
        const header = document.createElement('div');
        header.className = 'p-3 flex flex-wrap justify-between items-center cursor-pointer hover:bg-gray-50 transition';
        header.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="fas fa-chevron-right text-gray-400 expand-icon-politica"></i>
                <div>
                    <div class="font-mono text-sm font-bold text-[#1e293b]">${displayNumber}</div>
                    <div class="text-xs text-gray-500">${poliza.aseguradora}</div>
                </div>
            </div>
            <div class="flex flex-wrap gap-3 text-xs">
                <div><span class="text-gray-500">Cobertura:</span> <span class="font-medium">${poliza.cobertura_corta || 'No especificada'}</span></div>
                <div><span class="text-gray-500"><i class="fas fa-dollar-sign text-xs"></i> ARS:</span> ${poliza.costo_mensual_ars ? poliza.costo_mensual_ars.toLocaleString() : '0'}</div>
                ${poliza.costo_mensual_usd ? `<div><span class="text-gray-500"><i class="fas fa-dollar-sign text-xs"></i> USD:</span> ${poliza.costo_mensual_usd.toLocaleString()}</div>` : ''}
                <div><span class="text-gray-500"># Bienes:</span> ${poliza.cantidad_items}</div>
            </div>
        `;
        const body = document.createElement('div');
        body.className = 'hidden border-t border-[#e2e8f0] p-3 bg-gray-50';
        if (items.length === 0) {
            body.innerHTML = '<p class="text-gray-500 text-sm">No hay bienes registrados.</p>';
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
    let polizasAEportar = getPolizasFiltradas();
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
    link.setAttribute('download', `items_mcv_${currentTab}_${currentEmpresa}_${new Date().toISOString().slice(0,19)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    initData();
    renderCurrentTab();
    document.getElementById('lastUpdate').innerHTML = new Date().toLocaleTimeString() + ' - USD $' + tipoCambioUSD;
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('active', 'border-b-2', 'border-[#38bdf8]', 'text-[#1e293b]');
                b.classList.add('bg-gray-50', 'text-gray-600');
            });
            btn.classList.add('active', 'border-b-2', 'border-[#38bdf8]', 'text-[#1e293b]', 'bg-white');
            btn.classList.remove('bg-gray-50', 'text-gray-600');
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
            document.querySelectorAll('.empresa-btn').forEach(b => b.classList.remove('active', 'bg-[#bbf7d0]', 'bg-[#fef9c3]'));
            btn.classList.add('active');
            if (btn.getAttribute('data-empresa') === 'GHM SRL') {
                btn.classList.add('bg-[#bbf7d0]');
                currentEmpresa = 'GHM SRL';
            } else {
                btn.classList.add('bg-[#fef9c3]');
                currentEmpresa = 'GHM Satelital SRL';
            }
            currentRamoFiltro = null;
            currentPolizaSearch = '';
            document.getElementById('searchPoliza').value = '';
            renderCurrentTab();
        });
    });
    
    document.getElementById('searchRamo')?.addEventListener('input', () => {
        const polizas = getPolizasFiltradas();
        renderRamoCards(polizas);
    });
    document.getElementById('searchPoliza')?.addEventListener('input', (e) => {
        currentPolizaSearch = e.target.value;
        renderCurrentTab();
    });
    document.getElementById('limpiarFiltroBtn')?.addEventListener('click', () => {
        currentRamoFiltro = null;
        currentPolizaSearch = '';
        document.getElementById('searchPoliza').value = '';
        renderCurrentTab();
    });
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
        initData();
        renderCurrentTab();
        document.getElementById('lastUpdate').innerHTML = new Date().toLocaleTimeString() + ' - USD $' + tipoCambioUSD;
    });
    document.getElementById('exportCSVBtn')?.addEventListener('click', exportToCSV);
    document.getElementById('exportPDFBtn')?.addEventListener('click', exportToPDF);
    
    document.querySelectorAll('.toggleChartBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const chartKey = btn.getAttribute('data-chart');
            if (chartTypes[chartKey] === 'bar') chartTypes[chartKey] = 'pie';
            else chartTypes[chartKey] = 'bar';
            const polizas = getPolizasFiltradas();
            updateCharts(polizas);
        });
    });
});
