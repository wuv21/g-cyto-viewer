// WORK IN PROGRESS
// Not a reusable chart yet
// Modified from https://observablehq.com/@d3/kernel-density-estimation

const margin = ({top: 20, right: 30, bottom: 30, left: 40});
const height = 300;
const width = 300;

function kde(kernel, thresholds, data) {
  return thresholds.map(t => [t, d3.mean(data, d => kernel(t - d))]);
}

function epanechnikov(bandwidth) {
  return x => Math.abs(x /= bandwidth) <= 1 ? 0.75 * (1 - x * x) / bandwidth : 0;
}

const dataByCluster = {};
this.dataTsneExpression[0].values.forEach((v) => {
    if (v.cluster in dataByCluster) {
        dataByCluster[v.cluster].push(v.expression);
    } else {
        dataByCluster[v.cluster] = [v.expression];
    }
});

const data = dataByCluster["5"];

const x = d3.scaleLinear()
  .domain(d3.extent(data)).nice()
  .range([margin.left, width - margin.right])

const bandwidth = 1.0;
const thresholds = x.ticks(50);
const density = kde(epanechnikov(bandwidth), thresholds, data);

const bins = d3.histogram()
  .domain(x.domain())
  .thresholds(thresholds)(data)

const y = d3.scaleLinear()
  // .domain([0, 5 * d3.max(bins, d => d.length) / data.length])
  .domain([0, 1.1 * d3.max(density, (d) => {return d[1]})])
  .range([height - margin.bottom, margin.top])

const line = d3.line()
  .curve(d3.curveBasis)
  .x(d => x(d[0]))
  .y(d => y(d[1]))

const xAxis = g => g
  .attr("transform", `translate(0,${height - margin.bottom})`)
  .call(d3.axisBottom(x))
  .call(g => g.append("text")
      .attr("x", width - margin.right)
      .attr("y", -6)
      .attr("fill", "#000")
      .attr("text-anchor", "end")
      .attr("font-weight", "bold")
      .text(data.title))

const yAxis = g => g
  .attr("transform", `translate(${margin.left},0)`)
  .call(d3.axisLeft(y).ticks(null, "%"))
  .call(g => g.select(".domain").remove())

const svg = d3.select("#ridgePlotExpression")
  .append("svg")
  .attr('width', width)
  .attr("height", height);

svg.append("g")
  .attr("fill", "#bbb")
  .selectAll("rect")
  .data(bins)
  .join("rect")
    .attr("x", d => x(d.x0) + 1)
    .attr("y", d => y(d.length / data.length))
    .attr("width", d => x(d.x1) - x(d.x0))
    .attr("height", d => y(0) - y(d.length / data.length));

svg.append("path")
    .datum(density)
    .attr("fill", "none")
    .attr("stroke", "#000")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("d", line);

svg.append("g")
    .call(xAxis);

svg.append("g")
    .call(yAxis);
}