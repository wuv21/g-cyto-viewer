<template>
  <v-app id="gCytoViewer">
    <v-navigation-drawer v-model="drawerRight" app clipped right>
      <v-list-item>
        <v-list-item-content>
          <v-row>
            <v-col cols="8">
              <v-list-item-title class="title">Antibodies</v-list-item-title>
            </v-col>
            <v-col cols="4" v-show="abs.length != 0">
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <div class="sidebar-icons">
                      <v-btn
                        small
                        icon
                        v-bind="attrs"
                        v-on="on"
                        @click="clearAllExpScatter"
                        :disabled="selAbs.length == 0"
                        color="#ff6b6b"
                      >
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </div>
                  </template>
                  <span>Remove all abs</span>
                </v-tooltip>
            </v-col>
          </v-row>
        </v-list-item-content>
      </v-list-item>

      <v-list-item>
        <v-text-field
          class="mt-2"
          v-model="absSearch"
          label="Search for abs"
          v-show="abs.length != 0"
          dense
          clearable
        ></v-text-field>
      </v-list-item>

      <v-list dense id="antibody-list">
        <v-list-item-group v-model="selAbs" :multiple="true" color="#3d5a80">
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

      <v-divider></v-divider>

      <v-list-item>
        <v-list-item-content>
          <v-row>
            <v-col cols="8">
              <v-list-item-title class="title">Clusters</v-list-item-title>
            </v-col>
            <v-col cols="4" v-show="clusterCategoriesCurrentVals.length != 0" >
              <div class="sidebar-icons">
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                      <v-btn
                        small
                        icon
                        v-bind="attrs"
                        v-on="on"
                        @click="clearClusterSel"
                        :disabled="selClusterTrack.length == 0"                      
                        color="#ff6b6b"
                      >
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                  </template>
                  <span>Remove all</span>
                </v-tooltip>

                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                      <v-btn
                        small
                        icon
                        v-bind="attrs"
                        v-on="on"
                        @click="addAllClusterSel"
                        :disabled="selClusterTrack.length == clusterCategoriesCurrentVals.length"                        
                        color="#4ecdc4"
                      >
                        <v-icon>mdi-check-all</v-icon>
                      </v-btn>
                  </template>
                  <span>Add all</span>
                </v-tooltip>
              </div>
            </v-col>
          </v-row>
        </v-list-item-content>
      </v-list-item>

      <v-list dense id="cluster-list">
        <v-list-item-group
          v-model="selClusterTrack" :multiple="true" color="#ee6c4d" @change="updateCells">
            <v-list-item
              v-for="(clust, i) in clusterCategoriesCurrentVals"
              :key="`clust-${i}`"
              :value="i"
            >
              <v-list-item-icon class="mr-3">
                <v-icon
                  :color="`${clusterCategoriesUniqCols[clusterCategoriesSel][i]}`"
                >mdi-checkbox-blank-circle</v-icon>
              </v-list-item-icon>

              <v-list-item-content>

                <v-list-item-title v-text="clust"></v-list-item-title>
              </v-list-item-content>
            </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app clipped-right :color="headerFooterColor" dark>
      <v-toolbar-title>{{title}}</v-toolbar-title>
      <v-spacer />
      <v-app-bar-nav-icon @click.stop="drawerRight = !drawerRight" />
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <v-row>
          <v-col cols="4">
            <v-file-input
              name="hi"
              accept=".tsv"
              label="Upload TSV data file"
              @change="onFileChange"
              truncate-length="30"
            ></v-file-input>

            <div v-show="showSpinner">
              <v-progress-circular
                indeterminate
                :color="headerFooterColor"
              ></v-progress-circular>
              <p class="caption">Loading...please wait</p>
            </div>

            <div>
              <v-alert
                outlined
                type="error"
                v-show="showAlertMsg"
              >
                {{alertErrorMsg}}
              </v-alert>
            </div>


            <div v-show="abs.length != 0">
              <status-badge chip-color="#335c67">
                {{abs.length}} features
              </status-badge>

              <status-badge chip-color="#e09f3e">
                {{dataCiteLength}} cells
              </status-badge>              

              <status-badge chip-color="#540b0e">
                {{clusterCategories.length}} cluster columns
              </status-badge>
            </div>
          </v-col>

          <v-col v-show="abs.length != 0" cols="8" text-center justify-center>
            <p class="title mb-0">Dashboard settings</p>
            <v-row>
              <v-col cols="5">
                <p class="subtitle-2 mb-0">Random cell downsampling</p>
                <p class="caption">Recommended to de-select all antibodies first.</p>
                <v-slider
                  v-model="cellsUsed"
                  class="align-center"
                  @input="updateCells"
                  :max="dataCiteLength"
                  min="0"
                  hide-details
                >
                  <template v-slot:append>
                    <v-text-field
                      v-model="cellsUsed"
                      class="ma-0 pa-0"
                      hide-details
                      single-line
                      :max="dataCiteLength"
                      min="0"
                      type="number"
                      style="width: 5em;"
                    ></v-text-field>
                  </template>
                </v-slider>
              </v-col>

              <v-col cols="3">
                <p class="subtitle-2">Coordinate space</p>
                <v-select
                  outlined
                  :items="dimMethods"
                  :disabled="dimMethods.length == 1"
                  v-model="dimMethodSel"
                  @input="updateDimsAndCells"
                  dense
                  label="Select method"
                ></v-select>
              </v-col>

              <v-col cols="4">
                <p class="subtitle-2">Cluster</p>
                <v-select
                  outlined
                  :items="clusterCategories"
                  :disabled="clusterCategories.length == 1"
                  v-model="clusterCategoriesSel"
                  @input="updateClusterAndCells"
                  dense
                  label="Select category"
                ></v-select>
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <v-row align="start" justify="space-around" v-show="abs.length != 0">
          <v-col cols="6" text-center justify-center>
            <p class="title mb-0">Colored by cluster</p>
            <p
              class="caption"
            >To start, click on graph to place anchors for gating. Double click to finish and to allow gate dragging. <br> To reset, click outside to start drawing new gate.</p>
            <p class="subtitle-1 mb-0">Polygonal gate details</p>
            <p
              class="caption mb-0"
            >Current polygonal gate: {{dataPolyGate.length}} cells selected of {{currentDataClean.length}} cells shown on graph</p>
            <p
              class="caption mt-0 pt-0"
            >{{cellsUsed - currentDataClean.length}} cells are not shown based on current cluster selection</p>
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

        <v-row v-show="abs.length != 0" id="cluster-heatmap-section">
          <v-col cols="12" text-center justify-center>
            <p class="title mb-0">Mean antibody expression value heatmap</p>
            <p class="caption">Showing complete dataset (no filtering) aggregated by cluster</p>

            <div id="clusterHeatmap"></div>

            <div id="tooltip"></div>

          </v-col>
        </v-row>

        <v-row v-show="abs.length != 0">
          <v-col text-center justify-center>
            <p class="title mb-0">Colored by scaled expression level</p>

            <v-row>
              <v-col cols="6" class="pt-0">
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
              
              <v-col cols="6">
                <v-row>
                  <v-col cols="4" class="pb-0">
                    <v-select
                      outlined
                      :items="expColorScales"
                      v-model="expColorScaleSel"
                      dense
                      label="Select color scale (low - high)"
                    ></v-select>
                  </v-col>

                  <v-col cols="8" class="pb-0">
                    <div id="expColorLegend"></div>
                  </v-col>                              
                </v-row>

                <v-row class="mb-0">
                  <v-col cols="6" class="pt-0">
                    <v-btn
                      color="normal"
                      :disabled="selAbs.length == 0"
                      @click="clearAllExpScatter"
                    >Clear all expression plots</v-btn>
                  </v-col>                    
                </v-row>
              </v-col>
            </v-row>

            <div id="expressionScatter"></div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <v-footer app :color="headerFooterColor" class="white--text">
      <span>Vincent Wu | Betts Lab</span>
      <v-spacer />
      <v-btn
        small
        @click="toggleDarkTheme"
      >dark/light mode (beta)</v-btn>
      <span class="ml-3">Updated 2020.10.15</span>
    </v-footer>
  </v-app>
