<script lang="ts">
  import CopyButton from "./CopyButton.svelte";

  let {
    value,
    label,
    copiedLabel,
    onselect,
  }: {
    value: string;
    label: string;
    copiedLabel: string;
    onselect?: (event: Event) => void;
  } = $props();
</script>

<div class="relative">
  <input
    readonly
    class="input configurator-input w-full pr-10 font-mono text-sm"
    {value}
    onclick={onselect}
  />
  <CopyButton
    class="absolute top-2 right-2"
    text={value}
    {label}
    {copiedLabel}
  />
</div>
