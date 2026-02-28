<script lang="ts">
  interface Props {
    message: string;
    visible: boolean;
  }

  let { message, visible }: Props = $props();
</script>

{#if visible}
  <div class="toast">
    {message}
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: var(--gold);
    padding: 8px 20px;
    border-radius: 20px;
    font-size: 0.9em;
    font-weight: bold;
    z-index: 200;
    backdrop-filter: blur(8px);
    pointer-events: none;
  }
</style>
