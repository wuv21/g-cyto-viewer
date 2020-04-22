# g-cyto-viewer

Lorem ipsum

Deployed [here](https://wuv21.github.io/g-cyto-viewer/).

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
    df_scaled_data <- data.frame(t(adt_seu@assays$adt@scale.data)) %>%
    mutate(barcode = rownames(.))

    # get tsne coordinates along with barcode and cluster identity
    df_tsne <- data.frame(adt_seu@reductions$tsne_adt_postCD45B2M@cell.embeddings) %>%
        mutate(barcode = rownames(.),
                cluster = adt_seu$snn_adt_postCD45B2M_res.0.3)

    # merge dataframes and save as TSV (tsv setttings are necessary!)
    df_save <- df_scaled_data %>%
        left_join(df_tsne, by = "barcode") %>%
        write.table("adt_subset.tsv",
            quote = FALSE,
            col.names = TRUE,
            row.names = FALSE, sep = "\t")
    ````

    The resultant TSV file will look somewhat like this:

    barcode | tSNE_1 | tSNE_2 | cluster | CD3 | CD4 | CD5 | CD8 | more_markers
    --- | --- | --- | --- | --- | --- | --- | --- | --- 
    TCGATGA | 3.214 | 3.2.4125 | 1 | -0.5 | 0.5 | 0.4 | 0.6 | etc...
    more cells... | | | | | | | 

    The following columns must exist.
    - barcode
    - tSNE_1
    - tSNE_2
    - cluster

    All other columns must be expression data (i.e. must contain numerical values).

3. Load up website and load in TSV dataset.
4. Visualize and analyze to your heart's content!

## Built With

* [Vue](https://vuejs.org/) - Web framework used
* [Vuetify](https://vuetifyjs.com/en/) - UI framework used with Vue
* [D3](https://d3js.org/) - Comprehesnvie data visualization package
* [D3 polybrush](https://gist.github.com/gtb104/3667340) and [D3 polybrush updated](http://bl.ocks.org/junwang23/bfcf242c09f0aaa0d6a27cdc84285a8e) - Polybrush for gating

## Acknowledgments

* Much thanks to [Mike Freeman]() for his tutorials regarding reproducible charts
