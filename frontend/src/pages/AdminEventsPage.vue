<script setup>
import { computed, onMounted, ref } from "vue";
import AdminShell from "../components/AdminShell.vue";
import ToastMessage from "../components/ToastMessage.vue";
import { api } from "../api";

const loading = ref(false);
const submitting = ref(false);
const participantsLoading = ref(false);
const error = ref("");
const success = ref("");
const dashboard = ref({ users: 0, institutions: 0, events: 0, registrations: 0 });
const institutions = ref([]);
const events = ref([]);
const editingEventId = ref(null);
const participantFilters = ref({ q: "", institutionId: "" });
const selectedEventId = ref("");
const participants = ref([]);

const form = ref({
  title: "",
  content: "",
  startAt: "",
  endAt: "",
  institutionId: "",
  isPublic: true,
  status: "DRAFT",
});

const submitLabel = computed(() => (editingEventId.value ? "Сохранить изменения" : "Создать мероприятие"));

function toLocalInputValue(isoString) {
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function resetForm() {
  editingEventId.value = null;
  form.value = {
    title: "",
    content: "",
    startAt: "",
    endAt: "",
    institutionId: "",
    isPublic: true,
    status: "DRAFT",
  };
}

async function loadInitial() {
  loading.value = true;
  error.value = "";
  try {
    const [dashboardResp, eventsResp, institutionsResp] = await Promise.all([
      api.get("/admin/dashboard"),
      api.get("/admin/events"),
      api.get("/institutions"),
    ]);
    dashboard.value = dashboardResp.data;
    events.value = eventsResp.data;
    institutions.value = institutionsResp.data;
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось загрузить данные админки.";
  } finally {
    loading.value = false;
  }
}

function startEdit(eventItem) {
  editingEventId.value = eventItem.id;
  form.value = {
    title: eventItem.title,
    content: eventItem.content,
    startAt: toLocalInputValue(eventItem.startAt),
    endAt: toLocalInputValue(eventItem.endAt),
    institutionId: eventItem.institutionId ?? "",
    isPublic: eventItem.isPublic,
    status: eventItem.status,
  };
}

async function submitForm() {
  submitting.value = true;
  error.value = "";
  success.value = "";
  try {
    const payload = {
      ...form.value,
      startAt: new Date(form.value.startAt).toISOString(),
      endAt: new Date(form.value.endAt).toISOString(),
      institutionId: form.value.institutionId === "" ? null : Number(form.value.institutionId),
    };

    if (editingEventId.value) {
      await api.patch(`/admin/events/${editingEventId.value}`, payload);
      success.value = "Мероприятие обновлено.";
    } else {
      await api.post("/admin/events", payload);
      success.value = "Мероприятие создано.";
    }

    resetForm();
    await loadInitial();
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось сохранить мероприятие.";
  } finally {
    submitting.value = false;
  }
}

async function archiveEvent(eventId) {
  error.value = "";
  success.value = "";
  try {
    await api.delete(`/admin/events/${eventId}`, { params: { mode: "archive" } });
    success.value = "Мероприятие архивировано.";
    await loadInitial();
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось архивировать мероприятие.";
  }
}

async function deleteEvent(eventId) {
  error.value = "";
  success.value = "";
  try {
    await api.delete(`/admin/events/${eventId}`, { params: { mode: "delete" } });
    success.value = "Мероприятие удалено.";
    if (Number(selectedEventId.value) === eventId) {
      selectedEventId.value = "";
      participants.value = [];
    }
    await loadInitial();
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось удалить мероприятие.";
  }
}

async function loadParticipants() {
  if (!selectedEventId.value) {
    participants.value = [];
    return;
  }
  participantsLoading.value = true;
  error.value = "";
  try {
    const { data } = await api.get(`/admin/events/${selectedEventId.value}/participants`, {
      params: {
        q: participantFilters.value.q || undefined,
        institutionId: participantFilters.value.institutionId || undefined,
      },
    });
    participants.value = data;
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось загрузить участников.";
  } finally {
    participantsLoading.value = false;
  }
}

async function removeParticipant(userId) {
  error.value = "";
  success.value = "";
  try {
    await api.delete(`/admin/events/${selectedEventId.value}/participants/${userId}`);
    success.value = "Участник удален из мероприятия.";
    await loadParticipants();
    await loadInitial();
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось удалить участника.";
  }
}

onMounted(loadInitial);
</script>

<template>
  <AdminShell title="Админка: мероприятия">
    <ToastMessage :error="error" :success="success" />

    <section class="stats-grid">
      <article class="stat-item">
        <strong>{{ dashboard.events }}</strong>
        <span>Мероприятий</span>
      </article>
      <article class="stat-item">
        <strong>{{ dashboard.registrations }}</strong>
        <span>Регистраций</span>
      </article>
      <article class="stat-item">
        <strong>{{ dashboard.users }}</strong>
        <span>Пользователей</span>
      </article>
    </section>

    <section class="block">
      <h2>{{ editingEventId ? "Редактирование мероприятия" : "Создание мероприятия" }}</h2>
      <form class="form-grid profile-grid" @submit.prevent="submitForm">
        <label>
          <span>Название</span>
          <input v-model.trim="form.title" type="text" required />
        </label>
        <label>
          <span>Описание</span>
          <textarea v-model.trim="form.content" rows="3" required />
        </label>
        <label>
          <span>Начало</span>
          <input v-model="form.startAt" type="datetime-local" required />
        </label>
        <label>
          <span>Окончание</span>
          <input v-model="form.endAt" type="datetime-local" required />
        </label>
        <label>
          <span>УЗ</span>
          <select v-model="form.institutionId">
            <option value="">Общее мероприятие</option>
            <option v-for="item in institutions" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </label>
        <label>
          <span>Статус</span>
          <select v-model="form.status">
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </label>
        <label class="check">
          <input v-model="form.isPublic" type="checkbox" />
          Публичное мероприятие
        </label>
        <div class="row-actions">
          <button type="submit" :disabled="submitting">{{ submitting ? "Сохраняем..." : submitLabel }}</button>
          <button type="button" class="action-btn action-btn-danger" @click="resetForm">Сбросить</button>
        </div>
      </form>
    </section>

    <section class="block">
      <h2>Список мероприятий</h2>
      <div v-if="loading" class="empty-state">Загрузка...</div>
      <div v-else class="events-grid">
        <article v-for="item in events" :key="item.id" class="event-card">
          <div class="event-top">
            <span class="badge">{{ item.status }}</span>
            <strong>{{ item.title }}</strong>
          </div>
          <p>{{ new Date(item.startAt).toLocaleString("ru-RU") }}</p>
          <p>УЗ: {{ item.institution?.name || "Общее мероприятие" }}</p>
          <p>Участников: {{ item._count.participants }}</p>
          <div class="row-actions">
            <button type="button" class="action-btn" @click="startEdit(item)">Редактировать</button>
            <button type="button" class="action-btn" @click="archiveEvent(item.id)">Архивировать</button>
            <button type="button" class="action-btn action-btn-danger" @click="deleteEvent(item.id)">Удалить</button>
          </div>
        </article>
      </div>
    </section>

    <section class="block">
      <h2>Участники мероприятия</h2>
      <div class="participants-toolbar">
        <select v-model="selectedEventId" @change="loadParticipants">
          <option value="">Выберите мероприятие</option>
          <option v-for="item in events" :key="item.id" :value="item.id">
            {{ item.title }}
          </option>
        </select>
        <input v-model.trim="participantFilters.q" type="text" placeholder="Фильтр: ФИО или email" />
        <select v-model="participantFilters.institutionId">
          <option value="">Все УЗ</option>
          <option v-for="item in institutions" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
        <button type="button" class="action-btn" @click="loadParticipants">Применить</button>
      </div>

      <div v-if="participantsLoading" class="empty-state">Загрузка участников...</div>
      <div v-else-if="participants.length === 0" class="empty-state">Участники не найдены.</div>
      <ul v-else class="participant-list">
        <li v-for="item in participants" :key="`${item.userId}-${item.eventId}`">
          <div>
            <strong>{{ item.user.name }}</strong>
            <p>{{ item.user.email }} | {{ item.user.institution?.name || "Без УЗ" }}</p>
          </div>
          <button type="button" class="action-btn action-btn-danger" @click="removeParticipant(item.userId)">
            Удалить
          </button>
        </li>
      </ul>
    </section>
  </AdminShell>
</template>
