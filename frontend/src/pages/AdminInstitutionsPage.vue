<script setup>
import { onMounted, ref } from "vue";
import AdminShell from "../components/AdminShell.vue";
import ToastMessage from "../components/ToastMessage.vue";
import { api } from "../api";

const loading = ref(false);
const saving = ref(false);
const error = ref("");
const success = ref("");
const institutions = ref([]);
const form = ref({ name: "" });
const editId = ref(null);

async function loadInstitutions() {
  loading.value = true;
  error.value = "";
  try {
    const { data } = await api.get("/institutions");
    institutions.value = data;
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось загрузить УЗ.";
  } finally {
    loading.value = false;
  }
}

function startEdit(item) {
  editId.value = item.id;
  form.value.name = item.name;
}

function resetForm() {
  editId.value = null;
  form.value.name = "";
}

async function submit() {
  saving.value = true;
  error.value = "";
  success.value = "";
  try {
    if (editId.value) {
      await api.patch(`/admin/institutions/${editId.value}`, form.value);
      success.value = "УЗ обновлено.";
    } else {
      await api.post("/admin/institutions", form.value);
      success.value = "УЗ создано.";
    }
    resetForm();
    await loadInstitutions();
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось сохранить УЗ.";
  } finally {
    saving.value = false;
  }
}

async function removeInstitution(id) {
  error.value = "";
  success.value = "";
  try {
    await api.delete(`/admin/institutions/${id}`);
    success.value = "УЗ удалено.";
    await loadInstitutions();
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось удалить УЗ.";
  }
}

onMounted(loadInstitutions);
</script>

<template>
  <AdminShell title="Админка: учебные заведения">
    <ToastMessage :error="error" :success="success" />

    <section class="block">
      <h2>{{ editId ? "Редактирование УЗ" : "Создание УЗ" }}</h2>
      <form class="form-grid" @submit.prevent="submit">
        <label>
          <span>Название</span>
          <input v-model.trim="form.name" type="text" required />
        </label>
        <div class="row-actions">
          <button type="submit" :disabled="saving">{{ saving ? "Сохраняем..." : editId ? "Сохранить" : "Создать" }}</button>
          <button type="button" class="action-btn action-btn-danger" @click="resetForm">Сбросить</button>
        </div>
      </form>
    </section>

    <section class="block">
      <h2>Справочник УЗ</h2>
      <div v-if="loading" class="empty-state">Загрузка...</div>
      <ul v-else class="participant-list">
        <li v-for="item in institutions" :key="item.id">
          <div>
            <strong>{{ item.name }}</strong>
            <p>Пользователей: {{ item._count?.users ?? 0 }} | Мероприятий: {{ item._count?.events ?? 0 }}</p>
          </div>
          <div class="row-actions">
            <button type="button" class="action-btn" @click="startEdit(item)">Изменить</button>
            <button type="button" class="action-btn action-btn-danger" @click="removeInstitution(item.id)">
              Удалить
            </button>
          </div>
        </li>
      </ul>
    </section>
  </AdminShell>
</template>
