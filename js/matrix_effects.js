/**
 * ITB INFRASTRUCTURE AUDIT - FINAL CALENDAR VERSION
 * Features: Correct Summer Valley (Aug-Sept), Incompressible Floor, 24/7 Infra.
 */

const currentSystemYear = new Date().getFullYear();
let myChart = null;
let initialMaxEnergy = null;

const INFRA_DATA = {
    electricity: { variationRate: 0.2281 },
    water: { fixedDailyPerPax: 133, pricePerL: 0.0021, maintenanceLitersDay: 500 },
    costs: { cleaning: 175, supplies: 91.25 },
    energyPriceKwh: 0.24
};

const PC_WATTAGE = 200;
const STANDBY_WATTAGE = 10;
const CO2_FACTOR = 0.259;
const CRITICAL_INFRA_WATTAGE = 550; // Nubulet y Core Red (Consumo fijo)

const TECH_POLICIES = [
    { id: 'fountains', label: "Shut Fountains (8h)", impact: 0.10, type: 'water', category: "Facility Water" },
    { id: 'iot_water', label: "IoT Sensors", impact: 0.05, type: 'water', category: "Facility Water" },
    { id: 'virt', label: "Virtualization", impact: 0.15, type: 'energy', category: "System Energy Load" },
    { id: 'autoff', label: "Auto-Shutdown", impact: 0.10, type: 'energy', category: "System Energy Load" },
    { id: 'remote', label: "Remote Management", impact: 0.10, type: 'maint', category: "Cleaning Costs" },
    { id: 'inv', label: "Inventory Opt.", impact: 0.05, type: 'maint', category: "Supplies Costs" },
    { id: 'smart_plugs', label: "Smart Power Strips", impact: 0.35, type: 'energy', category: "Standby Consumption" },
    { id: 'hvac_ai', label: "AI HVAC Control", impact: 0.25, type: 'energy', category: "Wasted Energy" },
    { id: 'motion_sensors', label: "Motion Sensors", impact: 0.15, type: 'energy', category: "Wasted Energy" }
];

let activePolicies = new Set();

function runCalculations() {
    const pcCount = parseInt(document.getElementById('pcCount').value) || 0;
    const occupancy = parseInt(document.getElementById('studentCount').value) || 0;
    let schoolDays = parseInt(document.getElementById('calcMode').value);
    const selectedText = document.getElementById('calcMode').options[document.getElementById('calcMode').selectedIndex].text;

    document.getElementById('currentYearDisplay').innerText = currentSystemYear;

    // --- 1. LÓGICA DE DÍAS Y CALENDARIO ---
    let holidays = 0;
    if (selectedText.includes("January")) holidays = 1;
    if (selectedText.includes("May")) holidays = 1;
    if (selectedText.includes("September")) holidays = 15; // Refleja que media quincena no hay actividad
    if (selectedText.includes("October")) holidays = 1;
    if (selectedText.includes("November")) holidays = 1;
    if (selectedText.includes("December")) holidays = 2;

    if (schoolDays > 0 && schoolDays < 175) schoolDays = Math.max(0, schoolDays - holidays);

    const totalPeriodDays = (schoolDays >= 175) ? 365 : 30;
    const idleDays = totalPeriodDays - schoolDays;

    // --- 2. ENERGÍA BASE ---
    const standbyBase = (pcCount * STANDBY_WATTAGE * 24 * totalPeriodDays) / 1000;
    const infraFixed = (CRITICAL_INFRA_WATTAGE * 24 * totalPeriodDays) / 1000;
    const activeBase = (pcCount * PC_WATTAGE * 12 * schoolDays) / 1000;
    const baseEnergyTotal = activeBase + standbyBase + infraFixed;

    // --- 3. AGUA ---
    let currentPax = occupancy;
    let waterDays = schoolDays;
    if (schoolDays === 0) { // Caso Agosto
        currentPax = 10; // Solo mantenimiento
        waterDays = 5;
    } else if (selectedText.includes("July")) {
        currentPax = Math.round(occupancy * 0.4); // Menos gente pero hay actividad
        waterDays = 22;
    }
    const baseWater = (currentPax * INFRA_DATA.water.fixedDailyPerPax * waterDays) + (INFRA_DATA.water.maintenanceLitersDay * idleDays);

    // --- 4. AHORROS CON SUELO TECNOLÓGICO (Mínimo 30% siempre activo) ---
    let savings = { water: 0, energy: 0, maint: 0 };
    TECH_POLICIES.forEach(p => { if (activePolicies.has(p.id)) savings[p.type] += p.impact; });

    const energySavingFactor = Math.min(savings.energy, 0.70); // Máximo 70% ahorro en variable

    const currEnergy = (activeBase * (1 - energySavingFactor)) +
                       (standbyBase * (1 - (energySavingFactor * 0.6))) +
                       infraFixed;

    const currWater = Math.max(baseWater * 0.30, baseWater * (1 - savings.water));

    // --- 5. ACTUALIZACIÓN INTERFAZ ---
    updateChart(energySavingFactor);

    const expM = (schoolDays >= 175) ? 12 : 1;
    const metrics = [
        { title: "Facility Water", val: currWater, goal: baseWater * 0.70, unit: "L", icon: "💧" },
        { title: "System Energy Load", val: currEnergy, goal: baseEnergyTotal * 0.75, unit: "kWh", icon: "🖥️" },
        { title: "Carbon Footprint", val: currEnergy * CO2_FACTOR, goal: (baseEnergyTotal * 0.75) * CO2_FACTOR, unit: "kg", icon: "🌍" },
        { title: "Cleaning Costs", val: (INFRA_DATA.costs.cleaning * expM) * (1 - savings.maint), goal: (INFRA_DATA.costs.cleaning * expM) * 0.7, unit: "€", icon: "🛠️" },
        { title: "Supplies Costs", val: (INFRA_DATA.costs.supplies * expM) * (1 - savings.maint), goal: (INFRA_DATA.costs.supplies * expM) * 0.7, unit: "€", icon: "📦" },
        { title: "Standby Consumption", val: (standbyBase * (1 - (energySavingFactor * 0.6))) + infraFixed, goal: (standbyBase + infraFixed) * 0.6, unit: "kWh", icon: "🌙" },
        { title: "Wasted Energy", val: Math.max(baseEnergyTotal * 0.05, (baseEnergyTotal * 0.25) * (1 - energySavingFactor)), goal: (baseEnergyTotal * 0.08), unit: "kWh", icon: "⚠️" },
        { title: `Next Year Forecast`, val: currEnergy * 1.22, goal: (baseEnergyTotal * 0.75) * 1.22, unit: "kWh", icon: "📈" }
    ];

    const grid = document.getElementById('resultsGrid');
    grid.innerHTML = "";
    metrics.forEach(m => {
        const isAchieved = m.val <= m.goal;
        grid.innerHTML += `
            <div class="card">
                <h3>${m.icon} ${m.title}</h3>
                <span class="data">${Math.round(m.val).toLocaleString()}</span><span class="unit">${m.unit}</span>
                <div class="target-row" style="color: ${isAchieved ? '#22c55e' : '#e67e22'}">Target: ${Math.round(m.goal).toLocaleString()} ${m.unit}</div>
                <div class="card-actions">${TECH_POLICIES.filter(p => p.category === m.title).map(btn => `<button class="btn-action ${activePolicies.has(btn.id) ? 'active-btn' : ''}" onclick="toggleAction('${btn.id}')">${btn.label}</button>`).join("")}</div>
            </div>`;
    });

    const cBase = (baseWater * INFRA_DATA.water.pricePerL) + (baseEnergyTotal * INFRA_DATA.energyPriceKwh) + (INFRA_DATA.costs.cleaning * expM) + (INFRA_DATA.costs.supplies * expM);
    const cCurr = (currWater * INFRA_DATA.water.pricePerL) + (currEnergy * INFRA_DATA.energyPriceKwh) + ((INFRA_DATA.costs.cleaning * expM) * (1 - savings.maint)) + ((INFRA_DATA.costs.supplies * expM) * (1 - savings.maint));

    document.getElementById('totalBase').innerText = Math.round(cBase).toLocaleString() + " €";
    document.getElementById('totalTarget').innerText = Math.round(cBase * 0.75).toLocaleString() + " €";
    document.getElementById('totalCurrent').innerText = Math.round(cCurr).toLocaleString() + " €";

    const efficiency = Math.min(100, Math.max(0, ((cBase - cCurr) / (cBase * 0.25)) * 100));
    if(document.getElementById('efficiencyBar')) {
        document.getElementById('efficiencyBar').style.width = efficiency + "%";
        document.getElementById('efficiencyText').innerText = Math.round(efficiency) + "% del objetivo logrado";
    }
}