</template>

<script>
// req'd libraries
import "@mdi/font/css/materialdesignicons.css";
import draggable from "vuedraggable";
import * as d3 from "d3";
import _ from "lodash";

// graphs/polybrush
import ScatterPlot from "./graphs/scatterplot_canvas.js";
import HeatmapPlot from "./graphs/heatmap.js";
import "./graphs/polybrush.js";

// custom components
import statusBadge from "./components/statusBadge.vue"

const availInterpolators = {
  "Viridis (Purple - Blue - Yellow)": d3.interpolateViridis,
  "Plasma (Purple - Red - Yellow)": d3.interpolatePlasma,
  "Inferno (Black - Red - Yellow)": d3.interpolateInferno,
  "Purple - Green": d3.interpolatePRGn,
  "White - Red": d3.interpolateReds,
  "White - Blue": d3.interpolateBlues,
};

function checkMatrix(matrix, header, axes, clusters) {
  if (!matrix) {
    return "No file";
  } else if (matrix.length <= 1) {
    return "No data in file";
  } else if (axes.length == 0) {
    return "No axis columns";
  } else if (axes.length % 2 != 0) {
    return "Number of axis columns are odd";
  } else if (clusters.length == 0) {
    return "No cluster columns";
  } else if (!header.includes("barcode")) {
    return "No barcode column";
  } else {
    return ""
  }
}

