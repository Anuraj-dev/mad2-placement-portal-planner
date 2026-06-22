function badgeClass(status) {
  if (status === "done") return "badge text-bg-success";
  if (status === "blocked") return "badge badge-blocked";
  if (status === "in_progress") return "badge badge-soft";
  return "badge badge-pending";
}

function labelize(status) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

const STORAGE_KEY = "placement-planner-progress-v1";

function readProgressState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeProgressState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getDayState(dayNumber) {
  const state = readProgressState();
  return state[`day-${dayNumber}`] || {};
}

function setTaskState(dayNumber, taskIndex, checked) {
  const state = readProgressState();
  const key = `day-${dayNumber}`;
  const current = state[key] || { checkedTasks: {} };
  current.checkedTasks = current.checkedTasks || {};
  current.checkedTasks[String(taskIndex)] = checked;
  state[key] = current;
  writeProgressState(state);
}

function resetDayState(dayNumber) {
  const state = readProgressState();
  delete state[`day-${dayNumber}`];
  writeProgressState(state);
}

function computeDayProgress(day) {
  const stored = getDayState(day.day);
  const checkedTasks = stored.checkedTasks || {};
  const total = day.planned_tasks.length;
  const completed = day.planned_tasks.filter((_, index) => checkedTasks[String(index)]).length;
  const percent = total ? Math.round((completed / total) * 100) : day.percent;
  let status = "not_started";
  if (completed === total && total > 0) {
    status = "done";
  } else if (completed > 0) {
    status = "in_progress";
  }
  if (day.status === "blocked") {
    status = "blocked";
  }
  return { completed, total, percent, status };
}

function computeOverallProgress(days) {
  const totals = days.reduce((acc, day) => {
    const progress = computeDayProgress(day);
    acc.completed += progress.completed;
    acc.total += progress.total;
    return acc;
  }, { completed: 0, total: 0 });

  return totals.total ? Math.round((totals.completed / totals.total) * 100) : 0;
}

function renderSummary(project, days, milestones) {
  document.getElementById("current-focus").textContent = project.current_focus;
  const livePercent = computeOverallProgress(days);
  document.getElementById("overall-percent").textContent = `${livePercent}%`;

  const bar = document.getElementById("overall-progress-bar");
  bar.style.width = `${livePercent}%`;
  bar.textContent = `${livePercent}%`;

  const completedDays = days.filter((day) => computeDayProgress(day).status === "done").length;
  const blockedCount = days.filter((day) => day.status === "blocked").length;
  const activeMilestone = milestones.find((milestone) => milestone.status === "in_progress")?.name || "Not started";

  document.getElementById("summary-stats").innerHTML = `
    <div class="summary-stat">
      <strong>${completedDays}/${project.total_days}</strong>
      <span>Days Done</span>
    </div>
    <div class="summary-stat">
      <strong>${activeMilestone}</strong>
      <span>Active Milestone</span>
    </div>
    <div class="summary-stat">
      <strong>${blockedCount}</strong>
      <span>Blockers</span>
    </div>
  `;
}

