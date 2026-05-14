// app.js - MCV Seguros Dashboard - Versión final con tarjetas gerenciales
let polizasData = [];
let itemsData = [];
let charts = {};
let currentTab = 'recurrente';
let currentEmpresa = 'Ambas';
let currentRamoFiltro = null;
let currentPolizaSearch = '';

const savedEmpresa = localStorage.getItem('mcv_empresa');
if (savedEmpresa && ['GHM SRL', 'GHM Satelital SRL', 'Ambas'].includes(savedEmpresa)) currentEmpresa = savedEmpresa;

// ======================== DATOS EMBEBIDOS (RECURRENTES + EVENTOS) ========================
const datosPolizas = [
    // RECURRENTES
    { id_poliza: 'POL-001', nro_poliza: '68.280.884', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Automotor', aseguradora: 'La Segunda', costo_mensual_ars: 428549, costo_mensual_usd: 0, cobertura_corta: 'Privilegio L2 (completo)', suma_asegurada_total: 159676000, cantidad_items: 2, vigencia_desde: '27/04/2026', vigencia_hasta: '27/07/2026', proyecto_norm: 'estructura operativa', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'POL-002', nro_poliza: '58.881.286', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Automotor', aseguradora: 'La Segunda', costo_mensual_ars: 201561.17, costo_mensual_usd: 0, cobertura_corta: 'Privilegio L2 (completo)', suma_asegurada_total: 45000000, cantidad_items: 1, vigencia_desde: '05/04/2026', vigencia_hasta: '05/07/2026', proyecto_norm: 'estructura operativa', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'POL-003', nro_poliza: '58.845.801', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Automotor', aseguradora: 'La Segunda', costo_mensual_ars: 184357, costo_mensual_usd: 0, cobertura_corta: 'Privilegio L2 para Nissan / Arranque L2 para Trailer', suma_asegurada_total: 45000000, cantidad_items: 2, vigencia_desde: '26/02/2026', vigencia_hasta: '26/05/2026', proyecto_norm: 'estructura operativa', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'POL-004', nro_poliza: '58.881.287', tomador: 'GHM SRL', empresa: 'GHM SRL', ramo: 'Automotor', aseguradora: 'La Segunda', costo_mensual_ars: 698123, costo_mensual_usd: 0, cobertura_corta: 'Privilegio L2 para autos / Arranque L2 para trailer', suma_asegurada_total: 120800000, cantidad_items: 4, vigencia_desde: '05/04/2026', vigencia_hasta: '05/07/2026', proyecto_norm: 'estructura operativa', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'POL-005', nro_poliza: '58.844.225', tomador: 'GHM SRL', empresa: 'GHM SRL', ramo: 'Automotor', aseguradora: 'La Segunda', costo_mensual_ars: 15905, costo_mensual_usd: 0, cobertura_corta: 'Arranque L2 (solo RC)', suma_asegurada_total: 0, cantidad_items: 1, vigencia_desde: '14/02/2026', vigencia_hasta: '14/05/2026', proyecto_norm: 'estructura operativa', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'POL-006', nro_poliza: '67.844.592', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Automotor', aseguradora: 'La Segunda', costo_mensual_ars: 15336, costo_mensual_usd: 0, cobertura_corta: 'Arranque L2 (solo RC)', suma_asegurada_total: 0, cantidad_items: 1, vigencia_desde: '17/02/2026', vigencia_hasta: '17/05/2026', proyecto_norm: 'estructura operativa', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'POL-007', nro_poliza: '58.844.224', tomador: 'GHM SRL', empresa: 'GHM SRL', ramo: 'Automotor', aseguradora: 'La Segunda', costo_mensual_ars: 15905, costo_mensual_usd: 0, cobertura_corta: 'Arranque L2 (solo RC)', suma_asegurada_total: 0, cantidad_items: 1, vigencia_desde: '14/02/2026', vigencia_hasta: '14/05/2026', proyecto_norm: 'estructura operativa', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'POL-008', nro_poliza: '41.789.769', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Cuatriciclo', aseguradora: 'La Segunda', costo_mensual_ars: 33358, costo_mensual_usd: 0, cobertura_corta: 'Plan Nro. 25 – solo siniestros totales', suma_asegurada_total: 13807159, cantidad_items: 1, vigencia_desde: '05/03/2026', vigencia_hasta: '05/06/2026', proyecto_norm: 'estructura operativa', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'POL-009', nro_poliza: '45.598.579', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Moto', aseguradora: 'La Segunda', costo_mensual_ars: 57241, costo_mensual_usd: 0, cobertura_corta: 'Selecto L2 (completo)', suma_asegurada_total: 11246000, cantidad_items: 1, vigencia_desde: '28/02/2026', vigencia_hasta: '31/05/2026', proyecto_norm: 'estructura operativa', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'POL-010', nro_poliza: '40.156.645', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Seguro Técnico', aseguradora: 'La Segunda', costo_mensual_ars: 12609, costo_mensual_usd: 0, cobertura_corta: 'Seguro Técnico – Equipo de contratista', suma_asegurada_total: 9994328, cantidad_items: 2, vigencia_desde: '18/02/2026', vigencia_hasta: '18/08/2026', proyecto_norm: 'estructura operativa', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'POL-011', nro_poliza: '40.194.044', tomador: 'GHM SRL', empresa: 'GHM SRL', ramo: 'Robo', aseguradora: 'La Segunda', costo_mensual_ars: 18008, costo_mensual_usd: 0, cobertura_corta: 'Robo exclusivo (excluye hurto)', suma_asegurada_total: 1500000, cantidad_items: 1, vigencia_desde: '10/01/2026', vigencia_hasta: '10/07/2026', proyecto_norm: 'estructura operativa', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'POL-012', nro_poliza: '352.086', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'ART', aseguradora: 'La Segunda ART', costo_mensual_ars: 439468, costo_mensual_usd: 0, cobertura_corta: 'ART – Ley 24.557 (riesgos del trabajo)', suma_asegurada_total: 0, cantidad_items: 1, vigencia_desde: '01/09/2023', vigencia_hasta: '31/12/2026', proyecto_norm: 'estructura operativa', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'POL-013', nro_poliza: '350.751', tomador: 'GHM SRL', empresa: 'GHM SRL', ramo: 'ART', aseguradora: 'La Segunda ART', costo_mensual_ars: 500164, costo_mensual_usd: 0, cobertura_corta: 'ART – Ley 24.557 (riesgos del trabajo)', suma_asegurada_total: 0, cantidad_items: 1, vigencia_desde: '01/08/2023', vigencia_hasta: '31/12/2026', proyecto_norm: 'estructura operativa', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'POL-014', nro_poliza: '54.001.250', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Vida Colectivo', aseguradora: 'La Segunda Personas', costo_mensual_ars: 23135.76, costo_mensual_usd: 0, cobertura_corta: 'Vida Colectivo – Fallecimiento e invalidez (Provincial San Juan)', suma_asegurada_total: 2400000, cantidad_items: 1, vigencia_desde: '01/03/2026', vigencia_hasta: '01/03/2027', proyecto_norm: 'estructura operativa', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'POL-015', nro_poliza: '54.001.127', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Vida Colectivo', aseguradora: 'La Segunda Personas', costo_mensual_ars: 18760, costo_mensual_usd: 0, cobertura_corta: 'Vida Colectivo – Fallecimiento e invalidez (Ley Contrato Trabajo)', suma_asegurada_total: 25968503.98, cantidad_items: 1, vigencia_desde: '01/05/2026', vigencia_hasta: '01/03/2027', proyecto_norm: 'estructura operativa', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'POL-016', nro_poliza: '55.004.187', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Vida Colectivo', aseguradora: 'La Segunda Personas', costo_mensual_ars: 2984.34, costo_mensual_usd: 0, cobertura_corta: 'Vida Colectivo – Fallecimiento (Decreto 1567/74)', suma_asegurada_total: 14499100, cantidad_items: 1, vigencia_desde: '01/03/2026', vigencia_hasta: '01/03/2027', proyecto_norm: 'estructura operativa', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'POL-017', nro_poliza: '54.001.267', tomador: 'GHM SRL', empresa: 'GHM SRL', ramo: 'Vida Colectivo', aseguradora: 'La Segunda Personas', costo_mensual_ars: 3373, costo_mensual_usd: 0, cobertura_corta: 'Vida Colectivo – Fallecimiento e invalidez (Provincial San Juan)', suma_asegurada_total: 4200000, cantidad_items: 1, vigencia_desde: '01/03/2026', vigencia_hasta: '01/03/2027', proyecto_norm: 'estructura operativa', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'POL-018', nro_poliza: '54.001.112', tomador: 'GHM SRL', empresa: 'GHM SRL', ramo: 'Vida Colectivo', aseguradora: 'La Segunda Personas', costo_mensual_ars: 63830, costo_mensual_usd: 0, cobertura_corta: 'Vida Colectivo – Fallecimiento e invalidez (Ley Contrato Trabajo)', suma_asegurada_total: 87302247.98, cantidad_items: 1, vigencia_desde: '01/05/2026', vigencia_hasta: '01/03/2027', proyecto_norm: 'estructura operativa', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'POL-019', nro_poliza: '55.004.186', tomador: 'GHM SRL', empresa: 'GHM SRL', ramo: 'Vida Colectivo', aseguradora: 'La Segunda Personas', costo_mensual_ars: 2984.34, costo_mensual_usd: 0, cobertura_corta: 'Vida Colectivo – Fallecimiento (Decreto 1567/74)', suma_asegurada_total: 26926900, cantidad_items: 1, vigencia_desde: '01/03/2026', vigencia_hasta: '01/03/2027', proyecto_norm: 'estructura operativa', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'POL-020', nro_poliza: '4.089.566', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'RC Comprensiva', aseguradora: 'Federación Patronal', costo_mensual_ars: 36034.08, costo_mensual_usd: 0, cobertura_corta: 'RC Comprensiva – Instalación/mantenimiento sistemas de comunicación', suma_asegurada_total: 68000000, cantidad_items: 0, vigencia_desde: '26/03/2026', vigencia_hasta: '26/03/2027', proyecto_norm: 'estructura operativa', esCaucion: false, costo_total_vigencia: null },
    // CAUCIONES (recurrentes)
    { id_poliza: 'POL-021', nro_poliza: '1.239.222', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Caución', aseguradora: 'Aseguradores de Cauciones', costo_mensual_ars: 0, costo_mensual_usd: 0, cobertura_corta: 'Caución por Adjudicación – Garantía mantenimiento cámaras 4K', suma_asegurada_total: 3165500, cantidad_items: 1, vigencia_desde: '15/05/2026', vigencia_hasta: '15/08/2026', proyecto_norm: 'estructura operativa', esCaucion: true, costo_total_vigencia: 48553.8, moneda_total: 'ARS' },
    { id_poliza: 'POL-022', nro_poliza: '1.234.850', tomador: 'GHM SRL', empresa: 'GHM SRL', ramo: 'Caución', aseguradora: 'Aseguradores de Cauciones', costo_mensual_ars: 0, costo_mensual_usd: 0, cobertura_corta: 'Caución por Anticipo – Stand Fiesta del Sol', suma_asegurada_total: 27500, cantidad_items: 1, vigencia_desde: '11/05/2026', vigencia_hasta: '11/08/2026', proyecto_norm: 'estructura operativa', esCaucion: true, costo_total_vigencia: 203.04, moneda_total: 'USD' },
    { id_poliza: 'POL-023', nro_poliza: '1.234.845', tomador: 'GHM SRL', empresa: 'GHM SRL', ramo: 'Caución', aseguradora: 'Aseguradores de Cauciones', costo_mensual_ars: 0, costo_mensual_usd: 0, cobertura_corta: 'Caución por Anticipo – Stand Fiesta del Sol', suma_asegurada_total: 27694.35, cantidad_items: 1, vigencia_desde: '11/05/2026', vigencia_hasta: '11/08/2026', proyecto_norm: 'estructura operativa', esCaucion: true, costo_total_vigencia: 204.36, moneda_total: 'USD' },
    { id_poliza: 'POL-024', nro_poliza: '1.233.958', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Caución', aseguradora: 'Aseguradores de Cauciones', costo_mensual_ars: 0, costo_mensual_usd: 0, cobertura_corta: 'Caución por Mantenimiento de Oferta – Garantía cámaras', suma_asegurada_total: 711100, cantidad_items: 1, vigencia_desde: '22/10/2025', vigencia_hasta: '22/01/2026', proyecto_norm: 'estructura operativa', esCaucion: true, costo_total_vigencia: 79019.4, moneda_total: 'ARS' },
    // EVENTOS PUNTUALES (Expo San Juan Minero 2026)
    { id_poliza: 'EV-001', nro_poliza: '12-10363561', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Accidentes Personales', aseguradora: 'Federación Patronal', costo_mensual_ars: 16522.72, costo_mensual_usd: 0, cobertura_corta: 'Accidentes Personales (muerte, invalidez, asistencia)', suma_asegurada_total: 40000000, cantidad_items: 0, vigencia_desde: '04/05/2026', vigencia_hasta: '10/05/2026', proyecto_norm: 'expo san juan minero 2026', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'EV-002', nro_poliza: '12-10409355', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Accidentes Personales', aseguradora: 'Federación Patronal', costo_mensual_ars: 16522.72, costo_mensual_usd: 0, cobertura_corta: 'Accidentes Personales', suma_asegurada_total: 40000000, cantidad_items: 0, vigencia_desde: '06/05/2026', vigencia_hasta: '10/05/2026', proyecto_norm: 'expo san juan minero 2026', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'EV-003', nro_poliza: '12-10412587', tomador: 'GHM Satelital SRL', empresa: 'GHM Satelital SRL', ramo: 'Accidentes Personales', aseguradora: 'Federación Patronal', costo_mensual_ars: 9670.01, costo_mensual_usd: 0, cobertura_corta: 'Accidentes Personales', suma_asegurada_total: 29593600, cantidad_items: 0, vigencia_desde: '07/05/2026', vigencia_hasta: '10/05/2026', proyecto_norm: 'expo san juan minero 2026', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'EV-004', nro_poliza: '12-10377893', tomador: 'GHM SRL', empresa: 'GHM SRL', ramo: 'Accidentes Personales', aseguradora: 'Federación Patronal', costo_mensual_ars: 16522.72, costo_mensual_usd: 0, cobertura_corta: 'Accidentes Personales', suma_asegurada_total: 40000000, cantidad_items: 0, vigencia_desde: '04/05/2026', vigencia_hasta: '10/05/2026', proyecto_norm: 'expo san juan minero 2026', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'EV-005', nro_poliza: '12-10405193', tomador: 'GHM Contenidos', empresa: 'GHM SRL', ramo: 'Accidentes Personales', aseguradora: 'Federación Patronal', costo_mensual_ars: 40238.58, costo_mensual_usd: 0, cobertura_corta: 'Accidentes Personales', suma_asegurada_total: 54400000, cantidad_items: 0, vigencia_desde: '05/05/2026', vigencia_hasta: '09/05/2026', proyecto_norm: 'expo san juan minero 2026', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'EV-006', nro_poliza: '40412649', tomador: 'GHM', empresa: 'GHM SRL', ramo: 'Seguro Integral', aseguradora: 'La Segunda', costo_mensual_ars: 72400, costo_mensual_usd: 0, cobertura_corta: 'Seguro Integral (RC y daños)', suma_asegurada_total: 68000000, cantidad_items: 0, vigencia_desde: '28/04/2026', vigencia_hasta: '10/05/2026', proyecto_norm: 'expo san juan minero 2026', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'EV-007', nro_poliza: '40412631', tomador: 'GHM SATELITAL', empresa: 'GHM Satelital SRL', ramo: 'Seguro Integral', aseguradora: 'La Segunda', costo_mensual_ars: 70029.41, costo_mensual_usd: 0, cobertura_corta: 'Seguro Integral', suma_asegurada_total: 68000000, cantidad_items: 0, vigencia_desde: '28/04/2026', vigencia_hasta: '10/05/2026', proyecto_norm: 'expo san juan minero 2026', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'EV-008', nro_poliza: '40412647', tomador: 'henkel', empresa: 'GHM SRL', ramo: 'Seguro Integral', aseguradora: 'La Segunda', costo_mensual_ars: 72400, costo_mensual_usd: 0, cobertura_corta: 'Seguro Integral', suma_asegurada_total: 68000000, cantidad_items: 0, vigencia_desde: '28/04/2026', vigencia_hasta: '10/05/2026', proyecto_norm: 'expo san juan minero 2026', esCaucion: false, costo_total_vigencia: null },
    { id_poliza: 'EV-009', nro_poliza: '40412611', tomador: 'weir vulco', empresa: 'GHM SRL', ramo: 'Seguro Integral', aseguradora: 'La Segunda', costo_mensual_ars: 70000, costo_mensual_usd: 0, cobertura_corta: 'Seguro Integral', suma_asegurada_total: 68000000, cantidad_items: 0, vigencia_desde: '28/04/2026', vigencia_hasta: '10/05/2026', proyecto_norm: 'expo san juan minero 2026', esCaucion: false, costo_total_vigencia: null }
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
    if (currentTab === 'recurrente') {
        if (currentEmpresa === 'GHM SRL') base = base.filter(p => p.empresa === 'GHM SRL');
        else if (currentEmpresa === 'GHM Satelital SRL') base = base.filter(p => p.empresa === 'GHM Satelital SRL');
    }
    if (currentRamoFiltro) base = base.filter(p => p.ramo === currentRamoFiltro);
    if (currentPolizaSearch) {
        const s = currentPolizaSearch.toLowerCase();
        base = base.filter(p => p.nro_poliza.toLowerCase().includes(s) || p.tomador.toLowerCase().includes(s) || p.ramo.toLowerCase().includes(s) || p.cobertura_corta.toLowerCase().includes(s) || itemsData.some(i => i.id_poliza === p.id_poliza && (i.item.toLowerCase().includes(s) || i.identificacion.toLowerCase().includes(s))));
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
    // Gasto mensual (excluye cauciones)
    const polizasMensuales = polizas.filter(p => !esCaucion(p));
    let gastoARS = 0, gastoUSD = 0;
    for (const p of polizasMensuales) {
        gastoARS += p.costo_mensual_ars || 0;
        gastoUSD += p.costo_mensual_usd || 0;
    }
    document.getElementById('kpiGastoMensual').innerHTML = abreviaturaNumero(gastoARS + gastoUSD);
    document.getElementById('kpiGastoDetalle').innerHTML = `ARS ${gastoARS.toLocaleString()} / USD ${gastoUSD.toLocaleString()}`;
    
    // Suma asegurada total
    let sumaAsegurada = 0;
    for (const p of polizas) sumaAsegurada += p.suma_asegurada_total || 0;
    document.getElementById('kpiSumaAsegurada').innerHTML = abreviaturaNumero(sumaAsegurada);
    
    // Pólizas activas
    document.getElementById('kpiPolizasActivas').innerHTML = polizas.length;
    document.getElementById('polizasCount').innerHTML = polizas.length;
    
    // Aseguradoras
    const aseguradorasSet = new Set(polizas.map(p => p.aseguradora));
    document.getElementById('kpiAseguradoras').innerHTML = aseguradorasSet.size;
    
    // Cauciones
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

function renderFiltrosRapidos(polizas) {
    const ramos = [...new Set(polizas.map(p => p.ramo))].sort();
    const container = document.getElementById('filtrosRapidos');
    if (!container) return;
    container.innerHTML = '';
    ramos.forEach(ramo => {
        const btn = document.createElement('button');
        btn.className = `text-xs px-3 py-1 rounded-full border ${currentRamoFiltro === ramo ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`;
        btn.textContent = ramo;
        btn.onclick = () => {
            currentRamoFiltro = (currentRamoFiltro === ramo) ? null : ramo;
            renderCurrentTab();
        };
        container.appendChild(btn);
    });
    if (currentRamoFiltro) {
        const clear = document.createElement('button');
        clear.className = 'text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600';
        clear.textContent = '✖ Limpiar filtro';
        clear.onclick = () => { currentRamoFiltro = null; renderCurrentTab(); };
        container.appendChild(clear);
    }
}

function getBadgeColor(aseguradora) {
    if (aseguradora.includes('La Segunda')) return 'indigo';
    if (aseguradora.includes('Federación')) return 'amber';
    if (aseguradora.includes('Aseguradores')) return 'sky';
    return 'slate';
}

function renderPolizasCards(polizas) {
    const container = document.getElementById('polizasListContainer');
    if (!container) return;
    container.innerHTML = '';
    if (polizas.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-slate-500">No hay pólizas que coincidan con los filtros.</div>';
        return;
    }
    for (const poliza of polizas) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl shadow-[0_4px_20px_-6px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden hover:shadow-lg transition-all duration-300';
        
        const header = document.createElement('div');
        header.className = 'p-5 pb-3 border-b border-slate-100';
        header.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <div class="text-indigo-600 text-sm font-semibold uppercase tracking-wide mb-1">${poliza.ramo}</div>
                    <div class="text-xl sm:text-2xl font-bold text-slate-800 leading-tight">${poliza.cobertura_corta || 'Cobertura específica'}</div>
                    <div class="flex items-center gap-2 mt-2">
                        <span class="bg-${getBadgeColor(poliza.aseguradora)}-100 text-${getBadgeColor(poliza.aseguradora)}-700 text-xs px-2 py-0.5 rounded-full font-medium">${poliza.aseguradora}</span>
                        <span class="text-xs text-slate-400">Póliza N° ${poliza.nro_poliza}</span>
                    </div>
                </div>
                <button class="accion-rapida text-slate-400 hover:text-indigo-600 transition" title="Más acciones" data-id="${poliza.id_poliza}"><i class="fas fa-ellipsis-v"></i></button>
            </div>
        `;
        
        const financial = document.createElement('div');
        financial.className = 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-5 bg-slate-50/50';
        let costoStr = '';
        if (esCaucion(poliza)) {
            costoStr = `${abreviaturaNumero(poliza.costo_total_vigencia)} ${poliza.moneda_total} (total vigencia)`;
        } else {
            let partes = [];
            if (poliza.costo_mensual_ars) partes.push(`${abreviaturaNumero(poliza.costo_mensual_ars)} ARS/mes`);
            if (poliza.costo_mensual_usd) partes.push(`${abreviaturaNumero(poliza.costo_mensual_usd)} USD/mes`);
            costoStr = partes.join(' + ') || '$0';
        }
        financial.innerHTML = `
            <div>
                <div class="text-xs text-slate-400 uppercase tracking-wider mb-1">Patrimonio resguardado</div>
                <div class="text-2xl font-black text-slate-800">${abreviaturaNumero(poliza.suma_asegurada_total)}</div>
            </div>
            <div class="text-right">
                <div class="text-xs text-slate-400 uppercase tracking-wider mb-1">Inversión en riesgo</div>
                <div class="text-lg font-bold text-slate-800">${costoStr}</div>
                <div class="text-xs text-slate-500 mt-1">Vigencia: ${poliza.vigencia_desde} al ${poliza.vigencia_hasta}</div>
            </div>
        `;
        
        const actions = document.createElement('div');
        actions.className = 'flex justify-between items-center p-4 bg-white border-t border-slate-100';
        actions.innerHTML = `
            <div class="flex gap-3">
                <button class="ver-bienes-btn text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1" data-id="${poliza.id_poliza}"><i class="fas fa-box-open"></i> Ver bienes (${poliza.cantidad_items})</button>
                <button class="solicitar-certificado text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1" data-id="${poliza.id_poliza}" data-poliza="${poliza.nro_poliza}"><i class="fas fa-file-pdf"></i> Certificado</button>
            </div>
            <button class="denunciar-siniestro text-red-500 hover:text-red-700 text-sm flex items-center gap-1" data-id="${poliza.id_poliza}" data-poliza="${poliza.nro_poliza}"><i class="fas fa-exclamation-triangle"></i> Denunciar</button>
        `;
        
        card.appendChild(header);
        card.appendChild(financial);
        card.appendChild(actions);
        container.appendChild(card);
    }
    
    // Eventos
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
                    html += `<tr class="border-b"><td class="py-2 px-3">${item.item}</td><td class="py-2 px-3">${item.identificacion}</td><td class="py-2 px-3 text-right">${item.suma_asegurada_ars ? '$'+item.suma_asegurada_ars.toLocaleString() : '$0'}</td><td class="py-2 px-3 text-right">${item.suma_asegurada_usd ? '$'+item.suma_asegurada_usd.toLocaleString() : '-'}</td></tr>`;
                }
                html += `</tbody></table></div>`;
                modalContent.innerHTML = html;
            }
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        });
    });
    
    document.querySelectorAll('.solicitar-certificado').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const polizaNum = btn.getAttribute('data-poliza');
            alert(`Funcionalidad en desarrollo: solicitar certificado de cobertura para la póliza ${polizaNum}.`);
        });
    });
    
    document.querySelectorAll('.denunciar-siniestro').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const polizaNum = btn.getAttribute('data-poliza');
            alert(`Funcionalidad en desarrollo: denunciar siniestro para la póliza ${polizaNum}.`);
        });
    });
}

function exportToCSV() {
    let polizas = getPolizasFiltradas();
    const itemsToExport = [];
    for (const p of polizas) {
        for (const item of itemsData.filter(i => i.id_poliza === p.id_poliza)) {
            itemsToExport.push({
                'Ítem Asegurado': item.item,
                'Identificación': item.identificacion,
                'Empresa (Tomador)': p.tomador,
                'Aseguradora': p.aseguradora,
                'Ramo': p.ramo,
                'Vigencia Desde': p.vigencia_desde,
                'Vigencia Hasta': p.vigencia_hasta,
                'Suma Asegurada ARS': item.suma_asegurada_ars,
                'Costo (ARS/mes o total caución)': esCaucion(p) ? (p.moneda_total === 'ARS' ? p.costo_total_vigencia : 0) : p.costo_mensual_ars,
                'Costo (USD/mes o total caución)': esCaucion(p) ? (p.moneda_total === 'USD' ? p.costo_total_vigencia : 0) : p.costo_mensual_usd
            });
        }
    }
    const headers = Object.keys(itemsToExport[0] || {});
    const rows = itemsToExport.map(i => headers.map(h => i[h]));
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `items_${currentTab}_${currentEmpresa}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

function exportToExcel() {
    let polizas = getPolizasFiltradas();
    const itemsToExport = [];
    for (const p of polizas) {
        for (const item of itemsData.filter(i => i.id_poliza === p.id_poliza)) {
            itemsToExport.push({
                'Ítem Asegurado': item.item,
                'Identificación': item.identificacion,
                'Empresa (Tomador)': p.tomador,
                'Aseguradora': p.aseguradora,
                'Ramo': p.ramo,
                'Vigencia Desde': p.vigencia_desde,
                'Vigencia Hasta': p.vigencia_hasta,
                'Suma Asegurada ARS': item.suma_asegurada_ars,
                'Costo ARS (mensual o total caución)': esCaucion(p) ? (p.moneda_total === 'ARS' ? p.costo_total_vigencia : 0) : p.costo_mensual_ars,
                'Costo USD (mensual o total caución)': esCaucion(p) ? (p.moneda_total === 'USD' ? p.costo_total_vigencia : 0) : p.costo_mensual_usd
            });
        }
    }
    const ws = XLSX.utils.json_to_sheet(itemsToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Detalle Bienes');
    XLSX.writeFile(wb, `detalle_bienes_${currentTab}_${currentEmpresa}.xlsx`);
}

async function exportToPDF() {
    const el = document.querySelector('.max-w-7xl');
    if (!el) return;
    try {
        const canvas = await html2canvas(el, { scale: 2 });
        const img = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf || await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const w = 297;
        const h = (canvas.height * w) / canvas.width;
        pdf.addImage(img, 'PNG', 0, 0, w, h);
        pdf.save(`resumen_${currentTab}_${currentEmpresa}.pdf`);
    } catch(e) { console.warn(e); alert('Error generando PDF'); }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    renderCurrentTab();
    document.getElementById('lastUpdate').innerHTML = new Date().toLocaleTimeString() + ' - Datos embebidos';
    document.getElementById('refreshBtn')?.addEventListener('click', () => { renderCurrentTab(); alert('Datos recargados'); });
    document.getElementById('exportCSVBtn')?.addEventListener('click', exportToCSV);
    document.getElementById('exportExcelBtn')?.addEventListener('click', exportToExcel);
    document.getElementById('exportPDFBtn')?.addEventListener('click', exportToPDF);
    document.getElementById('searchPoliza')?.addEventListener('input', (e) => { currentPolizaSearch = e.target.value; renderCurrentTab(); });
    document.getElementById('closeModalBtn')?.addEventListener('click', () => document.getElementById('modalItems').classList.add('hidden'));
    document.getElementById('exportItemsBtn')?.addEventListener('click', () => {
        alert('Exportar los bienes del modal (funcionalidad por desarrollar)');
    });
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modalItems')) document.getElementById('modalItems').classList.add('hidden');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active', 'border-b-2', 'border-indigo-400', 'text-slate-800'));
            btn.classList.add('active', 'border-b-2', 'border-indigo-400', 'text-slate-800');
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
                b.classList.remove('bg-indigo-100', 'text-indigo-800', 'border-indigo-200');
                b.classList.add('bg-white', 'text-slate-700', 'border-slate-200');
            });
            btn.classList.remove('bg-white', 'text-slate-700', 'border-slate-200');
            btn.classList.add('bg-indigo-100', 'text-indigo-800', 'border-indigo-200');
            currentRamoFiltro = null;
            currentPolizaSearch = '';
            renderCurrentTab();
        });
    });
    
    const empresaBtn = Array.from(document.querySelectorAll('.empresa-btn')).find(b => b.getAttribute('data-empresa') === currentEmpresa);
    if (empresaBtn) empresaBtn.click();
});
