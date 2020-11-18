const test1 = `

::: name:idA foo:bar baz:"some text"
::: exit:idA

`

const test2 = `

::: name:idA foo:bar baz:"some text"
::: exit:idB

`

const test3 = `

::: name:idA foo:bar baz:"some text"
::: exit:idA

::: image:idB foo:bar baz:"some text"

`

const test4 = `

::: name:idA foo:bar baz:"some text"
::: exit:idA

::: name:idB foo:bar baz:"some text"
::: exit:idB

::: image:idC foo:bar baz:"some text"

`

const test5 = `

::: name:idA foo:bar baz:"some text"
::: exit:idA

::: image:idB foo:bar baz:"some text"

::: name:idC foo:bar baz:"some text"
::: exit:idC

::: image:idD foo:bar baz:"some text"

`

const test6 = `

::: name:idA foo:bar baz:"some text"
::: exit:idA

::: image:idB foo:bar baz:"some text"

::: name:idC foo:bar baz:"some text"
::: exit:idD

`

const test7 = `

::: name:idA foo:bar baz:"some text"

::: name:idB foo:bar baz:"some text"

::: name:idC foo:bar baz:"some text"

::: exit:idC

::: exit:idB

::: exit:idA

`

const test8 = `

::: name:idA foo:bar baz:"some text"

::: image:idB foo:bar baz:"some text"

::: exit:idA

`

const test9 = `

::: name:idA foo:bar baz:"some text"

::: name:idB foo:bar baz:"some text"

::: image:idC foo:bar baz:"some text"

::: exit:idB

::: exit:idA

`

const test10 = `

::: name:idA foo:bar baz:"some text"

::: name:idB foo:bar baz:"some text"

::: image:idC foo:bar baz:"some text"
::: exit:idB
::: exit:idA

`

const test11 = `
::: name:idA foo:bar baz:"some text"

some text

::: name:idB foo:bar baz:"some text"

more text

::: image:idC foo:bar baz:"some text"

some more

::: exit:idB

more text here

::: exit:idA
`

const test12 = `

::: name:idA foo:bar baz:"some text"

::: image:idC foo:bar baz:"some text"
::: exit:idA

`

const test13 = `

::: image:idA foo:bar baz:"some text"

`

const test14 = `

::: image:idA foo:bar baz:"some text" ::: image:idB foo:bar baz:"some text"

`

const test15 = `

::: name:idA foo:bar baz:"some text'
::: exit:idA

`

const test16 = `

::: image:idA foo:bar baz:"some text"

::: image:idB foo:bar baz:"some text"

::: name:idC foo:bar baz:'some text"
::: exit:idC

`

const test17 = `

::: name:idA foo:bar baz:"some text"

::: name:idB foo:bar baz:"some text"

Some text
::: exit:idB
::: exit:idA

`

const test18 = `

::: image:idA foo:bar baz:"some text"
:: some text
::

`

const test19 = `

::: image:idA foo:bar baz:"some text"

:: some text
::

`

const test20 = `

::: image:idA foo:bar baz:"some text"
:: some text

::

`

const test21 = `


::: name:idA foo:bar baz:"some text"

::: name:idB foo:bar baz:"some text"

::: image:idA foo:bar baz:"some text"
:: some text
::

::: exit:idB
::: exit:idA


`

export default [
  {
    name: 'Test 1',
    text: test1,
    success: true,
  },
  {
    name: 'Test 2',
    text: test2,
    success: false,
  },
  {
    name: 'Test 3',
    text: test3,
    success: true,
  },
  {
    name: 'Test 4',
    text: test4,
    success: true,
  },
  {
    name: 'Test 5',
    text: test5,
    success: true,
  },
  {
    name: 'Test 6',
    text: test6,
    success: false,
  },
  {
    name: 'Test 7',
    text: test7,
    success: true,
  },
  {
    name: 'Test 8',
    text: test8,
    success: true,
  },
  {
    name: 'Test 9',
    text: test9,
    success: true,
  },
  {
    name: 'Test 10',
    text: test10,
    success: true,
  },
  {
    name: 'Test 11',
    text: test11,
    success: true,
  },
  {
    name: 'Test 12',
    text: test12,
    success: true,
  },
  {
    name: 'Test 13',
    text: test13,
    success: true,
  },
  {
    name: 'Test 14',
    text: test14,
    success: false,
  },
  {
    name: 'Test 15',
    text: test15,
    success: false,
  },
  {
    name: 'Test 16',
    text: test16,
    success: false,
  },
  {
    name: 'Test 17',
    text: test17,
    success: true,
  },
  {
    name: 'Test 18',
    text: test18,
    success: true,
  },
  {
    name: 'Test 19',
    text: test19,
    success: false,
  },
  {
    name: 'Test 20',
    text: test20,
    success: false,
  },
  {
    name: 'Test 21',
    text: test21,
    success: true,
  },
]
