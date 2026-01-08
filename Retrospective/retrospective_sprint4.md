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
-----------------------------------|---------|----------|---------|---------|---------------------------------------------------------------------------
All files                          |   82.43 |    73.59 |    82.6 |   82.35 |                                                                          
 src                               |   73.45 |    65.85 |   84.61 |   73.87 |                                                                          
  utils.ts                         |   73.45 |    65.85 |   84.61 |   73.87 | 37,49,63,68,71,76,110-114,149,159-169,173,182-184,186,188-190            
 src/controllers                   |   79.48 |    74.21 |   76.59 |   79.42 |                                                                          
  authController.ts                |   65.65 |    53.65 |   53.84 |   65.65 | 20-28,37-43,79,82-87,109-127,185,194-198,202-206                         
  citizenController.ts             |   76.59 |    66.66 |   66.66 |   76.59 | 44-52,62-67                                                              
  notificationController.ts        |     100 |      100 |     100 |     100 |                                                                          
  officeController.ts              |   81.81 |       50 |     100 |   81.81 | 17-18                                                                    
  reportController.ts              |   88.39 |    83.63 |   89.47 |   88.39 | 25,49,106,113-114,133-134,150,155,158,170,176,179                        
  staffController.ts               |   87.09 |      100 |     100 |   87.09 | 25-26,42-43                                                              
 src/middlewares                   |   93.75 |     90.9 |     100 |   93.54 |                                                                          
  authMiddleware.ts                |   92.59 |     90.9 |     100 |    92.3 | 24,40                                                                    
  errorMiddleware.ts               |     100 |      100 |     100 |     100 |                                                                          
 src/repositories                  |   94.32 |    84.32 |   91.89 |   94.36 |                                                                          
  citizenRepository.ts             |   93.18 |    73.68 |     100 |   93.02 | 29,118,130                                                               
  notificationRepository.ts        |     100 |      100 |     100 |     100 |                                                                          
  officeRepository.ts              |   94.44 |       75 |     100 |   94.44 | 129                                                                      
  pendingVerificationRepository.ts |    87.5 |       80 |   57.14 |    87.5 | 29,46,93-102                                                             
  reportRepository.ts              |   95.77 |     87.2 |      96 |   95.71 | 69,81,235,267,295,325                                                    
  staffRepository.ts               |   94.05 |       84 |      90 |   94.38 | 69,93,149,167,181                                                        
 src/routes                        |   71.62 |    53.01 |   67.64 |   71.67 |                                                                          
  authRoutes.ts                    |   41.42 |       20 |      20 |   41.42 | 20-49,54-65,75,78,83,88-92,97,101-105,110-115,135-140                    
  citizenRoutes.ts                 |   81.35 |     82.6 |   83.33 |   82.14 | 22,37,52,62,67,102,107-111                                               
  notificationRoutes.ts            |   93.75 |      100 |     100 |   93.75 | 13                                                                       
  reportRoutes.ts                  |   77.86 |     52.5 |   85.71 |   77.86 | 35,39,43,47,51,55,59,86,91-96,122,128,143,158,167,188,195,209,226,231-240
  staffRoutes.ts                   |     100 |      100 |     100 |     100 |                                                                          
 src/services                      |   92.85 |    66.66 |   83.33 |   92.85 |                                                                          
  errorService.ts                  |     100 |    44.44 |     100 |     100 | 9-19                                                                     
  mapperService.ts                 |   88.88 |      100 |   81.81 |   88.88 | 64-69                                                                    
-----------------------------------|---------|----------|---------|---------|---------------------------------------------------------------------------

Test Suites: 18 passed, 18 total
Tests:       271 passed, 271 total


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