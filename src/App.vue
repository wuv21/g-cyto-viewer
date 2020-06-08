<template>
  <v-app id="gCytoViewer">
    <v-navigation-drawer v-model="drawerRight" app clipped right>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="title">Antibodies</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <v-list-item>
        <v-text-field
          class="mt-5"
          v-model="absSearch"
          label="Search for abs"
          v-show="abs.length != 0"
          dense
          clearable
        ></v-text-field>
      </v-list-item>

      <v-list dense>
        <v-list-item-group v-model="selAbs" :multiple="true" color="indigo">
          <draggable
            v-model="abs"
            :options="{group: {name:'test', pull:'clone', put:false}, sort: false}"
            style="min-height:10px"
          >
            <v-list-item v-for="(ab, i) in abs" :key="`ab-${i}`" v-show="absDisplayBool[i]">
              <v-list-item-content>
                <v-list-item-title v-text="ab"></v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </draggable>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app clipped-right :color="headerFooterColor" dark>
      <v-toolbar-title>{{title}}</v-toolbar-title>
      <v-spacer />
      <v-app-bar-nav-icon @click.stop="drawerRight = !drawerRight" />
    </v-app-bar>

    <v-content>
      <v-container fluid>
        <v-row>
          <v-col cols="4">
            <v-file-input
              name="hi"
              accept=".tsv"
              label="Upload TSV data file"
              @change="onFileChange"
            ></v-file-input>

            <div v-show="showSpinner">
              <v-progress-circular
                indeterminate
              ></v-progress-circular>
              <p class="caption">Loading...please wait</p>
            </div>


            <div v-show="abs.length != 0">
              <v-chip class="ma-2" color="indigo" text-color="white">
                <v-avatar left>
                  <v-icon>mdi-flask-empty</v-icon>
                </v-avatar>
                {{abs.length}} antibodies
              </v-chip>

              <v-chip class="ma-2" color="teal" text-color="white">
                <v-avatar left>
                  <v-icon>mdi-checkbox-blank-circle-outline</v-icon>
                </v-avatar>
                {{orgDataClean.length}} cells
              </v-chip>
            </div>
          </v-col>

          <v-col v-show="abs.length != 0" cols="8" text-center justify-center>
            <p class="title mb-0">Dashboard settings</p>
            <v-row>
              <v-col cols="6">
                <p class="subtitle-2 mb-0">Random cell filter</p>
                <p class="caption">Recommended to de-select all antibodies first.</p>
                <v-slider
                  v-model="cellsUsed"
                  class="align-center"
                  :max="orgDataClean.length"
                  min="0"
                  hide-details
                >
                  <template v-slot:append>
                    <v-text-field
                      v-model="cellsUsed"
                      class="ma-0 pa-0"
                      hide-details
                      single-line
                      :max="orgDataClean.length"
                      min="0"
                      type="number"
                      style="width: 5em;"
                    ></v-text-field>
                  </template>
                </v-slider>
              </v-col>

              <v-col cols="3">
                <p class="subtitle-2">Dimension reduction method</p>
                <v-select
                  outlined
                  :items="dimMethods"
                  v-model="dimMethodSel"
                  dense
                  label="Select method"
                ></v-select>
              </v-col>

              <!-- <v-col cols="3">
                <p class="subtitle-2">Cluster color (beta)</p>
                <v-select outlined disabled dense label="Select coloring"></v-select>
              </v-col> -->
            </v-row>
          </v-col>
        </v-row>

        <v-row align="start" justify="space-around" v-show="abs.length != 0">
          <v-col cols="6" text-center justify-center>
            <p class="title mb-0">Colored by cluster</p>
            <p
              class="caption"
            >Click on graph to place anchors for gating. Double click to finish. Drag gate. | Click outside to draw new gate.</p>
            <p class="subtitle-2">Polygonal gate details</p>
            <p
              class="caption"
            >Current polygonal gate: {{dataPolyGate.length}} cells selected of {{cellsUsed}} cells</p>
            <div id="mainScatter"></div>
          </v-col>

          <v-col cols="6">
            <p class="title mb-0">Polygonal gate</p>
            <p class="caption">Drag and drop antibodies from right panel to the below boxes.</p>
            <v-row>
              <v-col cols="6">
                <v-card class="mx-auto" outlined>
                  <v-card-subtitle class="pb-0">x-axis antibody</v-card-subtitle>
                  <draggable
                    v-model="polyGateXAb"
                    :options="{group: {name:'test', pull:'clone'}, sort: false}"
                    style="min-height: 15px"
                  >
                    <v-card-text v-for="(ab, i) in polyGateXAb" :key="`x-${i}`" class="py-2">
                      <div v-text="ab"></div>
                    </v-card-text>
                  </draggable>
                </v-card>
              </v-col>

              <v-col cols="6">
                <v-card class="mx-auto" outlined>
                  <v-card-subtitle class="pb-0">y-axis antibody</v-card-subtitle>
                  <draggable
                    v-model="polyGateYAb"
                    :options="{group: {name:'test', pull:'clone'}, sort: false}"
                    style="min-height: 15px"
                  >
                    <v-card-text v-for="(ab, i) in polyGateYAb" :key="`y-${i}`" class="py-2">
                      <div v-text="ab"></div>
                    </v-card-text>
                  </draggable>
                </v-card>
              </v-col>
            </v-row>

            <div id="polyGateScatter"></div>
          </v-col>
        </v-row>

        <v-row v-show="abs.length != 0">
          <v-col v-show="abs.length != 0" text-center justify-center>
            <p class="title">Colored by scaled expression level</p>

            <v-col cols="6" class="pl-0 pt-0">
              <v-switch label="Enable threshold filter" v-model="enableThresh"></v-switch>
              <v-slider
                v-model="expThresh"
                label="Threshold"
                hint="Select antibodies on right panel. Can enable minimum threshold filter to increase app responsiveness."
                persistent-hint
                thumb-label="always"
                :thumb-size="24"
                :disabled="!enableThresh"
                :min="minThresh"
                :max="maxThresh"
                step="0.1"
                type="number"
              ></v-slider>
            </v-col>

            <div id="expressionScatter"></div>
          </v-col>
        </v-row>
      </v-container>
    </v-content>

    <v-footer app :color="headerFooterColor" class="white--text">
      <span>Vincent Wu | Betts Lab</span>
      <v-spacer />
      <span>Updated 2020.06.05</span>
    </v-footer>
  </v-app>
