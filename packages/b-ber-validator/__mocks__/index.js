export const test1 = `
::: chapter:idA foo:bar baz:"some text"
::: exit:idA
`

export const test2 = `
foo bar baz
`

export const test3 = `
::: figure:idA foo:bar baz:"some text"
`

export const test4 = `
::: chapter:idA foo:bar baz:"some text"
::: exit:idA

::: chapter:idB foo:bar baz:"some text"
::: exit:idB
`

export const test5 = `
::: figure:idA foo:bar baz:"some text"

::: figure:idB foo:bar baz:"some text"
:: text here
::

::: figure:idC foo:bar baz:"some text"
:: text here
::
`

export const test6 = `
::: chapter:idA foo:bar baz:"some text"
::: exit:idA

::: chapter:idB foo:bar baz:"some text"
::: exit:idB

::: figure:idC foo:bar baz:"some text"

::: figure:idD foo:bar baz:"some text"
:: text here
::
`

export const test7 = `
::: chapter:idA foo:bar baz:"some text"

::: chapter:idB foo:bar baz:"some text"

::: chapter:idC foo:bar baz:"some text"

::: exit:idC

::: exit:idB

::: exit:idA
`

export const test8 = `
::: chapter:idA foo:bar baz:"some text"

::: figure:idC foo:bar baz:"some text"

::: figure:idD foo:bar baz:"some text"
:: text here
::

::: chapter:idB foo:bar baz:"some text"

::: figure:idC foo:bar baz:"some text"

::: chapter:idC foo:bar baz:"some text"

::: exit:idC

::: figure:idD foo:bar baz:"some text"
:: text here
::

::: exit:idB

::: exit:idA
`

export const test9 = `

some content



::: chapter:idA foo:bar baz:"some text"

some content


::: chapter:idB foo:bar baz:"some text"


::: figure:idC foo:bar baz:"some text"
::: exit:idB
::: exit:idA



`

export const test10 = `
::: chapter:idA foo:bar baz:"some text"
::: chapter:idB foo:bar baz:"some text"
::: figure:idC foo:bar baz:"some text"
some content
::: exit:idB
some content
::: exit:idA


some content
`

export const test11 = `
::: chapter:idA foo:bar baz:"some text"
::: exit:idB
`

export const test12 = `
::: chapter:idA foo:bar baz:"some text"
::: chapter:idB foo:bar baz:"some text"
::: exit:idB
::: exit:idB
`

export const test13 = `
::: chapter:idA foo:bar baz:"some text"
::: chapter:idB foo:bar baz:"some text"
::: chapter:idC foo:bar baz:"some text"
::: exit:idD
::: exit:idB
::: exit:idA
`

export const test14 = `
::: bogus:idA
::: exit:idA
`

export const test15 = `
::: chapter:idA foo
::: exit:idA
`

export const test16 = `
::: chapter:idA foo::
::: exit:idA
`

export const test17 = `
::: chapter:idA foo:bar baz:some text
::: exit:idA
`

export const test18 = `
::: chapter:idA foo:bar baz:"some text'
::: exit:idA
`

export const test19 = `
::: chapter:idA foo:bar baz:'some text"
::: exit:idA
`

export const test20 = `
::: chapter:idA foo:bar baz:"some text"'
::: exit:idA
`

export const test21 = `
::: chapter:idA          foo:bar   baz:"some text"
::: exit:idA
`

export const test22 = `
::: chapter:idA foo::bar
::: exit:idA
`

export const test23 = `
::: figure:idA foo:bar baz:"some text" ::: figure:idB foo:bar baz:"some text"
`

export const test24 = `
::: figure:idA foo:bar baz:"some text"
::
`

export const test25 = `
::: figure:idA foo:bar baz:"some text"
:: some text
`

export const test26 = `
::: figure:idA foo:bar baz:"some text"

:: some text
::
`

export const test27 = `
::: chapter:idA foo:bar baz:"some text"
::: chapter:idB foo:bar baz:"some text"
::: chapter:idC foo:bar baz:"some text"
::: exit:idC
`

export const test28 = `


`

export const test29 = ``

export const test30 = `
::: chapter:idA foo:bar baz:"some text"
::: exit:idAAA
`

export const test31 = `
::: figure-inline:idA
`
