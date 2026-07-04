<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    children,
    as = "h2",
    class: className = "",
  }: {
    children: Snippet;
    as?: "h2" | "h3";
    class?: string;
  } = $props();
</script>

<svelte:element
  this={as}
  class={[
    "text-accent text-center text-2xl font-bold lg:text-left lg:text-3xl",
    className,
  ]}
>
  {@render children()}
</svelte:element>
