import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as userInterfaceActions from '../actions/user-interface'
import type { AppDispatch, RootState } from '../store/types'

interface UseNavigationActionsResult {
  goToPrevChapter: () => void
  goToNextChapter: () => void
  goToPrevPage: () => void
  goToNextPage: () => void
}

// Replaces with-navigation-actions: wires the navigation footer's button
// handlers to the owner-supplied chapter/page navigation callbacks, gated on
// userInterface.handleEvents and (for page navigation) enabling transitions.
const useNavigationActions = (
  handleChapterNavigation: (increment: number) => void,
  handlePageNavigation: (increment: number) => void
): UseNavigationActionsResult => {
  const dispatch = useDispatch<AppDispatch>()
  const handleEvents = useSelector(
    (state: RootState) => state.userInterface.handleEvents
  )
  const { enablePageTransitions } = useMemo(
    () => bindActionCreators(userInterfaceActions, dispatch),
    [dispatch]
  )

  const goToPrevChapter = useCallback(() => {
    if (!handleEvents) return
    handleChapterNavigation(-1)
  }, [handleEvents, handleChapterNavigation])

  const goToNextChapter = useCallback(() => {
    if (!handleEvents) return
    handleChapterNavigation(1)
  }, [handleEvents, handleChapterNavigation])

  const goToPrevPage = useCallback(() => {
    if (!handleEvents) return
    enablePageTransitions()
    handlePageNavigation(-1)
  }, [handleEvents, enablePageTransitions, handlePageNavigation])

  const goToNextPage = useCallback(() => {
    if (!handleEvents) return
    enablePageTransitions()
    handlePageNavigation(1)
  }, [handleEvents, enablePageTransitions, handlePageNavigation])

  return { goToPrevChapter, goToNextChapter, goToPrevPage, goToNextPage }
}

export default useNavigationActions
