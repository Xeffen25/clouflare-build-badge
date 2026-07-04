<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    children,
    align = "center",
  }: {
    children: Snippet;
    align?: "center" | "left";
  } = $props();
</script>

<h3
  class="card-title text-lg {align === 'left'
    ? 'justify-start text-left'
    : 'justify-center text-center lg:justify-start lg:text-left'}"
>
  {@render children()}
</h3>
