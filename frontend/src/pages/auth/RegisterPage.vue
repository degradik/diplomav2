<script setup>
import { reactive, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import AuthLayout from "../../layouts/AuthLayout.vue";
import ToastMessage from "../../components/ToastMessage.vue";
import UiInputField from "../../components/ui/UiInputField.vue";
import UiButton from "../../components/ui/UiButton.vue";
import { api, setAuthSession } from "../../api";

const router = useRouter();

const loading = ref(false);
const error = ref("");
const fieldErrors = reactive({
  fullName: "",
  email: "",
  password: "",
});

const form = reactive({
  fullName: "",
  email: "",
  password: "",
});

function clearFieldErrors() {
  fieldErrors.fullName = "";
  fieldErrors.email = "";
  fieldErrors.password = "";
}

function validateForm() {
  clearFieldErrors();
  let valid = true;

  const fullName = form.fullName.trim();
  const email = form.email.trim();

  if (fullName.length < 5 || fullName.length > 120) {
    fieldErrors.fullName = "ФИО должно быть от 5 до 120 символов.";
    valid = false;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Введите корректный email.";
    valid = false;
  }

  if (form.password.length < 8) {
    fieldErrors.password = "Пароль должен содержать минимум 8 символов.";
    valid = false;
  }

  return valid;
}

async function submit() {
  error.value = "";
  if (!validateForm()) return;

  loading.value = true;
  try {
    const { data } = await api.post("/auth/register", {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
    });
    setAuthSession(data.token, data.user);
    router.push("/events");
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось зарегистрироваться.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthLayout
    title="Создать аккаунт"
    subtitle="Регистрация занимает меньше минуты. Телефон и учебное заведение добавите в профиле."
  >
    <ToastMessage :error="error" />

    <form class="register-form" @submit.prevent="submit">
      <UiInputField
        v-model="form.fullName"
        label="ФИО"
        placeholder="Иванов Иван Иванович"
        autocomplete="name"
        :error="fieldErrors.fullName"
        required
      />

      <UiInputField
        v-model="form.email"
        label="Email"
        placeholder="name@mail.com"
        type="email"
        autocomplete="email"
        :error="fieldErrors.email"
        required
      />

      <UiInputField
        v-model="form.password"
        label="Пароль"
        placeholder="Минимум 8 символов"
        type="password"
        autocomplete="new-password"
        :error="fieldErrors.password"
        required
      />

      <div class="register-form__actions">
        <UiButton type="submit" :loading="loading">Зарегистрироваться</UiButton>
      </div>
    </form>

    <p class="register-form__footer">
      Уже есть аккаунт?
      <RouterLink to="/login">Войти</RouterLink>
    </p>
  </AuthLayout>
</template>

<style scoped>
.register-form {
  margin-top: 14px;
  display: grid;
  gap: 14px;
}

.register-form__actions {
  margin-top: 2px;
}

.register-form__footer {
  margin: 16px 0 0;
  color: #5f6f89;
}

.register-form__footer a {
  color: #214f95;
  font-weight: 600;
  text-decoration: none;
}

.register-form__footer a:hover {
  text-decoration: underline;
}
</style>
