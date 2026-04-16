<script setup>
defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  items: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

function select(value) {
  emit("update:modelValue", value);
  emit("change", value);
}
</script>

<template>
  <div class="section-tabs">
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      class="seg-btn"
      :class="{ active: modelValue === item.value }"
      @click="select(item.value)"
    >
      {{ item.label }}
    </button>
  </div>
</template>
