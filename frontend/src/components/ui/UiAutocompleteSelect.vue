<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: [Number, String, null],
    default: null,
  },
  options: {
    type: Array,
    default: () => [],
  },
  label: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "Начните вводить...",
  },
  error: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue"]);

const rootRef = ref(null);
const inputRef = ref(null);
const isOpen = ref(false);
const query = ref("");
const activeIndex = ref(-1);

const normalizedOptions = computed(() =>
  props.options.map((item) => ({
    id: Number(item.id),
    name: String(item.name || "").trim(),
  }))
);

const filteredOptions = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return normalizedOptions.value.slice(0, 30);
  return normalizedOptions.value.filter((item) => item.name.toLowerCase().includes(q)).slice(0, 30);
});

function syncQueryFromModel() {
  const selected = normalizedOptions.value.find((item) => item.id === Number(props.modelValue));
  query.value = selected?.name || "";
}

function openList() {
  isOpen.value = true;
  activeIndex.value = -1;
}

function closeList() {
  isOpen.value = false;
  activeIndex.value = -1;
}

function onInput(event) {
  query.value = event.target.value;
  openList();
  if (!query.value.trim()) {
    emit("update:modelValue", null);
  }
}

function selectOption(option) {
  query.value = option.name;
  emit("update:modelValue", option.id);
  closeList();
}

function onKeydown(event) {
  if (!isOpen.value) return;
  if (event.key === "ArrowDown") {
    event.preventDefault();
    activeIndex.value = Math.min(activeIndex.value + 1, filteredOptions.value.length - 1);
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
    return;
  }
  if (event.key === "Enter") {
    if (activeIndex.value >= 0 && filteredOptions.value[activeIndex.value]) {
      event.preventDefault();
      selectOption(filteredOptions.value[activeIndex.value]);
    }
    return;
  }
  if (event.key === "Escape") {
    closeList();
  }
}

function onBlur() {
  const exact = normalizedOptions.value.find((item) => item.name.toLowerCase() === query.value.trim().toLowerCase());
  if (exact) {
    emit("update:modelValue", exact.id);
    query.value = exact.name;
  } else if (!query.value.trim()) {
    emit("update:modelValue", null);
  } else {
    syncQueryFromModel();
  }
  setTimeout(closeList, 80);
}

function onDocumentClick(event) {
  const root = rootRef.value;
  if (!root) return;
  if (!root.contains(event.target)) {
    closeList();
  }
}

onMounted(() => {
  syncQueryFromModel();
  document.addEventListener("click", onDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick);
});

watch(
  () => [props.modelValue, props.options],
  () => {
    if (!isOpen.value) {
      syncQueryFromModel();
    }
  },
  { deep: true }
);
</script>

<template>
  <div ref="rootRef" class="autocomplete">
    <label class="autocomplete__label">{{ label }}</label>
    <input
      ref="inputRef"
      :value="query"
      :placeholder="placeholder"
      class="autocomplete__input"
      :class="{ 'autocomplete__input--error': Boolean(error) }"
      type="text"
      autocomplete="off"
      @focus="openList"
      @input="onInput"
      @keydown="onKeydown"
      @blur="onBlur"
    />

    <ul v-if="isOpen" class="autocomplete__list">
      <li v-if="filteredOptions.length === 0" class="autocomplete__empty">Ничего не найдено</li>
      <li
        v-for="(item, index) in filteredOptions"
        :key="item.id"
        class="autocomplete__item"
        :class="{ active: index === activeIndex }"
        @mousedown.prevent="selectOption(item)"
      >
        {{ item.name }}
      </li>
    </ul>
    <small v-if="error" class="autocomplete__error">{{ error }}</small>
  </div>
</template>

<style scoped>
.autocomplete {
  position: relative;
  display: grid;
  gap: 7px;
}

.autocomplete__label {
  color: #5f708c;
  font-weight: 600;
  font-size: 14px;
}

.autocomplete__input {
  border: 1px solid #ced8e8;
  border-radius: 14px;
  padding: 12px 14px;
  color: #1f2e48;
  background: #eef3fa;
  outline: none;
}

.autocomplete__input:focus {
  border-color: #7aaef2;
  box-shadow: 0 0 0 3px rgba(42, 142, 243, 0.14);
}

.autocomplete__input--error {
  border-color: #da7f7f;
  background: #fff6f6;
}

.autocomplete__list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 6px;
  list-style: none;
  border: 1px solid #d1dcec;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 10px 22px rgba(29, 46, 73, 0.12);
  z-index: 20;
  max-height: 230px;
  overflow-y: auto;
}

.autocomplete__item,
.autocomplete__empty {
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 14px;
}

.autocomplete__item {
  cursor: pointer;
}

.autocomplete__item:hover,
.autocomplete__item.active {
  background: #edf4fe;
}

.autocomplete__empty {
  color: #73829b;
}

.autocomplete__error {
  color: #aa2f2f;
  font-size: 12px;
}
</style>
