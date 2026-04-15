<script setup>
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import ToastMessage from "../components/ToastMessage.vue";
import { api, setAuthSession } from "../api";

const router = useRouter();
const loading = ref(false);
const error = ref("");
const form = ref({
  email: "",
  password: "",
});

async function submit() {
  loading.value = true;
  error.value = "";
  try {
    const { data } = await api.post("/auth/login", form.value);
    setAuthSession(data.token, data.user);
    if (data.user.role === "ADMIN") {
      router.push("/admin/events");
    } else {
      router.push("/events");
    }
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось выполнить вход.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <section class="auth-card">
      <h1>Вход</h1>
      <p>Войдите в систему, чтобы просматривать доступные мероприятия.</p>
      <ToastMessage :error="error" />
      <form class="form-grid" @submit.prevent="submit">
        <label>
          <span>Почта</span>
          <input v-model.trim="form.email" type="email" required />
        </label>
        <label>
          <span>Пароль</span>
          <input v-model.trim="form.password" type="password" required />
        </label>
        <button type="submit" :disabled="loading">{{ loading ? "Входим..." : "Войти" }}</button>
      </form>
      <p class="auth-links">
        Нет аккаунта?
        <RouterLink to="/register">Зарегистрироваться</RouterLink>
      </p>
    </section>
  </div>
</template>
