<template>
  <v-app id="gCytoViewer">
    <v-navigation-drawer
      v-model="drawerRight"
      app
      clipped
      right
    >
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="title">
            Antibodies
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>
      
      <v-list dense>
        <v-list-item-group
          v-model="selAbs"
          :multiple="true"
          color="indigo"
        >
          <draggable v-model="abs" :options="{group: {name:'test', pull:'clone', put:false}, sort: false}" style="min-height:10px">

            <v-list-item v-for="(ab, i) in abs" :key="`ab-${i}`">
              <v-list-item-content>
                <v-list-item-title v-text="ab"></v-list-item-title>
              </v-list-item-content>
            </v-list-item>

          </draggable>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar
      app
      clipped-right
      :color="headerFooterColor"
      dark
    >
      <v-toolbar-title>{{title}}</v-toolbar-title>
      <v-spacer />
      <v-app-bar-nav-icon @click.stop="drawerRight = !drawerRight" />
    </v-app-bar>

    <v-content>
      <v-container fluid>
          <v-row>
            <v-col cols="5">
              <v-file-input name="hi" accept=".tsv" label="Upload TSV data file" @change="onFileChange"></v-file-input>
              <div v-show="abs.length != 0">
                <v-chip
                  class="ma-2"
                  color="indigo"
                  text-color="white"
                >
                  <v-avatar left>
                    <v-icon>mdi-flask-empty</v-icon>
                  </v-avatar>
                  {{abs.length}} antibodies
                </v-chip>
                
                <v-chip
                  class="ma-2"
                  color="teal"
                  text-color="white"
                >
                  <v-avatar left>
                    <v-icon>mdi-checkbox-blank-circle-outline</v-icon>
                  </v-avatar>
                  {{dataTsne.length}} cells
                </v-chip>                           
              </div>
            </v-col>

            <v-col v-show="abs.length != 0" cols="7" text-center justify-center>
              <p class="title">Dashboard settings</p>
              <v-row>
                <v-col cols="6">
                  <p class="subtitle-2">Random cell filter (work in progress)</p>
                  <v-slider
                    v-model="cellsUsed"
                    class="align-center"
                    :max="dataTsne.length"
                    min="0"
                    hide-details
                  >
                    <template v-slot:append>
                      <v-text-field
                        v-model="cellsUsed"
                        class="ma-0 pa-0"
                        hide-details
                        single-line
                        :max="dataTsne.length"
                        min="0"
                        type="number"
                        style="width: 5em;"
                      ></v-text-field>
                    </template>
                  </v-slider>
                </v-col>

                <v-col cols="4">
                  <!-- <p class="subtitle-2">Eventually another setting</p> -->
                </v-col>
              </v-row>
            </v-col>
        </v-row>

        <v-row
          align="start"
          justify="space-around"
        >
          <v-col v-show="abs.length != 0" cols="5" text-center justify-center>
              <p class="title">Colored by cluster</p>
              <div id="tsne"></div>
          </v-col>

          <v-col v-show="abs.length != 0" text-center justify-center>
            <p class="title">Colored by scaled expression level</p>

            <v-switch
              label="Enable threshold filter"
              v-model="enableThresh"
            ></v-switch>

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

            <div id="tsneExpression"></div>
          </v-col>
        </v-row>

        <v-row v-show="abs.length != 0">
          <v-col cols="5">
            <p class="title">Polygonal gate</p>
            <p class="caption">Drag and drop antibodies from right bar to the below boxes.</p>
            <v-row>
              <v-col cols="6">
                <v-card
                  class="mx-auto"
                  outlined
                >
                  <v-card-subtitle class="pb-0">x-axis antibody</v-card-subtitle>
                    <draggable v-model="polyGateXAb" :options="{group: {name:'test', pull:'clone'}, sort: false}" style="min-height: 50px">
                        <v-card-text v-for="(ab, i) in polyGateXAb" :key="`x-${i}`">
                          <div v-text="ab"></div>
                        </v-card-text>
                    </draggable>
                </v-card>
              </v-col>

              <v-col cols="6">
                <v-card
                  class="mx-auto"
                  outlined
                >
                  <v-card-subtitle class="pb-0">y-axis antibody</v-card-subtitle>
                    <draggable v-model="polyGateYAb" :options="{group: {name:'test', pull:'clone'}, sort: false}" style="min-height: 50px">
                        <v-card-text v-for="(ab, i) in polyGateYAb" :key="`y-${i}`">
                          <div v-text="ab"></div>
                        </v-card-text>
                    </draggable>
                </v-card>
              </v-col>
            </v-row>

            <div id="polyGateScatter"></div>
          </v-col>
        </v-row>
      </v-container>
    </v-content>

    <v-footer
      app
      :color="headerFooterColor"
      class="white--text"
    >
      <span>Vincent Wu | Betts Lab</span>
      <v-spacer />
      <span>Updated 2020.04.14</span>
    </v-footer>
  </v-app>
