<script setup>
import UiButton from "../../ui/UiButton.vue";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  institutions: {
    type: Array,
    default: () => [],
  },
  submitting: {
    type: Boolean,
    default: false,
  },
  editing: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "submit", "reset"]);

function updateField(field, value) {
  emit("update:modelValue", {
    ...props.modelValue,
    [field]: value,
  });
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
      <h2>{{ editing ? "Редактирование мероприятия" : "Новое мероприятие" }}</h2>
      <p>Заполните карточку и контент страницы мероприятия.</p>
    </header>

    <form class="editor-form" @submit.prevent="onSubmit">
      <label class="editor-field">
        <span>Название</span>
        <input
          :value="modelValue.title"
          type="text"
          required
          maxlength="180"
          placeholder="Например: День открытых дверей"
          @input="updateField('title', $event.target.value)"
        />
      </label>

      <label class="editor-field">
        <span>Ссылка на изображение (необязательно)</span>
        <input
          :value="modelValue.imageUrl"
          type="url"
          maxlength="2048"
          placeholder="https://example.com/image.jpg"
          @input="updateField('imageUrl', $event.target.value)"
        />
      </label>

      <div class="editor-grid">
        <label class="editor-field">
          <span>Дата и время начала</span>
          <input
            :value="modelValue.startAt"
            type="datetime-local"
            required
            @input="updateField('startAt', $event.target.value)"
          />
        </label>
        <label class="editor-field">
          <span>Дата и время окончания</span>
          <input
            :value="modelValue.endAt"
            type="datetime-local"
            required
            @input="updateField('endAt', $event.target.value)"
          />
        </label>
      </div>

      <div class="editor-grid">
        <label class="editor-field">
          <span>Статус</span>
          <select :value="modelValue.status" @change="updateField('status', $event.target.value)">
            <option value="DRAFT">Черновик</option>
            <option value="PUBLISHED">Опубликовано</option>
            <option value="ARCHIVED">В архиве</option>
          </select>
        </label>

        <label class="editor-field">
          <span>Учебное заведение</span>
          <select
            :value="modelValue.institutionId"
            :disabled="modelValue.isPublic"
            @change="updateField('institutionId', $event.target.value)"
          >
            <option value="">Не выбрано</option>
            <option v-for="item in institutions" :key="item.id" :value="String(item.id)">
              {{ item.name }}
            </option>
          </select>
        </label>
      </div>

      <label class="editor-toggle">
        <input
          :checked="modelValue.isPublic"
          type="checkbox"
          @change="updateField('isPublic', $event.target.checked)"
        />
        <span>{{ modelValue.isPublic ? "Публичное мероприятие" : "Только для учебного заведения" }}</span>
      </label>

      <label class="editor-field">
        <span>Описание мероприятия (longtext)</span>
        <textarea
          :value="modelValue.content"
          rows="12"
          maxlength="60000"
          placeholder="Опишите программу, спикеров, условия участия и другие детали"
          @input="updateField('content', $event.target.value)"
        />
        <small class="editor-field__hint">
          {{ modelValue.content?.length || 0 }} / 60000
        </small>
      </label>

      <div class="editor-actions">
        <UiButton type="submit" :loading="submitting">
          {{ editing ? "Сохранить изменения" : "Создать мероприятие" }}
        </UiButton>
        <button type="button" class="action-btn action-btn-soft" :disabled="submitting" @click="onReset">
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

.editor-panel__head {
  margin-bottom: 14px;
}

.editor-panel__head h2 {
  margin: 0;
  font-size: clamp(24px, 2.2vw, 32px);
  color: #1c2f4d;
}

.editor-panel__head p {
  margin: 8px 0 0;
  color: #5a6d89;
}

.editor-form {
  display: grid;
  gap: 12px;
}

.editor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
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

.editor-field input,
.editor-field select,
.editor-field textarea {
  border: 1px solid #d4deec;
  border-radius: 14px;
  padding: 11px 13px;
  background: #edf3fb;
  color: #233554;
  outline: none;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.editor-field input:focus,
.editor-field select:focus,
.editor-field textarea:focus {
  border-color: #7fa9e4;
  box-shadow: 0 0 0 3px rgba(90, 135, 201, 0.18);
}

.editor-field textarea {
  resize: vertical;
  min-height: 220px;
  font-family: inherit;
  line-height: 1.5;
}

.editor-field__hint {
  color: #6d7f9b;
  font-size: 12px;
}

.editor-field select:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.editor-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border-radius: 999px;
  border: 1px solid #d7e2f0;
  background: #eef4fd;
  color: #1f3457;
  font-weight: 700;
  width: fit-content;
  padding: 8px 14px;
}

.editor-toggle input {
  width: 16px;
  height: 16px;
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
