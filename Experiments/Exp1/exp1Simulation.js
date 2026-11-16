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

        
        // Pulley touch area (larger than visible pulley)
        drawing.innerHTML += `
            <circle
                cx="${x}" cy="${y}" r="25"
                fill="transparent"
                class="pulley-handle"
                data-index="${index}"
                style="cursor:grab"
            />

            <!-- Visible pulley -->
            <circle cx="${x}" cy="${y}" r="13"
                fill="#64748b"
                stroke="#334155"
                stroke-width="3"
                pointer-events="none"
            />

            <circle cx="${x}" cy="${y}" r="4"
                fill="#e2e8f0"
                pointer-events="none"
            />
        `;


        // Hanging string and weight
        drawing.innerHTML += `
            <line x1="${x}" y1="${y + 13}"
                x2="${x}" y2="${y + 55}"
                stroke="${color}" stroke-width="2"/>

            <rect x="${x - 17}" y="${y + 55}"
                width="40" height="30" rx="4"
                fill="${color}" stroke="#334155" stroke-width="1.5"/>

            <text x="${x + 1}" y="${y + 73}"
                text-anchor="middle" font-size="13" 
                fill="white" font-weight="bold">
                ${force.mass}g
            </text>
        `;
    });
}



const table = document.getElementById("table");

let activePulley = null;

// Start dragging
table.addEventListener("pointerdown", (e) => {

    const pulley = e.target.closest(".pulley-handle");

    if (!pulley) return;

    activePulley = Number(pulley.dataset.index);

    table.setPointerCapture(e.pointerId);

    updatePulleyAngle(e);
});

// Continue dragging
table.addEventListener("pointermove", (e) => {

    if (activePulley === null) return;

    updatePulleyAngle(e);
});

// Stop dragging
table.addEventListener("pointerup", () => {
    activePulley = null;
});

table.addEventListener("pointercancel", () => {
    activePulley = null;
});

function updatePulleyAngle(e) {

    if (activePulley === null) return;

    // Convert screen coordinates into SVG coordinates
    const point = table.createSVGPoint();

    point.x = e.clientX;
    point.y = e.clientY;

    const svgPoint = point.matrixTransform(
        table.getScreenCTM().inverse()
    );

    // Calculate angle from the centre of the table
    const dx = svgPoint.x - cx;
    const dy = cy - svgPoint.y;

    let angle = Math.atan2(dy, dx) * 180 / Math.PI;

    // Convert to 0–360 degrees
    angle = (angle + 360) % 360;

    // Update the force
    forces[activePulley].angle =
        Math.round(angle * 10) / 10;

    // Update the angle input in the control panel
    const angleInput = inputs.querySelector(
        `input[data-index="${activePulley}"][data-field="angle"]`
    );

    if (angleInput) {
        angleInput.value = forces[activePulley].angle;
    }

    // Recalculate and redraw
    calculate();
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

    const balanced = resultant < 0.06;

    const status = document.getElementById("status");

    status.textContent = balanced
        ? "✓ Central ring is balanced! Equilibrium achieved."
        : "✗ Ring is not balanced. Adjust weights or angles.";

    status.style.color = balanced ? "#15803d" : "#dc2626";

    // Physical movement boundary
    const ringRadius = 17;
    const safetyMargin = 2;

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
    drawDiagrams(rx,ry,resultant);
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



function getNiceScale(rawNPerGrid) {
    const niceSteps = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 10, 20, 25, 50];
    return niceSteps.find(step => step >= rawNPerGrid) || Math.ceil(rawNPerGrid);
}

// Builds dynamic axis tick numbers and scale legend
function buildDynamicAxes(size, mid, gridPx, scaleNPerGrid) {
    let html = "";

    for (let pos = 50; pos < size - 25; pos += 50) {
        if (pos === mid) continue;
        const boxCount = Math.round((pos - mid) / gridPx);
        const xVal = (boxCount * scaleNPerGrid).toFixed(scaleNPerGrid < 1 ? 1 : 0);
        const yVal = (-boxCount * scaleNPerGrid).toFixed(scaleNPerGrid < 1 ? 1 : 0);

        html += `<text x="${pos}" y="${mid + 14}" text-anchor="middle" class="tick-label">${xVal}</text>`;
        html += `<text x="${mid - 6}" y="${pos + 3}" text-anchor="end" class="tick-label">${yVal}</text>`;
    }

    html += `
        <text x="12" y="${size - 12}" class="scale-label">
            Scale: 1 box = ${scaleNPerGrid} N (20×20 grid)
        </text>
    `;
    return html;
}

