<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: "button",
  },
});
</script>

<template>
  <button class="ui-button" :type="type" :disabled="disabled || loading">
    <span v-if="loading">Подождите...</span>
    <slot v-else />
  </button>
</template>

<style scoped>
.ui-button {
  border: none;
  border-radius: 999px;
  padding: 12px 22px;
  font-weight: 700;
  color: #f5f9ff;
  background: linear-gradient(135deg, #11203a, #1f3a65);
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease;
}

.ui-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(16, 30, 57, 0.24);
}

.ui-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
