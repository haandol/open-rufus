<template>
  <dialog ref="modalElement" id="error_modal" class="modal modal-bottom sm:modal-middle">
    <form method="dialog" class="modal-box bg-white p-0 max-w-sm w-full mx-4">
      <!-- Header -->
      <div class="bg-[#232f3e] text-white p-4 rounded-t-lg flex items-center">
        <i class="pi pi-exclamation-triangle mr-2 text-lg"></i>
        <h3 class="font-bold text-lg">오류가 발생했습니다</h3>
      </div>

      <!-- Body -->
      <div class="p-6">
        <p class="text-gray-700">{{ errorMessage }}</p>
      </div>

      <!-- Footer -->
      <div class="modal-action p-4 border-t border-gray-100">
        <button class="btn bg-[#FF9900] hover:bg-[#e88b00] border-none text-white" @click="closeModal">
          확인
        </button>
      </div>
    </form>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  show: boolean;
  errorMessage: string | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const modalElement = ref<HTMLDialogElement | null>(null);

function closeModal() {
  emit('close');
}

watch(() => props.show, (newVal) => {
  if (newVal && modalElement.value) {
    modalElement.value.showModal();
  } else if (modalElement.value) {
    modalElement.value.close();
  }
}, { immediate: true });

onMounted(() => {
  if (props.show && modalElement.value) {
    modalElement.value.showModal();
  }
});
</script>