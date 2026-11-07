
const g = 9.81;
const cx = 300;
const cy = 300;
const pulleyRadius = 170;

const colors = [
    "#2563eb", "#dc2626", "#16a34a",
    "#9333ea", "#ea580c", "#0891b2", "#be185d"
];

let ringX = cx;
let ringY = cy;

let forces = [
    { mass: 100, angle: 0 },
    { mass: 100, angle: 120 },
    { mass: 100, angle: 240 }
];

const inputs = document.getElementById("inputs");
const drawing = document.getElementById("forces");

function radians(degrees) {
    return degrees * Math.PI / 180;
}

// Create the input controls

function renderInputs() {
    inputs.innerHTML = "";

    forces.forEach((force, index) => {
        const row = document.createElement("div");
        row.className = "force-row";

        row.innerHTML = `
            <span style="color:${colors[index]}">●</span>

            <label>
                <small>Weight ${index + 1} (g)</small>

                <div class="number-control">
                    <button type="button" class="step-btn"
                        data-index="${index}"
                        data-field="mass"
                        data-action="decrease"
                        aria-label="Decrease mass">−</button>

                    <input type="number" min="0" step="1"
                        value="${force.mass}"
                        data-index="${index}"
                        data-field="mass">

                    <button type="button" class="step-btn"
                        data-index="${index}"
                        data-field="mass"
                        data-action="increase"
                        aria-label="Increase mass">+</button>
                </div>
            </label>

            <label>
                <small>Angle (°)</small>

                <div class="number-control">
                    <button type="button" class="step-btn"
                        data-index="${index}"
                        data-field="angle"
                        data-action="decrease"
                        aria-label="Decrease angle">−</button>

                    <input type="number" step="1"
                        value="${force.angle}"
                        data-index="${index}"
                        data-field="angle">

                    <button type="button" class="step-btn"
                        data-index="${index}"
                        data-field="angle"
                        data-action="increase"
                        aria-label="Increase angle">+</button>
                </div>
            </label>
        `;

        inputs.appendChild(row);
    });
}

// Handle manual input changes
inputs.addEventListener("input", event => {
    if (!event.target.matches("input")) return;

    const index = Number(event.target.dataset.index);
    const field = event.target.dataset.field;
    const value = event.target.value;

    if (value === "") return;

    const number = Number(value);

    if (!Number.isFinite(number)) return;

    forces[index][field] =
        field === "mass"
            ? Math.max(0, number)
            : number;

    calculate();
});

// Handle custom increment/decrement buttons
inputs.addEventListener("click", event => {
    const button = event.target.closest(".step-btn");

    if (!button) return;

    const index = Number(button.dataset.index);
    const field = button.dataset.field;
    const action = button.dataset.action;

    const step = 1;

    let value = forces[index][field];

    if (action === "increase") {
        value += step;
    } else {
        value -= step;
    }

    if (field === "mass") {
        value = Math.max(0, value);
    }

    forces[index][field] = value;

    // Update the corresponding input
    const input = inputs.querySelector(
        `input[data-index="${index}"][data-field="${field}"]`
    );

    input.value = value;

    calculate();
});


// Draw pulleys, strings and hanging weights
function drawTable() {
    drawing.innerHTML = "";

    forces.forEach((force, index) => {
        const angle = radians(force.angle);

        const x = cx + pulleyRadius * Math.cos(angle);
        const y = cy - pulleyRadius * Math.sin(angle);

        const color = colors[index];

        // String from central ring to pulley
        drawing.innerHTML += `
            <line x1="${ringX}" y1="${ringY}"
                x2="${x}" y2="${y}"
                stroke="${color}" stroke-width="2.5"/>
        `;

        // Pulley
        drawing.innerHTML += `
            <circle cx="${x}" cy="${y}" r="13"
                fill="#64748b" stroke="#334155" stroke-width="3"/>

            <circle cx="${x}" cy="${y}" r="4"
                fill="#e2e8f0"/>
        `;

        // Hanging string and weight
        drawing.innerHTML += `
            <line x1="${x}" y1="${y + 13}"
                x2="${x}" y2="${y + 65}"
                stroke="${color}" stroke-width="2"/>

            <rect x="${x - 17}" y="${y + 65}"
                width="34" height="28" rx="4"
                fill="${color}" stroke="#334155" stroke-width="1.5"/>

            <text x="${x}" y="${y + 83}"
                text-anchor="middle" font-size="11"
                fill="white" font-weight="bold">
                ${force.mass}g
            </text>
        `;
    });
}

// Calculate forces using T = mg
function calculate() {
    let rx = 0;
    let ry = 0;

    forces.forEach(force => {
        const massKg = force.mass / 1000;
        const tension = massKg * g;
        const angle = radians(force.angle);

        rx += tension * Math.cos(angle);
        ry += tension * Math.sin(angle);
    });

    const resultant = Math.sqrt(rx * rx + ry * ry);

    const angle =
        (Math.atan2(ry, rx) * 180 / Math.PI + 360) % 360;

    document.getElementById("rx").textContent =
        rx.toFixed(3) + " N";

    document.getElementById("ry").textContent =
        ry.toFixed(3) + " N";

    document.getElementById("r").textContent =
        resultant.toFixed(3) + " N";

    document.getElementById("theta").textContent =
        resultant < 0.01 ? "Undefined" : angle.toFixed(2) + "°";

    const balanced = resultant < 0.05;

    const status = document.getElementById("status");

    status.textContent = balanced
        ? "✓ Central ring is balanced! Equilibrium achieved."
        : "✗ Ring is not balanced. Adjust weights or angles.";

    status.style.color = balanced ? "#15803d" : "#dc2626";

    // Physical movement boundary
    const tableInnerRadius = 180;
    const ringRadius = 17;
    const safetyMargin = 5;

    const maxMovement = ringRadius - safetyMargin;

    // How much the ring moves per Newton
    const movementScale = 12;

    // Calculate displacement
    const displacement = Math.min(
        resultant * movementScale,
        maxMovement
    );

    // Direction of resultant force
    const directionX = resultant === 0 ? 0 : rx / resultant;
    const directionY = resultant === 0 ? 0 : ry / resultant;

    // Calculate ring position
    ringX = cx + directionX * displacement;
    ringY = cy - directionY * displacement;

    // Move the ring
    document.getElementById("ringAssembly")
        .setAttribute(
            "transform",
            `translate(${ringX - cx}, ${ringY - cy})`
        );

    drawTable();
}

// Add a new force
document.getElementById("addForce").addEventListener("click", () => {
    if (forces.length >= 7) {
        alert("Maximum of 7 forces allowed.");
        return;
    }

    forces.push({ mass: 100, angle: 0 });

    renderInputs();
    calculate();
});

// Remove the last force
document.getElementById("removeForce").addEventListener("click", () => {
    if (forces.length <= 1) {
        alert("At least one weight is required.");
        return;
    }

    forces.pop();

    renderInputs();
    calculate();
});

// Calculate button
document.getElementById("calculate").addEventListener("click", calculate);

// Initial rendering
renderInputs();
calculate();
