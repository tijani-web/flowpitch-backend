import { body } from 'express-validator';


// Register Validation
export const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase and number'),
  body('username').optional().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('Username 3-30 chars, letters, numbers, underscore only')
];


// Login Validation
export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
];


// Forgot Password Validation
export const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required')
];

// Reset Password Validation
export const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase and number')
];


// Change Password Validation
export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase and number')
];

// Update Profile Validation
export const updateProfileValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('username').optional().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('Username 3-30 chars, letters/numbers/underscore only'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
  body('avatar_url').optional().isURL().withMessage('Avatar must be a valid URL')
];


// Delete Account Validation
export const deleteAccountValidation = [
  body('password').notEmpty().withMessage('Password is required to delete account')
];



// Projects Validation
export const createProjectValidation = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description too long'),
  body('category').optional().trim().isLength({ max: 100 }).withMessage('Category too long'),
  body('logo_url').optional().isURL().withMessage('Logo must be valid URL'),
  body('visibility').optional().isIn(['public', 'private']).withMessage('Visibility must be public or private')
];



// Update Project Validation
export const updateProjectValidation = [
  body('title').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description too long'),
  body('category').optional().trim().isLength({ max: 100 }).withMessage('Category too long'),
  body('logo_url').optional().isURL().withMessage('Logo must be valid URL'),
  body('visibility').optional().isIn(['public', 'private']).withMessage('Visibility must be public or private')
];


// Features Validation
export const createFeatureValidation = [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description too long'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority')
];


  // Update Feature Validation
export const updateFeatureValidation = [
  body('title').optional().trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description too long'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('status').optional().isIn(['open', 'under_review', 'in_progress', 'completed', 'rejected']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority')
];

// Votes Validation
export const voteValidation = [
  body('value').isInt({ min: -1, max: 1 }).withMessage('Vote must be -1, 0, or 1')
];

// Comments Validation
export const commentValidation = [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be 1-1000 characters'),
  body('parent_id').optional().isString().withMessage('Parent ID must be a string')
];

export const updateCommentValidation = [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be 1-1000 characters')
];


// Invite Validation
export const inviteValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('role').isIn(['viewer', 'editor', 'admin']).withMessage('Invalid role')
];

export const updateRoleValidation = [
  body('role').isIn(['viewer', 'editor', 'admin']).withMessage('Invalid role')
];


export const discussionValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Discussion content must be between 1 and 1000 characters')
];


// Reply Validation
export const replyValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Reply content is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Reply must be between 1 and 1000 characters'),
  
  body('parent_id')
    .optional()
    .isString()
    .withMessage('Parent ID must be a string')
];

export const updateReplyValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Reply content is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Reply must be between 1 and 1000 characters')
];