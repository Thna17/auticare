# Database Architecture

The Prisma schema defines parent auth, preferences, children, screening sessions/questions/answers/results, support directories, appointments, activities, progress, and notifications. Screening answers are unique per screening/question. Transactions are required for screening submission, appointment notification creation, and admission request notification creation.
