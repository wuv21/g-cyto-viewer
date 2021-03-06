# g-cyto-viewer

Client-side software to visualize datasets generated from CITEseq approaches with antibody derived tags (ADT). Load in a TSV file with tSNE coordinates, cluster information, and scaled antibody expression values to interactively analyze the dataset straight from a browser.

Deployed [here](https://wuv21.github.io/g-cyto-viewer/).

![screenshot of website](img/screenshot.png)

## Current features
- Main scatter plot showing clusters
- Single polygonal gating with dual antibody scatter plot
- Heatmap of aggregated mean expression by cluster
- Small multiples of antibody expression
- Random downsampling of cells to improve efficiency as needed
- Multiple dimension reduction visualizations allowed
- Multiple cluster metadata

## Getting Started

Steps required to generate TSV file for visualization and analysis

1. Generate ADT dataset (i.e. CITE-seq-count -> Seurat v3 pipeline for ADT analysis)
2. Create a data frame from the seurat object (named `adt_seu` in example code below). Note: your object slot names may be different than ones used below.
    - Note: if you don't have oligo barcode metadata, any unique string identifier will work.
    - TSV settings are completely necessary

    ```r
    library(Seurat)
    library(tidyverse)
    
    # get scaled expression values and barcode column
    # can also use non-scaled data as well
    df_scaled_data <- data.frame(t(adt_seu@assays$adt@scale.data)) %>%
        mutate(barcode = rownames(.))

    # get dim reduction coordinates along with barcode and cluster identity
    tsne_coords <- adt_seu@reductions$tsne_adt_postCD45@cell.embeddings
    umap_coords <- adt_seu@reductions$umap@cell.embeddings

    df_final <- data.frame(
        barcode = rownames(tsne_coords),
        cluster_louvain = adt_seu$snn_postCD45_res.1.5,
        xaxis_tsne = tsne_coords[, 1],
        yaxis_tsne = tsne_coords[, 2],
        xaxis_umap = umap_coords[, 1],
        yaxis_umap = umap_coords[, 2]
    )

    # merge dataframes and save as TSV (tsv setttings are necessary!)
    df_save <- df_scaled_data %>%
        left_join(df_final, by = "barcode") %>%
        write.table("adt_subset.tsv",
            quote = FALSE,
            col.names = TRUE,
            row.names = FALSE, sep = "\t")
    ````

    The resultant TSV file will look somewhat like this:

    barcode | xaxis_tsne | yaxis_tsne | xaxis_umap | yaxis_umap | cluster_louvain | CD3 | CD4 | CD5 | CD8 | more_markers
    --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---
    TCGATGA | 3.214 | 3.4125 | -7.4 | 1.5 | 1 | -0.5 | 0.5 | 0.4 | 0.6 | etc...
    more cells... | | | | | | | | | | 

    The following columns must exist.
    - barcode
    - xaxis_?
    - yaxis_? 
    - cluster_?

    ...where `?` can be replaced by any alphanumeric symbols (i.e. tsne or umap).

    Metadata can be stored in the cluster_? columns.
    All other columns must be expression data (i.e. must contain numerical values).

3. Load up website and load in TSV dataset.
4. Visualize and analyze!

## For developers
To build upon this tool or to run a local instance:
1. Clone github repo
2. `cd` into repo
3. Install npm pacakges: `npm install`
4. Set up local host server: `npm run serve`
5. Navigate to `localhost:8080` on your browser (the port may differ by user's settings)

## Built with

* [Vue](https://vuejs.org/) - Web framework used
* [Vuetify](https://vuetifyjs.com/en/) - UI framework used with Vue
* [D3](https://d3js.org/) - Comprehensive data visualization package
* [D3 polybrush](https://gist.github.com/gtb104/3667340) and [D3 polybrush updated](http://bl.ocks.org/junwang23/bfcf242c09f0aaa0d6a27cdc84285a8e) - Polybrush for gating

## Acknowledgments

* Much thanks to [Mike Freeman](https://info474-s17.github.io/book/d3-reusability.html) for his tutorials regarding reusable charts and his template for a scatterplot chart.
* Much thanks to [Irene Ros](https://bocoup.com/blog/d3js-and-canvas) for her tutorial regarding d3 and canvas.
* Much thanks to [Nadieh Bremer](https://www.visualcinnamon.com/2015/11/learnings-from-a-d3-js-addict-on-starting-with-canvas.html) for her tutorial regarding d3 and canvas.
* Much thanks to the following tutorial(s) for more d3 and canvas implementations
    - [D3 brush and zoom](https://medium.com/@xoor/brush-and-zoom-with-d3-js-and-canvas-71859cd28832)