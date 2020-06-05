
import ScatterPlot from "./scatterplot_canvas.js";
import "./polybrush.js";

document.addEventListener("DOMContentLoaded", () => {
    function randomDataGen(n) {
        let dataExample = [];

        for (let i = 0; i < n; i++) {
            const x = Math.floor(Math.random() * 10000) + 1;
            const y = Math.floor(Math.random() * 10000) + 1;
            dataExample.push({ x: x, y: y });
        }

        return (dataExample);
    }

    let final_data = [{
        key: "mainPlot",
        title: "",
        values: randomDataGen(5)
    }];

    let pointsSelected = [];

    function getSelectedPoints(brush, xScale, yScale) {
        final_data[0].values.forEach((d) => {
            console.log(xScale(d.x) + " " + yScale(d.y) + " " + d.x + " " + [d.y]);
            if (brush.isWithinExtent(xScale(d.x), yScale(d.y))) {
                pointsSelected.push(d);
            }
        });
    }

    const scatter = ScatterPlot()
        .width(500)
        .height(500)
        .radius(1)
        .xVar("x")
        .yVar("y")
        .xTitle("xaxis")
        .yTitle("yaxis");

    const draw = () => {
        const charts = d3.select("#scatter")
            .selectAll(".chart")
            .data(final_data);

        charts.enter()
            .append("div")
            .attr("class", "chart")
            .merge(charts)
            .call(scatter);

        charts.exit().remove();

        const brushG = d3.select("#clusterBrushG")

        if (brushG.empty()) {
            const brush = d3.polybrush()
                .x(scatter.xScale())
                .y(scatter.yScale())
                .on("start", () => {
                    pointsSelected = [];
                })
                .on("end", () => {
                    getSelectedPoints(brush, scatter.xScale(), scatter.yScale());
                    console.log(pointsSelected);
                });

            d3.select("#scatter")
                .select(".scatterG")
                .append("g")
                .attr("id", "clusterBrushG")
                .call(brush);
        }
    }

    draw();

    // setTimeout(() => {
    //     console.log('here');
    //     final_data = [{
    //         key: "mainPlot",
    //         title: "",
    //         values: randomDataGen(30)
    //     },
    //     {
    //         key: "secondPlot",
    //         title: "",
    //         values: randomDataGen(5)
    //     }];

    //     draw();
    // }, 3000);

    // setTimeout(() => {
    //     console.log('here 2');
    //     final_data = [
    //     {
    //         key: "secondPlot",
    //         title: "",
    //         values: randomDataGen(30)
    //     }];

    //     draw();
    // }, 6000);
});