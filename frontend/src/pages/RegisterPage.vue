<script setup>
import { onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import ToastMessage from "../components/ToastMessage.vue";
import { api, setAuthSession } from "../api";

const router = useRouter();
const loading = ref(false);
const error = ref("");
const institutions = ref([]);
const fieldErrors = ref({});

const form = ref({
  fullName: "",
  phone: "",
  email: "",
  password: "",
  institutionId: "",
});

function validateForm() {
  const errors = {};

  if (form.value.fullName.trim().length < 5 || form.value.fullName.trim().length > 120) {
    errors.fullName = "ФИО должно быть от 5 до 120 символов.";
  }

  if (!/^\+?[0-9()\-\s]{7,20}$/.test(form.value.phone.trim())) {
    errors.phone = "Укажите корректный телефон.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email.trim())) {
    errors.email = "Укажите корректный email.";
  }

  if (form.value.password.length < 8) {
    errors.password = "Пароль должен содержать минимум 8 символов.";
  }

  if (!form.value.institutionId) {
    errors.institutionId = "Выберите учебное заведение.";
  }

  fieldErrors.value = errors;
  return Object.keys(errors).length === 0;
}

async function submit() {
  error.value = "";
  if (!validateForm()) return;

  loading.value = true;
  try {
    const payload = {
      ...form.value,
      institutionId: Number(form.value.institutionId),
    };
    const { data } = await api.post("/auth/register", payload);
    setAuthSession(data.token, data.user);
    router.push("/events");
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось зарегистрироваться.";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  try {
    const { data } = await api.get("/institutions");
    institutions.value = data;
  } catch (_err) {
    error.value = "Не удалось загрузить список учебных заведений.";
  }
});
</script>

<template>
  <div class="auth-page">
    <section class="auth-card">
      <h1>Регистрация</h1>
      <p>Создайте аккаунт участника для записи на мероприятия.</p>
      <ToastMessage :error="error" />
      <form class="form-grid" @submit.prevent="submit">
        <label>
          <span>ФИО</span>
          <input v-model.trim="form.fullName" type="text" required />
          <small v-if="fieldErrors.fullName" class="field-error">{{ fieldErrors.fullName }}</small>
        </label>
        <label>
          <span>Телефон</span>
          <input v-model.trim="form.phone" type="text" required />
          <small v-if="fieldErrors.phone" class="field-error">{{ fieldErrors.phone }}</small>
        </label>
        <label>
          <span>Email</span>
          <input v-model.trim="form.email" type="email" required />
          <small v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</small>
        </label>
        <label>
          <span>Пароль</span>
          <input v-model.trim="form.password" type="password" required />
          <small v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</small>
        </label>
        <label>
          <span>Учебное заведение</span>
          <select v-model="form.institutionId" required>
            <option value="">Выберите УЗ</option>
            <option v-for="item in institutions" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
          <small v-if="fieldErrors.institutionId" class="field-error">{{ fieldErrors.institutionId }}</small>
        </label>
        <button type="submit" :disabled="loading">
          {{ loading ? "Создаем аккаунт..." : "Зарегистрироваться" }}
        </button>
      </form>
      <p class="auth-links">
        Уже есть аккаунт?
        <RouterLink to="/login">Войти</RouterLink>
      </p>
    </section>
  </div>
</template>
