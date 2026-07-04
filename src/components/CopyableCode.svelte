<script lang="ts">
  import CopyButton from "./CopyButton.svelte";

  let {
    text,
    label,
    copiedLabel,
  }: {
    text: string;
    label: string;
    copiedLabel: string;
  } = $props();
</script>

<div
  class="bg-base-300 relative rounded-field px-4 py-3 font-mono text-xs sm:text-sm"
>
  <code class="block pr-8 break-all whitespace-pre-wrap">{text}</code>
  <CopyButton class="absolute top-2 right-2" {text} {label} {copiedLabel} />
</div>
