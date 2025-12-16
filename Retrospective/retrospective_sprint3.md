TEMPLATE FOR RETROSPECTIVE (Team 15)
=====================================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed vs done: 6 vs 6
- Total points committed vs done: 50 vs 50
- Nr of hours planned vs spent (as a team): 98h 55m vs 93h 20m

**Remember**  a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD 

### Detailed statistics

| Story | # Tasks | Points | Hours est. | Hours actual |
| :---: | :-----: | :----: | :--------: | :----------: |
| _#0_  |    6    |   -    |  31h 30m   |   26h 40m    |
|  24   |    7    |   8    |  13h 10m   |   14h 47m    |
|  25   |    6    |   3    |   8h 00m   |    6h 40m    |
|  26   |    7    |   5    |   9h 25m   |   12h 55m    |
|  27   |    7    |   8    |  12h 30m   |    9h 25m    |
|  10   |    7    |   5    |  10h 50m   |   11h 55m    |
|  12   |    6    |   21   |  13h 30m   |   10h 58m    |
   

> place technical tasks corresponding to story `#0` and leave out story points (not applicable in this case)

- Hours per task (estimated): 2h 9m average, σ = 2h 37m
- Hours per task (done): 2h 2m average, σ = 2h 14m
- Total task estimation error ratio: sum of total hours estimation / sum of total hours spent -1 = -0.06 (6.0% overestimation)
  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated: 5h
  - Total hours spent: 7h 30m
  - Nr of automated unit test cases: 387
  - Coverage (if available): 87.55%
- Integration testing: (included in **unit testing** for this sprint)
  - Total hours estimated: N/A
  - Total hours spent: N/A 
- E2E testing:
  - Total hours estimated: 10h
  - Total hours spent: 12h 05m
- Code review: 
  - Total hours estimated: 9h
  - Total hours spent: 9h 55m
- Technical Debt management:
  - Strategy adopted: Feature-First, Pre-Testing Refactoring
  - Total hours estimated at sprint planning: 6h
  - Total hours spent: 7h 50m
  

-------------------------------------------------------------------------------------------------------------------------------
File                               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------------------------|---------|----------|---------|---------|--------------------------------------------------
All files                          |   87.55 |     82.2 |   84.91 |   87.41 |                                                 
 src                               |   95.87 |    95.45 |      90 |   95.87 |                                                 
  app.ts                           |   96.87 |       50 |       0 |   96.87 | 74                                              
  utils.ts                         |   95.38 |    97.61 |     100 |   95.38 | 110,122-123                                     
 src/controllers                   |   76.72 |    72.03 |   78.26 |   76.64 |                                                 
  authController.ts                |      66 |    58.13 |   53.84 |      66 | 22-30,39-45,90,93-98,120-138,196,205-209,213-217
  citizenController.ts             |   95.74 |    83.33 |     100 |   95.74 | 46,65                                           
  notificationController.ts        |     100 |      100 |     100 |     100 |                                                 
  officeController.ts              |   81.81 |      100 |     100 |   81.81 | 15-16                                           
  reportController.ts              |   91.34 |    86.79 |   94.44 |   91.34 | 25,49,86,106,113-114,150,176,179                
  staffController.ts               |   22.58 |        0 |       0 |   22.58 | 9-22,27-37,42-52                                
 src/middlewares                   |   93.75 |     90.9 |     100 |   93.54 |                                                 
  authMiddleware.ts                |   92.59 |     90.9 |     100 |    92.3 | 24,40                                           
  errorMiddleware.ts               |     100 |      100 |     100 |     100 |                                                 
 src/repositories                  |   94.08 |    80.67 |   90.78 |    94.1 |                                                 
  citizenRepository.ts             |   95.45 |    78.94 |     100 |   95.34 | 29,122                                          
  notificationRepository.ts        |     100 |      100 |     100 |     100 |                                                 
  officeRepository.ts              |     100 |      100 |     100 |     100 |                                                 
  pendingVerificationRepository.ts |    87.5 |       80 |   57.14 |    87.5 | 29,46,93-102                                    
  reportRepository.ts              |    94.4 |    84.25 |    92.3 |   94.93 | 81-85,90,109,324                                
  staffRepository.ts               |   93.06 |       70 |      90 |   92.13 | 69,93,123,138-149,167,181                       
 src/routes                        |   86.17 |    93.97 |   77.41 |   86.02 |                                                 
  authRoutes.ts                    |   72.85 |       95 |      60 |   72.85 | 58-69,94,105-109,114-119,139-144                
  citizenRoutes.ts                 |   83.05 |    95.65 |   83.33 |   82.14 | 22,37,52,62,67,102,107-111                      
  notificationRoutes.ts            |   93.75 |      100 |     100 |   93.75 | 13                                              
  officeRoutes.ts                  |     100 |      100 |     100 |     100 |                                                 
  reportRoutes.ts                  |   93.16 |     92.5 |    90.9 |   93.16 | 60,97-102,149,164,232                           
  staffRoutes.ts                   |    92.3 |      100 |      50 |    92.3 | 22                                              
 src/services                      |   92.85 |    66.66 |   83.33 |   92.85 |                                                 
  errorService.ts                  |     100 |    44.44 |     100 |     100 | 9-19                                            
  mapperService.ts                 |   88.88 |      100 |   81.81 |   88.88 | 64-69                                           
-----------------------------------|---------|----------|---------|---------|--------------------------------------------------

Test Suites: 21 passed, 21 total
Tests:       387 passed, 387 total


## ASSESSMENT

- What caused your errors in estimation (if any)?

    We underestimated frontend tasks, because we thought that they were minor updates of previous stories. Especially in story 26 frontend took us more time.

- What lessons did you learn (both positive and negative) in this sprint?

    - Doing tests after implementing everything allows us to not frequently change the tests after merging. (Positive)
    - If we manage to have a more open and flexible way of discussing, we can work better together instead of focusing on small details. (Negative)

- Which improvement goals set in the previous retrospective were you able to achieve? 

    - Communication improved and we were also more synchronized.
  
- Which ones you were not able to achieve? Why?

    - For this sprint we reached every goal, but still communication can always be improved.

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

    - Pace: To finish everything earlier so we can focus on fixing possible issues.

- One thing you are proud of as a Team!!

    We managed to deliver a clear and robust app. Also we managed to implement features that we never did before like Telegram bot and email verification.