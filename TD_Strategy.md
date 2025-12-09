# Technical Debt Strategy: Feature-First, Pre-Testing Refactoring

In our team, we use a **Feature-First, Pre-Testing Refactoring** approach to handle technical debt during each sprint. The idea is pretty simple: we start by working on all the user stories for the sprint and get them merged. Once everything is in the dev branch, and **before testing begins**, we take some time to clean up the code and fix any technical debt we created along the way.

We chose this method because it lets us focus on delivering features first, without being slowed down by refactoring too early. After everything is merged, it’s easier to see the overall changes and spot messy code, duplicates, or things that need improvement. Doing this cleanup before testing also helps the testers, since they get a more stable version of the code and usually find fewer issues.

The workflow goes like this:
1. Build the stories
2. Merge all the work
3. Do refactoring and handle technical debt
4. Start testing (and eventually fixing bugs)

This routine helps us keep each sprint organized and prevents technical debt from piling up. It also gives us a clear order of work: build first, clean up, then test. Overall, it keeps development moving while still taking care of code quality. 
