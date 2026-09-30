// v1.3 Presentation Release
// Presentation-only UI orchestration. No physics state or solver logic lives here.

const PANEL_CONFIG = [
  {
    key: "energy",
    label: "Potential & energy",
    selector: "#energy-plot",
    defaultOpen: true,
  },
  {
    key: "wavefunction",
    label: "Wavefunction",
    selector: "#wavefunction-plot",
    defaultOpen: false,
  },
  {
    key: "probability",
    label: "Probability density",
    selector: "#probability-plot",
    defaultOpen: true,
  },
];

const panelState = Object.fromEntries(
  PANEL_CONFIG.map(({ key, defaultOpen }) => [key, defaultOpen]),
);

function cardFor(selector) {
  return document.querySelector(selector)?.closest(".viz-card") ?? null;
}

function resizePlot(selector) {
  const plot = document.querySelector(selector);
  if (!plot || !window.Plotly?.Plots?.resize) return;

  // Wait until display/layout is restored before asking Plotly for dimensions.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      try {
        window.Plotly.Plots.resize(plot);
      } catch (error) {
        console.debug("Plot resize skipped:", error);
      }
    });
  });
}

function applyPanelState() {
  const isPresentation = document.body.classList.contains("mode-presentation");

  for (const config of PANEL_CONFIG) {
    const card = cardFor(config.selector);
    if (!card) continue;

    const shouldHide = isPresentation && !panelState[config.key];
    card.classList.toggle("presentation-panel-hidden", shouldHide);
    card.setAttribute("aria-hidden", shouldHide ? "true" : "false");

    if (!shouldHide) resizePlot(config.selector);
  }

  document.querySelectorAll(".presentation-panel-toggle").forEach((button) => {
    const key = button.dataset.panel;
    button.setAttribute("aria-pressed", panelState[key] ? "true" : "false");
  });

  document.body.classList.remove("presentation-ui-pending");
}

function createPanelSwitcher() {
  if (document.querySelector(".presentation-panel-switcher")) return;

  const stack = document.querySelector(".visualization-stack");
  if (!stack) return;

  const switcher = document.createElement("nav");
  switcher.className = "presentation-panel-switcher presentation-only";
  switcher.setAttribute("aria-label", "Choose presentation panels");

  const label = document.createElement("span");
  label.className = "panel-switcher-label";
  label.textContent = "View";

  const buttons = document.createElement("div");
  buttons.className = "presentation-panel-buttons";

  for (const config of PANEL_CONFIG) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "presentation-panel-toggle";
    button.dataset.panel = config.key;
    button.textContent = config.label;
    button.setAttribute("aria-pressed", panelState[config.key] ? "true" : "false");

    button.addEventListener("click", () => {
      panelState[config.key] = !panelState[config.key];
      applyPanelState();
    });

    buttons.append(button);
  }

  switcher.append(label, buttons);
  stack.before(switcher);
}

function updatePresentationCopy() {
  const version = document.querySelector(".version-badge");
  if (version) version.textContent = "v1.3 · presentation";

  document.title = "Quantum Tunneling Explorer · v1.3 Presentation";

  const subtitle = document.querySelector(".page-header .subtitle");
  if (subtitle) {
    subtitle.textContent =
      "Explore how electron energy, barrier height, and barrier width control quantum transmission.";
  }
}

function respondToModeChange() {
  applyPanelState();

  // The base UI changes body mode classes before firing its display callback.
  // Resizing once more after that layout transition keeps Plotly crisp.
  requestAnimationFrame(() => {
    if (document.body.classList.contains("mode-explore")) {
      PANEL_CONFIG.forEach(({ selector }) => resizePlot(selector));
    } else {
      PANEL_CONFIG
        .filter(({ key }) => panelState[key])
        .forEach(({ selector }) => resizePlot(selector));
    }
  });
}

function initialize() {
  document.body.classList.add("presentation-ui-pending");
  createPanelSwitcher();
  updatePresentationCopy();
  applyPanelState();

  document.getElementById("mode-presentation")?.addEventListener("change", respondToModeChange);
  document.getElementById("mode-explore")?.addEventListener("change", respondToModeChange);

  // Scenario changes can swap plane-wave/wave-packet layouts; resize visible plots.
  document.getElementById("presentation-scenario")?.addEventListener("change", () => {
    requestAnimationFrame(applyPanelState);
  });

  window.addEventListener("resize", () => {
    if (document.body.classList.contains("mode-presentation")) {
      PANEL_CONFIG
        .filter(({ key }) => panelState[key])
        .forEach(({ selector }) => resizePlot(selector));
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize, { once: true });
} else {
  initialize();
}
