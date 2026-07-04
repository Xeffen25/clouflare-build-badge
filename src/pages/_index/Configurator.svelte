<script lang="ts">
  import { m } from "@/paraglide/messages";
  import CopyableField from "@/components/CopyableField.svelte";
  import SectionHeading from "@/components/SectionHeading.svelte";

  let repoUrl = $state("");
  let username = $state("");
  let repository = $state("");
  let branch = $state("");
  let urlError = $state(false);

  let customize = $state(false);
  let style = $state("");
  let logo = $state("");
  let logoColor = $state("");
  let logoSize = $state("");
  let label = $state("");
  let labelColor = $state("");
  let color = $state("");
  let cacheSeconds = $state("");

  let origin = $derived(
    typeof window !== "undefined" ? window.location.origin : "",
  );

  function parseGithubUrl(
    value: string,
  ): { owner: string; repo: string; branch?: string } | null {
    const trimmed = value.trim();
    if (!trimmed) return null;

    try {
      const url = new URL(
        trimmed.includes("://") ? trimmed : `https://${trimmed}`,
      );
      if (!/(^|\.)github\.com$/i.test(url.hostname)) return null;

      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length < 2) return null;

      const [owner, repoRaw, treeKeyword, ...rest] = parts;
      const repo = repoRaw.replace(/\.git$/i, "");
      const branchFromUrl =
        treeKeyword === "tree" && rest.length > 0 ? rest.join("/") : undefined;

      return { owner, repo, branch: branchFromUrl };
    } catch {
      return null;
    }
  }

  function handleUseUrl() {
    const parsed = parseGithubUrl(repoUrl);

    if (!parsed) {
      urlError = true;
      return;
    }

    urlError = false;
    username = parsed.owner;
    repository = parsed.repo;
    if (parsed.branch) branch = parsed.branch;
  }

  function handleUrlKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleUseUrl();
    }
  }

  function selectInputValue(event: Event) {
    (event.currentTarget as HTMLInputElement).select();
  }

  const styleOptions = $derived([
    { value: "", label: m.configurator_style_option_flat() },
    { value: "flat-square", label: m.configurator_style_option_flat_square() },
    { value: "plastic", label: m.configurator_style_option_plastic() },
    {
      value: "for-the-badge",
      label: m.configurator_style_option_for_the_badge(),
    },
    { value: "social", label: m.configurator_style_option_social() },
  ]);

  let badgePath = $derived.by(() => {
    const user = username.trim();
    const repo = repository.trim();
    if (!user || !repo) return null;

    const branchSegment = branch.trim()
      ? `/${encodeURIComponent(branch.trim())}`
      : "";

    return `/${encodeURIComponent(user)}/${encodeURIComponent(repo)}${branchSegment}/status.svg`;
  });

  let queryString = $derived.by(() => {
    if (!customize) return "";

    const params = new URLSearchParams();
    const entries: [string, string][] = [
      ["style", style],
      ["logo", logo],
      ["logoColor", logoColor],
      ["logoSize", logoSize],
      ["label", label],
      ["labelColor", labelColor],
      ["color", color],
      ["cacheSeconds", cacheSeconds],
    ];

    for (const [key, value] of entries) {
      const trimmed = value.trim();
      if (trimmed) params.set(key, trimmed);
    }

    const serialized = params.toString();
    return serialized ? `?${serialized}` : "";
  });

  let badgeUrl = $derived(
    badgePath ? `${origin}${badgePath}${queryString}` : null,
  );

  let markdownSnippet = $derived(
    badgeUrl
      ? `[![${label.trim() || "Cloudflare Build Badge"}](${badgeUrl})](${badgeUrl})`
      : "",
  );
</script>

