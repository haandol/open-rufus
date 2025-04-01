<template>
  <div class="bg-white p-4 rounded">
    <h2 class="text-xl font-bold mb-4">
      <slot name="title">Product Section</slot>
    </h2>
    <div class="mb-4">
      <slot>Content goes here</slot>
    </div>
    <slot name="footer">
      <a href="#" class="text-blue-600">See more</a>
    </slot>
  </div>
</template>

<script setup lang="ts">
// Reusable product card component with customizable content
</script>