<script setup>
import LegalLayout from './LegalLayout.vue'
import { legalData } from './legalContent'
</script>
<template>
  <LegalLayout :data="legalData.terms" />
</template>
