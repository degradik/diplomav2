<script setup>
import { computed } from "vue";

const props = defineProps({
  events: {
    type: Array,
    default: () => [],
  },
  institutions: {
    type: Array,
    default: () => [],
  },
  selectedEventId: {
    type: String,
    default: "",
  },
  search: {
    type: String,
    default: "",
  },
  institutionId: {
    type: String,
    default: "",
  },
  participants: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  removingParticipantId: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits(["update:selectedEventId", "update:search", "update:institutionId", "apply", "remove"]);

const selectedEvent = computed(() => props.events.find((item) => String(item.id) === props.selectedEventId) || null);

function formatDate(value) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function removeParticipant(userId) {
  emit("remove", userId);
}
</script>

<template>
  <section class="admin-panel participants-panel">
    <header class="participants-panel__head">
      <h2>Участники мероприятий</h2>
      <p v-if="selectedEvent">
        Активное мероприятие: <strong>{{ selectedEvent.title }}</strong>
      </p>
      <p v-else>Выберите мероприятие, чтобы управлять списком участников.</p>
    </header>

    <div class="participants-toolbar">
      <select
        :value="selectedEventId"
        @change="$emit('update:selectedEventId', $event.target.value)"
      >
        <option value="">Выберите мероприятие</option>
        <option v-for="item in events" :key="item.id" :value="String(item.id)">
          {{ item.title }}
        </option>
      </select>

      <input
        :value="search"
        type="text"
        placeholder="Поиск по имени или email"
        @input="$emit('update:search', $event.target.value)"
      />

      <select
        :value="institutionId"
        @change="$emit('update:institutionId', $event.target.value)"
      >
        <option value="">Все учебные заведения</option>
        <option v-for="item in institutions" :key="item.id" :value="String(item.id)">
          {{ item.name }}
        </option>
      </select>

      <button type="button" class="action-btn action-btn-soft" @click="$emit('apply')">Применить</button>
    </div>

    <div v-if="!selectedEventId" class="empty-state">Сначала выберите мероприятие из списка выше.</div>
    <div v-else-if="loading" class="empty-state">Загружаем участников...</div>
    <div v-else-if="participants.length === 0" class="empty-state">Участники не найдены.</div>
    <ul v-else class="participants-list">
      <li v-for="item in participants" :key="`${item.userId}-${item.eventId}`">
        <div class="participants-list__main">
          <div class="participants-list__avatar">{{ item.user.name?.slice(0, 1)?.toUpperCase() || "У" }}</div>
          <div class="participants-list__info">
            <strong>{{ item.user.name }}</strong>
            <p>{{ item.user.email }}</p>
            <small>{{ item.user.institution?.name || "Без учебного заведения" }}</small>
          </div>
        </div>
        <div class="participants-list__actions">
          <small>{{ formatDate(item.registeredAt) }}</small>
          <button
            type="button"
            class="action-btn action-btn-danger"
            :disabled="removingParticipantId === item.userId"
            @click="removeParticipant(item.userId)"
          >
            {{ removingParticipantId === item.userId ? "Удаляем..." : "Удалить" }}
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.admin-panel {
  border: 1px solid #d7e1ee;
  border-radius: 24px;
  background: linear-gradient(180deg, #ffffff, #f7faff);
  box-shadow: 0 12px 30px rgba(30, 45, 73, 0.09);
}

.participants-panel {
  padding: 18px;
  display: grid;
  gap: 12px;
  align-content: start;
}

.participants-panel__head h2 {
  margin: 0;
  color: #1c2f4d;
  font-size: clamp(24px, 2vw, 30px);
}

.participants-panel__head p {
  margin: 8px 0 0;
  color: #576b88;
}

.participants-toolbar {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr auto;
  gap: 8px;
}

.participants-toolbar select,
.participants-toolbar input {
  border: 1px solid #d4deec;
  border-radius: 14px;
  padding: 11px 12px;
  background: #edf3fb;
  color: #233554;
  outline: none;
}

.participants-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.participants-list li {
  border: 1px solid #d7e0ed;
  border-radius: 14px;
  background: #f9fbff;
  padding: 11px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.participants-list__main {
  display: flex;
  gap: 10px;
  align-items: center;
}

.participants-list__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #122540, #2b4e82);
  color: #f6f9ff;
  display: grid;
  place-items: center;
  font-weight: 800;
}

.participants-list__info strong {
  color: #203451;
}

.participants-list__info p {
  margin: 3px 0;
  color: #516583;
}

.participants-list__info small {
  color: #6b7e99;
}

.participants-list__actions {
  display: grid;
  gap: 6px;
  justify-items: end;
}

.participants-list__actions small {
  color: #667b97;
}

.action-btn-soft {
  background: #e7eef9;
  color: #1f3658;
}

.action-btn-soft:hover:not(:disabled) {
  background: #dbe7f8;
}

@media (max-width: 1280px) {
  .participants-toolbar {
    grid-template-columns: 1fr;
  }

  .participants-list li {
    flex-direction: column;
    align-items: flex-start;
  }

  .participants-list__actions {
    justify-items: start;
  }
}
</style>