// --- GRÁFICA ESTACIONAL (VALLE AGOSTO-SEPT) ---
function updateChart(appliedSaving) {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    if (myChart) myChart.destroy();

    const pcCount = parseInt(document.getElementById('pcCount').value) || 0;

    // Julio tiene gente, Agosto es 0, Septiembre empieza a mitad (10 días)
    const monthlySchoolDays = [20, 18, 15, 21, 20, 15, 15, 0, 10, 21, 19, 12];
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    const monthlyData = monthlySchoolDays.map(sDays => {
        const infra = (CRITICAL_INFRA_WATTAGE * 24 * 30) / 1000;
        const standby = (pcCount * STANDBY_WATTAGE * 24 * 30) / 1000;
        const active = (pcCount * PC_WATTAGE * 12 * sDays) / 1000;
        return { infra, standby, active };
    });

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Infra Crítica (Nubulet)',
                    data: monthlyData.map(d => Math.round(d.infra)),
                    borderColor: '#1e3a8a', backgroundColor: 'rgba(30, 58, 138, 0.6)', fill: true, stack: 'combined'
                },
                {
                    label: 'Standby PCs',
                    data: monthlyData.map(d => Math.round(d.standby * (1 - (appliedSaving * 0.6)))),
                    borderColor: '#065f46', backgroundColor: 'rgba(6, 95, 70, 0.5)', fill: true, stack: 'combined'
                },
                {
                    label: 'Carga Alumnos',
                    data: monthlyData.map(d => Math.round(d.active * (1 - appliedSaving))),
                    borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.4)', fill: true, stack: 'combined'
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { stacked: true, beginAtZero: true, ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                x: { ticks: { color: '#fff' }, grid: { display: false } }
            },
            plugins: { legend: { labels: { color: '#fff' } }, tooltip: { mode: 'index', intersect: false } }
        }
    });
}

function toggleAction(id) { activePolicies.has(id) ? activePolicies.delete(id) : activePolicies.add(id); runCalculations(); }
function resetSavings() { activePolicies.clear(); initialMaxEnergy = null; runCalculations(); }

// --- LÓGICA DE IMPRESIÓN PDF (SIN CAMBIOS) ---
window.onbeforeprint = () => {
    if (myChart) {
        myChart.options.scales.x.ticks.color = '#000000';
        myChart.options.scales.y.ticks.color = '#000000';
        myChart.options.plugins.legend.labels.color = '#000000';
        myChart.update();
    }
};
window.onafterprint = () => { if (myChart) runCalculations(); };
window.onresize = () => { if(myChart) runCalculations(); };
window.onload = runCalculations;