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
  <section class="admin-panel user-form-panel">
    <header class="user-form-panel__head">
      <h2>Создание пользователя</h2>
      <p>Добавление участников и администраторов с базовыми параметрами аккаунта.</p>
    </header>

    <form class="user-form" @submit.prevent="onSubmit">
      <label class="user-field">
        <span>ФИО</span>
        <input
          :value="modelValue.fullName"
          type="text"
          required
          maxlength="120"
          placeholder="Введите полное имя"
          @input="updateField('fullName', $event.target.value)"
        />
      </label>
      <label class="user-field">
        <span>Телефон</span>
        <input
          :value="modelValue.phone"
          type="text"
          required
          maxlength="20"
          placeholder="+7 (999) 999-99-99"
          @input="updateField('phone', $event.target.value)"
        />
      </label>
      <label class="user-field">
        <span>Email</span>
        <input
          :value="modelValue.email"
          type="email"
          required
          maxlength="180"
          placeholder="mail@example.com"
          @input="updateField('email', $event.target.value)"
        />
      </label>
      <label class="user-field">
        <span>Пароль</span>
        <input
          :value="modelValue.password"
          type="text"
          required
          minlength="8"
          maxlength="120"
          placeholder="Минимум 8 символов"
          @input="updateField('password', $event.target.value)"
        />
      </label>
      <label class="user-field">
        <span>Роль</span>
        <select :value="modelValue.role" @change="updateField('role', $event.target.value)">
          <option value="USER">Пользователь</option>
          <option value="ADMIN">Администратор</option>
        </select>
      </label>
      <label class="user-field">
        <span>Учебное заведение</span>
        <select :value="modelValue.institutionId" @change="updateField('institutionId', $event.target.value)">
          <option value="">Без учебного заведения</option>
          <option v-for="item in institutions" :key="item.id" :value="String(item.id)">
            {{ item.name }}
          </option>
        </select>
      </label>

      <div class="user-form__actions">
        <UiButton type="submit" :loading="submitting">Создать пользователя</UiButton>
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

.user-form-panel {
  padding: 18px;
}

.user-form-panel__head h2 {
  margin: 0;
  font-size: clamp(24px, 2vw, 30px);
  color: #1c2f4d;
}

.user-form-panel__head p {
  margin: 8px 0 0;
  color: #596e8b;
}

.user-form {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.user-field {
  display: grid;
  gap: 7px;
}

.user-field span {
  color: #4f6281;
  font-weight: 700;
  font-size: 13px;
}

.user-field input,
.user-field select {
  border: 1px solid #d4deec;
  border-radius: 14px;
  padding: 11px 13px;
  background: #edf3fb;
  color: #233554;
  outline: none;
}

.user-field input:focus,
.user-field select:focus {
  border-color: #7fa9e4;
  box-shadow: 0 0 0 3px rgba(90, 135, 201, 0.18);
}

.user-form__actions {
  grid-column: 1 / -1;
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
