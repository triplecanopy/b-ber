const test1 = `

::: chapter:idA foo:bar baz:"some text"
::: exit:idA

`

const test2 = `

::: chapter:idA foo:bar baz:"some text"
::: exit:idB

`

const test3 = `

::: chapter:idA foo:bar baz:"some text"
::: exit:idA

::: figure:idB foo:bar baz:"some text"

`

const test4 = `

::: chapter:idA foo:bar baz:"some text"
::: exit:idA

::: chapter:idB foo:bar baz:"some text"
::: exit:idB

::: figure:idC foo:bar baz:"some text"

`

const test5 = `

::: chapter:idA foo:bar baz:"some text"
::: exit:idA

::: figure:idB foo:bar baz:"some text"

::: chapter:idC foo:bar baz:"some text"
::: exit:idC

::: figure:idD foo:bar baz:"some text"

`

const test6 = `

::: chapter:idA foo:bar baz:"some text"
::: exit:idA

::: figure:idB foo:bar baz:"some text"

::: chapter:idC foo:bar baz:"some text"
::: exit:idD

`

const test7 = `

::: chapter:idA foo:bar baz:"some text"

::: chapter:idB foo:bar baz:"some text"

::: chapter:idC foo:bar baz:"some text"

::: exit:idC

::: exit:idB

::: exit:idA

`

const test8 = `

::: chapter:idA foo:bar baz:"some text"

::: figure:idB foo:bar baz:"some text"

::: exit:idA

`

const test9 = `

::: chapter:idA foo:bar baz:"some text"

::: chapter:idB foo:bar baz:"some text"

::: figure:idC foo:bar baz:"some text"

::: exit:idB

::: exit:idA

`

const test10 = `

::: chapter:idA foo:bar baz:"some text"

::: chapter:idB foo:bar baz:"some text"

::: figure:idC foo:bar baz:"some text"
::: exit:idB
::: exit:idA

`

const test11 = `
::: chapter:idA foo:bar baz:"some text"

some text

::: chapter:idB foo:bar baz:"some text"

more text

::: figure:idC foo:bar baz:"some text"

some more

::: exit:idB

more text here

::: exit:idA
`

const test12 = `

::: chapter:idA foo:bar baz:"some text"

::: figure:idC foo:bar baz:"some text"
::: exit:idA

`

const test13 = `

::: figure:idA foo:bar baz:"some text"

`

const test14 = `

::: figure:idA foo:bar baz:"some text" ::: figure:idB foo:bar baz:"some text"

`

const test15 = `

::: chapter:idA foo:bar baz:"some text'
::: exit:idA

`

const test16 = `

::: figure:idA foo:bar baz:"some text"

::: figure:idB foo:bar baz:"some text"

::: chapter:idC foo:bar baz:'some text"
::: exit:idC

`

const test17 = `

::: chapter:idA foo:bar baz:"some text"

::: chapter:idB foo:bar baz:"some text"

Some text
::: exit:idB
::: exit:idA

`

const test18 = `

::: figure:idA foo:bar baz:"some text"
:: some text
::

`

const test19 = `

::: figure:idA foo:bar baz:"some text"

`

// const test19 = `

// ::: figure:idA foo:bar baz:"some text"
// :: some text
// ::

// `

// const test19 = `

// ::: bogus:idA foo:bar baz:"some text"

// `

const test20 = `

::: figure:idA foo:bar baz:"some text"
:: some text

::

`

const test21 = `


::: chapter:idA foo:bar baz:"some text"

::: chapter:idB foo:bar baz:"some text"

::: figure:idA foo:bar baz:"some text"
:: some text
::

::: exit:idB
::: exit:idA

foo
bar baz
xx
xxx

`

const test22 = `


`

// const test24 = `

// ::: chapter:idA

// text

// ::: blockquote:idB

// text

// ::: exit:idB

// text

// ::: figure-inline:x

// ::: figure-inline:y

// ::: exit:idA

// `

const test24 = `
::: chapter:idA

xx

xx

::: exit:idA

::: chapter:idB

xx

::: exit:idB   

`

const test25 = `
::: chapter:proyecto-data-chapter-three-f

::: bogus:omega-quote

xx

::: exit:omega-quote

::: exit:proyecto-data-chapter-three-f
`

const test26 = `
xxx
`

const test27 = `

::: figure:idA

`

const test28 = `

::: figure-inline:idA

`

// const test25 = `
// ::: blockquote:omega-quote

// xx

// ::: exit:omega-quote
// `

// TODO
const test29 = `
::: chapter:gallery-3x

::: gallery:gallery-3x-example

:: item:1 type:image source:portrait.jpg caption:"Caption for item one" ::

:: item:2 type:image source:landscape.jpg caption:"Caption for item two" ::

:: item:3 type:image source:square.jpg caption:"Caption for item three" ::

::: exit:gallery-3x-example

::: exit:gallery-3x
`

// TODO
const test30 = `

::: chapter:dialogue

# Dialogue Example

::: dialogue:dialogue-one

::Speaker One:: Fusce imperdiet ullamcorper risus, eget tincidunt mi posuere ac. Fusce pretium tristique ante sed fermentum. Proin rhoncus arcu placerat eros fringilla suscipit. Curabitur tempor justo non luctus ultricies. Nullam finibus erat non lacus pellentesque ullamcorper. Cras pulvinar porttitor leo gravida pellentesque. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nullam vulputate dapibus quam, sed gravida mauris egestas ut. Sed mollis fermentum euismod.

::Speaker Two:: Ut tortor urna, consequat a libero eget, tincidunt venenatis dui.

::: exit:dialogue-one

::: exit:dialogue

`

const test31 = `

::: subchapter:fragment-5-1

xx

:::exit:fragment-5-1

`

const test32 = `

::: subchapter:xx

xx

::: exit:xxx

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
    success: true,
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
  {
    name: 'Test 22',
    text: test22,
    success: true,
  },
  // // {
  // //   name: 'Test 23',
  // //   text: test23,
  // //   success: false,
  // // },
  {
    name: 'Test 24',
    text: test24,
    success: true,
  },
  {
    name: 'Test 25',
    text: test25,
    success: false,
  },
  {
    name: 'Test 26',
    text: test26,
    success: true,
  },
  {
    name: 'Test 27',
    text: test27,
    success: true,
  },
  {
    name: 'Test 28',
    text: test28,
    success: true,
  },
  // {
  //   name: 'Test 29',
  //   text: test29,
  //   success: true,
  // },
  // {
  //   name: 'Test 30',
  //   text: test30,
  //   success: true,
  // },
  {
    name: 'Test 31',
    text: test31,
    success: false,
  },
  {
    name: 'Test 32',
    text: test32,
    success: false,
  },
]
