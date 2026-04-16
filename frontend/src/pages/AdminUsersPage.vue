<script setup>
import { computed, onMounted, ref } from "vue";
import { api } from "../api";
import AdminShell from "../components/AdminShell.vue";
import ToastMessage from "../components/ToastMessage.vue";
import UiSegmentTabs from "../components/ui/UiSegmentTabs.vue";
import UiStatCard from "../components/ui/UiStatCard.vue";
import AdminUserCreateForm from "../components/admin/users/AdminUserCreateForm.vue";
import AdminUserCard from "../components/admin/users/AdminUserCard.vue";

const loading = ref(false);
const submitting = ref(false);
const error = ref("");
const success = ref("");
const users = ref([]);
const institutions = ref([]);
const search = ref("");
const roleFilter = ref("ALL");
const institutionFilter = ref("ALL");

const roleFilters = [
  { value: "ALL", label: "Все роли" },
  { value: "USER", label: "Пользователи" },
  { value: "ADMIN", label: "Администраторы" },
];

const form = ref(makeEmptyUserForm());

const filteredUsers = computed(() => {
  return users.value.filter((user) => {
    const matchesRole = roleFilter.value === "ALL" || user.role === roleFilter.value;
    const matchesInstitution =
      institutionFilter.value === "ALL" || String(user.institutionId || "") === institutionFilter.value;
    return matchesRole && matchesInstitution;
  });
});

const stats = computed(() => {
  return users.value.reduce(
    (acc, user) => {
      acc.total += 1;
      if (user.role === "ADMIN") acc.admins += 1;
      if (user.role === "USER") acc.users += 1;
      if (user.institutionId) acc.withInstitution += 1;
      return acc;
    },
    { total: 0, admins: 0, users: 0, withInstitution: 0 }
  );
});

function makeEmptyUserForm() {
  return {
    fullName: "",
    phone: "",
    email: "",
    password: "",
    role: "USER",
    institutionId: "",
  };
}

function resetForm() {
  form.value = makeEmptyUserForm();
}

