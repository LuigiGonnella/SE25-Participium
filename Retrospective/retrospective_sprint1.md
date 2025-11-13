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

        * hours * minutes vs * hours * minutes

**Remember**a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing


- Code review completed


- Code present on VCS
  

- End-to-End tests performed


> Please refine your DoD if required (you cannot remove items!) 

### Detailed statistics

|      Story      | # Tasks | Points | Hours est. | Hours actual |
| :-------------: | :-----: | :----: | :--------: | :----------: |
| _Uncategorized_ |    8    |   -    | 37 h 22 m  |  30 h 17 m   |
| _PT01_          |    7    |   3    | 24 h       |  23 h        |
| _PT02_          |    5    |   3    | 14 h       |  7 h 6m      |
| _PT03_          |    5    |   2    | 9 h        |  9 h 28 m    |
| _PT04_          |    3    |   8    | 12 h       |  5 h 55 m    |

> story `Uncategorized` is for technical tasks, leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            | Mean | StDev |
| ---------- | :--: | :---: |
| Estimation | *    |  *    |
| Actual     | *    |  *    |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1 = -2\% $$
    
- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| = 29\% $$
  
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
-----------------|---------|----------|---------|---------|-------------------
File             |  Stmts  | Branch   | Funcs   |  Lines  | Uncovered Lines   
-----------------|---------|----------|---------|---------|-------------------
All files        |   95.03 |    85.18 |   96.15 |   95.71 |                   
 src             |     100 |      100 |     100 |     100 |                   
  utils.ts       |     100 |      100 |     100 |     100 |                   
 ...repositories |   94.65 |     82.6 |      96 |   95.38 |                   
  ...pository.ts |     100 |      100 |     100 |     100 |                   
  ...pository.ts |     100 |      100 |     100 |     100 |                   
  ...pository.ts |     100 |      100 |     100 |     100 |                   
  ...pository.ts |     100 |      100 |     100 |     100 |                   
  ...pository.ts |   84.09 |    66.66 |   85.71 |   86.04 | 71,106-125        
-----------------|---------|----------|---------|---------|-------------------
```

Test Suites: 5 passed, 5 total
Tests:       92 passed, 92 total

- E2E testing: 
  - Total hours estimated

      1d 2h 30m
  - Total hours spent

      0
  - Nr of test cases

      0
- Code review 
  - Total hours estimated 

      0
  - Total hours spent

      0
  


## ASSESSMENT

- What did go wrong in the sprint?

        We underestimated time in planning and spent more time on uncategorized tasks like the sprint planning and we waived test time.

- What caused your errors in estimation (if any)?

        We divided the tasks and stories in internal groups and while performing the tasks simultaneously we didn't catch up with the other groups on time.

        It was our first time working together and with Agile.

- What lessons did you learn (both positive and negative) in this sprint?

        We understood how to work together under pressure. (Positive)

        We agreed and made unanimous decisions. (Positive)

        We learned that planning and communication are key elements in a group project. (Negative)


- Which improvement goals set in the previous retrospective were you able to achieve? 
  
- Which ones you were not able to achieve? Why?

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

        Tasks -> We will make sure everyone participates in the setup tasks (defining entities, backend configuration, ...).

        Planning -> We will try to spend planning time more efficiently.

- One thing you are proud of as a Team!!

        We are proud of doing a great presentation and provide a fully working software.