function drawDiagrams(rx, ry, resultant) {
    const spaceLayer = document.getElementById("space-dynamic-layer");
    const vectorLayer = document.getElementById("vector-dynamic-layer");

    if (!spaceLayer || !vectorLayer) return;

    const size = 500;
    const mid = 250;
    const gridPx = 25;
    const maxRadiusPx = mid - 30;

    let maxSpaceForce = 0.1;
    let maxPolygonReach = 0.1;
    let simX = 0;
    let simY = 0;

    forces.forEach(force => {
        const tension = (force.mass / 1000) * g;
        if (tension > maxSpaceForce) maxSpaceForce = tension;

        const rad = radians(force.angle);
        simX += tension * Math.cos(rad);
        simY += tension * Math.sin(rad);

        const distFromOrigin = Math.sqrt(simX * simX + simY * simY);
        if (distFromOrigin > maxPolygonReach) maxPolygonReach = distFromOrigin;
    });

    const overallMaxN = Math.max(maxSpaceForce, maxPolygonReach);
    const cleanNPerGrid = getNiceScale(overallMaxN / (maxRadiusPx / gridPx));
    const unifiedPxPerN = gridPx / cleanNPerGrid;

    const axesHTML = buildDynamicAxes(size, mid, gridPx, cleanNPerGrid);
    let spaceHTML = axesHTML;
    let vectorHTML = axesHTML;

    // 1. SPACE DIAGRAM (With horizontal-axis collision avoidance)
    forces.forEach((force, index) => {
        const tension = (force.mass / 1000) * g;
        if (tension <= 0) return;

        const rad = radians(force.angle);
        const endX = mid + (tension * Math.cos(rad)) * unifiedPxPerN;
        const endY = mid - (tension * Math.sin(rad)) * unifiedPxPerN;

        let labelX = mid + ((tension * unifiedPxPerN) + 22) * Math.cos(rad);
        let labelY = mid - ((tension * unifiedPxPerN) + 22) * Math.sin(rad);

        // If vector lies flat along the X-axis (near 0° or 180°), shift label above the axis
        if (Math.abs(Math.sin(rad)) < 0.15) {
            labelY -= 14;
        }

        labelX=Math.max(55,Math.min(size-55,labelX));

        spaceHTML += `
            <line x1="${mid}" y1="${mid}" x2="${endX}" y2="${endY}"
                  stroke="${colors[index]}" class="vector-line"
                  marker-end="url(#arrow-space-${index})" />
            <text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle"
                  fill="${colors[index]}" class="vector-text">
                F${index + 1} (${tension.toFixed(2)}N)
            </text>
        `;
    });

    // 2. VECTOR DIAGRAM
    let currX = mid;
    let currY = mid;

    forces.forEach((force, index) => {
        const tension = (force.mass / 1000) * g;
        if (tension <= 0) return;

        const rad = radians(force.angle);
        const nextX = currX + (tension * Math.cos(rad)) * unifiedPxPerN;
        const nextY = currY - (tension * Math.sin(rad)) * unifiedPxPerN;

        let midX=(currX +nextX)/2+8;
        let midY=(currY +nextY)/2-8;

        //Lift label, if it is on X-axis
        if (Math.abs(currY - mid) < 5 && Math.abs(nextY - mid) < 5) {
            midY -= 6;
        }


        vectorHTML += `
            <line x1="${currX}" y1="${currY}" x2="${nextX}" y2="${nextY}"
                  stroke="${colors[index]}" class="vector-line"
                  marker-end="url(#arrow-vector-${index})" />
            <text x="${midX}" y="${midY}" fill="${colors[index]}" class="vector-text">
                F${index + 1}
            </text>
        `;

        currX = nextX;
        currY = nextY;
    });

    if (resultant >= 0.06) {

        const resAngle = Math.atan2(ry, rx);
        const rLabelX = currX + 24 * Math.cos(resAngle);
        const rLabelY = currY - 24 * Math.sin(resAngle);

        vectorHTML += `
            <line x1="${mid}" y1="${mid}" x2="${currX}" y2="${currY}"
                  class="resultant-line" marker-end="url(#arrow-resultant)" />
            <text x="${rLabelX}" y="${rLabelY}" text-anchor="middle" dominant-baseline="middle"
                  fill="#0f172a" class="vector-text">
                R = ${resultant.toFixed(2)}N
            </text>
        `;

    } else {
        vectorHTML += `
            <circle cx="${mid}" cy="${mid}" r="2.5" fill="#15803d" />
            <text x="${size - 12}" y="${size - 12}" text-anchor="end" fill="#15803d" class="vector-text">
                ✓ Closed Polygon (Equilibrium)
            </text>
        `;
    }

    spaceLayer.innerHTML = spaceHTML;
    vectorLayer.innerHTML = vectorHTML;
}
