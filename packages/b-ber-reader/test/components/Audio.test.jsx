/* global jest,test,expect */

import React from 'react'
import renderer from 'react-test-renderer'
import Audio from '../../src/components/Audio'

const createOptions = () => ({
    createNodeMock: (element) => {
        if (element.type === 'audio') {
            return document.createElement('audio')
        }
        return null
    },
})

describe('Audio', () => {
    test('renders the component', () => {

        let props
        let tree

        props = {'data-autoplay': true}
        tree = renderer.create(<Audio {...props} />, createOptions()).toJSON()
        expect(tree).toMatchSnapshot()

        props = {'data-autoplay': false}
        tree = renderer.create(<Audio {...props} />, createOptions()).toJSON()
        expect(tree).toMatchSnapshot()

    })
})
