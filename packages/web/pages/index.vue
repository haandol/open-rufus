<template>
  <div class="w-full">
    <BannerMain />

    <div class="max-w-[1500px] mx-auto px-4">
      <BarNotice>
        <template #link>
          <a href="#" class="text-blue-600">Please click here to learn more.</a>
        </template>
      </BarNotice>

      <ProductGrid>
        <!-- Pick Up Section -->
        <ProductCard title="Pick up where you left off">
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-2">
              <img src="/img/products/laptop.png" alt="MacBook Air M2"
                class="w-full aspect-[4/3] object-cover rounded-lg" />
              <h3 class="text-lg font-medium">MacBook Air M2</h3>
            </div>
            <div class="space-y-2">
              <img src="/img/products/headphones.png" alt="Sony WH-1000XM5"
                class="w-full aspect-[4/3] object-cover rounded-lg" />
              <h3 class="text-lg font-medium">Sony WH-1000XM5</h3>
            </div>
            <div class="space-y-2">
              <img src="/img/products/smartwatch.png" alt="Apple Watch Series 8"
                class="w-full aspect-[4/3] object-cover rounded-lg" />
              <h3 class="text-lg font-medium">Apple Watch Series 8</h3>
            </div>
            <div class="space-y-2">
              <img src="/img/products/tablet.png" alt="iPad Pro 12.9&quot;"
                class="w-full aspect-[4/3] object-cover rounded-lg" />
              <h3 class="text-lg font-medium">iPad Pro 12.9"</h3>
            </div>
          </div>
          <template #footer>
            <a href="#" class="text-blue-600">See more</a>
          </template>
        </ProductCard>
        <!-- Free International Delivery -->
        <ProductCard image-path="/img/delivery.png" title="Free international delivery">
          <template #footer>
            <a href="#" class="text-blue-600">Click here to check eligibility.</a>
          </template>
        </ProductCard>

        <!-- Free Shipping Zone -->
        <ProductCard image-path="/img/shipping.png" title="Free Shipping Zone">
          <template #footer>
            <a href="#" class="text-blue-600">Shop now</a>
          </template>
        </ProductCard>

        <!-- Shop for Home Essentials -->
        <ProductCard title="Shop for your home essentials">
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-2">
              <img src="/img/cleaning-tools.png" alt="Cleaning Tools"
                class="w-full aspect-[4/3] object-cover rounded-lg" />
              <h3 class="text-lg font-medium">Cleaning Tools</h3>
            </div>
            <div class="space-y-2">
              <img src="/img/home-storage.png" alt="Home Storage" class="w-full aspect-[4/3] object-cover rounded-lg" />
              <h3 class="text-lg font-medium">Home Storage</h3>
            </div>
            <div class="space-y-2">
              <img src="/img/home-decor.png" alt="Home Decor" class="w-full aspect-[4/3] object-cover rounded-lg" />
              <h3 class="text-lg font-medium">Home Decor</h3>
            </div>
            <div class="space-y-2">
              <img src="/img/bedding.png" alt="Bedding" class="w-full aspect-[4/3] object-cover rounded-lg" />
              <h3 class="text-lg font-medium">Bedding</h3>
            </div>
          </div>
          <template #footer>
            <NuxtLink to="/" class="text-blue-600 hover:text-blue-800 font-medium">
              Discover more in Home
            </NuxtLink>
          </template>
        </ProductCard>

        <ProductCard image-path="/img/pickup.png" title="Get your game on">
          <template #footer>
            <a href="#" class="text-blue-600">See more</a>
          </template>
        </ProductCard>

        <!-- Top categories in Kitchen appliances -->
        <ProductCard title="Top categories in Kitchen appliances">
          <div class="space-y-4">
            <div class="space-y-2">
              <img src="/img/kitchen/cooker.png" alt="Cooker" class="w-full aspect-[16/9] object-cover rounded-lg" />
              <h3 class="text-lg font-medium">Cooker</h3>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div class="space-y-2">
                <img src="/img/kitchen/coffee.png" alt="Coffee" class="w-full aspect-square object-cover rounded-lg" />
                <h3 class="text-base font-medium">Coffee</h3>
              </div>
              <div class="space-y-2">
                <img src="/img/kitchen/pots.png" alt="Pots and Pans"
                  class="w-full aspect-square object-cover rounded-lg" />
                <h3 class="text-base font-medium">Pots and Pans</h3>
              </div>
              <div class="space-y-2">
                <img src="/img/kitchen/kettles.png" alt="Kettles"
                  class="w-full aspect-square object-cover rounded-lg" />
                <h3 class="text-base font-medium">Kettles</h3>
              </div>
            </div>
          </div>
          <template #footer>
            <a href="/category/kitchen" class="text-blue-600">
              Explore all products in Kitchen
            </a>
          </template>
        </ProductCard>

        <!-- Fill your basket with joy -->
        <ProductCard title="Fill your basket with joy">
          <div class="bg-yellow-300 rounded-lg p-6">
            <img src="/img/easter.png" alt="Easter Collection" class="w-full aspect-[4/3] object-contain" />
          </div>
          <template #footer>
            <a href="/easter" class="text-blue-600">Shop for Easter</a>
          </template>
        </ProductCard>

        <!-- Refresh your space -->
        <ProductCard title="Refresh your space">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <img src="/img/refresh/dining.png" alt="Dining" class="w-full aspect-square object-cover rounded-lg" />
              <h3 class="text-base font-medium">Dining</h3>
            </div>
            <div class="space-y-2">
              <img src="/img/refresh/home.png" alt="Home" class="w-full aspect-square object-cover rounded-lg" />
              <h3 class="text-base font-medium">Home</h3>
            </div>
            <div class="space-y-2">
              <img src="/img/refresh/kitchen.png" alt="Kitchen" class="w-full aspect-square object-cover rounded-lg" />
              <h3 class="text-base font-medium">Kitchen</h3>
            </div>
            <div class="space-y-2">
              <img src="/img/refresh/beauty.png" alt="Health and Beauty"
                class="w-full aspect-square object-cover rounded-lg" />
              <h3 class="text-base font-medium">Health and Beauty</h3>
            </div>
          </div>
          <template #footer>
            <a href="/refresh" class="text-blue-600">See more</a>
          </template>
        </ProductCard>

      </ProductGrid>
    </div>

    <!-- Chat bot toggle button -->
    <button @click="toggleChat"
      class="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all z-40">
      <i class="pi pi-comments text-xl" v-if="!isChatVisible"></i>
      <i class="pi pi-times text-xl" v-else></i>
    </button>

    <!-- Chat bot component -->
    <ChatBot :is-visible="isChatVisible" @close="isChatVisible = false" />
  </div>
</template>

<script lang="ts" setup>
import ChatBot from '~/components/chat/Bot.vue';

const isChatVisible = ref(false);

const toggleChat = () => {
  isChatVisible.value = !isChatVisible.value;
};

useHead({
  title: 'PACE - Online Shopping',
  meta: [
    { name: 'description', content: 'Shop online for electronics, computers, clothing, toys, books, and more on PACE.' }
  ]
})
</script>

<style lang="postcss" scoped></style>
