we're continuing a refactor of a legacy application to bring it up to date using modern tooling, structure and best practices. we've done a few passes already, read through the past two commits (8173575c and 69b394ec) if you need to see detailed changes. read through @IMPROVEMENT_PLAN.md for the big-picture, and you can see the current state of things by reading @MIGRATION_STATUS.md.

i want to continue with the refactor, but I'm still seeing a few bugs that are holding us back. they were supposed to be addressed already (see point 7
in the @MIGRATION_STATUS.md doc) - "Ultimate.jsx: ResizeObserver caused spinner to never hide on initial load (Bug 1)".

here's a lits of issues that need to be resolved:

1. the one mentioned above, where the loader never hides.
   current behaviour:
   this is reproduced whenever the app loads initially. the loader never hides, despite the content having been loaded in the background. i can force the
   loader to hide by slightly resizing the browser window, hopefully that gives you enough to go on to debug this issue.

expected behaviour:
the loader hides when the content is ready. additionally, the loader should always appear when a user changes chapters, and then hide again when the
new chapter is loaded and the layout is complete (images and fonts loaded and there is no layout shift - when the layout is "stable")

2. chapters do not change, but instead re-render
   current behaviour:
   when changing chapters, the previous chapter flashes and appears to reload in the browser window, the slug updates to the new chapter, but the new
   content does not display. similar to the issue above, if i slightly resize the browser window, then the content correctly displays

expected behaviour:
when a user navigates to a new chapter, the spinner shows, the slug updates, the new chapter is loaded, and when the layout is stable, then the spinner
is hidden and the new chapter appears.

3. keyboard prev/next not working
   current behaviour:
   when i press the forward and backwards keys to navigate through the project after the app is loaded, the prev/next buttons are hidden in the UI and
   nothing else happens. note that this appears to be a regression error from the initial migration from class to functional components for the
   @src/components/Reader/index.jsx file

expected behaviour:
when i press the forward and backwards keys on my keyboard i expect the app to navigate forward through pages and then chapters and likewise when
pressing back.
