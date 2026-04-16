<script setup>
defineProps({
  label: {
    type: String,
    default: "",
  },
  value: {
    type: [String, Number],
    default: 0,
  },
  hint: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <article class="stat-card">
    <span class="stat-card__label">{{ label }}</span>
    <strong class="stat-card__value">{{ value }}</strong>
    <small v-if="hint" class="stat-card__hint">{{ hint }}</small>
  </article>
</template>

<style scoped>
.stat-card {
  border-radius: 16px;
  border: 1px solid #d2dceb;
  background: linear-gradient(180deg, #ffffff, #edf3fb);
  padding: 12px;
  display: grid;
  gap: 4px;
  box-shadow: 0 8px 18px rgba(35, 55, 88, 0.08);
}

.stat-card__label {
  font-size: 13px;
  color: #60708a;
  font-weight: 600;
}

.stat-card__value {
  font-size: 28px;
  color: #1b2a45;
}

.stat-card__hint {
  color: #7a879d;
}
</style>
