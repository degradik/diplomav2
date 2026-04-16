<script setup>
import { computed, onMounted, ref } from "vue";
import { api } from "../api";
import AdminShell from "../components/AdminShell.vue";
import ToastMessage from "../components/ToastMessage.vue";
import UiStatCard from "../components/ui/UiStatCard.vue";
import AdminInstitutionEditor from "../components/admin/institutions/AdminInstitutionEditor.vue";
import AdminInstitutionCard from "../components/admin/institutions/AdminInstitutionCard.vue";

const loading = ref(false);
const saving = ref(false);
const deletingId = ref(null);
const error = ref("");
const success = ref("");
const search = ref("");
const institutions = ref([]);
const form = ref({ name: "" });
const editId = ref(null);

const filteredInstitutions = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return institutions.value;
  return institutions.value.filter((item) => String(item.name || "").toLowerCase().includes(query));
});

const stats = computed(() => {
  return institutions.value.reduce(
    (acc, item) => {
      acc.total += 1;
      acc.users += item._count?.users || 0;
      acc.events += item._count?.events || 0;
      return acc;
    },
    { total: 0, users: 0, events: 0 }
  );
});

const topInstitutions = computed(() => {
  return [...institutions.value]
    .sort((a, b) => (b._count?.users || 0) - (a._count?.users || 0))
    .slice(0, 5);
});

async function loadInstitutions() {
  loading.value = true;
  error.value = "";
  try {
    const { data } = await api.get("/institutions");
    institutions.value = data;
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось загрузить учебные заведения.";
  } finally {
    loading.value = false;
  }
}

function startEdit(item) {
  editId.value = item.id;
  form.value.name = item.name;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  editId.value = null;
  form.value = { name: "" };
}

async function submit() {
  saving.value = true;
  error.value = "";
  success.value = "";
  try {
    const payload = { name: String(form.value.name || "").trim() };
    if (payload.name.length < 2) {
      throw new Error("Название учебного заведения должно содержать минимум 2 символа.");
    }

    if (editId.value) {
      await api.patch(`/admin/institutions/${editId.value}`, payload);
      success.value = "Учебное заведение обновлено.";
    } else {
      await api.post("/admin/institutions", payload);
      success.value = "Учебное заведение создано.";
    }
    resetForm();
    await loadInstitutions();
  } catch (err) {
    error.value = err?.response?.data?.message || err?.message || "Не удалось сохранить учебное заведение.";
  } finally {
    saving.value = false;
  }
}

async function removeInstitution(id) {
  const shouldDelete = window.confirm("Удалить учебное заведение? Если есть зависимости, сервер вернет ошибку.");
  if (!shouldDelete) return;

  deletingId.value = id;
  error.value = "";
  success.value = "";
  try {
    await api.delete(`/admin/institutions/${id}`);
    success.value = "Учебное заведение удалено.";
    if (editId.value === id) {
      resetForm();
    }
    await loadInstitutions();
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось удалить учебное заведение.";
  } finally {
    deletingId.value = null;
  }
}

onMounted(loadInstitutions);
</script>

<template>
  <AdminShell title="Админка: учебные заведения">
    <ToastMessage :error="error" :success="success" />

    <section class="admin-institutions-hero">
      <div>
        <h2>Управление учебными заведениями</h2>
        <p>Поддерживайте актуальный справочник для фильтрации пользователей и мероприятий.</p>
      </div>
      <button type="button" class="action-btn action-btn-soft" @click="resetForm">Новое учебное заведение</button>
    </section>

    <section class="admin-institutions-stats">
      <UiStatCard label="Учебных заведений" :value="stats.total" />
      <UiStatCard label="Привязанных пользователей" :value="stats.users" />
      <UiStatCard label="Привязанных мероприятий" :value="stats.events" />
    </section>

    <section class="admin-institutions-workspace">
      <AdminInstitutionEditor
        v-model="form"
        :saving="saving"
        :editing="Boolean(editId)"
        @submit="submit"
        @reset="resetForm"
      />

      <section class="admin-panel admin-institutions-top">
        <header>
          <h2>Топ по пользователям</h2>
          <p>Самые крупные учебные заведения по количеству аккаунтов.</p>
        </header>

        <div v-if="loading" class="empty-state">Загружаем данные...</div>
        <ul v-else-if="topInstitutions.length > 0" class="top-list">
          <li v-for="item in topInstitutions" :key="item.id">
            <div>
              <strong>{{ item.name }}</strong>
              <p>Пользователей: {{ item._count?.users ?? 0 }}</p>
            </div>
            <button type="button" class="action-btn action-btn-soft" @click="startEdit(item)">Изменить</button>
          </li>
        </ul>
        <div v-else class="empty-state">Список пока пуст.</div>
      </section>
    </section>

    <section class="admin-institutions-list">
      <header class="admin-institutions-list__header">
        <h2>Реестр учебных заведений</h2>
        <p>Поиск, редактирование и удаление элементов справочника.</p>
      </header>

      <div class="admin-institutions-list__filters">
        <input v-model.trim="search" type="text" placeholder="Поиск по названию учебного заведения" />
      </div>

      <div v-if="loading" class="empty-state">Загружаем учебные заведения...</div>
      <div v-else-if="filteredInstitutions.length === 0" class="empty-state">Поиск не дал результатов.</div>
      <div v-else class="institutions-grid">
        <AdminInstitutionCard
          v-for="item in filteredInstitutions"
          :key="item.id"
          :institution="item"
          :deleting="deletingId === item.id"
          @edit="startEdit"
          @delete="removeInstitution"
        />
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

.admin-institutions-hero {
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

.admin-institutions-hero h2 {
  margin: 0;
  color: #1b2f4c;
  font-size: clamp(26px, 2.8vw, 38px);
}

.admin-institutions-hero p {
  margin: 8px 0 0;
  color: #596e8b;
}

.admin-institutions-stats {
  margin-top: 14px;
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
}

.admin-institutions-workspace {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 12px;
  align-items: start;
}

.admin-institutions-top {
  padding: 18px;
}

.admin-institutions-top header h2 {
  margin: 0;
  color: #1c2f4d;
  font-size: clamp(24px, 2vw, 30px);
}

.admin-institutions-top header p {
  margin: 8px 0 0;
  color: #596e8b;
}

.top-list {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.top-list li {
  border: 1px solid #dbe6f4;
  border-radius: 14px;
  background: #eef4fd;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.top-list strong {
  color: #203451;
}

.top-list p {
  margin: 3px 0 0;
  color: #5f7391;
  font-size: 13px;
}

.admin-institutions-list {
  margin-top: 14px;
  border: 1px solid #d7e1ee;
  border-radius: 24px;
  background: linear-gradient(180deg, #ffffff, #f7faff);
  box-shadow: 0 12px 30px rgba(30, 45, 73, 0.09);
  padding: 18px;
}

.admin-institutions-list__header h2 {
  margin: 0;
  color: #1c2f4d;
  font-size: clamp(24px, 2.2vw, 32px);
}

.admin-institutions-list__header p {
  margin: 8px 0 0;
  color: #576b88;
}

.admin-institutions-list__filters {
  margin-top: 12px;
}

.admin-institutions-list__filters input {
  width: 100%;
  border: 1px solid #d4deec;
  border-radius: 14px;
  padding: 11px 12px;
  background: #edf3fb;
  color: #233554;
  outline: none;
}

.institutions-grid {
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

@media (max-width: 1120px) {
  .admin-institutions-workspace {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .admin-institutions-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .top-list li {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
