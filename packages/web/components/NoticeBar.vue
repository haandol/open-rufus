<template>
  <div class="bg-white p-4 text-center">
    <p>
      <slot>Additional customs documents are required for your destination.</slot>
      <slot name="link">
        <a href="#" class="text-blue-600">Please click here to learn more.</a>
      </slot>
    </p>
  </div>
</template>