function renderProjectSummary(project) {
  const target = document.getElementById("project-summary");
  target.innerHTML = `
    <div class="summary-panel">
      <p class="summary-label mb-2">Project Goal</p>
      <p>${project.goal}</p>
    </div>
    <div class="summary-panel">
      <p class="summary-label mb-2">Build Constraints</p>
      <ul class="mb-0">
        ${project.constraints.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </div>
    <div class="summary-panel">
      <p class="summary-label mb-2">Success Criteria</p>
      <ul class="mb-0">
        ${project.success_criteria.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderWeeks(weeks) {
  const target = document.getElementById("timeline-weeks");
  target.innerHTML = weeks.map((week) => `
    <div class="col-lg-4">
      <article class="week-card">
        <div class="week-header">
          <div>
            <p class="summary-label mb-1">${week.label}</p>
            <h3 class="subsection-title mb-0">${week.focus}</h3>
          </div>
          <div class="week-meta text-end">${week.start_date}<br>${week.end_date}</div>
        </div>
        <p class="body-muted">${week.goal}</p>
        <ul class="mb-0">
          ${week.outputs.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </article>
    </div>
  `).join("");
}

function renderDays(days) {
  const target = document.getElementById("days-grid");
  target.innerHTML = days.map((day) => `
    <article class="day-card">
      <header>
        <div>
          <div class="day-number">Day ${day.day}</div>
          <h3 class="subsection-title mb-1">${day.focus}</h3>
          <div class="day-date">${day.date} · ${day.deliverable}</div>
        </div>
        <span class="${badgeClass(computeDayProgress(day).status)}">${labelize(computeDayProgress(day).status)}</span>
      </header>
      <div class="metric-row">
        <span>${day.mapped_milestone}</span>
        <strong>${computeDayProgress(day).percent}%</strong>
      </div>
      <div class="progress tiny-progress" role="progressbar" aria-label="Day progress">
        <div class="progress-bar" style="width: ${computeDayProgress(day).percent}%"></div>
      </div>
      <div class="day-block">
        <h4>Planned</h4>
        <div class="checklist">
          ${day.planned_tasks.map((task, index) => {
            const checked = Boolean((getDayState(day.day).checkedTasks || {})[String(index)]);
            return `
              <div class="checklist-item ${checked ? "is-checked" : ""}">
                <input
                  class="form-check-input day-task"
                  type="checkbox"
                  id="day-${day.day}-task-${index}"
                  data-day="${day.day}"
                  data-task-index="${index}"
                  ${checked ? "checked" : ""}
                >
                <label for="day-${day.day}-task-${index}">${task}</label>
              </div>
            `;
          }).join("")}
        </div>
      </div>
      <div class="day-block">
        <h4>Done</h4>
        <ul>${day.done_tasks.length ? day.done_tasks.map((task) => `<li>${task}</li>`).join("") : "<li>Update this when work starts.</li>"}</ul>
      </div>
      <div class="day-block">
        <h4>Next</h4>
        <ul>${day.pending_tasks.map((task) => `<li>${task}</li>`).join("")}</ul>
      </div>
      <div class="day-block">
        <h4>Blockers</h4>
        <ul>${day.blockers.length ? day.blockers.map((task) => `<li>${task}</li>`).join("") : "<li>No blockers logged.</li>"}</ul>
      </div>
      <div class="day-actions">
        <span class="tracker-note">Local browser checklist for this day.</span>
        <button class="btn btn-sm btn-outline-secondary reset-day" data-day="${day.day}">Reset day</button>
      </div>
    </article>
  `).join("");
}

function renderMilestones(milestones) {
  const target = document.getElementById("milestones-list");
  target.innerHTML = milestones.map((item) => `
    <article class="stack-item">
      <div class="d-flex justify-content-between gap-2 align-items-start">
        <div>
          <h3>${item.name}</h3>
          <p class="body-muted mb-2">${item.planned_days}</p>
        </div>
        <span class="${badgeClass(item.status)}">${labelize(item.status)}</span>
      </div>
      <div class="progress tiny-progress" role="progressbar" aria-label="${item.name} progress">
        <div class="progress-bar" style="width: ${item.percent}%"></div>
      </div>
      <p class="mb-0"><strong>${item.percent}%</strong> complete</p>
    </article>
  `).join("");
}

function renderRisks(risks) {
  const target = document.getElementById("risks-list");
  target.innerHTML = risks.map((item) => `
    <article class="stack-item">
      <h3>${item.title}</h3>
      <p class="mb-2"><strong>Impact:</strong> ${item.impact}</p>
      <p class="mb-0"><strong>Mitigation:</strong> ${item.mitigation}</p>
    </article>
  `).join("");
}

function renderArchitecture(items) {
  const target = document.getElementById("architecture-grid");
  target.innerHTML = items.map((item) => `
    <article class="info-card">
      <h3>${item.title}</h3>
      <p class="body-muted">${item.summary}</p>
      <ul class="mb-0">${item.points.map((point) => `<li>${point}</li>`).join("")}</ul>
    </article>
  `).join("");
}

function renderModels(models) {
  const target = document.getElementById("models-grid");
  target.innerHTML = models.map((model) => `
    <article class="model-card">
      <h3>${model.name}</h3>
      <p class="body-muted">${model.purpose}</p>
      <ul class="mb-2">${model.key_fields.map((field) => `<li>${field}</li>`).join("")}</ul>
      <p class="mb-0"><strong>Relations:</strong> ${model.relations}</p>
    </article>
  `).join("");
}

function renderApi(groups) {
  const target = document.getElementById("api-grid");
  target.innerHTML = groups.map((group) => `
    <div class="col-lg-6 col-xxl-4">
      <article class="api-card h-100">
        <h3>${group.group}</h3>
        <p class="body-muted">${group.summary}</p>
        <ul class="mb-0">
          ${group.routes.map((route) => `<li><code>${route.method}</code> ${route.path} - ${route.purpose}</li>`).join("")}
        </ul>
      </article>
    </div>
  `).join("");
}

function renderAcceptance(items) {
  const target = document.getElementById("acceptance-list");
  target.innerHTML = items.map((item) => `
    <div class="col-lg-6">
      <article class="acceptance-card h-100">
        <h3>${item.title}</h3>
        <ul class="mb-0">${item.points.map((point) => `<li>${point}</li>`).join("")}</ul>
      </article>
    </div>
  `).join("");
}

function bindTrackerEvents(data) {
  document.querySelectorAll(".day-task").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      const dayNumber = Number(event.target.dataset.day);
      const taskIndex = Number(event.target.dataset.taskIndex);
      setTaskState(dayNumber, taskIndex, event.target.checked);
      rerender(data);
    });
  });

  document.querySelectorAll(".reset-day").forEach((button) => {
    button.addEventListener("click", () => {
      resetDayState(Number(button.dataset.day));
      rerender(data);
    });
  });
}

function rerender(data) {
  renderSummary(data.project, data.days, data.milestones);
  renderProjectSummary(data.project);
  renderWeeks(data.weeks);
  renderDays(data.days);
  renderMilestones(data.milestones);
  renderRisks(data.risks);
  renderArchitecture(data.architecture);
  renderModels(data.models);
  renderApi(data.api_groups);
  renderAcceptance(data.acceptance_checks);
  bindTrackerEvents(data);
}

async function main() {
  try {
    const response = await fetch("progress.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Unable to load progress.json (${response.status})`);
    }

    const data = await response.json();
    rerender(data);
  } catch (error) {
    document.getElementById("project-summary").innerHTML = `
      <div class="summary-panel">
        <p class="mb-0"><strong>Failed to load planner data.</strong> ${error.message}</p>
      </div>
    `;
  }
}

main();