</template>

<script>
import '@mdi/font/css/materialdesignicons.css';
import draggable from 'vuedraggable'
import * as d3 from "d3";
import _ from "lodash";
import ScatterPlot from "./graphs/scatterplot.js";
import "./graphs/polybrush.js"

export default {
  name: "gCytoViewer",
  icons: {
    iconfont: "mdi"
  },
  components: {'draggable': draggable},
  data: () => ({
      drawerRight: null,
      title: "gCytoViewer",
      headerFooterColor: "blue-grey",
      dataFile: null,
      header: [],
      abs: [],
      selAbs: [],
      dataCite: [],
      dataTsne: [],
      dataTsneExpression: [],
      polyGateIndices: [],
      polyGateXAb: [],
      polyGateYAb: [],
      fillScales: [],
      absDensities: [],
      enableThresh: false,
      expThresh: 0,
      minThresh: 0,
      maxThresh: 1,
      cellsUsed: 0,
  }),
  watch: {
    dataFile(d) {
      let dMat = d.split("\n")
      this.header = dMat[0].split("\t")

      dMat = _.map(dMat, (x) => {
        return(x.split("\t"))
      });

      // check last row
      if (dMat[dMat.length - 1].length == 1) {
        dMat.pop();
      }

      const getNth = function(arrayList, n, h) {
        const allNth = [];
        
        arrayList.forEach((a) => {
          if (h === "barcode") {
            allNth.push(a[n]);
          } else {
            allNth.push(parseFloat(a[n]));
          }

        });

        return(allNth);
      };

      // reformat
      this.header.forEach((h, i) => {
        this.dataCite[h] = getNth(dMat.slice(1, dMat.length), i, h)
      });

      // get abs
      const metaInfoTags = ["barcode", "cluster", "tSNE_1", "tSNE_2"]
      this.abs = _.without(this.header, ...metaInfoTags);

      // reformat to d3 friendly
      const dataCiteKeys = Object.keys(this.dataCite);
      for (let i = 0; i < this.dataCite["tSNE_1"].length; i++) {
        const d = {};
        dataCiteKeys.forEach((x) => {
          d[x] = this.dataCite[x][i]
        });
        this.dataTsne.push(d)
      }

      // precalculate d3 scales
      this.abs.forEach((a) => {
        const minAb = _.min(this.dataCite[a])
        const maxAb = _.max(this.dataCite[a])
        
        // fill scale
        this.fillScales[a] = d3.scaleSequential(d3.interpolateReds).domain([minAb, maxAb])
      });

      // save other settings
      this.cellsUsed = this.dataTsne.length;

      this.makeTsne();
    },

    selAbs() {
      this.makeTsneExpressionData();
      this.makeTsneExpression();
    },

    enableThresh() {
      if (this.selAbs.length != 0) {
        this.makeTsneExpressionData();
        this.makeTsneExpression();
      }
    },

    expThresh() {
      if (this.selAbs.length != 0) {
        this.makeTsneExpressionData();
        this.makeTsneExpression();
      }
    },

    cellsUsed() {
      console.log('here');
      // TODO redraw based on the cells used....
    },

    polyGateIndices() {
      if(this.polyGateIndices.length > 0 && this.polyGateXAb.length == 1 && this.polyGateYAb.length == 1) {
        this.makePolyGateScatter();
      }
    },

    polyGateXAb(newVal, prevVal) {
      this.polyGateXAb = this.checkPolyGateAb(prevVal, newVal);

      if (this.polyGateIndices.length > 0 && this.polyGateYAb.length == 1) {
        this.makePolyGateScatter();
      }
    },

    polyGateYAb(newVal, prevVal) {
      this.polyGateYAb = this.checkPolyGateAb(prevVal, newVal);

      if (this.polyGateIndices.length > 0 && this.polyGateXAb.length == 1) {
        this.makePolyGateScatter();
      }
    }
  },
  methods: {
    onFileChange(e) {
      const reader = new FileReader();
      reader.onload = (event) => {
        this.dataFile = event.target.result;
      }

      reader.readAsText(e)
    },

    makeTsne() {
      const final_data = [{
        key: "cluster_tsne",
        title: "",
        type: "cluster",
        values: this.dataTsne
      }];

      const uniq_clusts = _.uniq(_.map(this.dataTsne, (d) => {return(d.cluster)}))
      const clusterScale = d3.scaleOrdinal(d3.schemePaired)
        .domain(uniq_clusts)

      const scatter = ScatterPlot()
        .width(500)
        .height(500)
        .radius(1)
        .xVar("tSNE_1")
        .yVar("tSNE_2")
        .fillVar("cluster")
        .fillScale(clusterScale)

      const draw = () => {
        const charts = d3.select("#tsne")
          .selectAll(".chart")
          .data(final_data)

        charts.enter()
          .append("div")
          .attr("class", "chart")
          .merge(charts)
          .call(scatter);

        charts.exit().remove()

        const brush = d3.polybrush()
          .x(scatter.xScale())
          .y(scatter.yScale())
          .on("start", () => {
            this.polyGateIndices = [];
            d3.select("#tsne").selectAll("circle").classed("selected", false);
          })
          .on("end", () => {
            const indices = [];
            d3.select("#tsne").selectAll("circle").classed("selected", (d, i) => {

              //get the associated circle
              const point = d3.select("#" + d.barcode);
              if (brush.isWithinExtent(point.attr("cx"), point.attr("cy"))) {
                point.classed("selected", true);
                indices.push(i);
                return true;
              } else {
                point.classed("selected", false);
                return false;
              }
            });

            this.polyGateIndices = indices;
          });

        d3.select("#tsne")
          .select(".scatterG")
          .append("g")
          .call(brush);
      }

      draw();
    },

    makeTsneExpressionData() {
      // TODO optimize this filtering step...set a previous state flag to avoid continously creating new objects
      this.dataTsneExpression = _.map(this.selAbs, (a) => {
        const d = {
          type: "expression",
          key: a,
          title: this.abs[a],
          fillScale: this.fillScales[this.abs[a]]
        };

        let data_ref = this.dataTsne;
        if (this.enableThresh) {
          const dataTsneFilt = _.filter(this.dataTsne, (d) => {
            return(d[this.abs[a]] >= this.expThresh)
          });

          data_ref = dataTsneFilt;
        }

        d.values = _.map(data_ref, (d) => {
          const new_d = {
            tSNE_1: d.tSNE_1,
            tSNE_2: d.tSNE_2,
            barcode: d.barcode,
            ab: this.abs[a],
            cluster: d.cluster,
            expression: d[this.abs[a]]
          };

          return new_d;
        });

        return d;
      });
    },

    makeTsneExpression() {
      const scatter = ScatterPlot()
        .width(250)
        .height(250)
        .radius(0.5)
        .constrainAxes(this.dataTsne)
        .xVar("tSNE_1")
        .yVar("tSNE_2");

      const draw = function(data) {
        const charts = d3.select("#tsneExpression")
          .selectAll(".chartTsneExpression")
          .data(data, (d) => {return d.key});

        charts.enter()
          .append("div")
          .attr("class", "chartTsneExpression")
          .merge(charts)
          .call(scatter);

        charts.exit().remove()
      }

      draw(this.dataTsneExpression);
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
      const final_data = [{
        key: "polygate-" + this.polyGateXAb[0] + this.polyGateYAb[0],
        title: "",
        type: "cluster",
        values: _.map(this.polyGateIndices, (d) => (this.dataTsne[d]))
      }];

      const uniq_clusts = _.uniq(_.map(this.dataTsne, (d) => {return(d.cluster)}))
      const clusterScale = d3.scaleOrdinal(d3.schemePaired)
        .domain(uniq_clusts)

      // Fix axes constraint
      // Add ability to select x/y
      // Fix axes labels 
      console.log('here at scatter');
      const scatter = ScatterPlot()
        .width(400)
        .height(400)
        .radius(1.5)
        .xVar(this.polyGateXAb[0])
        .yVar(this.polyGateYAb[0])
        .xTitle(this.polyGateXAb[0])
        .yTitle(this.polyGateYAb[0])
        .fillVar("cluster")
        .fillScale(clusterScale);

      const draw = function(data) {
        const charts = d3.select("#polyGateScatter")
          .selectAll(".polyGateScatter")
          .data(data, (d) => {return d.key});

        charts.enter()
          .append("div")
          .attr("class", "polyGateScatter")
          .merge(charts)
          .call(scatter);

        charts.exit().remove()
      }

      draw(final_data);
    },

  }
}
</script>

<style>
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

.chartTsneExpression {
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
  padding: .5rem;
  background: #FFFFFF;
  color: #313639;
  border: 1px solid #313639;
  border-radius: 8px;
  pointer-events: none;
  font-size: 1.3rem;
}

.centered-input input {
  text-align: center;
}
</style>