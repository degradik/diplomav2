<script setup>
defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  label: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "text",
  },
  autocomplete: {
    type: String,
    default: "off",
  },
  error: {
    type: String,
    default: "",
  },
  required: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

function onInput(event) {
  emit("update:modelValue", event.target.value);
}
</script>

<template>
  <label class="field">
    <span class="field__label">{{ label }}</span>
    <input
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :required="required"
      :disabled="disabled"
      :class="{ 'field__input--error': Boolean(error) }"
      class="field__input"
      @input="onInput"
    />
    <small v-if="error" class="field__error">{{ error }}</small>
  </label>
</template>

<style scoped>
.field {
  display: grid;
  gap: 7px;
}

.field__label {
  font-size: 14px;
  font-weight: 600;
  color: #42516a;
}

.field__input {
  border: 1px solid #ced8e8;
  border-radius: 14px;
  padding: 12px 14px;
  color: #1f2e48;
  background: #eef3fa;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.field__input:focus {
  border-color: #7aaef2;
  box-shadow: 0 0 0 3px rgba(42, 142, 243, 0.15);
}

.field__input--error {
  border-color: #da7f7f;
  background: #fff6f6;
}

.field__error {
  color: #aa2f2f;
  font-size: 12px;
}
</style>
