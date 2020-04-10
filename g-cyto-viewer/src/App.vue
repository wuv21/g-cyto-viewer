<template>
  <v-app id="gCytoViewer">
    <v-navigation-drawer
      v-model="drawerRight"
      app
      clipped
      right
    >
      <v-list dense>
        <v-list-item-group
          v-model="selAbs"
          :multiple="true"
          color="indigo"
        >
          <v-list-item v-for="(ab, i) in abs" :key="i">
            <v-list-item-content>
              <v-list-item-title v-text="ab"></v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar
      app
      clipped-right
      color="light-blue darken-4"
      dark
    >
      <v-toolbar-title>{{title}}</v-toolbar-title>
      <v-spacer />
      <v-app-bar-nav-icon @click.stop="drawerRight = !drawerRight" />
    </v-app-bar>

    <v-content>
      <v-container fluid>
          <v-row>
            <v-col cols="4">
              <v-file-input name="hi" accept=".tsv" label="Upload TSV data file" @change="onFileChange"></v-file-input>
            </v-col>

            <!-- TODO set up a column here for alerts -->
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
          <v-col>
            <p class="title">Polygonal gate coming soon...</p>
            <div id="ridgePlotExpression"></div>
            <p class="body-2">Will test my sanity</p>
          </v-col>

        </v-row>
      </v-container>
    </v-content>

    <v-footer
      app
      color="light-blue darken-4"
      class="white--text"
    >
      <span>Vincent Wu | Betts Lab</span>
      <v-spacer />
      <span>Updated 2020.04.07</span>
    </v-footer>
  </v-app>
</template>

<script>
import * as d3 from "d3";
import _ from "lodash";
import ScatterPlot from "./graphs/scatterplot.js";
// import RidgePlot from "./graphs/ridgeplot.js";

export default {
  name: "gCytoViewer",
  data: () => ({
      drawerRight: null,
      title: "gCytoViewer",
      dataFile: null,
      header: [],
      abs: [],
      selAbs: [],
      dataCite: [],
      dataTsne: [],
      dataTsneExpression: [],
      fillScales: [],
      absDensities: [],
      enableThresh: false,
      expThresh: 0,
      minThresh: 0,
      maxThresh: 1,
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

      this.makeTsne();
    },

    selAbs() {
      this.makeTsneExpressionData();
      this.makeTsneExpression();

      this.makeRidgePlots();
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

        
      const draw = function() {
        const charts = d3.select("#tsne")
          .selectAll(".chart")
          .data(final_data)

        charts.enter()
          .append("div")
          .attr("class", "chart")
          .merge(charts)
          .call(scatter);

        charts.exit().remove()
      }

      draw();
    },

    makeTsneExpressionData() {
      // TODO add filtering step here...
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


    makeRidgePlots() {
      console.log('hmmm');
    }

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
</style>