export default {
  name: "gCytoViewer",
  icons: {
    iconfont: "mdi"
  },
  components: {
    draggable: draggable,
    'status-badge': statusBadge
  },
  data: () => ({
    drawerRight: null,
    title: "gCytoViewer",
    headerFooterColor: "#264653",
    svgTextColor: "#000000",
    themeLight: true,
    dataFile: null,
    alertErrorMsg: "",
    showAlertMsg: false,
    header: [],
    abs: [],
    selAbs: [],
    selClusterTrack: [],
    absSearch: null,
    absDisplayBool: [],
    dataCite: {},
    dataCiteLength: 0,
    currentDataClean: [],
    dataPolyGate: [],
    polyGateXAb: [],
    polyGateYAb: [],
    polyGateBrush: null,
    mainScatterXScale: null,
    mainScatterYScale: null,
    fillScales: [],
    absDensities: [],
    enableThresh: false,
    expThresh: 0,
    minThresh: 0,
    maxThresh: 2, // will need to edit for flow datasets
    cellsUsed: 0,
    dimMethods: [],
    dimMethodSel: null,
    clusterCategories: [],
    clusterCategoriesSel: null,
    clusterCategoriesUniqVals: {},
    clusterCategoriesScales: {},
    clusterCategoriesUniqCols: {},
    clusterCategoriesCurrentVals: [],
    showSpinner: false,
    expColorScales: Object.keys(availInterpolators),
    expColorScaleSel: Object.keys(availInterpolators)[0],
  }),

  watch: {
    dataFile(d) {
      this.showAlertMsg = false;

      if (!d) {
        this.showSpinner = false;
        return; 
      }

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
      const metaInfoTags = ["barcode"];
      const axisCols = _.filter(this.header, i => /^(xaxis|yaxis)/.test(i));
      const clusterCols = _.filter(this.header, i => /^(cluster_)/.test(i));

      const checkMsg = checkMatrix(dMat, this.header, axisCols, clusterCols);
      if (checkMsg != "") {
        this.showAlertMsg = true;
        this.alertErrorMsg = checkMsg;
        this.showSpinner = false;
        return;
      }

      this.abs = _.without(this.header, ...metaInfoTags.concat(axisCols, clusterCols));
      this.absDisplayBool = Array(this.abs.length).fill(true);

      // find available dim methods
      this.dimMethods = _.chain(axisCols)
        .map(x => x.replace(/^(xaxis|yaxis)_/, ""))
        .uniq()
        .value();

      // set default dimMethod
      this.dimMethodSel = this.dimMethods[0];

      // save available cluster categories
      this.clusterCategories = _.chain(clusterCols)
        .map(x => x.replace(/^cluster_/, ""))
        .uniq()
        .value();

      this.clusterCategoriesSel = this.clusterCategories[0];

      // set length of full dataset since this will need to be done once only
      this.dataCiteLength = this.dataCite["barcode"].length;

      // set default to full dataset
      this.currentDataClean = [...Array(this.dataCiteLength).keys()].map(i => i);

      // precalculate d3 scales
      this.abs.forEach(a => {
        const minAb = _.min(this.dataCite[a]);
        const maxAb = _.max(this.dataCite[a]);

        // fill scale
        this.fillScales[a] = d3
          .scaleSequential(availInterpolators[this.expColorScaleSel])
          .domain([minAb, maxAb]);
      });


      // precalculate cluster scale
      for (const c of this.clusterCategories) {
        this.clusterCategoriesUniqVals[c] = {};

        const allCatVals = this.dataCite["cluster_" + c];
        for (let i = 0; i < allCatVals.length; i++) {
          const dCatVal = allCatVals[i];

          if (dCatVal in this.clusterCategoriesUniqVals[c]) {
            this.clusterCategoriesUniqVals[c][dCatVal].push(i);
          } else {
            this.clusterCategoriesUniqVals[c][dCatVal] = [i];
          }
        }
      }

      for (const c in this.clusterCategoriesUniqVals) {
        this.clusterCategoriesScales[c] = d3.scaleOrdinal(d3.schemePaired).domain(Object.keys(this.clusterCategoriesUniqVals[c]));
        this.clusterCategoriesUniqCols[c] = _.map(Object.keys(this.clusterCategoriesUniqVals[c]), (x) => this.clusterCategoriesScales[c](x));
      }

      // save other settings
      this.cellsUsed = this.currentDataClean.length;

      this.clusterCategoriesCurrentVals = Object.keys(this.clusterCategoriesUniqVals[this.clusterCategoriesSel])
      this.selClusterTrack = this.clusterCategoriesCurrentVals.map((x,i)=>i);

      this.makeMainScatter();
      this.drawColorScaleLegend();
      this.makeClusterHeatmap();

      this.showSpinner = false;
    },

    selAbs() {
      if (this.selAbs.length != 0) {
        const expressionData = this.makeExpressionScatterData();
        this.makeExpressionScatter(expressionData);
      }
    },

    enableThresh() {
      if (this.selAbs.length != 0) {
        const expressionData = this.makeExpressionScatterData();
        this.makeExpressionScatter(expressionData);
      }
    },

    expThresh() {
      if (this.selAbs.length != 0) {
        const expressionData = this.makeExpressionScatterData();
        this.makeExpressionScatter(expressionData);
      }
    },

    dataPolyGate() {
      if (this.dataCiteLength == 0) {
        return;
      }

      if (
        // this.dataPolyGate.length > 0 &&
        this.polyGateXAb.length == 1 &&
        this.polyGateYAb.length == 1
      ) {
        this.makePolyGateScatter();
      }
    },

    polyGateXAb(newVal, prevVal) {
      if (this.dataCiteLength == 0) {
        return;
      }
      this.polyGateXAb = this.checkPolyGateAb(prevVal, newVal);

      if (this.dataPolyGate.length > 0 && this.polyGateYAb.length == 1) {
        this.makePolyGateScatter();
      }
    },

    polyGateYAb(newVal, prevVal) {
      if (this.dataCiteLength == 0) {
        return;
      }

      this.polyGateYAb = this.checkPolyGateAb(prevVal, newVal);

      if (this.dataPolyGate.length > 0 && this.polyGateXAb.length == 1) {
        this.makePolyGateScatter();
      }
    },

    absSearch() {
      if (this.dataCiteLength == 0) {
        return;
      }

      if (this.absSearch === null || this.absSearch == "") {
        this.absDisplayBool = Array(this.abs.length).fill(true);
      } else {
        this.absDisplayBool = _.map(this.abs, x => {
          return x.toLowerCase().indexOf(this.absSearch.toLowerCase()) !== -1;
        });
      }
    },

    expColorScaleSel() {
      Object.keys(this.fillScales).forEach(a => {
        // fill scale
        this.fillScales[a] = d3
          .scaleSequential(availInterpolators[this.expColorScaleSel])
          .domain(this.fillScales[a].domain());
      });

      this.makeClusterHeatmap();

      this.drawColorScaleLegend();
      if (this.selAbs.length > 0) {
        const expressionData = this.makeExpressionScatterData();
        this.makeExpressionScatter(expressionData);
      }
    }
  },
  methods: {
    onFileChange(e) {
      this.resetGraphs(["#mainScatter", "#polyGateScatter", "#expressionScatter"]);
      if (e) {
        this.showSpinner = true;

        const reader = new FileReader();
        reader.onload = event => {
          this.dataFile = event.target.result;
        };

        reader.readAsText(e);
      }
    },

    resetGraphs(nodeID) {
      Object.assign(this.$data, this.$options.data.apply(this));

      if (typeof(nodeID) == "string") {
        d3.select(nodeID).selectAll("*").remove();
      } else if (Array.isArray(nodeID)) {
        nodeID.forEach((x) => {
          d3.select(x).selectAll("*").remove();
        })
      }

      this.showAlertMsg = false;
    },

    makeMainScatter() {
      const final_data = [
        {
          key: "mainPlot",
          title: "",
          type: "cluster",
          orgData: this.dataCite,
          values: this.currentDataClean
        }
      ];

      const scatter = ScatterPlot()
        .width(400)
        .height(400)
        .radius(1)
        .xVar("xaxis_" + this.dimMethodSel)
        .yVar("yaxis_" + this.dimMethodSel)
        .xTitle(this.dimMethodSel + " 1")
        .yTitle(this.dimMethodSel + " 2")
        .constrainAxes(Array.from({length: this.dataCiteLength}, (x, i) => i))
        .fillVar("cluster_" + this.clusterCategoriesSel)
        .fillScale(this.clusterCategoriesScales[this.clusterCategoriesSel])
        .axesTitleColor(this.svgTextColor);

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
          const brush = d3.polybrush()
            .x(scatter.xScale())
            .y(scatter.yScale())
            .on("start", () => {
              this.dataPolyGate = [];
            })
            .on("end", () => {
              this.updatePolyGateIndices(brush, scatter.xScale(), scatter.yScale());
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

    makeClusterHeatmap() {
      const dataLong = [];
      for (const cv in this.clusterCategoriesUniqVals[this.clusterCategoriesSel]) {
        for (const a of this.abs) {
          const cells = this.clusterCategoriesUniqVals[this.clusterCategoriesSel][cv];

          const newD = {
            cluster: cv,
            ab: a,
            value: d3.mean(cells, (d) => this.dataCite[a][d])
          }

          dataLong.push(newD);
        }
      }

      const final_data = [{
        key: "mainClusterHeatmap",
        clusterCategory: this.clusterCategoriesSel,
        values: dataLong
      }];

      // const temp = d3.rollup(dataLong, v => d3.extent(v), d => d.ab);
      // console.log(temp);

      const heatmap = HeatmapPlot()
        .width(14 * this.abs.length + 50)
        .height(14 * Object.keys(this.clusterCategoriesUniqVals[this.clusterCategoriesSel]).length + 125)
        .tileSize(14)
        .xVar("ab")
        .yVar("cluster")
        .fillVar("value")
        // .fillScale(availInterpolators[this.expColorScaleSel])
        .fillScales(this.fillScales)
        .axesLabelColor(this.svgTextColor);

      const draw = () => {
        const charts = d3
          .select("#clusterHeatmap")
          .selectAll(".chart-heatmap")
          .data(final_data);

        charts
          .enter()
          .append("div")
          .attr("class", "chart-heatmap")
          .merge(charts)
          .call(heatmap);

        charts.exit().remove();
      };

      draw();      
    },

    updatePolyGateIndices(brush, xScale, yScale) {
      const dataTemp = [];
      const xvar = "xaxis_" + this.dimMethodSel;
      const yvar = "yaxis_" + this.dimMethodSel;

      this.currentDataClean.forEach(i => {
        if (brush.isWithinExtent(xScale(this.dataCite[xvar][i]), yScale(this.dataCite[yvar][i]))) {
          dataTemp.push(i);
        }
      });

      this.dataPolyGate = dataTemp;
    },

    makeExpressionScatterData() {
      const currentDataCleanExpression = _.map(this.selAbs, a => {
        const d = {
          type: "expression",
          key: a,
          title: this.abs[a],
          orgData: this.dataCite,
          fillScale: this.fillScales[this.abs[a]]
        };

        let data_ref = this.currentDataClean;
        if (this.enableThresh) {
          const currentDataCleanFilt = _.filter(this.currentDataClean, i => {
            const d = this.dataCite[this.abs[a]][i];

            return d >= this.expThresh;
          });

          data_ref = currentDataCleanFilt;
        }
        d.values = data_ref;

        return d;
      });

      return(currentDataCleanExpression)
    },

    makeExpressionScatter(expressionData) {
      const scatter = ScatterPlot()
        .width(275)
        .height(275)
        .radius(0.5)
        .constrainAxes(Array.from({length: this.dataCiteLength}, (x, i) => i))
        .xVar("xaxis_" + this.dimMethodSel)
        .yVar("yaxis_" + this.dimMethodSel)
        .xTitle(this.dimMethodSel + " 1")
        .yTitle(this.dimMethodSel + " 2")
        .axesTitleColor(this.svgTextColor)
        .titleColor(this.svgTextColor);

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

      draw(expressionData);
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
          orgData: this.dataCite,
          values: this.dataPolyGate
        }
      ];

      const scatter = ScatterPlot()
        .width(400)
        .height(400)
        .radius(1.5)
        .xVar(this.polyGateXAb[0])
        .yVar(this.polyGateYAb[0])
        .constrainAxes(Array.from({length: this.dataCiteLength}, (x, i) => i))
        .xTitle(this.polyGateXAb[0])
        .yTitle(this.polyGateYAb[0])
        .fillVar("cluster_" + this.clusterCategoriesSel)
        .fillScale(this.clusterCategoriesScales[this.clusterCategoriesSel])
        .axesTitleColor(this.svgTextColor);

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

    updateCells(event, { updatePolyGate = false, updateCluster = false } = {}) {
      if (updateCluster) {
        // only fires when cluster category is changed...sets default to select all unique values (i.e. show all pts)
        this.clusterCategoriesCurrentVals = Object.keys(this.clusterCategoriesUniqVals[this.clusterCategoriesSel]);
        this.selClusterTrack = this.clusterCategoriesCurrentVals.map((x,i) => i);
      }

      if (this.cellsUsed == this.dataCiteLength) {
        this.currentDataClean = [...Array(this.dataCiteLength).keys()].map(i => i);
      } else {
        this.currentDataClean = this.genRandomIndices(this.cellsUsed, this.dataCiteLength);
      }

      if (this.selClusterTrack.length != 0) {
        const allowedCells = this.selClusterTrack.reduce((prev, current) => {
          const clusterValue = this.clusterCategoriesCurrentVals[current]
          prev = prev.concat(this.clusterCategoriesUniqVals[this.clusterCategoriesSel][clusterValue])
          return(prev)
        }, []);

        this.currentDataClean = this.currentDataClean.filter(x => allowedCells.includes(x))
      } else {
        this.currentDataClean = [];
      }

      if (updatePolyGate && this.dataPolyGate.length > 0) {
        this.dataPolyGate = [];
        d3.select(".polyGateScatter").remove();
        d3.select("#clusterBrushG").remove();

        d3.select("#mainScatter")
          .selectAll("circle")
          .classed("selected", false);
      } 
      
      this.makeMainScatter();

      const expressionData = this.makeExpressionScatterData();
      this.makeExpressionScatter(expressionData);

      if (
        // this.dataPolyGate.length > 0 &&
        this.polyGateXAb.length == 1 &&
        this.polyGateYAb.length == 1
      ) {
        this.updatePolyGateIndices(this.polyGateBrush, this.mainScatterXScale, this.mainScatterYScale);
      }
    },

    updateDimsAndCells(e) {
      this.updateCells(e, {updatePolyGate: true});
    },

    updateClusterAndCells(e) {
      this.makeClusterHeatmap();
      this.updateCells(e, {updateCluster: true});
    },

    genRandomIndices(n, orgArrayLen) {
      const arr = [];
      while (arr.length < n){
          const r = Math.floor(Math.random() * orgArrayLen);
          if (arr.indexOf(r) === -1) {
            arr.push(r);
          }
      }

      return(arr);
    },

    clearAllExpScatter() {
      if (this.selAbs.length > 0) {
        this.selAbs = [];
        const data = this.makeExpressionScatterData();
        this.makeExpressionScatter(data);
      }
    },

    drawColorScaleLegend() {
      const canvasID = "canvas-interpolate-legend";
      const canvasNode = document.getElementById(canvasID);
      let canvasChart = null;

      if (canvasNode === null) {
        canvasChart = d3.select("#expColorLegend").append('canvas')
          .style("width", "250px")
          .style("height", "30px")
          .style("margin-top", "3px")
          .style("image-rendering", "pixelated")
          .attr("id", canvasID);
      } else {
        canvasChart = d3.select(canvasNode);
      }
      const context = canvasChart.node().getContext('2d');

      var scale = window.devicePixelRatio * 2;
      canvasChart.node().width = 300 * scale;
      canvasChart.node().height = 30 * scale;

      context.scale(scale, scale);
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);

      const n = 512;
      const color = d3.scaleSequential(availInterpolators[this.expColorScaleSel]);
      const t = color.ticks(n)

      for (let i = 0; i < t.length; ++i) {
        context.fillStyle = color(t[i]);
        context.fillRect(250 * i/t.length, 0, 250/t.length + 1, 30);
      }
    },

    clearClusterSel() {
      this.selClusterTrack = [];
      this.updateCells();
    },

    addAllClusterSel() {
      this.selClusterTrack = Array(this.clusterCategoriesCurrentVals.length).fill().map((x,i)=>i);
      this.updateCells();
    },
    
    toggleDarkTheme() {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
      this.svgTextColor = this.$vuetify.theme.dark ? "#f5f5f5" : "#272727";
      
      if (this.abs.length != 0) {
        const classToUpdate = ["axis-title", "chart-title", "hm-axis-tick"];
        classToUpdate.forEach((c) => {
          document.getElementsByClassName(c).forEach((e) => e.style.fill = this.svgTextColor);
        });

        document.getElementById("clusterBrushG").getElementsByTagName("path")[0].setAttribute("fill", this.svgTextColor);
      }
    }
  },
};
</script>

<style>
.title {
  color: #2a9d8f;
}
.subtitle-1 {
  color: #e76f51;
}
.sidebar-icons {
  position: absolute;
}
.sidebar-icons:nth-child() {
  display: inline-block;
}
.axis line,
.axis path {
  fill: none;
  stroke: #aeaeae;
}
.axis-title {
  text-anchor: middle;
  font-size: 12px;
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
#antibody-list {
  max-height: 50%;
  overflow-y: auto;
}
#cluster-list {
  max-height: 35%;
  overflow-y: auto;
}
.v-file-input__text {
  font-size: 14px;
}
.chart-heatmap {
  width: 100%;
  overflow-y: auto;
  overflow-x: auto;
}
.chart-heatmap-svg {
  display: inline-block;
}
div.tooltip {
  position: absolute;
  text-align: left;
  margin-top: 20px;
  margin-left: 15px;
  padding: 0.5em;
  background: #2C3E50;
  color: #ECF0F1;
  border: 0px;
  border-radius: 8px;
}
</style>