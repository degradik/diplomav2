<script setup>
defineProps({
  error: {
    type: String,
    default: "",
  },
  success: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <div v-if="error" class="state state-error">{{ error }}</div>
  <div v-if="success" class="state state-success">{{ success }}</div>
</template>
