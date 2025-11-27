TEMPLATE FOR RETROSPECTIVE (Team 15)
=====================================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed vs. done 

      6 committed vs 6 done

- Total points committed vs. done 

      36 committed points vs 36 point done

- Nr of hours planned vs. spent (as a team)

        96 hours 22 minutes vs 92 hours 45 minutes

**Remember**a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing


- Code review completed


- Code present on VCS
  

- End-to-End tests performed


> Please refine your DoD if required (you cannot remove items!) 

### Detailed statistics

|      Story      | # Tasks | Points | Hours est. | Hours actual |
| :-------------: | :-----: | :----: | :--------: | :----------: |
| _Uncategorized_ |    7    |   -    | 31 h 15 m  |  22 h 35 m   |
| _PT05_          |    8    |   3    | 13 h       |  13 h 30 m   |
| _PT06_          |    7    |   2    | 14 h 30 m  |  15 h 05 m   |
| _PT07_          |    4    |   13   | 9 h  30 m  |  10 h 35 m   |
| _PT08_          |    4    |   2    | 9 h        |  7 h 20 m    |
| _PT09_          |    6    |   3    | 11 h 30 m  |  11 h 00 m   |
| _PT011_         |    14   |   13   | 16 h 30 m  |  12 h 40 m   |


> story `Uncategorized` is for technical tasks, leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            | Mean | StDev |
| ---------- | :--: | :---: |
| Estimation | **   |  **   |
| Actual     | **   |  **   |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1 = **\\% $$
    
- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| = **\\% $$
  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated

      3 h 40 m

  - Total hours spent

      3 h 20 m

  - Nr of automated unit test 
  cases

      189 tests 

  - Coverage

      86.32%

```
----------------------------|---------|----------|---------|---------|-----------------------------------------------                                                                                      
File                        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                                                                                                                   
----------------------------|---------|----------|---------|---------|-----------------------------------------------
All files                   |   86.32 |    81.07 |    78.5 |    86.3 |                                              
 src                        |     100 |      100 |     100 |     100 |                                              
  utils.ts                  |     100 |      100 |     100 |     100 |                                              
 src/controllers            |      74 |    73.75 |   57.57 |   73.86 |                                              
  authController.ts         |   64.15 |       60 |      50 |   64.15 | 17-25,34-40,86-104                           
  citizenController.ts      |   65.85 |       30 |    62.5 |   65.85 | 20,28,36,43-51,61-66                         
  notificationController.ts |     100 |      100 |     100 |     100 |                                              
  officeController.ts       |   85.71 |       75 |     100 |   85.71 | 29,41-42                                     
  reportController.ts       |   78.08 |    93.93 |   46.15 |   78.08 | 21-29,100-101,105-106,110-111,119-120,128-129
 src/repositories           |   94.28 |    81.42 |   93.47 |   94.28 |                                              
  citizenRepository.ts      |   93.54 |       75 |   88.88 |   93.54 | 57,90                                        
  notificationRepository.ts |     100 |      100 |     100 |     100 |                                              
  officeRepository.ts       |   95.83 |    80.76 |    92.3 |   95.83 | 102,114                                      
  reportRepository.ts       |   91.96 |    80.95 |   88.88 |   91.96 | 80,84-86,102-108,141,209,216                 
  staffRepository.ts        |   96.87 |       90 |     100 |   96.87 | 78                                           
 src/routes                 |   90.44 |     86.2 |   93.75 |   90.44 |                                              
  notificationRoutes.ts     |     100 |      100 |     100 |     100 |                                              
  reportRoutes.ts           |   89.36 |     86.2 |   92.85 |   89.36 | 42,46,56,64,105-110,149,162,168-173,211      
 src/services               |   70.58 |    83.33 |      50 |   70.58 |                                              
  mapperService.ts          |   70.58 |    83.33 |      50 |   70.58 | 21,54,64-68,94                               
----------------------------|---------|----------|---------|---------|-----------------------------------------------
```

Test Suites: 14 passed, 14 total
Tests:       189 passed, 189 total

- E2E testing (considering both frontend and backend): 
  - Total hours estimated

      13 h 30 m

  - Total hours spent

      12 h 50m

  - Nr of test cases

      99

