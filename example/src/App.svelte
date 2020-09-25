<script>
  import { onMount, onDestroy } from 'svelte'

  export let name

  onMount(() => {
    console.log('hello')
    return () => {
      console.log('b-bye')
    }
  })

  onDestroy(() => {
    console.trace()
  })
</script>

<main on:click={() => dispatch('click')}>
  <h1>Hello {name}!</h1>
  <p>
    Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to
    learn how to build Svelte apps.
  </p>
</main>

<style lang="scss">
  $color: #ff3e00;

  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: $color;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
