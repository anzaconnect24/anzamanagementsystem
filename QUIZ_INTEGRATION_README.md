# Quiz System - Frontend Integration Guide

## Overview

The quiz system has been fully integrated into the frontend. Users can now create, take, and review quizzes for each module.

## Components Created

### 1. Quiz Controller (`src/controllers/quiz_controller.js`)

All API calls for quiz functionality:

- `createQuiz`, `updateQuiz`, `deleteQuiz`
- `addQuestion`, `updateQuestion`, `deleteQuestion`
- `startQuizAttempt`, `submitQuiz`
- `getUserAttempts`, `downloadCertificate`
- `getAllAttempts`, `markDescriptionAnswer` (Admin)

### 2. Module Quizzes Page (`src/pages/learnandgrow/quizzes/ModuleQuizzes.jsx`)

**Route:** `/learn-and-grow/quizzes/:moduleId`

**Features:**

- Lists all quizzes for a module
- Tabs: All / Published / Draft
- Admin: Create, Edit, Delete, Publish/Unpublish, View Attempts
- Entrepreneur: Take Quiz, View My Attempts

### 3. Create/Edit Quiz Page (`src/pages/learnandgrow/quizzes/CreateEditQuiz.jsx`)

**Routes:**

- `/learn-and-grow/quizzes/:moduleId/new` (Create)
- `/learn-and-grow/quizzes/:moduleId/edit/:quizId` (Edit)

**Features:**

- Create quiz with title, description, passing score
- Add/Edit/Delete questions
- Support for Multiple Choice, True/False, Description questions
- Visual question list with correct answers marked

### 4. Take Quiz Page (`src/pages/learnandgrow/quizzes/TakeQuiz.jsx`)

**Route:** `/learn-and-grow/quizzes/:moduleId/take/:quizId`

**Features:**

- Answer all quiz questions
- Progress tracking (X of Y answered)
- Support for all question types
- Submit validation (all questions must be answered)
- Auto-redirects to results page after submission

### 5. Quiz Result Page (`src/pages/learnandgrow/quizzes/QuizResult.jsx`)

**Route:** `/learn-and-grow/quizzes/:moduleId/result/:attemptId`

**Features:**

- Show pass/fail status with visual indicators
- Display score, points earned, total points
- Show correct/incorrect answers with explanations
- Download certificate button (if passed)
- Warning for questions awaiting instructor review
- Option to retake quiz if failed

### 6. User Attempts Page (`src/pages/learnandgrow/quizzes/UserAttempts.jsx`)

**Route:** `/learn-and-grow/quizzes/:moduleId/my-attempts/:quizId`

**Features:**

- View all quiz attempts history
- Summary statistics (total attempts, passed, best score)
- View detailed results for each attempt
- Retake quiz option

### 7. Admin Attempts Page (`src/pages/learnandgrow/quizzes/AdminAttempts.jsx`)

**Route:** `/learn-and-grow/quizzes/:moduleId/attempts/:quizId`

**Features:**

- View all student submissions
- Filter by needs grading
- Review student answers
- Grade description questions with:
  - Correct/Incorrect marking
  - Points assignment
  - Written feedback
- Auto-recalculates scores after grading

## User Flows

### Admin Flow:

1. Go to module → Click "Quizzes" button
2. Click "Create New Quiz"
3. Enter quiz details (title, description, passing score)
4. Save quiz
5. Add questions (multiple choice, true/false, or description)
6. Publish quiz
7. View submissions via "Attempts" button
8. Grade description answers if needed

### Entrepreneur Flow:

1. Go to module → Click "Quizzes" button
2. Select a published quiz
3. Click "Take Quiz"
4. Answer all questions
5. Submit quiz
6. View results (pass/fail, score, correct answers)
7. Download certificate if passed
8. View attempt history via "My Attempts"

## Routes Configuration

Add these routes to your routing configuration:

```javascript
// Module Quizzes
/learn-and-grow/quizzes/:moduleId → ModuleQuizzes.jsx

// Admin
/learn-and-grow/quizzes/:moduleId/new → CreateEditQuiz.jsx
/learn-and-grow/quizzes/:moduleId/edit/:quizId → CreateEditQuiz.jsx
/learn-and-grow/quizzes/:moduleId/attempts/:quizId → AdminAttempts.jsx

// Entrepreneur
/learn-and-grow/quizzes/:moduleId/take/:quizId → TakeQuiz.jsx
/learn-and-grow/quizzes/:moduleId/result/:attemptId → QuizResult.jsx
/learn-and-grow/quizzes/:moduleId/my-attempts/:quizId → UserAttempts.jsx
```

