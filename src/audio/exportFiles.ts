function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function escapeCsv(value: string | number): string {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function downloadCsv(filename: string, header: readonly string[], rows: readonly (readonly (string | number)[])[]): void {
  const text = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
  downloadBlob(new Blob([text], { type: 'text/csv;charset=utf-8' }), filename)
}

/** Downloads a self-contained SVG with the simulator's plot styling embedded. */
export function downloadSvg(elementId: string, filename: string): void {
  const source = document.getElementById(elementId)
  if (!(source instanceof SVGElement)) throw new Error(`Could not find SVG plot "${elementId}".`)
  const svg = source.cloneNode(true) as SVGElement
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent = `
    .plot-grid-lines line { stroke: #dce7f3; stroke-width: 1; }
    .plot-axis-line { stroke: #9cb4cf; stroke-width: 1.1; }
    .plot-zero-line { stroke: #b2c6dd; stroke-dasharray: 4 4; stroke-width: 1; }
    .response-line { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2.25; vector-effect: non-scaling-stroke; }
    .axis-text { fill: #7890ad; font-family: monospace; font-size: 17px; }
  `
  svg.prepend(style)
  downloadBlob(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' }), filename)
}
