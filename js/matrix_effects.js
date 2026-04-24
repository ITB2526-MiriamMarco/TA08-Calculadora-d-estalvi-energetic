/**
 * ITB INFRASTRUCTURE AUDIT - 3-YEAR PROJECTION STRATEGY
 * - Ciclo completo: 2026, 2027, 2028
 * - Agosto/Septiembre: 0 carga activa (Solo Nubulet + Standby) en cada año
 * - Crecimiento tecnológico proyectado: +5% anual
 */

const currentSystemYear = 2026;
let myChart = null;

const INFRA_DATA = {
    electricity: { variationRate: 0.2281 },
    water: { fixedDailyPerPax: 133, pricePerL: 0.0021, maintenanceLitersDay: 500 },
    costs: { cleaning: 175, supplies: 91.25 },
    energyPriceKwh: 0.24
};

const PC_WATTAGE = 200;
const STANDBY_WATTAGE = 10;
const CO2_FACTOR = 0.259;
const CRITICAL_INFRA_WATTAGE = 550;

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

    // --- 1. LÓGICA DE CALENDARIO (Valle Agosto/Septiembre) ---
    if (selectedText.includes("August") || selectedText.includes("September")) {
        schoolDays = 0;
    }

    const totalPeriodDays = (schoolDays >= 175) ? 365 : 30;
    const idleDays = totalPeriodDays - schoolDays;

    // --- 2. ENERGÍA Y AHORROS ---
    const standbyBase = (pcCount * STANDBY_WATTAGE * 24 * totalPeriodDays) / 1000;
    const infraFixed = (CRITICAL_INFRA_WATTAGE * 24 * totalPeriodDays) / 1000;
    const activeBase = (pcCount * PC_WATTAGE * 12 * schoolDays) / 1000;
    const baseEnergyTotal = activeBase + standbyBase + infraFixed;

    let savings = { water: 0, energy: 0, maint: 0 };
    TECH_POLICIES.forEach(p => { if (activePolicies.has(p.id)) savings[p.type] += p.impact; });

    const energySavingFactor = Math.min(savings.energy, 0.70);

    // Energía actual para el dashboard (Año en curso)
    const currEnergy = (activeBase * (1 - energySavingFactor)) +
                       (standbyBase * (1 - (energySavingFactor * 0.6))) +
                       infraFixed;

    // --- 3. ACTUALIZACIÓN DE GRÁFICA PROYECTADA ---
    updateChart(energySavingFactor);

    // --- 4. RENDER DE INTERFAZ (Dashboard) ---
    const expM = (schoolDays >= 175) ? 12 : 1;
    const currWater = Math.max((occupancy * 133 * schoolDays) * 0.3, (occupancy * 133 * schoolDays) * (1 - savings.water));

    const metrics = [
        { title: "Facility Water", val: currWater, goal: (occupancy * 133 * schoolDays) * 0.7, unit: "L", icon: "💧" },
        { title: "System Energy Load", val: currEnergy, goal: baseEnergyTotal * 0.75, unit: "kWh", icon: "🖥️" },
        { title: "Carbon Footprint", val: currEnergy * CO2_FACTOR, goal: (baseEnergyTotal * 0.75) * CO2_FACTOR, unit: "kg", icon: "🌍" },
        { title: "Cleaning Costs", val: (INFRA_DATA.costs.cleaning * expM) * (1 - savings.maint), goal: (INFRA_DATA.costs.cleaning * expM) * 0.7, unit: "€", icon: "🛠️" },
        { title: "Standby Consumption", val: (standbyBase * (1 - (energySavingFactor * 0.6))) + infraFixed, goal: (standbyBase + infraFixed) * 0.6, unit: "kWh", icon: "🌙" },
        { title: `Next Year Forecast`, val: currEnergy * 1.05, goal: currEnergy, unit: "kWh", icon: "📈" }
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

    const cCurr = (currEnergy * INFRA_DATA.energyPriceKwh) + ((INFRA_DATA.costs.cleaning * expM) * (1 - savings.maint));
    document.getElementById('totalCurrent').innerText = Math.round(cCurr).toLocaleString() + " €";
}

// --- NUEVA GRÁFICA: PROYECCIÓN 3 AÑOS (2026-2027-2028) ---
function updateChart(appliedSaving) {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    if (myChart) myChart.destroy();

    const pcCount = parseInt(document.getElementById('pcCount').value) || 0;

    // Definición de meses y días lectivos (Agosto y Septiembre = 0)
    const monthlySchoolDays = [20, 18, 15, 21, 20, 15, 15, 0, 0, 21, 19, 12];
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    let allLabels = [];
    let combinedData = [];

    const years = [2026, 2027, 2028];
    const yearlyGrowth = 1.05; // 5% de crecimiento anual en carga base

    years.forEach((year, yIdx) => {
        const growthMultiplier = Math.pow(yearlyGrowth, yIdx);

        monthlySchoolDays.forEach((sDays, mIdx) => {
            allLabels.push(`${months[mIdx]} ${year.toString().slice(-2)}`);

            const infra = (CRITICAL_INFRA_WATTAGE * 24 * 30 * growthMultiplier) / 1000;
            const standby = (pcCount * STANDBY_WATTAGE * 24 * 30 * growthMultiplier) / 1000;
            const active = (pcCount * PC_WATTAGE * 12 * sDays * growthMultiplier) / 1000;

            // Calculamos el total mensual con ahorros aplicados
            const totalMonthlyKwh = infra + (standby * (1 - (appliedSaving * 0.6))) + (active * (1 - appliedSaving));
            combinedData.push(Math.round(totalMonthlyKwh));
        });
    });

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: allLabels,
            datasets: [{
                label: 'Proyección Energética Trienal (kWh)',
                data: combinedData,
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                fill: true,
                tension: 0.4,
                pointRadius: 1,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#fff' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                x: {
                    ticks: {
                        color: '#fff',
                        autoSkip: true,
                        maxTicksLimit: 12 // Muestra suficientes etiquetas para entender el eje
                    },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { labels: { color: '#fff' } },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `Consumo: ${context.parsed.y} kWh`;
                        }
                    }
                }
            }
        }
    });
}

function toggleAction(id) { activePolicies.has(id) ? activePolicies.delete(id) : activePolicies.add(id); runCalculations(); }
function resetSavings() { activePolicies.clear(); runCalculations(); }

// --- LÓGICA DE IMPRESIÓN ---
window.onbeforeprint = () => {
    if (myChart) {
        myChart.options.scales.x.ticks.color = '#000000';
        myChart.options.scales.y.ticks.color = '#000000';
        myChart.options.plugins.legend.labels.color = '#000000';
        myChart.update();
    }
};
window.onafterprint = () => { if (myChart) runCalculations(); };
window.onload = runCalculations;