{#snippet fieldLegend(name: string, tooltip: string)}
  <legend class="fieldset-legend configurator-label flex items-center gap-1.5">
    <span>{name}</span>
    <span class="tooltip tooltip-right configurator-tooltip" data-tip={tooltip}>
      <button
        type="button"
        class="btn btn-ghost btn-xs btn-circle text-accent/70"
        aria-label={tooltip}
      >
        <svg
          class="size-3.5"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            stroke-width="1.75"
          />
          <path
            d="M12 11v5"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
          />
          <circle cx="12" cy="8" r="0.75" fill="currentColor" />
        </svg>
      </button>
    </span>
  </legend>
{/snippet}

<section id="configurator" class="page-container py-12 sm:py-20">
  <SectionHeading>{m.configurator_title()}</SectionHeading>
  <p class="text-base-content/70 mt-2 max-w-2xl">
    {m.configurator_description()}
  </p>

  <div class="card bg-base-200 mt-8 shadow-sm">
    <div class="card-body gap-6">
      <fieldset class="fieldset">
        <legend class="fieldset-legend configurator-label"
          >{m.configurator_url_label()}</legend
        >
        <div class="join w-full">
          <input
            id="configurator-url"
            type="url"
            class="input configurator-input join-item w-full"
            placeholder={m.configurator_url_placeholder()}
            autocomplete="off"
            spellcheck="false"
            bind:value={repoUrl}
            onkeydown={handleUrlKeydown}
          />
          <button
            type="button"
            class="btn btn-primary join-item"
            onclick={handleUseUrl}
          >
            {m.configurator_url_button()}
          </button>
        </div>
        {#if urlError}
          <p class="label text-error">{m.configurator_url_error()}</p>
        {/if}
      </fieldset>

      <div class="grid gap-4 sm:grid-cols-3">
        <fieldset class="fieldset">
          <legend class="fieldset-legend configurator-label"
            >{m.configurator_username_label()}</legend
          >
          <input
            class="input configurator-input w-full"
            placeholder={m.configurator_username_placeholder()}
            autocomplete="off"
            spellcheck="false"
            bind:value={username}
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend configurator-label"
            >{m.configurator_repository_label()}</legend
          >
          <input
            class="input configurator-input w-full"
            placeholder={m.configurator_repository_placeholder()}
            autocomplete="off"
            spellcheck="false"
            bind:value={repository}
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend configurator-label"
            >{m.configurator_branch_label()}</legend
          >
          <input
            class="input configurator-input w-full"
            placeholder={m.configurator_branch_placeholder()}
            autocomplete="off"
            spellcheck="false"
            bind:value={branch}
          />
        </fieldset>
      </div>

      <label class="label w-full cursor-pointer justify-between gap-4">
        <span class="configurator-label">
          {m.configurator_customize_toggle()}
        </span>
        <input
          type="checkbox"
          class="toggle toggle-primary"
          bind:checked={customize}
        />
      </label>

      {#if customize}
        <div class="grid gap-4 sm:grid-cols-3">
          <fieldset class="fieldset">
            {@render fieldLegend(
              m.configurator_style_label(),
              m.configurator_style_tooltip(),
            )}
            <select class="select configurator-input w-full" bind:value={style}>
              {#each styleOptions as option (option.value)}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </fieldset>
          <fieldset class="fieldset">
            {@render fieldLegend(
              m.configurator_logo_label(),
              m.configurator_logo_tooltip(),
            )}
            <input
              class="input configurator-input w-full font-mono text-sm"
              placeholder={m.configurator_logo_placeholder()}
              autocomplete="off"
              spellcheck="false"
              bind:value={logo}
            />
          </fieldset>
          <fieldset class="fieldset">
            {@render fieldLegend(
              m.configurator_logo_color_label(),
              m.configurator_logo_color_tooltip(),
            )}
            <input
              class="input configurator-input w-full font-mono text-sm"
              placeholder={m.configurator_logo_color_placeholder()}
              autocomplete="off"
              spellcheck="false"
              bind:value={logoColor}
            />
          </fieldset>
          <fieldset class="fieldset">
            {@render fieldLegend(
              m.configurator_logo_size_label(),
              m.configurator_logo_size_tooltip(),
            )}
            <input
              class="input configurator-input w-full font-mono text-sm"
              placeholder={m.configurator_logo_size_placeholder()}
              autocomplete="off"
              spellcheck="false"
              bind:value={logoSize}
            />
          </fieldset>
          <fieldset class="fieldset">
            {@render fieldLegend(
              m.configurator_label_label(),
              m.configurator_label_tooltip(),
            )}
            <input
              class="input configurator-input w-full font-mono text-sm"
              placeholder={m.configurator_label_placeholder()}
              autocomplete="off"
              spellcheck="false"
              bind:value={label}
            />
          </fieldset>
          <fieldset class="fieldset">
            {@render fieldLegend(
              m.configurator_label_color_label(),
              m.configurator_label_color_tooltip(),
            )}
            <input
              class="input configurator-input w-full font-mono text-sm"
              placeholder={m.configurator_label_color_placeholder()}
              autocomplete="off"
              spellcheck="false"
              bind:value={labelColor}
            />
          </fieldset>
          <fieldset class="fieldset">
            {@render fieldLegend(
              m.configurator_color_label(),
              m.configurator_color_tooltip(),
            )}
            <input
              class="input configurator-input w-full font-mono text-sm"
              placeholder={m.configurator_color_placeholder()}
              autocomplete="off"
              spellcheck="false"
              bind:value={color}
            />
          </fieldset>
          <fieldset class="fieldset">
            {@render fieldLegend(
              m.configurator_cache_seconds_label(),
              m.configurator_cache_seconds_tooltip(),
            )}
            <input
              type="text"
              inputmode="numeric"
              class="input configurator-input w-full font-mono text-sm"
              placeholder={m.configurator_cache_seconds_placeholder()}
              autocomplete="off"
              spellcheck="false"
              bind:value={cacheSeconds}
            />
          </fieldset>
        </div>
        <p class="text-base-content/60 text-sm">
          {m.configurator_customize_hint()}
        </p>
      {/if}

      <div class="border-base-300 border-t pt-6">
        <span class="configurator-label">
          {m.configurator_preview_label()}
        </span>

        <div
          class="bg-base-300/50 mt-3 flex min-h-16 items-center rounded-box p-4"
        >
          {#if badgeUrl}
            <img
              src={badgeUrl}
              alt={m.configurator_preview_alt()}
              class="h-5"
            />
          {:else}
            <p class="text-base-content/60 text-sm">
              {m.configurator_preview_placeholder()}
            </p>
          {/if}
        </div>

        {#if badgeUrl}
          <div class="mt-4 flex flex-col gap-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend configurator-label">
                {m.configurator_url_output_label()}
              </legend>
              <CopyableField
                value={badgeUrl}
                label={m.common_copy_url()}
                copiedLabel={m.common_copied()}
                onselect={selectInputValue}
              />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend configurator-label">
                {m.configurator_markdown_output_label()}
              </legend>
              <CopyableField
                value={markdownSnippet}
                label={m.common_copy_markdown()}
                copiedLabel={m.common_copied()}
                onselect={selectInputValue}
              />
            </fieldset>
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>
