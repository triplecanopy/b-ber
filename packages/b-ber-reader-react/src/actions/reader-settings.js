/* eslint-disable import/prefer-default-export */
import * as actionTypes from '../constants/reader-settings'

export const updateBooks = books => ({
  type: actionTypes.BOOKS_UPDATE,
  payload: books,
})

export const updateBookURL = str => ({
  type: actionTypes.BOOK_URL_UPDATE,
  payload: str,
})

export const updateProjectURL = str => ({
  type: actionTypes.BOOK_URL_UPDATE,
  payload: str,
})

export const updateDownloads = downloads => ({
  type: actionTypes.DOWNLOADS_UPDATE,
  payload: downloads,
})

export const updateUIOptions = options => ({
  type: actionTypes.UI_OPTIONS_UPDATE,
  payload: options,
})
