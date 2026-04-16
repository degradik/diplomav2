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
  email: "",
  password: "",
});

const form = reactive({
  email: "",
  password: "",
});

function clearFieldErrors() {
  fieldErrors.email = "";
  fieldErrors.password = "";
}

function validateForm() {
  clearFieldErrors();
  let valid = true;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    fieldErrors.email = "Введите корректный email.";
    valid = false;
  }

  if (form.password.trim().length < 8) {
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
    const { data } = await api.post("/auth/login", {
      email: form.email.trim(),
      password: form.password,
    });

    setAuthSession(data.token, data.user);

    if (data.user.role === "ADMIN") {
      router.push("/admin/events");
      return;
    }

    router.push("/events");
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось выполнить вход.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthLayout
    title="Добро пожаловать"
    subtitle="Войдите в аккаунт участника, чтобы управлять регистрациями."
  >
    <ToastMessage :error="error" />

    <form class="login-form" @submit.prevent="submit">
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
        placeholder="Введите пароль"
        type="password"
        autocomplete="current-password"
        :error="fieldErrors.password"
        required
      />

      <div class="login-form__actions">
        <UiButton type="submit" :loading="loading">Войти</UiButton>
      </div>
    </form>

    <p class="login-form__footer">
      Еще нет аккаунта?
      <RouterLink to="/register">Зарегистрироваться</RouterLink>
    </p>
  </AuthLayout>
</template>

<style scoped>
.login-form {
  margin-top: 14px;
  display: grid;
  gap: 14px;
}

.login-form__actions {
  margin-top: 2px;
}

.login-form__footer {
  margin: 16px 0 0;
  color: #5f6f89;
}

.login-form__footer a {
  color: #214f95;
  font-weight: 600;
  text-decoration: none;
}

.login-form__footer a:hover {
  text-decoration: underline;
}
</style>
