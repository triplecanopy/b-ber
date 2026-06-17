import { useCallback } from 'react'
import { useStore } from '../store/StoreContext'
import { useUserInterfaceActions } from '../store/userInterfaceActions'

interface UseNavigationActionsResult {
  goToPrevChapter: () => void
  goToNextChapter: () => void
  goToPrevPage: () => void
  goToNextPage: () => void
}

// Replaces with-navigation-actions: wires the navigation footer's button
// handlers to the owner-supplied chapter/page navigation callbacks, gated on
// userInterface.handleEvents and (for page navigation) enabling transitions.
// userInterface now lives in the built-in store (TASK-106).
const useNavigationActions = (
  handleChapterNavigation: (increment: number) => void,
  handlePageNavigation: (increment: number) => void
): UseNavigationActionsResult => {
  const handleEvents = useStore((s) => s.userInterface.handleEvents)
  const { enablePageTransitions } = useUserInterfaceActions()

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
