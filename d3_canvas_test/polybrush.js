/*
Copyright (c) 2012 Geoffrey T. Bell

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// Modified from http://bl.ocks.org/junwang23/bfcf242c09f0aaa0d6a27cdc84285a8e

// import * as d3 from "d3";

(function(d3) {
    d3.polybrush = function() {
        const dispatch = d3.dispatch("start", "brush", "end");

        let el = null,
            x = null,
            y = null,
            extent = [],
            firstClick = true,
            firstTime = true,
            wasDragged = false,
            origin = null

        const line = d3.line()
            .x((d) => d[0])
            .y((d) => d[1]);

        function brush(g) {
            el = g;
            g.each(function() {
                const g = d3.select(this)
                    .style("pointer-events", "all")
                    .on("click.brush", addAnchor);

                const bg = g.selectAll(".background")
                    .data([0]).enter()
                    .append("rect")
                    .attr("class", "background")
                    .style("visibility", "hidden")
                    .style("cursor", "crosshair");

                g.selectAll(".extent")
                    .data([extent]).enter()
                    .append("path")
                    .attr("class", "extent")
                    .attr("opacity", 0.2)
                    .style("cursor", "move");

                if (x) {
                    const e = scaleExtent(x.range());
                    bg.attr("x", e[0]).attr("width", e[1] - e[0]);
                }
                if (y) {
                    const e = scaleExtent(y.range());
                    bg.attr("y", e[0]).attr("height", e[1] - e[0]);
                }
            });
        }

        function drawPath() {
            return el.each(function() {
                d3.select(this)
                    .selectAll("g path").attr("d", function(d) {
                        return line(d) + "Z";
                    });
            });
        }

        function scaleExtent(domain) {
            const start = domain[0];
            const stop = domain[domain.length - 1];
            if (start < stop) {
                return [start, stop];
            } else {
                return [stop, start];
            }
        }

        function withinBounds(point) {
            const rangeX = scaleExtent(x.range());
            const rangeY = scaleExtent(y.range());
            const _x = Math.max(rangeX[0], Math.min(rangeX[1], point[0]));
            const _y = Math.max(rangeY[0], Math.min(rangeY[1], point[1]));

            return point[0] === _x && point[1] === _y;
        }

        function moveAnchor(target) {
            const point = d3.mouse(target);
            if (firstTime) {
                extent.push(point);
                firstTime = false;
            } else {
                if (withinBounds(point)) {
                    extent.splice(extent.length - 1, 1, point);
                }
                drawPath();
                dispatch.call("brush", this);
            }
        }

        function closePath() {
            const w = d3.select(window);
            w.on("dblclick.brush", null).on("mousemove.brush", null);

            firstClick = true;
            if (extent.length === 2 && extent[0][0] === extent[1][0] && extent[0][1] === extent[1][1]) {
                extent.splice(0, extent.length);
            }

            d3.select(".extent").on("mousedown.brush", moveExtent);
            
            return dispatch.call("end", this);
        }

        function addAnchor() {
            const _this = this;
            const w = d3.select(window);
            firstTime = true;

            if (wasDragged) {
                wasDragged = false;
                return;
            }
            if (firstClick) {
                extent.splice(0, extent.length);
                firstClick = false;
                
                d3.select(".extent").on("mousedown.brush", null);
                
                w.on("mousemove.brush", () => moveAnchor(_this))
                    .on("dblclick.brush", closePath);

                dispatch.call("start", this);
            }
            if (extent.length > 1) {
                extent.pop();
            }
            extent.push(d3.mouse(this));
            return drawPath();
        }

         function dragExtent(target) {
            const point = d3.mouse(target);
            const scaleX = point[0] - origin[0];
            const scaleY = point[1] - origin[1];
            let fail = false;

            origin = point;
            
            function updateExtentPoint(p) {
                p[0] += scaleX;
                p[1] += scaleY;
            }

            extent.forEach((p) => {
                updateExtentPoint(p);
            });

            function checkBounds(p) {
                if (!withinBounds(p)) {
                    fail = true;
                }
                return fail;
            }

            extent.forEach((p) => {
                checkBounds(p);
            });

            if (fail) {
                return;
            }

            drawPath();
            return dispatch.call("brush", this, {
                mode: "move"
            });
        }

        function dragStop() {
            var w;
            w = d3.select(window);
            w.on("mousemove.brush", null).on("mouseup.brush", null);
            wasDragged = true;
            return dispatch.call("end", this);
        }

        function moveExtent() {
            var _this = this;
            d3.event.stopPropagation();
            d3.event.preventDefault();
            if (firstClick && !brush.empty()) {
                d3.select(window).on("mousemove.brush", function() {
                    return dragExtent(_this);
                }).on("mouseup.brush", dragStop);
                origin = d3.mouse(this);
            }
        }

        brush.isWithinExtent = function(x, y) {
            return d3.polygonContains(extent, [x, y]);
        };

        brush.x = function(z) {
            if (!arguments.length) {
                return x;
            }
            x = z;
            return brush;
        };

        brush.y = function(z) {
            if (!arguments.length) {
                return y;
            }
            y = z;
            return brush;
        };

        brush.extent = function(z) {
            if (!arguments.length) {
                return extent;
            }
            extent = z;
            return brush;
        };

        brush.clear = function() {
            extent.splice(0, extent.length);
            return brush;
        };
        
        brush.empty = function() {
            return extent.length === 0;
        };

        brush.on = function(typename, callback) {
            dispatch.on(typename, callback);
            return brush;
        };

        return brush;
    };
})(d3);