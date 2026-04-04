i see two bugs that have been introduced:

1. when the app loads, the spinner is never hidden. i have to resize the browser window to trigger a reflow (i guess it calls the resize observer?) which
   then triggers causes the spinner to hide.

2. when i navigate to a new chapter, i click on the next or previous button, and then i see a flash and then the current chapter render again, then
   disappear, and the new chapter is displayed. the flow should be

- click next/previous
- see spinner
- when chapter is loaded, hide spinner

fix these two bugs