```
----------------------------|---------|----------|---------|---------|--------------------------------------------------------
File                        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------------------|---------|----------|---------|---------|--------------------------------------------------------
All files                   |   72.15 |       65 |   60.97 |   72.48 |                                                       
 src                        |      95 |    83.33 |   66.66 |      95 |                                                       
  app.ts                    |   96.66 |      100 |       0 |   96.66 | 72                                                    
  utils.ts                  |      90 |       75 |     100 |      90 | 11                                                    
 src/controllers            |    63.5 |       50 |   51.51 |   63.81 |                                                       
  authController.ts         |   60.37 |       52 |      50 |   60.37 | 17-25,34-40,86-104,118,130                            
  citizenController.ts      |   68.29 |       60 |      50 |   68.29 | 43-51,61-66,78-79                                     
  notificationController.ts |   41.66 |        0 |       0 |   45.45 | 7-16,20                                               
  officeController.ts       |   38.09 |        0 |      50 |   38.09 | 8-29,41-42                                            
  reportController.ts       |   73.97 |    63.63 |   61.53 |   73.97 | 47,65,105-106,133-150,154-160                         
 src/middlewares            |   88.46 |    83.33 |     100 |      88 |                                                       
  authMiddleware.ts         |   85.71 |    83.33 |     100 |      85 | 13,23,39                                              
  errorMiddleware.ts        |     100 |      100 |     100 |     100 |                                                       
 src/repositories           |   66.53 |    53.57 |   56.52 |   66.53 |                                                       
  citizenRepository.ts      |   64.51 |     37.5 |   88.88 |   64.51 | 46,88-105                                             
  notificationRepository.ts |   59.09 |       25 |   33.33 |   59.09 | 23,42-76                                              
  officeRepository.ts       |   31.25 |     7.69 |   30.76 |   31.25 | 82-87,101-190                                         
  reportRepository.ts       |   78.57 |    70.23 |   66.66 |   78.57 | 80,102-108,138,141,200,203,206,209,216,224,229,283-317
  staffRepository.ts        |   84.37 |       70 |   66.66 |   84.37 | 41-46,64,73,78                                        
 src/routes                 |   77.56 |    81.56 |   74.07 |   78.46 |                                                       
  authRoutes.ts             |   88.88 |    96.77 |   83.33 |   88.88 | 47-58,83                                              
  citizenRoutes.ts          |    57.4 |    43.47 |      80 |   60.78 | 14,29,44,54,59,65-94                                  
  notificationRoutes.ts     |      50 |      100 |       0 |      50 | 9-13,18-22                                            
  officeRoutes.ts           |     100 |      100 |     100 |     100 |                                                       
  reportRoutes.ts           |   83.68 |     86.2 |   78.57 |   83.68 | 46,56,64,105-110,244-259,264-271                      
 src/services               |   85.18 |    66.66 |   63.63 |   85.18 |                                                       
  errorService.ts           |     100 |    44.44 |     100 |     100 | 9-19                                                  
  mapperService.ts          |   76.47 |      100 |      60 |   76.47 | 64-68,94,107                                          
----------------------------|---------|----------|---------|---------|--------------------------------------------------------

Test Suites: 5 passed, 5 total
Tests:       99 passed, 99 total

```
- Code review 
  - Total hours estimated 

      12h

  - Total hours spent

      9h 30 m
  


## ASSESSMENT

- What did go wrong in the sprint?

        The main issue was merging the branches on github and it created conflicts which caused delays. 

- What caused your errors in estimation (if any)?

        In story 6, we put tasks that could be split futher to better balance the load among members.

- What lessons did you learn (both positive and negative) in this sprint?

        Positive: merging should be done in groups.
        Negative: communication should be improved providing messages after pushing a commit.

- Which improvement goals set in the previous retrospective were you able to achieve?

        Sprint Planning
  
- Which ones you were not able to achieve? Why?

        Communication: it improved but not enough

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

        Communication: further improve communication by informing other members about changes.
        Synchronization: we should have better synchronization between branches.


- One thing you are proud of as a Team!!

        We improved sprint planning. We were able to finish more stories than previous sprint.