</template>

<script>
import "@mdi/font/css/materialdesignicons.css";
import draggable from "vuedraggable";
import * as d3 from "d3";
import _ from "lodash";
import ScatterPlot from "./graphs/scatterplot_canvas.js";
import "./graphs/polybrush.js";

export default {
  name: "gCytoViewer",
  icons: {
    iconfont: "mdi"
  },
  components: { draggable: draggable },
  data: () => ({
    drawerRight: null,
    title: "gCytoViewer",
    headerFooterColor: "blue-grey",
    dataFile: null,
    header: [],
    abs: [],
    selAbs: [],
    absSearch: null,
    absDisplayBool: [],
    dataCite: [],
    orgDataClean: [],
    currentDataClean: [],
    currentDataCleanExpression: [],
    dataPolyGate: [],
    polyGateXAb: [],
    polyGateYAb: [],
    polyGateBrush: null,
    mainScatterXScale: null,
    mainScatterYScale: null,
    fillScales: [],
    clusterScale: null,
    absDensities: [],
    enableThresh: false,
    expThresh: 0,
    minThresh: 0,
    maxThresh: 2,
    cellsUsed: 0,
    dimMethods: [],
    dimMethodSel: null,
    showSpinner: false
  }),
  watch: {
    dataFile(d) {
      // reset orgDataClean if file changes...
      // TODO make a better reset...
      // this.orgDataClean = [];

      let dMat = d.split("\n");
      this.header = dMat[0].split("\t");

      dMat = _.map(dMat, x => {
        return x.split("\t");
      });

      // check last row
      if (dMat[dMat.length - 1].length == 1) {
        dMat.pop();
      }

      const getNth = function(arrayList, n, h) {
        const allNth = [];

        arrayList.forEach(a => {
          if (h === "barcode") {
            allNth.push(a[n]);
          } else {
            if (isNaN(a[n])){
              allNth.push(a[n]);
            } else {
              allNth.push(parseFloat(a[n]));
            }
          }
        });

        return allNth;
      };

      // reformat
      this.header.forEach((h, i) => {
        this.dataCite[h] = getNth(dMat.slice(1, dMat.length), i, h);
      });

      // get abs
      const metaInfoTags = ["barcode", "cluster", "tSNE_1", "tSNE_2"];
      const axisCols = _.filter(this.header, i => /^(xaxis|yaxis)/.test(i));

      this.abs = _.without(this.header, ...metaInfoTags.concat(axisCols));
      this.absDisplayBool = Array(this.abs.length).fill(true);

      // find available dim methods
      this.dimMethods = _.chain(axisCols)
        .map(x => x.replace(/^(xaxis|yaxis)_/, ""))
        .uniq()
        .value();

      // set default dimMethod
      this.dimMethodSel = this.dimMethods[0];

      // reformat to d3 friendly
      const dataCiteKeys = Object.keys(this.dataCite);
      for (let i = 0; i < this.dataCite["barcode"].length; i++) {
        const d = {};
        dataCiteKeys.forEach(x => {
          d[x] = this.dataCite[x][i];
        });
        this.orgDataClean.push(d);
      }

      // set default to full dataset
      this.currentDataClean = this.orgDataClean;

      // precalculate d3 scales
      this.abs.forEach(a => {
        const minAb = _.min(this.dataCite[a]);
        const maxAb = _.max(this.dataCite[a]);

        // fill scale
        this.fillScales[a] = d3
          .scaleSequential(d3.interpolateReds)
          .domain([minAb, maxAb]);
      });

      // precalculate cluster scale
      const uniq_clusts = _.uniq(
        _.map(this.currentDataClean, d => {
          return d.cluster;
        })
      );

      this.clusterScale = d3.scaleOrdinal(d3.schemePaired).domain(uniq_clusts);

      // save other settings
      this.cellsUsed = this.currentDataClean.length;

      this.makeMainScatter();

      this.showSpinner = false;
    },

    selAbs() {
      this.makeExpressionScatterData();
      this.makeExpressionScatter();
    },

    enableThresh() {
      if (this.selAbs.length != 0) {
        this.makeExpressionScatterData();
        this.makeExpressionScatter();
      }
    },

    expThresh() {
      if (this.selAbs.length != 0) {
        this.makeExpressionScatterData();
        this.makeExpressionScatter();
      }
    },

    cellsUsed(newVal, prevVal) {
      if (newVal != prevVal) {
        if (this.cellsUsed == this.currentDataClean.length) {
          this.currentDataClean = this.orgDataClean;
        } else {
          this.currentDataClean = this.getRandomNFromArray(
            this.orgDataClean,
            this.cellsUsed
          );
        }

        this.makeMainScatter();
        this.makeExpressionScatterData();
        this.makeExpressionScatter();

        if (this.dataPolyGate.length > 0) {
          this.updatePolyGate(this.polyGateBrush, this.mainScatterXScale, this.mainScatterYScale);
        }
      }

      if (
        this.dataPolyGate.length > 0 &&
        this.polyGateXAb.length == 1 &&
        this.polyGateYAb.length == 1
      ) {
        this.updatePolyGate(this.polyGateBrush, this.mainScatterXScale, this.mainScatterYScale);
      }
    },

    dataPolyGate() {
      if (
        this.dataPolyGate.length > 0 &&
        this.polyGateXAb.length == 1 &&
        this.polyGateYAb.length == 1
      ) {
        this.makePolyGateScatter();
      }
    },

    polyGateXAb(newVal, prevVal) {
      this.polyGateXAb = this.checkPolyGateAb(prevVal, newVal);

      if (this.dataPolyGate.length > 0 && this.polyGateYAb.length == 1) {
        this.makePolyGateScatter();
      }
    },

    polyGateYAb(newVal, prevVal) {
      this.polyGateYAb = this.checkPolyGateAb(prevVal, newVal);

      if (this.dataPolyGate.length > 0 && this.polyGateXAb.length == 1) {
        this.makePolyGateScatter();
      }
    },

    dimMethodSel() {
      if (this.polyGateBrush) {
        if (this.dataPolyGate.length > 0) {
          this.dataPolyGate = [];
          d3.select(".polyGateScatter").remove();
        }

        d3.select("#clusterBrushG").remove();
        d3.select("#mainScatter")
          .selectAll("circle")
          .classed("selected", false);
      }

      this.makeMainScatter();

      if (this.selAbs.length > 0) {
        this.makeExpressionScatterData();
        this.makeExpressionScatter();
      }
    },

    absSearch() {
      if (this.absSearch === null || this.absSearch == "") {
        this.absDisplayBool = Array(this.abs.length).fill(true);
      } else {
        this.absDisplayBool = _.map(this.abs, x => {
          return x.toLowerCase().indexOf(this.absSearch.toLowerCase()) !== -1;
        });
      }
    }
  },
  methods: {
    onFileChange(e) {
      this.showSpinner = true;

      const reader = new FileReader();
      reader.onload = event => {
        this.dataFile = event.target.result;
      };

      reader.readAsText(e);
    },

    makeMainScatter() {
      const final_data = [
        {
          key: "mainPlot",
          title: "",
          type: "cluster",
          values: this.currentDataClean
        }
      ];

      const scatter = ScatterPlot()
        // .width(600)...since using legend, will auto calculate width
        .height(500)
        .radius(1)
        .xVar("xaxis_" + this.dimMethodSel)
        .yVar("yaxis_" + this.dimMethodSel)
        .xTitle(this.dimMethodSel + " 1")
        .yTitle(this.dimMethodSel + " 2")
        .fillVar("cluster")
        .fillScale(this.clusterScale)
        .legend(true);

      const draw = () => {
        const charts = d3
          .select("#mainScatter")
          .selectAll(".chart")
          .data(final_data);

        charts
          .enter()
          .append("div")
          .attr("class", "chart")
          .merge(charts)
          .call(scatter);

        charts.exit().remove();

        const brushG = d3.select("#clusterBrushG");

        if (brushG.empty()) {
          const brush = d3
            .polybrush()
            .x(scatter.xScale())
            .y(scatter.yScale())
            .on("start", () => {
              this.dataPolyGate = [];
            })
            .on("end", () => {
              this.updatePolyGate(brush, scatter.xScale(), scatter.yScale());
            });

          d3.select("#mainScatter")
            .select(".scatterG")
            .append("g")
            .attr("id", "clusterBrushG")
            .call(brush);

          this.polyGateBrush = brush;
          this.mainScatterXScale = scatter.xScale();
          this.mainScatterYScale = scatter.yScale();
        }
      };

      draw();
    },

    updatePolyGate(brush, xScale, yScale) {
      const dataTemp = [];
      const xvar = "xaxis_" + this.dimMethodSel;
      const yvar = "yaxis_" + this.dimMethodSel;

      this.currentDataClean.forEach(d => {
        if (brush.isWithinExtent(xScale(d[xvar]), yScale(d[yvar]))) {
          dataTemp.push(d);
        }
      });

      this.dataPolyGate = dataTemp;
    },

    makeExpressionScatterData() {
      // TODO optimize this filtering step...set a previous state flag to avoid continously creating new objects
      this.currentDataCleanExpression = _.map(this.selAbs, a => {
        const d = {
          type: "expression",
          key: a,
          title: this.abs[a],
          fillScale: this.fillScales[this.abs[a]]
        };

        let data_ref = this.currentDataClean;
        if (this.enableThresh) {
          const currentDataCleanFilt = _.filter(this.currentDataClean, d => {
            return d[this.abs[a]] >= this.expThresh;
          });

          data_ref = currentDataCleanFilt;
        }

        const xaxis = "xaxis_" + this.dimMethodSel;
        const yaxis = "yaxis_" + this.dimMethodSel;

        d.values = _.map(data_ref, d => {
          const new_d = {
            barcode: d.barcode,
            ab: this.abs[a],
            cluster: d.cluster,
            expression: d[this.abs[a]]
          };

          new_d[xaxis] = d[xaxis];
          new_d[yaxis] = d[yaxis];

          return new_d;
        });

        return d;
      });
    },

    makeExpressionScatter() {
      const scatter = ScatterPlot()
        .width(275)
        .height(275)
        .radius(0.5)
        .constrainAxes(this.currentDataClean)
        .xVar("xaxis_" + this.dimMethodSel)
        .yVar("yaxis_" + this.dimMethodSel)
        .xTitle(this.dimMethodSel + " 1")
        .yTitle(this.dimMethodSel + " 2");

      const draw = function(data) {
        const charts = d3
          .select("#expressionScatter")
          .selectAll(".chartexpressionScatter")
          .data(data, d => {
            return d.key;
          });

        charts
          .enter()
          .append("div")
          .attr("class", "chartexpressionScatter")
          .merge(charts)
          .call(scatter);

        charts.exit().remove();
      };

      draw(this.currentDataCleanExpression);
    },

    checkPolyGateAb(prevVal, newVal) {
      if (newVal.length > 1) {
        if (newVal[0] == prevVal[0]) {
          return [newVal[1]];
        } else {
          return [newVal[0]];
        }
      }

      return newVal;
    },

    makePolyGateScatter() {
      const final_data = [
        {
          key: "polygate-" + this.polyGateXAb[0] + this.polyGateYAb[0],
          title: "",
          type: "cluster",
          values: this.dataPolyGate
        }
      ];

      const scatter = ScatterPlot()
        .width(400)
        .height(400)
        .radius(1.5)
        .xVar(this.polyGateXAb[0])
        .yVar(this.polyGateYAb[0])
        .constrainAxes(this.currentDataClean)
        .xTitle(this.polyGateXAb[0])
        .yTitle(this.polyGateYAb[0])
        .fillVar("cluster")
        .fillScale(this.clusterScale);

      const draw = function(data) {
        const charts = d3
          .select("#polyGateScatter")
          .selectAll(".polyGateScatter")
          .data(data, d => {
            return d.key;
          });

        charts
          .enter()
          .append("div")
          .attr("class", "polyGateScatter")
          .merge(charts)
          .call(scatter);

        charts.exit().remove();
      };

      draw(final_data);
    },

    getRandomNFromArray(arr, n) {
      const result = new Array(n);
      let len = arr.length;
      const taken = new Array(len);

      if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
      while (n--) {
        const x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
      }
      return result;
    }
  }
};
</script>

<style>
.title {
  color: #455a64;
}

.axis line,
.axis path {
  fill: none;
  stroke: #aeaeae;
}

.axis-title {
  text-anchor: middle;
  font-size: 12px;
  color: #000;
}

.chart {
  display: inline-block;
}

.chart-svg {
    position: absolute;
}


.chartexpressionScatter {
  display: inline-block;
}

circle.selected {
  fill: purple;
}

.ridgePlotExpression {
  display: inline-block;
}

div.tooltip-donut {
  position: absolute;
  text-align: center;
  padding: 0.5rem;
  background: #ffffff;
  color: #313639;
  border: 1px solid #313639;
  border-radius: 8px;
  pointer-events: none;
  font-size: 1.3rem;
}

.centered-input input {
  text-align: center;
}

/* #mainScatter, #expressionScatter {
  margin-bottom: 2em;
} */
</style>