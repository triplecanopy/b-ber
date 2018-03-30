import ReactPropTypeLocationNames from 'react'
import {isNumeric} from '../helpers/Types'

export function __createChainableTypeChecker(validate) {
    function checkType(isRequired, props, propName, componentName = 'ANONYMOUS', location) {
        if (props[propName] == null) {
            const locationName = ReactPropTypeLocationNames[location]
            if (isRequired) {
                return new Error(`Required ${locationName} ${propName} was not specified in ${componentName}`)
            }
            return null
        }

        return validate(props, propName, componentName, location)
    }

    const chainedCheckType = checkType.bind(null, false)
    chainedCheckType.isRequired = checkType.bind(null, true)

    return chainedCheckType
}

export function __cssHeightDeclarationPropType(props, propName, componentName = 'ANONYMOUS') {
    if (!isNumeric(props[propName]) && (typeof props[propName] === 'string' && props[propName] !== 'auto')) {
        return new Error(`${propName} in ${componentName} is not a valid CSS height value`)
    }

    return null
}

export const cssHeightDeclarationPropType = __createChainableTypeChecker(__cssHeightDeclarationPropType)
