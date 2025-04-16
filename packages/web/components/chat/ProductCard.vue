<template>
  <div class="bg-white p-3 rounded-md shadow-sm hover:shadow-md transition-shadow mb-3 border border-gray-100">
    <div class="flex items-center justify-between mb-2">
      <div class="text-[#232f3e] font-medium text-sm">{{ product.articleType }}</div>
      <div class="bg-[#FF9900] text-white text-xs px-2 py-0.5 rounded">{{ product.season }} {{ product.year }}</div>
    </div>

    <div class="flex gap-3 items-center">
      <!-- 상품 이미지 (placeholder) -->
      <div class="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
        <i class="pi pi-shopping-bag text-2xl text-gray-400"></i>
      </div>

      <!-- 상품 정보 -->
      <div class="flex-1">
        <div class="text-sm font-bold mb-1">{{ product.gender }}'s {{ product.articleType }}</div>
        <div class="flex items-center mb-1">
          <span class="text-xs text-gray-600">{{ product.masterCategory }} / {{ product.subCategory }}</span>
        </div>
        <div class="flex items-center">
          <div class="w-4 h-4 rounded-full mr-1" :style="`background-color: ${getColorCode(product.baseColour)};`">
          </div>
          <span class="text-xs">{{ product.baseColour }}</span>
        </div>
      </div>
    </div>

    <!-- 버튼 -->
    <div class="mt-3 flex justify-between">
      <button
        class="bg-[#FFD814] hover:bg-[#F7CA00] text-xs text-[#0F1111] font-medium py-1 px-3 rounded-full border border-[#FCD200]">
        자세히 보기
      </button>
      <button
        class="bg-[#FF9900] hover:bg-[#FA8900] text-xs text-white font-medium py-1 px-3 rounded-full border border-[#FA8900]">
        장바구니에 추가
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ProductProps {
  product: {
    id: number;
    gender: string;
    masterCategory: string;
    subCategory: string;
    articleType: string;
    baseColour: string;
    season: string;
    year: number;
  }
}

defineProps<ProductProps>();

// 색상 이름으로부터 대략적인 컬러 코드를 반환하는 함수
function getColorCode(colorName: string): string {
  const colorMap: Record<string, string> = {
    'Navy Blue': '#0A1929',
    'Blue': '#0000FF',
    'Black': '#000000',
    'White': '#FFFFFF',
    'Green': '#008000',
    'Red': '#FF0000',
    'Pink': '#FFC0CB',
    'Grey': '#808080',
    'Purple': '#800080',
    'Yellow': '#FFFF00',
    'Brown': '#A52A2A',
    'Orange': '#FFA500',
    'Beige': '#F5F5DC',
    'Maroon': '#800000',
    'Cream': '#FFFDD0',
    'Teal': '#008080',
    'Khaki': '#F0E68C',
  };

  return colorMap[colorName] || '#CCCCCC'; // 기본값은 회색
}
</script>