async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    const [usersResponse, institutionsResponse] = await Promise.all([
      api.get("/admin/users", { params: { q: search.value.trim() || undefined } }),
      api.get("/institutions"),
    ]);
    users.value = usersResponse.data;
    institutions.value = institutionsResponse.data;
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
    const payload = {
      ...form.value,
      fullName: String(form.value.fullName || "").trim(),
      phone: String(form.value.phone || "").trim(),
      email: String(form.value.email || "").trim(),
      password: String(form.value.password || "").trim(),
      institutionId: form.value.institutionId ? Number(form.value.institutionId) : null,
    };

    if (payload.fullName.length < 5) {
      throw new Error("ФИО должно содержать минимум 5 символов.");
    }
    if (payload.password.length < 8) {
      throw new Error("Пароль должен содержать минимум 8 символов.");
    }

    await api.post("/admin/users", payload);
    resetForm();
    success.value = "Пользователь создан.";
    await loadData();
  } catch (err) {
    error.value = err?.response?.data?.message || err?.message || "Не удалось создать пользователя.";
  } finally {
    submitting.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <AdminShell title="Админка: пользователи">
    <ToastMessage :error="error" :success="success" />

    <section class="admin-users-hero">
      <div>
        <h2>Управление пользователями</h2>
        <p>Создание аккаунтов и удобный контроль ролей и принадлежности к учебным заведениям.</p>
      </div>
      <button type="button" class="action-btn action-btn-soft" @click="resetForm">Новый пользователь</button>
    </section>

    <section class="admin-users-stats">
      <UiStatCard label="Всего пользователей" :value="stats.total" />
      <UiStatCard label="Пользователей" :value="stats.users" />
      <UiStatCard label="Администраторов" :value="stats.admins" />
      <UiStatCard label="С учебным заведением" :value="stats.withInstitution" />
    </section>

    <section class="admin-users-workspace">
      <AdminUserCreateForm
        v-model="form"
        :institutions="institutions"
        :submitting="submitting"
        @submit="createUser"
        @reset="resetForm"
      />

      <section class="admin-panel users-filters-panel">
        <header>
          <h2>Фильтры списка</h2>
          <p>Используйте поиск на сервере и локальные фильтры для быстрого результата.</p>
        </header>

        <div class="users-filters-panel__controls">
          <label>
            <span>Поиск по ФИО или email</span>
            <input v-model.trim="search" type="text" placeholder="Введите имя или email" />
          </label>

          <label>
            <span>Учебное заведение</span>
            <select v-model="institutionFilter">
              <option value="ALL">Все учебные заведения</option>
              <option value="">Без учебного заведения</option>
              <option v-for="item in institutions" :key="item.id" :value="String(item.id)">
                {{ item.name }}
              </option>
            </select>
          </label>

          <button type="button" class="action-btn action-btn-soft" @click="loadData">Обновить список</button>
        </div>

        <UiSegmentTabs v-model="roleFilter" :items="roleFilters" />
      </section>
    </section>

    <section class="admin-users-list">
      <header class="admin-users-list__header">
        <h2>Реестр пользователей</h2>
        <p>Найдено: {{ filteredUsers.length }}</p>
      </header>

      <div v-if="loading" class="empty-state">Загружаем пользователей...</div>
      <div v-else-if="filteredUsers.length === 0" class="empty-state">Пользователи не найдены.</div>
      <div v-else class="users-grid">
        <AdminUserCard v-for="user in filteredUsers" :key="user.id" :user="user" />
      </div>
    </section>
  </AdminShell>
</template>

<style scoped>
.admin-panel {
  border: 1px solid #d7e1ee;
  border-radius: 24px;
  background: linear-gradient(180deg, #ffffff, #f7faff);
  box-shadow: 0 12px 30px rgba(30, 45, 73, 0.09);
}

.admin-users-hero {
  border: 1px solid #d7e1ef;
  background:
    radial-gradient(circle at 8% 12%, rgba(117, 178, 248, 0.16), transparent 38%),
    radial-gradient(circle at 88% 10%, rgba(67, 196, 170, 0.14), transparent 34%),
    linear-gradient(180deg, #ffffff, #f6faff);
  border-radius: 24px;
  padding: 18px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  box-shadow: 0 12px 26px rgba(30, 48, 77, 0.08);
}

.admin-users-hero h2 {
  margin: 0;
  color: #1b2f4c;
  font-size: clamp(26px, 2.8vw, 38px);
}

.admin-users-hero p {
  margin: 8px 0 0;
  color: #596e8b;
}

.admin-users-stats {
  margin-top: 14px;
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
}

.admin-users-workspace {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 12px;
  align-items: start;
}

.users-filters-panel {
  padding: 18px;
  display: grid;
  gap: 12px;
}

.users-filters-panel header h2 {
  margin: 0;
  color: #1c2f4d;
  font-size: clamp(24px, 2vw, 30px);
}

.users-filters-panel header p {
  margin: 8px 0 0;
  color: #596e8b;
}

.users-filters-panel__controls {
  display: grid;
  gap: 10px;
}

.users-filters-panel__controls label {
  display: grid;
  gap: 6px;
}

.users-filters-panel__controls span {
  color: #4f6281;
  font-size: 13px;
  font-weight: 700;
}

.users-filters-panel__controls input,
.users-filters-panel__controls select {
  border: 1px solid #d4deec;
  border-radius: 14px;
  padding: 11px 13px;
  background: #edf3fb;
  color: #233554;
  outline: none;
}

.admin-users-list {
  margin-top: 14px;
  border: 1px solid #d7e1ee;
  border-radius: 24px;
  background: linear-gradient(180deg, #ffffff, #f7faff);
  box-shadow: 0 12px 30px rgba(30, 45, 73, 0.09);
  padding: 18px;
}

.admin-users-list__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.admin-users-list__header h2 {
  margin: 0;
  color: #1c2f4d;
  font-size: clamp(24px, 2.2vw, 32px);
}

.admin-users-list__header p {
  margin: 0;
  color: #576b88;
}

.users-grid {
  margin-top: 12px;
  display: grid;
  gap: 10px;
}

.action-btn-soft {
  background: #e7eef9;
  color: #1f3658;
}

.action-btn-soft:hover:not(:disabled) {
  background: #dbe7f8;
}

:deep(.section-tabs) {
  background: #eaf0fa;
}

:deep(.seg-btn.active) {
  background: #0f1f37;
}

@media (max-width: 1120px) {
  .admin-users-workspace {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .admin-users-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .admin-users-list__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
