/**
 * ITB INFRASTRUCTURE ANALYZER - TOGGLE ACTIONS VERSION
 * 8 Metrics | Double Shift Logic | On/Off Policy Buttons
 */

const INFRA_DATA = {
    electricity: { variationRate: 0.2281 },
    water: { fixedDailyPerPax: 133 },
    costs: { cleaning: 175, supplies: 91.25 }
};

const PC_WATTAGE = 200;
const STANDBY_WATTAGE = 10;
const CO2_FACTOR = 0.259;

// Definición de las acciones técnicas disponibles
const TECH_POLICIES = [
    { id: 'fountains', label: "Shut Fountains (8h)", impact: 0.10, type: 'water', category: "Facility Water" },
    { id: 'iot_water', label: "IoT Sensors", impact: 0.05, type: 'water', category: "Facility Water" },
    { id: 'virt', label: "Virtualization", impact: 0.15, type: 'energy', category: "System Energy Load" },
    { id: 'autoff', label: "Auto-Shutdown", impact: 0.10, type: 'energy', category: "System Energy Load" },
    { id: 'remote', label: "Remote Management", impact: 0.10, type: 'maint', category: "Cleaning Costs" },
    { id: 'inv', label: "Inventory Opt.", impact: 0.05, type: 'maint', category: "Supplies Costs" }
];

// Estado de políticas activas (usamos un Set para que no se dupliquen)
let activePolicies = new Set();

function runCalculations() {
    const pcCount = parseInt(document.getElementById('pcCount').value) || 0;
    const occupancy = parseInt(document.getElementById('studentCount').value) || 0;
    const selectedDays = parseInt(document.getElementById('calcMode').value);
    const grid = document.getElementById('resultsGrid');

    // 1. CÁLCULOS BASE (Línea de referencia)
    const baseWater = occupancy * INFRA_DATA.water.fixedDailyPerPax * selectedDays;
    const activeKwh = (pcCount * PC_WATTAGE * 12 * selectedDays) / 1000;
    let standbyDays = (selectedDays === 365) ? 0 : (365 - selectedDays);
    const baseStandbyKwh = (pcCount * STANDBY_WATTAGE * 24 * standbyDays) / 1000;
    const baseEnergy = activeKwh + baseStandbyKwh;

    const expenseFactor = (selectedDays === 175) ? 3 : 12;
    const baseCleaning = INFRA_DATA.costs.cleaning * expenseFactor;
    const baseSupplies = INFRA_DATA.costs.supplies * expenseFactor;

    // 2. CALCULAR SUMATORIA DE AHORROS SEGÚN POLÍTICAS ACTIVAS
    let currentSavings = { water: 0, energy: 0, maint: 0 };
    TECH_POLICIES.forEach(policy => {
        if (activePolicies.has(policy.id)) {
            currentSavings[policy.type] += policy.impact;
        }
    });

    // 3. APLICAR AHORROS A LOS VALORES ACTUALES
    const currentWater = baseWater * (1 - currentSavings.water);
    const currentEnergy = baseEnergy * (1 - currentSavings.energy);
    const currentStandby = baseStandbyKwh * (1 - currentSavings.energy);
    const currentCleaning = baseCleaning * (1 - currentSavings.maint);
    const currentSupplies = baseSupplies * (1 - currentSavings.maint);

    // 4. ESTRUCTURA DE LAS 8 MÉTRICAS
    const metrics = [
        { title: "Facility Water", val: currentWater, goal: baseWater * 0.70, unit: "L", icon: "💧" },
        { title: "System Energy Load", val: currentEnergy, goal: baseEnergy * 0.70, unit: "kWh", icon: "🖥️" },
        { title: "Carbon Footprint", val: currentEnergy * CO2_FACTOR, goal: (baseEnergy * 0.70) * CO2_FACTOR, unit: "kg", icon: "🌍" },
        { title: "Standby Leakage", val: currentStandby, goal: baseStandbyKwh * 0.70, unit: "kWh", icon: "🔌" },
        { title: "Resource Load Index", val: pcCount > 0 ? (currentWater / pcCount) : 0, goal: (baseWater * 0.70 / (pcCount || 1)), unit: "L/Node", icon: "📊" },
        { title: "Cleaning Costs", val: currentCleaning, goal: baseCleaning * 0.70, unit: "€", icon: "🛠️" },
        { title: "Supplies Costs", val: currentSupplies, goal: baseSupplies * 0.70, unit: "€", icon: "📦" },
        { title: "2026 Forecast", val: currentEnergy * (1 + INFRA_DATA.electricity.variationRate), goal: (baseEnergy * 0.70) * (1.2281), unit: "kWh", icon: "📈" }
    ];

    // 5. RENDERIZAR TARJETAS
    grid.innerHTML = "";
    metrics.forEach(m => {
        const isAchieved = m.val <= m.goal;
        const statusLabel = isAchieved ? '✅ Goal Achieved' : 'Target (-30%):';

        // Filtrar qué botones de TECH_POLICIES pertenecen a esta tarjeta
        const cardActions = TECH_POLICIES.filter(p => p.category === m.title);
        let actionButtons = "";

        if (cardActions.length > 0) {
            actionButtons = `<div class="card-actions">` +
                cardActions.map(btn => {
                    const isActive = activePolicies.has(btn.id);
                    return `<button class="btn-action ${isActive ? 'active-btn' : ''}"
                            onclick="toggleAction('${btn.id}')">
                            ${btn.label}
                            </button>`;
                }).join("") + `</div>`;
        }

        grid.innerHTML += `
            <div class="card">
                <h3>${m.icon} ${m.title}</h3>
                <div class="data-container">
                    <div class="current-row">
                        <span class="label">Actual:</span>
                        <span class="data">${Math.round(m.val).toLocaleString()}</span>
                        <span class="unit">${m.unit}</span>
                    </div>
                    <div class="target-row" style="color: ${isAchieved ? '#22c55e' : '#e67e22'}">
                        <span class="label">${statusLabel}</span>
                        <span class="data-target">${Math.round(m.goal).toLocaleString()}</span>
                        <span class="unit">${m.unit}</span>
                    </div>
                </div>
                ${actionButtons}
            </div>
        `;
    });
}

/**
 * Activa o desactiva una política de ahorro
 */
function toggleAction(policyId) {
    if (activePolicies.has(policyId)) {
        activePolicies.delete(policyId);
    } else {
        activePolicies.add(policyId);
    }
    runCalculations();
}

/**
 * Resetea todas las políticas
 */
function resetSavings() {
    activePolicies.clear();
    runCalculations();
}

/**
 * Exportación a PDF (Print)
 */
function exportToPDF() {
    window.print();
}

// Inicialización
window.onload = runCalculations;