TEMPLATE FOR RETROSPECTIVE (Team ##)
=====================================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed vs done : 5 vs 5
- Total points committed vs done : 29 vs 29
- Nr of hours planned vs spent (as a team) : 100h 00m vs 87h 15m

**Remember**  a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD 

### Detailed statistics

| Story | # Tasks | Points | Hours est. | Hours actual |
| :---: | :-----: | :----: | :--------: | :----------: |
| _#0_  |   14    |   -    |            |              |
|  28   |    4    |   3    |   5h 30m   |    5h 35m    |
|  15   |    6    |   2    |   6h 00m   |    5h 30m    |
|  30   |    4    |   8    |  10h 00m   |   10h 20m    |
|  13   |    6    |   8    |   8h 00m   |    8h 05m    |
|  14   |    2    |   8    |   3h 00m   |    3h 20m    |
   

> place technical tasks corresponding to story `#0` and leave out story points (not applicable in this case)

- Hours per task (estimated): 2h 47m average, σ = 3h 17m
- Hours per task (done): 2h 25m average, σ = 2h 16m
- Total task estimation error ratio: sum of total hours estimation / sum of total hours spent -1 = -0.13 (13.0% overestimation)

  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated: 40m
  - Total hours spent: 40m
  - Nr of automated unit test cases: 271
  - Coverage (if available): 82.43 %
- Integration testing: 
  - Total hours estimated: 1h 20m
  - Total hours spent: 1h 20m
- E2E testing:
  - Total hours estimated: 7h
  - Total hours spent: 7h 20m
- Code review: 
  - Total hours estimated: 8h
  - Total hours spent: 10h 5m
- Technical Debt management:
  - Strategy adopted: Feature-First, Pre-Testing Refactoring
  - Total hours estimated estimated at sprint planning: 19h
  - Total hours spent: 13h
                                                                                                                              
File                               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                                                                                                                                                              
-----------------------------------|---------|----------|---------|---------|--------------------------------------------------
All files                          |   90.19 |    84.71 |   89.72 |   90.09 |                                                 
 src                               |   89.65 |    79.76 |   85.71 |    90.2 |                                                 
  app.ts                           |   96.87 |       50 |       0 |   96.87 | 67                                              
  utils.ts                         |   87.61 |    80.48 |    92.3 |   88.28 | 112,149,159-169,173                             
 src/controllers                   |   84.61 |    79.68 |   87.23 |   84.56 |                                                 
  authController.ts                |   65.65 |    56.09 |   53.84 |   65.65 | 20-28,37-43,79,82-87,109-127,185,194-198,202-206
  citizenController.ts             |   95.74 |    83.33 |     100 |   95.74 | 46,65                                           
  notificationController.ts        |     100 |      100 |     100 |     100 |                                                 
  officeController.ts              |   81.81 |      100 |     100 |   81.81 | 17-18                                           
  reportController.ts              |   94.64 |    89.09 |     100 |   94.64 | 25,49,106,150,176,179                           
  staffController.ts               |   87.09 |      100 |     100 |   87.09 | 25-26,42-43                                     
 src/middlewares                   |   93.75 |     90.9 |     100 |   93.54 |                                                 
  authMiddleware.ts                |   92.59 |     90.9 |     100 |    92.3 | 24,40                                           
  errorMiddleware.ts               |     100 |      100 |     100 |     100 |                                                 
 src/repositories                  |   96.21 |    87.56 |   94.59 |   96.05 |                                                 
  citizenRepository.ts             |   95.45 |    84.21 |     100 |   95.34 | 29,118                                          
  notificationRepository.ts        |     100 |      100 |     100 |     100 |                                                 
  officeRepository.ts              |     100 |      100 |     100 |     100 |                                                 
  pendingVerificationRepository.ts |    87.5 |       80 |   57.14 |    87.5 | 29,46,93-102                                    
  reportRepository.ts              |   98.59 |    90.69 |     100 |   98.57 | 69,295                                          
  staffRepository.ts               |   95.04 |       84 |      95 |   94.38 | 69,93,149,167,181                               
 src/routes                        |   88.17 |    92.77 |   85.29 |   88.05 |                                                 
  authRoutes.ts                    |   72.85 |       95 |      60 |   72.85 | 54-65,90,101-105,110-115,135-140                
  citizenRoutes.ts                 |   83.05 |    95.65 |   83.33 |   82.14 | 22,37,52,62,67,102,107-111                      
  notificationRoutes.ts            |   93.75 |      100 |     100 |   93.75 | 13                                              
  officeRoutes.ts                  |     100 |      100 |     100 |     100 |                                                 
  reportRoutes.ts                  |   96.18 |       90 |     100 |   96.18 | 43,96,143,158,226                               
  staffRoutes.ts                   |     100 |      100 |     100 |     100 |                                                 
 src/services                      |   92.85 |    66.66 |   83.33 |   92.85 |                                                 
  errorService.ts                  |     100 |    44.44 |     100 |     100 | 9-19                                            
  mapperService.ts                 |   88.88 |      100 |   81.81 |   88.88 | 64-69                                           
-----------------------------------|---------|----------|---------|---------|--------------------------------------------------

Test Suites: 23 passed, 23 total
Tests:       453 passed, 453 total


## ASSESSMENT

- What caused your errors in estimation (if any)?

  The main errors were caused by the estimation of the refactor tasks.

- What lessons did you learn (both positive and negative) in this sprint?

  We found a way to divide better the tasks especially test tasks. (positive)
  Better distribute the workload during the sprint. (negative)

- Which improvement goals set in the previous retrospective were you able to achieve? 

  Pace: we were able to finish all the implementation before the holidays.

- Which ones you were not able to achieve? Why?

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  Refactor more efficiently.

- One thing you are proud of as a Team!!

  We grew together as developers both individually and as a group.