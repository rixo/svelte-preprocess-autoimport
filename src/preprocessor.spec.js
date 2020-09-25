import { test, describe } from 'zorax'
import { preprocess } from 'svelte/compiler'
import dedent from 'dedent'

import preprocessor from './index.js'

const defaultFilename = '/projects/foo/src/Test.svelte'

const macro = async (
  t,
  { filename = defaultFilename, source, expected, config } = {}
) => {
  const { code } = await preprocess(dedent(source), [preprocessor(config)], {
    filename,
  })
  t.eq(code, dedent(expected.replace('\\n', '%N')).replace('%N', '\\n'))
}

test('nothing to do', macro, {
  source: `
    Hello
  `,
  expected: `
    Hello
  `,
})

test("import { onMount } from 'svelte'", macro, {
  source: `
    <div on:click={onMount} />
  `,
  expected: `
    <div on:click={onMount} />
    <script>import { onMount } from 'svelte';</script>
  `,
})

test("import { onMount } from 'svelte'", macro, {
  source: `
    <script>
      onMount(() => {
        console.log('hello')
      })
    </script>
  `,
  expected: `
    <script>import { onMount } from 'svelte';
      onMount(() => {
        console.log('hello')
      })
    </script>
  `,
})

test('multiple named import from same module', macro, {
  source: `
    <script>
      onMount(() => {
        console.log('hello')
      })
      onDestroy(() => {
        console.log('bye')
      })
    </script>
  `,
  expected: `
    <script>import { onDestroy, onMount } from 'svelte';
      onMount(() => {
        console.log('hello')
      })
      onDestroy(() => {
        console.log('bye')
      })
    </script>
  `,
})

test('does not replace local variables: let', macro, {
  source: `
    <script>
      let onMount = () => {}
      onMount(() => {
        console.log('hello')
      })
    </script>
  `,
  expected: `
    <script>
      let onMount = () => {}
      onMount(() => {
        console.log('hello')
      })
    </script>
  `,
})

test('does not replace local variables: const', macro, {
  source: `
    <script>
      let onMount = () => {}
      onMount(() => {
        console.log('hello')
      })
    </script>
  `,
  expected: `
    <script>
      let onMount = () => {}
      onMount(() => {
        console.log('hello')
      })
    </script>
  `,
})

test('does not replace existing named imports', macro, {
  source: `
    <script>
      import { onMount } from 'foo'
      onMount(() => {
        console.log('hello')
      })
    </script>
  `,
  expected: `
    <script>
      import { onMount } from 'foo'
      onMount(() => {
        console.log('hello')
      })
    </script>
  `,
})

test('does not replace existing named import targets', macro, {
  source: `
    <script>
      import { onMount } from 'svelte'
      onMount(() => {
        console.log('hello')
      })
    </script>
  `,
  expected: `
    <script>
      import { onMount } from 'svelte'
      onMount(() => {
        console.log('hello')
      })
    </script>
  `,
})

test('does not replace existing aliased named imports', macro, {
  source: `
    <script>
      import { whatever as onMount } from 'foo'
      onMount(() => {
        console.log('hello')
      })
    </script>
  `,
  expected: `
    <script>
      import { whatever as onMount } from 'foo'
      onMount(() => {
        console.log('hello')
      })
    </script>
  `,
})

test('does not mistake aliased name as local', macro, {
  source: `
    <script>
      import { onMount as xxx } from 'foo'
      onMount(() => {
        console.log('hello')
      })
    </script>
  `,
  expected: `
    <script>import { onMount } from 'svelte';
      import { onMount as xxx } from 'foo'
      onMount(() => {
        console.log('hello')
      })
    </script>
  `,
})

test('does not replace existing default imports', macro, {
  source: `
    <script>
      import onMount from 'foo'
      onMount(() => {
        console.log('hello')
      })
    </script>
  `,
  expected: `
    <script>
      import onMount from 'foo'
      onMount(() => {
        console.log('hello')
      })
    </script>
  `,
})

test('with config', macro, {
  config: {
    aliases: {
      useEffect: {
        import: 'onMount',
        from: 'svelte',
      },
    },
  },
  source: `
    <script>
      useEffect(() => {
        console.log('hello')
      })
    </script>
  `,
  expected: `
    <script>import { onMount as useEffect } from 'svelte';
      useEffect(() => {
        console.log('hello')
      })
    </script>
  `,
})

test('can import multiple time as different aliases', macro, {
  config: {
    aliases: {
      onMount: 'svelte',
      useEffect: {
        import: 'onMount',
        from: 'svelte',
      },
    },
  },
  source: `
    <script>
      useEffect(() => {
        console.log('hello')
      })
      onMount(() => {
        console.log('ola')
      })
    </script>
  `,
  expected: `
    <script>import { onMount, onMount as useEffect } from 'svelte';
      useEffect(() => {
        console.log('hello')
      })
      onMount(() => {
        console.log('ola')
      })
    </script>
  `,
})

describe.skip('context="module"', () => {
  test("import { onMount } from 'svelte'", macro, {
    source: `
      <script context="module">
        onMount(() => {
          console.log('hello')
        })
      </script>
    `,
    expected: `
      <script context="module">import { onMount } from 'svelte';
        onMount(() => {
          console.log('hello')
        })
      </script>
    `,
  })

  test('mixed script & context="module"', macro, {
    source: `
      <script>
        onMount(() => {
          console.log('hello')
        })
      </script>
      <script context="module">
        // placholder
      </script>
    `,
    expected: `
      <script>
        onMount(() => {
          console.log('hello')
        })
      </script>
      <script context="module">import { onMount } from 'svelte';
        // placholder
      </script>
    `,
  })
})

describe('createEventDispatcher automatization', () => {
  test('from script', macro, {
    config: {
      createEventDispatcher: '$$dispatch',
    },
    source: `
      <script>
        $$dispatch('bim', { name: 'rixo' })
      </script>
    `,
    expected: `
      <script>import { createEventDispatcher } from 'svelte'; const __dispatch = createEventDispatcher();
        __dispatch('bim', { name: 'rixo' })
      </script>
    `,
  })

  test('from markup', macro, {
    config: {
      createEventDispatcher: '$$dispatch',
    },
    source: `
      <button on:click={() => $$dispatch('bim', { name: 'rixo' })} />
    `,
    expected: `
      <button on:click={() => __dispatch('bim', { name: 'rixo' })} />
      <script>import { createEventDispatcher } from 'svelte'; const __dispatch = createEventDispatcher();</script>
    `,
  })
})

test('compat with SCSS', macro, {
  source: `
    <style lang="scss">
      $red: red;
      div { color: $red }
    </style>
    <div on:click={onMount} />
  `,
  expected: `
    <style lang="scss">
      $red: red;
      div { color: $red }
    </style>
    <div on:click={onMount} />
    <script>import { onMount } from 'svelte';</script>
  `,
})
