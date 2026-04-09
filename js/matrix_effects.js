/**
 * ITB INFRASTRUCTURE ANALYZER - DUAL VIEW VERSION
 */

const INFRA_DATA = {
    electricity: { variationRate: 0.2281 },
    water: { fixedDailyPerPax: 133 },
    costs: { cleaning: 175, supplies: 91.25 }
};

const PC_WATTAGE = 200;
const STANDBY_WATTAGE = 10;
const CO2_FACTOR = 0.259;

function runCalculations() {
    const pcCount = parseInt(document.getElementById('pcCount').value) || 0;
    const occupancy = parseInt(document.getElementById('studentCount').value) || 0;
    const selectedDays = parseInt(document.getElementById('calcMode').value);
    const grid = document.getElementById('resultsGrid');

    // Cálculos Base
    const totalWater = occupancy * INFRA_DATA.water.fixedDailyPerPax * selectedDays;
    const activeKwh = (pcCount * PC_WATTAGE * 12 * selectedDays) / 1000;
    let standbyDays = (selectedDays === 365) ? 0 : (365 - selectedDays);
    const standbyKwh = (pcCount * STANDBY_WATTAGE * 24 * standbyDays) / 1000;
    const totalEnergy = activeKwh + standbyKwh;
    const expenseFactor = (selectedDays === 175) ? 3 : 12;
    const resourceIndex = pcCount > 0 ? (totalWater / pcCount).toFixed(0) : 0;

    const metrics = [
        { title: "Facility Water", val: totalWater, unit: "L", icon: "💧" },
        { title: "Energy Load", val: totalEnergy.toFixed(0), unit: "kWh", icon: "🖥️" },
        { title: "Carbon Footprint", val: (totalEnergy * CO2_FACTOR).toFixed(1), unit: "kg", icon: "🌍" },
        { title: "Standby Leakage", val: standbyKwh.toFixed(1), unit: "kWh", icon: "🔌" },
        { title: "Resource Load Index", val: resourceIndex, unit: "L/Node", icon: "📊" },
        { title: "Cleaning Costs", val: (INFRA_DATA.costs.cleaning * expenseFactor).toFixed(2), unit: "€", icon: "🛠️" },
        { title: "Supplies Costs", val: (INFRA_DATA.costs.supplies * expenseFactor).toFixed(2), unit: "€", icon: "📦" },
        { title: "2026 Forecast", val: (totalEnergy * (1 + INFRA_DATA.electricity.variationRate)).toFixed(0), unit: "kWh", icon: "📈" }
    ];

    grid.innerHTML = "";
    metrics.forEach(m => {
        // El valor objetivo se calcula como el 70% del valor original (reducción del 30%)
        let targetVal = (parseFloat(m.val) * 0.70).toFixed(m.val.toString().includes('.') ? 1 : 0);

        grid.innerHTML += `
            <div class="card">
                <h3>${m.icon} ${m.title}</h3>
                <div class="data-container">
                    <div class="current-value">
                        <span class="label">Current:</span>
                        <span class="data">${parseFloat(m.val).toLocaleString()}</span>
                        <span class="unit">${m.unit}</span>
                    </div>
                    <div class="target-value" style="display:none; color: #22c55e; margin-top: 10px; border-top: 1px dashed #444; padding-top: 5px;">
                        <span class="label">Goal (-30%):</span>
                        <span class="data-target">${parseFloat(targetVal).toLocaleString()}</span>
                        <span class="unit">${m.unit}</span>
                    </div>
                </div>
            </div>
        `;
    });
}

function applySustainabilityPlan() {
    const targets = document.querySelectorAll('.target-value');
    if (targets.length === 0) {
        alert("Please analyze infrastructure first.");
        return;
    }

    targets.forEach(el => {
        el.style.display = "block"; // Muestra el objetivo al lado/debajo
    });

    // Cambiamos el estilo de los valores actuales para que se vea la comparativa
    document.querySelectorAll('.current-value').forEach(el => {
        el.style.opacity = "0.6";
    });

    console.log("Sustainability goals displayed for comparative analysis.");
}

function exportToPDF() {
    window.print();
}