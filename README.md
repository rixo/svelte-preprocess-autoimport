# svelte-preprocess-autoimport

> A preprocessor for automatic imports & createEventDispatcher.

Automatically adds import lines for `onMount`, etc.

Also automatically writes `const dispatch = createEventDispatcher()` for you.

The preprocessor puts the import statements in the blank spaces of your source files, so sourcemaps are unaffected.

## Example

Write:

```svelte
<script>
  onMount(() => {
    // ...
  })
</script>

<button on:click={() => dispatch('event')} />
```

Get:

```svelte
<script>
  import { onMount, createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  onMount(() => {
    // ...
  })
</script>

<button on:click={() => dispatch('event')} />
```

The transformed code that is actually produced is formatted like this to avoid breaking sourcemaps:

```svelte
<script>import { onMount, createEventDispatcher } from 'svelte'; const dispatch = createEventDispatcher();
  onMount(() => {
    // ...
  })
</script>

<button on:click={() => dispatch('event')} />
```

## Install

```bash
yarn add -D svelte-preprocess-autoimport
```

## Usage

In your Svelte config (example is for Rollup, but preprocessors are portable so it should work anywhere Svelte):

```js
import autoimport from 'svelte-preprocess-autoimport'
import svelte from 'rollup-plugin-svelte-hot'

...

export default {
  ...
  plugins: [
    svelte({
      ...
      preprocess: [
        autoimport()
      ]
    })
  ]
}
```

## Config

```js
autoimport({
  aliases: {
    // short form
    //
    // produces: import { onMount } from 'svelte'
    onMount: 'svelte',
    // produces: import { onDestroy } from 'svelte'
    onDestroy: 'svelte',

    // long form
    //
    // produces: import { onMount as useEffect } from 'svelte'
    useEffect: {
      import: 'onMount',
      from: 'svelte',
    },
  },

  // if the value (e.g. `$$dispatch`) is found in the code, then
  // createEventDispatcher will be imported an a dispatch variable with this
  // name will be created.
  //
  // NOTE: leading $ prefixes will be transformed to _ in the processed code
  //
  createEventDispatcher: '$$dispatch',
})
```
