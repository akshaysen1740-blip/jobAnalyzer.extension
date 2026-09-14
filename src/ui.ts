export function renderJobAnalysis(result: any) {
  const container = document.getElementById("app");

  if (!container) {
    return;
  }

  container.innerHTML = `
    <h2>${result.title}</h2>
    <p>${result.company}</p>

    <hr />

    <h3>Experience</h3>
    <p>
      ${result.experience.min ?? "0"} -
      ${result.experience.max ?? "Any"} years
    </p>

    <h3>Qualification</h3>
    <p>${result.qualification ?? "Not specified"}</p>

    <h3>Technologies</h3>
    <ul>
      ${result.technologies
        .map(
          (tech: any) =>
            `<li>${tech.name} ${
              tech.required ? "(Required)" : ""
            }</li>`
        )
        .join("")}
    </ul>

    <h3>Responsibilities</h3>
    <ul>
      ${result.responsibilities
        .map((item: string) => `<li>${item}</li>`)
        .join("")}
    </ul>

    <h3>Requirements</h3>
    <ul>
      ${result.requirements
        .map((item: string) => `<li>${item}</li>`)
        .join("")}
    </ul>
  `;
}