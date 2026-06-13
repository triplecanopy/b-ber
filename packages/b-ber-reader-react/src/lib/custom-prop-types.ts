import ReactPropTypeLocationNames from 'react'
import { isNumeric } from '../helpers/Types'

type Props = Record<string, unknown>
type Validate = (
  props: Props,
  propName: string,
  componentName: string,
  location: string
) => Error | null

export function __createChainableTypeChecker(validate: Validate) {
  function checkType(
    isRequired: boolean,
    props: Props,
    propName: string,
    componentName = 'ANONYMOUS',
    location: string
  ): Error | null {
    if (props[propName] == null) {
      // Legacy react-prop-types pattern that indexes the React default export
      // by location string; not part of React's public typed surface.
      // TODO: type this
      const locationName = (ReactPropTypeLocationNames as any)[location]
      if (isRequired) {
        return new Error(
          `Required ${locationName} ${propName} was not specified in ${componentName}`
        )
      }
      return null
    }

    return validate(props, propName, componentName, location)
  }

  const chainedCheckType = checkType.bind(null, false) as ((
    props: Props,
    propName: string,
    componentName?: string,
    location?: string
  ) => Error | null) & { isRequired?: unknown }
  chainedCheckType.isRequired = checkType.bind(null, true)

  return chainedCheckType
}

export function __cssHeightDeclarationPropType(
  props: Props,
  propName: string,
  componentName = 'ANONYMOUS'
): Error | null {
  if (
    !isNumeric(props[propName]) &&
    typeof props[propName] === 'string' &&
    props[propName] !== 'auto'
  ) {
    return new Error(
      `${propName} in ${componentName} is not a valid CSS height value`
    )
  }

  return null
}

export const cssHeightDeclarationPropType = __createChainableTypeChecker(
  __cssHeightDeclarationPropType
)
