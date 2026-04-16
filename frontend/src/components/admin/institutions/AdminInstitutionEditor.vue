<script setup>
import UiButton from "../../ui/UiButton.vue";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  editing: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "submit", "reset"]);

function updateName(value) {
  emit("update:modelValue", { ...props.modelValue, name: value });
}

function onSubmit() {
  emit("submit");
}

function onReset() {
  emit("reset");
}
</script>

<template>
  <section class="admin-panel editor-panel">
    <header class="editor-panel__head">
      <h2>{{ editing ? "Редактирование учебного заведения" : "Новое учебное заведение" }}</h2>
      <p>Создавайте и обновляйте справочник учебных заведений.</p>
    </header>

    <form class="editor-form" @submit.prevent="onSubmit">
      <label class="editor-field">
        <span>Название</span>
        <input
          :value="modelValue.name"
          type="text"
          required
          maxlength="180"
          placeholder="Например: Московский технический колледж"
          @input="updateName($event.target.value)"
        />
      </label>

      <div class="editor-actions">
        <UiButton type="submit" :loading="saving">
          {{ editing ? "Сохранить изменения" : "Создать учебное заведение" }}
        </UiButton>
        <button type="button" class="action-btn action-btn-soft" :disabled="saving" @click="onReset">
          Очистить форму
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.admin-panel {
  border: 1px solid #d7e1ee;
  border-radius: 24px;
  background: linear-gradient(180deg, #ffffff, #f7faff);
  box-shadow: 0 12px 30px rgba(30, 45, 73, 0.09);
}

.editor-panel {
  padding: 18px;
}

.editor-panel__head h2 {
  margin: 0;
  font-size: clamp(24px, 2vw, 30px);
  color: #1c2f4d;
}

.editor-panel__head p {
  margin: 8px 0 0;
  color: #596e8b;
}

.editor-form {
  margin-top: 12px;
  display: grid;
  gap: 12px;
}

.editor-field {
  display: grid;
  gap: 7px;
}

.editor-field span {
  color: #4f6281;
  font-weight: 700;
  font-size: 13px;
}

.editor-field input {
  border: 1px solid #d4deec;
  border-radius: 14px;
  padding: 11px 13px;
  background: #edf3fb;
  color: #233554;
  outline: none;
}

.editor-field input:focus {
  border-color: #7fa9e4;
  box-shadow: 0 0 0 3px rgba(90, 135, 201, 0.18);
}

.editor-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.action-btn-soft {
  background: #e7eef9;
  color: #1f3658;
}

.action-btn-soft:hover:not(:disabled) {
  background: #dbe7f8;
}
</style>
