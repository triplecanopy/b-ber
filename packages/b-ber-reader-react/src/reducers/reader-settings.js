/* eslint-disable camelcase */

import * as actionTypes from '../constants/reader-settings'

export const initialState = {
  books: [],
  bookURL: '',
  downloads: [],
  projectURL: '',
  // loadRemoteLibrary: true, // TODO unused
  paramKeys: {
    slug: 'slug',
    currentSpineItemIndex: 'currentSpineItemIndex',
    spreadIndex: 'spreadIndex',
  },
  uiOptions: {
    navigation: {
      header_icons: {
        home: true,
        toc: true,
        downloads: true,
        info: true,
      },
      footer_icons: {
        chapter: true,
        page: true,
      },
    },
  },
  cache: true, // TODO handled based on build?
  layout: 'columns',
}

const readerSettings = (state = initialState, action = {}) => {
  switch (action.type) {
    case actionTypes.BOOKS_UPDATE:
      return { ...state, books: [...action.payload] }

    case actionTypes.BOOK_URL_UPDATE:
      return { ...state, bookURL: action.payload }

    case actionTypes.PROJECT_URL_UPDATE:
      return { ...state, projectURL: action.payload }

    case actionTypes.DOWNLOADS_UPDATE:
      return { ...state, downloads: [...action.payload] }

    case actionTypes.UI_OPTIONS_UPDATE:
      return { ...state, uiOptions: { ...action.payload } }

    case actionTypes.QUERY_PARAM_KEYS_UPDATE:
      return {
        ...state,
        paramKeys: {
          ...state.paramKeys,
          ...action.payload,
        },
      }

    default:
      return state
  }
}

export default readerSettings
