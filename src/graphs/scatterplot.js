// modified from mike freeman's code on reusability
// https://github.com/info474-s17/m15-reusability/tree/complete/demo-4

import * as d3 from "d3";

export default function ScatterPlot() {
    // Set default values
    let height = 500,
        width = 500,
        xScale = d3.scaleLinear(),
        yScale = d3.scaleLinear(),
        fillScale = "",
        fillVar = "",
        xTitle = 'x axis',
        yTitle = 'y axis',
        xVar = "",
        yVar = "",
        title = 'Chart title',
        constrainAxes = null,
        radius = 2,
        margin = {
            left: 70,
            bottom: 50,
            top: 30,
            right: 10,
        };

    // Function returned by ScatterPlot
    function chart(selection) {
        // Height/width of the drawing area itself
        const chartHeight = height - margin.bottom - margin.top;
        const chartWidth = width - margin.left - margin.right;

        // Iterate through selections, in case there are multiple
        selection.each(function(data) {
            // set up title
            title = data.title;

            if (data.type === "expression") {
                fillVar = "expression";
                fillScale = data.fillScale;
            }


            // Use the data-join to create the svg (if necessary)
            const ele = d3.select(this);

            const svg = ele.selectAll("svg").data([data.values]);

            // Append static elements (i.e., only added once)
            const svgEnter = svg.enter()
                .append("svg")
                .attr('width', width)
                .attr("height", height);
            
            // Title G
            svgEnter.append('text')
                .attr('transform', 'translate(' + (margin.left + chartWidth / 2) + ',' + 30 + ')')
                .text(title)
                .attr('class', 'chart-title')
                .style('text-anchor', 'middle')

            // g element for markers
            svgEnter.append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
                .attr("class", 'scatterG');

            // Append axes to the svgEnter element
            svgEnter.append('g')
                .attr('transform', 'translate(' + margin.left + ',' + (chartHeight + margin.top) + ')')
                .attr('class', 'axis x');

            svgEnter.append('g')
                .attr('transform', 'translate(' + margin.left + ',' + (margin.top) + ')')
                .attr('class', 'axis y')

            // Add a title g for the x axis
            svgEnter.append('text')
                .attr('transform', 'translate(' + (margin.left + chartWidth / 2) + ',' + (chartHeight + margin.top + 40) + ')')
                .attr('class', 'axis-title x');

            // Add a title g for the y axis
            svgEnter.append('text')
                .attr('transform', 'translate(' + (margin.left - 40) + ',' + (margin.top + chartHeight / 2) + ') rotate(-90)')
                .attr('class', 'axis-title y');

            // Define xAxis and yAxis functions
            const xAxis = d3.axisBottom();
            const yAxis = d3.axisLeft();

            // Calculate x and y scales
            let axesData = null;
            if (constrainAxes != null) {
                axesData = constrainAxes;
            } else {
                axesData = data.values;
            }

            function makePaddedDomain(valExtent, padScale) {
                const valRange = Math.abs(valExtent[1] - valExtent[0])

                const paddedDomain = [valExtent[0] - (valRange * padScale), valExtent[1] + (valRange * padScale)]
                return(paddedDomain);
            }

            const padScale = 0.1;

            const xExtent = d3.extent(axesData, (d) => +d[xVar]);
            xScale.range([0, chartWidth]).domain(makePaddedDomain(xExtent, padScale));

            const yExtent = d3.extent(axesData, (d) => +d[yVar]);
            yScale.range([chartHeight, 0]).domain(makePaddedDomain(yExtent, padScale));

            // Update axes
            xAxis.scale(xScale);
            yAxis.scale(yScale);
            ele.select('.axis.x').transition().duration(1000).call(xAxis);
            ele.select('.axis.y').transition().duration(1000).call(yAxis);

            // Update titles
            ele.select('.axis-title.x').text(xTitle);
            ele.select('.axis-title.y').text(yTitle);

            // Draw markers
            const circles = ele.select('.scatterG').selectAll('circle').data(data.values, (d) => d["barcode"]);

            // Use the .enter() method to get entering elements, and assign initial position
            circles.join(
                enter => enter.append('circle')
                    .attr('fill', (d) => fillScale(d[fillVar]))
                    .style('opacity', .8)
                    .attr('cx', (d) => xScale(d[xVar]))
                    .attr('cy', (d) => yScale(d[yVar]))
                    .attr('r', radius)
                    .attr("id", (d) => d.barcode),
                update => update
                    // .style('opacity', .8)
                    .attr('cx', (d) => xScale(d[xVar]))
                    .attr('cy', (d) => yScale(d[yVar])),
                // exit => exit.remove()
            );
            
            // circles.enter().append('circle')
            //     .attr('fill', (d) => fillScale(d[fillVar]))
            //     .style('opacity', .2)
            //     .attr('cx', (d) => xScale(d[xVar]))
            //     .attr('cy', (d) => yScale(d[yVar]))
            //     .attr('r', radius)
            //     .attr("id", (d) => d.barcode)
            //     // .attr("class", ".selected")
            //     // Transition properties of the + update selections
            //     .merge(circles)
            //     // .transition()
            //     // .duration(2000)
            //     // .delay((d) => xScale(d.x) * 5)
            //     .style('opacity', .8);

            // // Use the .exit() and .remove() methods to remove elements that are no longer in the data
            // circles.exit().remove();
        });
    }

    // Getter/setter methods to change locally scoped options
    chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
    };

    chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
    };

    chart.xTitle = function(value) {
        if (!arguments.length) return xTitle;
        xTitle = value;
        return chart;
    };

    chart.yTitle = function(value) {
        if (!arguments.length) return yTitle;
        yTitle = value;
        return chart;
    };
    chart.radius = function(value) {
        if (!arguments.length) return radius;
        radius = value;
        return chart;
    };
    chart.xVar = function(value) {
        if (!arguments.length) return xVar;
        xVar = value;
        return chart;
    };
    chart.yVar = function(value) {
        if (!arguments.length) return yVar;
        yVar = value;
        return chart;
    };
    chart.xScale = function(value) {
        if (!arguments.length) return xScale;
        xScale = value;
        return chart;
    };
    chart.yScale = function(value) {
        if (!arguments.length) return yScale;
        yScale = value;
        return chart;
    };
    chart.fillVar = function(value) {
        if (!arguments.length) return fillVar;
        fillVar = value;
        return chart;
    };
    chart.fillScale = function(value) {
        if (!arguments.length) return fillScale;
        fillScale = value;
        return chart;
    };
    chart.constrainAxes = function(value) {
        if (!arguments.length) return constrainAxes;
        constrainAxes = value;
        return chart;
    };
    return chart;
}