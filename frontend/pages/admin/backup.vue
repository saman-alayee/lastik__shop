<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' });

await navigateTo('/admin/settings?tab=backup', { replace: true });
</script>

<template>
  <div />
</template>
