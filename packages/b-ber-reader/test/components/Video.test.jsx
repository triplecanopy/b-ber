/* global jest,test,expect */

import React from 'react'
import renderer from 'react-test-renderer'
import Video from '../../src/components/Video'

const createOptions = () => ({
    createNodeMock: (element) => {
        if (element.type === 'video') {
            return document.createElement('video')
        }
        return null
    },
})

describe('Video', () => {
    test('renders the component', () => {

        let props
        let tree

        props = {'data-autoplay': true}
        tree = renderer.create(<Video {...props} />, createOptions()).toJSON()
        expect(tree).toMatchSnapshot()

        props = {'data-autoplay': false}
        tree = renderer.create(<Video {...props} />, createOptions()).toJSON()
        expect(tree).toMatchSnapshot()

    })
})
