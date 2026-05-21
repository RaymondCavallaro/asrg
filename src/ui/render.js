import { storyConfigSchema } from "../game/generation.js";
import { locales, t } from "../i18n.js";

export function renderApp(root, viewModel, dispatch) {
  const { world, screen } = viewModel;
  if (screen === "settings") {
    renderSettings(root, world, dispatch);
    addDebugToggle(root);
    bindCommon(root, dispatch);
    return;
  }
  if (screen === "achievements") {
    renderAchievements(root, world, dispatch);
    addDebugToggle(root);
    bindCommon(root, dispatch);
    return;
  }
  if (screen === "dashboard") {
    renderDashboard(root, viewModel, dispatch);
    bindCommon(root, dispatch);
    return;
  }
  if (!world.started) {
    renderSetup(root, world, dispatch);
    addDebugToggle(root);
    bindCommon(root, dispatch);
    return;
  }
  renderGame(root, viewModel, dispatch);
  addDebugToggle(root);
  bindCommon(root, dispatch);
}

function renderSetup(root, world, dispatch) {
  const locale = world.locale || "pt-BR";
  const spent = traitTotal(world.prince.traits);
  const budget = world.prince.traitBudget ?? spent;
  const remaining = budget - spent;
  root.innerHTML = `
    <main class="start-shell">
      <section class="start-copy">
        <p class="eyebrow">${t(locale, "asrgPrototype")}</p>
        <h1>${t(locale, "startTitle")}</h1>
        <p class="opening-text">
          ${t(locale, "startCopyA")}
        </p>
        <p class="opening-text">
          ${t(locale, "startCopyB")}
        </p>
      </section>

      <section class="setup-panel">
        <div class="panel-header">
          <h2>${world.prince.name}</h2>
          <button class="small-button ghost" data-screen="settings">${t(locale, "settings")}</button>
        </div>
        <p class="budget-line">
          ${t(locale, "traitPool")}: <strong>${remaining}</strong> ${t(locale, "unspent")}.
          ${remaining === 0 ? t(locale, "lowerTrait") : t(locale, "spendCarefully")}
        </p>
        <div class="trait-editor">
          ${Object.entries(world.prince.traits).map(([key, value]) => traitEditor(key, value, remaining, world.prince)).join("")}
        </div>
        <button class="begin-button" data-start>${t(locale, "enterCouncil")}</button>
      </section>
    </main>
  `;

  root.querySelector("[data-start]").addEventListener("click", () => dispatch({ type: "start-game" }));
  root.querySelectorAll("[data-trait]").forEach((button) => {
    button.addEventListener("click", () => {
      dispatch({
        type: "adjust-trait",
        trait: button.dataset.trait,
        amount: Number(button.dataset.amount),
      });
    });
  });
}

