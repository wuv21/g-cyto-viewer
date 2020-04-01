<template>
  <v-app id="inspire">
    <v-navigation-drawer
      v-model="drawerRight"
      app
      clipped
      right
    >
      <v-list dense>
        <v-list-item v-for="(ab, i) in abs" :key="i">
          <v-list-item-action>
            <v-checkbox></v-checkbox>
          </v-list-item-action>

          <v-list-item-content>
            <v-list-item-title v-text="ab"></v-list-item-title>
            <!-- <v-list-item-subtitle>Notify me about updates to apps or games that I downloaded</v-list-item-subtitle> -->
          </v-list-item-content>
        </v-list-item>

      </v-list>
    </v-navigation-drawer>

    <v-app-bar
      app
      clipped-right
      color="blue-grey"
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
        </v-row>
      </v-container>

      <v-container fluid>
        <v-row>
          <v-col cols="6" text-center justify-center>
              <div id="tsne"></div>
          </v-col>

          <v-col cols="6" text-center justify-center>
              <p>histogram placeholder</p>
          </v-col>
        </v-row>
      </v-container>
    </v-content>

    <v-footer
      app
      color="blue-grey"
      class="white--text"
    >
      <span>Vincent Wu | Betts Lab</span>
      <v-spacer />
      <span>Updated 2020.03.31</span>
    </v-footer>
  </v-app>
</template>

<script>
import * as d3 from "d3";
import _ from "lodash";

export default {
  name: "inspire",
  data: () => ({
      drawerRight: null,
      title: "gCytoViewer",
      data_file: null,
      header: [],
      abs: [],
      data_cite: [],
  }),
  watch: {
    data_file(d) {
      let d_mat = d.split("\n")
      this.header = d_mat[0].split("\t")

      d_mat = _.map(d_mat, (x) => {
        return(x.split("\t"))
      });

      // check last row
      if (d_mat[d_mat.length - 1].length == 1) {
        d_mat.pop();
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

      this.header.forEach((h, i) => {
        this.data_cite[h] = getNth(d_mat.slice(1, d_mat.length), i, h)
      });

      this.abs = _.without(this.header, "barcode", "cluster", "tSNE_1", "tSNE_2");

      this.makeTsne();
    }
  },
  methods: {
    onFileChange(e) {
      let reader = new FileReader();
      reader.onload = (event) => {
        this.data_file = event.target.result;
      }

      reader.readAsText(e)
    },
    makeTsne() {
      const margin = {top: 10, right: 30, bottom: 30, left: 60};
      const width = 580 - margin.left - margin.right;
      const height = 520 - margin.top - margin.bottom;

      const tsne_data = [];
      this.data_cite["tSNE_1"].forEach((x, i) => {
        const d = {
          x: x,
          y: this.data_cite["tSNE_2"][i],
          cluster: this.data_cite["cluster"][i]
        };

        tsne_data.push(d);
      })

      const svg = d3
        .select("#tsne")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

      const domainPadScale = 0.1;

      // Add X axis
      const minX = _.min(_.map(tsne_data, (d) => {return(d.x)}))
      const maxX = _.max(_.map(tsne_data, (d) => {return(d.x)}))

      const x = d3.scaleLinear()
        .domain([minX - Math.abs(minX * domainPadScale), maxX + Math.abs(maxX * domainPadScale)])
        .range([0, width]);

      svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

      // Add Y axis
      const minY = _.min(_.map(tsne_data, (d) => {return(d.y)}))
      const maxY = _.max(_.map(tsne_data, (d) => {return(d.y)}))

      const y = d3.scaleLinear()
        .domain([minY - Math.abs(minY * domainPadScale), maxY + Math.abs(maxY * domainPadScale)])
        .range([0, height]);

      svg.append("g")
        .call(d3.axisLeft(y));

      // Color scale
      const uniq_clusts = _.uniq(_.map(tsne_data, (d) => {return(d.cluster)}))
      const clusterScale = d3.scaleOrdinal(d3.schemePaired)
        .domain(uniq_clusts)

      // Add points
      svg.append("g")
        .selectAll(".cells")
        .data(tsne_data)
        .enter()
        .append("circle")
        .attr("cx", (d) => {return(x(d.x))})
        .attr("cy", (d) => {return(y(d.y))})
        .attr("r", 1.5)
        .attr("class", "cells")
        .style("fill", (d) => {return(clusterScale(d.cluster))});
    }
  }
}
</script>