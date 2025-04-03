<template>
  <div class="space-y-2">
    <div v-for="(suggestion, index) in suggestions" :key="index" :class="[
      'rounded-lg p-2.5 cursor-pointer transition-colors',
      suggestion.highlighted ? 'bg-blue-50 hover:bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'
    ]" @click="emit('select', suggestion)">
      <p :class="[
        'text-sm',
        suggestion.highlighted ? 'text-blue-600' : 'text-gray-800'
      ]">{{ suggestion.text }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Suggestion {
  text: string;
  highlighted?: boolean;
}

defineProps<{
  suggestions: Suggestion[];
}>();

const emit = defineEmits<{
  (e: 'select', suggestion: Suggestion): void
}>();
</script>