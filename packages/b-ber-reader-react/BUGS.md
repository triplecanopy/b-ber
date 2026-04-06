# Bugs

## [x] the loader never hides.

### Current Behaviour

this is reproduced whenever the app loads initially. the loader never hides, despite the content having been loaded in the background. i can force the loader to hide by slightly resizing the browser window, hopefully that gives you enough to go on to debug this issue.

### Expected Behaviour

the loader hides when the content is ready. additionally, the loader should always appear when a user changes chapters, and then hide again when the new chapter is loaded and the layout is complete (images and fonts loaded and there is no layout shift - when the layout is "stable")

## [x] full-bleed "spreads" are out of sync with visible page

### Current Behaviour

this issue affects full-bleed "spreads", which are pieces of content (typically images) that are meant to fill an entire browser window. since this wasn't possible with the CSS column spec at the time, absolutely positioned containers "float" on top of the layout and spacers are added to the column layout to create the effect of an image (or other piece of content) stretching from one edge of the browser window to the other.

this mostly works as intended, esp. at a full screen browser size on a 14" macbook pro (xx x xxx). however, when i resize the browser to 1425 (window.innerWidth) x 1046 (window.innerHeight) for example, i see a single chapter that only contains a single, full-bleed spread rendered as two pages instead of one. additionally, the image in the full-bleed spread is always on the incorrect `spreadIndex`, so if i am on `spreadIndex=0`, then the image is on the next page, and if i go to `spreadIndex=1`, then the image moves to the other index.

this issue needs to be fixed, and the logic with calculating the positions of these full bleed spreads is also very complicated and difficult to maintin, so any improvement via refactoring is valuable.

### Expected Behaviour

when there is a full-bleed spread then it renders on a single pair of columns (one full screen). it should always render consistently, no matter what browser size. it should also render consistently when i have loaded the app at one size, and then changed to a new size.

## [ ] chapters do not change, but instead re-render

### Current Behaviour

when changing chapters, the previous chapter flashes and appears to reload in the browser window, the slug updates to the new chapter, but the new content does not display. similar to the issue above, if i slightly resize the browser window, then the content correctly displays

### Expected Behaviour

when a user navigates to a new chapter, the spinner shows, the slug updates, the new chapter is loaded, and when the layout is stable, then the spinner
is hidden and the new chapter appears.

## [ ] keyboard prev/next not working

### Current Behaviour

when i press the forward and backwards keys to navigate through the project after the app is loaded, the prev/next buttons are hidden in the UI and nothing else happens. note that this appears to be a regression error from the initial migration from class to functional components for the @src/components/Reader/index.jsx file

### Expected Behaviour

when i press the forward and backwards keys on my keyboard i expect the app to navigate forward through pages and then chapters and likewise when pressing back.
