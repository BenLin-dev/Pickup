<script setup>
import { trustStrip } from '@/data/content'
import AppIcon from './AppIcon.vue'
</script>

<template>
  <div class="trust-strip">
    <div class="container trust-strip__inner">
      <div v-for="item in trustStrip" :key="item.title" class="trust-item">
        <span class="icon-badge icon-badge--sm icon-badge--solid">
          <AppIcon :name="item.icon" :size="20" :stroke="2" />
        </span>
        <div>
          <strong>{{ item.title }}</strong>
          <span>{{ item.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
