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

      4 committed vs 4 done

- Total points committed vs. done 

      16 committed points vs 16 point done

- Nr of hours planned vs. spent (as a team)

        96 hours 22 minutes vs 75 hours 56 minutes

**Remember**a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing


- Code review completed


- Code present on VCS
  

- End-to-End tests performed


> Please refine your DoD if required (you cannot remove items!) 

### Detailed statistics

|      Story      | # Tasks | Points | Hours est. | Hours actual |
| :-------------: | :-----: | :----: | :--------: | :----------: |
| _Uncategorized_ |    8    |   -    | 37 h 22 m  |  30 h 27 m   |
| _PT01_          |    7    |   3    | 24 h       |  23 h        |
| _PT02_          |    5    |   3    | 14 h       |  7 h 6m      |
| _PT03_          |    5    |   2    | 9 h        |  9 h 28 m    |
| _PT04_          |    3    |   8    | 12 h       |  5 h 55 m    |

> story `Uncategorized` is for technical tasks, leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            | Mean | StDev |
| ---------- | :--: | :---: |
| Estimation | 207  |  141  |
| Actual     | 163  |  169  |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1 = -21\\% $$
    
- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| = 41\\% $$
  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated

      10 h

  - Total hours spent

      6 h 46 m
  - Nr of automated unit test 
  cases

      86 tests 
  - Coverage

      84.72%

```
-----------------------|---------|----------|---------|---------|--------------------
File                   | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s  
-----------------------|---------|----------|---------|---------|--------------------
All files              |   84.72 |    74.72 |   81.13 |   84.72 |                    
 src                   |     100 |      100 |     100 |     100 |                    
  utils.ts             |     100 |      100 |     100 |     100 |                    
 src/controllers       |    73.4 |    61.53 |   71.42 |    73.4 |                    
  authController.ts    |   64.15 |       60 |      50 |   64.15 | 17-25,34-40,86-104 
  citizenController.ts |   85.71 |       50 |     100 |   85.71 | 16,24,32           
  officeController.ts  |      85 |       75 |     100 |      85 | 28,40-41           
 src/repositories      |   96.03 |    84.09 |   93.33 |   96.03 |                    
  citizenRepository.ts |   95.23 |     87.5 |    87.5 |   95.23 | 57                 
  officeRepository.ts  |   95.83 |    80.76 |    92.3 |   95.83 | 102,114            
  staffRepository.ts   |   96.87 |       90 |     100 |   96.87 | 78                 
 src/services          |   63.63 |       75 |   42.85 |   63.63 |                    
  mapperService.ts     |   63.63 |       75 |   42.85 |   63.63 | 14,47,57-61        
-----------------------|---------|----------|---------|---------|--------------------
```

Test Suites: 8 passed, 8 total
Tests:       86 passed, 86 total

- E2E testing: 
  - Total hours estimated

      10h
  - Total hours spent

      3h 30m
  - Nr of test cases

      47

```
-----------------------|---------|----------|---------|---------|----------------------------
File                   | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s          
-----------------------|---------|----------|---------|---------|----------------------------
All files              |   71.82 |    56.79 |   65.67 |   71.74 |                            
 src                   |   97.05 |    83.33 |     100 |   97.05 |                            
  app.ts               |     100 |      100 |     100 |     100 |                            
  utils.ts             |      90 |       75 |     100 |      90 | 11                         
 src/controllers       |   63.82 |    48.71 |   64.28 |   63.82 |                            
  authController.ts    |   60.37 |       52 |      50 |   60.37 | 17-25,34-40,86-104,118,130 
  citizenController.ts |     100 |      100 |     100 |     100 |                            
  officeController.ts  |      35 |        0 |      50 |      35 | 7-28,40-41                 
 src/middlewares       |   80.76 |    72.22 |     100 |      80 |                            
  authMiddleware.ts    |   76.19 |    72.22 |     100 |      75 | 13,23,28,36-39             
  errorMiddleware.ts   |     100 |      100 |     100 |     100 |                            
 src/repositories      |   50.49 |    18.18 |      50 |   50.49 |                            
  citizenRepository.ts |   95.23 |       75 |     100 |   95.23 | 46                         
  officeRepository.ts  |   29.16 |     3.84 |   23.07 |   29.16 | 82-190                     
  staffRepository.ts   |   53.12 |       10 |   44.44 |   53.12 | 41-46,63-97                
 src/routes            |   88.37 |    95.23 |      90 |   88.37 |                            
  authRoutes.ts        |   88.88 |    96.77 |   83.33 |   88.88 | 47-58,83                   
  citizenRoutes.ts     |   85.29 |     90.9 |     100 |   85.29 | 13,28,43,53,58             
  officeRoutes.ts      |     100 |      100 |     100 |     100 |                            
 src/services          |   90.47 |    53.84 |      75 |   90.47 |                            
  errorService.ts      |     100 |    44.44 |     100 |     100 | 9-19                       
  mapperService.ts     |   81.81 |       75 |   71.42 |   81.81 | 57-61                      
-----------------------|---------|----------|---------|---------|----------------------------

Test Suites: 3 passed, 3 total
Tests:       47 passed, 47 total

```
- Code review 
  - Total hours estimated 

      11h
  - Total hours spent

      6h 18m
  


## ASSESSMENT

- What did go wrong in the sprint?

        We underestimated the implementation tasks and overestimated the tests. In the end we spent less time than estimated, not reaching the expected 8 hours per week.

- What caused your errors in estimation (if any)?

        We overestimated the map task (story 4), because nobody in the group ever implemented it, and the tests, thinking they would require more time.

- What lessons did you learn (both positive and negative) in this sprint?

        Positive: as a group, we're more efficient and experienced than we thought, so we can probably estimate a higher workload next time
        Negative: communication should be improved, as well as tasks estimation and planning

- Which improvement goals set in the previous retrospective were you able to achieve?
  
- Which ones you were not able to achieve? Why?

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

        Sprint Planning: we should be more efficient when dividing tasks, trying to balance the workload for each member.
        Communication: making sure to inform the group about breaking changes

- One thing you are proud of as a Team!!

        We managed to fully complete all the estimated stories before the deadline, without rushing in the last minute.
