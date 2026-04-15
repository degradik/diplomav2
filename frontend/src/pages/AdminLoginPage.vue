<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import ToastMessage from "../components/ToastMessage.vue";
import { api, setAuthSession } from "../api";

const router = useRouter();
const loading = ref(false);
const error = ref("");
const form = ref({
  email: "admin@mail.com",
  password: "admin",
});

async function submit() {
  loading.value = true;
  error.value = "";
  try {
    const { data } = await api.post("/auth/login", form.value);
    if (data.user.role !== "ADMIN") {
      error.value = "Этот аккаунт не имеет прав администратора.";
      return;
    }
    setAuthSession(data.token, data.user);
    router.push("/admin/events");
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось войти в админку.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <section class="auth-card">
      <h1>Вход в админку</h1>
      <p>Управление мероприятиями, УЗ и участниками.</p>
      <ToastMessage :error="error" />
      <form class="form-grid" @submit.prevent="submit">
        <label>
          <span>Email</span>
          <input v-model.trim="form.email" type="email" required />
        </label>
        <label>
          <span>Пароль</span>
          <input v-model.trim="form.password" type="password" required />
        </label>
        <button type="submit" :disabled="loading">{{ loading ? "Входим..." : "Войти" }}</button>
      </form>
    </section>
  </div>
</template>
