<script setup>
import Editor from "@tinymce/tinymce-vue";
import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/models/dom/model";
import "tinymce-i18n/langs8/ru.js";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/plugins/code";
import "tinymce/plugins/table";
import "tinymce/plugins/autolink";
import "tinymce/plugins/preview";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  label: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "Введите текст...",
  },
});

const emit = defineEmits(["update:modelValue"]);

function onUpdate(value) {
  emit("update:modelValue", value || "");
}

const editorInit = {
  height: 360,
  menubar: "edit view insert format table",
  branding: false,
  statusbar: false,
  language: "ru",
  plugins: "autolink link lists table code preview",
  toolbar:
    "undo redo | blocks | bold italic underline | forecolor backcolor | bullist numlist | link table | alignleft aligncenter alignright | removeformat | code preview",
  block_formats: "Обычный текст=p;Заголовок 2=h2;Заголовок 3=h3;Цитата=blockquote",
  // Используем только бесплатные плагины из open-source поставки TinyMCE.
  content_style:
    "body { font-family: Manrope, sans-serif; font-size: 15px; line-height: 1.6; color: #253754; } h2,h3 { color: #1a2d49; }",
  placeholder: props.placeholder,
};
</script>

<template>
  <div class="editor-field">
    <span v-if="label" class="editor-field__label">{{ label }}</span>
    <Editor
      :model-value="modelValue"
      license-key="gpl"
      :init="editorInit"
      output-format="html"
      @update:model-value="onUpdate"
    />
  </div>
</template>

<style scoped>
.editor-field {
  display: grid;
  gap: 7px;
}

.editor-field__label {
  color: #5f708c;
  font-weight: 700;
  font-size: 13px;
}

.editor-field :deep(.tox-tinymce) {
  border-radius: 14px;
  border: 1px solid #d4ddec;
  overflow: hidden;
}

.editor-field :deep(.tox .tox-edit-area__iframe) {
  background: #ffffff;
}
</style>
