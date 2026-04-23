/**
 * ITB INFRASTRUCTURE AUDIT - FINAL PRODUCTION VERSION
 * Seasonal logic + Critical Infra + Original PDF Export
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
const CRITICAL_INFRA_WATTAGE = 550; // Nubulet 24/7

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

    // --- 1. LÓGICA DE DÍAS Y ESTACIONALIDAD ---
    let holidays = 0;
    if (selectedText.includes("January")) holidays = 1;
    if (selectedText.includes("May")) holidays = 1;
    if (selectedText.includes("September")) holidays = 1;
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
    const baseEnergy = activeBase + standbyBase + infraFixed;

    // --- 3. AGUA ---
    let currentPax = occupancy;
    let waterDays = schoolDays;
    if (schoolDays === 0) {
        currentPax = (selectedText.includes("July")) ? 50 : 10;
        waterDays = 22;
    }
    const baseWater = (currentPax * INFRA_DATA.water.fixedDailyPerPax * waterDays) + (INFRA_DATA.water.maintenanceLitersDay * idleDays);

    // --- 4. AHORROS ---
    let savings = { water: 0, energy: 0, maint: 0 };
    TECH_POLICIES.forEach(p => { if (activePolicies.has(p.id)) savings[p.type] += p.impact; });

    const currEnergy = baseEnergy * (1 - savings.energy);
    const currWater = baseWater * (1 - savings.water);

    // --- 5. ACTUALIZACIÓN INTERFAZ ---
    updateChart(energySavingsValue());

    const expM = (schoolDays >= 175) ? 12 : 1;
    const metrics = [
        { title: "Facility Water", val: currWater, goal: baseWater * 0.70, unit: "L", icon: "💧" },
        { title: "System Energy Load", val: currEnergy, goal: baseEnergy * 0.70, unit: "kWh", icon: "🖥️" },
        { title: "Carbon Footprint", val: currEnergy * CO2_FACTOR, goal: (baseEnergy * 0.70) * CO2_FACTOR, unit: "kg", icon: "🌍" },
        { title: "Cleaning Costs", val: (INFRA_DATA.costs.cleaning * expM) * (1 - savings.maint), goal: (INFRA_DATA.costs.cleaning * expM) * 0.7, unit: "€", icon: "🛠️" },
        { title: "Supplies Costs", val: (INFRA_DATA.costs.supplies * expM) * (1 - savings.maint), goal: (INFRA_DATA.costs.supplies * expM) * 0.7, unit: "€", icon: "📦" },
        { title: "Standby Consumption", val: (standbyBase + infraFixed) * (1 - (savings.energy * 0.8)), goal: (standbyBase + infraFixed) * 0.5, unit: "kWh", icon: "🌙" },
        { title: "Wasted Energy", val: (baseEnergy * 0.25) * (1 - savings.energy), goal: (baseEnergy * 0.05), unit: "kWh", icon: "⚠️" },
        { title: `Next Year Forecast`, val: currEnergy * 1.22, goal: (baseEnergy * 0.7) * 1.22, unit: "kWh", icon: "📈" }
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

    const cBase = (baseWater * INFRA_DATA.water.pricePerL) + (baseEnergy * INFRA_DATA.energyPriceKwh) + (INFRA_DATA.costs.cleaning * expM) + (INFRA_DATA.costs.supplies * expM);
    const cCurr = (currWater * INFRA_DATA.water.pricePerL) + (currEnergy * INFRA_DATA.energyPriceKwh) + ((INFRA_DATA.costs.cleaning * expM) * (1 - savings.maint)) + ((INFRA_DATA.costs.supplies * expM) * (1 - savings.maint));

    document.getElementById('totalBase').innerText = Math.round(cBase).toLocaleString() + " €";
    document.getElementById('totalTarget').innerText = Math.round(cBase * 0.7).toLocaleString() + " €";
    document.getElementById('totalCurrent').innerText = Math.round(cCurr).toLocaleString() + " €";

    const efficiency = Math.min(100, Math.max(0, ((cBase - cCurr) / (cBase * 0.3)) * 100));
    if(document.getElementById('efficiencyBar')) {
        document.getElementById('efficiencyBar').style.width = efficiency + "%";
        document.getElementById('efficiencyText').innerText = Math.round(efficiency) + "% del objetivo estratégico logrado";
    }
}

function energySavingsValue() {
    let s = 0;
    TECH_POLICIES.forEach(p => { if (activePolicies.has(p.id) && p.type === 'energy') s += p.impact; });
    return s;
}

// --- GRÁFICA ESTACIONAL MES A MES ---
function updateChart(energySavings) {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    if (myChart) myChart.destroy();

    const pcCount = parseInt(document.getElementById('pcCount').value) || 0;
    const monthlySchoolDays = [20, 18, 15, 21, 20, 15, 0, 0, 20, 21, 19, 12];
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
                    borderColor: '#1e3a8a',
                    backgroundColor: 'rgba(30, 58, 138, 0.6)',
                    fill: true, stack: 'combined'
                },
                {
                    label: 'Standby PCs',
                    data: monthlyData.map(d => Math.round(d.standby * (1 - energySavings))),
                    borderColor: '#065f46',
                    backgroundColor: 'rgba(6, 95, 70, 0.5)',
                    fill: true, stack: 'combined'
                },
                {
                    label: 'Carga Alumnos',
                    data: monthlyData.map(d => Math.round(d.active * (1 - energySavings))),
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.4)',
                    fill: true, stack: 'combined'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { stacked: true, beginAtZero: true, ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                x: { ticks: { color: '#fff' }, grid: { display: false } }
            },
            plugins: {
                legend: { labels: { color: '#fff', usePointStyle: true } },
                tooltip: { mode: 'index', intersect: false }
            }
        }
    });
}

function toggleAction(id) { activePolicies.has(id) ? activePolicies.delete(id) : activePolicies.add(id); runCalculations(); }
function resetSavings() { activePolicies.clear(); initialMaxEnergy = null; runCalculations(); }

/**
 * LOGICA ORIGINAL DE IMPRESION (PDF) - MANTENIDA
 */
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