function renderSettings(root, world, dispatch) {
  const locale = world.locale || "pt-BR";
  const storyConfig = escapeHtml(JSON.stringify(world.storyConfig, null, 2));
  const schema = escapeHtml(JSON.stringify(storyConfigSchema, null, 2));
  const storyLocked = world.started ? "disabled" : "";
  root.innerHTML = `
    <main class="settings-shell">
      <section class="panel settings-panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">${t(locale, "configuration")}</p>
            <h1>${t(locale, "gameSettings")}</h1>
          </div>
          <button class="small-button ghost" data-screen="${world.started ? "game" : "setup"}">${t(locale, "back")}</button>
        </div>
        <form data-ai-form class="ai-form wide">
          <label>
            ${t(locale, "language")}
            <select name="locale">
              ${locales.map((item) => `<option value="${item}" ${locale === item ? "selected" : ""}>${t(item, "languageName")}</option>`).join("")}
            </select>
          </label>
          <label>
            ${t(locale, "aiMode")}
            <select name="mode">
              <option value="template" ${world.aiConfig.mode === "template" ? "selected" : ""}>${t(locale, "offTemplate")}</option>
              <option value="local" ${world.aiConfig.mode === "local" ? "selected" : ""}>${t(locale, "localBrowserAi")}</option>
              <option value="custom" ${world.aiConfig.mode === "custom" ? "selected" : ""}>${t(locale, "customApiKey")}</option>
            </select>
          </label>
          <label>
            ${t(locale, "provider")}
            <input name="provider" value="${escapeHtml(world.aiConfig.provider || "")}" placeholder="Gemini, Groq, OpenRouter..." />
          </label>
          <label>
            ${t(locale, "endpoint")}
            <input name="endpoint" value="${escapeHtml(world.aiConfig.endpoint || "")}" placeholder="Optional endpoint URL" />
          </label>
          <label>
            ${t(locale, "apiKey")}
            <input name="apiKey" type="password" placeholder="${world.aiConfig.hasApiKey ? t(locale, "apiPlaceholderStored") : t(locale, "apiPlaceholderEmpty")}" />
          </label>
          <button type="submit" class="small-button">${t(locale, "saveSettings")}</button>
        </form>
        <form data-story-json-form class="story-config">
          <div>
            <h2>${t(locale, "storyDictionary")}</h2>
            <p class="config-note">
              ${world.started ? t(locale, "storyDictionaryNoteLocked") : t(locale, "storyDictionaryNoteUnlocked")}
            </p>
          </div>
          <label>
            ${t(locale, "storyConfigurationJson")}
            <textarea class="config-textarea" name="storyConfig" spellcheck="false" ${storyLocked}>${storyConfig}</textarea>
          </label>
          <details class="schema-panel">
            <summary>${t(locale, "showSchema")}</summary>
            <pre>${schema}</pre>
          </details>
          <button type="submit" class="small-button" ${storyLocked}>${t(locale, "saveStoryDictionary")}</button>
        </form>
        <button type="button" class="small-button danger" data-reset>${t(locale, "resetStory")}</button>
      </section>
    </main>
  `;

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
    dispatch({ type: "set-locale", locale: data.get("locale") });
  });
  const storyForm = root.querySelector("[data-story-json-form]");
  storyForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      dispatch({
        type: "set-story-config-json",
        config: JSON.parse(data.get("storyConfig")),
      });
    } catch (error) {
      window.alert(`${t(locale, "invalidStoryJson")}: ${error.message}`);
    }
  });
}

function renderAchievements(root, world, dispatch) {
  const locale = world.locale || "pt-BR";
  const achievements = achievementCatalog(world, locale);
  root.innerHTML = `
    <main class="settings-shell">
      <section class="panel settings-panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">${t(locale, "winterCouncil")} / ${t(locale, "turn")} ${world.turn}</p>
            <h1>${t(locale, "achievementsScreen")}</h1>
          </div>
          <button class="small-button ghost" data-screen="${world.started ? "game" : "setup"}">${t(locale, "back")}</button>
        </div>
        <section class="achievement-section">
          <h2>${t(locale, "visibleAchievements")}</h2>
          <div class="achievement-grid">
            ${achievements.filter((item) => !item.hidden).map((achievement) => achievementCard(achievement, locale)).join("")}
          </div>
        </section>
        <section class="achievement-section">
          <h2>${t(locale, "hiddenAchievements")}</h2>
          <div class="achievement-grid">
            ${achievements.filter((item) => item.hidden).map((achievement) => achievementCard(achievement, locale)).join("")}
          </div>
        </section>
      </section>
    </main>
  `;
}

function renderDashboard(root, viewModel, dispatch) {
  const { world, reading, presentation } = viewModel;
  const locale = world.locale || "pt-BR";
  root.innerHTML = `
    <main class="dashboard-shell">
      <section class="panel dashboard-panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">${t(locale, "debugOpen")}</p>
            <h1>${t(locale, "debugDashboard")}</h1>
          </div>
          <button class="small-button ghost" data-screen="${world.started ? "game" : "setup"}">${t(locale, "back")}</button>
        </div>
        <div class="dashboard-grid">
          ${debugBlock(t(locale, "systemNodes"), world.nodes)}
          ${debugBlock(t(locale, "topologyEdges"), world.edges)}
          ${debugBlock(t(locale, "allCharacters"), world.characters)}
          ${debugBlock(t(locale, "allLogs"), world.logs)}
          ${debugBlock(t(locale, "allStoryNodes"), world.storyNodes)}
          ${debugBlock(t(locale, "storyNodeDetails"), presentation.storyNodes)}
          ${debugBlock(t(locale, "aiPresentationContext"), presentation.aiContext)}
          ${debugBlock(t(locale, "rawWorldState"), world)}
          ${debugBlock("Reading", reading)}
        </div>
      </section>
    </main>
  `;
}

