<script setup>
import { onMounted, ref } from "vue";
import AdminShell from "../components/AdminShell.vue";
import ToastMessage from "../components/ToastMessage.vue";
import { api } from "../api";

const loading = ref(false);
const submitting = ref(false);
const error = ref("");
const success = ref("");
const users = ref([]);
const institutions = ref([]);
const search = ref("");

const form = ref({
  fullName: "",
  phone: "",
  email: "",
  password: "",
  role: "USER",
  institutionId: "",
});

async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    const [usersResp, institutionsResp] = await Promise.all([
      api.get("/admin/users", { params: { q: search.value || undefined } }),
      api.get("/institutions"),
    ]);
    users.value = usersResp.data;
    institutions.value = institutionsResp.data;
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось загрузить пользователей.";
  } finally {
    loading.value = false;
  }
}

async function createUser() {
  submitting.value = true;
  error.value = "";
  success.value = "";
  try {
    await api.post("/admin/users", {
      ...form.value,
      institutionId: form.value.institutionId ? Number(form.value.institutionId) : null,
    });
    form.value = {
      fullName: "",
      phone: "",
      email: "",
      password: "",
      role: "USER",
      institutionId: "",
    };
    success.value = "Пользователь создан.";
    await loadData();
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось создать пользователя.";
  } finally {
    submitting.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <AdminShell title="Админка: пользователи">
    <ToastMessage :error="error" :success="success" />

    <section class="block">
      <h2>Создание пользователя</h2>
      <form class="form-grid profile-grid" @submit.prevent="createUser">
        <label>
          <span>ФИО</span>
          <input v-model.trim="form.fullName" type="text" required />
        </label>
        <label>
          <span>Телефон</span>
          <input v-model.trim="form.phone" type="text" required />
        </label>
        <label>
          <span>Email</span>
          <input v-model.trim="form.email" type="email" required />
        </label>
        <label>
          <span>Пароль</span>
          <input v-model.trim="form.password" type="text" required />
        </label>
        <label>
          <span>Роль</span>
          <select v-model="form.role">
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>
        <label>
          <span>УЗ</span>
          <select v-model="form.institutionId">
            <option value="">Без УЗ</option>
            <option v-for="item in institutions" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </label>
        <button type="submit" :disabled="submitting">{{ submitting ? "Сохраняем..." : "Создать" }}</button>
      </form>
    </section>

    <section class="block">
      <h2>Список пользователей</h2>
      <div class="participants-toolbar">
        <input v-model.trim="search" type="text" placeholder="Поиск по ФИО или email" />
        <button type="button" class="action-btn" @click="loadData">Найти</button>
      </div>

      <div v-if="loading" class="empty-state">Загрузка...</div>
      <ul v-else class="participant-list">
        <li v-for="user in users" :key="user.id">
          <div>
            <strong>{{ user.fullName }}</strong>
            <p>{{ user.email }} | {{ user.phone }} | {{ user.role }}</p>
            <p>УЗ: {{ user.institution?.name || "Не указано" }}</p>
          </div>
        </li>
      </ul>
    </section>
  </AdminShell>
</template>
