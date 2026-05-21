import { ACES_KEYS, bandFor, metricLabel } from "../core/aces.js";
import { describeNode } from "../core/presenter.js";

export function renderApp(root, viewModel, dispatch) {
  const { world, selectedNodeId, reading, presentation } = viewModel;
  root.innerHTML = `
    <main class="shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">ASRG Prototype</p>
          <h1>Adaptive Governance Field</h1>
        </div>
        <div class="turn-box">
          <span>Turn</span>
          <strong>${world.turn}</strong>
        </div>
      </header>

      <section class="layout">
        <aside class="sidebar">
          <section class="panel">
            <div class="panel-header">
              <h2>Region Nodes</h2>
            </div>
            <div class="node-list">
              ${world.nodes.map((node) => nodeButton(node, selectedNodeId)).join("")}
            </div>
          </section>

          <section class="panel compact">
            <div class="panel-header">
              <h2>Prince</h2>
            </div>
            <p class="muted">${world.prince.name}</p>
            <div class="trait-grid">
              ${Object.entries(world.prince.traits).map(([key, value]) => `
                <div class="trait">
                  <span>${titleCase(key)}</span>
                  <strong>${value}</strong>
                </div>
              `).join("")}
            </div>
          </section>

          ${aiConfigPanel(world.aiConfig)}
        </aside>

        <section class="main-stage">
          <section class="report">
            <div class="panel-header">
              <div>
                <p class="eyebrow">Reader Output</p>
                <h2>${selectedNodeName(world, selectedNodeId)}</h2>
              </div>
            </div>
            <p class="lead">${presentation.lead}</p>
            <div class="cue-list">
              ${presentation.sceneCues.map((cue) => `<p>${cue}</p>`).join("")}
            </div>
            <p class="ai-notice">${presentation.aiModeNotice}</p>
          </section>

          <section class="grid-two">
            <section class="panel">
              <div class="panel-header">
                <h2>ACES Bands</h2>
              </div>
              <div class="metric-list">
                ${ACES_KEYS.map((key) => metricRow(key, reading.profile[key])).join("")}
              </div>
            </section>

            <section class="panel">
              <div class="panel-header">
                <h2>Advisors</h2>
              </div>
              <div class="advisor-list">
                ${presentation.advisorLines.map((line) => `
                  <article class="advisor">
                    <h3>${line.role}</h3>
                    <p class="muted">${line.name}</p>
                    <p>${line.text}</p>
                  </article>
                `).join("")}
              </div>
            </section>
          </section>

          <section class="grid-two">
            <section class="panel">
              <div class="panel-header">
                <h2>Social Actions</h2>
              </div>
              <div class="action-list">
                ${presentation.actions.map((action) => `
                  <button class="action-card" data-action="${action.id}">
                    <strong>${action.label}</strong>
                    <span>${action.detail}</span>
                    <small>${action.structural.intent} -> ${action.structural.target}</small>
                  </button>
                `).join("")}
              </div>
            </section>

            <section class="panel">
              <div class="panel-header">
                <h2>Accessible Logs</h2>
              </div>
              <div class="log-list">
                ${reading.logs.length ? reading.logs.map(logItem).join("") : `<p class="muted">No accessible local logs.</p>`}
              </div>
            </section>
          </section>
        </section>
      </section>
    </main>
  `;

  root.querySelectorAll("[data-node]").forEach((button) => {
    button.addEventListener("click", () => dispatch({ type: "select-node", nodeId: button.dataset.node }));
  });

  root.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => dispatch({ type: "play-action", actionId: button.dataset.action }));
  });

  root.querySelector("[data-reset]").addEventListener("click", () => dispatch({ type: "reset" }));

  root.querySelector("[data-ai-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    dispatch({
      type: "set-ai-config",
      mode: data.get("mode"),
      provider: data.get("provider"),
      endpoint: data.get("endpoint"),
      apiKey: data.get("apiKey"),
    });
  });
}

function nodeButton(node, selectedNodeId) {
  const selected = node.id === selectedNodeId ? " selected" : "";
  return `
    <button class="node-button${selected}" data-node="${node.id}">
      <strong>${node.name}</strong>
      <span>${describeNode(node)}</span>
    </button>
  `;
}

function metricRow(key, value) {
  return `
    <div class="metric-row">
      <div>
        <strong>${metricLabel(key)}</strong>
        <span>${bandFor(key, value)}</span>
      </div>
      <div class="meter" aria-label="${metricLabel(key)} ${value}">
        <div style="width: ${value}%"></div>
      </div>
      <em>${value}</em>
    </div>
  `;
}

function logItem(log) {
  return `
    <article class="log-item">
      <div>
        <strong>${log.title}</strong>
        <span>Turn ${log.turn} / ${log.visibility} / ${log.knowledge}</span>
      </div>
      <p>${log.summary}</p>
    </article>
  `;
}

function aiConfigPanel(config) {
  return `
    <section class="panel compact">
      <div class="panel-header">
        <h2>AI Mode</h2>
      </div>
      <form data-ai-form class="ai-form">
        <label>
          Mode
          <select name="mode">
            <option value="template" ${config.mode === "template" ? "selected" : ""}>Off / Template</option>
            <option value="local" ${config.mode === "local" ? "selected" : ""}>Local Browser AI</option>
            <option value="custom" ${config.mode === "custom" ? "selected" : ""}>Custom API Key</option>
          </select>
        </label>
        <label>
          Provider
          <input name="provider" value="${escapeHtml(config.provider || "")}" placeholder="Gemini, Groq, OpenRouter..." />
        </label>
        <label>
          Endpoint
          <input name="endpoint" value="${escapeHtml(config.endpoint || "")}" placeholder="Optional endpoint URL" />
        </label>
        <label>
          API Key
          <input name="apiKey" type="password" placeholder="${config.hasApiKey ? "Key stored for this save" : "Not stored yet"}" />
        </label>
        <button type="submit" class="small-button">Save AI Config</button>
        <button type="button" class="small-button ghost" data-reset>Reset World</button>
      </form>
    </section>
  `;
}

function selectedNodeName(world, selectedNodeId) {
  return world.nodes.find((node) => node.id === selectedNodeId)?.name || "Region";
}

function titleCase(value) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
