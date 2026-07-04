<script lang="ts">
  import type { ClassValue } from "svelte/elements";

  let {
    text,
    label,
    copiedLabel,
    variant = "inline",
    class: className = "",
  }: {
    text: string;
    label: string;
    copiedLabel: string;
    variant?: "inline" | "labeled";
    class?: ClassValue;
  } = $props();

  let copied = $state(false);
  let resetTimeout: ReturnType<typeof setTimeout> | undefined;

  async function copyToClipboard() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error("Clipboard API unavailable");
      }
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand("copy");
      } finally {
        textarea.remove();
      }
    }

    copied = true;
    clearTimeout(resetTimeout);
    resetTimeout = setTimeout(() => {
      copied = false;
    }, 2000);
  }
</script>

{#if variant === "labeled"}
  <button
    type="button"
    class="btn btn-primary btn-sm"
    aria-live="polite"
    onclick={copyToClipboard}
  >
    {copied ? copiedLabel : label}
  </button>
{:else}
  <div
    class={["tooltip", className]}
    class:tooltip-open={copied}
    data-tip={copied ? copiedLabel : label}
  >
    <button
      type="button"
      class="text-base-content/50 hover:text-accent rounded-sm p-0.5 transition-colors"
      aria-label={label}
      aria-live="polite"
      onclick={copyToClipboard}
    >
      {#if copied}
        <svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      {:else}
        <svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M9 9.75A2.25 2.25 0 0 1 11.25 7.5h7.5A2.25 2.25 0 0 1 21 9.75v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5A2.25 2.25 0 0 1 9 17.25v-7.5Z"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M15 7.5V6.75A2.25 2.25 0 0 0 12.75 4.5h-7.5A2.25 2.25 0 0 0 3 6.75v7.5a2.25 2.25 0 0 0 2.25 2.25H6"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      {/if}
    </button>
  </div>
{/if}