## Module Integration

The ModuleWithCourse.jsx has been updated to include a "Quizzes" button for each module card that links to `/learn-and-grow/quizzes/${moduleId}`.

## API Endpoints Used

**Backend Base URL:** `http://localhost:5001/`

### Quiz Management:

- `POST /quiz/create` - Create quiz
- `GET /quiz/module/:moduleId` - Get quizzes by module
- `GET /quiz/:uuid` - Get single quiz
- `PUT /quiz/:uuid` - Update quiz
- `PATCH /quiz/:uuid/publish` - Toggle publish
- `DELETE /quiz/:uuid` - Delete quiz

### Questions:

- `POST /quiz/:quizUuid/questions` - Add question
- `PUT /quiz/questions/:questionUuid` - Update question
- `DELETE /quiz/questions/:questionUuid` - Delete question

### Taking Quizzes:

- `POST /quiz/:quizUuid/start` - Start attempt
- `POST /quiz/attempts/:attemptUuid/submit` - Submit answers
- `GET /quiz/attempts/user/:quizUuid?` - Get user attempts
- `GET /quiz/attempts/:attemptUuid/certificate` - Download certificate

### Admin Grading:

- `GET /quiz/admin/attempts?filters` - Get all attempts
- `GET /quiz/admin/attempts/:attemptUuid` - Get attempt details
- `PATCH /quiz/admin/answers/:answerUuid/mark` - Mark answer

## Question Types

### 1. Multiple Choice

- Multiple options
- One or more correct answers
- Auto-graded on submission

### 2. True/False

- Two options (True/False)
- Auto-graded on submission

### 3. Description (Essay)

- Free text answer
- Requires manual grading by admin
- Supports partial credit
- Admin can provide written feedback

## Features

✅ **Quiz Creation & Management**

- Create quizzes with customizable passing scores
- Add multiple question types
- Publish/unpublish quizzes
- Edit and delete quizzes

✅ **Question Management**

- Multiple choice questions
- True/false questions
- Description/essay questions
- Points per question
- Reorder questions

✅ **Quiz Taking**

- Clean, user-friendly interface
- Progress tracking
- Submit validation
- Immediate results for auto-graded questions

✅ **Results & Certificates**

- Pass/fail status
- Detailed answer review
- Certificate download for passed quizzes
- Attempt history

✅ **Admin Grading**

- View all student submissions
- Filter by needs grading
- Manual grading for description questions
- Provide feedback
- Auto-recalculate scores

✅ **Responsive Design**

- Mobile-friendly
- Clean UI with Tailwind CSS
- Loading states
- Error handling

## Dependencies

Required packages (already in use):

- `axios` - API calls
- `react-hot-toast` - Notifications
- `react-icons` - Icons
- `react-router-dom` - Routing

## Testing Checklist

- [ ] Admin can create a quiz
- [ ] Admin can add questions (all types)
- [ ] Admin can publish a quiz
- [ ] Entrepreneur can see published quizzes
- [ ] Entrepreneur can take a quiz
- [ ] Entrepreneur can submit answers
- [ ] Entrepreneur can view results
- [ ] Entrepreneur can download certificate (if passed)
- [ ] Admin can view submissions
- [ ] Admin can grade description answers
- [ ] Scores recalculate after grading
- [ ] All routes work correctly

## Notes

1. **Authentication:** All endpoints require JWT token in Authorization header
2. **Module ID:** Quiz pages use module UUID, not module ID
3. **Certificates:** Only available for passed quizzes (score >= passingScore)
4. **Description Questions:** Require manual grading, isCorrect is null until graded
5. **Retake:** Users can retake quizzes multiple times
6. **Best Score:** System tracks all attempts, users can view history

## Troubleshooting

**Issue:** "Failed to load quizzes"

- Check backend is running on port 5001
- Verify JWT token is valid
- Check network tab for error details

**Issue:** "Cannot create quiz"

- Ensure module ID is correct (UUID format)
- Verify user has Admin role

**Issue:** Certificate won't download

- Ensure quiz is submitted
- Verify user passed (score >= passing score)
- Check browser console for errors

## Future Enhancements

Potential improvements:

- Timer for timed quizzes
- Randomize question order
- Question bank/reusable questions
- Quiz analytics dashboard
- Bulk import questions
- Image support in questions
- Quiz categories/tags
