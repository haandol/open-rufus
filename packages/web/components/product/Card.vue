<template>
  <div class="bg-white p-4 rounded shadow-sm hover:shadow-md transition-shadow">
    <h2 class="text-lg font-semibold mb-2">{{ title }}</h2>
    <div v-if="imagePath" class="aspect-square mb-4 overflow-hidden rounded-lg bg-gray-50">
      <NuxtImg :src="imagePath" :alt="title"
        class="w-full h-full object-contain hover:scale-105 transition-transform duration-300" />
    </div>
    <p v-if="description" class="text-gray-600 mb-4 text-sm">{{ description }}</p>
    <slot></slot>
    <slot name="footer">
      <a :href="link" class="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center">
        {{ linkText }}
        <i class="pi pi-arrow-right ml-1 text-xs"></i>
      </a>
    </slot>
  </div>
</template>

<script setup lang="ts">
interface Props {
  imagePath?: string;
  title: string;
  description?: string;
  link?: string;
  linkText?: string;
}

withDefaults(defineProps<Props>(), {
  imagePath: '',
  description: '',
  link: '#',
  linkText: 'See more'
})
</script>