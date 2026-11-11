<script setup lang="ts">
import { SITE_NAME } from '~/constants/site';

definePageMeta({ layout: 'profile' });

const { fetchFavorites } = useFavorites();
const products = ref<import('~/types').Product[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    products.value = await fetchFavorites();
  } finally {
    loading.value = false;
  }
});

useHead({ title: `علاقه‌مندی‌ها - ${SITE_NAME}` });
</script>

<template>
  <div class="fav-page">
    <ProfilePageHeader title="علاقه‌مندی‌ها" subtitle="محصولات منتخب شما" back-to="/profile" />

    <div class="ui-panel">
      <LoadingSpinner :show="loading" />

      <ProductCardList v-if="!loading && products.length" :products="products" />

      <EmptyCatalogScene v-if="!loading && !products.length" variant="favorites" class="!py-8">
        <NuxtLink to="/shop" class="btn-primary btn-action text-sm px-6">رفتن به فروشگاه</NuxtLink>
      </EmptyCatalogScene>
    </div>
  </div>
</template>
