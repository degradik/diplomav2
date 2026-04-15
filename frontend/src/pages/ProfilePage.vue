<script setup>
import { onMounted, ref } from "vue";
import UserShell from "../components/UserShell.vue";
import ToastMessage from "../components/ToastMessage.vue";
import { api, getAuthToken, refreshMe, setAuthSession } from "../api";

const loading = ref(false);
const saving = ref(false);
const error = ref("");
const success = ref("");
const institutions = ref([]);
const me = ref(null);
const form = ref({
  phone: "",
  institutionId: "",
});

async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    const [meData, institutionsData] = await Promise.all([
      refreshMe(),
      api.get("/institutions").then((response) => response.data),
    ]);
    me.value = meData;
    institutions.value = institutionsData;
    form.value.phone = meData.phone || "";
    form.value.institutionId = meData.institutionId ?? "";
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось загрузить профиль.";
  } finally {
    loading.value = false;
  }
}

async function saveProfile() {
  saving.value = true;
  error.value = "";
  success.value = "";
  try {
    const payload = {
      phone: form.value.phone,
      institutionId: Number(form.value.institutionId),
    };
    const { data } = await api.patch("/users/me", payload);
    me.value = data;
    const token = getAuthToken();
    if (token) {
      setAuthSession(token, data);
    }
    success.value = "Профиль успешно обновлен.";
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось сохранить профиль.";
  } finally {
    saving.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <UserShell title="Профиль">
    <ToastMessage :error="error" :success="success" />
    <section v-if="loading" class="block"><p>Загрузка профиля...</p></section>
    <section v-else class="block">
      <h2>Личные данные</h2>
      <form class="form-grid profile-grid" @submit.prevent="saveProfile">
        <label>
          <span>ФИО</span>
          <input :value="me?.fullName || ''" type="text" disabled />
        </label>
        <label>
          <span>Email</span>
          <input :value="me?.email || ''" type="email" disabled />
        </label>
        <label>
          <span>Телефон</span>
          <input v-model.trim="form.phone" type="text" required />
        </label>
        <label>
          <span>Учебное заведение</span>
          <select v-model="form.institutionId" required>
            <option value="">Выберите УЗ</option>
            <option v-for="item in institutions" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </label>
        <button type="submit" :disabled="saving">{{ saving ? "Сохраняем..." : "Сохранить" }}</button>
      </form>
    </section>
  </UserShell>
</template>