function renderGame(root, viewModel, dispatch) {
  const { world, selectedStoryNodeId, places, reading, presentation } = viewModel;
  const locale = world.locale || "pt-BR";
  root.innerHTML = `
    <main class="game-shell">
      <header class="story-topbar">
        <div>
          <p class="eyebrow">${t(locale, "winterCouncil")} / ${t(locale, "turn")} ${world.turn}</p>
          <h1>${presentation.scene.title}</h1>
        </div>
        <div class="topbar-actions">
          <button class="small-button ghost" data-screen="achievements">${t(locale, "openAchievements")}</button>
          <button class="small-button ghost" data-screen="settings">${t(locale, "settings")}</button>
        </div>
      </header>

      <section class="story-layout">
        <section class="story-column">
          <article class="story-card">
            ${presentation.scene.body.map((paragraph) => `<p>${paragraph}</p>`).join("")}
            <p class="result-text">${presentation.scene.result}</p>
          </article>

          <section class="choice-panel">
            <h2>${t(locale, "whatDoYouDo")}</h2>
            <div class="choice-list">
              ${presentation.actions.map((action) => `
                <button class="choice-card" data-action="${action.id}" data-story-node-target="${action.storyNodeId || ""}" data-story-node-title="${escapeHtml(action.storyNodeTitle || "")}" data-story-node-type="${action.storyNodeType || ""}">
                  <strong>${action.label}</strong>
                  <span>${action.detail}</span>
                  ${actionComposition(action, locale)}
                  <small>${turnCost(locale, action.durationTurns || 1)}</small>
                </button>
              `).join("")}
            </div>
          </section>

          <section class="choice-panel">
            <h2>${world.currentPlaceId ? t(locale, "otherPaths") : t(locale, "whereDoYouGo")}</h2>
            <div class="place-list">
              ${world.currentPlaceId ? `
                <button class="place-card" data-action="return-council">
                  <strong>${t(locale, "returnCouncil")}</strong>
                  <span>${t(locale, "returnCouncilDetail")}</span>
                  <small>${turnCost(locale, 1)}</small>
                </button>
              ` : ""}
              ${places.filter((place) => place.id !== world.currentPlaceId).map((place) => `
                <button class="place-card" data-place="${place.id}">
                  <strong>${place.name}</strong>
                  <span>${place.tagline}</span>
                  <small>${turnCost(locale, 1)}</small>
                </button>
              `).join("")}
            </div>
          </section>
        </section>

        <aside class="court-column">
          <section class="panel">
            <div class="panel-header">
              <h2>${t(locale, "storyNodes")}</h2>
            </div>
            <div class="node-list">
              ${presentation.storyNodes.map((node) => storyNodeButton(node, selectedStoryNodeId)).join("")}
            </div>
          </section>

          <section class="panel">
            <div class="panel-header">
              <h2>${t(locale, "storyNodeDetails")}</h2>
            </div>
            ${storyNodeDetails(presentation.selectedStoryNode, locale)}
          </section>

          <section class="panel">
            <div class="panel-header">
              <h2>${t(locale, "achievements")}</h2>
            </div>
            <div class="log-list">
              ${world.achievements.length ? world.achievements.map((achievement) => achievementItem(achievement, locale)).join("") : `<p class="muted">${t(locale, "noAchievements")}</p>`}
            </div>
          </section>

          <section class="panel">
            <div class="panel-header">
              <h2>${t(locale, "knownRecord")}</h2>
            </div>
            <div class="log-list">
              ${reading.logs.length ? reading.logs.map((log) => logItem(log, locale)).join("") : `<p class="muted">${t(locale, "noKnownRecord")}</p>`}
            </div>
          </section>
        </aside>
      </section>
    </main>
  `;

  root.querySelectorAll("[data-story-node]").forEach((button) => {
    button.addEventListener("click", () => dispatch({ type: "select-story-node", storyNodeId: button.dataset.storyNode }));
  });
  root.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => dispatch({
      type: "play-action",
      actionId: button.dataset.action,
      storyNodeId: button.dataset.storyNodeTarget,
      storyNodeTitle: button.dataset.storyNodeTitle,
      storyNodeType: button.dataset.storyNodeType,
    }));
  });
  root.querySelectorAll("[data-place]").forEach((button) => {
    button.addEventListener("click", () => dispatch({ type: "visit-place", placeId: button.dataset.place }));
  });
}

