# `b-ber-lib`

`b-ber-lib` contains a collections of classes for interacting with the application state. 

## Application State

When `b-ber` is invoked, values in `state` are populated with those loaded from configuration files and passed in from the command line. `b-ber-lib/State.js` provides a simple API for interacting with stored values.


## API 

### Getters

```
State#src()
```

Returns current configuration's `src` directory

```
State#dist() 
```

Returns current configuration's `dist` directory

```
State#theme() 
```

Returns information about the current theme

```
State#env()
```

Returns the `NODE_ENV`, defaulting to 'development'

```
State#reset()
```

Reboot `State` with its default values

### Properties

```
State#guide <Array>
```
List of files to be included in the project's `guide`
```
State#figures <Array>
```
List of images
```
State#footnotes <Array>
```
 List of footnotes
```
State#build <String>
```
Current `build` type
```
State#cursor <Array>
```
List of directive ids
```
State#spine <Array>
```
List of files to be included in the project's `spine`
```
State#toc <Array>
```
List of files to be included in the project's `toc`
```
State#remoteAssets <Array>
```
List of remote asset URLs
```
State#loi <Array>
```
List of images
```
State#sequence <Array>
```
List of `b-ber` commands
```
State#hash <String>
```
Process id

```
State#templates: <Object>
```

Dynamically created templates. These are functions are overwritten during build to wrok around sequencing issues. see b-ber-tasks/inject#mapSourcesToDynamicPageTemplate for details

### Methods

```
State#add(prop : string, value : string | object | array)
```

Add an item to an existing property

```
State#remove(prop : string)
```

Remove an item from an existing property

```
State#merge(prop : string, value : object)
```

Merge an object with an existing property

```
State#update(prop : string, value : any)
```

Set an existing property to a new value. Can be used to update nested values using dot syntax

```
State#contains(prop : string, value : any)
```

Determine if a property of `State` which is an array contains a value
