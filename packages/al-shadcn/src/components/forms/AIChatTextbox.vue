<script setup lang="ts">
defineOptions({
  name: 'AIChatTextbox',
})
</script>

<template>
  <form>
    <div
      role="group"
      data-slot="field"
      data-orientation="vertical"
      class="data-[invalid=true]:text-destructive gap-2 group/field flex w-full flex-col *:w-full [&amp;&gt;.sr-only]:w-auto"
    >
      <label
        for="notion-prompt"
        data-slot="field-label"
        class="text-sm font-medium group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed has-data-checked:bg-primary/5 has-data-checked:border-primary/30 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10 gap-2 group-data-[disabled=true]/field:opacity-50 has-[&gt;[data-slot=field]]:rounded-lg has-[&gt;[data-slot=field]]:border *:data-[slot=field]:p-2.5 group/field-label peer/field-label flex w-fit leading-snug has-[&gt;[data-slot=field]]:w-full has-[&gt;[data-slot=field]]:flex-col sr-only"
      >
        Prompt
      </label>
      <div
        data-slot="input-group"
        role="group"
        class="border-input dark:bg-input/30 has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[[data-slot][aria-invalid=true]]:border-destructive dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 has-disabled:bg-input/50 dark:has-disabled:bg-input/80 h-8 border transition-colors in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 has-disabled:opacity-50 has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot][aria-invalid=true]]:ring-3 has-[&gt;[data-align=block-end]]:h-auto has-[&gt;[data-align=block-end]]:flex-col has-[&gt;[data-align=block-start]]:h-auto has-[&gt;[data-align=block-start]]:flex-col has-[&gt;[data-align=block-end]]:[&amp;&gt;input]:pt-3 has-[&gt;[data-align=block-start]]:[&amp;&gt;input]:pb-3 has-[&gt;[data-align=inline-end]]:[&amp;&gt;input]:pr-1.5 has-[&gt;[data-align=inline-start]]:[&amp;&gt;input]:pl-1.5 group/input-group relative flex w-full min-w-0 items-center outline-none has-[&gt;textarea]:h-auto rounded-xl"
      >
        <textarea
          data-slot="input-group-control"
          class="border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 px-2.5 text-base transition-colors md:text-sm flex field-sizing-content min-h-16 w-full outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 rounded-none border-0 bg-transparent py-2 shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent flex-1 resize-none"
          id="notion-prompt"
          placeholder="Ask, search, or make anything..."
        ></textarea>
        <div
          role="group"
          data-slot="input-group-addon"
          data-align="block-start"
          class="text-muted-foreground h-auto gap-2 py-1.5 text-sm font-medium group-data-[disabled=true]/input-group:opacity-50 [&amp;&gt;kbd]:rounded-[calc(var(--radius)-5px)] [&amp;&gt;svg:not([class*=size-])]:size-4 flex cursor-text items-center select-none px-2.5 group-has-[&gt;input]/input-group:pt-2 [.border-b]:pb-2 order-first w-full justify-start pt-3"
        >
          <button
            data-slot="tooltip-trigger"
            data-variant="outline"
            data-size="sm"
            class="focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-lg border bg-clip-padding font-medium focus-visible:ring-3 aria-invalid:ring-3 active:not-aria-[haspopup]:translate-y-px [&amp;_svg:not([class*=size-])]:size-4 group/button shrink-0 justify-center whitespace-nowrap outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:shrink-0 border-border bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 aria-expanded:bg-muted aria-expanded:text-foreground h-8 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 gap-2 text-sm flex items-center shadow-none transition-transform"
            type="button"
            data-state="closed"
            data-grace-area-trigger=""
            id="reka-popover-trigger-v-0-61"
            aria-haspopup="dialog"
            aria-expanded="false"
            aria-controls=""
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="tabler-icon tabler-icon-at"
              aria-hidden="true"
            >
              <path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"></path>
              <path d="M16 12v1.5a2.5 2.5 0 0 0 5 0v-1.5a9 9 0 1 0 -5.5 8.28"></path>
            </svg>
            Add context
          </button>
          <div class="no-scrollbar -m-1.5 flex gap-1 overflow-y-auto p-1.5"></div>
        </div>
        <div
          role="group"
          data-slot="input-group-addon"
          data-align="block-end"
          class="text-muted-foreground h-auto py-1.5 text-sm font-medium group-data-[disabled=true]/input-group:opacity-50 [&amp;&gt;kbd]:rounded-[calc(var(--radius)-5px)] [&amp;&gt;svg:not([class*=size-])]:size-4 flex cursor-text items-center select-none px-2.5 pb-2 group-has-[&gt;input]/input-group:pb-2 [.border-t]:pt-2 order-last w-full justify-start gap-1"
        >
          <button
            data-slot="tooltip-trigger"
            data-variant="ghost"
            data-size="icon-sm"
            class="focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 border border-transparent bg-clip-padding font-medium focus-visible:ring-3 aria-invalid:ring-3 active:not-aria-[haspopup]:translate-y-px [&amp;_svg:not([class*=size-])]:size-4 group/button shrink-0 justify-center whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:shrink-0 hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 gap-2 text-sm flex items-center shadow-none size-8 p-0 has-[&gt;svg]:p-0 rounded-full"
            type="button"
            data-state="closed"
            data-grace-area-trigger=""
            aria-label="Attach file"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="tabler-icon tabler-icon-paperclip"
              aria-hidden="true"
            >
              <path
                d="M15 7l-6.5 6.5a1.5 1.5 0 0 0 3 3l6.5 -6.5a3 3 0 0 0 -6 -6l-6.5 6.5a4.5 4.5 0 0 0 9 9l6.5 -6.5"
              ></path>
            </svg>
          </button><button
            data-slot="tooltip-trigger"
            data-variant="ghost"
            data-size="sm"
            class="focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 border border-transparent bg-clip-padding font-medium focus-visible:ring-3 aria-invalid:ring-3 active:not-aria-[haspopup]:translate-y-px [&amp;_svg:not([class*=size-])]:size-4 group/button shrink-0 justify-center whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:shrink-0 hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground h-8 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 gap-2 text-sm flex items-center shadow-none rounded-full"
            type="button"
            data-state="closed"
            data-grace-area-trigger=""
            id="reka-dropdown-menu-trigger-v-0-64"
            aria-haspopup="menu"
            aria-expanded="false"
          >
            Auto
          </button><button
            data-slot="dropdown-menu-trigger"
            data-variant="ghost"
            data-size="sm"
            class="focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 border border-transparent bg-clip-padding font-medium focus-visible:ring-3 aria-invalid:ring-3 active:not-aria-[haspopup]:translate-y-px [&amp;_svg:not([class*=size-])]:size-4 group/button shrink-0 justify-center whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:shrink-0 hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground h-8 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 gap-2 text-sm flex items-center shadow-none rounded-full"
            type="button"
            id="reka-dropdown-menu-trigger-v-0-65"
            aria-haspopup="menu"
            aria-expanded="false"
            data-state="closed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="tabler-icon tabler-icon-world"
              aria-hidden="true"
            >
              <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path>
              <path d="M3.6 9h16.8"></path>
              <path d="M3.6 15h16.8"></path>
              <path d="M11.5 3a17 17 0 0 0 0 18"></path>
              <path d="M12.5 3a17 17 0 0 1 0 18"></path>
            </svg>
            All Sources
          </button><button
            data-slot="button"
            data-variant="default"
            data-size="icon-sm"
            class="focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 border border-transparent bg-clip-padding font-medium focus-visible:ring-3 aria-invalid:ring-3 active:not-aria-[haspopup]:translate-y-px [&amp;_svg:not([class*=size-])]:size-4 group/button shrink-0 justify-center whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:shrink-0 bg-primary text-primary-foreground [a]:hover:bg-primary/80 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 gap-2 text-sm flex items-center shadow-none size-8 p-0 has-[&gt;svg]:p-0 ml-auto rounded-full"
            type="button"
            aria-label="Send"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="tabler-icon tabler-icon-arrow-up"
              aria-hidden="true"
            >
              <path d="M12 5l0 14"></path>
              <path d="M18 11l-6 -6"></path>
              <path d="M6 11l6 -6"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </form>
</template>