function achievementItem(achievement, locale) {
  return `
    <article class="log-item">
      <div>
        <strong>${achievement.title}</strong>
        <span>${t(locale, "unlockedOnTurn")} ${achievement.turn}</span>
      </div>
      <p>${achievement.summary}</p>
    </article>
  `;
}

function achievementCatalog(world, locale) {
  const unlocked = new Map((world.achievements || []).map((achievement) => [achievement.id, achievement]));
  const visible = [
    {
      id: "focused-story-node",
      title: locale === "pt-BR" ? "Focou o fio" : "Focused the Thread",
      summary: locale === "pt-BR"
        ? "Transforme um nó da história em atenção registrada."
        : "Turn a story node into recorded attention.",
      hint: locale === "pt-BR" ? "Use a ação de examinar um nó da história." : "Use the study action on a story node.",
      bonus: locale === "pt-BR" ? "Leitura mais clara de nós da história." : "Clearer story-node reading.",
      hidden: false,
    },
    {
      id: world.generatedFrame.hiddenUnlock.id,
      title: world.generatedFrame.hiddenUnlock.achievementTitle,
      summary: world.generatedFrame.hiddenUnlock.description,
      hint: locale === "pt-BR" ? "Aprenda fora do conselho formal, em lugares e conversas locais." : "Learn outside formal council through places and local conversations.",
      bonus: locale === "pt-BR" ? "Desbloqueia uma conselheira oculta." : "Unlocks a hidden counselor.",
      hidden: false,
    },
  ];
  const hidden = [
    {
      id: "deep-archive",
      title: locale === "pt-BR" ? "Arquivo profundo" : "Deep Archive",
      summary: locale === "pt-BR" ? "Uma conquista futura ligada a evidência e memória institucional." : "A future achievement tied to evidence and institutional memory.",
      hint: locale === "pt-BR" ? "Oculta por enquanto." : "Hidden for now.",
      bonus: locale === "pt-BR" ? "Bônus ainda oculto." : "Bonus still hidden.",
      hidden: true,
    },
  ];
  return [...visible, ...hidden].map((achievement) => ({
    ...achievement,
    unlocked: unlocked.has(achievement.id),
    turn: unlocked.get(achievement.id)?.turn,
  }));
}

function achievementCard(achievement, locale) {
  return `
    <article class="achievement-card${achievement.unlocked ? " unlocked" : ""}${achievement.hidden && !achievement.unlocked ? " hidden-achievement" : ""}">
      <div>
        <strong>${achievement.hidden && !achievement.unlocked ? "???" : achievement.title}</strong>
        <span>${achievement.unlocked ? `${t(locale, "achieved")} / ${t(locale, "turn")} ${achievement.turn}` : t(locale, "notAchieved")}</span>
      </div>
      <p>${achievement.hidden && !achievement.unlocked ? achievement.hint : achievement.summary}</p>
      <small>${t(locale, "requirementHint")}: ${achievement.hint}</small>
      <small>${t(locale, "bonusHint")}: ${achievement.bonus}</small>
    </article>
  `;
}

function traitEditor(key, value, remaining, prince) {
  const min = prince.traitMin ?? 30;
  const max = prince.traitMax ?? 80;
  const canLower = value > min;
  const canRaise = value < max && remaining > 0;
  return `
    <div class="trait-control">
      <span>${traitLabel(key)}</span>
      <div>
        <button data-trait="${key}" data-amount="-5" ${canLower ? "" : "disabled"} aria-label="Lower ${traitLabel(key)}">-</button>
        <strong>${value}</strong>
        <button data-trait="${key}" data-amount="5" ${canRaise ? "" : "disabled"} aria-label="Raise ${traitLabel(key)}">+</button>
      </div>
      <small>${traitHint(key)}</small>
    </div>
  `;
}

