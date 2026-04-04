we're making some more udpates to a brownfield application. take a look at prompt.1.md in this dir, and also the IMPROVEMENT_PLAN.md to get a sense of
things.

right now we're just trying to get a migration of src/components/Reader/index.jsx from a class based component to a functional component working
properly. the app loads, but a number of issues were introduced in the migration which we now need to fix.

the main issue, as far as i can tell, is that a lot of the dependent data isn't available in the new code because previously a lot of this data was
loaded on `UNSAFE_componentWillMount`, whereas now it's loaded inside of `useEffect` calls.

read all of the comments in the src/components/Reader/index.jsx file to understand the issues.

the result is that, while the app does load initially, as soon as we try to navigate to the next page/chapter, the app crashes because of errors on
line 49 of src/components/Navigation/NavigationFooter.jsx (where `spine` is undefined). this is not the only error! there are a number of these
throughout the app.

what we need to do here is

1. refactor the data loading and initialization strategy so that the app runs as previously. if there are parts of the core logic that need to be
   modified to accommodate this update then that's OK

2. objects/arrays should be initialized in an empty state so that we don't get undefined access errors, or add optional chaining where necessary, etc.

make sure to comment changes that you make thoroughly! also, you'll need to output a short summary of the changes to a markdown file so that we can
pick this work up again later.

if you need more information about the specfic changes, check the git history with the last commit to compare
