<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import type { DateValue } from '@internationalized/date'
import { DateFormatter, getLocalTimeZone, today } from '@internationalized/date'
import { computed, ref } from 'vue'
import { cn } from '../../../lib/utils'
import { Button } from '../button/index'
import { Calendar } from '../calendar/index'
import { Popover, PopoverContent, PopoverTrigger } from '../popover/index'

const CalendarIcon = getIcon('Calendar')

const props = withDefaults(
  defineProps<{
    placeholder?: string
    class?: string
  }>(),
  {
    placeholder: 'Pick a date',
  },
)

const model = defineModel<DateValue>()
const defaultPlaceholder = today(getLocalTimeZone())
const formatter = new DateFormatter('en-US', { dateStyle: 'long' })

const label = computed(() =>
  model.value ? formatter.format(model.value.toDate(getLocalTimeZone())) : props.placeholder,
)
</script>

<template>
  <Popover v-slot="{ close }">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :class="cn('w-[240px] justify-start text-left font-normal', !model && 'text-muted-foreground', props.class)"
      >
        <CalendarIcon class="size-4" />
        {{ label }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <Calendar
        v-model="model"
        :default-placeholder="defaultPlaceholder"
        layout="month-and-year"
        initial-focus
        @update:model-value="close"
      />
    </PopoverContent>
  </Popover>
</template>
