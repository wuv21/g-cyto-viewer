<template>
    <v-chip class="ma-1" :color="chipColor" text-color="white">
        <v-avatar left>
            <v-icon>mdi-file-cabinet</v-icon>
        </v-avatar>
            <slot></slot>
    </v-chip>    
</template>

<script>
export default {
    name: "statusBadge",
    props: {
        "chip-color": {
            type: String,
            default: "#000000"
        }
    },
}
</script>

<style>

</style>