function traitTotal(traits) {
  return Object.values(traits).reduce((sum, value) => sum + value, 0);
}

function storyNodeButton(node, selectedStoryNodeId) {
  const selected = node.id === selectedStoryNodeId ? " selected" : "";
  return `
    <button class="node-button${selected}" data-story-node="${node.id}">
      <strong>${node.title}</strong>
      <span>${node.typeLabel} / ${node.subtitle}</span>
    </button>
  `;
}

function storyNodeDetails(node, locale) {
  if (!node) return `<p class="muted">${t(locale, "noStoryNode")}</p>`;
  return `
    <div class="story-node-detail">
      <p class="muted record-heading">${node.typeLabel} / ${node.subtitle}</p>
      ${node.details.map((detail) => `<p>${detail}</p>`).join("")}
      <h3>${t(locale, "relatedRecord")}</h3>
      <div class="log-list">
        ${node.logs.length ? node.logs.map((log) => logItem(log, locale)).join("") : `<p class="muted">${t(locale, "noRelatedRecord")}</p>`}
      </div>
    </div>
  `;
}

function actionComposition(action, locale) {
  const parts = compositionParts(action);
  if (parts.length === 0) return "";
  return `
    <div class="composition-line" aria-label="${t(locale, "actionComposition")}">
      ${parts.map((part) => `<span>${part}</span>`).join('<b>•</b>')}
    </div>
  `;
}

function compositionParts(action) {
  if (action.structural) {
    return [
      action.structural.intent,
      action.structural.channel,
      action.structural.target,
      action.structural.tone,
      action.structural.visibility,
    ].filter(Boolean);
  }
  if (action.kind === "story-node") return ["study", action.storyNodeType, "attention", "memory"];
  if (action.kind === "observation") return ["read", "place", "field", "private"];
  if (action.kind === "conversation") return ["speak", "person", "local", "rumor"];
  if (action.kind === "council") return ["speak", "person", "council", "public"];
  return [];
}

function debugBlock(title, value) {
  return `
    <details class="debug-block" open>
      <summary>${title}</summary>
      <pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>
    </details>
  `;
}

function addDebugToggle(root) {
  root.insertAdjacentHTML("beforeend", `<button class="debug-toggle" data-screen="dashboard" title="Debug">·</button>`);
}

function logItem(log, locale) {
  return `
    <article class="log-item">
      <div>
        <strong>${log.title}</strong>
        <span>${t(locale, "turn")} ${log.turn} / ${visibilityLabel(log.visibility, locale)}</span>
      </div>
      <p>${log.summary}</p>
    </article>
  `;
}

function bindCommon(root, dispatch) {
  root.querySelectorAll("[data-screen]").forEach((button) => {
    button.addEventListener("click", () => dispatch({ type: "set-screen", screen: button.dataset.screen }));
  });
  root.querySelectorAll("[data-reset]").forEach((button) => {
    button.addEventListener("click", () => dispatch({ type: "reset" }));
  });
}

function turnCost(locale, turns) {
  return `${t(locale, "takes")} ${turns} ${turns === 1 ? t(locale, "turnSingular") : t(locale, "turnPlural")}`;
}

function traitLabel(value) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function traitHint(key) {
  return {
    presence: "How quickly a room makes space for you.",
    perception: "How much the scene gives away.",
    composure: "How well pressure fails to hurry you.",
    empathy: "How plainly suffering reaches you.",
    resolve: "How long you stay standing.",
    cunning: "How often motives show their seams.",
    vitality: "How much the body permits the crown.",
  }[key] || "";
}

function visibilityLabel(value, locale) {
  const en = {
    public: "publicly known",
    local: "heard nearby",
    private: "kept close",
    factional: "known in circles",
    institutional: "in official hands",
    hidden: "hidden",
  };
  const pt = {
    public: "conhecimento publico",
    local: "ouvido por perto",
    private: "mantido perto",
    factional: "conhecido em circulos",
    institutional: "em maos oficiais",
    hidden: "oculto",
  };
  return (locale === "pt-BR" ? pt : en)[value] || value;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
