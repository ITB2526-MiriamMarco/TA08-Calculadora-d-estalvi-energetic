/**
 * ITB INFRASTRUCTURE ANALYZER - FULL INTERACTIVE VERSION
 */

const INFRA_DATA = {
    electricity: { variationRate: 0.2281 },
    water: { fixedDailyPerPax: 133 },
    costs: { cleaning: 175, supplies: 91.25 }
};

const PC_WATTAGE = 200;
const STANDBY_WATTAGE = 10;
const CO2_FACTOR = 0.259;

// Estado de ahorros (se van sumando al pulsar botones)
let appliedSavings = {
    water: 0,
    energy: 0,
    maint: 0
};

function runCalculations() {
    const pcCount = parseInt(document.getElementById('pcCount').value) || 0;
    const occupancy = parseInt(document.getElementById('studentCount').value) || 0;
    const selectedDays = parseInt(document.getElementById('calcMode').value);
    const grid = document.getElementById('resultsGrid');

    // Cálculos Base
    const baseWater = occupancy * INFRA_DATA.water.fixedDailyPerPax * selectedDays;
    const baseEnergy = ((pcCount * PC_WATTAGE * 12 * selectedDays) / 1000) +
                       ((pcCount * STANDBY_WATTAGE * 24 * (selectedDays === 365 ? 0 : 365-selectedDays)) / 1000);
    const expenseFactor = (selectedDays === 175) ? 3 : 12;
    const baseMaint = (INFRA_DATA.costs.cleaning + INFRA_DATA.costs.supplies) * expenseFactor;

    // Aplicar Multiplicadores de Ahorro
    const currentWater = baseWater * (1 - appliedSavings.water);
    const currentEnergy = baseEnergy * (1 - appliedSavings.energy);
    const currentMaint = baseMaint * (1 - appliedSavings.maint);

    const metrics = [
        {
            id: 'water', title: "Facility Water", val: currentWater, goal: baseWater * 0.70, unit: "L", icon: "💧",
            actions: [
                { label: "Shut Fountains (8h)", impact: 0.10, type: 'water' },
                { label: "IoT Leak Sensors", impact: 0.05, type: 'water' },
                { label: "Dry Urinals", impact: 0.15, type: 'water' }
            ]
        },
        {
            id: 'energy', title: "Energy Load", val: currentEnergy, goal: baseEnergy * 0.70, unit: "kWh", icon: "🖥️",
            actions: [
                { label: "Virtualization", impact: 0.15, type: 'energy' },
                { label: "Scripts: Auto-Off", impact: 0.10, type: 'energy' },
                { label: "LED Upgrade", impact: 0.05, type: 'energy' }
            ]
        },
        {
            id: 'carbon', title: "Carbon Footprint", val: currentEnergy * CO2_FACTOR, goal: (baseEnergy * 0.70) * CO2_FACTOR, unit: "kg", icon: "🌍",
            actions: []
        },
        {
            id: 'resource', title: "Resource Index", val: pcCount > 0 ? (currentWater / pcCount) : 0, goal: (baseWater * 0.70 / (pcCount || 1)), unit: "L/Node", icon: "📊",
            actions: []
        },
        {
            id: 'maint', title: "Maintenance", val: currentMaint, goal: baseMaint * 0.70, unit: "€", icon: "🛠️",
            actions: [
                { label: "Inventory App", impact: 0.05, type: 'maint' },
                { label: "Remote Support", impact: 0.10, type: 'maint' }
            ]
        },
        {
            id: 'forecast', title: "2026 Forecast", val: currentEnergy * (1.2281), goal: (baseEnergy * 0.70) * (1.2281), unit: "kWh", icon: "📈",
            actions: []
        }
    ];

    grid.innerHTML = "";
    metrics.forEach(m => {
        const isAcheived = m.val <= m.goal;
        let actionButtons = m.actions.map(btn =>
            `<button class="btn-action" onclick="applyAction('${btn.type}', ${btn.impact}, this)">${btn.label} (-${btn.impact*100}%)</button>`
        ).join("");

        grid.innerHTML += `
            <div class="card">
                <h3>${m.icon} ${m.title}</h3>
                <div class="data-container">
                    <div class="current-row">
                        <span class="label">Current Status:</span>
                        <span class="data">${Math.round(m.val).toLocaleString()}</span>
                        <span class="unit">${m.unit}</span>
                    </div>
                    <div class="target-row" style="color: ${isAcheived ? '#22c55e' : '#e67e22'}">
                        <span class="label">${isAcheived ? '✅ Goal Achieved' : 'Strategic Goal (-30%):'}</span>
                        <span class="data-target">${Math.round(m.goal).toLocaleString()}</span>
                        <span class="unit">${m.unit}</span>
                    </div>
                </div>
                <div class="card-actions">${actionButtons}</div>
            </div>
        `;
    });
}

function applyAction(type, impact, btnElement) {
    // Desactivar botón para no aplicarlo dos veces
    btnElement.disabled = true;
    btnElement.style.opacity = "0.3";
    btnElement.style.cursor = "not-allowed";

    appliedSavings[type] += impact;
    runCalculations();
}

function resetSavings() {
    appliedSavings = { water: 0, energy: 0, maint: 0 };
    runCalculations();
}

function exportToPDF() { window.print(); }

window.onload = runCalculations;